/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  output: 'standalone', // Optimized for serverless deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  swcMinify: true,
  // Build optimization to reduce build time and costs
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Enable static optimization where possible
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  async redirects() {
    return [
      {
        source: '/partnerships',
        destination: '/community',
        permanent: true,
      },
    ];
  },
  // Webpack optimizations to reduce bundle size and build time
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
}

module.exports = nextConfig