/**
 * Main SDK Client for Solana DevEx Platform
 * Provides typed methods to interact with the platform's APIs
 */

import { 
  SolanaDevExConfig, 
  DebugResult, 
  APIResponse,
  NetworkError,
  AuthenticationError,
  ValidationError,
  SolanaDevExError
} from './types';

let globalFetch: typeof fetch;
if (typeof fetch === 'undefined') {
  try {
    globalFetch = require('cross-fetch');
  } catch {
    throw new Error('Fetch is not available. Please install cross-fetch or use Node.js 18+.');
  }
} else {
  globalFetch = fetch;
}

const DEFAULT_CONFIG: Required<SolanaDevExConfig> = {
  apiUrl: 'https://onchain-devex.tools',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  apiKey: '',
  timeout: 30000,
  retryAttempts: 3,
  enableCaching: true
};

/**
 * Client for the Solana DevEx Platform API
 * 
 * @example
 * ```typescript
 * const client = new SolanaDevExClient();
 * const result = await client.debugTransaction('your-tx-signature');
 * console.log(result.cpiFlow);
 * ```
 */
export class SolanaDevExClient {
  private config: Required<SolanaDevExConfig>;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor(config: SolanaDevExConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.validateConfig();
  }

  /**
   * Debug a Solana transaction by signature.
   * Fetches real mainnet data via the platform's RPC integration.
   * 
   * @param signature - Base58 transaction signature
   * @returns Detailed debugging info: CPI flow, errors, performance, metadata
   */
  async debugTransaction(signature: string): Promise<DebugResult> {
    this.validateSignature(signature);
    
    const cacheKey = `debug:${signature}`;
    const cached = this.getFromCache<DebugResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.makeRequest<DebugResult>('POST', '/api/debug-transaction', {
        signature
      });

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 300000); // 5 min
        return response.data;
      }

      throw new SolanaDevExError(
        response.error || 'Failed to debug transaction',
        'DEBUG_FAILED'
      );
    } catch (error) {
      if (error instanceof SolanaDevExError) throw error;
      throw new NetworkError(`Transaction debugging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateConfig(config: Partial<SolanaDevExConfig>): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();
    if (config.apiUrl) this.clearCache();
  }

  getConfig(): Omit<SolanaDevExConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  clearCache(): void {
    this.cache.clear();
  }

  // --- Private methods ---

  private async makeRequest<T>(
    method: 'GET' | 'POST',
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
        }

        const response = await globalFetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 401) throw new AuthenticationError();

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await this.delay(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new NetworkError(`HTTP ${response.status}: ${errorText}`, response.status);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (error instanceof AuthenticationError || error instanceof ValidationError) throw error;
        if (attempt === this.config.retryAttempts) break;
        await this.delay(Math.pow(2, attempt - 1) * 1000);
      }
    }

    throw lastError || new NetworkError('All retry attempts failed');
  }

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
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private validateConfig(): void {
    if (!this.config.apiUrl) throw new ValidationError('API URL is required');
    try { new URL(this.config.apiUrl); } catch { throw new ValidationError('Invalid API URL'); }
    if (this.config.timeout <= 0) throw new ValidationError('Timeout must be positive');
  }

  private validateSignature(signature: string): void {
    if (!signature || typeof signature !== 'string') throw new ValidationError('Transaction signature required');
    if (signature.length < 80 || signature.length > 100) throw new ValidationError('Invalid signature format');
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)) throw new ValidationError('Signature must be valid base58');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
