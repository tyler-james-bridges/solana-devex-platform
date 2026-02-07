import { NextRequest, NextResponse } from 'next/server';
import { solanaRPC, type SolanaTransactionDebugData } from '../../../lib/solana-rpc';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature } = body;

    // Validate input
    if (!signature || typeof signature !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid transaction signature provided',
        data: null
      }, { status: 400 });
    }

    // Validate signature format (Solana signatures are base58 and ~88 characters)
    if (signature.length < 80 || signature.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Transaction signature format is invalid',
        data: null
      }, { status: 400 });
    }

    // Fetch transaction from Solana RPC
    let transaction;
    try {
      transaction = await solanaRPC.getTransactionDetails(signature);
    } catch (rpcError) {
      console.error('RPC Error:', rpcError);
      
      return NextResponse.json({
        success: false,
        error: `Failed to fetch transaction from Solana RPC: ${rpcError instanceof Error ? rpcError.message : 'Unknown RPC error'}`,
        data: null
      }, { status: 502 });
    }

    // Handle transaction not found
    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found on Solana network',
        data: {
          signature,
          status: 'not-found' as const,
          metadata: {
            blockTime: new Date().toISOString(),
            confirmations: 0,
            programsInvolved: [],
            accountsModified: 0,
            totalInstructions: 0
          }
        } as SolanaTransactionDebugData
      }, { status: 404 });
    }

    // Parse transaction data
    try {
      const cpiFlow = solanaRPC.parseTransactionForCPI(transaction);
      const errors = solanaRPC.analyzeTransactionErrors(transaction);
      const performance = solanaRPC.calculateComputeMetrics(transaction);
      
      // Extract metadata
      const blockTime = transaction.blockTime 
        ? new Date(transaction.blockTime * 1000).toISOString()
        : new Date().toISOString();
      
      const programsInvolved = Array.from(new Set([
        ...cpiFlow.map(step => step.program),
        ...cpiFlow.map(step => step.programId)
      ])).filter(Boolean);

      const accountsModified = Array.from(new Set(
        cpiFlow.flatMap(step => step.accounts.map(acc => acc.pubkey))
      )).length;

      const totalInstructions = cpiFlow.length;

      const debugData: SolanaTransactionDebugData = {
        signature,
        status: 'success',
        cpiFlow,
        errors,
        performance,
        metadata: {
          blockTime,
          confirmations: transaction.slot ? Math.max(0, 200 - (Date.now() / 1000 - (transaction.blockTime || 0)) / 0.4) : 0,
          programsInvolved,
          accountsModified,
          totalInstructions
        }
      };

      const response = NextResponse.json({
        success: true,
        data: debugData,
        timestamp: new Date().toISOString()
      });

      // Cache transaction debugging results for 1 hour (transactions are immutable)
      response.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
      return response;

    } catch (parseError) {
      console.error('Parse Error:', parseError);
      
      return NextResponse.json({
        success: false,
        error: `Failed to parse transaction data: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
        data: null
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    }, { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Support GET for health check
export async function GET() {
  return NextResponse.json({
    service: 'Solana Transaction Debugger API',
    status: 'healthy',
    version: '1.0.0',
    endpoints: {
      'POST /api/debug-transaction': 'Debug a Solana transaction by signature'
    }
  });
}