/**
 * Security Scan API Endpoint
 * 
 * Provides security scanning capabilities using Guardian Security integration
 * Supports program ID and token mint address scanning
 */

import { NextRequest, NextResponse } from 'next/server';
import { GuardianSecurityClient } from '../../../../integrations/guardian';

interface SecurityScanRequest {
  programId?: string;
  mintAddress?: string;
  scanType?: 'token' | 'program' | 'honeypot' | 'whale' | 'comprehensive';
  walletAddress?: string;
}

interface SecurityScanResponse {
  success: boolean;
  data: {
    scanType: string;
    results: any;
    timestamp: string;
    scanId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SecurityScanRequest = await request.json();
    
    // Validate request
    if (!body.programId && !body.mintAddress && !body.walletAddress) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Either programId, mintAddress, or walletAddress must be provided'
        }
      } as SecurityScanResponse, { status: 400 });
    }

    // Initialize Guardian client
    const guardianClient = new GuardianSecurityClient();

    let results: any;
    let scanType: string = 'unknown';

    // Determine scan type and execute appropriate Guardian method
    if (body.scanType === 'token' || (body.mintAddress && !body.programId)) {
      if (!body.mintAddress) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MISSING_MINT_ADDRESS',
            message: 'mintAddress is required for token scanning'
          }
        } as SecurityScanResponse, { status: 400 });
      }

      scanType = 'token';
      
      // Run both token scan and honeypot detection
      const [tokenScan, honeypotCheck] = await Promise.all([
        guardianClient.scanToken(body.mintAddress),
        guardianClient.detectHoneypot(body.mintAddress)
      ]);

      results = {
        tokenScan,
        honeypotCheck,
        combinedRiskScore: Math.max(tokenScan.riskScore, honeypotCheck.isHoneypot ? 90 : 0)
      };

    } else if (body.scanType === 'program' || (body.programId && !body.mintAddress)) {
      if (!body.programId) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MISSING_PROGRAM_ID',
            message: 'programId is required for program scanning'
          }
        } as SecurityScanResponse, { status: 400 });
      }

      scanType = 'program';
      results = await guardianClient.getSecurityReport(body.programId);

    } else if (body.scanType === 'honeypot') {
      const address = body.mintAddress || body.programId;
      if (!address) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Address is required for honeypot detection'
          }
        } as SecurityScanResponse, { status: 400 });
      }

      scanType = 'honeypot';
      results = await guardianClient.detectHoneypot(address);

    } else if (body.scanType === 'whale') {
      if (!body.walletAddress) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'MISSING_WALLET_ADDRESS',
            message: 'walletAddress is required for whale tracking'
          }
        } as SecurityScanResponse, { status: 400 });
      }

      scanType = 'whale';
      results = await guardianClient.trackWhale(body.walletAddress);

    } else if (body.scanType === 'comprehensive') {
      // Run comprehensive scan based on what's provided
      scanType = 'comprehensive';
      const scanResults: any = {};

      if (body.mintAddress) {
        const [tokenScan, honeypotCheck] = await Promise.all([
          guardianClient.scanToken(body.mintAddress),
          guardianClient.detectHoneypot(body.mintAddress)
        ]);
        scanResults.tokenScan = tokenScan;
        scanResults.honeypotCheck = honeypotCheck;
      }

      if (body.programId) {
        scanResults.programScan = await guardianClient.getSecurityReport(body.programId);
      }

      if (body.walletAddress) {
        scanResults.whaleActivity = await guardianClient.trackWhale(body.walletAddress);
      }

      // Always include current threat feed
      scanResults.threatFeed = await guardianClient.getThreatFeed();

      results = scanResults;
    } else {
      // Default behavior: determine scan type automatically
      if (body.mintAddress) {
        scanType = 'token';
        const [tokenScan, honeypotCheck] = await Promise.all([
          guardianClient.scanToken(body.mintAddress),
          guardianClient.detectHoneypot(body.mintAddress)
        ]);
        results = { tokenScan, honeypotCheck };
      } else if (body.programId) {
        scanType = 'program';
        results = await guardianClient.getSecurityReport(body.programId);
      } else if (body.walletAddress) {
        scanType = 'whale';
        results = await guardianClient.trackWhale(body.walletAddress);
      }
    }

    // Return successful response
    const response: SecurityScanResponse = {
      success: true,
      data: {
        scanType,
        results,
        timestamp: new Date().toISOString(),
        scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    const nextResponse = NextResponse.json(response, { status: 200 });
    
    // Security scans should be cached for 5 minutes to reduce function calls
    nextResponse.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=150');
    nextResponse.headers.set('X-Scan-Type', scanType);
    
    return nextResponse;

  } catch (error) {
    console.error('Security scan error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    } as SecurityScanResponse, { status: 500 });
  }
}

// GET endpoint for threat feed and status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get('type') || 'threats';

    const guardianClient = new GuardianSecurityClient();

    if (feedType === 'threats') {
      const threatFeed = await guardianClient.getThreatFeed();
      
      const response = NextResponse.json({
        success: true,
        data: {
          scanType: 'threat_feed',
          results: threatFeed,
          timestamp: new Date().toISOString(),
          count: threatFeed.length
        }
      });
      
      // Cache threat feeds for 10 minutes
      response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
      return response;
    }

    // Default status response
    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        timestamp: new Date().toISOString(),
        availableScans: ['token', 'program', 'honeypot', 'whale', 'comprehensive']
      }
    });

  } catch (error) {
    console.error('Security API error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve security data'
      }
    }, { status: 500 });
  }
}