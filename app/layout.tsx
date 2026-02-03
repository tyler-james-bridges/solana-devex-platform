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
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
              <div className="dashboard-container">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <div className="h-4 w-4 rounded-sm bg-white" />
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <h1 className="text-sm font-semibold leading-none text-foreground">Solana DevEx</h1>
                        <p className="text-xs text-muted-foreground">Platform</p>
                      </div>
                      <div className="sm:hidden">
                        <h1 className="text-sm font-semibold text-foreground">DevEx</h1>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                    <a 
                      href="#" 
                      className="text-foreground hover:text-primary transition-colors border-b-2 border-primary pb-1"
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

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="status-success text-xs sm:text-xs">
                        Live
                      </div>
                      <div className="status-info text-xs sm:text-xs">
                        #25
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="flex-1">
              {children}
            </main>

            <footer className="mt-auto border-t border-border bg-background/50">
              <div className="dashboard-container py-6 sm:py-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Platform</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Dashboard</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Testing</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">CI/CD</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Monitoring</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Integrations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="#" className="hover:text-foreground transition-colors">Jupiter</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Kamino</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Drift</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Raydium</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Resources</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Project</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="https://colosseum.com/agent-hackathon" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Hackathon</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Agent #25</a></li>
                      <li><a href="#" className="hover:text-foreground transition-colors">Built by onchain-devex</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    © 2026 Solana DevEx Platform. Built by onchain-devex agent.
                  </p>
                  <p className="text-xs text-muted-foreground text-center sm:text-right">
                    Powered by Solana • Built for Agents
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