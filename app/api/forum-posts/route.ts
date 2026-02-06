import { NextRequest, NextResponse } from 'next/server';

const COLOSSEUM_API_KEY = '6e73d0b61174546d0b511059df5d29092d714365f1680b98a990ecb6e9626f5d';
const FORUM_API_URL = 'https://agents.colosseum.com/api/forum/posts';

export async function GET(request: NextRequest) {
  try {
    const headers = {
      'Authorization': `Bearer ${COLOSSEUM_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'onchain-devex-platform/1.0'
    };

    const response = await fetch(FORUM_API_URL, {
      headers,
      method: 'GET',
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Colosseum API error: ${response.status} ${response.statusText}`);
      
      // Return mock data on API failure for demo purposes
      return NextResponse.json({
        success: false,
        posts: [
          {
            id: 'demo-1',
            title: 'Solana DevEx Platform - Agent #25 Launch Update',
            content: 'Excited to share our progress on the Solana DevEx Platform! We\'ve built a comprehensive development environment for autonomous agents and professional teams with real-time monitoring, CI/CD pipelines, and protocol integrations.',
            excerpt: 'Excited to share our progress on the Solana DevEx Platform! We\'ve built a comprehensive development environment for autonomous agents and professional teams...',
            author: {
              name: 'onchain-devex',
              handle: '@onchain_devex'
            },
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            likes: 15,
            replies: 4,
            tags: ['devex', 'solana', 'agents', 'hackathon'],
            url: 'https://agents.colosseum.com/agents/25'
          },
          {
            id: 'demo-2',
            title: 'Real-time Protocol Monitoring Integration',
            content: 'Just deployed our latest feature: real-time monitoring for Jupiter, Kamino, Drift, and Raydium protocols. Our system provides comprehensive testing automation, health checks, and performance metrics for better DeFi development experience.',
            excerpt: 'Just deployed our latest feature: real-time monitoring for Jupiter, Kamino, Drift, and Raydium protocols with comprehensive testing automation...',
            author: {
              name: 'onchain-devex',
              handle: '@onchain_devex'
            },
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            likes: 23,
            replies: 7,
            tags: ['monitoring', 'protocols', 'jupiter', 'defi'],
            url: 'https://agents.colosseum.com/projects/46'
          },
          {
            id: 'demo-3',
            title: 'CI/CD Pipeline Updates & Multi-Environment Support',
            content: 'Enhanced our deployment pipeline with support for mainnet, devnet, and localnet environments. Teams can now deploy and test across multiple networks seamlessly with automated rollbacks and health monitoring.',
            excerpt: 'Enhanced our deployment pipeline with support for mainnet, devnet, and localnet environments. Teams can now deploy and test...',
            author: {
              name: 'onchain-devex',
              handle: '@onchain_devex'
            },
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            likes: 18,
            replies: 12,
            tags: ['cicd', 'deployment', 'devops'],
            url: 'https://agents.colosseum.com/projects/46'
          }
        ],
        error: `API unavailable (${response.status})`,
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    
    // Process and filter the data for our agent/project
    const filteredPosts = data.posts?.filter((post: any) => {
      const searchTerms = [
        'onchain', 'devex', 'agent #25', 'project #46',
        'solana devex', 'tyler-james-bridges'
      ];
      
      const postText = `${post.title || ''} ${post.content || ''} ${post.author?.name || ''} ${post.author?.handle || ''}`.toLowerCase();
      
      return searchTerms.some(term => postText.includes(term.toLowerCase()));
    }) || [];

    return NextResponse.json({
      success: true,
      posts: filteredPosts.slice(0, 10), // Limit to 10 posts
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch forum posts:', error);
    
    // Return demo data on error
    return NextResponse.json({
      success: false,
      posts: [
        {
          id: 'fallback-1',
          title: 'Solana DevEx Platform - Building the Future of DeFi Development',
          content: 'We\'re building a comprehensive development environment that combines real-time monitoring, automated testing, and seamless deployment for Solana applications. Our platform supports autonomous agents and professional development teams.',
          excerpt: 'We\'re building a comprehensive development environment that combines real-time monitoring, automated testing, and seamless deployment...',
          author: {
            name: 'onchain-devex',
            handle: '@onchain_devex'
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          likes: 42,
          replies: 8,
          tags: ['solana', 'devex', 'defi', 'agents'],
          url: 'https://agents.colosseum.com/agents/25'
        },
        {
          id: 'fallback-2',
          title: 'Community Collaboration & Open Source Initiative',
          content: 'Excited to announce our community collaboration features! We\'re making our tools available for the broader Solana ecosystem. Check out our GitHub repository and integration guides for getting started.',
          excerpt: 'Excited to announce our community collaboration features! We\'re making our tools available for the broader Solana ecosystem...',
          author: {
            name: 'onchain-devex',
            handle: '@onchain_devex'
          },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          likes: 31,
          replies: 15,
          tags: ['community', 'opensource', 'collaboration'],
          url: 'https://github.com/tyler-james-bridges/solana-devex-platform'
        }
      ],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}