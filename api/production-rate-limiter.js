/**
 * PRODUCTION RATE LIMITER
 * Advanced rate limiting with Redis backend, sliding windows, and burst protection
 */

const Redis = require('ioredis');

class ProductionRateLimiter {
  constructor(options = {}) {
    this.options = {
      redis: options.redis,
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      keyPrefix: options.keyPrefix || 'rl:',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      
      // Default limits for different tiers
      limits: {
        default: 1000,      // 1000 requests per 15 minutes
        expensive: 10,      // 10 expensive operations per 15 minutes
        burst: 100,         // 100 requests in burst window (1 minute)
        concurrent: 50,     // Max 50 concurrent requests per IP
        ...options.limits
      },
      
      // Burst protection settings
      burstWindowMs: options.burstWindowMs || 60 * 1000, // 1 minute
      
      // Advanced features
      slidingWindow: options.slidingWindow !== false,
      dynamicLimits: options.dynamicLimits || false,
      whitelistIPs: options.whitelistIPs || [],
      blacklistIPs: options.blacklistIPs || [],
      
      // Performance settings
      batchCleanup: options.batchCleanup !== false,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      
      ...options
    };
    
    // Initialize Redis
    this.redis = new Redis(this.options.redis || process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Performance tracking
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      burstBlocked: 0,
      concurrentBlocked: 0,
      whitelistHits: 0,
      blacklistHits: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    // Concurrent request tracking
    this.concurrentRequests = new Map();
    
    // Initialize Lua scripts for atomic operations
    this.initializeLuaScripts();
    
    // Start cleanup process
    if (this.options.batchCleanup) {
      this.startCleanupProcess();
    }
    
    console.log('[SHIELD]️ Production rate limiter initialized');
  }
  
  /**
   * Initialize Lua scripts for atomic Redis operations
   */
  initializeLuaScripts() {
    // Sliding window rate limiter script
    this.slidingWindowScript = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local identifier = ARGV[4]
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
      
      -- Count current requests in window
      local current = redis.call('ZCARD', key)
      
      if current < limit then
        -- Add new request
        redis.call('ZADD', key, now, identifier)
        redis.call('EXPIRE', key, math.ceil(window / 1000))
        return {1, limit - current - 1}
      else
        return {0, 0, redis.call('ZRANGE', key, -1, -1, 'WITHSCORES')}
      end
    `;
    
    // Burst protection script
    this.burstProtectionScript = `
      local key = KEYS[1]
      local burstWindow = tonumber(ARGV[1])
      local burstLimit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local identifier = ARGV[4]
      
      -- Remove expired burst entries
      redis.call('ZREMRANGEBYSCORE', key, 0, now - burstWindow)
      
      -- Count burst requests
      local burstCount = redis.call('ZCARD', key)
      
      if burstCount < burstLimit then
        redis.call('ZADD', key, now, identifier)
        redis.call('EXPIRE', key, math.ceil(burstWindow / 1000))
        return {1, burstLimit - burstCount - 1}
      else
        return {0, 0}
      end
    `;
    
    // Concurrent request tracking script
    this.concurrentScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local ttl = tonumber(ARGV[2])
      local identifier = ARGV[3]
      
      local current = redis.call('INCR', key)
      redis.call('EXPIRE', key, ttl)
      
      if current <= limit then
        return {1, limit - current}
      else
        redis.call('DECR', key)
        return {0, 0}
      end
    `;
  }
  
  /**
   * Create rate limiter middleware for specific limit type
   */
  createLimiter(limitType = 'default') {
    return async (req, res, next) => {
      try {
        const result = await this.checkLimit(req, limitType);
        
        if (result.allowed) {
          // Add rate limit headers
          res.set({
            'X-RateLimit-Limit': result.limit,
            'X-RateLimit-Remaining': result.remaining,
            'X-RateLimit-Reset': result.resetTime,
            'X-RateLimit-RetryAfter': result.retryAfter || 0
          });
          
          // Track concurrent request
          const concurrentKey = this.getConcurrentKey(req);
          this.concurrentRequests.set(concurrentKey, Date.now());
          
          // Cleanup on response finish
          res.on('finish', () => {
            this.concurrentRequests.delete(concurrentKey);
            this.releaseConcurrentSlot(req);
          });
          
          next();
        } else {
          this.handleRateLimit(req, res, result);
        }
      } catch (error) {
        console.error('Rate limiter error:', error);
        this.stats.errors++;
        next(); // Allow request on error
      }
    };
  }
  
  /**
   * Check rate limit for request
   */
  async checkLimit(req, limitType) {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const now = Date.now();
    const identifier = `${ip}:${userAgent.substring(0, 50)}:${now}:${Math.random()}`;
    
    this.stats.totalRequests++;
    
    // Check whitelist
    if (this.options.whitelistIPs.includes(ip)) {
      this.stats.whitelistHits++;
      return {
        allowed: true,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER,
        resetTime: 0,
        reason: 'whitelisted'
      };
    }
    
    // Check blacklist
    if (this.options.blacklistIPs.includes(ip)) {
      this.stats.blacklistHits++;
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        resetTime: now + this.options.windowMs,
        reason: 'blacklisted',
        retryAfter: Math.ceil(this.options.windowMs / 1000)
      };
    }
    
    const limit = this.options.limits[limitType] || this.options.limits.default;
    
    // Check different limits in order of strictness
    
    // 1. Concurrent requests limit
    const concurrentResult = await this.checkConcurrentLimit(req);
    if (!concurrentResult.allowed) {
      this.stats.concurrentBlocked++;
      return concurrentResult;
    }
    
    // 2. Burst protection
    if (limitType !== 'burst') {
      const burstResult = await this.checkBurstLimit(req, identifier);
      if (!burstResult.allowed) {
        this.stats.burstBlocked++;
        return burstResult;
      }
    }
    
    // 3. Main rate limit
    const mainResult = await this.checkMainLimit(req, limitType, limit, identifier);
    
    if (mainResult.allowed) {
      this.stats.allowedRequests++;
    } else {
      this.stats.blockedRequests++;
    }
    
    return mainResult;
  }
  
  /**
   * Check concurrent requests limit
   */
  async checkConcurrentLimit(req) {
    const ip = this.getClientIP(req);
    const key = `${this.options.keyPrefix}concurrent:${ip}`;
    const limit = this.options.limits.concurrent;
    
    try {
      const result = await this.redis.eval(
        this.concurrentScript,
        1,
        key,
        limit,
        60, // TTL in seconds
        Date.now()
      );
      
      return {
        allowed: result[0] === 1,
        limit,
        remaining: result[1],
        resetTime: Date.now() + 60000,
        reason: result[0] === 1 ? 'allowed' : 'concurrent_limit'
      };
    } catch (error) {
      console.error('Concurrent limit check failed:', error);
      return { allowed: true, limit, remaining: limit };
    }
  }
  
  /**
   * Check burst protection limit
   */
  async checkBurstLimit(req, identifier) {
    const ip = this.getClientIP(req);
    const key = `${this.options.keyPrefix}burst:${ip}`;
    const limit = this.options.limits.burst;
    
    try {
      const result = await this.redis.eval(
        this.burstProtectionScript,
        1,
        key,
        this.options.burstWindowMs,
        limit,
        Date.now(),
        identifier
      );
      
      return {
        allowed: result[0] === 1,
        limit,
        remaining: result[1],
        resetTime: Date.now() + this.options.burstWindowMs,
        reason: result[0] === 1 ? 'allowed' : 'burst_limit',
        retryAfter: result[0] === 1 ? 0 : Math.ceil(this.options.burstWindowMs / 1000)
      };
    } catch (error) {
      console.error('Burst limit check failed:', error);
      return { allowed: true, limit, remaining: limit };
    }
  }
  
  /**
   * Check main rate limit with sliding window
   */
  async checkMainLimit(req, limitType, limit, identifier) {
    const ip = this.getClientIP(req);
    const key = `${this.options.keyPrefix}${limitType}:${ip}`;
    
    try {
      if (this.options.slidingWindow) {
        const result = await this.redis.eval(
          this.slidingWindowScript,
          1,
          key,
          this.options.windowMs,
          limit,
          Date.now(),
          identifier
        );
        
        const resetTime = result[2] && result[2][1] ? 
          parseInt(result[2][1]) + this.options.windowMs : 
          Date.now() + this.options.windowMs;
        
        return {
          allowed: result[0] === 1,
          limit,
          remaining: result[1],
          resetTime,
          reason: result[0] === 1 ? 'allowed' : 'rate_limit',
          retryAfter: result[0] === 1 ? 0 : Math.ceil((resetTime - Date.now()) / 1000)
        };
      } else {
        // Simple counter-based limiting
        return await this.checkSimpleLimit(key, limit);
      }
    } catch (error) {
      console.error('Main limit check failed:', error);
      return { allowed: true, limit, remaining: limit };
    }
  }
  
  /**
   * Simple counter-based rate limiting
   */
  async checkSimpleLimit(key, limit) {
    const windowStart = Math.floor(Date.now() / this.options.windowMs) * this.options.windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    const current = await this.redis.incr(windowKey);
    
    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(this.options.windowMs / 1000));
    }
    
    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetTime: windowStart + this.options.windowMs,
      reason: current <= limit ? 'allowed' : 'rate_limit',
      retryAfter: current <= limit ? 0 : Math.ceil(this.options.windowMs / 1000)
    };
  }
  
  /**
   * Release concurrent request slot
   */
  async releaseConcurrentSlot(req) {
    const ip = this.getClientIP(req);
    const key = `${this.options.keyPrefix}concurrent:${ip}`;
    
    try {
      await this.redis.decr(key);
    } catch (error) {
      console.error('Failed to release concurrent slot:', error);
    }
  }
  
  /**
   * Handle rate limit exceeded
   */
  handleRateLimit(req, res, result) {
    const retryAfter = result.retryAfter || Math.ceil(this.options.windowMs / 1000);
    
    res.status(429).set({
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime,
      'Retry-After': retryAfter
    }).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Reason: ${result.reason}`,
      retryAfter,
      limit: result.limit,
      resetTime: result.resetTime
    });
  }
  
  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }
  
  /**
   * Get concurrent request key
   */
  getConcurrentKey(req) {
    const ip = this.getClientIP(req);
    return `concurrent:${ip}:${Date.now()}`;
  }
  
  /**
   * Dynamic limit adjustment based on system load
   */
  async adjustLimits(systemLoad) {
    if (!this.options.dynamicLimits) return;
    
    const loadFactor = Math.max(0.1, Math.min(2.0, 1 - (systemLoad - 0.7) / 0.3));
    
    // Adjust limits based on load
    Object.keys(this.options.limits).forEach(limitType => {
      const originalLimit = this.options.limits[limitType];
      const adjustedLimit = Math.floor(originalLimit * loadFactor);
      this.options.limits[limitType] = Math.max(1, adjustedLimit);
    });
    
    console.log(`[SYNC] Rate limits adjusted by factor ${loadFactor.toFixed(2)} due to system load: ${(systemLoad * 100).toFixed(1)}%`);
  }
  
  /**
   * Add IP to whitelist
   */
  async addToWhitelist(ip) {
    if (!this.options.whitelistIPs.includes(ip)) {
      this.options.whitelistIPs.push(ip);
      console.log(`[SUCCESS] Added ${ip} to whitelist`);
    }
  }
  
  /**
   * Add IP to blacklist
   */
  async addToBlacklist(ip, reason = 'Manual') {
    if (!this.options.blacklistIPs.includes(ip)) {
      this.options.blacklistIPs.push(ip);
      
      // Store blacklist reason in Redis
      await this.redis.setex(`${this.options.keyPrefix}blacklist:${ip}`, 86400, reason);
      
      console.log(`[BLOCKED] Added ${ip} to blacklist: ${reason}`);
    }
  }
  
  /**
   * Remove IP from blacklist
   */
  async removeFromBlacklist(ip) {
    const index = this.options.blacklistIPs.indexOf(ip);
    if (index !== -1) {
      this.options.blacklistIPs.splice(index, 1);
      await this.redis.del(`${this.options.keyPrefix}blacklist:${ip}`);
      console.log(`[SUCCESS] Removed ${ip} from blacklist`);
    }
  }
  
  /**
   * Get rate limit statistics for monitoring
   */
  getStatistics() {
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      uptime,
      allowedRate: this.stats.totalRequests > 0 ? 
        (this.stats.allowedRequests / this.stats.totalRequests) * 100 : 0,
      blockedRate: this.stats.totalRequests > 0 ? 
        (this.stats.blockedRequests / this.stats.totalRequests) * 100 : 0,
      limits: { ...this.options.limits },
      whitelistSize: this.options.whitelistIPs.length,
      blacklistSize: this.options.blacklistIPs.length,
      concurrentConnections: this.concurrentRequests.size
    };
  }
  
  /**
   * Start cleanup process for expired keys
   */
  startCleanupProcess() {
    setInterval(async () => {
      try {
        await this.cleanupExpiredKeys();
      } catch (error) {
        console.error('Cleanup process error:', error);
      }
    }, this.options.cleanupInterval);
    
    console.log('[BROOM] Rate limiter cleanup process started');
  }
  
  /**
   * Cleanup expired keys and optimize Redis memory
   */
  async cleanupExpiredKeys() {
    const startTime = Date.now();
    let cleanedKeys = 0;
    
    try {
      // Get all rate limiter keys
      const pattern = `${this.options.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        // Check TTL and remove expired keys
        const pipeline = this.redis.pipeline();
        
        for (const key of keys) {
          pipeline.ttl(key);
        }
        
        const ttlResults = await pipeline.exec();
        
        const expiredKeys = [];
        ttlResults.forEach(([error, ttl], index) => {
          if (!error && ttl === -1) { // Key exists but has no TTL
            expiredKeys.push(keys[index]);
          }
        });
        
        if (expiredKeys.length > 0) {
          await this.redis.del(...expiredKeys);
          cleanedKeys = expiredKeys.length;
        }
      }
      
      // Cleanup old concurrent request tracking
      const now = Date.now();
      this.concurrentRequests.forEach((timestamp, key) => {
        if (now - timestamp > 60000) { // 1 minute old
          this.concurrentRequests.delete(key);
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (cleanedKeys > 0) {
        console.log(`[BROOM] Cleaned up ${cleanedKeys} expired rate limit keys in ${duration}ms`);
      }
      
    } catch (error) {
      console.error('Key cleanup failed:', error);
    }
  }
  
  /**
   * Reset all rate limits for an IP
   */
  async resetLimitsForIP(ip) {
    const pattern = `${this.options.keyPrefix}*:${ip}*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`[SYNC] Reset rate limits for IP: ${ip} (${keys.length} keys)`);
    }
  }
  
  /**
   * Get current usage for an IP
   */
  async getCurrentUsage(ip) {
    const usage = {};
    
    for (const [limitType, limit] of Object.entries(this.options.limits)) {
      const key = `${this.options.keyPrefix}${limitType}:${ip}`;
      
      try {
        if (this.options.slidingWindow) {
          const count = await this.redis.zcard(key);
          usage[limitType] = {
            current: count,
            limit,
            remaining: Math.max(0, limit - count)
          };
        } else {
          const windowStart = Math.floor(Date.now() / this.options.windowMs) * this.options.windowMs;
          const windowKey = `${key}:${windowStart}`;
          const current = await this.redis.get(windowKey) || 0;
          
          usage[limitType] = {
            current: parseInt(current),
            limit,
            remaining: Math.max(0, limit - current)
          };
        }
      } catch (error) {
        usage[limitType] = {
          current: 0,
          limit,
          remaining: limit,
          error: error.message
        };
      }
    }
    
    return usage;
  }
  
  /**
   * Graceful shutdown
   */
  async close() {
    console.log('[POWER] Closing rate limiter...');
    
    // Save current stats to Redis for persistence
    await this.redis.setex(
      `${this.options.keyPrefix}stats`,
      86400, // 24 hours
      JSON.stringify(this.stats)
    );
    
    this.redis.disconnect();
    console.log('[SUCCESS] Rate limiter closed');
  }
}

module.exports = ProductionRateLimiter;