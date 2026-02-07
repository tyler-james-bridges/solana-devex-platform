'use client'

import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Wallet,
  Target,
  Code,
  Search,
  Play,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import TransactionSimulator from '../../components/TransactionSimulator';
import VerifiableDebugger from '../../components/VerifiableDebugger';
import AgentWalletManager from '../../components/AgentWalletManager';
import SecurityScanner from '../../components/SecurityScanner';

const DevExSuitePage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'simulator' | 'verifiable' | 'wallets' | 'security' | null>(null);

  const features = [
    {
      id: 'simulator' as const,
      icon: Play,
      title: 'Transaction Safety Simulator',
      description: 'Pre-execution transaction analysis with safety checks, risk detection, and gas optimization recommendations.',
      status: 'New',
      benefits: [
        'Prevent failed transactions before execution',
        'Optimize gas usage and fees',
        'Detect security risks and vulnerabilities',
        'Smart contract safety guardrails'
      ]
    },
    {
      id: 'verifiable' as const,
      icon: Shield,
      title: 'Verifiable Debugging Attestations',
      description: 'Create cryptographically signed, on-chain proof of your debugging findings. Tamper-proof accountability for debugging work.',
      status: 'Unique',
      benefits: [
        'Tamper-proof debugging audit trail',
        'On-chain attestation via Solana',
        'Cryptographic proof with Ed25519',
        'IPFS storage for complete findings'
      ]
    },
    {
      id: 'wallets' as const,
      icon: Wallet,
      title: 'Agent Wallet Infrastructure',
      description: 'Secure, self-custodial wallet management for AI agents with granular permission controls and encrypted storage.',
      status: 'Enterprise',
      benefits: [
        'Enterprise-grade encrypted storage',
        'Multi-signature support',
        'Granular permission controls',
        'Hardware security module ready'
      ]
    },
    {
      id: 'security' as const,
      icon: Shield,
      title: 'Guardian Security Scanner',
      description: 'Advanced security analysis powered by Guardian\'s 17-agent swarm. Token scanning, honeypot detection, whale tracking, and threat intelligence.',
      status: 'Guardian',
      benefits: [
        'Real-time threat detection and alerts',
        'Comprehensive token risk analysis',
        'Whale activity monitoring and alerts',
        'Program vulnerability scanning'
      ]
    }
  ];

  const platformStats = [
    { label: 'Transactions Analyzed', value: '50K+', icon: Activity },
    { label: 'Safety Checks Passed', value: '95%', icon: CheckCircle2 },
    { label: 'Wallets Created', value: '2.5K+', icon: Wallet },
    { label: 'Attestations Verified', value: '100%', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                DevEx Suite
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                Flagship
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              The complete developer experience platform for Solana. From debugging to deployment, 
              everything you need to build with confidence.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {platformStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <IconComponent className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            const isActive = activeFeature === feature.id;
            return (
              <div
                key={feature.id}
                onClick={() => setActiveFeature(isActive ? null : feature.id)}
                className={`cursor-pointer bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:shadow-sm transition-all duration-200 overflow-hidden ${
                  isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {feature.status}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className={`font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isActive ? 'Currently viewing' : 'Click to explore'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Content */}
      {activeFeature === 'simulator' && (
        <TransactionSimulator 
          onSimulationComplete={(result) => {
            console.log('Simulation completed:', result);
          }}
        />
      )}

      {activeFeature === 'verifiable' && (
        <VerifiableDebugger 
          transactionSignature="ExampleTransactionSignature123456789abcdef"
          onAttestationCreated={(attestation) => {
            console.log('Attestation created:', attestation);
          }}
        />
      )}

      {activeFeature === 'wallets' && (
        <AgentWalletManager
          agentId="example-agent-123"
          onWalletCreated={(wallet) => {
            console.log('Wallet created:', wallet);
          }}
          onWalletUpdated={(wallet) => {
            console.log('Wallet updated:', wallet);
          }}
        />
      )}

      {activeFeature === 'security' && (
        <SecurityScanner 
          onScanComplete={(result) => {
            console.log('Security scan completed:', result);
          }}
        />
      )}

      {/* No feature selected - show overview */}
      {!activeFeature && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
            Platform Overview
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select a tool above to get started. Each tool is designed to work independently 
            or as part of a comprehensive development workflow.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Complete DevEx Platform</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full development lifecycle coverage from debugging to deployment, 
                unlike single-purpose tools that only solve one problem.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">CPI Debugging</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced cross-program call analysis with error detection, 
                optimization suggestions, and code examples.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Transaction Simulation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pre-execution safety checks prevent failed transactions 
                before they happen, saving gas and reducing errors.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Verifiable Attestations</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                On-chain proof of debugging findings creates tamper-proof 
                accountability and trust in development work.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Guardian Security</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced security layer powered by Guardian's 17-agent swarm 
                with real-time threat detection and comprehensive analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevExSuitePage;