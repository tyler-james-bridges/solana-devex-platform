import { PublicKey, Connection, AccountInfo, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import type { SolanaAmount } from '../types/blockchain';

/**
 * Convert various amount formats to BN for consistent comparison
 */
export function toBN(amount: SolanaAmount): BN {
  if (amount instanceof BN) {
    return amount;
  }
  
  if (typeof amount === 'string') {
    return new BN(amount);
  }
  
  if (typeof amount === 'number') {
    return new BN(amount);
  }
  
  throw new Error(`Invalid amount type: ${typeof amount}`);
}

/**
 * Convert lamports to SOL for display
 */
export function lamportsToSol(lamports: number | BN): number {
  const bn = toBN(lamports);
  return bn.toNumber() / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): BN {
  return new BN(Math.floor(sol * LAMPORTS_PER_SOL));
}

/**
 * Format PublicKey for display in error messages
 */
export function formatPublicKey(publicKey: PublicKey | string): string {
  const key = typeof publicKey === 'string' ? publicKey : publicKey.toBase58();
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
}

/**
 * Safely get account info with proper error handling
 */
export async function getAccountInfo(
  connection: Connection,
  publicKey: PublicKey,
  commitment?: any
): Promise<AccountInfo<Buffer> | null> {
  try {
    return await connection.getAccountInfo(publicKey, commitment);
  } catch (error) {
    console.warn(`Failed to fetch account info for ${formatPublicKey(publicKey)}:`, error);
    return null;
  }
}

/**
 * Check if a PublicKey is valid
 */
export function isValidPublicKey(value: any): value is PublicKey {
  try {
    if (typeof value === 'string') {
      new PublicKey(value);
      return true;
    }
    return value instanceof PublicKey;
  } catch {
    return false;
  }
}

/**
 * Create a PublicKey from string or return existing PublicKey
 */
export function toPublicKey(value: string | PublicKey): PublicKey {
  if (typeof value === 'string') {
    return new PublicKey(value);
  }
  return value;
}

/**
 * Format amount for display in error messages
 */
export function formatAmount(amount: SolanaAmount, unit: string = 'lamports'): string {
  const bn = toBN(amount);
  
  if (unit === 'SOL') {
    return `${lamportsToSol(bn)} SOL`;
  }
  
  return `${bn.toString()} ${unit}`;
}

/**
 * Compare two amounts for equality
 */
export function amountsEqual(a: SolanaAmount, b: SolanaAmount): boolean {
  return toBN(a).eq(toBN(b));
}

/**
 * Check if amount a is greater than amount b
 */
export function isGreaterThan(a: SolanaAmount, b: SolanaAmount): boolean {
  return toBN(a).gt(toBN(b));
}

/**
 * Check if amount a is less than amount b
 */
export function isLessThan(a: SolanaAmount, b: SolanaAmount): boolean {
  return toBN(a).lt(toBN(b));
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeoutMs: number = 30000,
  intervalMs: number = 1000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await sleep(intervalMs);
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}