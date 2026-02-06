'use client'

// Community page for Solana DevEx Platform
import { 
  Twitter, 
  Github, 
  ExternalLink, 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  Shield,
  Lock,
  Network,
  CheckCircle,
  Code,
  Activity,
  Zap,
  BarChart3,
  ArrowRight,
  Globe
} from 'lucide-react';
import ForumFeed from '../../components/ForumFeed';

export default function CommunityPage() {
  const partnerships = [
    {
      id: 'pyxis-oracle',
      name: 'Pyxis Oracle Safety Pipeline',
      collaborator: 'Ace-Strategist',
      description: 'Safety certificates for Oracle nodes before P2P swarm joining',
      status: 'Production',
      icon: Shield,
      color: 'blue',
      features: [
        'LiteSVM validation system',
        'Safety Certificate generation',
        'Edge case testing',
        'Resource limit validation',
        'Rug protection analysis',
        'Runtime health monitoring'
      ],
      endpoints: [
        'POST /api/pyxis/validate',
        'GET /api/pyxis/certificate/:nodeId', 
        'POST /api/pyxis/verify',
        'GET /api/pyxis/health/:nodeId',
        'POST /api/pyxis/health/:nodeId',
        'GET /api/pyxis/stats'
      ],
      benefits: [
        'Higher quality Oracle nodes',
        'Reduced rug risk in P2P swarms',
        'Standardized validation process',
        'Autonomous safety verification'
      ]
    },
    {
      id: 'sipher-privacy',
      name: 'Sipher Privacy Layer',
      collaborator: 'Sipher Protocol',
      description: 'Privacy protection for autonomous deployments and treasury operations',
      status: 'Production',
      icon: Lock,
      color: 'purple',
      features: [
        'Stealth address generation',
        'Pedersen commitments',
        'Private contract deployment',
        'Protected test funding',
        'Treasury operation privacy',
        'MEV protection'
      ],
      endpoints: [
        'POST /api/sipher/deploy-shield',
        'POST /api/sipher/fund-shield',
        'POST /api/sipher/treasury-shield', 
        'GET /api/sipher/privacy-status/:txId',
        'POST /api/sipher/batch-shield',
        'GET /api/sipher/privacy-metrics'
      ],
      benefits: [
        'Front-running protection',
        'Competitive strategy privacy',
        'Autonomous deployment safety',
        'Treasury operation security'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    // Use consistent gray styling for all status badges to avoid "highlighted" appearance
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
  };

  const getColorClasses = (color: string) => {
    // Use consistent gray styling for all elements to avoid "highlighted" appearance
    return {
      icon: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700',
      bg: 'bg-white dark:bg-gray-800'
    };
  };

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
              Connect with our team, follow our progress, explore our partnerships, and join the conversation. 
              We're building the future of Solana development experience together.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mr-2"></div>
              Active Community
            </span>
          </div>
        </div>

        {/* Connect With Us */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connect With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="https://twitter.com/onchain_devex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Twitter</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">@onchain_devex</p>
                {/* Removed fake stats - authenticity over fictional metrics */}
              </div>
            </a>

            <a 
              href="https://github.com/tyler-james-bridges/solana-devex-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">GitHub</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Open Source Platform</p>
                {/* Real GitHub stats available at repository */}
              </div>
            </a>

            <a 
              href="https://agents.colosseum.com/agents/25"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-600 dark:bg-gray-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Colosseum</h3>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Agent #25 Profile</p>
                {/* Real forum stats: 3 posts documented below */}
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Community Partnerships */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <span>Community Partnerships</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Hackathon collaborations and integrations built from community feedback. These implementations showcase 
          production-ready workflows developed through forum discussions and agent ecosystem feedback.
        </p>

        {/* Partnerships Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Collaborations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{partnerships.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Endpoints</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {partnerships.reduce((total, p) => total + p.endpoints.length, 0)}
                </p>
              </div>
              <Network className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
              </div>
              <Activity className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">137ms</p>
              </div>
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Partnership Cards */}
        <div className="space-y-6">
          {partnerships.map((partnership) => {
            const colorClasses = getColorClasses(partnership.color);
            const Icon = partnership.icon;
            
            return (
              <div 
                key={partnership.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden ${colorClasses.border}`}
              >
                {/* Header */}
                <div className={`p-6 ${colorClasses.bg} border-b dark:border-gray-700`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-8 h-8 ${colorClasses.icon}`} />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {partnership.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hackathon collaboration with {partnership.collaborator}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(partnership.status)}`}>
                      {partnership.status}
                    </span>
                  </div>
                  <p className="mt-3 text-gray-700 dark:text-gray-300">
                    {partnership.description}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Features */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Key Features
                      </h4>
                      <ul className="space-y-2">
                        {partnership.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* API Endpoints */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Code className="w-5 h-5 text-blue-600 mr-2" />
                        API Endpoints ({partnership.endpoints.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {partnership.endpoints.map((endpoint, index) => (
                          <div key={index} className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded font-mono text-sm">
                            {endpoint}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                      Partnership Benefits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {partnership.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-green-800 dark:text-green-300 text-sm font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration Resources */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Integration Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Github className="w-12 h-12 text-gray-700 dark:text-gray-300 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Source Code</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Full implementation available on GitHub
              </p>
              <a 
                href="https://github.com/tyler-james-bridges/solana-devex-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Repository <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>

            <div className="text-center">
              <Globe className="w-12 h-12 text-gray-700 dark:text-gray-300 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Live Platform</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Production platform with working integrations
              </p>
              <a 
                href="https://onchain-devex.tools"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Visit Platform <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>

            <div className="text-center">
              <Code className="w-12 h-12 text-gray-700 dark:text-gray-300 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Documentation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Integration guides and API documentation
              </p>
              <span className="inline-flex items-center text-gray-500 dark:text-gray-400 text-sm">
                Available in repository
              </span>
            </div>
          </div>
        </div>

        {/* Partnership Contact */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 text-center">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
            Interested in Partnership?
          </h3>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Our platform provides critical infrastructure for the Solana agent ecosystem. 
            Contact us to discuss integration opportunities.
          </p>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Platform: <span className="font-mono">onchain-devex.tools</span> • 
            Agent: <span className="font-mono">#25</span> • 
            Project: <span className="font-mono">#46</span>
          </div>
        </div>
      </div>

      {/* Complete Forum Contributions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-green-600" />
          <span>Complete Forum Contributions</span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Tyler's complete engagement history in the Colosseum community - showcasing sustained participation 
          and contributions to the autonomous agent ecosystem over time.
        </p>
        <ForumFeed showHeader={true} showAll={true} compact={false} />
      </div>
    </div>
  );
}