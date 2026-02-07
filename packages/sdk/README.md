# @solana-devex/sdk

TypeScript SDK for the Solana DevEx Platform - CPI debugging, transaction simulation, and developer tools.

## Installation

```bash
npm install @solana-devex/sdk
```

## Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install @solana/web3.js
```

## Quick Start

```typescript
import { SolanaDevExClient, debugTransaction } from '@solana-devex/sdk';

// Create a client instance
const client = new SolanaDevExClient({
  apiUrl: 'https://onchain-devex.tools', // Default
  rpcEndpoint: 'https://api.mainnet-beta.solana.com' // Default
});

// Debug a transaction
const result = await client.debugTransaction('your-transaction-signature');
console.log('CPI Flow:', result.cpiFlow);
console.log('Errors:', result.errors);
console.log('Performance:', result.performance);

// Or use the convenience function
const quickResult = await debugTransaction('your-transaction-signature');
```

## Configuration

The SDK can be configured when creating a client instance:

```typescript
const client = new SolanaDevExClient({
  apiUrl: 'https://onchain-devex.tools',
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  apiKey: 'your-api-key', // Optional, for premium features
  timeout: 30000, // Request timeout in ms (default: 30000)
  retryAttempts: 3, // Number of retry attempts (default: 3)
  enableCaching: true // Enable response caching (default: true)
});
```

## API Reference

### SolanaDevExClient

The main client class for interacting with the Solana DevEx Platform.

#### Methods

##### debugTransaction(signature: string): Promise<DebugResult>

Debug a Solana transaction by signature. Returns detailed information about CPI flow, errors, and performance metrics.

```typescript
const result = await client.debugTransaction('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi');

// Access CPI flow
result.cpiFlow?.forEach(step => {
  console.log(`Program: ${step.program}`);
  console.log(`Instruction: ${step.instruction}`);
  console.log(`Depth: ${step.depth}`);
  console.log(`Success: ${step.success}`);
});

// Check for errors
result.errors?.forEach(error => {
  console.log(`Error: ${error.message}`);
  console.log(`Suggested fix: ${error.suggestedFix}`);
});
```

##### simulateTransaction(txData: string): Promise<SimulationResult>

Simulate a transaction before execution to check for potential issues and estimate costs.

```typescript
const simulation = await client.simulateTransaction('base58-encoded-transaction');

console.log('Will succeed:', simulation.simulation.wouldSucceed);
console.log('Estimated fee:', simulation.simulation.estimatedFee);
console.log('Risks:', simulation.simulation.risks);
console.log('Safety checks:', simulation.safetyChecks);
```

##### getProtocolHealth(): Promise<ProtocolHealth[]>

Get health status for monitored Solana protocols and DeFi platforms.

```typescript
const health = await client.getProtocolHealth();

health.forEach(protocol => {
  console.log(`${protocol.protocol}: ${protocol.status}`);
  console.log(`Uptime: ${protocol.uptime}%`);
  console.log(`Error rate: ${protocol.errorRate}%`);
});
```

##### runSecurityScan(programId: string): Promise<SecurityReport>

Run a comprehensive security analysis on a Solana program.

```typescript
const report = await client.runSecurityScan('program-id-here');

console.log('Overall risk:', report.overallRisk);
console.log('Vulnerabilities found:', report.summary.totalIssues);

report.vulnerabilities.forEach(vuln => {
  console.log(`${vuln.type}: ${vuln.description}`);
  console.log(`Severity: ${vuln.severity}`);
  console.log(`Fix: ${vuln.recommendation}`);
});
```

##### getMetrics(): Promise<PlatformMetrics>

Get platform usage metrics and performance statistics.

```typescript
const metrics = await client.getMetrics();

console.log('Platform status:', metrics.overall.status);
console.log('Total requests:', metrics.overall.totalRequests);
console.log('Error rate:', metrics.overall.errorRate);
console.log('Average response time:', metrics.overall.averageResponseTime);
```

##### updateConfig(config: Partial<SolanaDevExConfig>): void

Update the client configuration after initialization.

```typescript
client.updateConfig({
  apiKey: 'new-api-key',
  timeout: 60000
});
```

##### clearCache(): void

Clear the internal response cache.

```typescript
client.clearCache();
```

##### isHealthy(): Promise<boolean>

Check if the platform is healthy and responding.

```typescript
const healthy = await client.isHealthy();
if (!healthy) {
  console.log('Platform is experiencing issues');
}
```

## Standalone RPC Utilities

The SDK also provides standalone utilities for direct Solana RPC interaction:

```typescript
import { 
  getTransactionDetails, 
  parseTransactionForCPI, 
  analyzeTransactionErrors,
  getNetworkHealth 
} from '@solana-devex/sdk';

// Get raw transaction details
const tx = await getTransactionDetails('signature', 'rpc-endpoint');

// Parse CPI flow
const cpiFlow = parseTransactionForCPI(tx);

// Analyze errors
const errors = analyzeTransactionErrors(tx);

// Check network health
const networkHealth = await getNetworkHealth('rpc-endpoint');
```

## Error Handling

The SDK provides typed error classes for better error handling:

```typescript
import { 
  SolanaDevExClient, 
  NetworkError, 
  ValidationError, 
  AuthenticationError 
} from '@solana-devex/sdk';

try {
  const result = await client.debugTransaction('invalid-signature');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Invalid input:', error.message);
  } else if (error instanceof NetworkError) {
    console.log('Network issue:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.log('Auth failed:', error.message);
  } else {
    console.log('Unknown error:', error);
  }
}
```

## Types

The SDK exports comprehensive TypeScript types for all API responses:

```typescript
import type { 
  DebugResult,
  SimulationResult,
  ProtocolHealth,
  SecurityReport,
  PlatformMetrics,
  CPIFlowStep,
  TransactionError,
  Risk,
  SecurityVulnerability
} from '@solana-devex/sdk';
```

## Convenience Functions

For quick one-off operations, use the convenience functions:

```typescript
import { 
  debugTransaction,
  simulateTransaction,
  getProtocolHealth,
  runSecurityScan,
  getPlatformMetrics
} from '@solana-devex/sdk';

// All functions accept an optional config parameter
const result = await debugTransaction('signature', {
  apiUrl: 'https://custom-api.com'
});
```

## Caching

The SDK automatically caches responses to reduce API calls:

- Debug results: 5 minutes
- Simulation results: 2 minutes
- Protocol health: 30 seconds
- Security reports: 10 minutes
- Platform metrics: 1 minute

Caching can be disabled by setting `enableCaching: false` in the configuration.

## Rate Limiting

The SDK handles rate limiting automatically with exponential backoff. If you receive a 429 status code, the SDK will wait and retry according to the `Retry-After` header.

## License

MIT

## Support

For issues, questions, or feature requests, please visit our GitHub repository or contact support at the Solana DevEx Platform.

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.