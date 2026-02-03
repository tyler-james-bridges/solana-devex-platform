import { Template } from './index';

export const CLIENT_TEMPLATES: Template[] = [
  {
    id: 'anchor-client-ts',
    name: 'Anchor TypeScript Client',
    description: 'TypeScript client for interacting with Anchor programs',
    category: 'client',
    language: 'typescript',
    files: [
      {
        path: 'app/client.ts',
        content: `import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Connection, PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { __PROJECT_NAME__ } from '../target/types/__project_name__';
import idl from '../target/idl/__project_name__.json';

export class __PROJECT_NAME__Client {
  private program: Program<__PROJECT_NAME__>;
  private provider: anchor.AnchorProvider;
  
  constructor(connection: Connection, wallet: anchor.Wallet) {
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    this.program = new Program<__PROJECT_NAME__>(
      idl as any,
      new PublicKey("11111111111111111111111111111112"), // Program ID
      this.provider
    );
  }

  async initialize(data: number): Promise<string> {
    const baseAccount = Keypair.generate();
    
    const tx = await this.program.methods
      .initialize(new anchor.BN(data))
      .accounts({
        baseAccount: baseAccount.publicKey,
        user: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([baseAccount])
      .rpc();

    console.log("Transaction signature:", tx);
    return tx;
  }

  async update(baseAccount: PublicKey, data: number): Promise<string> {
    const tx = await this.program.methods
      .update(new anchor.BN(data))
      .accounts({
        baseAccount: baseAccount,
      })
      .rpc();

    console.log("Update transaction signature:", tx);
    return tx;
  }

  async getAccountData(baseAccount: PublicKey): Promise<any> {
    const account = await this.program.account.baseAccount.fetch(baseAccount);
    return account;
  }

  async getAllAccounts(): Promise<any[]> {
    const accounts = await this.program.account.baseAccount.all();
    return accounts;
  }

  // Event listening
  addEventListener(eventName: string, callback: (event: any, slot: number) => void): number {
    return this.program.addEventListener(eventName, callback);
  }

  async removeEventListener(listener: number): Promise<void> {
    await this.program.removeEventListener(listener);
  }
}

// Usage example
export async function createClient(): Promise<__PROJECT_NAME__Client> {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  
  // In browser, use window.solana.publicKey and wallet adapter
  // For testing, create a keypair
  const keypair = Keypair.generate();
  const wallet = new anchor.Wallet(keypair);
  
  return new __PROJECT_NAME__Client(connection, wallet);
}
`
      },
      {
        path: 'app/package.json',
        content: `{
  "name": "__project_name__-client",
  "version": "1.0.0",
  "description": "TypeScript client for __PROJECT_NAME__",
  "main": "client.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "dev": "ts-node client.ts"
  },
  "dependencies": {
    "@project-serum/anchor": "^0.29.0",
    "@solana/web3.js": "^1.87.6",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-wallets": "^0.19.32"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-node": "^10.9.2"
  }
}
`
      }
    ],
    dependencies: ['@project-serum/anchor', '@solana/web3.js'],
    setup: [
      'npm install',
      'anchor generate',
      'npm run build'
    ]
  },

  {
    id: 'jupiter-swap-client',
    name: 'Jupiter Swap Client',
    description: 'Client for integrating with Jupiter DEX aggregator',
    category: 'client',
    language: 'typescript',
    files: [
      {
        path: 'src/jupiter-client.ts',
        content: `import { Connection, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import fetch from 'cross-fetch';

export interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  userPublicKey: string;
}

export interface RouteInfo {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  priceImpactPct: string;
  routePlan: any[];
}

export class JupiterClient {
  private connection: Connection;
  private wallet: Wallet;
  
  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async getQuote(params: SwapParams): Promise<RouteInfo> {
    const quoteUrl = \`https://quote-api.jup.ag/v6/quote?\` + new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount.toString(),
      slippageBps: params.slippageBps.toString(),
    });

    const response = await fetch(quoteUrl);
    const quote = await response.json();
    
    if (!response.ok) {
      throw new Error(\`Failed to get quote: \${quote.error}\`);
    }
    
    return quote;
  }

  async executeSwap(route: RouteInfo): Promise<string> {
    try {
      // Get swap transaction
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: route,
          userPublicKey: this.wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
        })
      });

      const { swapTransaction } = await swapResponse.json();
      
      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign transaction
      transaction.sign([this.wallet.payer]);
      
      // Send transaction
      const signature = await this.connection.sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      console.log(\`Swap executed: \${signature}\`);
      return signature;
      
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }

  async getTokenPrice(mintAddress: string): Promise<number> {
    const priceUrl = \`https://price.jup.ag/v4/price?ids=\${mintAddress}\`;
    const response = await fetch(priceUrl);
    const data = await response.json();
    
    return data.data[mintAddress]?.price || 0;
  }

  async findBestRoute(params: SwapParams): Promise<RouteInfo[]> {
    const routesUrl = \`https://quote-api.jup.ag/v6/quote?\` + new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount.toString(),
      slippageBps: params.slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false'
    });

    const response = await fetch(routesUrl);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(\`Failed to get routes: \${data.error}\`);
    }
    
    return [data]; // Jupiter v6 returns single best route
  }
}

// Usage example
export async function createJupiterClient(): Promise<JupiterClient> {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const wallet = new Wallet(Keypair.generate()); // Replace with actual wallet
  
  return new JupiterClient(connection, wallet);
}

// Example swap function
export async function performSwap() {
  const client = await createJupiterClient();
  
  const swapParams: SwapParams = {
    inputMint: 'So11111111111111111111111111111111111111112', // SOL
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    amount: 1000000, // 0.001 SOL
    slippageBps: 50, // 0.5%
    userPublicKey: client.wallet.publicKey.toString()
  };
  
  try {
    const quote = await client.getQuote(swapParams);
    console.log('Quote:', quote);
    
    const signature = await client.executeSwap(quote);
    console.log('Swap completed:', signature);
    
  } catch (error) {
    console.error('Swap failed:', error);
  }
}
`
      },
      {
        path: 'src/package.json',
        content: `{
  "name": "__project_name__-jupiter-client",
  "version": "1.0.0",
  "description": "Jupiter swap client for __PROJECT_NAME__",
  "main": "jupiter-client.ts",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node jupiter-client.ts",
    "test": "jest"
  },
  "dependencies": {
    "@solana/web3.js": "^1.87.6",
    "@project-serum/anchor": "^0.29.0",
    "cross-fetch": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
`
      }
    ],
    dependencies: ['@solana/web3.js', 'cross-fetch'],
    setup: [
      'npm install',
      'npm run build'
    ]
  },

  {
    id: 'python-solana-client',
    name: 'Python Solana Client',
    description: 'Python client using solana-py and anchorpy',
    category: 'client',
    language: 'python',
    files: [
      {
        path: 'client.py',
        content: `"""
Solana Python Client for __PROJECT_NAME__
"""
import asyncio
import json
from typing import Optional, List, Dict, Any
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import Transaction
from anchorpy import Program, Provider, Wallet
import aiohttp

class __PROJECT_NAME__Client:
    def __init__(
        self, 
        rpc_url: str = "http://127.0.0.1:8899",
        commitment: Commitment = Commitment("confirmed")
    ):
        self.client = AsyncClient(rpc_url, commitment=commitment)
        self.program_id = "__PROGRAM_ID__"  # Replace with actual program ID
        
    async def initialize_provider(self, keypair_path: str):
        """Initialize provider with keypair from file"""
        with open(keypair_path, 'r') as f:
            secret_key = json.load(f)
        
        keypair = Keypair.from_secret_key(bytes(secret_key))
        wallet = Wallet(keypair)
        self.provider = Provider(self.client, wallet)
        
        # Load IDL and initialize program
        with open('target/idl/__project_name__.json', 'r') as f:
            idl = json.load(f)
            
        self.program = Program(idl, self.program_id, self.provider)
        
    async def get_account_info(self, account_pubkey: str) -> Optional[Dict]:
        """Get account information"""
        try:
            pubkey = PublicKey(account_pubkey)
            account_info = await self.client.get_account_info(pubkey)
            return account_info
        except Exception as e:
            print(f"Error getting account info: {e}")
            return None
            
    async def get_balance(self, pubkey: str) -> float:
        """Get SOL balance"""
        try:
            balance = await self.client.get_balance(PublicKey(pubkey))
            return balance.value / 1e9  # Convert lamports to SOL
        except Exception as e:
            print(f"Error getting balance: {e}")
            return 0.0
            
    async def send_transaction(self, transaction: Transaction) -> Optional[str]:
        """Send a transaction to the network"""
        try:
            result = await self.client.send_transaction(transaction)
            signature = result.value
            
            # Wait for confirmation
            await self.client.confirm_transaction(signature)
            return signature
        except Exception as e:
            print(f"Error sending transaction: {e}")
            return None
            
    async def fetch_program_accounts(self) -> List[Dict]:
        """Fetch all program accounts"""
        try:
            accounts = await self.program.account.base_account.all()
            return accounts
        except Exception as e:
            print(f"Error fetching program accounts: {e}")
            return []
            
    async def close(self):
        """Close the client connection"""
        await self.client.close()

class JupiterPythonClient:
    """Jupiter integration for Python"""
    
    def __init__(self):
        self.base_url = "https://quote-api.jup.ag/v6"
        
    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50
    ) -> Dict:
        """Get swap quote from Jupiter"""
        params = {
            'inputMint': input_mint,
            'outputMint': output_mint,
            'amount': str(amount),
            'slippageBps': str(slippage_bps)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/quote", params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Failed to get quote: {response.status}")
                    
    async def get_token_price(self, mint_address: str) -> float:
        """Get token price from Jupiter"""
        async with aiohttp.ClientSession() as session:
            url = f"https://price.jup.ag/v4/price?ids={mint_address}"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data['data'][mint_address]['price']
                else:
                    return 0.0

# Utility functions
async def create_client(rpc_url: str = "http://127.0.0.1:8899") -> __PROJECT_NAME__Client:
    """Create and return a configured client"""
    client = __PROJECT_NAME__Client(rpc_url)
    return client

async def main():
    """Example usage"""
    client = await create_client()
    
    try:
        # Initialize with keypair
        await client.initialize_provider("~/.config/solana/id.json")
        
        # Get program accounts
        accounts = await client.fetch_program_accounts()
        print(f"Found {len(accounts)} program accounts")
        
        # Get balance
        balance = await client.get_balance(str(client.provider.wallet.public_key))
        print(f"Wallet balance: {balance} SOL")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
`
      },
      {
        path: 'requirements.txt',
        content: `solana-py>=0.31.0
anchorpy>=0.19.0
aiohttp>=3.9.0
pytest>=7.4.0
pytest-asyncio>=0.21.0
`
      }
    ],
    dependencies: ['solana-py', 'anchorpy'],
    setup: [
      'pip install -r requirements.txt',
      'python client.py'
    ]
  }
];`