'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Monitor, 
  Activity, 
  Terminal, 
  Code, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/',
      icon: Home
    },
    {
      name: 'Protocol Monitor',
      href: '/dashboard',
      icon: Activity,
      description: 'Real-time protocol health and network monitoring'
    },
    {
      name: 'Dev Monitor',
      href: '/dev-monitor',
      icon: Terminal,
      description: 'Development workflows and test validator monitoring'
    },
    {
      name: 'Collaboration',
      href: '/collaboration',
      icon: Monitor,
      description: 'Multi-project workspace and team collaboration'
    },
    {
      name: 'Partnerships',
      href: '/partnerships',
      icon: BarChart3,
      description: 'Integration APIs and partnership demos'
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Solana DevEx Platform</h1>
                <p className="text-xs text-gray-500">Real-time monitoring & infrastructure</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 py-4">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-center">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;