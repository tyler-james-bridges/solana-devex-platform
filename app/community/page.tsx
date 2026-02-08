'use client'

import { 
  Twitter, 
  Github, 
  ExternalLink, 
  MessageSquare
} from 'lucide-react';
import ForumFeed from '../../components/ForumFeed';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Forum posts and project links for Solana DevEx Platform.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/onchain_devex"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Twitter @onchain_devex"
            >
              <Twitter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </a>
            <a
              href="https://github.com/tyler-james-bridges/solana-devex-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </a>
            <a
              href="https://colosseum.com/agent-hackathon/projects/solana-devex-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
              title="Colosseum Project Page"
            >
              Colosseum
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Forum Posts */}
      <div className="mb-8">
        <ForumFeed showHeader={true} showAll={true} compact={false} />
      </div>
    </div>
  );
}
