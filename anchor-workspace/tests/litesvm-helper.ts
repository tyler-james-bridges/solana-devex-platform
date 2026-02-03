import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { LiteSvm } from 'litesvm';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

export interface LiteTestEnvironment {
  liteSvm: LiteSvm;
  connection: Connection;
  provider: anchor.AnchorProvider;
  payer: Keypair;
  program: anchor.Program<any>;
}

export class LiteSVMTestSuite {
  private static instance: LiteSVMTestSuite;
  private liteSvm: LiteSvm | null = null;

  static getInstance(): LiteSVMTestSuite {
    if (!this.instance) {
      this.instance = new LiteSVMTestSuite();
    }
    return this.instance;
  }

  /**
   * Initialize LiteSVM with optimal settings for fast testing
   */
  async initializeLiteSVM(): Promise<LiteTestEnvironment> {
    // Initialize LiteSVM with fast settings
    this.liteSvm = new LiteSvm({
      accountsDbSkipShrink: true,
      accountsDbTestSkipRewrites: true,
      fastMode: true,
      accountCompression: false,
    });

    // Create connection to LiteSVM
    const connection = new Connection('http://localhost:8899', 'confirmed');
    
    // Create payer keypair
    const payer = Keypair.generate();
    
    // Fund payer account
    await this.liteSvm.airdrop(payer.publicKey, 1000 * anchor.web3.LAMPORTS_PER_SOL);

    // Set up Anchor provider
    const wallet = new NodeWallet(payer);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    });

    anchor.setProvider(provider);

    // This will be set by individual tests
    const program = null as any;

    return {
      liteSvm: this.liteSvm,
      connection,
      provider,
      payer,
      program,
    };
  }

  /**
   * Load and deploy a program to LiteSVM
   */
  async deployProgram(
    env: LiteTestEnvironment, 
    programPath: string, 
    programId?: PublicKey
  ): Promise<PublicKey> {
    if (!this.liteSvm) {
      throw new Error('LiteSVM not initialized');
    }

    const deployedProgramId = programId || Keypair.generate().publicKey;
    
    // In a real implementation, you'd read the program binary and deploy it
    // For now, this is a placeholder for the deployment logic
    console.log(`Deploying program ${programPath} to ${deployedProgramId.toString()}`);
    
    return deployedProgramId;
  }

  /**
   * Create test tokens for protocol testing
   */
  async createTestTokens(env: LiteTestEnvironment, count: number = 2): Promise<PublicKey[]> {
    const tokens: PublicKey[] = [];
    
    for (let i = 0; i < count; i++) {
      const mint = Keypair.generate();
      tokens.push(mint.publicKey);
      
      // Create mint account
      // In real implementation, use @solana/spl-token
      console.log(`Created test token mint: ${mint.publicKey.toString()}`);
    }
    
    return tokens;
  }

  /**
   * Setup test accounts with realistic balances
   */
  async setupTestAccounts(
    env: LiteTestEnvironment, 
    accounts: { publicKey: PublicKey; lamports?: number }[]
  ): Promise<void> {
    if (!this.liteSvm) return;

    for (const account of accounts) {
      const lamports = account.lamports || 1 * anchor.web3.LAMPORTS_PER_SOL;
      await this.liteSvm.airdrop(account.publicKey, lamports);
    }
  }

  /**
   * Fast forward slots for testing time-based logic
   */
  async fastForwardSlots(slots: number): Promise<void> {
    if (!this.liteSvm) return;
    
    // LiteSVM doesn't have time progression in the same way
    // This would need to be implemented based on your specific needs
    console.log(`Fast forwarding ${slots} slots`);
  }

  /**
   * Clean up LiteSVM instance
   */
  async cleanup(): Promise<void> {
    if (this.liteSvm) {
      // Cleanup if needed
      this.liteSvm = null;
    }
  }

  /**
   * Create a snapshot for quick test resets
   */
  async createSnapshot(): Promise<string> {
    // LiteSVM snapshot functionality would go here
    return 'snapshot_id';
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    console.log(`Restoring snapshot: ${snapshotId}`);
  }

  /**
   * Utility to fund multiple accounts quickly
   */
  async fundAccounts(accounts: PublicKey[], amount: number = 1): Promise<void> {
    if (!this.liteSvm) return;

    const promises = accounts.map(account => 
      this.liteSvm!.airdrop(account, amount * anchor.web3.LAMPORTS_PER_SOL)
    );
    
    await Promise.all(promises);
  }
}

/**
 * Test decorator for setting up LiteSVM environment
 */
export function withLiteSVM() {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const testSuite = LiteSVMTestSuite.getInstance();
      const env = await testSuite.initializeLiteSVM();
      
      try {
        return await method.apply(this, [env, ...args]);
      } finally {
        await testSuite.cleanup();
      }
    };
  };
}

/**
 * Quick setup function for simple tests
 */
export async function quickSetup(): Promise<LiteTestEnvironment> {
  const testSuite = LiteSVMTestSuite.getInstance();
  return await testSuite.initializeLiteSVM();
}