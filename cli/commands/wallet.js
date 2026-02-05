/**
 * Wallet-Standard Connection Commands
 * Official wallet connection patterns
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Main wallet command handler
 */
async function main(options) {
  console.log(chalk.cyan('ëõ Wallet-Standard Connection Patterns'));
  console.log(chalk.gray('Official wallet connection following wallet-standard'));
  
  if (options.setup) {
    await setupWalletConnection();
  } else {
    await showWalletOptions();
  }
}

/**
 * Show wallet configuration options
 */
async function showWalletOptions() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: ' Setup wallet connection',
          value: 'setup',
          short: 'Setup'
        },
        {
          name: 'ê Generate React wallet component',
          value: 'react-component',
          short: 'React Component'
        },
        {
          name: '± Generate wallet adapter utilities',
          value: 'utilities',
          short: 'Utilities'
        },
        {
          name: ' Generate wallet testing helpers',
          value: 'testing',
          short: 'Testing'
        },
        {
          name: ' Show wallet-standard examples',
          value: 'examples',
          short: 'Examples'
        }
      ]
    }
  ]);

  switch (answers.action) {
    case 'setup':
      await setupWalletConnection();
      break;
    case 'react-component':
      await generateReactWalletComponent();
      break;
    case 'utilities':
      await generateWalletUtilities();
      break;
    case 'testing':
      await generateWalletTestingHelpers();
      break;
    case 'examples':
      await showWalletExamples();
      break;
  }
}

/**
 * Setup wallet connection infrastructure
 */
async function setupWalletConnection() {
  console.log(chalk.yellow(' Setting up Wallet-Standard Connection...'));

  // Check project type
  const projectType = await detectProjectType();
  
  console.log(chalk.gray(`Detected project type: ${projectType}`));

  try {
    // Install necessary dependencies
    await installWalletDependencies(projectType);
    
    // Generate wallet infrastructure
    await generateWalletInfrastructure(projectType);
    
    console.log(chalk.green(' Wallet connection setup completed!'));
    console.log(chalk.cyan('\\n Next Steps:'));
    
    if (projectType === 'react') {
      console.log(chalk.gray('  1. Import WalletProvider in your app layout'));
      console.log(chalk.gray('  2. Use useWallet hook in components'));
      console.log(chalk.gray('  3. Test with: npm run dev'));
    } else {
      console.log(chalk.gray('  1. Import wallet utilities in your code'));
      console.log(chalk.gray('  2. Call setupWalletConnection() before transactions'));
      console.log(chalk.gray('  3. Test with: npm run start'));
    }
    
  } catch (error) {
    console.error(chalk.red(` Wallet setup failed: ${error.message}`));
  }
}

/**
 * Detect project type (React, Node.js, etc.)
 */
async function detectProjectType() {
  try {
    const packageJson = await fs.readJson('package.json');
    
    if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['next']) {
      return 'react';
    }
    
    if (packageJson.dependencies?.['@solana/web3.js']) {
      return 'kit';
    }
    
    return 'node';
  } catch {
    return 'unknown';
  }
}

/**
 * Install wallet-related dependencies
 */
async function installWalletDependencies(projectType) {
  console.log(chalk.gray(' Installing wallet dependencies...'));

  const baseDependencies = [
    '@solana/wallet-standard',
    '@solana/wallet-standard-core'
  ];

  const reactDependencies = [
    '@solana/wallet-standard-react',
    '@solana/web3.js'
  ];

  let dependencies = baseDependencies;
  
  if (projectType === 'react') {
    dependencies = [...dependencies, ...reactDependencies];
  }

  // Note: In a real implementation, you'd run npm install
  console.log(chalk.gray(`Would install: ${dependencies.join(', ')}`));
  console.log(chalk.yellow(' Run manually: npm install ' + dependencies.join(' ')));
}

/**
 * Generate wallet infrastructure based on project type
 */
async function generateWalletInfrastructure(projectType) {
  console.log(chalk.gray('õ Generating wallet infrastructure...'));

  switch (projectType) {
    case 'react':
      await generateReactWalletInfrastructure();
      break;
    case 'kit':
    case 'node':
      await generateNodeWalletInfrastructure();
      break;
    default:
      await generateGenericWalletInfrastructure();
  }
}

/**
 * Generate React wallet infrastructure
 */
async function generateReactWalletInfrastructure() {
  // Wallet provider component
  const providerDir = 'components/wallet';
  await fs.ensureDir(providerDir);

  const walletProviderContent = generateWalletProviderComponent();
  await fs.writeFile(path.join(providerDir, 'wallet-provider.tsx'), walletProviderContent);

  // Wallet connection hook
  const hookContent = generateWalletHook();
  await fs.writeFile(path.join(providerDir, 'use-wallet.ts'), hookContent);

  // Wallet connection button component
  const buttonContent = generateWalletButtonComponent();
  await fs.writeFile(path.join(providerDir, 'wallet-button.tsx'), buttonContent);

  // Wallet list component
  const listContent = generateWalletListComponent();
  await fs.writeFile(path.join(providerDir, 'wallet-list.tsx'), listContent);

  console.log(chalk.green(` React wallet components generated in: ${providerDir}/`));
}

/**
 * Generate Node.js wallet infrastructure
 */
async function generateNodeWalletInfrastructure() {
  const walletDir = 'lib/wallet';
  await fs.ensureDir(walletDir);

  // Wallet manager
  const managerContent = generateWalletManager();
  await fs.writeFile(path.join(walletDir, 'wallet-manager.ts'), managerContent);

  // Wallet connection utilities
  const utilsContent = generateWalletConnectionUtils();
  await fs.writeFile(path.join(walletDir, 'connection-utils.ts'), utilsContent);

  console.log(chalk.green(` Node.js wallet utilities generated in: ${walletDir}/`));
}

/**
 * Generate React wallet component
 */
async function generateReactWalletComponent() {
  console.log(chalk.yellow('ê Generating React Wallet Component...'));

  const componentDir = 'components/wallet';
  await fs.ensureDir(componentDir);

  // Advanced wallet connection component
  const advancedComponentContent = generateAdvancedWalletComponent();
  await fs.writeFile(path.join(componentDir, 'advanced-wallet-connection.tsx'), advancedComponentContent);

  // Wallet balance display
  const balanceComponentContent = generateWalletBalanceComponent();
  await fs.writeFile(path.join(componentDir, 'wallet-balance.tsx'), balanceComponentContent);

  // Transaction signing component
  const signingComponentContent = generateTransactionSigningComponent();
  await fs.writeFile(path.join(componentDir, 'transaction-signer.tsx'), signingComponentContent);

  console.log(chalk.green(` Advanced React wallet components generated in: ${componentDir}/`));
}

/**
 * Component generators
 */
function generateWalletProviderComponent() {
  return `'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { WalletStandardProvider } from '@solana/wallet-standard-react'

/**
 * Wallet Context Provider using Wallet Standard
 * Follows official Solana wallet connection patterns
 */

interface WalletContextType {
  wallets: any
  selectedWallet: any | null
  connecting: boolean
  connected: boolean
  publicKey: string | null
  connect: (walletName?: string) => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (transaction: any) => Promise<any>
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
  autoConnect?: boolean
  localStorageKey?: string
}

export function WalletProvider({ 
  children, 
  autoConnect = true,
  localStorageKey = 'solana-wallet-preference' 
}: WalletProviderProps) {
  const [wallets, setWallets] = useState<any>([])
  const [selectedWallet, setSelectedWallet] = useState<any | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  // Discover wallets on mount
  useEffect(() => {
    discoverWallets()
  }, )

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && wallets.length > 0) {
      const savedWallet = localStorage.getItem(localStorageKey)
      if (savedWallet) {
        const wallet = wallets.find(w => w.name === savedWallet)
        if (wallet) {
          connect(wallet.name)
        }
      }
    }
  }, [wallets, autoConnect])

  const discoverWallets = async () => {
    try {
      // Wallet Standard discovery
      // Note: This is a simplified implementation
      // Real implementation would use @solana/wallet-standard
      console.log('ç Discovering wallets...')
      
      // Mock wallet discovery for demo
      const mockWallets = [
        { name: 'Phantom', icon: 'ëª', installed: true },
        { name: 'Solflare', icon: 'û', installed: true },
        { name: 'Backpack', icon: '', installed: false }
      ]
      
      setWallets(mockWallets)
    } catch (error) {
      console.error('Failed to discover wallets:', error)
    }
  }

  const connect = async (walletName?: string) => {
    setConnecting(true)
    try {
      let targetWallet = selectedWallet

      if (walletName) {
        targetWallet = wallets.find(wallet => wallet.name === walletName)
      } else if (!targetWallet && wallets.length > 0) {
        targetWallet = wallets[0] // Use first available
      }

      if (!targetWallet) {
        throw new Error('No wallet available')
      }

      console.log(\`Connecting to \${targetWallet.name}...\`)

      // Wallet Standard connection logic would go here
      // This is a simplified mock implementation
      
      // Mock connection success
      setSelectedWallet(targetWallet)
      setConnected(true)
      setPublicKey('11111111111111111111111111111111') // Mock public key
      
      // Save preference
      localStorage.setItem(localStorageKey, targetWallet.name)

      console.log(\` Connected to \${targetWallet.name}\`)

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      if (selectedWallet) {
        console.log(\`Disconnecting from \${selectedWallet.name}...\`)
        
        // Wallet Standard disconnection logic would go here
        
        setSelectedWallet(null)
        setConnected(false)
        setPublicKey(null)
        
        // Clear preference
        localStorage.removeItem(localStorageKey)
        
        console.log(' Wallet disconnected')
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  const signTransaction = async (transaction: any) => {
    if (!selectedWallet || !connected) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('ç Signing transaction...')
      
      // Wallet Standard transaction signing would go here
      // Return signed transaction
      
      return transaction // Mock return
    } catch (error) {
      console.error('Failed to sign transaction:', error)
      throw error
    }
  }

  const signMessage = async (message: Uint8Array) => {
    if (!selectedWallet || !connected) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('ç Signing message...')
      
      // Wallet Standard message signing would go here
      
      return message // Mock return
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw error
    }
  }

  const value: WalletContextType = {
    wallets,
    selectedWallet,
    connecting,
    connected,
    publicKey,
    connect,
    disconnect,
    signTransaction,
    signMessage
  }

  return (
    <WalletStandardProvider>
      <WalletContext.Provider value={value}>
        {children}
      </WalletContext.Provider>
    </WalletStandardProvider>
  )
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}`
}

function generateWalletHook() {
  return `import { useContext } from 'react'
import { WalletContext } from './wallet-provider'

/**
 * Custom hook for wallet operations
 * Provides convenient access to wallet functionality
 */

export interface WalletHookReturn {
  // Connection state
  wallets: any
  wallet: any | null
  publicKey: string | null
  connected: boolean
  connecting: boolean
  
  // Actions
  select: (walletName: string) => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Signing
  signTransaction: (transaction: any) => Promise<any>
  signAllTransactions: (transactions: any) => Promise<any[]>
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
  
  // Utilities
  requestAirdrop?: (amount?: number) => Promise<void>
  getBalance?: () => Promise<number>
}

export function useWallet(): WalletHookReturn {
  const context = useContext(WalletContext)
  
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }

  const {
    wallets,
    selectedWallet,
    publicKey,
    connected,
    connecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signTransaction,
    signMessage
  } = context

  const select = async (walletName: string) => {
    await connectWallet(walletName)
  }

  const connect = async () => {
    await connectWallet()
  }

  const disconnect = async () => {
    await disconnectWallet()
  }

  const signAllTransactions = async (transactions: any) => {
    const signedTransactions = 
    
    for (const transaction of transactions) {
      const signed = await signTransaction(transaction)
      signedTransactions.push(signed)
    }
    
    return signedTransactions
  }

  // Optional helper functions
  const requestAirdrop = async (amount: number = 1) => {
    if (!publicKey) {
      throw new Error('Wallet not connected')
    }

    console.log(\`Requesting \${amount} SOL airdrop...\`)
    // Implementation would depend on your RPC setup
  }

  const getBalance = async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected')
    }

    // Implementation would use your @solana/web3.js RPC client
    return 0 // Mock return
  }

  return {
    wallets,
    wallet: selectedWallet,
    publicKey,
    connected,
    connecting,
    select,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    requestAirdrop,
    getBalance
  }
}`
}

function generateWalletButtonComponent() {
  return `'use client'

import { useState } from 'react'
import { useWallet } from './use-wallet'

/**
 * Wallet Connection Button Component
 * Handles wallet connection/disconnection UI
 */

interface WalletButtonProps {
  className?: string
  children?: React.ReactNode
}

export function WalletButton({ className = '', children }: WalletButtonProps) {
  const { connected, connecting, publicKey, connect, disconnect } = useWallet()
  const [showDisconnect, setShowDisconnect] = useState(false)

  if (connecting) {
    return (
      <button 
        disabled 
        className={\`\${className} px-4 py-2 bg-gray-500 text-white rounded cursor-not-allowed\`}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connecting...
        </div>
      </button>
    )
  }

  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDisconnect(!showDisconnect)}
          className={\`\${className} px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors\`}
        >
          {children || (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
              {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
            </div>
          )}
        </button>
        
        {showDisconnect && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50">
            <button
              onClick={async () => {
                await disconnect()
                setShowDisconnect(false)
              }}
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      className={\`\${className} px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors\`}
    >
      {children || 'Connect Wallet'}
    </button>
  )
}`
}

function generateWalletListComponent() {
  return `'use client'

import { useWallet } from './use-wallet'

/**
 * Wallet List Component
 * Shows available wallets for connection
 */

interface WalletListProps {
  onClose?: () => void
  className?: string
}

export function WalletList({ onClose, className = '' }: WalletListProps) {
  const { wallets, select, connecting } = useWallet()

  const handleWalletSelect = async (walletName: string) => {
    try {
      await select(walletName)
      onClose?.()
    } catch (error) {
      console.error('Failed to select wallet:', error)
    }
  }

  return (
    <div className={\`\${className} bg-white rounded-lg shadow-xl border p-6 max-w-sm w-full\`}>
      <h2 className="text-xl font-semibold mb-4 text-center">Connect Wallet</h2>
      
      <div className="space-y-3">
        {wallets.map((wallet) => (
          <button
            key={wallet.name}
            onClick={() => handleWalletSelect(wallet.name)}
            disabled={connecting || !wallet.installed}
            className={\`w-full p-3 rounded-lg border-2 transition-all duration-200
              \${wallet.installed 
                ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50' 
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }
              \${connecting ? 'cursor-not-allowed opacity-60' : ''}
            \`}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900">{wallet.name}</div>
                <div className="text-sm text-gray-500">
                  {wallet.installed ? 'Detected' : 'Not Installed'}
                </div>
              </div>
              {connecting && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {wallets.filter(w => !w.installed).length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
             Install missing wallets to connect
          </p>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}`
}

function generateAdvancedWalletComponent() {
  return `'use client'

import { useState, useEffect } from 'react'
import { useWallet } from './use-wallet'
import { WalletList } from './wallet-list'

/**
 * Advanced Wallet Connection Component
 * Full-featured wallet interface with balance, transactions, etc.
 */

export function AdvancedWalletConnection() {
  const { connected, connecting, publicKey, wallet, disconnect, getBalance } = useWallet()
  const [showWalletList, setShowWalletList] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)

  // Load balance when connected
  useEffect(() => {
    if (connected && getBalance) {
      loadBalance()
    }
  }, [connected])

  const loadBalance = async () => {
    if (!getBalance) return
    
    setLoadingBalance(true)
    try {
      const bal = await getBalance()
      setBalance(bal)
    } catch (error) {
      console.error('Failed to load balance:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setBalance(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  if (connecting) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Connecting to Wallet
          </h2>
          <p className="text-gray-600">
            Please approve the connection in your wallet
          </p>
        </div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2h2m7-4a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your Solana wallet to interact with the application
          </p>
        </div>

        {showWalletList ? (
          <WalletList onClose={() => setShowWalletList(false)} />
        ) : (
          <button
            onClick={() => setShowWalletList(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            Select Wallet
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Connected State */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Wallet Connected
        </h2>
        <p className="text-sm text-gray-600">
          {wallet?.name}
        </p>
      </div>

      {/* Wallet Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Public Key
          </label>
          <div className="bg-gray-50 rounded-lg p-3">
            <code className="text-sm text-gray-800 break-all">
              {publicKey}
            </code>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Balance
            </label>
            <button
              onClick={loadBalance}
              disabled={loadingBalance}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {loadingBalance ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-semibold text-gray-900">
              {balance !== null ? \`\${balance.toFixed(4)} SOL\` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={loadBalance}
          disabled={loadingBalance || !getBalance}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          {loadingBalance ? 'Loading...' : 'Refresh Balance'}
        </button>
        
        <button
          onClick={handleDisconnect}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}`
}

async function generateWalletUtilities() {
  console.log(chalk.yellow('± Generating Wallet Adapter Utilities...'));
  
  const utilsDir = 'lib/wallet';
  await fs.ensureDir(utilsDir);

  // Wallet detection utilities
  const detectionUtils = generateWalletDetectionUtils();
  await fs.writeFile(path.join(utilsDir, 'detection-utils.ts'), detectionUtils);

  // Connection state management
  const stateUtils = generateWalletStateUtils();
  await fs.writeFile(path.join(utilsDir, 'state-utils.ts'), stateUtils);

  console.log(chalk.green(` Wallet utilities generated in: ${utilsDir}/`));
}

function generateWalletDetectionUtils() {
  return `/**
 * Wallet Detection Utilities
 * Helper functions for discovering and validating wallets
 */

export interface DetectedWallet {
  name: string
  icon: string
  url: string
  installed: boolean
  mobile: boolean
  desktop: boolean
  adapter?: any
}

/**
 * Detect all available Solana wallets
 */
export async function detectWallets(): Promise<DetectedWallet> {
  const wallets: DetectedWallet = []

  // Check for Phantom
  if (typeof window !== 'undefined' && window.phantom?.solana) {
    wallets.push({
      name: 'Phantom',
      icon: 'ëª',
      url: 'https://phantom.app',
      installed: true,
      mobile: true,
      desktop: true,
      adapter: window.phantom.solana
    })
  }

  // Check for Solflare
  if (typeof window !== 'undefined' && window.solflare) {
    wallets.push({
      name: 'Solflare',
      icon: 'û',
      url: 'https://solflare.com',
      installed: true,
      mobile: true,
      desktop: true,
      adapter: window.solflare
    })
  }

  // Check for Backpack
  if (typeof window !== 'undefined' && window.backpack) {
    wallets.push({
      name: 'Backpack',
      icon: '',
      url: 'https://backpack.app',
      installed: true,
      mobile: false,
      desktop: true,
      adapter: window.backpack
    })
  }

  // Add known wallets that aren't installed
  const knownWallets = [
    { name: 'Phantom', icon: 'ëª', url: 'https://phantom.app', mobile: true, desktop: true },
    { name: 'Solflare', icon: 'û', url: 'https://solflare.com', mobile: true, desktop: true },
    { name: 'Backpack', icon: '', url: 'https://backpack.app', mobile: false, desktop: true },
    { name: 'Glow', icon: '', url: 'https://glow.app', mobile: true, desktop: false },
    { name: 'Slope', icon: 'ê', url: 'https://slope.finance', mobile: true, desktop: false }
  ]

  knownWallets.forEach(known => {
    if (!wallets.find(w => w.name === known.name)) {
      wallets.push({
        ...known,
        installed: false,
        adapter: null
      })
    }
  })

  return wallets
}

/**
 * Check if a specific wallet is installed
 */
export function isWalletInstalled(walletName: string): boolean {
  if (typeof window === 'undefined') return false

  switch (walletName.toLowerCase()) {
    case 'phantom':
      return !!window.phantom?.solana
    case 'solflare':
      return !!window.solflare
    case 'backpack':
      return !!window.backpack
    default:
      return false
  }
}

/**
 * Get wallet adapter for a specific wallet
 */
export function getWalletAdapter(walletName: string): any | null {
  if (typeof window === 'undefined') return null

  switch (walletName.toLowerCase()) {
    case 'phantom':
      return window.phantom?.solana || null
    case 'solflare':
      return window.solflare || null
    case 'backpack':
      return window.backpack || null
    default:
      return null
  }
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}

/**
 * Get installation URL for a wallet
 */
export function getWalletInstallUrl(walletName: string): string {
  const urls: Record<string, string> = {
    phantom: 'https://phantom.app/download',
    solflare: 'https://solflare.com/download',
    backpack: 'https://backpack.app/download',
    glow: 'https://glow.app',
    slope: 'https://slope.finance'
  }

  return urls[walletName.toLowerCase()] || '#'
}`
}

function generateWalletStateUtils() {
  return `/**
 * Wallet State Management Utilities
 * Helper functions for managing wallet connection state
 */

export interface WalletState {
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  publicKey: string | null
  walletName: string | null
  error: string | null
  lastConnected?: number
}

export class WalletStateManager {
  private state: WalletState = {
    connected: false,
    connecting: false,
    disconnecting: false,
    publicKey: null,
    walletName: null,
    error: null
  }

  private listeners: Array<(state: WalletState) => void> = 
  private storageKey = 'solana-wallet-state'

  constructor() {
    this.loadFromStorage()
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Update wallet state
   */
  setState(updates: Partial<WalletState>): void {
    this.state = { ...this.state, ...updates }
    this.notifyListeners()
    this.saveToStorage()
  }

  /**
   * Set connecting state
   */
  setConnecting(walletName: string): void {
    this.setState({
      connecting: true,
      disconnecting: false,
      walletName,
      error: null
    })
  }

  /**
   * Set connected state
   */
  setConnected(publicKey: string, walletName: string): void {
    this.setState({
      connected: true,
      connecting: false,
      publicKey,
      walletName,
      error: null,
      lastConnected: Date.now()
    })
  }

  /**
   * Set disconnecting state
   */
  setDisconnecting(): void {
    this.setState({
      disconnecting: true,
      error: null
    })
  }

  /**
   * Set disconnected state
   */
  setDisconnected(): void {
    this.setState({
      connected: false,
      connecting: false,
      disconnecting: false,
      publicKey: null,
      walletName: null,
      error: null
    })
  }

  /**
   * Set error state
   */
  setError(error: string): void {
    this.setState({
      connecting: false,
      disconnecting: false,
      error
    })
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.setState({ error: null })
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        console.error('Error in wallet state listener:', error)
      }
    })
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const persistentState = {
        walletName: this.state.walletName,
        lastConnected: this.state.lastConnected
      }
      localStorage.setItem(this.storageKey, JSON.stringify(persistentState))
    } catch (error) {
      console.warn('Failed to save wallet state to storage:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const persistentState = JSON.parse(stored)
        this.state = { ...this.state, ...persistentState }
      }
    } catch (error) {
      console.warn('Failed to load wallet state from storage:', error)
    }
  }
}`
}

// Additional generator functions would go here...
function generateWalletManager() {
  return `// Node.js Wallet Manager implementation...`
}

function generateWalletConnectionUtils() {
  return `// Node.js Wallet Connection utilities...`
}

function generateGenericWalletInfrastructure() {
  return `// Generic wallet infrastructure...`
}

async function generateWalletTestingHelpers() {
  console.log(chalk.yellow(' Generating Wallet Testing Helpers...'));
  // Implementation for wallet testing helpers...
}

function generateWalletBalanceComponent() {
  return `// Wallet balance component...`
}

function generateTransactionSigningComponent() {
  return `// Transaction signing component...`
}

async function showWalletExamples() {
  console.log(chalk.cyan(' Wallet-Standard Examples'));
  // Show examples of wallet usage patterns...
}

module.exports = {
  main
};