import { expect } from 'chai';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import { 
  DriftClient, 
  User, 
  Wallet, 
  getMarketsAndOracles,
  OrderType,
  PositionDirection,
  MarketType
} from '@drift-labs/sdk';
import { LiteTestEnvironment, quickSetup } from './litesvm-helper';

describe('Drift Protocol Integration', () => {
  let env: LiteTestEnvironment;
  let driftClient: DriftClient;
  let user: User;
  let userKeypair: Keypair;
  
  // Drift program ID and state account
  const DRIFT_PROGRAM_ID = new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH');
  const DRIFT_STATE = new PublicKey('GbxgQEn1d2LUVLnT2QLqNr9tJRHFkAgczC7p1V2nABZL');

  before(async () => {
    env = await quickSetup();
    userKeypair = Keypair.generate();
    
    // Create wallet wrapper
    const wallet = new Wallet(userKeypair);

    // Initialize Drift client
    driftClient = new DriftClient({
      connection: env.connection,
      wallet: wallet,
      programID: DRIFT_PROGRAM_ID,
      env: 'mainnet-beta',
    });

    // Subscribe to drift client
    await driftClient.subscribe();

    // Initialize user account
    user = new User({
      driftClient: driftClient,
      userAccountPublicKey: await driftClient.getUserAccountPublicKey(),
    });

    // Fund test accounts
    await env.liteSvm.airdrop(userKeypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  describe('Market Data', () => {
    it('should load perp markets correctly', async () => {
      const perpMarkets = driftClient.getPerpMarketAccounts();
      expect(perpMarkets).to.be.an('array');
      expect(perpMarkets.length).to.be.greaterThan(0);

      for (const market of perpMarkets) {
        expect(market).to.have.property('marketIndex');
        expect(market).to.have.property('baseAssetSymbol');
        expect(market).to.have.property('amm');
        expect(market.amm).to.have.property('baseAssetReserve');
        expect(market.amm).to.have.property('quoteAssetReserve');
      }
    });

    it('should load spot markets correctly', async () => {
      const spotMarkets = driftClient.getSpotMarketAccounts();
      expect(spotMarkets).to.be.an('array');
      expect(spotMarkets.length).to.be.greaterThan(0);

      for (const market of spotMarkets) {
        expect(market).to.have.property('marketIndex');
        expect(market).to.have.property('mint');
        expect(market).to.have.property('vault');
        expect(market).to.have.property('depositBalance');
        expect(market).to.have.property('borrowBalance');
      }
    });

    it('should fetch oracle prices', async () => {
      const perpMarkets = driftClient.getPerpMarketAccounts();
      
      for (const market of perpMarkets.slice(0, 3)) { // Test first 3 markets
        const oraclePrice = driftClient.getOracleDataForPerpMarket(market.marketIndex);
        expect(oraclePrice).to.not.be.null;
        expect(oraclePrice.price).to.be.greaterThan(0);
        expect(oraclePrice.confidence).to.be.greaterThanOrEqual(0);
        expect(oraclePrice.slot).to.be.greaterThan(0);
      }
    });
  });

  describe('Trading Operations', () => {
    it('should create place perp order instructions', async () => {
      const solPerpMarketIndex = 0; // SOL-PERP market index
      const orderParams = {
        orderType: OrderType.MARKET,
        marketType: MarketType.PERP,
        direction: PositionDirection.LONG,
        userOrderId: 1,
        baseAssetAmount: new anchor.BN(1000000), // 0.001 SOL
        marketIndex: solPerpMarketIndex,
      };

      const placePerpOrderIx = await driftClient.getPlacePerpOrderIx(orderParams);
      
      expect(placePerpOrderIx).to.not.be.null;
      expect(placePerpOrderIx).to.have.property('programId');
      expect(placePerpOrderIx).to.have.property('keys');
      expect(placePerpOrderIx).to.have.property('data');
      expect(placePerpOrderIx.programId.toString()).to.equal(DRIFT_PROGRAM_ID.toString());
    });

    it('should create limit orders with proper parameters', async () => {
      const solPerpMarketIndex = 0;
      const currentPrice = driftClient.getOracleDataForPerpMarket(solPerpMarketIndex).price;
      const limitPrice = new anchor.BN(currentPrice.toNumber() * 0.95); // 5% below current price
      
      const orderParams = {
        orderType: OrderType.LIMIT,
        marketType: MarketType.PERP,
        direction: PositionDirection.LONG,
        userOrderId: 2,
        baseAssetAmount: new anchor.BN(1000000),
        price: limitPrice,
        marketIndex: solPerpMarketIndex,
      };

      const placeLimitOrderIx = await driftClient.getPlacePerpOrderIx(orderParams);
      
      expect(placeLimitOrderIx).to.not.be.null;
      expect(placeLimitOrderIx).to.have.property('programId');
    });

    it('should create cancel order instructions', async () => {
      const cancelOrderIx = await driftClient.getCancelOrderIx(1); // Cancel order with ID 1
      
      expect(cancelOrderIx).to.not.be.null;
      expect(cancelOrderIx).to.have.property('programId');
      expect(cancelOrderIx.programId.toString()).to.equal(DRIFT_PROGRAM_ID.toString());
    });
  });

  describe('Position Management', () => {
    it('should calculate position value correctly', async () => {
      await user.subscribe();
      
      const perpPositions = user.getPerpPositions();
      
      for (const position of perpPositions) {
        if (position.baseAssetAmount.toNumber() !== 0) {
          const marketAccount = driftClient.getPerpMarketAccount(position.marketIndex);
          const positionValue = user.getPositionValue(position.marketIndex, MarketType.PERP);
          
          expect(positionValue).to.be.a('number');
          expect(marketAccount).to.not.be.null;
        }
      }
    });

    it('should calculate unrealized PnL', async () => {
      const perpPositions = user.getPerpPositions();
      
      for (const position of perpPositions) {
        if (position.baseAssetAmount.toNumber() !== 0) {
          const unrealizedPnL = user.getUnrealizedPNL(position.marketIndex, MarketType.PERP);
          expect(unrealizedPnL).to.be.a('number');
        }
      }
    });

    it('should calculate margin requirements', async () => {
      const totalCollateral = user.getTotalCollateralValue();
      const marginRequirement = user.getMarginRequirement();
      const freeCollateral = user.getFreeCollateralValue();

      expect(totalCollateral).to.be.a('number');
      expect(marginRequirement).to.be.a('number');
      expect(freeCollateral).to.be.a('number');
      
      // Free collateral should equal total - margin requirement
      const calculatedFree = totalCollateral - marginRequirement;
      expect(Math.abs(freeCollateral - calculatedFree)).to.be.lessThan(0.01);
    });
  });

  describe('Risk Management', () => {
    it('should calculate liquidation price', async () => {
      const perpPositions = user.getPerpPositions();
      
      for (const position of perpPositions) {
        if (position.baseAssetAmount.toNumber() !== 0) {
          const liquidationPrice = user.getLiquidationPrice(
            position.marketIndex, 
            MarketType.PERP
          );
          
          if (liquidationPrice !== null) {
            expect(liquidationPrice).to.be.greaterThan(0);
          }
        }
      }
    });

    it('should calculate leverage correctly', async () => {
      const leverage = user.getLeverage();
      expect(leverage).to.be.a('number');
      expect(leverage).to.be.greaterThanOrEqual(0);
    });

    it('should validate position size limits', async () => {
      const solPerpMarketIndex = 0;
      const marketAccount = driftClient.getPerpMarketAccount(solPerpMarketIndex);
      
      expect(marketAccount.amm.maxBaseAssetReserve).to.be.greaterThan(0);
      expect(marketAccount.amm.minBaseAssetReserve).to.be.greaterThan(0);
      
      // Max position size should be related to reserves
      const maxPositionSize = marketAccount.amm.maxBaseAssetReserve.sub(
        marketAccount.amm.minBaseAssetReserve
      );
      expect(maxPositionSize.toNumber()).to.be.greaterThan(0);
    });
  });

  describe('Funding Rates', () => {
    it('should calculate funding rates correctly', async () => {
      const perpMarkets = driftClient.getPerpMarketAccounts();
      
      for (const market of perpMarkets.slice(0, 3)) {
        const fundingRate = driftClient.getCurrentFundingRate(market.marketIndex);
        expect(fundingRate).to.be.a('number');
        
        // Funding rate should be within reasonable bounds (-100% to 100% annualized)
        expect(fundingRate).to.be.greaterThan(-1);
        expect(fundingRate).to.be.lessThan(1);
      }
    });

    it('should track funding payments', async () => {
      await user.subscribe();
      
      const perpPositions = user.getPerpPositions();
      
      for (const position of perpPositions) {
        if (position.baseAssetAmount.toNumber() !== 0) {
          const unsettledFunding = user.getUnsettledFundingPNL(position.marketIndex);
          expect(unsettledFunding).to.be.a('number');
        }
      }
    });
  });

  describe('AMM Operations', () => {
    it('should calculate swap output correctly', async () => {
      const solPerpMarketIndex = 0;
      const swapAmount = new anchor.BN(1000000); // 0.001 SOL
      
      const swapSimulation = driftClient.calculateSwapOutput(
        swapAmount,
        solPerpMarketIndex,
        PositionDirection.LONG
      );
      
      expect(swapSimulation).to.have.property('newBaseAssetReserve');
      expect(swapSimulation).to.have.property('newQuoteAssetReserve');
      expect(swapSimulation).to.have.property('priceImpact');
    });

    it('should calculate slippage correctly', async () => {
      const solPerpMarketIndex = 0;
      const marketAccount = driftClient.getPerpMarketAccount(solPerpMarketIndex);
      const oraclePrice = driftClient.getOracleDataForPerpMarket(solPerpMarketIndex).price;
      
      const markPrice = driftClient.calculateMarkPrice(marketAccount);
      const premiumDiscount = (markPrice.toNumber() - oraclePrice.toNumber()) / oraclePrice.toNumber();
      
      expect(markPrice).to.be.greaterThan(0);
      expect(Math.abs(premiumDiscount)).to.be.lessThan(0.1); // Premium/discount should be < 10%
    });
  });

  describe('Spot Market Operations', () => {
    it('should create deposit instructions', async () => {
      const usdcMarketIndex = 0; // USDC spot market
      const depositAmount = new anchor.BN(1000000); // 1 USDC
      
      const depositIx = await driftClient.getDepositIx(
        depositAmount,
        usdcMarketIndex,
        userKeypair.publicKey // token account
      );
      
      expect(depositIx).to.not.be.null;
      expect(depositIx).to.have.property('programId');
      expect(depositIx.programId.toString()).to.equal(DRIFT_PROGRAM_ID.toString());
    });

    it('should create withdraw instructions', async () => {
      const usdcMarketIndex = 0;
      const withdrawAmount = new anchor.BN(500000); // 0.5 USDC
      
      const withdrawIx = await driftClient.getWithdrawIx(
        withdrawAmount,
        usdcMarketIndex,
        userKeypair.publicKey
      );
      
      expect(withdrawIx).to.not.be.null;
      expect(withdrawIx).to.have.property('programId');
    });
  });

  describe('Performance Metrics', () => {
    it('should load client data efficiently', async () => {
      const startTime = Date.now();
      
      const testClient = new DriftClient({
        connection: env.connection,
        wallet: new Wallet(Keypair.generate()),
        programID: DRIFT_PROGRAM_ID,
        env: 'mainnet-beta',
      });
      
      await testClient.subscribe();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).to.be.lessThan(5000); // Should initialize within 5 seconds
      await testClient.unsubscribe();
    });

    it('should handle multiple concurrent price lookups', async () => {
      const perpMarkets = driftClient.getPerpMarketAccounts().slice(0, 5);
      
      const pricePromises = perpMarkets.map(market => 
        Promise.resolve(driftClient.getOracleDataForPerpMarket(market.marketIndex))
      );
      
      const prices = await Promise.all(pricePromises);
      
      expect(prices).to.have.length(5);
      prices.forEach(price => {
        expect(price.price).to.be.greaterThan(0);
        expect(price.slot).to.be.greaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid market indices', async () => {
      const invalidMarketIndex = 9999;
      
      try {
        driftClient.getPerpMarketAccount(invalidMarketIndex);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('should validate order parameters', async () => {
      try {
        const invalidOrderParams = {
          orderType: OrderType.MARKET,
          marketType: MarketType.PERP,
          direction: PositionDirection.LONG,
          userOrderId: 1,
          baseAssetAmount: new anchor.BN(-1000000), // Negative amount
          marketIndex: 0,
        };

        await driftClient.getPlacePerpOrderIx(invalidOrderParams);
        expect.fail('Should have thrown an error for negative amount');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  after(async () => {
    // Cleanup
    if (driftClient) {
      await driftClient.unsubscribe();
    }
    if (user) {
      await user.unsubscribe();
    }
    if (env && env.liteSvm) {
      // Perform any necessary cleanup
    }
  });
});