import { Template } from './index';

export const AGENT_TEMPLATES: Template[] = [
  {
    id: 'trading-agent',
    name: 'Autonomous Trading Agent',
    description: 'Automated trading agent with Jupiter integration',
    category: 'agent',
    language: 'typescript',
    files: [
      {
        path: 'src/trading-agent.ts',
        content: `import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import { JupiterClient } from './jupiter-client';

export interface TradingStrategy {
  name: string;
  inputMint: string;
  outputMint: string;
  maxSlippage: number;
  profitThreshold: number;
  stopLoss: number;
  maxTradeAmount: number;
}

export interface TradeSignal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reason: string;
  suggestedAmount?: number;
}

export interface TradingMetrics {
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  totalLoss: number;
  currentBalance: number;
  winRate: number;
}

export class TradingAgent {
  private connection: Connection;
  private wallet: Wallet;
  private jupiterClient: JupiterClient;
  private strategies: TradingStrategy[] = [];
  private isRunning: boolean = false;
  private metrics: TradingMetrics;
  
  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.jupiterClient = new JupiterClient(connection, wallet);
    
    this.metrics = {
      totalTrades: 0,
      successfulTrades: 0,
      totalProfit: 0,
      totalLoss: 0,
      currentBalance: 0,
      winRate: 0
    };
  }

  addStrategy(strategy: TradingStrategy): void {
    this.strategies.push(strategy);
    console.log(\`Added strategy: \${strategy.name}\`);
  }

  removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter(s => s.name !== strategyName);
    console.log(\`Removed strategy: \${strategyName}\`);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }

    this.isRunning = true;
    console.log('Trading agent started');

    // Main trading loop
    while (this.isRunning) {
      try {
        await this.executeTradingCycle();
        await this.sleep(30000); // Wait 30 seconds between cycles
      } catch (error) {
        console.error('Error in trading cycle:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log('Trading agent stopped');
  }

  private async executeTradingCycle(): Promise<void> {
    console.log('Executing trading cycle...');
    
    for (const strategy of this.strategies) {
      try {
        const signal = await this.analyzeMarket(strategy);
        
        if (signal.action !== 'hold' && signal.confidence > 0.7) {
          await this.executeTradeSignal(strategy, signal);
        }
      } catch (error) {
        console.error(\`Error executing strategy \${strategy.name}:\`, error);
      }
    }
    
    await this.updateMetrics();
  }

  private async analyzeMarket(strategy: TradingStrategy): Promise<TradeSignal> {
    // Simple market analysis - replace with sophisticated analysis
    const currentPrice = await this.jupiterClient.getTokenPrice(strategy.inputMint);
    const targetPrice = await this.jupiterClient.getTokenPrice(strategy.outputMint);
    
    // Calculate price ratio
    const priceRatio = currentPrice / targetPrice;
    
    // Simple strategy: buy if ratio is favorable
    if (priceRatio > 1.02) { // 2% advantage
      return {
        action: 'sell',
        confidence: Math.min(priceRatio - 1, 0.95),
        reason: \`Favorable price ratio: \${priceRatio.toFixed(4)}\`,
        suggestedAmount: strategy.maxTradeAmount * 0.1
      };
    } else if (priceRatio < 0.98) { // 2% disadvantage, might be buying opportunity
      return {
        action: 'buy',
        confidence: Math.min(1 - priceRatio, 0.95),
        reason: \`Potential buying opportunity: \${priceRatio.toFixed(4)}\`,
        suggestedAmount: strategy.maxTradeAmount * 0.1
      };
    }
    
    return {
      action: 'hold',
      confidence: 0.5,
      reason: 'No clear trading signal'
    };
  }

  private async executeTradeSignal(strategy: TradingStrategy, signal: TradeSignal): Promise<void> {
    console.log(\`Executing \${signal.action} signal for \${strategy.name}\`);
    console.log(\`Reason: \${signal.reason}\`);
    console.log(\`Confidence: \${(signal.confidence * 100).toFixed(1)}%\`);
    
    try {
      if (signal.action === 'buy') {
        await this.executeBuy(strategy, signal.suggestedAmount || strategy.maxTradeAmount * 0.1);
      } else if (signal.action === 'sell') {
        await this.executeSell(strategy, signal.suggestedAmount || strategy.maxTradeAmount * 0.1);
      }
      
      this.metrics.totalTrades++;
      this.metrics.successfulTrades++;
      
    } catch (error) {
      console.error('Trade execution failed:', error);
      this.metrics.totalTrades++;
      // Count as unsuccessful trade
    }
  }

  private async executeBuy(strategy: TradingStrategy, amount: number): Promise<void> {
    const quote = await this.jupiterClient.getQuote({
      inputMint: strategy.inputMint,
      outputMint: strategy.outputMint,
      amount: Math.floor(amount),
      slippageBps: strategy.maxSlippage * 100,
      userPublicKey: this.wallet.publicKey.toString()
    });
    
    // Check if trade meets profit threshold
    const expectedProfit = this.calculateExpectedProfit(quote, amount);
    if (expectedProfit < strategy.profitThreshold) {
      console.log('Trade does not meet profit threshold, skipping');
      return;
    }
    
    console.log(\`Executing buy: \${amount} \${strategy.inputMint} -> \${strategy.outputMint}\`);
    const signature = await this.jupiterClient.executeSwap(quote);
    console.log(\`Buy executed: \${signature}\`);
  }

  private async executeSell(strategy: TradingStrategy, amount: number): Promise<void> {
    const quote = await this.jupiterClient.getQuote({
      inputMint: strategy.outputMint,
      outputMint: strategy.inputMint,
      amount: Math.floor(amount),
      slippageBps: strategy.maxSlippage * 100,
      userPublicKey: this.wallet.publicKey.toString()
    });
    
    console.log(\`Executing sell: \${amount} \${strategy.outputMint} -> \${strategy.inputMint}\`);
    const signature = await this.jupiterClient.executeSwap(quote);
    console.log(\`Sell executed: \${signature}\`);
  }

  private calculateExpectedProfit(quote: any, amount: number): number {
    // Simplified profit calculation
    const inputAmount = parseInt(quote.inAmount);
    const outputAmount = parseInt(quote.outAmount);
    return (outputAmount - inputAmount) / inputAmount;
  }

  private async updateMetrics(): Promise<void> {
    // Update current balance
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    this.metrics.currentBalance = balance / 1e9; // Convert to SOL
    
    // Calculate win rate
    this.metrics.winRate = this.metrics.totalTrades > 0 
      ? this.metrics.successfulTrades / this.metrics.totalTrades 
      : 0;
      
    console.log('Trading Metrics:', this.metrics);
  }

  getMetrics(): TradingMetrics {
    return { ...this.metrics };
  }

  getStrategies(): TradingStrategy[] {
    return [...this.strategies];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default trading strategies
export const DEFAULT_STRATEGIES: TradingStrategy[] = [
  {
    name: 'SOL/USDC Arbitrage',
    inputMint: 'So11111111111111111111111111111111111111112', // SOL
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    maxSlippage: 0.005, // 0.5%
    profitThreshold: 0.01, // 1%
    stopLoss: 0.05, // 5%
    maxTradeAmount: 1000000 // 0.001 SOL
  },
  {
    name: 'BONK/SOL Quick Trade',
    inputMint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    outputMint: 'So11111111111111111111111111111111111111112', // SOL
    maxSlippage: 0.01, // 1%
    profitThreshold: 0.02, // 2%
    stopLoss: 0.1, // 10%
    maxTradeAmount: 10000000 // 10M BONK
  }
];

// Example usage
export async function createTradingAgent(): Promise<TradingAgent> {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Load wallet from environment or create new one
  const keypair = process.env.PRIVATE_KEY 
    ? Keypair.fromSecretKey(new Uint8Array(JSON.parse(process.env.PRIVATE_KEY)))
    : Keypair.generate();
    
  const wallet = new Wallet(keypair);
  
  const agent = new TradingAgent(connection, wallet);
  
  // Add default strategies
  DEFAULT_STRATEGIES.forEach(strategy => agent.addStrategy(strategy));
  
  return agent;
}
`
      },
      {
        path: 'src/yield-optimizer.ts',
        content: `import { Connection, PublicKey } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';

export interface YieldStrategy {
  protocol: string;
  name: string;
  expectedApy: number;
  riskLevel: 'low' | 'medium' | 'high';
  minDeposit: number;
  maxDeposit: number;
  liquidityTokens: string[];
}

export interface PortfolioAllocation {
  strategy: YieldStrategy;
  allocation: number; // percentage
  currentAmount: number;
  targetAmount: number;
}

export class YieldOptimizer {
  private connection: Connection;
  private wallet: Wallet;
  private strategies: YieldStrategy[] = [];
  private portfolio: PortfolioAllocation[] = [];
  
  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies = [
      {
        protocol: 'Kamino',
        name: 'SOL-USDC LP',
        expectedApy: 0.12, // 12%
        riskLevel: 'medium',
        minDeposit: 100,
        maxDeposit: 100000,
        liquidityTokens: ['SOL', 'USDC']
      },
      {
        protocol: 'Marinade',
        name: 'mSOL Staking',
        expectedApy: 0.07, // 7%
        riskLevel: 'low',
        minDeposit: 1,
        maxDeposit: 1000000,
        liquidityTokens: ['SOL']
      },
      {
        protocol: 'Drift',
        name: 'USDC Lending',
        expectedApy: 0.08, // 8%
        riskLevel: 'low',
        minDeposit: 50,
        maxDeposit: 500000,
        liquidityTokens: ['USDC']
      },
      {
        protocol: 'Raydium',
        name: 'SOL-RAY LP',
        expectedApy: 0.25, // 25%
        riskLevel: 'high',
        minDeposit: 200,
        maxDeposit: 50000,
        liquidityTokens: ['SOL', 'RAY']
      }
    ];
  }

  async optimizePortfolio(
    totalAmount: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): Promise<PortfolioAllocation[]> {
    const filteredStrategies = this.filterStrategiesByRisk(riskTolerance);
    const optimizedAllocations = this.calculateOptimalAllocations(
      filteredStrategies,
      totalAmount
    );
    
    this.portfolio = optimizedAllocations.map(allocation => ({
      strategy: allocation.strategy,
      allocation: allocation.percentage,
      currentAmount: 0, // Will be updated when deposits are made
      targetAmount: allocation.amount
    }));
    
    return this.portfolio;
  }

  private filterStrategiesByRisk(
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  ): YieldStrategy[] {
    switch (riskTolerance) {
      case 'conservative':
        return this.strategies.filter(s => s.riskLevel === 'low');
      case 'moderate':
        return this.strategies.filter(s => s.riskLevel !== 'high');
      case 'aggressive':
        return this.strategies; // Include all strategies
      default:
        return this.strategies.filter(s => s.riskLevel === 'medium');
    }
  }

  private calculateOptimalAllocations(
    strategies: YieldStrategy[],
    totalAmount: number
  ): Array<{ strategy: YieldStrategy; percentage: number; amount: number }> {
    // Simple allocation algorithm - can be enhanced with modern portfolio theory
    const allocations: Array<{ strategy: YieldStrategy; percentage: number; amount: number }> = [];
    
    // Sort strategies by risk-adjusted return (Sharpe ratio approximation)
    const sortedStrategies = strategies.sort((a, b) => {
      const aScore = this.calculateStrategyScore(a);
      const bScore = this.calculateStrategyScore(b);
      return bScore - aScore;
    });
    
    let remainingAmount = totalAmount;
    let remainingPercentage = 100;
    
    for (let i = 0; i < sortedStrategies.length; i++) {
      const strategy = sortedStrategies[i];
      const isLast = i === sortedStrategies.length - 1;
      
      if (isLast) {
        // Allocate remaining amount to last strategy
        allocations.push({
          strategy,
          percentage: remainingPercentage,
          amount: remainingAmount
        });
      } else {
        // Calculate allocation based on strategy score and constraints
        const maxAllocation = Math.min(
          strategy.maxDeposit,
          remainingAmount * 0.5 // Don't allocate more than 50% to single strategy
        );
        
        const minAllocation = Math.max(
          strategy.minDeposit,
          remainingAmount * 0.1 // At least 10% if we're including this strategy
        );
        
        const optimalAllocation = Math.min(maxAllocation, Math.max(minAllocation, remainingAmount * 0.25));
        const percentage = (optimalAllocation / totalAmount) * 100;
        
        allocations.push({
          strategy,
          percentage,
          amount: optimalAllocation
        });
        
        remainingAmount -= optimalAllocation;
        remainingPercentage -= percentage;
      }
    }
    
    return allocations;
  }

  private calculateStrategyScore(strategy: YieldStrategy): number {
    // Simple scoring: higher APY is better, lower risk is better
    const riskMultiplier = {
      'low': 1.0,
      'medium': 0.8,
      'high': 0.6
    };
    
    return strategy.expectedApy * riskMultiplier[strategy.riskLevel];
  }

  async rebalancePortfolio(): Promise<void> {
    console.log('Rebalancing portfolio...');
    
    for (const allocation of this.portfolio) {
      const difference = allocation.targetAmount - allocation.currentAmount;
      
      if (Math.abs(difference) > allocation.targetAmount * 0.05) { // 5% threshold
        if (difference > 0) {
          console.log(\`Depositing \${difference} to \${allocation.strategy.name}\`);
          await this.depositToStrategy(allocation.strategy, difference);
          allocation.currentAmount += difference;
        } else {
          console.log(\`Withdrawing \${Math.abs(difference)} from \${allocation.strategy.name}\`);
          await this.withdrawFromStrategy(allocation.strategy, Math.abs(difference));
          allocation.currentAmount -= Math.abs(difference);
        }
      }
    }
  }

  private async depositToStrategy(strategy: YieldStrategy, amount: number): Promise<void> {
    // Implementation depends on the specific protocol
    console.log(\`Depositing \${amount} to \${strategy.protocol} - \${strategy.name}\`);
    
    // Example for different protocols:
    switch (strategy.protocol) {
      case 'Kamino':
        await this.depositToKamino(strategy, amount);
        break;
      case 'Marinade':
        await this.depositToMarinade(strategy, amount);
        break;
      case 'Drift':
        await this.depositToDrift(strategy, amount);
        break;
      case 'Raydium':
        await this.depositToRaydium(strategy, amount);
        break;
      default:
        throw new Error(\`Unknown protocol: \${strategy.protocol}\`);
    }
  }

  private async withdrawFromStrategy(strategy: YieldStrategy, amount: number): Promise<void> {
    console.log(\`Withdrawing \${amount} from \${strategy.protocol} - \${strategy.name}\`);
    // Similar implementation for withdrawals
  }

  // Protocol-specific deposit methods (implement based on each protocol's SDK)
  private async depositToKamino(strategy: YieldStrategy, amount: number): Promise<void> {
    // Implement Kamino-specific deposit logic
    console.log('Depositing to Kamino...');
  }

  private async depositToMarinade(strategy: YieldStrategy, amount: number): Promise<void> {
    // Implement Marinade-specific deposit logic
    console.log('Depositing to Marinade...');
  }

  private async depositToDrift(strategy: YieldStrategy, amount: number): Promise<void> {
    // Implement Drift-specific deposit logic
    console.log('Depositing to Drift...');
  }

  private async depositToRaydium(strategy: YieldStrategy, amount: number): Promise<void> {
    // Implement Raydium-specific deposit logic
    console.log('Depositing to Raydium...');
  }

  getPortfolio(): PortfolioAllocation[] {
    return [...this.portfolio];
  }

  getStrategies(): YieldStrategy[] {
    return [...this.strategies];
  }

  calculateExpectedYield(): number {
    return this.portfolio.reduce((total, allocation) => {
      return total + (allocation.strategy.expectedApy * allocation.allocation / 100);
    }, 0);
  }
}
`
      }
    ],
    dependencies: ['@solana/web3.js', '@project-serum/anchor'],
    setup: [
      'npm install',
      'npm run build'
    ]
  }
];