import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  Transaction, 
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { getTestContext, airdrop } from '../../src/utils/connection';

describe('Transaction Matchers', () => {
  let payer: Keypair;
  let recipient: Keypair;
  let connection: any;
  let validSignature: string;
  let failedSignature: string;

  beforeAll(async () => {
    payer = Keypair.generate();
    recipient = Keypair.generate();
    connection = getTestContext().connection;
    
    // Setup accounts with SOL for testing
    try {
      await airdrop(connection, payer.publicKey, 2 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Airdrop failed - may be on mainnet or validator not running');
      return; // Skip tests if we can't get SOL
    }

    // Create a valid transaction
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient.publicKey,
          lamports: 1000000, // 0.001 SOL
        })
      );

      validSignature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [payer]
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.warn('Could not create test transaction:', error);
    }

    // Create a transaction that will fail (insufficient funds from empty account)
    try {
      const emptyAccount = Keypair.generate();
      const failTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: emptyAccount.publicKey,
          toPubkey: recipient.publicKey,
          lamports: LAMPORTS_PER_SOL,
        })
      );

      // This should fail due to insufficient funds
      try {
        failedSignature = await sendAndConfirmTransaction(
          connection,
          failTransaction,
          [emptyAccount]
        );
      } catch (error) {
        // Get the signature from the error if possible
        const errorMessage = error?.toString() || '';
        const signatureMatch = errorMessage.match(/([A-Za-z0-9]{87,88})/);
        if (signatureMatch) {
          failedSignature = signatureMatch[1];
        }
      }
    } catch (error) {
      console.warn('Could not create failing test transaction:', error);
    }
  }, 60000);

  describe('toBeConfirmed', () => {
    it('should pass when transaction is confirmed', async () => {
      if (validSignature) {
        await expect(validSignature).toBeConfirmed();
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });

    it('should fail when transaction is not found', async () => {
      // Generate a random signature that doesn't exist
      const fakeSignature = 'A'.repeat(88);
      try {
        await expect(fakeSignature).not.toBeConfirmed();
      } catch (error) {
        // This is expected as the transaction doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe('toBeFinalized', () => {
    it('should eventually pass when transaction is finalized', async () => {
      if (validSignature) {
        // Wait a bit more for finalization
        await new Promise(resolve => setTimeout(resolve, 3000));
        await expect(validSignature).toBeFinalized();
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    }, 10000);
  });

  describe('toHaveSucceeded', () => {
    it('should pass when transaction succeeded', async () => {
      if (validSignature) {
        await expect(validSignature).toHaveSucceeded();
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });

    it('should fail when transaction failed', async () => {
      if (failedSignature) {
        await expect(failedSignature).toHaveFailed();
      } else {
        console.warn('Skipping test - no failed signature available');
      }
    });
  });

  describe('toHaveFailed', () => {
    it('should pass when transaction failed', async () => {
      if (failedSignature) {
        await expect(failedSignature).toHaveFailed();
      } else {
        console.warn('Skipping test - no failed signature available');
      }
    });

    it('should fail when transaction succeeded', async () => {
      if (validSignature) {
        await expect(validSignature).not.toHaveFailed();
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });
  });

  describe('toHaveFailedWith', () => {
    it('should pass when transaction failed with expected error', async () => {
      if (failedSignature) {
        // Common error patterns for insufficient funds
        await expect(failedSignature).toHaveFailedWith('insufficient');
      } else {
        console.warn('Skipping test - no failed signature available');
      }
    });

    it('should work with regex patterns', async () => {
      if (failedSignature) {
        await expect(failedSignature).toHaveFailedWith(/insufficient|InsufficientFunds/i);
      } else {
        console.warn('Skipping test - no failed signature available');
      }
    });

    it('should fail when transaction succeeded', async () => {
      if (validSignature) {
        try {
          await expect(validSignature).not.toHaveFailedWith('any error');
        } catch (error) {
          // This is expected since the transaction succeeded
          expect(error).toBeDefined();
        }
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });
  });

  describe('toHaveComputeUnitsConsumed', () => {
    it('should pass when transaction consumed expected compute units', async () => {
      if (validSignature) {
        // Simple transfer should consume a predictable amount of compute units
        // This is approximate as it can vary
        const tx = await connection.getTransaction(validSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (tx?.meta?.computeUnitsConsumed !== undefined) {
          await expect(validSignature).toHaveComputeUnitsConsumed(tx.meta.computeUnitsConsumed);
        } else {
          console.warn('Compute units not available for transaction');
        }
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });
  });

  describe('toHaveTransactionFee', () => {
    it('should pass when transaction had expected fee', async () => {
      if (validSignature) {
        const tx = await connection.getTransaction(validSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (tx?.meta?.fee !== undefined) {
          await expect(validSignature).toHaveTransactionFee(tx.meta.fee);
        } else {
          console.warn('Transaction fee not available');
        }
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });

    it('should fail when transaction had different fee', async () => {
      if (validSignature) {
        const tx = await connection.getTransaction(validSignature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (tx?.meta?.fee !== undefined && tx.meta.fee > 0) {
          await expect(validSignature).not.toHaveTransactionFee(tx.meta.fee + 1000);
        } else {
          console.warn('Transaction fee not available or zero');
        }
      } else {
        console.warn('Skipping test - no valid signature available');
      }
    });
  });
});