'use client'

import React, { useState } from 'react';
import {
  Wallet,
  Key,
  Shield,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Lock,
  Unlock,
  RefreshCw,
  Zap,
  Target,
  Settings,
  Globe,
  Database
} from 'lucide-react';

interface AgentWallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
  balance: {
    sol: number;
    tokens: TokenBalance[];
  };
  permissions: WalletPermission[];
  createdAt: Date;
  lastUsed?: Date;
  status: 'active' | 'locked' | 'deprecated';
  securityLevel: 'basic' | 'enhanced' | 'enterprise';
  keystoreType: 'local' | 'hardware' | 'mpc';
}

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  uiAmount: string;
  decimals: number;
}

interface WalletPermission {
  operation: 'transfer' | 'stake' | 'vote' | 'create_account' | 'close_account' | 'program_invoke';
  enabled: boolean;
  limits?: {
    maxAmount?: number;
    dailyLimit?: number;
    requiresApproval?: boolean;
  };
}

interface AgentWalletManagerProps {
  agentId?: string;
  onWalletCreated?: (wallet: AgentWallet) => void;
  onWalletUpdated?: (wallet: AgentWallet) => void;
}

export const AgentWalletManager: React.FC<AgentWalletManagerProps> = ({
  agentId,
  onWalletCreated,
  onWalletUpdated
}) => {
  const [wallets, setWallets] = useState<AgentWallet[]>([
    {
      id: 'wallet_1',
      name: 'Primary Agent Wallet',
      address: 'HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE',
      publicKey: 'ed25519:EXAMPLE_PUBLIC_KEY_NOT_REAL_1234567890abcdef1234567890abcdef',
      encryptedPrivateKey: 'encrypted:aes256:EXAMPLE_ENCRYPTED_PRIVATE_KEY_NOT_REAL',
      balance: {
        sol: 12.5,
        tokens: [
          { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', amount: 1500000000, uiAmount: '1,500.00', decimals: 6 },
          { mint: 'So11111111111111111111111111111111111111112', symbol: 'wSOL', amount: 5000000000, uiAmount: '5.00', decimals: 9 }
        ]
      },
      permissions: [
        { operation: 'transfer', enabled: true, limits: { maxAmount: 100, dailyLimit: 1000 } },
        { operation: 'stake', enabled: true, limits: { maxAmount: 50 } },
        { operation: 'program_invoke', enabled: false, limits: { requiresApproval: true } }
      ],
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date(),
      status: 'active',
      securityLevel: 'enhanced',
      keystoreType: 'local'
    }
  ]);

  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showWalletCreator, setShowWalletCreator] = useState(false);
  const [newWalletForm, setNewWalletForm] = useState({
    name: '',
    securityLevel: 'enhanced' as 'basic' | 'enhanced' | 'enterprise',
    keystoreType: 'local' as 'local' | 'hardware' | 'mpc'
  });

  const createNewWallet = async () => {
    setIsCreatingWallet(true);

    // Simulate wallet creation process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newWallet: AgentWallet = {
      id: `wallet_${Date.now()}`,
      name: newWalletForm.name || `Agent Wallet ${wallets.length + 1}`,
      address: generateMockAddress(),
      publicKey: generateMockPublicKey(),
      encryptedPrivateKey: 'encrypted:aes256:MOCK_KEY_' + generateMockHash(),
      balance: {
        sol: 0,
        tokens: []
      },
      permissions: [
        { operation: 'transfer', enabled: true, limits: { maxAmount: 10, dailyLimit: 100 } },
        { operation: 'stake', enabled: false },
        { operation: 'vote', enabled: false },
        { operation: 'create_account', enabled: true },
        { operation: 'close_account', enabled: false },
        { operation: 'program_invoke', enabled: false, limits: { requiresApproval: true } }
      ],
      createdAt: new Date(),
      status: 'active',
      securityLevel: newWalletForm.securityLevel,
      keystoreType: newWalletForm.keystoreType
    };

    setWallets([...wallets, newWallet]);
    setIsCreatingWallet(false);
    setShowWalletCreator(false);
    setNewWalletForm({ name: '', securityLevel: 'enhanced', keystoreType: 'local' });
    onWalletCreated?.(newWallet);
  };

  const generateMockAddress = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateMockPublicKey = () => {
    return 'ed25519:MOCK_KEY_' + Array.from({length: 56}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const generateMockHash = () => {
    return Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const togglePrivateKeyVisibility = (walletId: string) => {
    setShowPrivateKey(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'basic': return <Shield className="w-4 h-4 text-yellow-600" />;
      case 'enhanced': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'enterprise': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getKeystoreIcon = (type: string) => {
    switch (type) {
      case 'local': return <Database className="w-4 h-4 text-blue-600" />;
      case 'hardware': return <Lock className="w-4 h-4 text-green-600" />;
      case 'mpc': return <Globe className="w-4 h-4 text-purple-600" />;
      default: return <Key className="w-4 h-4 text-gray-600" />;
    }
  };

  const updatePermission = (walletId: string, operation: string, enabled: boolean) => {
    setWallets(wallets.map(wallet => {
      if (wallet.id === walletId) {
        const updatedWallet = {
          ...wallet,
          permissions: wallet.permissions.map(perm => 
            perm.operation === operation ? { ...perm, enabled } : perm
          )
        };
        onWalletUpdated?.(updatedWallet);
        return updatedWallet;
      }
      return wallet;
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Wallet className="w-6 h-6 mr-3 text-blue-600" />
            Agent Wallet Manager
          </h3>
          <button
            onClick={() => setShowWalletCreator(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Wallets</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{wallets.length}</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Total SOL Balance</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {wallets.reduce((sum, wallet) => sum + wallet.balance.sol, 0).toFixed(2)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Active Wallets</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {wallets.filter(w => w.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Creator Modal */}
      {showWalletCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Agent Wallet</h4>
                <button
                  onClick={() => setShowWalletCreator(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    value={newWalletForm.name}
                    onChange={(e) => setNewWalletForm({...newWalletForm, name: e.target.value})}
                    placeholder="e.g., Trading Bot Wallet"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Security Level
                  </label>
                  <select
                    value={newWalletForm.securityLevel}
                    onChange={(e) => setNewWalletForm({...newWalletForm, securityLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Basic - Standard encryption</option>
                    <option value="enhanced">Enhanced - Multi-sig ready</option>
                    <option value="enterprise">Enterprise - Hardware security</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keystore Type
                  </label>
                  <select
                    value={newWalletForm.keystoreType}
                    onChange={(e) => setNewWalletForm({...newWalletForm, keystoreType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="local">Local - Encrypted on device</option>
                    <option value="hardware">Hardware - External device</option>
                    <option value="mpc">MPC - Multi-party computation</option>
                  </select>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Security Notice</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Private keys are encrypted using AES-256 and never transmitted in plain text. 
                        Backup your recovery phrase securely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowWalletCreator(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewWallet}
                  disabled={isCreatingWallet}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isCreatingWallet ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Wallet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallets List */}
      <div className="p-6">
        <div className="space-y-6">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
              {/* Wallet Header */}
              <div className="p-4 border-b dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      wallet.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-gray-100 dark:bg-gray-600'
                    }`}>
                      <Wallet className={`w-5 h-5 ${
                        wallet.status === 'active' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{wallet.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        {getSecurityIcon(wallet.securityLevel)}
                        <span>{wallet.securityLevel}</span>
                        <span>•</span>
                        {getKeystoreIcon(wallet.keystoreType)}
                        <span>{wallet.keystoreType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      wallet.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {wallet.status}
                    </span>
                    <button
                      onClick={() => setSelectedWallet(selectedWallet === wallet.id ? null : wallet.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Address & Keys */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600 font-mono">
                        {wallet.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(wallet.address)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://solscan.io/account/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Private Key
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 text-sm bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600 font-mono">
                        {showPrivateKey[wallet.id] 
                          ? wallet.encryptedPrivateKey.replace('encrypted:aes256:', '')
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        }
                      </code>
                      <button
                        onClick={() => togglePrivateKeyVisibility(wallet.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPrivateKey[wallet.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(wallet.encryptedPrivateKey)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance & Tokens */}
              <div className="p-4 border-b dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">SOL Balance</h5>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {wallet.balance.sol} SOL
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ≈ ${(wallet.balance.sol * 174.89).toFixed(2)} USD
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Tokens ({wallet.balance.tokens.length})
                    </h5>
                    <div className="space-y-1">
                      {wallet.balance.tokens.slice(0, 3).map((token, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">{token.symbol}</span>
                          <span className="text-gray-600 dark:text-gray-400">{token.uiAmount}</span>
                        </div>
                      ))}
                      {wallet.balance.tokens.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{wallet.balance.tokens.length - 3} more tokens
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              {selectedWallet === wallet.id && (
                <div className="p-4">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Wallet Permissions</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wallet.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {permission.operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {permission.limits && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {permission.limits.maxAmount && `Max: ${permission.limits.maxAmount} SOL`}
                              {permission.limits.dailyLimit && ` | Daily: ${permission.limits.dailyLimit} SOL`}
                              {permission.limits.requiresApproval && ' | Requires approval'}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => updatePermission(wallet.id, permission.operation, !permission.enabled)}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            permission.enabled 
                              ? 'bg-green-600' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            permission.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                      <Shield className="w-4 h-4" />
                      <span>Security features active: Multi-signature support, transaction limits, audit logging</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {wallets.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No wallets yet</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first agent wallet to get started
            </p>
            <button
              onClick={() => setShowWalletCreator(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentWalletManager;