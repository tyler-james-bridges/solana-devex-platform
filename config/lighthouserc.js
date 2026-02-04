module.exports = {
  ci: {
    collect: {
      // The URL patterns to run Lighthouse against
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/protocols',
        'http://localhost:3000/monitoring',
      ],
      
      // Run Lighthouse multiple times to get average scores
      numberOfRuns: 3,
      
      // Lighthouse settings
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        
        // Skip certain audits for faster testing
        skipAudits: [
          'uses-http2',
          'redirects-http',
          'uses-long-cache-ttl',
        ],
        
        // Performance budgets
        budgets: [
          {
            path: '/*',
            resourceSizes: [
              { resourceType: 'script', budget: 600 }, // 600KB JS budget
              { resourceType: 'image', budget: 1000 }, // 1MB image budget
              { resourceType: 'stylesheet', budget: 100 }, // 100KB CSS budget
            ],
            resourceCounts: [
              { resourceType: 'script', budget: 30 }, // Max 30 script requests
              { resourceType: 'image', budget: 50 }, // Max 50 image requests
            ],
          },
        ],
      },
    },
    
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off', // Disable PWA for now
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Critical metrics for DeFi/Solana apps
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],
        
        // Security and best practices
        'is-on-https': 'off', // Will be enabled in production
        'uses-https': 'off', // Will be enabled in production
        'external-anchors-use-rel-noopener': 'error',
        'no-vulnerable-libraries': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'meta-viewport': 'error',
        
        // Performance optimizations
        'unused-css-rules': ['warn', { maxLength: 2 }],
        'unused-javascript': ['warn', { maxLength: 2 }],
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',
        
        // Network efficiency
        'render-blocking-resources': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'text-compression': 'warn',
      },
    },
    
    upload: {
      target: 'temporary-public-storage',
      // For production, consider using:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-lhci-token',
    },
    
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
    
    wizard: {
      // Disable wizard for CI environments
      enabled: false,
    },
  },
};