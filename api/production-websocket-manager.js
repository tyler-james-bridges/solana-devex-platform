/**
 * PRODUCTION WEBSOCKET MANAGER
 * Enterprise-grade WebSocket management with clustering, rate limiting, and scaling
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const cluster = require('cluster');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');

class ProductionWebSocketManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConnections: options.maxConnections || 10000,
      maxConnectionsPerIP: options.maxConnectionsPerIP || 100,
      heartbeatInterval: options.heartbeatInterval || 30000,
      compression: options.compression !== false,
      rateLimiting: options.rateLimiting !== false,
      clustering: options.clustering !== false,
      messageRateLimit: options.messageRateLimit || 10, // messages per second
      maxMessageSize: options.maxMessageSize || 1024 * 64, // 64KB
      ...options
    };
    
    this.connections = new Map();
    this.ipConnections = new Map();
    this.messageQueues = new Map();
    this.rateLimiters = new Map();
    this.subscriptions = new Map();
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      errors: 0,
      rateLimitHits: 0,
      startTime: Date.now()
    };
    
    // Redis for clustering
    if (this.options.clustering && process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.redisPub = new Redis(process.env.REDIS_URL);
      this.setupRedisAdapter();
    }
    
    // Performance monitoring
    setInterval(() => this.performanceCheck(), 60000);
    setInterval(() => this.cleanupConnections(), 300000); // 5 minutes
  }
  
  /**
   * Initialize WebSocket server with production optimizations
   */
  initialize(httpServer) {
    this.server = new WebSocket.Server({
      server: httpServer,
      clientTracking: false, // We'll handle this ourselves for better performance
      perMessageDeflate: this.options.compression ? {
        zlibDeflateOptions: {
          level: 6,
          windowBits: 13
        },
        threshold: 1024,
        concurrencyLimit: 10,
        serverMaxWindowBits: 15,
        serverMaxNoContextTakeover: false,
        serverNoContextTakeover: false,
        clientMaxWindowBits: 15,
        clientMaxNoContextTakeover: false,
        clientNoContextTakeover: false,
        memLevel: 7
      } : false,
      verifyClient: (info) => this.verifyClient(info)
    });
    
    this.server.on('connection', (ws, request) => this.handleConnection(ws, request));
    this.server.on('error', (error) => this.handleError(error));
    
    console.log(`[NETWORK] WebSocket server initialized with clustering: ${this.options.clustering}`);
  }
  
  /**
   * Verify client connection with rate limiting and capacity checks
   */
  verifyClient(info) {
    const ip = this.getClientIP(info.req);
    
    // Check global connection limit
    if (this.connections.size >= this.options.maxConnections) {
      console.warn(`Connection rejected: global limit reached (${this.options.maxConnections})`);
      return false;
    }
    
    // Check per-IP connection limit
    const ipConnectionCount = this.ipConnections.get(ip) || 0;
    if (ipConnectionCount >= this.options.maxConnectionsPerIP) {
      console.warn(`Connection rejected: IP limit reached for ${ip} (${this.options.maxConnectionsPerIP})`);
      return false;
    }
    
    // Check rate limiting
    if (this.options.rateLimiting && this.isRateLimited(ip)) {
      this.stats.rateLimitHits++;
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, request) {
    const ip = this.getClientIP(request);
    const connectionId = this.generateConnectionId();
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    // Connection metadata
    const connection = {
      id: connectionId,
      ws,
      ip,
      userAgent,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      bytesSent: 0,
      bytesReceived: 0,
      subscriptions: new Set(),
      isAlive: true,
      rateLimit: {
        tokens: this.options.messageRateLimit,
        lastRefill: Date.now()
      }
    };
    
    // Store connection
    this.connections.set(connectionId, connection);
    
    // Track IP connections
    this.ipConnections.set(ip, (this.ipConnections.get(ip) || 0) + 1);
    
    // Update stats
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    
    // Setup WebSocket event handlers
    ws.on('message', (data) => this.handleMessage(connectionId, data));
    ws.on('close', () => this.handleDisconnection(connectionId));
    ws.on('error', (error) => this.handleConnectionError(connectionId, error));
    ws.on('pong', () => this.handlePong(connectionId));
    
    // Send initial welcome message
    this.sendToConnection(connectionId, {
      type: 'welcome',
      connectionId,
      serverTime: Date.now(),
      features: {
        compression: this.options.compression,
        heartbeat: this.options.heartbeatInterval,
        rateLimit: this.options.messageRateLimit
      }
    });
    
    console.log(`[MOBILE] New WebSocket connection: ${connectionId} from ${ip} (${this.stats.activeConnections} active)`);
    
    this.emit('connection', { connectionId, ip, userAgent });
  }
  
  /**
   * Handle incoming WebSocket message with rate limiting and validation
   */
  handleMessage(connectionId, rawData) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    try {
      // Check message size
      if (rawData.length > this.options.maxMessageSize) {
        this.sendError(connectionId, 'Message too large');
        return;
      }
      
      // Rate limiting
      if (!this.checkRateLimit(connection)) {
        this.sendError(connectionId, 'Rate limit exceeded');
        this.stats.rateLimitHits++;
        return;
      }
      
      // Update connection stats
      connection.lastActivity = Date.now();
      connection.messageCount++;
      connection.bytesReceived += rawData.length;
      this.stats.messagesReceived++;
      this.stats.bytesReceived += rawData.length;
      
      // Parse message
      let message;
      try {
        message = JSON.parse(rawData);
      } catch (parseError) {
        this.sendError(connectionId, 'Invalid JSON');
        return;
      }
      
      // Validate message structure
      if (!message.type || typeof message.type !== 'string') {
        this.sendError(connectionId, 'Invalid message format');
        return;
      }
      
      // Handle different message types
      this.handleMessageByType(connectionId, message);
      
    } catch (error) {
      this.stats.errors++;
      console.error(`Error handling message from ${connectionId}:`, error);
      this.sendError(connectionId, 'Internal error');
    }
  }
  
  /**
   * Handle different message types
   */
  handleMessageByType(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(connectionId, message.channels || []);
        break;
        
      case 'unsubscribe':
        this.handleUnsubscription(connectionId, message.channels || []);
        break;
        
      case 'ping':
        this.sendToConnection(connectionId, {
          type: 'pong',
          timestamp: Date.now(),
          originalTimestamp: message.timestamp
        });
        break;
        
      case 'get_status':
        this.sendToConnection(connectionId, {
          type: 'status',
          connection: {
            id: connectionId,
            connectedAt: connection.connectedAt,
            messageCount: connection.messageCount,
            subscriptions: Array.from(connection.subscriptions)
          },
          server: this.getPublicStats()
        });
        break;
        
      default:
        this.sendError(connectionId, `Unknown message type: ${message.type}`);
    }
  }
  
  /**
   * Handle subscription to data channels
   */
  handleSubscription(connectionId, channels) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    const validChannels = ['network', 'protocols', 'tests', 'deployments', 'alerts'];
    const subscribedChannels = [];
    
    channels.forEach(channel => {
      if (validChannels.includes(channel)) {
        connection.subscriptions.add(channel);
        subscribedChannels.push(channel);
        
        // Add to global subscription tracking
        if (!this.subscriptions.has(channel)) {
          this.subscriptions.set(channel, new Set());
        }
        this.subscriptions.get(channel).add(connectionId);
      }
    });
    
    this.sendToConnection(connectionId, {
      type: 'subscribed',
      channels: subscribedChannels,
      timestamp: Date.now()
    });
    
    // Send initial data for subscribed channels
    this.sendInitialData(connectionId, subscribedChannels);
  }
  
  /**
   * Handle unsubscription from data channels
   */
  handleUnsubscription(connectionId, channels) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    channels.forEach(channel => {
      connection.subscriptions.delete(channel);
      
      // Remove from global subscription tracking
      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).delete(connectionId);
        if (this.subscriptions.get(channel).size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    });
    
    this.sendToConnection(connectionId, {
      type: 'unsubscribed',
      channels,
      timestamp: Date.now()
    });
  }
  
  /**
   * Send initial data for subscribed channels
   */
  async sendInitialData(connectionId, channels) {
    // This would integrate with the production monitor to get real data
    const initialData = {
      network: {
        status: 'healthy',
        latency: 150,
        slot: 12345678,
        tps: 2500
      },
      protocols: {
        jupiter: { status: 'healthy', latency: 120 },
        kamino: { status: 'healthy', latency: 95 }
      }
    };
    
    this.sendToConnection(connectionId, {
      type: 'initial_data',
      data: initialData,
      timestamp: Date.now()
    });
  }
  
  /**
   * Broadcast to all subscribers of a channel
   */
  broadcast(channel, data) {
    const subscribers = this.subscriptions.get(channel);
    if (!subscribers || subscribers.size === 0) return;
    
    const message = {
      type: 'update',
      channel,
      data,
      timestamp: Date.now()
    };
    
    const messageStr = JSON.stringify(message);
    const messageSize = Buffer.byteLength(messageStr);
    let sentCount = 0;
    
    subscribers.forEach(connectionId => {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    });
    
    this.stats.messagesSent += sentCount;
    this.stats.bytesSent += messageSize * sentCount;
    
    // If clustering is enabled, broadcast to other workers
    if (this.redis) {
      this.redisPub.publish('ws:broadcast', JSON.stringify({
        channel,
        data,
        workerId: process.pid
      }));
    }
    
    return sentCount;
  }
  
  /**
   * Send message to specific connection
   */
  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      const messageStr = JSON.stringify(message);
      connection.ws.send(messageStr);
      
      const messageSize = Buffer.byteLength(messageStr);
      connection.bytesSent += messageSize;
      
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error(`Failed to send message to ${connectionId}:`, error);
      return false;
    }
  }
  
  /**
   * Send error message to connection
   */
  sendError(connectionId, errorMessage) {
    this.sendToConnection(connectionId, {
      type: 'error',
      message: errorMessage,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle WebSocket disconnection
   */
  handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    // Remove from IP tracking
    const currentCount = this.ipConnections.get(connection.ip) || 1;
    if (currentCount <= 1) {
      this.ipConnections.delete(connection.ip);
    } else {
      this.ipConnections.set(connection.ip, currentCount - 1);
    }
    
    // Remove from subscriptions
    connection.subscriptions.forEach(channel => {
      if (this.subscriptions.has(channel)) {
        this.subscriptions.get(channel).delete(connectionId);
        if (this.subscriptions.get(channel).size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    });
    
    // Remove connection
    this.connections.delete(connectionId);
    this.stats.activeConnections--;
    
    console.log(`[OFFLINE] WebSocket disconnection: ${connectionId} (${this.stats.activeConnections} active)`);
    
    this.emit('disconnection', { connectionId, ip: connection.ip });
  }
  
  /**
   * Handle connection errors
   */
  handleConnectionError(connectionId, error) {
    this.stats.errors++;
    console.error(`WebSocket connection error for ${connectionId}:`, error.message);
    
    // Force disconnect if error is severe
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    }
  }
  
  /**
   * Handle pong response
   */
  handlePong(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = true;
      connection.lastActivity = Date.now();
    }
  }
  
  /**
   * Check rate limit for connection
   */
  checkRateLimit(connection) {
    const now = Date.now();
    const timePassed = now - connection.rateLimit.lastRefill;
    
    // Refill tokens based on time passed
    if (timePassed > 1000) { // 1 second
      const tokensToAdd = Math.floor(timePassed / 1000) * this.options.messageRateLimit;
      connection.rateLimit.tokens = Math.min(
        this.options.messageRateLimit,
        connection.rateLimit.tokens + tokensToAdd
      );
      connection.rateLimit.lastRefill = now;
    }
    
    // Check if we have tokens
    if (connection.rateLimit.tokens > 0) {
      connection.rateLimit.tokens--;
      return true;
    }
    
    return false;
  }
  
  /**
   * Check IP-based rate limiting
   */
  isRateLimited(ip) {
    const key = `rate_limit:${ip}`;
    const current = this.rateLimiters.get(key) || { count: 0, reset: Date.now() + 60000 };
    
    if (Date.now() > current.reset) {
      current.count = 0;
      current.reset = Date.now() + 60000;
    }
    
    if (current.count >= 60) { // 60 connections per minute
      this.rateLimiters.set(key, current);
      return true;
    }
    
    current.count++;
    this.rateLimiters.set(key, current);
    return false;
  }
  
  /**
   * Get client IP address
   */
  getClientIP(request) {
    return request.headers['x-forwarded-for']?.split(',')[0] ||
           request.headers['x-real-ip'] ||
           request.connection?.remoteAddress ||
           request.socket?.remoteAddress ||
           'unknown';
  }
  
  /**
   * Generate unique connection ID
   */
  generateConnectionId() {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Performance monitoring
   */
  performanceCheck() {
    const now = Date.now();
    let staleConnections = 0;
    
    // Check for stale connections
    this.connections.forEach((connection, connectionId) => {
      if (now - connection.lastActivity > this.options.heartbeatInterval * 3) {
        staleConnections++;
        
        // Send ping
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.isAlive = false;
          connection.ws.ping();
          
          // Remove if still not alive after ping
          setTimeout(() => {
            if (!connection.isAlive) {
              connection.ws.terminate();
            }
          }, 5000);
        }
      }
    });
    
    if (staleConnections > 0) {
      console.log(`[SEARCH] Performance check: ${staleConnections} stale connections found`);
    }
    
    // Log performance stats
    const memUsage = process.memoryUsage();
    console.log(`[INFO] Metrics WebSocket stats: ${this.stats.activeConnections} active, ${this.stats.messagesReceived} msgs received, ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used`);
  }
  
  /**
   * Cleanup disconnected connections
   */
  cleanupConnections() {
    let cleaned = 0;
    
    this.connections.forEach((connection, connectionId) => {
      if (connection.ws.readyState !== WebSocket.OPEN) {
        this.handleDisconnection(connectionId);
        cleaned++;
      }
    });
    
    // Clean rate limiters
    const now = Date.now();
    this.rateLimiters.forEach((limit, key) => {
      if (now > limit.reset) {
        this.rateLimiters.delete(key);
      }
    });
    
    if (cleaned > 0) {
      console.log(`[BROOM] Cleaned up ${cleaned} stale WebSocket connections`);
    }
  }
  
  /**
   * Setup Redis adapter for clustering
   */
  setupRedisAdapter() {
    if (!this.redis) return;
    
    // Subscribe to broadcast messages from other workers
    this.redis.subscribe('ws:broadcast', (err, count) => {
      if (err) {
        console.error('Redis subscription error:', err);
        return;
      }
      console.log(`[NETWORK] Subscribed to WebSocket broadcasts (${count} subscriptions)`);
    });
    
    this.redis.on('message', (channel, message) => {
      if (channel === 'ws:broadcast') {
        try {
          const broadcastData = JSON.parse(message);
          // Don't rebroadcast our own messages
          if (broadcastData.workerId !== process.pid) {
            this.broadcast(broadcastData.channel, broadcastData.data);
          }
        } catch (error) {
          console.error('Redis broadcast parsing error:', error);
        }
      }
    });
  }
  
  /**
   * Get public stats
   */
  getPublicStats() {
    return {
      activeConnections: this.stats.activeConnections,
      totalConnections: this.stats.totalConnections,
      messagesReceived: this.stats.messagesReceived,
      messagesSent: this.stats.messagesSent,
      uptime: Date.now() - this.stats.startTime,
      errorRate: this.stats.messagesReceived > 0 ? (this.stats.errors / this.stats.messagesReceived) * 100 : 0
    };
  }
  
  /**
   * Get detailed stats for monitoring
   */
  getStats() {
    return {
      ...this.stats,
      subscriptions: Object.fromEntries(
        Array.from(this.subscriptions.entries()).map(([channel, connections]) => [
          channel,
          connections.size
        ])
      ),
      connectionsByIP: Object.fromEntries(this.ipConnections.entries()),
      averageConnectionAge: this.getAverageConnectionAge(),
      memoryUsage: process.memoryUsage()
    };
  }
  
  /**
   * Get average connection age
   */
  getAverageConnectionAge() {
    if (this.connections.size === 0) return 0;
    
    const now = Date.now();
    let totalAge = 0;
    
    this.connections.forEach(connection => {
      totalAge += now - connection.connectedAt;
    });
    
    return Math.round(totalAge / this.connections.size);
  }
  
  /**
   * Graceful shutdown
   */
  async close() {
    console.log('[POWER] Closing WebSocket manager...');
    
    // Close all connections gracefully
    this.connections.forEach((connection, connectionId) => {
      this.sendToConnection(connectionId, {
        type: 'server_shutdown',
        message: 'Server is shutting down',
        timestamp: Date.now()
      });
      
      setTimeout(() => {
        connection.ws.close(1001, 'Server shutdown');
      }, 1000);
    });
    
    // Close WebSocket server
    if (this.server) {
      this.server.close();
    }
    
    // Close Redis connections
    if (this.redis) {
      this.redis.disconnect();
      this.redisPub.disconnect();
    }
    
    console.log('[SUCCESS] WebSocket manager closed');
  }
}

module.exports = ProductionWebSocketManager;