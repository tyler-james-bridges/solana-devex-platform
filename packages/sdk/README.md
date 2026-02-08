# @solana-devex/sdk

TypeScript SDK for the [Solana DevEx Platform](https://onchain-devex.tools). Debug transactions, scan tokens for security risks, and interact with Solana RPC directly.

## Install

```bash
npm install @solana-devex/sdk @solana/web3.js
```

## Usage

### Debug a Transaction

Fetch and parse any Solana mainnet transaction:

```typescript
import { SolanaDevExClient } from '@solana-devex/sdk';

const client = new SolanaDevExClient();

const result = await client.debugTransaction(
  '5KSSXcvFCi3HHbgDJkbMz3mwwtzkvVjv78Qik9JUfx9Xkgca7AZBQqBBaVYVocRY1zKBVH4xic7FwWDvnsCqHwYD'
);

console.log(result.cpiFlow);     // Cross-program invocation trace
console.log(result.errors);      // Error diagnostics
console.log(result.performance); // Compute units, fees, efficiency
```

### Security Scan

Analyze a token or program for risks:

```typescript
const report = await client.securityScan('TokenMintAddress...');

console.log(report.riskScore);   // 0-100
console.log(report.threats);     // Detected threats
```

### Direct RPC (No Platform Dependency)

Use Solana RPC utilities directly without the platform API:

```typescript
import { SolanaRpcClient, getTransactionDetails } from '@solana-devex/sdk';

// Full RPC client
const rpc = new SolanaRpcClient('https://api.mainnet-beta.solana.com');
const details = await rpc.getTransactionDetails('tx-signature');

// Or standalone functions
const tx = await getTransactionDetails('tx-signature', 'https://api.mainnet-beta.solana.com');
const cpi = parseTransactionForCPI(tx);
```

## Configuration

```typescript
const client = new SolanaDevExClient({
  apiUrl: 'https://onchain-devex.tools',  // default
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  timeout: 30000,
  retryAttempts: 3,
  enableCaching: true
});
```

## API

| Method | Description |
|--------|-------------|
| `debugTransaction(signature)` | Parse a mainnet transaction with CPI trace |
| `securityScan(address)` | Token/program risk analysis via Guardian |
| `getThreats()` | Active threat intelligence feed |

## License

MIT
