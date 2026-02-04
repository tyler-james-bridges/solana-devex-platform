import { PublicKey, AccountInfo } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { MatcherContext, SolanaAmount } from '../types/blockchain';
import { 
  getTestContext, 
  getAccountInfo, 
  toBN, 
  formatPublicKey, 
  formatAmount, 
  amountsEqual,
  toPublicKey 
} from '../utils';

/**
 * Check if token account has expected balance
 */
export async function toHaveTokenBalance(
  this: MatcherContext,
  tokenAccount: PublicKey | string,
  expectedBalance: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(tokenAccount);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenBalance', 'tokenAccount', 'expectedBalance');
        return `${hint}\n\nExpected token account ${formatPublicKey(publicKey)} to have balance ${formatAmount(expectedBalance)}, but account does not exist`;
      }
    };
  }

  // Verify this is a token account
  if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenBalance', 'tokenAccount', 'expectedBalance');
        return `${hint}\n\nAccount ${formatPublicKey(publicKey)} is not a token account (owner: ${formatPublicKey(accountInfo.owner)})`;
      }
    };
  }

  try {
    const tokenAccountData = AccountLayout.decode(accountInfo.data);
    const actualBalance = tokenAccountData.amount;
    const expectedBN = toBN(expectedBalance);
    const pass = amountsEqual(actualBalance.toString(), expectedBalance);

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenBalance', 'tokenAccount', 'expectedBalance');
        const received = this.utils.printReceived(formatAmount(actualBalance.toString(), 'tokens'));
        const expected = this.utils.printExpected(formatAmount(expectedBalance, 'tokens'));
        
        return `${hint}\n\nToken Account: ${formatPublicKey(publicKey)}\nExpected: ${expected}\nReceived: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenBalance', 'tokenAccount', 'expectedBalance');
        return `${hint}\n\nFailed to decode token account data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if mint has expected mint authority
 */
export async function toHaveMintAuthority(
  this: MatcherContext,
  mint: PublicKey | string,
  expectedAuthority: PublicKey | string | null
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(mint);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMintAuthority', 'mint', 'expectedAuthority');
        return `${hint}\n\nExpected mint ${formatPublicKey(publicKey)} to have mint authority, but mint does not exist`;
      }
    };
  }

  try {
    const mintData = MintLayout.decode(accountInfo.data);
    const actualAuthority = mintData.mintAuthorityOption ? mintData.mintAuthority : null;
    
    let pass: boolean;
    if (expectedAuthority === null) {
      pass = actualAuthority === null;
    } else {
      const expectedKey = toPublicKey(expectedAuthority);
      pass = actualAuthority !== null && actualAuthority.equals(expectedKey);
    }

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMintAuthority', 'mint', 'expectedAuthority');
        const receivedStr = actualAuthority ? formatPublicKey(actualAuthority) : 'null';
        const expectedStr = expectedAuthority ? formatPublicKey(expectedAuthority) : 'null';
        const received = this.utils.printReceived(receivedStr);
        const expected = this.utils.printExpected(expectedStr);
        
        return `${hint}\n\nMint: ${formatPublicKey(publicKey)}\nExpected authority: ${expected}\nReceived authority: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMintAuthority', 'mint', 'expectedAuthority');
        return `${hint}\n\nFailed to decode mint data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if mint has expected freeze authority
 */
export async function toHaveFreezeAuthority(
  this: MatcherContext,
  mint: PublicKey | string,
  expectedAuthority: PublicKey | string | null
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(mint);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveFreezeAuthority', 'mint', 'expectedAuthority');
        return `${hint}\n\nExpected mint ${formatPublicKey(publicKey)} to have freeze authority, but mint does not exist`;
      }
    };
  }

  try {
    const mintData = MintLayout.decode(accountInfo.data);
    const actualAuthority = mintData.freezeAuthorityOption ? mintData.freezeAuthority : null;
    
    let pass: boolean;
    if (expectedAuthority === null) {
      pass = actualAuthority === null;
    } else {
      const expectedKey = toPublicKey(expectedAuthority);
      pass = actualAuthority !== null && actualAuthority.equals(expectedKey);
    }

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveFreezeAuthority', 'mint', 'expectedAuthority');
        const receivedStr = actualAuthority ? formatPublicKey(actualAuthority) : 'null';
        const expectedStr = expectedAuthority ? formatPublicKey(expectedAuthority) : 'null';
        const received = this.utils.printReceived(receivedStr);
        const expected = this.utils.printExpected(expectedStr);
        
        return `${hint}\n\nMint: ${formatPublicKey(publicKey)}\nExpected authority: ${expected}\nReceived authority: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveFreezeAuthority', 'mint', 'expectedAuthority');
        return `${hint}\n\nFailed to decode mint data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if mint has expected total supply
 */
export async function toHaveTokenSupply(
  this: MatcherContext,
  mint: PublicKey | string,
  expectedSupply: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(mint);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenSupply', 'mint', 'expectedSupply');
        return `${hint}\n\nExpected mint ${formatPublicKey(publicKey)} to have supply ${formatAmount(expectedSupply)}, but mint does not exist`;
      }
    };
  }

  try {
    const mintData = MintLayout.decode(accountInfo.data);
    const actualSupply = mintData.supply;
    const pass = amountsEqual(actualSupply.toString(), expectedSupply);

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenSupply', 'mint', 'expectedSupply');
        const received = this.utils.printReceived(formatAmount(actualSupply.toString(), 'tokens'));
        const expected = this.utils.printExpected(formatAmount(expectedSupply, 'tokens'));
        
        return `${hint}\n\nMint: ${formatPublicKey(publicKey)}\nExpected supply: ${expected}\nReceived supply: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTokenSupply', 'mint', 'expectedSupply');
        return `${hint}\n\nFailed to decode mint data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if mint has expected decimals
 */
export async function toHaveDecimals(
  this: MatcherContext,
  mint: PublicKey | string,
  expectedDecimals: number
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(mint);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveDecimals', 'mint', 'expectedDecimals');
        return `${hint}\n\nExpected mint ${formatPublicKey(publicKey)} to have ${expectedDecimals} decimals, but mint does not exist`;
      }
    };
  }

  try {
    const mintData = MintLayout.decode(accountInfo.data);
    const actualDecimals = mintData.decimals;
    const pass = actualDecimals === expectedDecimals;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveDecimals', 'mint', 'expectedDecimals');
        const received = this.utils.printReceived(actualDecimals);
        const expected = this.utils.printExpected(expectedDecimals);
        
        return `${hint}\n\nMint: ${formatPublicKey(publicKey)}\nExpected decimals: ${expected}\nReceived decimals: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveDecimals', 'mint', 'expectedDecimals');
        return `${hint}\n\nFailed to decode mint data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if token account is frozen
 */
export async function toBeFrozen(
  this: MatcherContext,
  tokenAccount: PublicKey | string
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(tokenAccount);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeFrozen', 'tokenAccount');
        return `${hint}\n\nExpected token account ${formatPublicKey(publicKey)} to be frozen, but account does not exist`;
      }
    };
  }

  // Verify this is a token account
  if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeFrozen', 'tokenAccount');
        return `${hint}\n\nAccount ${formatPublicKey(publicKey)} is not a token account`;
      }
    };
  }

  try {
    const tokenAccountData = AccountLayout.decode(accountInfo.data);
    const pass = tokenAccountData.state === 2; // Frozen state

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toBeFrozen', 'tokenAccount');
        const state = tokenAccountData.state === 0 ? 'uninitialized' : 
                      tokenAccountData.state === 1 ? 'initialized' : 'frozen';
        
        if (pass) {
          return `${hint}\n\nExpected token account ${formatPublicKey(publicKey)} not to be frozen, but it is`;
        } else {
          return `${hint}\n\nExpected token account ${formatPublicKey(publicKey)} to be frozen, but it is ${state}`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeFrozen', 'tokenAccount');
        return `${hint}\n\nFailed to decode token account data: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if token account belongs to expected mint
 */
export async function toHaveMint(
  this: MatcherContext,
  tokenAccount: PublicKey | string,
  expectedMint: PublicKey | string
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(tokenAccount);
  const expectedMintKey = toPublicKey(expectedMint);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMint', 'tokenAccount', 'expectedMint');
        return `${hint}\n\nExpected token account ${formatPublicKey(publicKey)} to have mint ${formatPublicKey(expectedMintKey)}, but account does not exist`;
      }
    };
  }

  // Verify this is a token account
  if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMint', 'tokenAccount', 'expectedMint');
        return `${hint}\n\nAccount ${formatPublicKey(publicKey)} is not a token account`;
      }
    };
  }

  try {
    const tokenAccountData = AccountLayout.decode(accountInfo.data);
    const actualMint = tokenAccountData.mint;
    const pass = actualMint.equals(expectedMintKey);

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMint', 'tokenAccount', 'expectedMint');
        const received = this.utils.printReceived(formatPublicKey(actualMint));
        const expected = this.utils.printExpected(formatPublicKey(expectedMintKey));
        
        return `${hint}\n\nToken Account: ${formatPublicKey(publicKey)}\nExpected mint: ${expected}\nReceived mint: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMint', 'tokenAccount', 'expectedMint');
        return `${hint}\n\nFailed to decode token account data: ${(error as Error).message}`;
      }
    };
  }
}