/**
 * Integration Templates for Common Patterns
 * Ready-to-use templates that projects can deploy in minutes
 */

const templates = {
  'basic-solana': {
    name: 'Basic Solana Integration',
    description: 'Simple wallet operations and transaction handling',
    category: 'Basic',
    setupTime: '2-3 minutes',
    endpoints: [
      {
        path: '/balance',
        method: 'GET',
        description: 'Get wallet balance',
        params: ['address', 'token?'],
        example: '/balance?address=9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM&token=SOL'
      },
      {
        path: '/transaction',
        method: 'POST',
        description: 'Send transaction',
        body: {
          from: 'sender_address',
          to: 'recipient_address', 
          amount: 'amount_in_lamports',
          memo: 'optional_memo'
        }
      },
      {
        path: '/status',
        method: 'GET',
        description: 'Get connection status',
        response: {
          connected: true,
          cluster: 'mainnet-beta',
          blockHeight: 123456789
        }
      }
    ],
    code: {
      javascript: `
// Initialize the client
const { SolanaDevExClient } = require('@solana-devex/integration-sdk');

const client = new SolanaDevExClient({
  projectId: 'YOUR_PROJECT_ID',
  apiKey: 'YOUR_API_KEY'
});

// Get wallet balance
async function getBalance(address) {
  try {
    const balance = await client.getBalance(address);
    console.log(\`Balance: \${balance.sol} SOL\`);
    return balance;
  } catch (error) {
    console.error('Error getting balance:', error);
  }
}

// Send transaction
async function sendSOL(from, to, amount) {
  try {
    const transaction = await client.sendTransaction({
      from,
      to,
      amount: amount * 1000000000, // Convert to lamports
      memo: 'Sent via Solana DevEx'
    });
    console.log('Transaction signature:', transaction.signature);
    return transaction;
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}
      `,
      python: `
import requests
import json

class SolanaDevExClient:
    def __init__(self, project_id, api_key, base_url="https://api.solana-devex.com"):
        self.project_id = project_id
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_balance(self, address, token="SOL"):
        url = f"{self.base_url}/api/projects/{self.project_id}/balance"
        params = {'address': address, 'token': token}
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def send_transaction(self, transaction_data):
        url = f"{self.base_url}/api/projects/{self.project_id}/transaction"
        response = requests.post(url, headers=self.headers, json=transaction_data)
        return response.json()

# Usage
client = SolanaDevExClient('YOUR_PROJECT_ID', 'YOUR_API_KEY')
balance = client.get_balance('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
print(f"Balance: {balance['sol']} SOL")
      `
    }
  },

  'nft-platform': {
    name: 'NFT Platform',
    description: 'Complete NFT minting, trading, and collection management',
    category: 'NFT',
    setupTime: '3-4 minutes',
    endpoints: [
      {
        path: '/mint',
        method: 'POST',
        description: 'Mint a new NFT',
        body: {
          name: 'NFT Name',
          description: 'NFT Description',
          image: 'https://example.com/image.png',
          attributes: [{ trait_type: 'Color', value: 'Blue' }],
          recipient: 'recipient_address'
        }
      },
      {
        path: '/collection/:collectionId',
        method: 'GET',
        description: 'Get collection metadata and NFTs'
      },
      {
        path: '/transfer',
        method: 'POST',
        description: 'Transfer NFT to another wallet',
        body: {
          mint: 'nft_mint_address',
          from: 'current_owner',
          to: 'new_owner'
        }
      }
    ],
    code: {
      javascript: `
const client = new SolanaDevExClient({
  projectId: 'YOUR_PROJECT_ID',
  apiKey: 'YOUR_API_KEY'
});

// Mint an NFT
async function mintNFT(metadata) {
  const nft = await client.mintNFT({
    name: metadata.name,
    description: metadata.description,
    image: metadata.imageUrl,
    attributes: metadata.attributes,
    recipient: metadata.recipient
  });
  
  console.log('NFT minted:', nft.mint);
  return nft;
}

// Get collection
async function getCollection(collectionId) {
  const collection = await client.getNFTCollection(collectionId);
  console.log(\`Collection has \${collection.nfts.length} NFTs\`);
  return collection;
}
      `
    }
  },

  'trading-bot': {
    name: 'Trading Bot',
    description: 'Automated trading with price monitoring and portfolio management',
    category: 'DeFi',
    setupTime: '4-5 minutes',
    endpoints: [
      {
        path: '/price/:mint',
        method: 'GET',
        description: 'Get current token price'
      },
      {
        path: '/trade',
        method: 'POST',
        description: 'Execute a trade',
        body: {
          inputMint: 'token_to_sell',
          outputMint: 'token_to_buy',
          amount: 'amount_to_trade',
          slippage: 0.5
        }
      },
      {
        path: '/portfolio/:address',
        method: 'GET',
        description: 'Get portfolio overview'
      }
    ],
    code: {
      javascript: `
class TradingBot {
  constructor(projectId, apiKey) {
    this.client = new SolanaDevExClient({ projectId, apiKey });
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log('Trading bot started');
    
    while (this.isRunning) {
      await this.checkPrices();
      await this.sleep(30000); // Check every 30 seconds
    }
  }

  async checkPrices() {
    try {
      const solPrice = await this.client.getTokenPrice('So11111111111111111111111111111111111111112');
      console.log(\`SOL Price: $\${solPrice.usd}\`);
      
      // Implement your trading logic here
      if (solPrice.usd < 50) {
        await this.buySOL();
      }
    } catch (error) {
      console.error('Price check error:', error);
    }
  }

  async buySOL() {
    const trade = await this.client.executeTrade({
      inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      outputMint: 'So11111111111111111111111111111111111111112', // SOL
      amount: 100, // $100 USDC
      slippage: 0.5
    });
    
    console.log('Trade executed:', trade.signature);
  }
}
      `
    }
  },

  'defi-protocol': {
    name: 'DeFi Protocol',
    description: 'Liquidity pools, staking, and yield farming integration',
    category: 'DeFi',
    setupTime: '5-6 minutes',
    endpoints: [
      {
        path: '/pools',
        method: 'GET',
        description: 'Get available liquidity pools'
      },
      {
        path: '/stake',
        method: 'POST',
        description: 'Stake tokens',
        body: {
          mint: 'token_mint',
          amount: 'amount_to_stake',
          pool: 'staking_pool'
        }
      },
      {
        path: '/rewards/:address',
        method: 'GET',
        description: 'Get staking rewards'
      }
    ],
    code: {
      javascript: `
// DeFi Protocol Integration
const client = new SolanaDevExClient({
  projectId: 'YOUR_PROJECT_ID',
  apiKey: 'YOUR_API_KEY'
});

async function stakingExample() {
  // Get available pools
  const pools = await client.callEndpoint('/pools');
  console.log('Available pools:', pools);

  // Stake tokens
  const stakeResult = await client.callEndpoint('/stake', 'POST', {
    mint: 'So11111111111111111111111111111111111111112', // SOL
    amount: 5.0,
    pool: pools[0].id
  });
  
  console.log('Staked successfully:', stakeResult);

  // Check rewards
  const rewards = await client.callEndpoint('/rewards/YOUR_WALLET_ADDRESS');
  console.log('Current rewards:', rewards);
}
      `
    }
  },

  'gaming': {
    name: 'Gaming Application',
    description: 'In-game assets, rewards, and player progression',
    category: 'Gaming',
    setupTime: '3-4 minutes',
    endpoints: [
      {
        path: '/player/:address',
        method: 'GET',
        description: 'Get player profile and assets'
      },
      {
        path: '/reward',
        method: 'POST',
        description: 'Award in-game rewards',
        body: {
          player: 'player_address',
          reward_type: 'tokens|nft|experience',
          amount: 100
        }
      },
      {
        path: '/leaderboard',
        method: 'GET',
        description: 'Get game leaderboard'
      }
    ],
    code: {
      javascript: `
class GameIntegration {
  constructor(projectId, apiKey) {
    this.client = new SolanaDevExClient({ projectId, apiKey });
  }

  async getPlayerProfile(address) {
    return await this.client.callEndpoint(\`/player/\${address}\`);
  }

  async rewardPlayer(playerAddress, rewardType, amount) {
    return await this.client.callEndpoint('/reward', 'POST', {
      player: playerAddress,
      reward_type: rewardType,
      amount: amount
    });
  }

  async getLeaderboard() {
    return await this.client.callEndpoint('/leaderboard');
  }
}

// Usage
const game = new GameIntegration('YOUR_PROJECT_ID', 'YOUR_API_KEY');

// Reward player for completing a level
await game.rewardPlayer(
  'player_wallet_address',
  'tokens',
  100
);
      `
    }
  }
};

// Template deployment helpers
class TemplateDeployer {
  constructor(integrationHub) {
    this.hub = integrationHub;
  }

  async deployTemplate(templateId, projectConfig) {
    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create project with template
    const project = await this.hub.createProject({
      ...projectConfig,
      template: templateId,
      endpoints: template.endpoints.map(endpoint => ({
        ...endpoint,
        id: require('uuid').v4()
      }))
    });

    // Generate implementation files
    const implementationFiles = this.generateImplementationFiles(template, project);

    return {
      project,
      template,
      implementationFiles,
      quickStartGuide: this.generateQuickStartGuide(template, project)
    };
  }

  generateImplementationFiles(template, project) {
    return {
      'index.js': template.code.javascript,
      'client.py': template.code.python || '',
      'package.json': JSON.stringify({
        name: `${project.name.toLowerCase().replace(/\s+/g, '-')}-solana-integration`,
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          '@solana-devex/integration-sdk': '^1.0.0'
        }
      }, null, 2),
      'README.md': this.generateReadme(template, project),
      '.env.example': `
SOLANA_DEVEX_PROJECT_ID=${project.id}
SOLANA_DEVEX_API_KEY=your_api_key_here
SOLANA_DEVEX_ENVIRONMENT=production
      `.trim()
    };
  }

  generateReadme(template, project) {
    return `
# ${project.name} - Solana DevEx Integration

${template.description}

## Quick Setup (${template.setupTime})

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Add your API key to \`.env\`

4. Run the integration:
   \`\`\`bash
   node index.js
   \`\`\`

## Available Endpoints

${template.endpoints.map(endpoint => `
### ${endpoint.method} ${endpoint.path}
${endpoint.description}

${endpoint.example ? `**Example:** \`${endpoint.example}\`` : ''}
${endpoint.body ? `**Request Body:**
\`\`\`json
${JSON.stringify(endpoint.body, null, 2)}
\`\`\`` : ''}
`).join('')}

## Documentation

Full API documentation: [View Docs](https://api.solana-devex.com/api/integrate/${project.id}/docs)

## Support

- Dashboard: [View Dashboard](https://solana-devex.com/dashboard/${project.id})
- Discord: [Join Community](https://discord.gg/solana-devex)
- Email: support@solana-devex.com
    `.trim();
  }
}

module.exports = {
  templates,
  TemplateDeployer
};