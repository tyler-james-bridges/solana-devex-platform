import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import {
  toBN,
  lamportsToSol,
  solToLamports,
  formatPublicKey,
  formatAmount,
  amountsEqual,
  isGreaterThan,
  isLessThan,
  isValidPublicKey,
  toPublicKey,
  waitForCondition,
  sleep,
  retry,
} from '../../src/utils/helpers';

describe('Utility Functions', () => {
  describe('toBN', () => {
    it('should convert number to BN', () => {
      const result = toBN(1000);
      expect(result).toBeInstanceOf(BN);
      expect(result.toNumber()).toBe(1000);
    });

    it('should convert string to BN', () => {
      const result = toBN('1000000000');
      expect(result).toBeInstanceOf(BN);
      expect(result.toString()).toBe('1000000000');
    });

    it('should return BN as-is', () => {
      const input = new BN(500);
      const result = toBN(input);
      expect(result).toBe(input);
    });

    it('should throw for invalid types', () => {
      expect(() => toBN({} as any)).toThrow();
    });
  });

  describe('lamportsToSol', () => {
    it('should convert lamports to SOL correctly', () => {
      expect(lamportsToSol(1000000000)).toBe(1); // 1 SOL
      expect(lamportsToSol(500000000)).toBe(0.5); // 0.5 SOL
      expect(lamportsToSol(new BN(2000000000))).toBe(2); // 2 SOL
    });
  });

  describe('solToLamports', () => {
    it('should convert SOL to lamports correctly', () => {
      expect(solToLamports(1).toNumber()).toBe(1000000000);
      expect(solToLamports(0.5).toNumber()).toBe(500000000);
      expect(solToLamports(2).toNumber()).toBe(2000000000);
    });
  });

  describe('formatPublicKey', () => {
    const testKey = 'So11111111111111111111111111111111111111112';
    
    it('should format PublicKey object', () => {
      const publicKey = new PublicKey(testKey);
      const result = formatPublicKey(publicKey);
      expect(result).toBe('So111111...111111112');
    });

    it('should format string key', () => {
      const result = formatPublicKey(testKey);
      expect(result).toBe('So111111...111111112');
    });
  });

  describe('formatAmount', () => {
    it('should format lamports by default', () => {
      expect(formatAmount(1000)).toBe('1000 lamports');
      expect(formatAmount('2000')).toBe('2000 lamports');
      expect(formatAmount(new BN(3000))).toBe('3000 lamports');
    });

    it('should format SOL when specified', () => {
      expect(formatAmount(1000000000, 'SOL')).toBe('1 SOL');
      expect(formatAmount(500000000, 'SOL')).toBe('0.5 SOL');
    });

    it('should format custom units', () => {
      expect(formatAmount(100, 'tokens')).toBe('100 tokens');
    });
  });

  describe('amount comparison functions', () => {
    describe('amountsEqual', () => {
      it('should return true for equal amounts', () => {
        expect(amountsEqual(1000, 1000)).toBe(true);
        expect(amountsEqual('1000', 1000)).toBe(true);
        expect(amountsEqual(new BN(1000), 1000)).toBe(true);
        expect(amountsEqual(new BN(1000), new BN(1000))).toBe(true);
      });

      it('should return false for different amounts', () => {
        expect(amountsEqual(1000, 2000)).toBe(false);
        expect(amountsEqual('1000', 2000)).toBe(false);
      });
    });

    describe('isGreaterThan', () => {
      it('should return true when first amount is greater', () => {
        expect(isGreaterThan(2000, 1000)).toBe(true);
        expect(isGreaterThan('2000', 1000)).toBe(true);
        expect(isGreaterThan(new BN(2000), 1000)).toBe(true);
      });

      it('should return false when first amount is less or equal', () => {
        expect(isGreaterThan(1000, 2000)).toBe(false);
        expect(isGreaterThan(1000, 1000)).toBe(false);
      });
    });

    describe('isLessThan', () => {
      it('should return true when first amount is less', () => {
        expect(isLessThan(1000, 2000)).toBe(true);
        expect(isLessThan('1000', 2000)).toBe(true);
        expect(isLessThan(new BN(1000), 2000)).toBe(true);
      });

      it('should return false when first amount is greater or equal', () => {
        expect(isLessThan(2000, 1000)).toBe(false);
        expect(isLessThan(1000, 1000)).toBe(false);
      });
    });
  });

  describe('PublicKey utilities', () => {
    const validKeyString = 'So11111111111111111111111111111111111111112';
    
    describe('isValidPublicKey', () => {
      it('should return true for valid PublicKey objects', () => {
        const publicKey = new PublicKey(validKeyString);
        expect(isValidPublicKey(publicKey)).toBe(true);
      });

      it('should return true for valid key strings', () => {
        expect(isValidPublicKey(validKeyString)).toBe(true);
      });

      it('should return false for invalid keys', () => {
        expect(isValidPublicKey('invalid')).toBe(false);
        expect(isValidPublicKey('')).toBe(false);
        expect(isValidPublicKey(123)).toBe(false);
        expect(isValidPublicKey(null)).toBe(false);
      });
    });

    describe('toPublicKey', () => {
      it('should convert string to PublicKey', () => {
        const result = toPublicKey(validKeyString);
        expect(result).toBeInstanceOf(PublicKey);
        expect(result.toBase58()).toBe(validKeyString);
      });

      it('should return PublicKey as-is', () => {
        const publicKey = new PublicKey(validKeyString);
        const result = toPublicKey(publicKey);
        expect(result).toBe(publicKey);
      });
    });
  });

  describe('async utilities', () => {
    describe('sleep', () => {
      it('should wait for specified time', async () => {
        const start = Date.now();
        await sleep(100);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
      });
    });

    describe('waitForCondition', () => {
      it('should resolve when condition becomes true', async () => {
        let counter = 0;
        const condition = async () => {
          counter++;
          return counter >= 3;
        };

        const result = await waitForCondition(condition, 5000, 50);
        expect(result).toBe(true);
        expect(counter).toBeGreaterThanOrEqual(3);
      });

      it('should timeout when condition never becomes true', async () => {
        const condition = async () => false;
        
        const result = await waitForCondition(condition, 200, 50);
        expect(result).toBe(false);
      }, 1000);
    });

    describe('retry', () => {
      it('should succeed on first attempt', async () => {
        let attempts = 0;
        const operation = async () => {
          attempts++;
          return 'success';
        };

        const result = await retry(operation);
        expect(result).toBe('success');
        expect(attempts).toBe(1);
      });

      it('should retry on failure and eventually succeed', async () => {
        let attempts = 0;
        const operation = async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        };

        const result = await retry(operation, 3, 10);
        expect(result).toBe('success');
        expect(attempts).toBe(3);
      });

      it('should throw after max attempts', async () => {
        const operation = async () => {
          throw new Error('Permanent failure');
        };

        await expect(retry(operation, 2, 10)).rejects.toThrow('Permanent failure');
      });
    });
  });
});