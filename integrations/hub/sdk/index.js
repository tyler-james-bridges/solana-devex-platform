/**
 * Solana DevEx Integration SDK
 * Ultra-simple SDK for connecting to the Solana DevEx Platform
 */

class SolanaDevExClient {
  constructor(options = {}) {
    this.projectId = options.projectId;
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.solana-devex.com';
    this.environment = options.environment || 'production';
    this.timeout = options.timeout || 30000;
    
    if (!this.projectId || !this.apiKey) {
      throw new Error('projectId and apiKey are required');
    }
  }

  // Core request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api/projects/${this.projectId}${endpoint}`;
    
    const config = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-SDK-Version': '1.0.0',
        'X-Environment': this.environment,
        ...options.headers
      },
      ...options
    };

    if (config.method !== 'GET' && options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SolanaDevEx SDK Error:', error);
      throw error;
    }
  }

  // Connection status
  async getStatus() {
    return this.request('/status');
  }

  // Wallet operations
  async getBalance(address, token = 'SOL') {
    return this.request(`/balance?address=${address}&token=${token}`);
  }

  async getTransaction(signature) {
    return this.request(`/transaction/${signature}`);
  }

  async sendTransaction(transaction) {
    return this.request('/transaction', {
      method: 'POST',
      data: transaction
    });
  }

  // Token operations
  async getTokenPrice(mint) {
    return this.request(`/price?mint=${mint}`);
  }

  async getTokenInfo(mint) {
    return this.request(`/token/${mint}`);
  }

  // NFT operations (if using NFT template)
  async mintNFT(metadata) {
    return this.request('/mint', {
      method: 'POST',
      data: metadata
    });
  }

  async getNFTCollection(collection) {
    return this.request(`/collection/${collection}`);
  }

  async transferNFT(data) {
    return this.request('/transfer', {
      method: 'POST',
      data
    });
  }

  // Trading operations (if using trading template)
  async executeTrade(tradeData) {
    return this.request('/trade', {
      method: 'POST',
      data: tradeData
    });
  }

  async getPortfolio(address) {
    return this.request(`/portfolio?address=${address}`);
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage, onError) {
    const wsUrl = this.baseURL.replace('http', 'ws') + `/ws/${this.projectId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Solana DevEx WebSocket');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        apiKey: this.apiKey
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return ws;
  }

  // Webhook setup
  setWebhookUrl(url) {
    return this.request('/webhook', {
      method: 'POST',
      data: { url }
    });
  }

  // Custom endpoint calls
  async callEndpoint(path, method = 'GET', data = null) {
    return this.request(path, {
      method,
      data
    });
  }
}

// React Hook for easy integration
function useSolanaDevEx(options) {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState({ loading: true, connected: false, error: null });

  useEffect(() => {
    const initClient = async () => {
      try {
        const newClient = new SolanaDevExClient(options);
        await newClient.getStatus(); // Test connection
        setClient(newClient);
        setStatus({ loading: false, connected: true, error: null });
      } catch (error) {
        setStatus({ loading: false, connected: false, error: error.message });
      }
    };

    initClient();
  }, []);

  return { client, status };
}

// Express.js middleware for webhook handling
function createWebhookMiddleware(secret) {
  return (req, res, next) => {
    // Verify webhook signature
    const signature = req.headers['x-solana-devex-signature'];
    const payload = JSON.stringify(req.body);
    
    // In production, verify signature with HMAC
    // const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    req.solanaDevExWebhook = req.body;
    next();
  };
}

// Utility functions
const utils = {
  // Convert lamports to SOL
  lamportsToSol(lamports) {
    return lamports / 1000000000;
  },

  // Convert SOL to lamports
  solToLamports(sol) {
    return Math.floor(sol * 1000000000);
  },

  // Format Solana address (truncate)
  formatAddress(address, length = 8) {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  },

  // Validate Solana address
  isValidSolanaAddress(address) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  },

  // Parse transaction error
  parseTransactionError(error) {
    if (typeof error === 'string') {
      return error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown transaction error';
  }
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = {
    SolanaDevExClient,
    createWebhookMiddleware,
    utils
  };
} else if (typeof window !== 'undefined') {
  // Browser
  window.SolanaDevEx = {
    Client: SolanaDevExClient,
    useSolanaDevEx,
    utils
  };
} else {
  // ES Modules
  export {
    SolanaDevExClient as default,
    SolanaDevExClient,
    useSolanaDevEx,
    createWebhookMiddleware,
    utils
  };
}