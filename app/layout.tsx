import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '../components/ErrorBoundary'
import Navigation from '../components/Navigation'
import { ThemeProvider } from '../hooks/useTheme'
import { ThemeScript } from './theme-script'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: true,
  themeColor: '#3b82f6'
}

export const metadata: Metadata = {
  title: 'Solana DevEx Platform - Professional Development Environment',
  description: 'Complete development environment and dashboard for Solana applications. Built for autonomous agents and professional development teams.',
  keywords: 'solana, devex, development, ci/cd, testing, monitoring, agents, blockchain',
  authors: [{ name: 'onchain-devex' }],
  creator: 'onchain-devex',
  robots: 'index, follow',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ErrorBoundary>
            <Navigation />
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}