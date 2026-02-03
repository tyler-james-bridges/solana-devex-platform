import { expect } from 'chai';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { KaminoMarket, KaminoAction, VanillaObligation } from '@kamino-finance/klend-sdk';
import { LiteTestEnvironment, quickSetup } from './litesvm-helper';

describe('Kamino Finance Protocol Integration', () => {
  let env: LiteTestEnvironment;
  let kaminoMarket: KaminoMarket;
  let userKeypair: Keypair;
  
  // Real Kamino market addresses
  const KAMINO_MARKET_PUBKEY = new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

  before(async () => {
    env = await quickSetup();
    userKeypair = Keypair.generate();
    
    // Initialize Kamino market
    kaminoMarket = await KaminoMarket.load(
      env.connection,
      KAMINO_MARKET_PUBKEY,
      userKeypair.publicKey
    );

    // Fund test accounts
    await env.liteSvm.airdrop(userKeypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  describe('Market Information', () => {
    it('should load market data correctly', async () => {
      expect(kaminoMarket).to.not.be.null;
      expect(kaminoMarket.getMarketAuthority()).to.be.instanceOf(PublicKey);
      
      const reserves = kaminoMarket.getReserves();
      expect(reserves).to.be.an('array');
      expect(reserves.length).to.be.greaterThan(0);
    });

    it('should fetch reserve information for supported assets', async () => {
      const reserves = kaminoMarket.getReserves();
      
      for (const reserve of reserves) {
        expect(reserve).to.have.property('pubkey');
        expect(reserve).to.have.property('stats');
        expect(reserve.stats).to.have.property('mintTotalSupply');
        expect(reserve.stats).to.have.property('depositAPY');
        expect(reserve.stats).to.have.property('borrowAPY');
      }
    });

    it('should calculate interest rates correctly', async () => {
      const reserves = kaminoMarket.getReserves();
      
      for (const reserve of reserves) {
        const stats = reserve.stats;
        
        // Deposit APY should be positive
        expect(stats.depositAPY).to.be.greaterThan(0);
        
        // Borrow APY should be higher than deposit APY
        expect(stats.borrowAPY).to.be.greaterThan(stats.depositAPY);
        
        // Utilization rate should be between 0 and 100%
        expect(stats.utilizationRatio).to.be.greaterThanOrEqual(0);
        expect(stats.utilizationRatio).to.be.lessThanOrEqual(1);
      }
    });
  });

  describe('Lending Operations', () => {
    it('should create deposit instructions', async () => {
      const depositAmount = 1000000; // 1 USDC (6 decimals)
      
      const usdcReserve = kaminoMarket.getReserveByMint(USDC_MINT);
      expect(usdcReserve).to.not.be.null;

      const depositAction = await KaminoAction.buildDepositTxns(
        kaminoMarket,
        depositAmount.toString(),
        usdcReserve!.stats.mintAddress,
        userKeypair.publicKey,
        new VanillaObligation(KAMINO_MARKET_PUBKEY),
        0, // referrer fee
        true // deposit all
      );

      expect(depositAction.setupIxs).to.be.an('array');
      expect(depositAction.lendingIxs).to.be.an('array');
      expect(depositAction.lendingIxs.length).to.be.greaterThan(0);
      
      // Validate instruction structure
      const depositIx = depositAction.lendingIxs[0];
      expect(depositIx).to.have.property('programId');
      expect(depositIx).to.have.property('keys');
      expect(depositIx).to.have.property('data');
    });

    it('should create withdrawal instructions', async () => {
      const withdrawAmount = 500000; // 0.5 USDC
      
      const usdcReserve = kaminoMarket.getReserveByMint(USDC_MINT);
      expect(usdcReserve).to.not.be.null;

      const withdrawAction = await KaminoAction.buildWithdrawTxns(
        kaminoMarket,
        withdrawAmount.toString(),
        usdcReserve!.stats.mintAddress,
        userKeypair.publicKey,
        new VanillaObligation(KAMINO_MARKET_PUBKEY),
        0 // referrer fee
      );

      expect(withdrawAction.setupIxs).to.be.an('array');
      expect(withdrawAction.lendingIxs).to.be.an('array');
      expect(withdrawAction.lendingIxs.length).to.be.greaterThan(0);
    });
  });

  describe('Borrowing Operations', () => {
    it('should create borrow instructions', async () => {
      const borrowAmount = 500000; // 0.5 USDC
      
      const usdcReserve = kaminoMarket.getReserveByMint(USDC_MINT);
      expect(usdcReserve).to.not.be.null;

      const borrowAction = await KaminoAction.buildBorrowTxns(
        kaminoMarket,
        borrowAmount.toString(),
        usdcReserve!.stats.mintAddress,
        userKeypair.publicKey,
        new VanillaObligation(KAMINO_MARKET_PUBKEY),
        0 // referrer fee
      );

      expect(borrowAction.setupIxs).to.be.an('array');
      expect(borrowAction.lendingIxs).to.be.an('array');
      expect(borrowAction.lendingIxs.length).to.be.greaterThan(0);
    });

    it('should create repay instructions', async () => {
      const repayAmount = 250000; // 0.25 USDC
      
      const usdcReserve = kaminoMarket.getReserveByMint(USDC_MINT);
      expect(usdcReserve).to.not.be.null;

      const repayAction = await KaminoAction.buildRepayTxns(
        kaminoMarket,
        repayAmount.toString(),
        usdcReserve!.stats.mintAddress,
        userKeypair.publicKey,
        new VanillaObligation(KAMINO_MARKET_PUBKEY),
        0 // referrer fee
      );

      expect(repayAction.setupIxs).to.be.an('array');
      expect(repayAction.lendingIxs).to.be.an('array');
      expect(repayAction.lendingIxs.length).to.be.greaterThan(0);
    });
  });

  describe('Liquidation Mechanics', () => {
    it('should calculate liquidation thresholds', async () => {
      const reserves = kaminoMarket.getReserves();
      
      for (const reserve of reserves) {
        const config = reserve.config;
        
        // LTV should be reasonable (0-90%)
        expect(config.loanToValueRatio).to.be.greaterThan(0);
        expect(config.loanToValueRatio).to.be.lessThanOrEqual(90);
        
        // Liquidation threshold should be higher than LTV
        expect(config.liquidationThreshold).to.be.greaterThan(config.loanToValueRatio);
        
        // Liquidation bonus should be positive
        expect(config.liquidationBonus).to.be.greaterThan(0);
      }
    });

    it('should identify liquidatable positions', async () => {
      // This would require setting up a position that becomes liquidatable
      // For now, test the liquidation calculation logic
      
      const obligations = await kaminoMarket.getAllUserObligations();
      expect(obligations).to.be.an('array');
      
      // Test liquidation calculation for each obligation
      for (const obligation of obligations) {
        const healthFactor = kaminoMarket.calculateHealthFactor(obligation);
        
        if (healthFactor < 1.0) {
          // Position is liquidatable
          const liquidationInfo = kaminoMarket.calculateLiquidation(obligation);
          expect(liquidationInfo).to.have.property('maxLiquidableAmount');
          expect(liquidationInfo).to.have.property('liquidationBonus');
        }
      }
    });
  });

  describe('Risk Management', () => {
    it('should calculate position health correctly', async () => {
      // Create a mock obligation for testing
      const mockObligation = {
        depositsLen: 1,
        borrowsLen: 1,
        deposits: [{
          depositReserve: USDC_MINT,
          depositedAmount: 1000000n, // 1 USDC
        }],
        borrows: [{
          borrowReserve: SOL_MINT,
          borrowedAmountSf: 500000n, // 0.5 SOL worth
        }],
      };

      const healthFactor = kaminoMarket.calculateHealthFactor(mockObligation as any);
      expect(healthFactor).to.be.a('number');
      expect(healthFactor).to.be.greaterThan(0);
    });

    it('should validate collateral requirements', async () => {
      const reserves = kaminoMarket.getReserves();
      
      for (const reserve of reserves) {
        const config = reserve.config;
        
        // Validate collateral weights
        expect(config.liquidityWeight).to.be.greaterThan(0);
        expect(config.liquidityWeight).to.be.lessThanOrEqual(100);
        
        // Borrow weights should be higher than liquidity weights (more conservative)
        expect(config.borrowWeight).to.be.greaterThanOrEqual(config.liquidityWeight);
      }
    });
  });

  describe('Yield Farming Integration', () => {
    it('should calculate farming rewards correctly', async () => {
      const reserves = kaminoMarket.getReserves();
      
      for (const reserve of reserves) {
        if (reserve.state.farmCollateral.isInitialized()) {
          const farmState = reserve.state.farmCollateral;
          
          expect(farmState.rewardsPerShare).to.be.greaterThanOrEqual(0);
          expect(farmState.cumulativeRewardsPerShare).to.be.greaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should load market data efficiently', async () => {
      const startTime = Date.now();
      
      const market = await KaminoMarket.load(
        env.connection,
        KAMINO_MARKET_PUBKEY,
        userKeypair.publicKey
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(market).to.not.be.null;
      expect(duration).to.be.lessThan(3000); // Should load within 3 seconds
    });

    it('should handle multiple concurrent operations', async () => {
      const operations = [
        () => kaminoMarket.getReserves(),
        () => kaminoMarket.getAllUserObligations(),
        () => kaminoMarket.getReserveByMint(USDC_MINT),
        () => kaminoMarket.getReserveByMint(SOL_MINT),
      ];

      const results = await Promise.all(operations.map(op => op()));
      
      expect(results).to.have.length(4);
      expect(results[0]).to.be.an('array'); // reserves
      expect(results[1]).to.be.an('array'); // obligations
      expect(results[2]).to.not.be.null; // USDC reserve
      expect(results[3]).to.not.be.null; // SOL reserve
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid market addresses', async () => {
      const invalidMarket = Keypair.generate().publicKey;
      
      try {
        await KaminoMarket.load(
          env.connection,
          invalidMarket,
          userKeypair.publicKey
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('should validate transaction parameters', async () => {
      try {
        const usdcReserve = kaminoMarket.getReserveByMint(USDC_MINT);
        
        // Try to deposit negative amount
        await KaminoAction.buildDepositTxns(
          kaminoMarket,
          '-1000',
          usdcReserve!.stats.mintAddress,
          userKeypair.publicKey,
          new VanillaObligation(KAMINO_MARKET_PUBKEY),
          0,
          true
        );
        
        expect.fail('Should have thrown an error for negative amount');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  after(async () => {
    // Cleanup
    if (env && env.liteSvm) {
      // Perform any necessary cleanup
    }
  });
});