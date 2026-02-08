# onchain-devex

TypeScript SDK for CPI debugging on Solana. Parse any mainnet transaction into a detailed execution trace with cross-program invocation analysis, error diagnostics, and performance metrics.

## Install

```bash
npm install onchain-devex @solana/web3.js
```

## Usage

### Debug a Transaction via Platform API

```typescript
import { SolanaDevExClient } from 'onchain-devex';

const client = new SolanaDevExClient();

const result = await client.debugTransaction(
  '5KSSXcvFCi3HHbgDJkbMz3mwwtzkvVjv78Qik9JUfx9Xkgca7AZBQqBBaVYVocRY1zKBVH4xic7FwWDvnsCqHwYD'
);

// CPI execution trace
result.cpiFlow?.forEach(step => {
  console.log(`${step.program} → ${step.instruction} (${step.computeUnits} CU)`);
});

// Error diagnostics with fix suggestions
result.errors?.forEach(err => {
  console.log(`${err.severity}: ${err.message}`);
  console.log(`Fix: ${err.suggestedFix}`);
});

// Performance: compute units, fees, efficiency
console.log(result.performance);
```

### Direct RPC (No Platform Dependency)

Use Solana RPC utilities directly — no API key, no platform needed:

```typescript
import { 
  SolanaRpcClient, 
  getTransactionDetails, 
  parseTransactionForCPI,
  analyzeTransactionErrors 
} from 'onchain-devex';

// Full RPC client
const rpc = new SolanaRpcClient('https://api.mainnet-beta.solana.com');
const details = await rpc.getTransactionDetails('tx-signature');

// Or standalone functions
const tx = await getTransactionDetails('tx-signature');
const cpiTrace = parseTransactionForCPI(tx);
const errors = analyzeTransactionErrors(tx);
```

## Configuration

```typescript
const client = new SolanaDevExClient({
  apiUrl: 'https://onchain-devex.tools',  // default
  timeout: 30000,
  retryAttempts: 3,
  enableCaching: true
});
```

## What This Does

- Fetches real Solana mainnet transaction data
- Parses cross-program invocations into a readable trace
- Identifies errors with severity levels and suggested fixes
- Reports compute unit usage, fees, and efficiency metrics
- Caches results to reduce RPC calls
- Works with any Solana transaction signature

## License

MIT
