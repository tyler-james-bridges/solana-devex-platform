import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Solana DevEx Platform - Professional Development Environment',
  description: 'Complete development environment and dashboard for Solana applications. Built for autonomous agents and professional development teams.',
  keywords: 'solana, devex, development, ci/cd, testing, monitoring, agents, blockchain',
  authors: [{ name: 'onchain-devex' }],
  creator: 'onchain-devex',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}