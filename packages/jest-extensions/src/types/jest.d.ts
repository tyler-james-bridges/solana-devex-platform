import type { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import type { Program, IdlAccounts } from '@coral-xyz/anchor';
import BN from 'bn.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      // Balance matchers
      toHaveBalance(expectedBalance: number | BN | string): R;
      toHaveMinimumBalance(minimumBalance: number | BN | string): R;
      toHaveBalanceGreaterThan(amount: number | BN | string): R;
      toHaveBalanceLessThan(amount: number | BN | string): R;
      
      // Account matchers
      toExist(): R;
      toNotExist(): R;
      toHaveOwner(expectedOwner: PublicKey | string): R;
      toHaveData(expectedData?: Buffer): R;
      toHaveDataLength(expectedLength: number): R;
      toBeSystemAccount(): R;
      toBeTokenAccount(): R;
      toBeProgramAccount(): R;
      
      // Transaction matchers
      toBeConfirmed(): R;
      toBeFinalized(): R;
      toHaveSucceeded(): R;
      toHaveFailed(): R;
      toHaveFailedWith(errorMessage: string | RegExp): R;
      toHaveComputeUnitsConsumed(expectedUnits: number): R;
      toHaveTransactionFee(expectedFee: number | BN): R;
      
      // Program matchers
      toExistOnCluster(): R;
      toBeDeployed(): R;
      toHaveMethod(methodName: string): R;
      toHaveAccount(accountName: string): R;
      
      // Token matchers
      toHaveTokenBalance(expectedBalance: number | BN | string): R;
      toHaveMintAuthority(expectedAuthority: PublicKey | string | null): R;
      toHaveFreezeAuthority(expectedAuthority: PublicKey | string | null): R;
      toHaveTokenSupply(expectedSupply: number | BN | string): R;
      toHaveDecimals(expectedDecimals: number): R;
      
      // Event matchers
      toHaveEmittedEvent(eventName: string, eventData?: any): R;
      toHaveEmittedEvents(events: Array<{ name: string; data?: any }>): R;
    }
  }
}