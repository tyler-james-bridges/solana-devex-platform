/**
 * PRODUCTION CACHE SYSTEM
 * Multi-tier caching with memory, Redis, and intelligent cache strategies
 */

const Redis = require('ioredis');
const LRU = require('lru-cache');

class ProductionCache {
  constructor(options = {}) {
    this.options = {
      // Memory cache settings (L1)
      maxSize: options.maxSize || 10000,
      ttl: options.ttl || 300000, // 5 minutes default
      checkPeriod: options.checkPeriod || 60000, // Check every minute
      
      // Redis cache settings (L2)
      redis: options.redis || process.env.REDIS_URL,
      redisPrefix: options.redisPrefix || 'cache:',
      redisMaxConnections: options.redisMaxConnections || 10,
      
      // Cache strategies
      enableL1: options.enableL1 !== false,
      enableL2: options.enableL2 !== false,
      compression: options.compression !== false,
      serialization: options.serialization || 'json',
      
      // Performance settings
      batchSize: options.batchSize || 100,
      maxKeyLength: options.maxKeyLength || 250,
      preloadKeys: options.preloadKeys || [],
      
      // Monitoring
      enableStats: options.enableStats !== false,
      warmupOnStart: options.warmupOnStart || false,
      
      ...options
    };
    
    // Initialize memory cache (L1)
    if (this.options.enableL1) {
      this.memoryCache = new LRU({
        max: this.options.maxSize,
        ttl: this.options.ttl,
        updateAgeOnGet: true,
        allowStale: false,
        ttlResolution: 1000, // 1 second resolution
        ttlAutopurge: true
      });
      
      // Track memory cache events
      this.memoryCache.on('evict', (key, value) => {
        this.stats.l1Evictions++;
        // Optionally promote to L2 cache
        if (this.options.enableL2 && this.shouldPromoteToL2(key, value)) {
          this.setL2(key, value, this.options.ttl * 2);
        }
      });
    }
    
    // Initialize Redis cache (L2)
    if (this.options.enableL2 && this.options.redis) {
      this.redisCache = new Redis(this.options.redis, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        compression: this.options.compression ? 'gzip' : null
      });
      
      this.redisCache.on('error', (error) => {
        console.error('Redis cache error:', error);
        this.stats.l2Errors++;
      });
      
      this.redisCache.on('connect', () => {
        console.log('[PACKAGE] Redis cache connected');
      });
    }
    
    // Performance and usage statistics
    this.stats = {
      l1Hits: 0,
      l1Misses: 0,
      l1Sets: 0,
      l1Deletes: 0,
      l1Evictions: 0,
      l1Errors: 0,
      
      l2Hits: 0,
      l2Misses: 0,
      l2Sets: 0,
      l2Deletes: 0,
      l2Errors: 0,
      
      totalRequests: 0,
      totalHits: 0,
      bytesStored: 0,
      
      startTime: Date.now(),
      lastCleanup: Date.now()
    };
    
    // Cache patterns and access tracking
    this.accessPatterns = new Map(); // Track key access patterns
    this.hotKeys = new Set(); // Frequently accessed keys
    this.coldKeys = new Set(); // Rarely accessed keys
    
    // Start monitoring and maintenance
    this.startMaintenance();
    
    // Preload common keys if specified
    if (this.options.warmupOnStart && this.options.preloadKeys.length > 0) {
      this.warmupCache();
    }
    
    console.log('[INIT] Production cache system initialized');
  }
  
  /**
   * Get value from cache (L1 → L2 hierarchy)
   */
  async get(key, options = {}) {
    const normalizedKey = this.normalizeKey(key);
    const startTime = Date.now();
    
    this.stats.totalRequests++;
    this.trackAccess(normalizedKey);
    
    try {
      // Try L1 cache first
      if (this.options.enableL1 && this.memoryCache) {
        const l1Value = this.memoryCache.get(normalizedKey);
        if (l1Value !== undefined) {
          this.stats.l1Hits++;
          this.stats.totalHits++;
          this.updateHotKeys(normalizedKey);
          return this.deserializeValue(l1Value);
        }
        this.stats.l1Misses++;
      }
      
      // Try L2 cache (Redis)
      if (this.options.enableL2 && this.redisCache) {
        const l2Value = await this.getL2(normalizedKey);
        if (l2Value !== undefined) {
          this.stats.l2Hits++;
          this.stats.totalHits++;
          
          // Promote to L1 if frequently accessed
          if (this.shouldPromoteToL1(normalizedKey)) {
            this.setL1(normalizedKey, l2Value, options.ttl || this.options.ttl);
          }
          
          return this.deserializeValue(l2Value);
        }
        this.stats.l2Misses++;
      }
      
      // Cache miss - mark as cold key
      this.coldKeys.add(normalizedKey);
      return undefined;
      
    } catch (error) {
      console.error('Cache get error:', error);
      return undefined;
    } finally {
      const duration = Date.now() - startTime;
      if (duration > 10) { // Log slow cache operations
        console.warn(`Slow cache get: ${normalizedKey} took ${duration}ms`);
      }
    }
  }
  
  /**
   * Set value in cache with intelligent distribution
   */
  async set(key, value, ttl = null) {
    const normalizedKey = this.normalizeKey(key);
    const serializedValue = this.serializeValue(value);
    const cacheTtl = ttl || this.options.ttl;
    
    try {
      const promises = [];
      
      // Set in L1 if enabled
      if (this.options.enableL1 && this.memoryCache) {
        this.setL1(normalizedKey, serializedValue, cacheTtl);
      }
      
      // Set in L2 if enabled and value is worth caching
      if (this.options.enableL2 && this.shouldCacheInL2(normalizedKey, value)) {
        promises.push(this.setL2(normalizedKey, serializedValue, cacheTtl));
      }
      
      // Wait for L2 operations
      if (promises.length > 0) {
        await Promise.all(promises);
      }
      
      // Update statistics
      this.updateCacheStats(serializedValue);
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }
  
  /**
   * Delete from all cache levels
   */
  async delete(key) {
    const normalizedKey = this.normalizeKey(key);
    
    try {
      const promises = [];
      
      // Delete from L1
      if (this.options.enableL1 && this.memoryCache) {
        this.memoryCache.delete(normalizedKey);
        this.stats.l1Deletes++;
      }
      
      // Delete from L2
      if (this.options.enableL2 && this.redisCache) {
        promises.push(this.redisCache.del(this.options.redisPrefix + normalizedKey));
        this.stats.l2Deletes++;
      }
      
      // Remove from tracking
      this.accessPatterns.delete(normalizedKey);
      this.hotKeys.delete(normalizedKey);
      this.coldKeys.delete(normalizedKey);
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }
  
  /**
   * Clear all caches
   */
  async clear() {
    try {
      const promises = [];
      
      // Clear L1
      if (this.options.enableL1 && this.memoryCache) {
        this.memoryCache.clear();
      }
      
      // Clear L2
      if (this.options.enableL2 && this.redisCache) {
        const pattern = this.options.redisPrefix + '*';
        promises.push(this.clearRedisPattern(pattern));
      }
      
      await Promise.all(promises);
      
      // Reset tracking
      this.accessPatterns.clear();
      this.hotKeys.clear();
      this.coldKeys.clear();
      
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }
  
  /**
   * Get multiple values efficiently
   */
  async mget(keys) {
    const results = new Map();
    const missingKeys = [];
    
    // Check L1 first for all keys
    if (this.options.enableL1 && this.memoryCache) {
      for (const key of keys) {
        const normalizedKey = this.normalizeKey(key);
        const value = this.memoryCache.get(normalizedKey);
        if (value !== undefined) {
          results.set(key, this.deserializeValue(value));
          this.stats.l1Hits++;
        } else {
          missingKeys.push(key);
          this.stats.l1Misses++;
        }
      }
    } else {
      missingKeys.push(...keys);
    }
    
    // Check L2 for remaining keys
    if (missingKeys.length > 0 && this.options.enableL2 && this.redisCache) {
      const redisKeys = missingKeys.map(key => this.options.redisPrefix + this.normalizeKey(key));
      
      try {
        const redisValues = await this.redisCache.mget(...redisKeys);
        
        missingKeys.forEach((originalKey, index) => {
          const value = redisValues[index];
          if (value !== null) {
            const deserializedValue = this.deserializeValue(value);
            results.set(originalKey, deserializedValue);
            this.stats.l2Hits++;
            
            // Optionally promote to L1
            const normalizedKey = this.normalizeKey(originalKey);
            if (this.shouldPromoteToL1(normalizedKey)) {
              this.setL1(normalizedKey, value, this.options.ttl);
            }
          } else {
            this.stats.l2Misses++;
          }
        });
      } catch (error) {
        console.error('Redis mget error:', error);
        this.stats.l2Errors++;
      }
    }
    
    this.stats.totalRequests += keys.length;
    this.stats.totalHits += results.size;
    
    return results;
  }
  
  /**
   * Set multiple values efficiently
   */
  async mset(pairs, ttl = null) {
    const cacheTtl = ttl || this.options.ttl;
    const promises = [];
    
    // Set in L1
    if (this.options.enableL1 && this.memoryCache) {
      for (const [key, value] of pairs.entries()) {
        const normalizedKey = this.normalizeKey(key);
        const serializedValue = this.serializeValue(value);
        this.setL1(normalizedKey, serializedValue, cacheTtl);
      }
    }
    
    // Batch set in L2
    if (this.options.enableL2 && this.redisCache) {
      const pipeline = this.redisCache.pipeline();
      
      for (const [key, value] of pairs.entries()) {
        const normalizedKey = this.normalizeKey(key);
        const redisKey = this.options.redisPrefix + normalizedKey;
        const serializedValue = this.serializeValue(value);
        
        if (this.shouldCacheInL2(normalizedKey, value)) {
          pipeline.setex(redisKey, Math.ceil(cacheTtl / 1000), serializedValue);
        }
      }
      
      promises.push(pipeline.exec());
    }
    
    try {
      await Promise.all(promises);
      this.stats.l1Sets += pairs.size;
      this.stats.l2Sets += pairs.size;
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }
  
  /**
   * Check if key exists in cache
   */
  async has(key) {
    const normalizedKey = this.normalizeKey(key);
    
    // Check L1
    if (this.options.enableL1 && this.memoryCache && this.memoryCache.has(normalizedKey)) {
      return true;
    }
    
    // Check L2
    if (this.options.enableL2 && this.redisCache) {
      try {
        const exists = await this.redisCache.exists(this.options.redisPrefix + normalizedKey);
        return exists === 1;
      } catch (error) {
        console.error('Cache has error:', error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Get cache statistics and health metrics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.totalHits / this.stats.totalRequests) * 100 : 0;
    
    const l1HitRate = (this.stats.l1Hits + this.stats.l1Misses) > 0 ? 
      (this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses)) * 100 : 0;
    
    const l2HitRate = (this.stats.l2Hits + this.stats.l2Misses) > 0 ? 
      (this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses)) * 100 : 0;
    
    return {
      ...this.stats,
      uptime,
      hitRate: parseFloat(hitRate.toFixed(2)),
      l1HitRate: parseFloat(l1HitRate.toFixed(2)),
      l2HitRate: parseFloat(l2HitRate.toFixed(2)),
      
      l1Size: this.memoryCache ? this.memoryCache.size : 0,
      l1MaxSize: this.options.maxSize,
      
      hotKeysCount: this.hotKeys.size,
      coldKeysCount: this.coldKeys.size,
      trackedKeysCount: this.accessPatterns.size,
      
      memoryUsage: process.memoryUsage(),
      configuration: {
        enableL1: this.options.enableL1,
        enableL2: this.options.enableL2,
        compression: this.options.compression,
        maxSize: this.options.maxSize,
        defaultTTL: this.options.ttl
      }
    };
  }
  
  /**
   * Health check for monitoring
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      checks: {},
      timestamp: new Date().toISOString()
    };
    
    // Check L1 cache
    if (this.options.enableL1) {
      try {
        const testKey = '__health_check_l1__';
        const testValue = Date.now();
        
        this.memoryCache.set(testKey, testValue);
        const retrieved = this.memoryCache.get(testKey);
        
        health.checks.l1 = {
          status: retrieved === testValue ? 'healthy' : 'degraded',
          latency: 0 // Memory cache is synchronous
        };
        
        this.memoryCache.delete(testKey);
      } catch (error) {
        health.checks.l1 = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'degraded';
      }
    }
    
    // Check L2 cache
    if (this.options.enableL2 && this.redisCache) {
      try {
        const testKey = '__health_check_l2__';
        const testValue = Date.now().toString();
        const start = Date.now();
        
        await this.redisCache.set(testKey, testValue, 'EX', 60);
        const retrieved = await this.redisCache.get(testKey);
        const latency = Date.now() - start;
        
        health.checks.l2 = {
          status: retrieved === testValue ? 'healthy' : 'degraded',
          latency
        };
        
        await this.redisCache.del(testKey);
        
        if (latency > 100) {
          health.status = 'degraded';
        }
      } catch (error) {
        health.checks.l2 = {
          status: 'unhealthy',
          error: error.message
        };
        health.status = 'unhealthy';
      }
    }
    
    return health;
  }
  
  /**
   * L1 cache operations
   */
  setL1(key, value, ttl) {
    if (this.memoryCache) {
      this.memoryCache.set(key, value, { ttl });
      this.stats.l1Sets++;
    }
  }
  
  /**
   * L2 cache operations
   */
  async setL2(key, value, ttl) {
    if (this.redisCache) {
      const redisKey = this.options.redisPrefix + key;
      await this.redisCache.setex(redisKey, Math.ceil(ttl / 1000), value);
      this.stats.l2Sets++;
    }
  }
  
  async getL2(key) {
    if (this.redisCache) {
      const redisKey = this.options.redisPrefix + key;
      return await this.redisCache.get(redisKey);
    }
    return undefined;
  }
  
  /**
   * Cache promotion and demotion logic
   */
  shouldPromoteToL1(key) {
    const pattern = this.accessPatterns.get(key);
    if (!pattern) return false;
    
    // Promote if accessed frequently (more than 3 times in last minute)
    const recentAccesses = pattern.accesses.filter(time => Date.now() - time < 60000);
    return recentAccesses.length > 3;
  }
  
  shouldPromoteToL2(key, value) {
    // Promote large or frequently accessed values to L2
    const valueSize = this.getValueSize(value);
    const isFrequent = this.hotKeys.has(key);
    
    return valueSize > 1024 || isFrequent; // > 1KB or hot key
  }
  
  shouldCacheInL2(key, value) {
    const valueSize = this.getValueSize(value);
    
    // Don't cache very large values in L2
    if (valueSize > 1024 * 1024) return false; // > 1MB
    
    // Don't cache temporary or cold keys
    if (this.coldKeys.has(key) && valueSize < 100) return false;
    
    return true;
  }
  
  /**
   * Key access tracking and pattern analysis
   */
  trackAccess(key) {
    if (!this.accessPatterns.has(key)) {
      this.accessPatterns.set(key, {
        accesses: [],
        lastAccess: Date.now(),
        totalAccesses: 0
      });
    }
    
    const pattern = this.accessPatterns.get(key);
    pattern.accesses.push(Date.now());
    pattern.lastAccess = Date.now();
    pattern.totalAccesses++;
    
    // Keep only recent accesses (last hour)
    const oneHourAgo = Date.now() - 3600000;
    pattern.accesses = pattern.accesses.filter(time => time > oneHourAgo);
    
    // Update hot/cold classification
    this.updateKeyClassification(key, pattern);
  }
  
  updateKeyClassification(key, pattern) {
    const recentAccesses = pattern.accesses.length;
    
    if (recentAccesses > 10) {
      this.hotKeys.add(key);
      this.coldKeys.delete(key);
    } else if (recentAccesses < 2 && Date.now() - pattern.lastAccess > 600000) {
      this.coldKeys.add(key);
      this.hotKeys.delete(key);
    }
  }
  
  updateHotKeys(key) {
    this.hotKeys.add(key);
    this.coldKeys.delete(key);
  }
  
  /**
   * Serialization and normalization
   */
  normalizeKey(key) {
    if (typeof key !== 'string') {
      key = String(key);
    }
    
    if (key.length > this.options.maxKeyLength) {
      // Hash long keys
      const crypto = require('crypto');
      return crypto.createHash('sha1').update(key).digest('hex');
    }
    
    return key;
  }
  
  serializeValue(value) {
    if (this.options.serialization === 'json') {
      return JSON.stringify(value);
    }
    return value;
  }
  
  deserializeValue(value) {
    if (this.options.serialization === 'json' && typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value; // Return as-is if parsing fails
      }
    }
    return value;
  }
  
  getValueSize(value) {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    }
    return JSON.stringify(value).length;
  }
  
  updateCacheStats(value) {
    this.stats.bytesStored += this.getValueSize(value);
  }
  
  /**
   * Cache warmup
   */
  async warmupCache() {
    console.log('[CRITICAL] Starting cache warmup...');
    
    for (const key of this.options.preloadKeys) {
      try {
        // This would typically fetch from your data source
        // For now, we'll just mark these keys as hot
        this.hotKeys.add(this.normalizeKey(key));
      } catch (error) {
        console.warn(`Warmup failed for key ${key}:`, error.message);
      }
    }
    
    console.log(`[SUCCESS] Cache warmup completed for ${this.options.preloadKeys.length} keys`);
  }
  
  /**
   * Maintenance tasks
   */
  startMaintenance() {
    // Cleanup expired patterns every 5 minutes
    setInterval(() => {
      this.cleanupAccessPatterns();
    }, 5 * 60 * 1000);
    
    // Update hot/cold keys every minute
    setInterval(() => {
      this.updateKeyClassifications();
    }, 60 * 1000);
    
    // Log cache statistics every 10 minutes
    setInterval(() => {
      if (this.options.enableStats) {
        this.logCacheStats();
      }
    }, 10 * 60 * 1000);
    
    console.log('[CONFIG] Cache maintenance tasks started');
  }
  
  cleanupAccessPatterns() {
    const oneHourAgo = Date.now() - 3600000;
    let cleaned = 0;
    
    this.accessPatterns.forEach((pattern, key) => {
      if (pattern.lastAccess < oneHourAgo) {
        this.accessPatterns.delete(key);
        this.hotKeys.delete(key);
        this.coldKeys.delete(key);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`[BROOM] Cleaned up ${cleaned} old access patterns`);
    }
    
    this.stats.lastCleanup = Date.now();
  }
  
  updateKeyClassifications() {
    this.accessPatterns.forEach((pattern, key) => {
      this.updateKeyClassification(key, pattern);
    });
  }
  
  logCacheStats() {
    const stats = this.getStats();
    console.log(`[INFO] Metrics Cache Stats: ${stats.hitRate}% hit rate, L1: ${stats.l1Size}/${stats.l1MaxSize}, Hot: ${stats.hotKeysCount}, Cold: ${stats.coldKeysCount}`);
  }
  
  async clearRedisPattern(pattern) {
    let cursor = '0';
    const promises = [];
    
    do {
      const result = await this.redisCache.scan(cursor, 'MATCH', pattern, 'COUNT', this.options.batchSize);
      cursor = result[0];
      const keys = result[1];
      
      if (keys.length > 0) {
        promises.push(this.redisCache.del(...keys));
      }
    } while (cursor !== '0');
    
    await Promise.all(promises);
  }
  
  /**
   * Graceful shutdown
   */
  async close() {
    console.log('[POWER] Closing cache system...');
    
    if (this.memoryCache) {
      this.memoryCache.clear();
    }
    
    if (this.redisCache) {
      this.redisCache.disconnect();
    }
    
    console.log('[SUCCESS] Cache system closed');
  }
}

module.exports = ProductionCache;