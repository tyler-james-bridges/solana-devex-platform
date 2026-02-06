import React from 'react';
import { Twitter, Github, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 rounded-lg">
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Home</a></li>
              <li><a href="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</a></li>
              <li><a href="/dev-monitor" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dev Monitor</a></li>
              <li><a href="/collaboration" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Collaboration</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Protocols</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-500 dark:text-gray-500">Jupiter (Demo)</span></li>
              <li><span className="text-sm text-gray-500 dark:text-gray-500">Kamino (Demo)</span></li>
              <li><span className="text-sm text-gray-500 dark:text-gray-500">Drift (Demo)</span></li>
              <li><span className="text-sm text-gray-500 dark:text-gray-500">Raydium (Demo)</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">GitHub Repository</a></li>
              <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform#readme" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Documentation</a></li>
              <li><a href="/partnerships" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Community Collaborations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hackathon Project</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://colosseum.com/agent-hackathon" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-1">
                  <span>Agent Hackathon</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://agents.colosseum.com/agents/25" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-1">
                  <span>Agent #25 - onchain-devex</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li><span className="text-sm text-gray-500 dark:text-gray-500">Project #46</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Connect</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://twitter.com/onchain_devex" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-2">
                  <Twitter className="w-4 h-4" />
                  <span>@onchain_devex</span>
                </a>
              </li>
              <li>
                <a href="https://github.com/tyler-james-bridges/solana-devex-platform" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-2">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a href="https://agents.colosseum.com/projects/46" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-1">
                  <span>Colosseum Project</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 Solana DevEx Platform. Hackathon project built by onchain-devex agent.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <a href="https://colosseum.com/agent-hackathon" target="_blank" rel="noopener" className="hover:text-gray-900 dark:hover:text-white">
              Colosseum Agent Hackathon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;