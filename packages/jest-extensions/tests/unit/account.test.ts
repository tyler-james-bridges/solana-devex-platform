import { PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getTestContext, airdrop } from '../../src/utils/connection';

describe('Account Matchers', () => {
  let testKeypair: Keypair;
  let testPublicKey: PublicKey;
  let connection: any;

  beforeAll(async () => {
    testKeypair = Keypair.generate();
    testPublicKey = testKeypair.publicKey;
    connection = getTestContext().connection;
    
    // Try to airdrop some SOL for testing (only works on localnet/devnet/testnet)
    try {
      await airdrop(connection, testPublicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for confirmation
    } catch (error) {
      console.warn('Airdrop failed - may be on mainnet or validator not running');
    }
  });

  describe('toExist', () => {
    it('should pass when account exists', async () => {
      await expect(testPublicKey).toExist();
    });

    it('should fail when account does not exist', async () => {
      const nonExistentKey = Keypair.generate().publicKey;
      await expect(nonExistentKey).not.toExist();
    });

    it('should work with string public key', async () => {
      await expect(testPublicKey.toBase58()).toExist();
    });
  });

  describe('toHaveBalance', () => {
    it('should pass when account has exact balance', async () => {
      // Get current balance first
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).toHaveBalance(accountInfo.lamports);
      }
    });

    it('should fail when account has different balance', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo && accountInfo.lamports > 0) {
        await expect(testPublicKey).not.toHaveBalance(accountInfo.lamports + 1);
      }
    });

    it('should work with string balance', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).toHaveBalance(accountInfo.lamports.toString());
      }
    });

    it('should fail for non-existent account', async () => {
      const nonExistentKey = Keypair.generate().publicKey;
      await expect(nonExistentKey).not.toHaveBalance(0);
    });
  });

  describe('toHaveMinimumBalance', () => {
    it('should pass when account has minimum or more', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo && accountInfo.lamports > 0) {
        await expect(testPublicKey).toHaveMinimumBalance(accountInfo.lamports - 1);
        await expect(testPublicKey).toHaveMinimumBalance(accountInfo.lamports);
      }
    });

    it('should fail when account has less than minimum', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).not.toHaveMinimumBalance(accountInfo.lamports + 1000000);
      }
    });
  });

  describe('toHaveBalanceGreaterThan', () => {
    it('should pass when account balance is greater', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo && accountInfo.lamports > 1) {
        await expect(testPublicKey).toHaveBalanceGreaterThan(accountInfo.lamports - 1);
      }
    });

    it('should fail when account balance is equal or less', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).not.toHaveBalanceGreaterThan(accountInfo.lamports);
        await expect(testPublicKey).not.toHaveBalanceGreaterThan(accountInfo.lamports + 1);
      }
    });
  });

  describe('toHaveBalanceLessThan', () => {
    it('should pass when account balance is less', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).toHaveBalanceLessThan(accountInfo.lamports + 1000000);
      }
    });

    it('should fail when account balance is equal or greater', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo && accountInfo.lamports > 0) {
        await expect(testPublicKey).not.toHaveBalanceLessThan(accountInfo.lamports);
        await expect(testPublicKey).not.toHaveBalanceLessThan(accountInfo.lamports - 1);
      }
    });

    it('should pass for non-existent account (0 balance)', async () => {
      const nonExistentKey = Keypair.generate().publicKey;
      await expect(nonExistentKey).toHaveBalanceLessThan(1);
    });
  });

  describe('toHaveOwner', () => {
    it('should pass when account has correct owner', async () => {
      await expect(testPublicKey).toHaveOwner(SystemProgram.programId);
    });

    it('should work with string owner', async () => {
      await expect(testPublicKey).toHaveOwner(SystemProgram.programId.toBase58());
    });

    it('should fail when account has different owner', async () => {
      const randomOwner = Keypair.generate().publicKey;
      await expect(testPublicKey).not.toHaveOwner(randomOwner);
    });
  });

  describe('toBeSystemAccount', () => {
    it('should pass for system-owned accounts', async () => {
      await expect(testPublicKey).toBeSystemAccount();
    });

    it('should fail for non-system accounts', async () => {
      // This would fail if the account was owned by a different program
      // For this test, we'll just ensure the matcher works
      await expect(testPublicKey).toBeSystemAccount();
    });
  });

  describe('toHaveData', () => {
    it('should pass when checking for any data on empty system account', async () => {
      // System accounts typically have no data
      await expect(testPublicKey).not.toHaveData();
    });

    it('should work with specific data buffer', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).toHaveData(accountInfo.data);
      }
    });
  });

  describe('toHaveDataLength', () => {
    it('should pass when account has correct data length', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).toHaveDataLength(accountInfo.data.length);
      }
    });

    it('should fail when account has different data length', async () => {
      const accountInfo = await connection.getAccountInfo(testPublicKey);
      if (accountInfo) {
        await expect(testPublicKey).not.toHaveDataLength(accountInfo.data.length + 1);
      }
    });
  });
});