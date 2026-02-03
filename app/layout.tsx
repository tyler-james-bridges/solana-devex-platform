import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Solana DevEx Platform - Professional Development Environment',
  description: 'Complete development environment and dashboard for Solana applications. Built for autonomous agents and professional development teams.',
  keywords: 'solana, devex, development, ci/cd, testing, monitoring, agents, blockchain',
  authors: [{ name: 'onchain-devex' }],
  creator: 'onchain-devex',
  publisher: 'onchain-devex',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://solana-devex-platform.vercel.app',
    siteName: 'Solana DevEx Platform',
    title: 'Professional Solana Development Environment',
    description: 'Complete CI/CD, testing, and monitoring platform for Solana applications',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana DevEx Platform',
    description: 'Professional development environment for Solana applications',
    creator: '@onchain_devex',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="dashboard-container flex h-16 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <div className="h-4 w-4 rounded-sm bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-sm font-semibold leading-none">Solana DevEx</h1>
                      <p className="text-xs text-muted-foreground">Platform</p>
                    </div>
                  </div>
                </div>
                
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                  <a 
                    href="#" 
                    className="text-foreground hover:text-foreground/80 transition-colors border-b-2 border-primary pb-1"
                  >
                    Dashboard
                  </a>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Testing
                  </a>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Deployments
                  </a>
                  <a 
                    href="#" 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Monitoring
                  </a>
                </nav>

                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="status-success">
                      Live
                    </div>
                    <div className="status-info">
                      Agent #25
                    </div>
                  </div>
                  
                  <button className="md:hidden p-2 rounded-md hover:bg-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            <main className="relative">
              {children}
            </main>

            <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="dashboard-container py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Platform</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Testing</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">CI/CD</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Monitoring</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Integrations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Jupiter</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Kamino</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Drift</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Raydium</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Resources</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform" className="hover:text-foreground transition-colors">GitHub</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Project</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="https://colosseum.com/agent-hackathon" className="hover:text-foreground transition-colors">Colosseum Hackathon</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Agent #25</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Built by onchain-devex</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    © 2026 Solana DevEx Platform. Built autonomously by onchain-devex agent.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 md:mt-0">
                    Powered by Solana • Secured by Design • Built for Agents
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}