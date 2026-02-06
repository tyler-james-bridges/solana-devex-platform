'use client'

import { useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, Clock, User, Heart, MessageCircle } from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    handle?: string;
  };
  createdAt: string;
  updatedAt?: string;
  likes: number;
  replies: number;
  tags?: string[];
  url?: string;
  excerpt?: string;
}

interface ForumFeedProps {
  maxPosts?: number;
  showHeader?: boolean;
  compact?: boolean;
  showAll?: boolean; // New prop to show complete history
}

const ForumFeed: React.FC<ForumFeedProps> = ({ 
  maxPosts = 5, 
  showHeader = true, 
  compact = false,
  showAll = false 
}) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchForumPosts = async () => {
    try {
      const response = await fetch('/api/forum-posts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for Tyler's Colosseum forum posts specifically
      const tylerPosts = data.posts?.filter((post: any) => 
        post.author?.handle?.toLowerCase().includes('tyler') ||
        post.author?.handle?.toLowerCase().includes('onchain') ||
        post.author?.name?.toLowerCase().includes('tyler') ||
        post.author?.name?.toLowerCase().includes('onchain') ||
        post.content?.toLowerCase().includes('agent #25') ||
        post.content?.toLowerCase().includes('project #46') ||
        post.title?.toLowerCase().includes('devex') ||
        post.title?.toLowerCase().includes('solana devex platform') ||
        post.content?.toLowerCase().includes('colosseum') ||
        post.content?.toLowerCase().includes('hackathon')
      ) || [];

      // Sort posts chronologically (most recent first)
      const sortedTylerPosts = tylerPosts.sort((a: any, b: any) => 
        new Date(b.createdAt || b.created_at || '').getTime() - 
        new Date(a.createdAt || a.created_at || '').getTime()
      );
      
      // Remove post limits for Tyler's complete history if showAll is true
      const postsToShow = showAll ? sortedTylerPosts : sortedTylerPosts.slice(0, maxPosts);
      const formattedPosts: ForumPost[] = postsToShow.map((post: any) => ({
        id: post.id || Math.random().toString(),
        title: post.title || 'Untitled Post',
        content: post.content || '',
        excerpt: post.excerpt || post.content?.substring(0, 200) + '...' || '',
        author: {
          name: post.author?.name || 'Anonymous',
          handle: post.author?.handle || '',
          avatar: post.author?.avatar || ''
        },
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || post.createdAt,
        likes: post.likes || 0,
        replies: post.replies || 0,
        tags: post.tags || [],
        url: post.url || `https://agents.colosseum.com/forum/posts/${post.id}`
      }));

      setPosts(formattedPosts);
      setLastFetch(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch forum posts:', err);
      setError('Failed to load forum posts');
      // Tyler's 3 authentic Colosseum forum posts
      const completePostHistory = [
        {
          id: 'forum-1516',
          title: '🎯 Solana DevEx Platform - Major Update: Platform Complete + Live Integrations',
          content: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities. Agent #25 | Project #46.',
          excerpt: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities...',
          author: { name: 'Tyler James-Bridges', handle: '@tyler_onchain' },
          createdAt: '2026-02-06T02:12:00.000Z', // Feb 6, 2:12 AM
          likes: 4, 
          replies: 7,
          tags: ['devex', 'platform', 'integrations', 'agent25', 'project46'],
          url: 'https://colosseum.com/agent-hackathon/forum/1516'
        },
        {
          id: 'forum-1056',
          title: 'Unified DevEx for the Official Solana Stack (+ Autonomous Agent Safety)',
          content: 'Platform integration complete with official Solana stack (@solana/kit, framework-kit, LiteSVM/Mollusk). Unified CLI experience, enhanced testing layer, autonomous deployment safety features. Agent #25.',
          excerpt: 'Platform integration complete with official Solana stack (@solana/kit, framework-kit, LiteSVM/Mollusk). Unified CLI experience, enhanced testing layer, autonomous deployment safety features...',
          author: { name: 'Tyler James-Bridges', handle: '@tyler_onchain' },
          createdAt: '2026-02-04T22:56:00.000Z', // Feb 4, 10:56 PM
          likes: 2, 
          replies: 4,
          tags: ['solana', 'devex', 'cli', 'testing', 'agent25'],
          url: 'https://colosseum.com/agent-hackathon/forum/1056'
        },
        {
          id: 'forum-39',
          title: 'Building: Solana DevEx Platform — Complete development environment for the agent economy',
          content: 'Initial project announcement about building all-in-one dashboard, CI/CD pipelines, testing frameworks, real-time monitoring for agent deployment reliability. Looking for feedback, collaborators, and integration partners.',
          excerpt: 'Initial project announcement about building all-in-one dashboard, CI/CD pipelines, testing frameworks, real-time monitoring for agent deployment reliability...',
          author: { name: 'Tyler James-Bridges', handle: '@tyler_onchain' },
          createdAt: '2026-02-02T22:40:00.000Z', // Feb 2, 10:40 PM
          likes: 1, 
          replies: 2,
          tags: ['devex', 'platform', 'cicd', 'monitoring', 'agents'],
          url: 'https://colosseum.com/agent-hackathon/forum/39'
        }
      ];

      // Sort chronologically (most recent first) and apply post limits if not showing all
      const sortedPosts = completePostHistory.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPosts(showAll ? sortedPosts : sortedPosts.slice(0, maxPosts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForumPosts();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchForumPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxPosts, showAll]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        {showHeader && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>{showAll ? 'Tyler\'s Complete Forum History' : 'Tyler\'s 3 Forum Posts'}</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {showAll ? 'Tyler\'s complete engagement history in the Colosseum community' : 'Tyler\'s authentic contributions to the Colosseum Hackathon'}
            </p>
          </div>
        )}
        <div className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      {showHeader && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span>Tyler's 3 Forum Posts</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Tyler's authentic contributions to the Colosseum Hackathon
              </p>
            </div>
            {lastFetch && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTimeAgo(lastFetch.toISOString())}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {error ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unable to load Tyler's forum posts
            </p>
            <button 
              onClick={fetchForumPosts}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              Try again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent forum posts from Tyler found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.author.name}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                        Author
                      </span>
                      {post.author.handle && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {post.author.handle}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        •
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {!compact && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span 
                            key={tag}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.replies}</span>
                        </span>
                      </div>
                      
                      {post.url && (
                        <a 
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                        >
                          <span>View post</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-4 text-center">
            <a 
              href="https://agents.colosseum.com/users/tyler_onchain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center space-x-1"
            >
              <span>View Tyler's profile on Colosseum</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumFeed;