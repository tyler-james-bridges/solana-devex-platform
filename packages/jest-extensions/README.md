# Jest Blockchain Extensions

[![npm version](https://badge.fury.io/js/jest-blockchain-extensions.svg)](https://badge.fury.io/js/jest-blockchain-extensions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Jest custom matchers and utilities for Solana blockchain testing. Extends Jest with blockchain-specific assertions that make testing smart contracts, accounts, transactions, and tokens intuitive and expressive.

## Features

- 🎯 **Account Matchers**: Test account balances, ownership, data, and existence
- 🔄 **Transaction Matchers**: Verify transaction confirmation, success, failure, and properties
- 📦 **Program Matchers**: Check program deployment, methods, accounts, and IDL structure
- 🪙 **Token Matchers**: Test SPL token balances, mint properties, and authorities
- 📡 **Event Matchers**: Assert on Anchor program events
- ⚡ **Anchor Integration**: Seamless compatibility with Anchor framework
- 🧪 **Test Utilities**: Connection management and blockchain test setup
- 📝 **TypeScript Support**: Full type definitions for all matchers

## Installation

```bash
npm install --save-dev jest-blockchain-extensions
```

## Quick Start

### 1. Setup Jest Configuration

Add to your `jest.config.js`:

```javascript
module.exports = {
  // ... your existing config
  setupFilesAfterEnv: ['jest-blockchain-extensions/setup']
};
```

Or manually import in your test files:

```typescript
import 'jest-blockchain-extensions';
```

### 2. Initialize Test Environment

```typescript
import { initializeTestEnvironment } from 'jest-blockchain-extensions';

beforeAll(async () => {
  initializeTestEnvironment({
    endpoint: 'http://localhost:8899', // Your RPC endpoint
    cluster: 'localnet',
    commitment: 'confirmed'
  });
});
```

### 3. Start Testing!

```typescript
describe('My Solana Program', () => {
  it('should have correct account balances', async () => {
    await expect(userAccount).toExist();
    await expect(userAccount).toHaveBalance(1000000); // 0.001 SOL
    await expect(userAccount).toBeSystemAccount();
  });

  it('should confirm transactions', async () => {
    const signature = await sendTransaction(/* ... */);
    await expect(signature).toBeConfirmed();
    await expect(signature).toHaveSucceeded();
  });
});
```

## Account Matchers

### Basic Account Testing

```typescript
// Account existence
await expect(publicKey).toExist();
await expect(publicKey).not.toExist();

// Balance testing
await expect(account).toHaveBalance(1000000); // Exact balance in lamports
await expect(account).toHaveMinimumBalance(500000); // At least this much
await expect(account).toHaveBalanceGreaterThan(100000);
await expect(account).toHaveBalanceLessThan(2000000);

// Ownership and type
await expect(account).toHaveOwner(SystemProgram.programId);
await expect(account).toBeSystemAccount();
await expect(tokenAccount).toBeTokenAccount();
await expect(program).toBeProgramAccount();

// Data properties
await expect(account).toHaveData(); // Has any data
await expect(account).toHaveData(expectedBuffer); // Specific data
await expect(account).toHaveDataLength(100);
```

### Advanced Examples

```typescript
// Multiple format support
await expect(account).toHaveBalance('1000000'); // String
await expect(account).toHaveBalance(new BN(1000000)); // BN
await expect(account).toHaveBalance(1000000); // Number

// String public keys work too
await expect('So11111111111111111111111111111111111111112').toExist();
```

## Transaction Matchers

### Transaction Status

```typescript
// Confirmation status
await expect(signature).toBeConfirmed();
await expect(signature).toBeFinalized();

// Success/failure
await expect(signature).toHaveSucceeded();
await expect(signature).toHaveFailed();
await expect(signature).toHaveFailedWith('Insufficient funds');
await expect(signature).toHaveFailedWith(/insufficient/i); // Regex

// Transaction properties
await expect(signature).toHaveComputeUnitsConsumed(2000);
await expect(signature).toHaveTransactionFee(5000);
```

### Real-world Example

```typescript
describe('Token Transfer', () => {
  it('should transfer tokens successfully', async () => {
    const signature = await transferTokens(
      connection,
      fromAccount,
      toAccount,
      amount,
      payer
    );

    await expect(signature).toBeConfirmed();
    await expect(signature).toHaveSucceeded();
    await expect(signature).toHaveComputeUnitsConsumed(expect.any(Number));
    
    // Check resulting balances
    await expect(fromTokenAccount).toHaveTokenBalance(originalBalance - amount);
    await expect(toTokenAccount).toHaveTokenBalance(amount);
  });
});
```

## Program Matchers

### Program Deployment

```typescript
// Basic deployment checks
await expect(programId).toExistOnCluster();
await expect(programId).toBeDeployed(); // Alias for toExistOnCluster

// Upgradeable programs
await expect(programId).toBeUpgradeable();
```

### Anchor Program Testing

```typescript
// Method availability
await expect(program).toHaveMethod('initialize');
await expect(program).toHaveMethod('transfer');

// Account types
await expect(program).toHaveAccount('userAccount');
await expect(program).toHaveAccount('configAccount');

// IDL structure
await expect(program).toHaveIdlMethod('initialize');
await expect(program).toHaveIdlAccount('UserAccount');
```

### Complete Program Test

```typescript
describe('My Anchor Program', () => {
  let program: Program<MyProgram>;

  beforeAll(async () => {
    program = await loadProgram();
  });

  it('should be properly deployed', async () => {
    await expect(program).toExistOnCluster();
    await expect(program).toHaveMethod('initialize');
    await expect(program).toHaveMethod('updateData');
    await expect(program).toHaveAccount('dataAccount');
  });

  it('should have correct IDL structure', async () => {
    await expect(program).toHaveIdlMethod('initialize');
    await expect(program).toHaveIdlMethod('updateData');
    await expect(program).toHaveIdlAccount('DataAccount');
  });
});
```

## Token Matchers

### SPL Token Testing

```typescript
// Token account balances
await expect(tokenAccount).toHaveTokenBalance(1000000000); // 1 token with 9 decimals
await expect(tokenAccount).toHaveMint(mintPublicKey);

// Mint properties
await expect(mint).toHaveDecimals(9);
await expect(mint).toHaveTokenSupply(1000000000000);
await expect(mint).toHaveMintAuthority(authorityPublicKey);
await expect(mint).toHaveFreezeAuthority(authorityPublicKey);
await expect(mint).toHaveFreezeAuthority(null); // No freeze authority

// Account states
await expect(tokenAccount).toBeFrozen();
await expect(tokenAccount).not.toBeFrozen();
```

### Token Program Example

```typescript
describe('Custom Token', () => {
  let mint: PublicKey;
  let userTokenAccount: PublicKey;

  beforeAll(async () => {
    mint = await createMint(connection, payer, mintAuthority, null, 6);
    userTokenAccount = await createAssociatedTokenAccount(
      connection,
      payer,
      mint,
      user.publicKey
    );
  });

  it('should have correct mint properties', async () => {
    await expect(mint).toHaveDecimals(6);
    await expect(mint).toHaveMintAuthority(mintAuthority);
    await expect(mint).toHaveFreezeAuthority(null);
    await expect(mint).toHaveTokenSupply(0);
  });

  it('should mint tokens correctly', async () => {
    await mintTo(connection, payer, mint, userTokenAccount, mintAuthority, 1000000);
    
    await expect(userTokenAccount).toHaveTokenBalance(1000000);
    await expect(mint).toHaveTokenSupply(1000000);
  });
});
```

## Event Matchers

### Anchor Event Testing

```typescript
// Single event
await expect(signature).toHaveEmittedEvent('UserRegistered');
await expect(signature).toHaveEmittedEvent('UserRegistered', {
  userId: 123,
  timestamp: expect.any(Number)
});

// Multiple events
await expect(signature).toHaveEmittedEvents([
  { name: 'UserRegistered', data: { userId: 123 } },
  { name: 'BalanceUpdated', data: { newBalance: 1000 } }
]);
```

## Utilities

### Connection Management

```typescript
import { 
  initializeTestEnvironment, 
  getTestContext,
  airdrop,
  waitForValidator 
} from 'jest-blockchain-extensions';

// Initialize once per test suite
beforeAll(async () => {
  const context = initializeTestEnvironment({
    endpoint: process.env.SOLANA_RPC_URL || 'http://localhost:8899',
    cluster: 'localnet',
    commitment: 'confirmed'
  });

  // Wait for local validator
  await waitForValidator(context.connection);
});

// Get connection in tests
const { connection } = getTestContext();

// Airdrop for testing
await airdrop(connection, testAccount, 1000000000); // 1 SOL
```

### Helper Functions

```typescript
import { 
  formatPublicKey,
  formatAmount,
  lamportsToSol,
  solToLamports,
  retry,
  waitForCondition 
} from 'jest-blockchain-extensions';

// Format for display
const shortKey = formatPublicKey(publicKey); // "So111111...111112"
const amount = formatAmount(1000000000, 'SOL'); // "1 SOL"

// Conversions
const sol = lamportsToSol(1000000000); // 1
const lamports = solToLamports(1); // BN(1000000000)

// Async utilities
await retry(async () => {
  // Some operation that might fail
}, 3, 1000); // 3 attempts, 1 second delay

await waitForCondition(async () => {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}, 10000); // 10 second timeout
```

## Working with Anchor

This library is designed to work seamlessly with Anchor. Here's a complete example:

```typescript
import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { MyProgram } from '../target/types/my_program';
import 'jest-blockchain-extensions';

describe('My Program', () => {
  let program: Program<MyProgram>;
  let provider: anchor.AnchorProvider;

  beforeAll(async () => {
    provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    program = anchor.workspace.MyProgram as Program<MyProgram>;
  });

  it('should initialize user account', async () => {
    const user = anchor.web3.Keypair.generate();
    const [userPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initializeUser()
      .accounts({
        user: userPda,
        authority: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Test transaction
    await expect(tx).toBeConfirmed();
    await expect(tx).toHaveSucceeded();

    // Test created account
    await expect(userPda).toExist();
    await expect(userPda).toHaveOwner(program.programId);
    
    // Test program events
    await expect(tx).toHaveEmittedEvent('UserInitialized', {
      user: userPda,
      authority: user.publicKey
    });
  });
});
```

## Configuration

### Environment Variables

- `SOLANA_RPC_URL`: RPC endpoint (default: `http://localhost:8899`)
- `SOLANA_CLUSTER`: Cluster name (default: `localnet`)

### Test Environment Setup

```typescript
// In your test setup file
import { setupTestEnvironment } from 'jest-blockchain-extensions';

// Automatically initializes with default local settings
setupTestEnvironment();

// Or with custom configuration
setupTestEnvironment('https://api.devnet.solana.com', 'processed');
```

## TypeScript Support

All matchers include full TypeScript definitions:

```typescript
import type { PublicKey, TransactionSignature } from '@solana/web3.js';
import type { Program } from '@project-serum/anchor';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBalance(expectedBalance: number | BN | string): R;
      toBeConfirmed(): R;
      toExistOnCluster(): R;
      // ... all other matchers
    }
  }
}
```

## Best Practices

### 1. Test Structure

```typescript
describe('Feature Name', () => {
  let accounts: { [key: string]: PublicKey };
  let signatures: string[];

  beforeAll(async () => {
    // Setup accounts and initial state
  });

  afterEach(async () => {
    // Clean up if needed
  });

  describe('when condition X', () => {
    it('should do Y', async () => {
      // Test implementation
    });
  });
});
```

### 2. Error Handling

```typescript
it('should handle failures gracefully', async () => {
  try {
    const signature = await doSomethingThatFails();
    await expect(signature).toHaveFailed();
    await expect(signature).toHaveFailedWith('Expected error message');
  } catch (error) {
    // Handle transaction rejection
    expect(error.message).toContain('insufficient funds');
  }
});
```

### 3. Async/Await Patterns

```typescript
// ✅ Good - Always await matchers
await expect(account).toHaveBalance(1000000);

// ❌ Bad - Missing await
expect(account).toHaveBalance(1000000);

// ✅ Good - Parallel execution when possible
await Promise.all([
  expect(account1).toExist(),
  expect(account2).toExist(),
  expect(account3).toExist()
]);
```

### 4. Local Validator Testing

```typescript
// Start local validator for tests
beforeAll(async () => {
  // In package.json scripts:
  // "test:setup": "solana-test-validator --reset --quiet &"
  // "test": "npm run test:setup && jest && pkill solana-test-validator"
  
  const context = initializeTestEnvironment();
  await waitForValidator(context.connection, 30000);
});
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

Made with ❤️ for the Solana developer community.