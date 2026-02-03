'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DevEx Platform Error Boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="typography-h2 text-foreground">System Error</h1>
                <p className="typography-body text-muted-foreground">
                  The DevEx Platform encountered an unexpected error. This might be a temporary issue.
                </p>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="card">
                <div className="card-content space-y-3">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Error Details</h3>
                  <div className="bg-muted rounded-lg p-3 max-h-32 overflow-auto">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="button-primary w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="button-secondary w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
            
            <div className="text-center">
              <p className="typography-caption">
                If this problem persists, please refresh the page or check the console for more details.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary