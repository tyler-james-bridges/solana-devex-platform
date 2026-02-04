/**
 * PRODUCTION DATABASE HANDLER
 * Optimized for high-frequency monitoring data with batch operations and connection pooling
 */

const { Pool } = require('pg');
const Redis = require('ioredis');

class ProductionDatabase {
  constructor(options = {}) {
    this.options = {
      // PostgreSQL connection pool settings
      maxConnections: options.maxConnections || 100,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 30000,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 30000,
      retries: options.retries || 3,
      
      // Batch processing settings
      batchSize: options.batchSize || 1000,
      batchTimeout: options.batchTimeout || 5000, // 5 seconds
      maxBatchSize: options.maxBatchSize || 10000,
      
      // Data retention settings
      retentionDays: options.retentionDays || 30,
      archiveAfterDays: options.archiveAfterDays || 7,
      
      // Performance settings
      indexCreation: options.indexCreation !== false,
      compression: options.compression !== false,
      partitioning: options.partitioning !== false,
      
      ...options
    };
    
    // Initialize connection pools
    this.initializePools();
    
    // Initialize Redis for caching
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    // Batch queues for high-frequency inserts
    this.batchQueues = {
      metrics: [],
      events: [],
      logs: [],
      tests: []
    };
    
    // Performance tracking
    this.stats = {
      totalQueries: 0,
      totalInserts: 0,
      totalUpdates: 0,
      batchesProcessed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      averageQueryTime: 0,
      queryTimes: [],
      startTime: Date.now()
    };
    
    // Start batch processing
    this.startBatchProcessing();
    
    // Start maintenance tasks
    this.startMaintenanceTasks();
    
    // Initialize database schema
    this.initializeSchema();
  }
  
  /**
   * Initialize PostgreSQL connection pools
   */
  initializePools() {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'solana_devex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: this.options.maxConnections,
      idleTimeoutMillis: this.options.idleTimeoutMillis,
      connectionTimeoutMillis: this.options.connectionTimeoutMillis,
      acquireTimeoutMillis: this.options.acquireTimeoutMillis,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
    
    // Main read/write pool
    this.pool = new Pool(dbConfig);
    
    // Read-only pool for analytics queries
    this.readPool = new Pool({
      ...dbConfig,
      max: Math.floor(this.options.maxConnections * 0.3), // 30% for read queries
    });
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      this.stats.errors++;
    });
    
    this.readPool.on('error', (err) => {
      console.error('Read pool error:', err);
      this.stats.errors++;
    });
    
    console.log('[INFO] Metrics Database pools initialized');
  }
  
  /**
   * Initialize database schema with optimizations
   */
  async initializeSchema() {
    try {
      await this.executeQuery(`
        -- Metrics table with partitioning by date
        CREATE TABLE IF NOT EXISTS metrics (
          id BIGSERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          metric_name VARCHAR(100) NOT NULL,
          protocol VARCHAR(50),
          value NUMERIC NOT NULL,
          tags JSONB,
          metadata JSONB,
          date_partition DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
        ) PARTITION BY RANGE (date_partition);
        
        -- Test results table
        CREATE TABLE IF NOT EXISTS test_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          test_id VARCHAR(100) NOT NULL,
          protocol VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          duration_ms INTEGER,
          latency_ms INTEGER,
          error_message TEXT,
          details JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Events table for system events
        CREATE TABLE IF NOT EXISTS events (
          id BIGSERIAL PRIMARY KEY,
          event_type VARCHAR(50) NOT NULL,
          source VARCHAR(50) NOT NULL,
          data JSONB NOT NULL,
          severity VARCHAR(20) DEFAULT 'info',
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          processed_at TIMESTAMPTZ
        );
        
        -- Alert logs
        CREATE TABLE IF NOT EXISTS alert_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          alert_type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          severity VARCHAR(20) NOT NULL,
          data JSONB,
          resolved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        -- Performance logs
        CREATE TABLE IF NOT EXISTS performance_logs (
          id BIGSERIAL PRIMARY KEY,
          component VARCHAR(50) NOT NULL,
          operation VARCHAR(50) NOT NULL,
          duration_ms INTEGER NOT NULL,
          memory_mb INTEGER,
          cpu_percent NUMERIC(5,2),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      
      if (this.options.indexCreation) {
        await this.createOptimizedIndexes();
      }
      
      if (this.options.partitioning) {
        await this.createPartitions();
      }
      
      console.log('[SUCCESS] Database schema initialized');
    } catch (error) {
      console.error('❌ Schema initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Create optimized indexes for performance
   */
  async createOptimizedIndexes() {
    const indexes = [
      // Metrics indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_timestamp ON metrics (timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_name_timestamp ON metrics (metric_name, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_protocol_timestamp ON metrics (protocol, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_tags ON metrics USING GIN (tags)',
      
      // Test results indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_created_at ON test_results (created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_protocol ON test_results (protocol, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_status ON test_results (status, created_at DESC)',
      
      // Events indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp ON events (timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type ON events (event_type, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_source ON events (source, timestamp DESC)',
      
      // Alert logs indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_logs_created_at ON alert_logs (created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_logs_severity ON alert_logs (severity, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_logs_unresolved ON alert_logs (created_at) WHERE resolved_at IS NULL'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await this.executeQuery(indexSQL);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Index creation warning:', error.message);
        }
      }
    }
    
    console.log('[INFO] Analytics Database indexes created');
  }
  
  /**
   * Create partitions for time-series data
   */
  async createPartitions() {
    const today = new Date();
    const partitions = [];
    
    // Create partitions for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const partitionName = `metrics_${dateStr.replace(/-/g, '_')}`;
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      partitions.push(`
        CREATE TABLE IF NOT EXISTS ${partitionName} 
        PARTITION OF metrics 
        FOR VALUES FROM ('${dateStr}') TO ('${nextDateStr}')
      `);
    }
    
    for (const partitionSQL of partitions) {
      try {
        await this.executeQuery(partitionSQL);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn('Partition creation warning:', error.message);
        }
      }
    }
    
    console.log('[FOLDER] Database partitions created');
  }
  
  /**
   * Execute query with performance tracking and retry logic
   */
  async executeQuery(query, params = [], useReadPool = false, retries = null) {
    const startTime = Date.now();
    const pool = useReadPool ? this.readPool : this.pool;
    const maxRetries = retries ?? this.options.retries;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = await pool.connect();
        
        try {
          const result = await client.query(query, params);
          
          // Update performance stats
          const duration = Date.now() - startTime;
          this.updateQueryStats(duration);
          
          return result;
        } finally {
          client.release();
        }
      } catch (error) {
        this.stats.errors++;
        
        if (attempt === maxRetries) {
          console.error(`Query failed after ${maxRetries + 1} attempts:`, {
            error: error.message,
            query: query.substring(0, 100) + '...',
            params: params?.slice(0, 3)
          });
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`Query attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      }
    }
  }
  
  /**
   * Add metrics to batch queue for bulk insert
   */
  addMetrics(metrics) {
    if (!Array.isArray(metrics)) {
      metrics = [metrics];
    }
    
    this.batchQueues.metrics.push(...metrics);
    
    // Force flush if batch is too large
    if (this.batchQueues.metrics.length >= this.options.maxBatchSize) {
      this.flushMetricsBatch();
    }
  }
  
  /**
   * Add test result to database
   */
  async addTestResult(testResult) {
    const {
      testId,
      protocol,
      status,
      duration,
      latency,
      error,
      details = {}
    } = testResult;
    
    try {
      const result = await this.executeQuery(`
        INSERT INTO test_results (
          test_id, protocol, status, duration_ms, 
          latency_ms, error_message, details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
      `, [
        testId,
        protocol,
        status,
        duration,
        latency,
        error,
        JSON.stringify(details)
      ]);
      
      this.stats.totalInserts++;
      return result.rows[0];
    } catch (error) {
      console.error('Failed to add test result:', error);
      throw error;
    }
  }
  
  /**
   * Get test results with filtering and pagination
   */
  async getTestResults(filters = {}) {
    const {
      page = 1,
      limit = 20,
      protocol,
      status,
      since,
      includeDetails = false
    } = filters;
    
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        id, test_id, protocol, status, duration_ms, 
        latency_ms, error_message, created_at, updated_at
        ${includeDetails ? ', details' : ''}
      FROM test_results
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (protocol) {
      query += ` AND protocol = $${paramIndex++}`;
      params.push(protocol);
    }
    
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (since) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(since);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM test_results WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;
    
    if (protocol) {
      countQuery += ` AND protocol = $${countParamIndex++}`;
      countParams.push(protocol);
    }
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex++}`;
      countParams.push(status);
    }
    
    if (since) {
      countQuery += ` AND created_at >= $${countParamIndex++}`;
      countParams.push(since);
    }
    
    try {
      const [results, countResult] = await Promise.all([
        this.executeQuery(query, params, true), // Use read pool
        this.executeQuery(countQuery, countParams, true)
      ]);
      
      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);
      
      return {
        tests: results.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Failed to get test results:', error);
      throw error;
    }
  }
  
  /**
   * Get metrics with caching and aggregation
   */
  async getMetrics(options = {}) {
    const {
      metricNames = [],
      protocols = [],
      timeframe = '1h',
      aggregation = 'avg',
      limit = 1000
    } = options;
    
    // Check cache first
    const cacheKey = `metrics:${JSON.stringify(options)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      return JSON.parse(cached);
    }
    
    this.stats.cacheMisses++;
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date();
    
    switch (timeframe) {
      case '5m':
        startTime.setMinutes(endTime.getMinutes() - 5);
        break;
      case '15m':
        startTime.setMinutes(endTime.getMinutes() - 15);
        break;
      case '1h':
        startTime.setHours(endTime.getHours() - 1);
        break;
      case '6h':
        startTime.setHours(endTime.getHours() - 6);
        break;
      case '24h':
        startTime.setDate(endTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(endTime.getDate() - 7);
        break;
      default:
        startTime.setHours(endTime.getHours() - 1);
    }
    
    let query = `
      SELECT 
        metric_name,
        protocol,
        ${aggregation}(value) as value,
        COUNT(*) as count,
        MIN(value) as min_value,
        MAX(value) as max_value,
        date_trunc('minute', timestamp) as time_bucket
      FROM metrics 
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const params = [startTime.toISOString(), endTime.toISOString()];
    let paramIndex = 3;
    
    if (metricNames.length > 0) {
      query += ` AND metric_name = ANY($${paramIndex++})`;
      params.push(metricNames);
    }
    
    if (protocols.length > 0) {
      query += ` AND protocol = ANY($${paramIndex++})`;
      params.push(protocols);
    }
    
    query += `
      GROUP BY metric_name, protocol, time_bucket
      ORDER BY time_bucket DESC, metric_name
      LIMIT $${paramIndex++}
    `;
    params.push(limit);
    
    try {
      const result = await this.executeQuery(query, params, true);
      const metrics = result.rows;
      
      // Cache results for 30 seconds
      await this.redis.setex(cacheKey, 30, JSON.stringify(metrics));
      
      return metrics;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }
  
  /**
   * Start batch processing for high-frequency inserts
   */
  startBatchProcessing() {
    // Process metrics batch
    setInterval(() => {
      this.flushMetricsBatch();
    }, this.options.batchTimeout);
    
    // Process events batch
    setInterval(() => {
      this.flushEventsBatch();
    }, this.options.batchTimeout);
    
    console.log('[SYNC] Batch processing started');
  }
  
  /**
   * Flush metrics batch to database
   */
  async flushMetricsBatch() {
    if (this.batchQueues.metrics.length === 0) return;
    
    const batch = this.batchQueues.metrics.splice(0, this.options.batchSize);
    const startTime = Date.now();
    
    try {
      // Use COPY for high-performance bulk insert
      const copyQuery = `
        COPY metrics (timestamp, metric_name, protocol, value, tags, metadata)
        FROM STDIN WITH (FORMAT csv)
      `;
      
      const client = await this.pool.connect();
      
      try {
        const stream = client.query(copyText(copyQuery));
        
        for (const metric of batch) {
          const row = [
            metric.timestamp || new Date().toISOString(),
            metric.name,
            metric.protocol || null,
            metric.value,
            metric.tags ? JSON.stringify(metric.tags) : null,
            metric.metadata ? JSON.stringify(metric.metadata) : null
          ].map(val => val === null ? '\\N' : `"${String(val).replace(/"/g, '""')}"`).join(',');
          
          stream.write(row + '\n');
        }
        
        await stream.end();
        
        this.stats.totalInserts += batch.length;
        this.stats.batchesProcessed++;
        
        const duration = Date.now() - startTime;
        console.log(`[INFO] Metrics Flushed ${batch.length} metrics in ${duration}ms`);
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Failed to flush metrics batch:', error);
      // Put failed batch back in queue
      this.batchQueues.metrics.unshift(...batch);
      this.stats.errors++;
    }
  }
  
  /**
   * Flush events batch to database
   */
  async flushEventsBatch() {
    if (this.batchQueues.events.length === 0) return;
    
    const batch = this.batchQueues.events.splice(0, this.options.batchSize);
    
    try {
      const query = `
        INSERT INTO events (event_type, source, data, severity, timestamp)
        VALUES ${batch.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')}
      `;
      
      const params = batch.flatMap(event => [
        event.type,
        event.source,
        JSON.stringify(event.data),
        event.severity || 'info',
        event.timestamp || new Date().toISOString()
      ]);
      
      await this.executeQuery(query, params);
      
      this.stats.totalInserts += batch.length;
      this.stats.batchesProcessed++;
      
    } catch (error) {
      console.error('Failed to flush events batch:', error);
      this.batchQueues.events.unshift(...batch);
      this.stats.errors++;
    }
  }
  
  /**
   * Start maintenance tasks
   */
  startMaintenanceTasks() {
    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
    
    // Update statistics every 5 minutes
    setInterval(() => {
      this.updateTableStatistics();
    }, 5 * 60 * 1000);
    
    // Vacuum and analyze every 6 hours
    setInterval(() => {
      this.optimizeTables();
    }, 6 * 60 * 60 * 1000);
    
    console.log('[BROOM] Maintenance tasks started');
  }
  
  /**
   * Cleanup old data based on retention policy
   */
  async cleanupOldData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);
    
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - this.options.archiveAfterDays);
    
    try {
      // Archive old metrics (move to compressed storage)
      await this.executeQuery(`
        DELETE FROM metrics 
        WHERE timestamp < $1
      `, [cutoffDate.toISOString()]);
      
      // Cleanup old test results
      await this.executeQuery(`
        DELETE FROM test_results 
        WHERE created_at < $1
      `, [cutoffDate.toISOString()]);
      
      // Cleanup old events
      await this.executeQuery(`
        DELETE FROM events 
        WHERE timestamp < $1
      `, [cutoffDate.toISOString()]);
      
      console.log(`[CLEANUP]️ Cleaned up data older than ${this.options.retentionDays} days`);
      
    } catch (error) {
      console.error('Data cleanup failed:', error);
      this.stats.errors++;
    }
  }
  
  /**
   * Update table statistics for query optimization
   */
  async updateTableStatistics() {
    const tables = ['metrics', 'test_results', 'events', 'alert_logs'];
    
    for (const table of tables) {
      try {
        await this.executeQuery(`ANALYZE ${table}`);
      } catch (error) {
        console.warn(`Failed to analyze table ${table}:`, error.message);
      }
    }
  }
  
  /**
   * Optimize tables with vacuum
   */
  async optimizeTables() {
    const tables = ['metrics', 'test_results', 'events'];
    
    for (const table of tables) {
      try {
        await this.executeQuery(`VACUUM ANALYZE ${table}`);
        console.log(`[CONFIG] Optimized table: ${table}`);
      } catch (error) {
        console.warn(`Failed to vacuum table ${table}:`, error.message);
      }
    }
  }
  
  /**
   * Update query performance statistics
   */
  updateQueryStats(duration) {
    this.stats.totalQueries++;
    this.stats.queryTimes.push(duration);
    
    // Keep only last 1000 query times
    if (this.stats.queryTimes.length > 1000) {
      this.stats.queryTimes = this.stats.queryTimes.slice(-1000);
    }
    
    // Calculate average
    this.stats.averageQueryTime = 
      this.stats.queryTimes.reduce((sum, time) => sum + time, 0) / 
      this.stats.queryTimes.length;
  }
  
  /**
   * Health check
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await this.executeQuery('SELECT 1');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        pools: {
          main: this.pool.totalCount,
          read: this.readPool.totalCount
        },
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime,
      batchQueueSizes: {
        metrics: this.batchQueues.metrics.length,
        events: this.batchQueues.events.length
      },
      cacheHitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 ? 
        (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0
    };
  }
  
  /**
   * Graceful shutdown
   */
  async close() {
    console.log('[POWER] Closing database connections...');
    
    // Flush remaining batches
    await this.flushMetricsBatch();
    await this.flushEventsBatch();
    
    // Close pools
    await this.pool.end();
    await this.readPool.end();
    
    // Close Redis
    this.redis.disconnect();
    
    console.log('[SUCCESS] Database connections closed');
  }
}

module.exports = ProductionDatabase;