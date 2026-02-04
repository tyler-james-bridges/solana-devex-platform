import { TransactionSignature, Connection, TransactionResponse } from '@solana/web3.js';
import type { MatcherContext } from '../types/blockchain';
import { getTestContext, waitForCondition, retry, toBN, formatAmount } from '../utils';

/**
 * Check if transaction is confirmed
 */
export async function toBeConfirmed(
  this: MatcherContext,
  signature: TransactionSignature
) {
  const { connection, commitment } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getSignatureStatus(signature);
      if (result.value === null) {
        throw new Error('Transaction not found');
      }
      return result.value;
    });

    const pass = response.confirmationStatus === 'confirmed' || 
                 response.confirmationStatus === 'finalized';

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toBeConfirmed', 'transaction');
        const status = response.confirmationStatus || 'unknown';
        
        if (pass) {
          return `${hint}\n\nExpected transaction ${signature} not to be confirmed, but it has status: ${status}`;
        } else {
          return `${hint}\n\nExpected transaction ${signature} to be confirmed, but it has status: ${status}`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeConfirmed', 'transaction');
        return `${hint}\n\nExpected transaction ${signature} to be confirmed, but failed to check status: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if transaction is finalized
 */
export async function toBeFinalized(
  this: MatcherContext,
  signature: TransactionSignature
) {
  const { connection } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getSignatureStatus(signature);
      if (result.value === null) {
        throw new Error('Transaction not found');
      }
      return result.value;
    });

    const pass = response.confirmationStatus === 'finalized';

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toBeFinalized', 'transaction');
        const status = response.confirmationStatus || 'unknown';
        
        if (pass) {
          return `${hint}\n\nExpected transaction ${signature} not to be finalized, but it has status: ${status}`;
        } else {
          return `${hint}\n\nExpected transaction ${signature} to be finalized, but it has status: ${status}`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeFinalized', 'transaction');
        return `${hint}\n\nExpected transaction ${signature} to be finalized, but failed to check status: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if transaction succeeded (no errors)
 */
export async function toHaveSucceeded(
  this: MatcherContext,
  signature: TransactionSignature
) {
  const { connection } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      if (result === null) {
        throw new Error('Transaction not found');
      }
      return result;
    });

    const pass = response.meta?.err === null;
    const error = response.meta?.err;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveSucceeded', 'transaction');
        
        if (pass) {
          return `${hint}\n\nExpected transaction ${signature} to have failed, but it succeeded`;
        } else {
          return `${hint}\n\nExpected transaction ${signature} to succeed, but it failed with error: ${JSON.stringify(error)}`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveSucceeded', 'transaction');
        return `${hint}\n\nExpected transaction ${signature} to succeed, but failed to check status: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if transaction failed
 */
export async function toHaveFailed(
  this: MatcherContext,
  signature: TransactionSignature
) {
  const result = await toHaveSucceeded.call(this, signature);
  return {
    pass: !result.pass,
    message: result.message
  };
}

/**
 * Check if transaction failed with specific error
 */
export async function toHaveFailedWith(
  this: MatcherContext,
  signature: TransactionSignature,
  errorMessage: string | RegExp
) {
  const { connection } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      if (result === null) {
        throw new Error('Transaction not found');
      }
      return result;
    });

    const error = response.meta?.err;
    
    if (error === null) {
      return {
        pass: false,
        message: () => {
          const hint = this.utils.matcherHint('toHaveFailedWith', 'transaction', 'errorMessage');
          return `${hint}\n\nExpected transaction ${signature} to fail with error matching "${errorMessage}", but it succeeded`;
        }
      };
    }

    const errorString = JSON.stringify(error);
    const pass = typeof errorMessage === 'string' 
      ? errorString.includes(errorMessage)
      : errorMessage.test(errorString);

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveFailedWith', 'transaction', 'errorMessage');
        const received = this.utils.printReceived(errorString);
        const expected = this.utils.printExpected(errorMessage.toString());
        
        return `${hint}\n\nTransaction: ${signature}\nExpected error: ${expected}\nReceived error: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveFailedWith', 'transaction', 'errorMessage');
        return `${hint}\n\nExpected transaction ${signature} to fail with error "${errorMessage}", but failed to check status: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if transaction consumed expected compute units
 */
export async function toHaveComputeUnitsConsumed(
  this: MatcherContext,
  signature: TransactionSignature,
  expectedUnits: number
) {
  const { connection } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      if (result === null) {
        throw new Error('Transaction not found');
      }
      return result;
    });

    const computeUnitsConsumed = response.meta?.computeUnitsConsumed;
    
    if (computeUnitsConsumed === undefined) {
      return {
        pass: false,
        message: () => {
          const hint = this.utils.matcherHint('toHaveComputeUnitsConsumed', 'transaction', 'expectedUnits');
          return `${hint}\n\nTransaction ${signature} does not have compute units information`;
        }
      };
    }

    const pass = computeUnitsConsumed === expectedUnits;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveComputeUnitsConsumed', 'transaction', 'expectedUnits');
        const received = this.utils.printReceived(computeUnitsConsumed);
        const expected = this.utils.printExpected(expectedUnits);
        
        return `${hint}\n\nTransaction: ${signature}\nExpected compute units: ${expected}\nReceived compute units: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveComputeUnitsConsumed', 'transaction', 'expectedUnits');
        return `${hint}\n\nExpected transaction ${signature} to consume ${expectedUnits} compute units, but failed to check: ${(error as Error).message}`;
      }
    };
  }
}

/**
 * Check if transaction had expected fee
 */
export async function toHaveTransactionFee(
  this: MatcherContext,
  signature: TransactionSignature,
  expectedFee: number
) {
  const { connection } = getTestContext();
  
  try {
    const response = await retry(async () => {
      const result = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      if (result === null) {
        throw new Error('Transaction not found');
      }
      return result;
    });

    const fee = response.meta?.fee;
    
    if (fee === undefined) {
      return {
        pass: false,
        message: () => {
          const hint = this.utils.matcherHint('toHaveTransactionFee', 'transaction', 'expectedFee');
          return `${hint}\n\nTransaction ${signature} does not have fee information`;
        }
      };
    }

    const pass = fee === expectedFee;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTransactionFee', 'transaction', 'expectedFee');
        const received = this.utils.printReceived(formatAmount(fee));
        const expected = this.utils.printExpected(formatAmount(expectedFee));
        
        return `${hint}\n\nTransaction: ${signature}\nExpected fee: ${expected}\nReceived fee: ${received}`;
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveTransactionFee', 'transaction', 'expectedFee');
        return `${hint}\n\nExpected transaction ${signature} to have fee ${formatAmount(expectedFee)}, but failed to check: ${(error as Error).message}`;
      }
    };
  }
}