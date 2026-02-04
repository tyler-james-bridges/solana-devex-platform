import { expect } from '@jest/globals';
import * as matchers from './matchers';

// Export all matchers for manual registration if needed
export * from './matchers';

// Export utility functions
export * from './utils';

// Export types
export * from './types/blockchain';

/**
 * Extend Jest's expect with blockchain matchers
 */
function extendJest() {
  // Extend Jest's expect with our custom matchers
  expect.extend({
    // Account matchers
    toHaveBalance: matchers.toHaveBalance,
    toHaveMinimumBalance: matchers.toHaveMinimumBalance,
    toHaveBalanceGreaterThan: matchers.toHaveBalanceGreaterThan,
    toHaveBalanceLessThan: matchers.toHaveBalanceLessThan,
    toExist: matchers.toExist,
    toNotExist: matchers.toNotExist,
    toHaveOwner: matchers.toHaveOwner,
    toHaveData: matchers.toHaveData,
    toHaveDataLength: matchers.toHaveDataLength,
    toBeSystemAccount: matchers.toBeSystemAccount,
    toBeTokenAccount: matchers.toBeTokenAccount,
    toBeProgramAccount: matchers.toBeProgramAccount,

    // Transaction matchers
    toBeConfirmed: matchers.toBeConfirmed,
    toBeFinalized: matchers.toBeFinalized,
    toHaveSucceeded: matchers.toHaveSucceeded,
    toHaveFailed: matchers.toHaveFailed,
    toHaveFailedWith: matchers.toHaveFailedWith,
    toHaveComputeUnitsConsumed: matchers.toHaveComputeUnitsConsumed,
    toHaveTransactionFee: matchers.toHaveTransactionFee,

    // Program matchers
    toExistOnCluster: matchers.toExistOnCluster,
    toBeDeployed: matchers.toBeDeployed,
    toHaveMethod: matchers.toHaveMethod,
    toHaveAccount: matchers.toHaveAccount,
    toHaveIdlMethod: matchers.toHaveIdlMethod,
    toHaveIdlAccount: matchers.toHaveIdlAccount,
    toBeUpgradeable: matchers.toBeUpgradeable,

    // Token matchers
    toHaveTokenBalance: matchers.toHaveTokenBalance,
    toHaveMintAuthority: matchers.toHaveMintAuthority,
    toHaveFreezeAuthority: matchers.toHaveFreezeAuthority,
    toHaveTokenSupply: matchers.toHaveTokenSupply,
    toHaveDecimals: matchers.toHaveDecimals,
    toBeFrozen: matchers.toBeFrozen,
    toHaveMint: matchers.toHaveMint,

    // Event matchers
    toHaveEmittedEvent: matchers.toHaveEmittedEvent,
    toHaveEmittedEvents: matchers.toHaveEmittedEvents,
  });
}

// Auto-extend Jest when this module is imported
extendJest();

// Also export the extend function for manual setup if needed
export { extendJest };

/**
 * Setup function for test environments
 */
export function setupBlockchainMatchers() {
  extendJest();
}

// For CommonJS compatibility
module.exports = {
  ...matchers,
  extendJest,
  setupBlockchainMatchers,
};