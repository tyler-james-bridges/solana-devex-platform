'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Monitor, 
  Activity, 
  Terminal, 
  Code, 
  Users, 
  Menu,
  X,
  Home,
  Twitter,
  Github
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home
    },
    {
      name: 'Monitor',
      href: '/dashboard',
      icon: Activity,
      description: 'Real-time protocol health and network monitoring'
    },
    {
      name: 'Dev Tools',
      href: '/dev-monitor',
      icon: Terminal,
      description: 'Development workflows and test validator monitoring'
    },
    {
      name: 'Community',
      href: '/community',
      icon: Users,
      description: 'Community hub, partnerships, and collaborations'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Mobile Optimized */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden xs:block sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Solana DevEx Platform</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Real-time monitoring & infrastructure</p>
              </div>
              <div className="block xs:hidden">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">DevEx</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Social Links, Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* Social Links - Desktop Only */}
            <div className="hidden md:flex items-center space-x-1">
              <a
                href="https://twitter.com/onchain_devex"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 transition-colors"
                title="Follow us on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/tyler-james-bridges/solana-devex-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 transition-colors"
                title="View our GitHub repository"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800 transition-colors duration-200">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Social Links */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 px-4 mb-2">Connect with us</p>
                <div className="flex items-center space-x-4 px-4">
                  <a
                    href="https://twitter.com/onchain_devex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Twitter className="w-4 h-4" />
                    <span className="text-sm">Twitter</span>
                  </a>
                  <a
                    href="https://github.com/tyler-james-bridges/solana-devex-platform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Github className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;