/**
 * Tests for SolanaDevExClient
 */

import { SolanaDevExClient, ValidationError, NetworkError } from '../client';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SolanaDevExClient', () => {
  let client: SolanaDevExClient;

  beforeEach(() => {
    client = new SolanaDevExClient();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      const config = client.getConfig();
      expect(config.apiUrl).toBe('https://onchain-devex.tools');
      expect(config.rpcEndpoint).toBe('https://api.mainnet-beta.solana.com');
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.enableCaching).toBe(true);
    });

    it('should create client with custom configuration', () => {
      const customClient = new SolanaDevExClient({
        apiUrl: 'https://custom-api.com',
        timeout: 60000,
        retryAttempts: 5
      });

      const config = customClient.getConfig();
      expect(config.apiUrl).toBe('https://custom-api.com');
      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
    });

    it('should throw error for invalid API URL', () => {
      expect(() => {
        new SolanaDevExClient({ apiUrl: 'invalid-url' });
      }).toThrow(ValidationError);
    });
  });

  describe('debugTransaction', () => {
    it('should validate transaction signature', async () => {
      await expect(client.debugTransaction('')).rejects.toThrow(ValidationError);
      await expect(client.debugTransaction('short')).rejects.toThrow(ValidationError);
      await expect(client.debugTransaction('invalid-chars-@#$')).rejects.toThrow(ValidationError);
    });

    it('should make successful API call', async () => {
      const mockResponse = {
        success: true,
        data: {
          signature: 'test-signature',
          status: 'success',
          cpiFlow: [],
          errors: [],
          performance: {
            computeUnitsUsed: 1000,
            computeUnitsRequested: 2000,
            fee: 5000,
            slot: 12345,
            computeEfficiency: 50,
            gasOptimization: 'Good'
          }
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.debugTransaction('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi8RQ4jgqf6PfyPyA8gMEEaB3N2mQx');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://onchain-devex.tools/api/debug-transaction',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': '@solana-devex/sdk'
          }),
          body: JSON.stringify({
            signature: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi8RQ4jgqf6PfyPyA8gMEEaB3N2mQx'
          })
        })
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      await expect(
        client.debugTransaction('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi8RQ4jgqf6PfyPyA8gMEEaB3N2mQx')
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      client.updateConfig({
        timeout: 60000,
        retryAttempts: 5
      });

      const config = client.getConfig();
      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
    });

    it('should validate updated configuration', () => {
      expect(() => {
        client.updateConfig({ apiUrl: 'invalid-url' });
      }).toThrow(ValidationError);
    });
  });

  describe('isHealthy', () => {
    it('should return true for healthy platform', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { status: 'healthy' }
        })
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should return false for unhealthy platform', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });
  });
});