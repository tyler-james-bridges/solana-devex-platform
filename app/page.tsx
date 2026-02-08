'use client'

import Link from 'next/link'
import { Code, Shield, Zap, Search, Lock, Activity, ArrowRight, ExternalLink, Github } from 'lucide-react'
import ForumFeed from '../components/ForumFeed'

const tools = [
  {
    name: 'CPI Debugger',
    description: 'Paste any Solana mainnet transaction signature. Get real CPI call flows, compute metrics, and account state changes. Live RPC, not mock data.',
    icon: Search,
    href: '/cpi-debugger',
    badge: 'Live RPC'
  },
  {
    name: 'Transaction Safety Simulator',
    description: 'Pre-execution risk analysis. Evaluate transactions before signing with safety checks, gas optimization, and vulnerability detection.',
    icon: Shield,
    href: '/devex-suite',
    badge: null
  },
  {
    name: 'Verifiable Debugging Attestations',
    description: 'Cryptographically signed, on-chain proof of debugging sessions. Tamper-proof audit trails with Ed25519 signatures.',
    icon: Lock,
    href: '/devex-suite',
    badge: null
  },
  {
    name: 'Agent Wallet Infrastructure',
    description: 'Secure key management for AI agents. Granular permission controls, encrypted storage, multi-signature support.',
    icon: Zap,
    href: '/devex-suite',
    badge: null
  },
  {
    name: 'Guardian Security Scanner',
    description: 'Token risk scoring (0-100), honeypot detection, whale tracking, and real-time threat intelligence. Powered by a 17-agent swarm.',
    icon: Activity,
    href: '/devex-suite',
    badge: 'Guardian Integration'
  },
  {
    name: 'TypeScript SDK',
    description: 'Published @solana-devex/sdk package with full API client. Import and use programmatically from any TypeScript project.',
    icon: Code,
    href: 'https://github.com/tyler-james-bridges/solana-devex-platform/tree/master/packages/sdk',
    badge: 'npm Package',
    external: true
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Solana DevEx Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            From debugging to deployment -- everything developers need to build on Solana. 
            Seven integrated tools, live mainnet data, built by an AI agent in 7 days.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/cpi-debugger"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try CPI Debugger
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/devex-suite"
              className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Explore DevEx Suite
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Integrated Tools</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">API Endpoints</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">Live</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mainnet RPC</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">7 Days</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Built by Agent #25</div>
          </div>
        </div>

        {/* Tools grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Platform Tools</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon
              const isExternal = 'external' in tool && tool.external
              const Tag = isExternal ? 'a' : Link
              const linkProps = isExternal 
                ? { href: tool.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: tool.href }
              
              return (
                <Tag
                  key={tool.name}
                  {...linkProps}
                  className="group bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                    <div className="flex items-center gap-2">
                      {tool.badge && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                          {tool.badge}
                        </span>
                      )}
                      {isExternal ? (
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tool.description}
                  </p>
                </Tag>
              )
            })}
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          <a
            href="https://github.com/tyler-james-bridges/solana-devex-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Source Code</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">MIT Licensed, open source</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
          <a
            href="https://colosseum.com/agent-hackathon/projects/solana-devex-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Colosseum Project</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Agent #25, Project #46</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
          <Link
            href="/provenance"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Built by an Agent</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Full development provenance</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>

        {/* Forum Posts */}
        <div className="mb-12">
          <ForumFeed showHeader={false} showAll={false} compact={true} />
        </div>
      </div>
    </div>
  )
}
