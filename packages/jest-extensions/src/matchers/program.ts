import { PublicKey } from '@solana/web3.js';
import type { Program } from '@coral-xyz/anchor';
import type { MatcherContext } from '../types/blockchain';
import { getTestContext, getAccountInfo, formatPublicKey, toPublicKey } from '../utils';

/**
 * Check if program exists on the cluster
 */
export async function toExistOnCluster(
  this: MatcherContext,
  programId: PublicKey | string | Program
) {
  const { connection } = getTestContext();
  
  // Extract PublicKey from various input types
  let publicKey: PublicKey;
  if (typeof programId === 'string') {
    publicKey = new PublicKey(programId);
  } else if (programId instanceof PublicKey) {
    publicKey = programId;
  } else if (programId && typeof programId === 'object' && 'programId' in programId) {
    publicKey = (programId as Program).programId;
  } else {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toExistOnCluster', 'program');
        return `${hint}\n\nInvalid program identifier provided`;
      }
    };
  }

  const accountInfo = await getAccountInfo(connection, publicKey);
  const pass = accountInfo !== null && accountInfo.executable;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toExistOnCluster', 'program');
      
      if (accountInfo === null) {
        return `${hint}\n\nExpected program ${formatPublicKey(publicKey)} to exist on cluster, but account was not found`;
      }
      
      if (!accountInfo.executable) {
        return `${hint}\n\nExpected program ${formatPublicKey(publicKey)} to be executable, but account exists and is not executable`;
      }
      
      if (pass) {
        return `${hint}\n\nExpected program ${formatPublicKey(publicKey)} not to exist on cluster, but it does`;
      } else {
        return `${hint}\n\nExpected program ${formatPublicKey(publicKey)} to exist on cluster, but it does not`;
      }
    }
  };
}

/**
 * Alias for toExistOnCluster for better semantics
 */
export async function toBeDeployed(
  this: MatcherContext,
  programId: PublicKey | string | Program
) {
  return await toExistOnCluster.call(this, programId);
}

/**
 * Check if Anchor program has a specific method
 */
export async function toHaveMethod(
  this: MatcherContext,
  program: Program,
  methodName: string
) {
  if (!program || typeof program !== 'object' || !('methods' in program)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveMethod', 'program', 'methodName');
        return `${hint}\n\nExpected a valid Anchor Program instance`;
      }
    };
  }

  const methods = program.methods as Record<string, any>;
  const pass = methodName in methods && typeof methods[methodName] === 'function';

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveMethod', 'program', 'methodName');
      const programId = formatPublicKey(program.programId);
      
      if (pass) {
        return `${hint}\n\nExpected program ${programId} not to have method "${methodName}", but it does`;
      } else {
        const availableMethods = Object.keys(methods);
        const methodsList = availableMethods.length > 0 
          ? `Available methods: ${availableMethods.join(', ')}`
          : 'No methods available';
        
        return `${hint}\n\nExpected program ${programId} to have method "${methodName}", but it does not\n${methodsList}`;
      }
    }
  };
}

/**
 * Check if Anchor program has a specific account type
 */
export async function toHaveAccount(
  this: MatcherContext,
  program: Program,
  accountName: string
) {
  if (!program || typeof program !== 'object' || !('account' in program)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveAccount', 'program', 'accountName');
        return `${hint}\n\nExpected a valid Anchor Program instance`;
      }
    };
  }

  const accounts = program.account as Record<string, any>;
  const pass = accountName in accounts;

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveAccount', 'program', 'accountName');
      const programId = formatPublicKey(program.programId);
      
      if (pass) {
        return `${hint}\n\nExpected program ${programId} not to have account "${accountName}", but it does`;
      } else {
        const availableAccounts = Object.keys(accounts);
        const accountsList = availableAccounts.length > 0 
          ? `Available accounts: ${availableAccounts.join(', ')}`
          : 'No accounts available';
        
        return `${hint}\n\nExpected program ${programId} to have account "${accountName}", but it does not\n${accountsList}`;
      }
    }
  };
}

/**
 * Check if program has specific IDL structure
 */
export async function toHaveIdlMethod(
  this: MatcherContext,
  program: Program,
  methodName: string
) {
  if (!program || typeof program !== 'object' || !('idl' in program)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveIdlMethod', 'program', 'methodName');
        return `${hint}\n\nExpected a valid Anchor Program instance with IDL`;
      }
    };
  }

  const idl = (program as any).idl;
  const instructions = idl?.instructions || [];
  const pass = instructions.some((instruction: any) => instruction.name === methodName);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveIdlMethod', 'program', 'methodName');
      const programId = formatPublicKey(program.programId);
      
      if (pass) {
        return `${hint}\n\nExpected program ${programId} IDL not to have instruction "${methodName}", but it does`;
      } else {
        const availableInstructions = instructions.map((inst: any) => inst.name);
        const instructionsList = availableInstructions.length > 0 
          ? `Available instructions: ${availableInstructions.join(', ')}`
          : 'No instructions available';
        
        return `${hint}\n\nExpected program ${programId} IDL to have instruction "${methodName}", but it does not\n${instructionsList}`;
      }
    }
  };
}

/**
 * Check if program has specific IDL account
 */
export async function toHaveIdlAccount(
  this: MatcherContext,
  program: Program,
  accountName: string
) {
  if (!program || typeof program !== 'object' || !('idl' in program)) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toHaveIdlAccount', 'program', 'accountName');
        return `${hint}\n\nExpected a valid Anchor Program instance with IDL`;
      }
    };
  }

  const idl = (program as any).idl;
  const accounts = idl?.accounts || [];
  const pass = accounts.some((account: any) => account.name === accountName);

  return {
    pass,
    message: () => {
      const hint = this.utils.matcherHint('toHaveIdlAccount', 'program', 'accountName');
      const programId = formatPublicKey(program.programId);
      
      if (pass) {
        return `${hint}\n\nExpected program ${programId} IDL not to have account "${accountName}", but it does`;
      } else {
        const availableAccounts = accounts.map((acc: any) => acc.name);
        const accountsList = availableAccounts.length > 0 
          ? `Available accounts: ${availableAccounts.join(', ')}`
          : 'No accounts available';
        
        return `${hint}\n\nExpected program ${programId} IDL to have account "${accountName}", but it does not\n${accountsList}`;
      }
    }
  };
}

/**
 * Check if program can be upgraded (has upgrade authority)
 */
export async function toBeUpgradeable(
  this: MatcherContext,
  programId: PublicKey | string | Program
) {
  const { connection } = getTestContext();
  
  // Extract PublicKey from various input types
  let publicKey: PublicKey;
  if (typeof programId === 'string') {
    publicKey = new PublicKey(programId);
  } else if (programId instanceof PublicKey) {
    publicKey = programId;
  } else if (programId && typeof programId === 'object' && 'programId' in programId) {
    publicKey = (programId as Program).programId;
  } else {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeUpgradeable', 'program');
        return `${hint}\n\nInvalid program identifier provided`;
      }
    };
  }

  try {
    // Get program data account (ProgramData account for upgradeable programs)
    const programDataAddress = PublicKey.findProgramAddressSync(
      [publicKey.toBuffer()],
      new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111') // BPF Loader Upgradeable Program ID
    )[0];

    const programDataAccount = await getAccountInfo(connection, programDataAddress);
    const pass = programDataAccount !== null;

    return {
      pass,
      message: () => {
        const hint = this.utils.matcherHint('toBeUpgradeable', 'program');
        const programIdStr = formatPublicKey(publicKey);
        
        if (pass) {
          return `${hint}\n\nExpected program ${programIdStr} not to be upgradeable, but it has a program data account`;
        } else {
          return `${hint}\n\nExpected program ${programIdStr} to be upgradeable, but no program data account found`;
        }
      }
    };
  } catch (error) {
    return {
      pass: false,
      message: () => {
        const hint = this.utils.matcherHint('toBeUpgradeable', 'program');
        return `${hint}\n\nFailed to check if program is upgradeable: ${(error as Error).message}`;
      }
    };
  }
}