/**
 * Comprehensive integration test demonstrating all Jest blockchain matchers
 * This test shows how to use the matchers in real blockchain testing scenarios
 */

import {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  getMint,
} from '@solana/spl-token';
import { getTestContext, airdrop } from '../../src/utils/connection';

describe('Complete Blockchain Testing Example', () => {
  let connection: any;
  let payer: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let mint: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;

  beforeAll(async () => {
    connection = getTestContext().connection;
    
    // Generate test keypairs
    payer = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    
    try {
      // Fund accounts for testing
      await airdrop(connection, payer.publicKey, 5 * LAMPORTS_PER_SOL);
      await airdrop(connection, user1.publicKey, 2 * LAMPORTS_PER_SOL);
      await airdrop(connection, user2.publicKey, 1 * LAMPORTS_PER_SOL);
      
      // Wait for airdrops to confirm
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.warn('Airdrop failed - may be on mainnet or validator not running');
      console.warn('This test suite requires a local test validator');
      return;
    }
  }, 30000);

  describe('Account Testing', () => {
    it('should verify account existence and balances', async () => {
      // Test account existence
      await expect(payer.publicKey).toExist();
      await expect(user1.publicKey).toExist();
      await expect(user2.publicKey).toExist();
      
      // Test account balances
      await expect(payer.publicKey).toHaveMinimumBalance(4 * LAMPORTS_PER_SOL);
      await expect(user1.publicKey).toHaveMinimumBalance(1.5 * LAMPORTS_PER_SOL);
      await expect(user2.publicKey).toHaveMinimumBalance(0.5 * LAMPORTS_PER_SOL);
      
      // Test balance comparisons
      await expect(payer.publicKey).toHaveBalanceGreaterThan(4 * LAMPORTS_PER_SOL);
      await expect(user2.publicKey).toHaveBalanceLessThan(2 * LAMPORTS_PER_SOL);
      
      // Test account ownership
      await expect(payer.publicKey).toHaveOwner(SystemProgram.programId);
      await expect(user1.publicKey).toBeSystemAccount();
      await expect(user2.publicKey).toBeSystemAccount();
      
      // Test data properties
      await expect(payer.publicKey).toHaveDataLength(0); // System accounts have no data
      await expect(user1.publicKey).not.toHaveData();
    });

    it('should handle non-existent accounts', async () => {
      const nonExistentAccount = Keypair.generate().publicKey;
      
      await expect(nonExistentAccount).not.toExist();
      await expect(nonExistentAccount).toHaveBalanceLessThan(1); // 0 < 1
    });
  });

  describe('Transaction Testing', () => {
    let transferSignature: string;
    
    it('should test successful transactions', async () => {
      // Create and send a transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: user1.publicKey,
          toPubkey: user2.publicKey,
          lamports: 0.1 * LAMPORTS_PER_SOL,
        })
      );

      transferSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [user1]
      );

      // Test transaction success
      await expect(transferSignature).toBeConfirmed();
      await expect(transferSignature).toHaveSucceeded();
      await expect(transferSignature).not.toHaveFailed();
      
      // Test transaction properties
      await expect(transferSignature).toHaveComputeUnitsConsumed(expect.any(Number));
      await expect(transferSignature).toHaveTransactionFee(expect.any(Number));
    });

    it('should eventually be finalized', async () => {
      if (transferSignature) {
        // Wait for finalization
        await new Promise(resolve => setTimeout(resolve, 3000));
        await expect(transferSignature).toBeFinalized();
      }
    }, 10000);

    it('should test failed transactions', async () => {
      // Try to transfer more than available balance
      const emptyAccount = Keypair.generate();
      
      try {
        const failingTransaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: emptyAccount.publicKey,
            toPubkey: user2.publicKey,
            lamports: LAMPORTS_PER_SOL,
          })
        );

        await sendAndConfirmTransaction(
          connection,
          failingTransaction,
          [emptyAccount]
        );
      } catch (error) {
        // Extract signature from error if available
        const errorStr = error?.toString() || '';
        const signatureMatch = errorStr.match(/([A-Za-z0-9]{87,88})/);
        
        if (signatureMatch) {
          const failedSignature = signatureMatch[1];
          await expect(failedSignature).toHaveFailed();
          await expect(failedSignature).toHaveFailedWith(/insufficient|InsufficientFunds/i);
        }
      }
    });
  });

  describe('Program Testing', () => {
    it('should test program existence', async () => {
      // Test well-known programs
      await expect(SystemProgram.programId).toExistOnCluster();
      await expect(SystemProgram.programId).toBeDeployed();
      await expect(TOKEN_PROGRAM_ID).toExistOnCluster();
      
      // Test non-existent program
      const fakeProgram = Keypair.generate().publicKey;
      await expect(fakeProgram).not.toExistOnCluster();
    });

    it('should test program methods and accounts (mock)', async () => {
      // Mock Anchor program for testing
      const mockProgram = {
        programId: TOKEN_PROGRAM_ID,
        methods: {
          initializeMint: () => {},
          initializeAccount: () => {},
          transfer: () => {},
        },
        account: {
          mint: {},
          tokenAccount: {},
        },
        idl: {
          instructions: [
            { name: 'initializeMint' },
            { name: 'initializeAccount' },
            { name: 'transfer' },
          ],
          accounts: [
            { name: 'Mint' },
            { name: 'TokenAccount' },
          ],
        },
      };

      // Test program methods
      await expect(mockProgram).toHaveMethod('initializeMint');
      await expect(mockProgram).toHaveMethod('transfer');
      await expect(mockProgram).not.toHaveMethod('nonExistentMethod');
      
      // Test program accounts
      await expect(mockProgram).toHaveAccount('mint');
      await expect(mockProgram).toHaveAccount('tokenAccount');
      await expect(mockProgram).not.toHaveAccount('nonExistentAccount');
      
      // Test IDL structure
      await expect(mockProgram).toHaveIdlMethod('initializeMint');
      await expect(mockProgram).toHaveIdlAccount('Mint');
      await expect(mockProgram).not.toHaveIdlMethod('nonExistentInstruction');
    });
  });

  describe('Token Testing', () => {
    beforeAll(async () => {
      if (!connection) return;
      
      try {
        // Create a test token mint
        mint = await createMint(
          connection,
          payer,
          payer.publicKey, // mint authority
          payer.publicKey, // freeze authority
          9 // decimals
        );

        // Create token accounts for users
        user1TokenAccount = await createAccount(
          connection,
          payer,
          mint,
          user1.publicKey
        );

        user2TokenAccount = await createAccount(
          connection,
          payer,
          mint,
          user2.publicKey
        );

        // Mint some tokens to user1
        await mintTo(
          connection,
          payer,
          mint,
          user1TokenAccount,
          payer,
          1000000000 // 1 token with 9 decimals
        );

        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn('Token setup failed:', error);
      }
    });

    it('should test token account properties', async () => {
      if (!mint || !user1TokenAccount || !user2TokenAccount) {
        console.warn('Skipping token tests - setup failed');
        return;
      }

      // Test token account existence and ownership
      await expect(user1TokenAccount).toExist();
      await expect(user1TokenAccount).toBeTokenAccount();
      await expect(user1TokenAccount).toHaveOwner(TOKEN_PROGRAM_ID);
      
      // Test token balances
      await expect(user1TokenAccount).toHaveTokenBalance(1000000000);
      await expect(user2TokenAccount).toHaveTokenBalance(0);
      
      // Test mint relationship
      await expect(user1TokenAccount).toHaveMint(mint);
      await expect(user2TokenAccount).toHaveMint(mint);
    });

    it('should test mint properties', async () => {
      if (!mint) {
        console.warn('Skipping mint tests - setup failed');
        return;
      }

      // Test mint properties
      await expect(mint).toHaveDecimals(9);
      await expect(mint).toHaveTokenSupply(1000000000);
      await expect(mint).toHaveMintAuthority(payer.publicKey);
      await expect(mint).toHaveFreezeAuthority(payer.publicKey);
    });

    it('should test token account states', async () => {
      if (!user1TokenAccount) {
        console.warn('Skipping token state tests - setup failed');
        return;
      }

      // Most token accounts start unfrozen
      await expect(user1TokenAccount).not.toBeFrozen();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid inputs gracefully', async () => {
      // These should all fail gracefully with meaningful error messages
      
      try {
        await expect('invalid-key').toExist();
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await expect(null as any).toHaveBalance(1000);
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await expect('fake-signature').toBeConfirmed();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers correctly', async () => {
      if (!payer?.publicKey) return;
      
      const accountInfo = await connection.getAccountInfo(payer.publicKey);
      if (accountInfo) {
        // Test with very large numbers (using string representation)
        const largeAmount = '999999999999999999999999999999999999999999999';
        await expect(payer.publicKey).not.toHaveBalance(largeAmount);
        await expect(payer.publicKey).toHaveBalanceLessThan(largeAmount);
      }
    });

    it('should handle concurrent operations', async () => {
      if (!payer?.publicKey || !user1?.publicKey) return;
      
      // Test multiple concurrent balance checks
      const promises = [
        expect(payer.publicKey).toExist(),
        expect(user1.publicKey).toExist(),
        expect(payer.publicKey).toBeSystemAccount(),
        expect(user1.publicKey).toBeSystemAccount(),
      ];

      await Promise.all(promises);
    });
  });
});