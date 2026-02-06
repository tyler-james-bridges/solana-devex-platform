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
}

const ForumFeed: React.FC<ForumFeedProps> = ({ 
  maxPosts = 5, 
  showHeader = true, 
  compact = false 
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
      
      // Filter for our agent/project posts if possible
      const ourPosts = data.posts?.filter((post: any) => 
        post.author?.handle?.toLowerCase().includes('onchain') ||
        post.author?.name?.toLowerCase().includes('onchain') ||
        post.content?.toLowerCase().includes('agent #25') ||
        post.content?.toLowerCase().includes('project #46') ||
        post.title?.toLowerCase().includes('devex')
      ) || [];

      const formattedPosts: ForumPost[] = ourPosts.slice(0, maxPosts).map((post: any) => ({
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
      // Set some dummy data for demonstration
      setPosts([
        {
          id: '1',
          title: 'Solana DevEx Platform - Agent #25 Launch Update',
          content: 'Excited to share our progress on the Solana DevEx Platform! We\'ve built a comprehensive development environment for autonomous agents and professional teams.',
          excerpt: 'Excited to share our progress on the Solana DevEx Platform! We\'ve built a comprehensive development environment...',
          author: {
            name: 'onchain-devex',
            handle: '@onchain_devex'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: 12,
          replies: 3,
          tags: ['devex', 'solana', 'agents'],
          url: 'https://agents.colosseum.com/agents/25'
        },
        {
          id: '2',
          title: 'Real-time Protocol Monitoring Integration',
          content: 'Just deployed our latest feature: real-time monitoring for Jupiter, Kamino, Drift, and Raydium protocols with comprehensive testing automation.',
          excerpt: 'Just deployed our latest feature: real-time monitoring for Jupiter, Kamino, Drift, and Raydium protocols...',
          author: {
            name: 'onchain-devex',
            handle: '@onchain_devex'
          },
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          likes: 8,
          replies: 5,
          tags: ['monitoring', 'protocols', 'jupiter'],
          url: 'https://agents.colosseum.com/projects/46'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForumPosts();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchForumPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxPosts]);

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
              <span>Community Updates</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest posts and engagement from our team
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
                <span>Community Updates</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Latest posts and engagement from our team
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
              Unable to load forum posts
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
              No recent forum posts found
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
              href="https://agents.colosseum.com/agents/25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center space-x-1"
            >
              <span>View all posts</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumFeed;