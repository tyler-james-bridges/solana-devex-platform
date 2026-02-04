/**
 * Basic usage examples for jest-blockchain-extensions
 * 
 * To run this example:
 * 1. Start a local Solana test validator: `solana-test-validator`
 * 2. Run: `npm test examples/basic-usage.test.ts`
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
  initializeTestEnvironment,
  airdrop,
  getTestContext 
} from '../src/utils';
import '../src'; // Import jest extensions

describe('Basic Usage Examples', () => {
  let payer: Keypair;
  let recipient: Keypair;
  let connection: any;

  beforeAll(async () => {
    // Initialize test environment
    const context = initializeTestEnvironment({
      endpoint: 'http://localhost:8899',
      cluster: 'localnet',
      commitment: 'confirmed'
    });
    
    connection = context.connection;
    
    // Create test accounts
    payer = Keypair.generate();
    recipient = Keypair.generate();
    
    // Fund the payer account
    await airdrop(connection, payer.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Wait for airdrop to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  describe('Account Testing Examples', () => {
    it('should test account existence and balances', async () => {
      // Test account existence
      await expect(payer.publicKey).toExist();
      
      // Test balance (payer should have ~2 SOL from airdrop)
      await expect(payer.publicKey).toHaveMinimumBalance(1.5 * LAMPORTS_PER_SOL);
      await expect(payer.publicKey).toHaveBalanceGreaterThan(LAMPORTS_PER_SOL);
      
      // Test account ownership (should be owned by system program)
      await expect(payer.publicKey).toHaveOwner(SystemProgram.programId);
      await expect(payer.publicKey).toBeSystemAccount();
      
      // Test non-existent account
      const nonExistent = Keypair.generate().publicKey;
      await expect(nonExistent).not.toExist();
    });
    
    it('should work with string public keys', async () => {
      const payerString = payer.publicKey.toBase58();
      await expect(payerString).toExist();
      await expect(payerString).toBeSystemAccount();
    });
  });

  describe('Transaction Testing Examples', () => {
    it('should test successful transactions', async () => {
      // Create a simple transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient.publicKey,
          lamports: 0.1 * LAMPORTS_PER_SOL, // Transfer 0.1 SOL
        })
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
      );

      // Test transaction properties
      await expect(signature).toBeConfirmed();
      await expect(signature).toHaveSucceeded();
      await expect(signature).not.toHaveFailed();
      
      // Check that recipient now has balance
      await expect(recipient.publicKey).toExist();
      await expect(recipient.publicKey).toHaveBalance(0.1 * LAMPORTS_PER_SOL);
    });

    it('should test failed transactions', async () => {
      // Try to transfer from an account with insufficient funds
      const emptyAccount = Keypair.generate();
      
      try {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: emptyAccount.publicKey,
            toPubkey: recipient.publicKey,
            lamports: LAMPORTS_PER_SOL,
          })
        );

        await sendAndConfirmTransaction(connection, transaction, [emptyAccount]);
      } catch (error) {
        // This transaction should fail due to insufficient funds
        // Extract signature from error if available
        const errorStr = error?.toString() || '';
        const signatureMatch = errorStr.match(/([A-Za-z0-9]{87,88})/);
        
        if (signatureMatch) {
          const failedSignature = signatureMatch[1];
          await expect(failedSignature).toHaveFailed();
          await expect(failedSignature).toHaveFailedWith(/insufficient/i);
        }
      }
    });
  });

  describe('Program Testing Examples', () => {
    it('should test system program existence', async () => {
      // Test that system program is deployed
      await expect(SystemProgram.programId).toExistOnCluster();
      await expect(SystemProgram.programId).toBeDeployed();
    });

    it('should test program methods (mock example)', async () => {
      // Mock program object for demonstration
      const mockProgram = {
        programId: SystemProgram.programId,
        methods: {
          createAccount: () => ({}),
          transfer: () => ({}),
        },
        account: {
          systemAccount: {},
        }
      };

      await expect(mockProgram).toHaveMethod('createAccount');
      await expect(mockProgram).toHaveMethod('transfer');
      await expect(mockProgram).toHaveAccount('systemAccount');
      await expect(mockProgram).not.toHaveMethod('nonExistentMethod');
    });
  });

  describe('Advanced Examples', () => {
    it('should handle different number formats', async () => {
      if (!payer?.publicKey) return;
      
      const accountInfo = await connection.getAccountInfo(payer.publicKey);
      if (accountInfo) {
        const balance = accountInfo.lamports;
        
        // Test with different number formats
        await expect(payer.publicKey).toHaveBalance(balance); // number
        await expect(payer.publicKey).toHaveBalance(balance.toString()); // string
        // BN format would work too: new BN(balance)
      }
    });

    it('should test multiple accounts concurrently', async () => {
      // Test multiple accounts at once
      await Promise.all([
        expect(payer.publicKey).toExist(),
        expect(recipient.publicKey).toExist(),
        expect(payer.publicKey).toBeSystemAccount(),
        expect(recipient.publicKey).toBeSystemAccount(),
      ]);
    });
  });
});

// Export for use in other examples
export { payer, recipient };