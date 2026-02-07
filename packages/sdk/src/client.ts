/**
 * Main SDK Client for Solana DevEx Platform
 * Provides typed methods to interact with the platform's APIs
 */

import { 
  SolanaDevExConfig, 
  DebugResult, 
  SimulationResult, 
  ProtocolHealth, 
  SecurityReport, 
  PlatformMetrics,
  APIResponse,
  NetworkError,
  AuthenticationError,
  ValidationError,
  SolanaDevExError
} from './types';

// Polyfill fetch for Node.js environments
let globalFetch: typeof fetch;
if (typeof fetch === 'undefined') {
  // Try to use node-fetch or cross-fetch if available
  try {
    globalFetch = require('cross-fetch');
  } catch {
    throw new Error('Fetch is not available. Please install cross-fetch or use a modern environment with fetch support.');
  }
} else {
  globalFetch = fetch;
}

/**
 * Default configuration for the Solana DevEx client
 */
const DEFAULT_CONFIG: Required<SolanaDevExConfig> = {
  apiUrl: 'https://onchain-devex.tools',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  apiKey: '',
  timeout: 30000,
  retryAttempts: 3,
  enableCaching: true
};

/**
 * Main client class for interacting with the Solana DevEx Platform
 */
export class SolanaDevExClient {
  private config: Required<SolanaDevExConfig>;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  /**
   * Create a new SolanaDevExClient instance
   * @param config - Optional configuration overrides
   */
  constructor(config: SolanaDevExConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    
    // Validate configuration
    this.validateConfig();
  }

  /**
   * Debug a Solana transaction by signature
   * @param signature - Transaction signature to debug
   * @returns Promise<DebugResult> - Detailed debugging information
   */
  async debugTransaction(signature: string): Promise<DebugResult> {
    this.validateSignature(signature);
    
    const cacheKey = `debug:${signature}`;
    const cachedResult = this.getFromCache<DebugResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.makeRequest<DebugResult>('POST', '/api/debug-transaction', {
        signature
      });

      if (response.success && response.data) {
        // Cache successful results for 5 minutes
        this.setCache(cacheKey, response.data, 300000);
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to debug transaction',
        'DEBUG_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) {
        throw error;
      }
      throw new NetworkError(`Transaction debugging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate a transaction before execution for safety checks
   * @param txData - Transaction data (base58 encoded)
   * @returns Promise<SimulationResult> - Simulation results with safety checks
   */
  async simulateTransaction(txData: string): Promise<SimulationResult> {
    this.validateTransactionData(txData);
    
    const cacheKey = `simulate:${this.hashString(txData)}`;
    const cachedResult = this.getFromCache<SimulationResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.makeRequest<SimulationResult>('POST', '/api/simulate-transaction', {
        transactionData: txData
      });

      if (response.success && response.data) {
        // Cache simulation results for 2 minutes
        this.setCache(cacheKey, response.data, 120000);
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to simulate transaction',
        'SIMULATION_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) {
        throw error;
      }
      throw new NetworkError(`Transaction simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get protocol health monitoring data
   * @returns Promise<ProtocolHealth[]> - Array of protocol health information
   */
  async getProtocolHealth(): Promise<ProtocolHealth[]> {
    const cacheKey = 'protocol-health';
    const cachedResult = this.getFromCache<ProtocolHealth[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.makeRequest<ProtocolHealth[]>('GET', '/api/protocol-health');

      if (response.success && response.data) {
        // Cache protocol health for 30 seconds
        this.setCache(cacheKey, response.data, 30000);
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to fetch protocol health',
        'HEALTH_FETCH_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) {
        throw error;
      }
      throw new NetworkError(`Protocol health fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run security analysis on a Solana program
   * @param programId - Public key of the program to analyze
   * @returns Promise<SecurityReport> - Comprehensive security analysis
   */
  async runSecurityScan(programId: string): Promise<SecurityReport> {
    this.validateProgramId(programId);
    
    const cacheKey = `security:${programId}`;
    const cachedResult = this.getFromCache<SecurityReport>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.makeRequest<SecurityReport>('POST', '/api/security-scan', {
        programId
      });

      if (response.success && response.data) {
        // Cache security reports for 10 minutes
        this.setCache(cacheKey, response.data, 600000);
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to run security scan',
        'SECURITY_SCAN_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) {
        throw error;
      }
      throw new NetworkError(`Security scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get platform usage metrics and statistics
   * @returns Promise<PlatformMetrics> - Platform performance and usage data
   */
  async getMetrics(): Promise<PlatformMetrics> {
    const cacheKey = 'platform-metrics';
    const cachedResult = this.getFromCache<PlatformMetrics>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.makeRequest<PlatformMetrics>('GET', '/api/metrics');

      if (response.success && response.data) {
        // Cache metrics for 1 minute
        this.setCache(cacheKey, response.data, 60000);
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to fetch platform metrics',
        'METRICS_FETCH_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) {
        throw error;
      }
      throw new NetworkError(`Metrics fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update client configuration
   * @param config - New configuration to merge
   */
  updateConfig(config: Partial<SolanaDevExConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();
    
    // Clear cache if API URL changed
    if (config.apiUrl) {
      this.clearCache();
    }
  }

  /**
   * Get current client configuration
   * @returns SolanaDevExConfig - Current configuration (excluding sensitive data)
   */
  getConfig(): Omit<SolanaDevExConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Clear the client cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get platform health status
   * @returns Promise<boolean> - Whether the platform is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>('GET', '/api/health');
      return response.success && response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Make an HTTP request with retry logic and error handling
   * @private
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any
  ): Promise<APIResponse<T>> {
    const url = `${this.config.apiUrl}${path}`;
    
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': '@solana-devex/sdk'
        };

        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          headers['x-api-key'] = this.config.apiKey;
        }

        const response = await globalFetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new AuthenticationError();
        }

        if (response.status === 429) {
          // Rate limited, wait before retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await this.delay(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new NetworkError(
            `HTTP ${response.status}: ${errorText}`,
            response.status
          );
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (error instanceof AuthenticationError || error instanceof ValidationError) {
          throw error;
        }

        if (attempt === this.config.retryAttempts) {
          break;
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    throw lastError || new NetworkError('All retry attempts failed');
  }

  /**
   * Cache helper methods
   * @private
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Validation methods
   * @private
   */
  private validateConfig(): void {
    if (!this.config.apiUrl) {
      throw new ValidationError('API URL is required');
    }

    try {
      new URL(this.config.apiUrl);
    } catch {
      throw new ValidationError('Invalid API URL format');
    }

    if (this.config.timeout <= 0) {
      throw new ValidationError('Timeout must be positive');
    }

    if (this.config.retryAttempts < 0) {
      throw new ValidationError('Retry attempts cannot be negative');
    }
  }

  private validateSignature(signature: string): void {
    if (!signature || typeof signature !== 'string') {
      throw new ValidationError('Transaction signature is required and must be a string');
    }

    if (signature.length < 80 || signature.length > 100) {
      throw new ValidationError('Invalid transaction signature format');
    }

    // Basic base58 validation
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)) {
      throw new ValidationError('Transaction signature must be valid base58');
    }
  }

  private validateTransactionData(txData: string): void {
    if (!txData || typeof txData !== 'string') {
      throw new ValidationError('Transaction data is required and must be a string');
    }

    // Basic base58 validation for transaction data
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(txData)) {
      throw new ValidationError('Transaction data must be valid base58');
    }
  }

  private validateProgramId(programId: string): void {
    if (!programId || typeof programId !== 'string') {
      throw new ValidationError('Program ID is required and must be a string');
    }

    // Validate Solana public key format
    if (programId.length !== 44) {
      throw new ValidationError('Program ID must be 44 characters long');
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(programId)) {
      throw new ValidationError('Program ID must be valid base58');
    }
  }

  /**
   * Utility methods
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}