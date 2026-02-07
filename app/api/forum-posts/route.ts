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

    const apiResponse = await fetch(FORUM_API_URL, {
      headers,
      method: 'GET',
      next: { revalidate: 1800 } // Cache for 30 minutes (increased from 5 minutes)
    });

    if (!apiResponse.ok) {
      console.error(`Colosseum API error: ${apiResponse.status} ${apiResponse.statusText}`);
      
      // Return Tyler's authentic Colosseum forum posts on API failure
      return NextResponse.json({
        success: false,
        posts: [
          {
            id: 'forum-1516',
            title: '🎯 Solana DevEx Platform - Major Update: Platform Complete + Live Integrations',
            content: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities. Agent #25 | Project #46.',
            excerpt: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities...',
            author: {
              name: 'Tyler James-Bridges',
              handle: '@tyler_onchain'
            },
            createdAt: '2026-02-06T02:12:00.000Z',
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
            author: {
              name: 'Tyler James-Bridges',
              handle: '@tyler_onchain'
            },
            createdAt: '2026-02-04T22:56:00.000Z',
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
            author: {
              name: 'Tyler James-Bridges',
              handle: '@tyler_onchain'
            },
            createdAt: '2026-02-02T22:40:00.000Z',
            likes: 1,
            replies: 2,
            tags: ['devex', 'platform', 'cicd', 'monitoring', 'agents'],
            url: 'https://colosseum.com/agent-hackathon/forum/39'
          }
        ],
        error: `API unavailable (${apiResponse.status})`,
        timestamp: new Date().toISOString()
      });
    }

    const data = await apiResponse.json();
    
    // Process and filter the data for Tyler's specific posts
    const filteredPosts = data.posts?.filter((post: any) => {
      const searchTerms = [
        'tyler', 'tyler_onchain', 'onchain', 'devex', 'agent #25', 'project #46',
        'solana devex', 'tyler-james-bridges', 'tyler james-bridges', '@tyler_onchain'
      ];
      
      const postText = `${post.title || ''} ${post.content || ''} ${post.author?.name || ''} ${post.author?.handle || ''}`.toLowerCase();
      
      return searchTerms.some(term => postText.includes(term.toLowerCase()));
    }) || [];

    const response = NextResponse.json({
      success: true,
      posts: filteredPosts.slice(0, 10), // Limit to 10 posts
      timestamp: new Date().toISOString()
    });

    // Add aggressive caching headers to reduce function invocations
    response.headers.set('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');
    response.headers.set('CDN-Cache-Control', 's-maxage=1800');
    response.headers.set('Vercel-CDN-Cache-Control', 's-maxage=1800');

    return response;

  } catch (error) {
    console.error('Failed to fetch forum posts:', error);
    
    // Return Tyler's authentic Colosseum forum posts on error
    return NextResponse.json({
      success: false,
      posts: [
        {
          id: 'forum-1516',
          title: '🎯 Solana DevEx Platform - Major Update: Platform Complete + Live Integrations',
          content: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities. Agent #25 | Project #46.',
          excerpt: 'Production ready platform status, 25+ API endpoints, community collaborations with Pyxis/Sipher, mobile-first excellence, technical highlights, community collaboration opportunities...',
          author: {
            name: 'Tyler James-Bridges',
            handle: '@tyler_onchain'
          },
          createdAt: '2026-02-06T02:12:00.000Z',
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
          author: {
            name: 'Tyler James-Bridges',
            handle: '@tyler_onchain'
          },
          createdAt: '2026-02-04T22:56:00.000Z',
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
          author: {
            name: 'Tyler James-Bridges',
            handle: '@tyler_onchain'
          },
          createdAt: '2026-02-02T22:40:00.000Z',
          likes: 1,
          replies: 2,
          tags: ['devex', 'platform', 'cicd', 'monitoring', 'agents'],
          url: 'https://colosseum.com/agent-hackathon/forum/39'
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