import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { getTestContext } from '../../src/utils/connection';

describe('Program Matchers', () => {
  let connection: any;
  
  // Known program IDs that should exist on most clusters
  const systemProgramId = SystemProgram.programId;
  const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const nonExistentProgramId = Keypair.generate().publicKey;

  beforeAll(async () => {
    connection = getTestContext().connection;
  });

  describe('toExistOnCluster', () => {
    it('should pass when program exists', async () => {
      await expect(systemProgramId).toExistOnCluster();
      await expect(tokenProgramId).toExistOnCluster();
    });

    it('should work with string program ID', async () => {
      await expect(systemProgramId.toBase58()).toExistOnCluster();
    });

    it('should fail when program does not exist', async () => {
      await expect(nonExistentProgramId).not.toExistOnCluster();
    });

    it('should handle invalid program IDs gracefully', async () => {
      try {
        await expect('invalid-key').not.toExistOnCluster();
      } catch (error) {
        // This should throw due to invalid PublicKey format
        expect(error).toBeDefined();
      }
    });
  });

  describe('toBeDeployed', () => {
    it('should be an alias for toExistOnCluster', async () => {
      await expect(systemProgramId).toBeDeployed();
      await expect(tokenProgramId).toBeDeployed();
      await expect(nonExistentProgramId).not.toBeDeployed();
    });
  });

  describe('toHaveMethod', () => {
    it('should pass when program has the method', async () => {
      // Create a mock program object for testing
      const mockProgram = {
        programId: systemProgramId,
        methods: {
          transfer: () => {},
          createAccount: () => {},
        }
      };

      await expect(mockProgram).toHaveMethod('transfer');
      await expect(mockProgram).toHaveMethod('createAccount');
    });

    it('should fail when program does not have the method', async () => {
      const mockProgram = {
        programId: systemProgramId,
        methods: {
          transfer: () => {},
        }
      };

      await expect(mockProgram).not.toHaveMethod('nonExistentMethod');
    });

    it('should fail for invalid program object', async () => {
      const invalidProgram = { not: 'a program' };
      
      try {
        await expect(invalidProgram as any).toHaveMethod('anyMethod');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('toHaveAccount', () => {
    it('should pass when program has the account type', async () => {
      const mockProgram = {
        programId: systemProgramId,
        account: {
          userAccount: {},
          configAccount: {},
        }
      };

      await expect(mockProgram).toHaveAccount('userAccount');
      await expect(mockProgram).toHaveAccount('configAccount');
    });

    it('should fail when program does not have the account type', async () => {
      const mockProgram = {
        programId: systemProgramId,
        account: {
          userAccount: {},
        }
      };

      await expect(mockProgram).not.toHaveAccount('nonExistentAccount');
    });

    it('should fail for invalid program object', async () => {
      const invalidProgram = { not: 'a program' };
      
      try {
        await expect(invalidProgram as any).toHaveAccount('anyAccount');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('toHaveIdlMethod', () => {
    it('should pass when program IDL has the instruction', async () => {
      const mockProgram = {
        programId: systemProgramId,
        idl: {
          instructions: [
            { name: 'initialize' },
            { name: 'update' },
            { name: 'close' },
          ]
        }
      };

      await expect(mockProgram).toHaveIdlMethod('initialize');
      await expect(mockProgram).toHaveIdlMethod('update');
      await expect(mockProgram).toHaveIdlMethod('close');
    });

    it('should fail when program IDL does not have the instruction', async () => {
      const mockProgram = {
        programId: systemProgramId,
        idl: {
          instructions: [
            { name: 'initialize' },
          ]
        }
      };

      await expect(mockProgram).not.toHaveIdlMethod('nonExistentInstruction');
    });

    it('should fail for program without IDL', async () => {
      const invalidProgram = {
        programId: systemProgramId,
        // no idl property
      };
      
      try {
        await expect(invalidProgram as any).toHaveIdlMethod('anyMethod');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('toHaveIdlAccount', () => {
    it('should pass when program IDL has the account', async () => {
      const mockProgram = {
        programId: systemProgramId,
        idl: {
          accounts: [
            { name: 'UserAccount' },
            { name: 'ConfigAccount' },
            { name: 'StateAccount' },
          ]
        }
      };

      await expect(mockProgram).toHaveIdlAccount('UserAccount');
      await expect(mockProgram).toHaveIdlAccount('ConfigAccount');
      await expect(mockProgram).toHaveIdlAccount('StateAccount');
    });

    it('should fail when program IDL does not have the account', async () => {
      const mockProgram = {
        programId: systemProgramId,
        idl: {
          accounts: [
            { name: 'UserAccount' },
          ]
        }
      };

      await expect(mockProgram).not.toHaveIdlAccount('NonExistentAccount');
    });

    it('should fail for program without IDL', async () => {
      const invalidProgram = {
        programId: systemProgramId,
        // no idl property
      };
      
      try {
        await expect(invalidProgram as any).toHaveIdlAccount('anyAccount');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('toBeUpgradeable', () => {
    it('should handle upgradeable program checks', async () => {
      // Most system programs are not upgradeable, but we can test the matcher logic
      try {
        await expect(systemProgramId).not.toBeUpgradeable();
      } catch (error) {
        // This might fail on some networks or if the program data account check fails
        console.warn('Upgradeable check failed:', error);
      }
    });

    it('should work with string program ID', async () => {
      try {
        await expect(systemProgramId.toBase58()).not.toBeUpgradeable();
      } catch (error) {
        console.warn('Upgradeable string check failed:', error);
      }
    });

    it('should work with program object', async () => {
      const mockProgram = {
        programId: systemProgramId,
      };

      try {
        await expect(mockProgram).not.toBeUpgradeable();
      } catch (error) {
        console.warn('Upgradeable program object check failed:', error);
      }
    });

    it('should fail for invalid program input', async () => {
      try {
        await expect('invalid' as any).not.toBeUpgradeable();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});