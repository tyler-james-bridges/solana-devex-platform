'use client'

import { Twitter, Github, ExternalLink, Users, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import ForumFeed from '../../components/ForumFeed';

export default function CommunityPage() {
  const socialStats = {
    twitter: {
      followers: 128,
      engagement: '15.2%',
      recentTweets: 12
    },
    github: {
      stars: 45,
      forks: 12,
      contributors: 3
    },
    forum: {
      posts: 15,
      replies: 42,
      likes: 186
    }
  };

  const highlights = [
    {
      title: 'Agent #25 - Hackathon Success',
      description: 'Our autonomous agent ranked in the top tier of the Colosseum Agent Hackathon',
      link: 'https://agents.colosseum.com/agents/25',
      badge: 'Featured'
    },
    {
      title: 'Open Source Initiative',
      description: 'Full platform source code available on GitHub with comprehensive documentation',
      link: 'https://github.com/tyler-james-bridges/solana-devex-platform',
      badge: 'Active'
    },
    {
      title: 'Community Integrations',
      description: 'Building partnerships with major Solana protocols and development teams',
      link: '/partnerships',
      badge: 'Growing'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              Connect with our team, follow our progress, and join the conversation. 
              We're building the future of Solana development experience together.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active Community
            </span>
          </div>
        </div>

        {/* Social Media Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connect With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="https://twitter.com/onchain_devex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Twitter</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">@onchain_devex</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{socialStats.twitter.followers} followers</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">{socialStats.twitter.engagement} engagement</span>
                </div>
              </div>
            </a>

            <a 
              href="https://github.com/tyler-james-bridges/solana-devex-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">GitHub</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Open Source Platform</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{socialStats.github.stars} stars</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{socialStats.github.forks} forks</span>
                </div>
              </div>
            </a>

            <a 
              href="https://agents.colosseum.com/agents/25"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Colosseum</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agent #25 Profile</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-300">{socialStats.forum.posts} posts</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">{socialStats.forum.likes} likes</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Community Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {highlights.map((highlight, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {highlight.title}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                highlight.badge === 'Featured' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                highlight.badge === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              }`}>
                {highlight.badge}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {highlight.description}
            </p>
            <a
              href={highlight.link}
              target={highlight.link.startsWith('http') ? '_blank' : undefined}
              rel={highlight.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Learn more
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        ))}
      </div>

      {/* Live Forum Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <ForumFeed showHeader={true} maxPosts={8} compact={false} />
        </div>
      </div>

      {/* Community Stats */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Community Growth</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{socialStats.twitter.followers}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Twitter Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{socialStats.github.stars}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">GitHub Stars</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{socialStats.forum.posts}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Forum Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{socialStats.forum.likes}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Community Likes</div>
          </div>
        </div>
      </div>
    </div>
  );
}