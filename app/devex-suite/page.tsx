'use client'

import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Wallet,
  Target,
  Code,
  Cpu,
  Search,
  Play,
  Lock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Star,
  Activity,
  Globe,
  Database,
  Key,
  ArrowRight
} from 'lucide-react';
import TransactionSimulator from '../../components/TransactionSimulator';
import VerifiableDebugger from '../../components/VerifiableDebugger';
import AgentWalletManager from '../../components/AgentWalletManager';

const DevExSuitePage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'simulator' | 'verifiable' | 'wallets' | 'overview'>('overview');

  const features = [
    {
      id: 'simulator' as const,
      icon: Play,
      title: 'Transaction Safety Simulator',
      description: 'Pre-execution transaction analysis with safety checks and gas optimization',
      status: 'NEW',
      statusColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      gradient: 'from-green-500 to-emerald-600',
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
      description: 'Cryptographically signed, on-chain proof of debugging findings',
      status: 'UNIQUE',
      statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
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
      description: 'Secure, self-custodial wallet management for AI agents',
      status: 'ENTERPRISE',
      statusColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      gradient: 'from-purple-500 to-violet-600',
      benefits: [
        'Enterprise-grade encrypted storage',
        'Multi-signature support',
        'Granular permission controls',
        'Hardware security module ready'
      ]
    }
  ];

  const platformStats = [
    { label: 'Transactions Analyzed', value: '50K+', icon: Activity, color: 'text-blue-600' },
    { label: 'Safety Checks Passed', value: '95%', icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Wallets Created', value: '2.5K+', icon: Wallet, color: 'text-purple-600' },
    { label: 'Attestations Verified', value: '100%', icon: Shield, color: 'text-indigo-600' }
  ];

  const competitiveAdvantages = [
    {
      feature: 'Complete DevEx Platform',
      us: 'Full development lifecycle coverage',
      others: 'Single-purpose tools',
      advantage: true
    },
    {
      feature: 'CPI Debugging',
      us: 'Advanced cross-program call analysis',
      others: 'Basic transaction viewing',
      advantage: true
    },
    {
      feature: 'Transaction Simulation',
      us: 'Pre-execution safety checks',
      others: 'Post-failure debugging only',
      advantage: true
    },
    {
      feature: 'Verifiable Attestations',
      us: 'On-chain proof of findings',
      others: 'No verification system',
      advantage: true
    },
    {
      feature: 'Agent Wallets',
      us: 'Enterprise-grade security',
      others: 'Basic wallet generation',
      advantage: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="bg-white/20 p-3 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold">
                Solana DevEx Suite
              </h1>
              <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                FLAGSHIP
              </div>
            </div>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              The most comprehensive developer experience platform for Solana. 
              From debugging to deployment - everything you need to build with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Transaction Safety Simulation</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Verifiable Debugging</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Agent Wallet Infrastructure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {platformStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Navigation */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Choose Your Developer Tool
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`group relative cursor-pointer bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                    activeFeature === feature.id 
                      ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md' 
                      : 'hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {/* Gradient Header */}
                  <div className={`h-2 bg-gradient-to-r ${feature.gradient}`} />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${feature.statusColor}`}>
                        {feature.status}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {feature.description}
                    </p>
                    
                    <div className="space-y-2">
                      {feature.benefits.slice(0, 2).map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        +{feature.benefits.length - 2} more benefits
                      </div>
                    </div>

                    <div className={`mt-4 flex items-center justify-between text-sm ${
                      activeFeature === feature.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="font-medium">
                        {activeFeature === feature.id ? 'Currently viewing' : 'Click to explore'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeFeature === 'overview' && (
          <div className="space-y-8">
            {/* Competitive Advantage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-green-600" />
                Our Competitive Advantage
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-900 dark:text-white">Solana DevEx Suite</th>
                      <th className="text-left py-3 text-sm font-semibold text-gray-900 dark:text-white">Other Platforms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitiveAdvantages.map((item, index) => (
                      <tr key={index} className="border-b dark:border-gray-700 last:border-b-0">
                        <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {item.feature}
                        </td>
                        <td className="py-4">
                          <div className={`flex items-center space-x-2 text-sm ${
                            item.advantage ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {item.advantage ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Star className="w-4 h-4" />
                            )}
                            <span>{item.us}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {item.others}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Getting Started */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Code className="w-6 h-6 mr-3 text-blue-600" />
                Ready to Get Started?
              </h3>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Choose a tool above to begin building with the most advanced Solana developer experience platform.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => setActiveFeature(feature.id)}
                      className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <IconComponent className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {feature.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Feature-Specific Content */}
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
      </div>
    </div>
  );
};

export default DevExSuitePage;