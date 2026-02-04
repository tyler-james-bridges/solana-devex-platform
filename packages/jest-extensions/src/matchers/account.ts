import { PublicKey, AccountInfo, SystemProgram, TOKEN_PROGRAM_ID } from '@solana/web3.js';
import type { MatcherContext, SolanaAmount } from '../types/blockchain';
import { 
  getTestContext, 
  getAccountInfo, 
  toBN, 
  formatPublicKey, 
  formatAmount, 
  amountsEqual,
  isGreaterThan,
  isLessThan,
  toPublicKey 
} from '../utils';

/**
 * Check if account has expected balance
 */
export async function toHaveBalance(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  expectedBalance: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have balance ${formatAmount(expectedBalance)}, but account does not exist`
    };
  }

  const actualBalance = accountInfo.lamports;
  const expectedBN = toBN(expectedBalance);
  const actualBN = toBN(actualBalance);
  const pass = amountsEqual(actualBalance, expectedBalance);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveBalance', 'account', 'expectedBalance');
      const received = this.utils.printReceived(formatAmount(actualBalance));
      const expected = this.utils.printExpected(formatAmount(expectedBalance));
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected: ${expected}\nReceived: ${received}`;
    }
  };
}

/**
 * Check if account has minimum balance
 */
export async function toHaveMinimumBalance(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  minimumBalance: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have minimum balance ${formatAmount(minimumBalance)}, but account does not exist`
    };
  }

  const actualBalance = accountInfo.lamports;
  const pass = isGreaterThan(actualBalance, minimumBalance) || amountsEqual(actualBalance, minimumBalance);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveMinimumBalance', 'account', 'minimumBalance');
      const received = this.utils.printReceived(formatAmount(actualBalance));
      const expected = this.utils.printExpected(`>= ${formatAmount(minimumBalance)}`);
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected: ${expected}\nReceived: ${received}`;
    }
  };
}

/**
 * Check if account balance is greater than amount
 */
export async function toHaveBalanceGreaterThan(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  amount: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have balance greater than ${formatAmount(amount)}, but account does not exist`
    };
  }

  const actualBalance = accountInfo.lamports;
  const pass = isGreaterThan(actualBalance, amount);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveBalanceGreaterThan', 'account', 'amount');
      const received = this.utils.printReceived(formatAmount(actualBalance));
      const expected = this.utils.printExpected(`> ${formatAmount(amount)}`);
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected: ${expected}\nReceived: ${received}`;
    }
  };
}

/**
 * Check if account balance is less than amount
 */
export async function toHaveBalanceLessThan(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  amount: SolanaAmount
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: true, // Non-existent account has 0 balance, which might be less than amount
      message: () => 
        `Account ${formatPublicKey(publicKey)} does not exist (balance: 0 lamports)`
    };
  }

  const actualBalance = accountInfo.lamports;
  const pass = isLessThan(actualBalance, amount);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveBalanceLessThan', 'account', 'amount');
      const received = this.utils.printReceived(formatAmount(actualBalance));
      const expected = this.utils.printExpected(`< ${formatAmount(amount)}`);
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected: ${expected}\nReceived: ${received}`;
    }
  };
}

/**
 * Check if account exists
 */
export async function toExist(
  this: MatcherContext,
  receivedKey: PublicKey | string
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  const pass = accountInfo !== null;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toExist', 'account');
      
      if (pass) {
        return `${hint}\n\nExpected account ${formatPublicKey(publicKey)} not to exist, but it does`;
      } else {
        return `${hint}\n\nExpected account ${formatPublicKey(publicKey)} to exist, but it does not`;
      }
    }
  };
}

/**
 * Check if account does not exist
 */
export async function toNotExist(
  this: MatcherContext,
  receivedKey: PublicKey | string
) {
  const result = await toExist.call(this, receivedKey);
  return {
    pass: !result.pass,
    message: result.message
  };
}

/**
 * Check if account has expected owner
 */
export async function toHaveOwner(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  expectedOwner: PublicKey | string
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const expectedOwnerKey = toPublicKey(expectedOwner);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have owner ${formatPublicKey(expectedOwnerKey)}, but account does not exist`
    };
  }

  const actualOwner = accountInfo.owner;
  const pass = actualOwner.equals(expectedOwnerKey);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveOwner', 'account', 'expectedOwner');
      const received = this.utils.printReceived(formatPublicKey(actualOwner));
      const expected = this.utils.printExpected(formatPublicKey(expectedOwnerKey));
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected owner: ${expected}\nReceived owner: ${received}`;
    }
  };
}

/**
 * Check if account has expected data
 */
export async function toHaveData(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  expectedData?: Buffer
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have data, but account does not exist`
    };
  }

  const actualData = accountInfo.data;
  
  if (expectedData === undefined) {
    const pass = actualData.length > 0;
    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveData', 'account');
        return `${hint}\n\nExpected account ${formatPublicKey(publicKey)} to have data, but it has ${actualData.length} bytes`;
      }
    };
  }

  const pass = actualData.equals(expectedData);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveData', 'account', 'expectedData');
      const received = this.utils.printReceived(`${actualData.length} bytes`);
      const expected = this.utils.printExpected(`${expectedData.length} bytes`);
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected data: ${expected}\nReceived data: ${received}`;
    }
  };
}

/**
 * Check if account has expected data length
 */
export async function toHaveDataLength(
  this: MatcherContext,
  receivedKey: PublicKey | string,
  expectedLength: number
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to have data length ${expectedLength}, but account does not exist`
    };
  }

  const actualLength = accountInfo.data.length;
  const pass = actualLength === expectedLength;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveDataLength', 'account', 'expectedLength');
      const received = this.utils.printReceived(actualLength);
      const expected = this.utils.printExpected(expectedLength);
      
      return `${hint}\n\nAccount: ${formatPublicKey(publicKey)}\nExpected length: ${expected}\nReceived length: ${received}`;
    }
  };
}

/**
 * Check if account is a system account
 */
export async function toBeSystemAccount(
  this: MatcherContext,
  receivedKey: PublicKey | string
) {
  return await toHaveOwner.call(this, receivedKey, SystemProgram.programId);
}

/**
 * Check if account is a token account
 */
export async function toBeTokenAccount(
  this: MatcherContext,
  receivedKey: PublicKey | string
) {
  return await toHaveOwner.call(this, receivedKey, TOKEN_PROGRAM_ID);
}

/**
 * Check if account is a program account
 */
export async function toBeProgramAccount(
  this: MatcherContext,
  receivedKey: PublicKey | string
) {
  const { connection } = getTestContext();
  const publicKey = toPublicKey(receivedKey);
  const accountInfo = await getAccountInfo(connection, publicKey);
  
  if (!accountInfo) {
    return {
      pass: false,
      message: () => 
        `Expected account ${formatPublicKey(publicKey)} to be a program account, but account does not exist`
    };
  }

  const pass = accountInfo.executable;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toBeProgramAccount', 'account');
      
      if (pass) {
        return `${hint}\n\nExpected account ${formatPublicKey(publicKey)} not to be executable (program account), but it is`;
      } else {
        return `${hint}\n\nExpected account ${formatPublicKey(publicKey)} to be executable (program account), but it is not`;
      }
    }
  };
}