import type { Connection, PublicKey, Transaction, TransactionSignature, AccountInfo, Commitment } from '@solana/web3.js';
import type { Program, IdlAccounts, AnchorProvider } from '@coral-xyz/anchor';
import BN from 'bn.js';

export interface BlockchainTestContext {
  connection: Connection;
  provider?: AnchorProvider;
  commitment?: Commitment;
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
}

export interface AccountTestData {
  publicKey: PublicKey;
  accountInfo: AccountInfo<Buffer> | null;
  balance?: number | BN;
  owner?: PublicKey;
  data?: Buffer;
}

export interface TransactionTestData {
  signature: TransactionSignature;
  transaction?: Transaction;
  confirmed?: boolean;
  finalized?: boolean;
  success?: boolean;
  error?: string;
  computeUnitsConsumed?: number;
  fee?: number | BN;
}

export interface TokenTestData {
  mint: PublicKey;
  account?: PublicKey;
  balance?: number | BN;
  decimals?: number;
  supply?: number | BN;
  mintAuthority?: PublicKey | null;
  freezeAuthority?: PublicKey | null;
}

export interface ProgramTestData {
  programId: PublicKey;
  program?: Program;
  deployed?: boolean;
  methods?: string[];
  accounts?: string[];
}

export interface EventTestData {
  name: string;
  data: any;
  slot?: number;
  txSignature?: string;
}

export interface MatcherContext {
  isNot: boolean;
  promise: string;
  utils: {
    matcherHint: (
      matcherName: string,
      received?: string,
      expected?: string,
      options?: any
    ) => string;
    printReceived: (value: any) => string;
    printExpected: (value: any) => string;
  };
}

export type SolanaAmount = number | string | BN;