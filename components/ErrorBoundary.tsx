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
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="typography-h2">System Error</h1>
                <p className="typography-body text-muted-foreground">
                  The DevEx Platform encountered an unexpected error. This might be a temporary issue.
                </p>
              </div>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="card">
                <div className="card-content">
                  <h3 className="typography-h3 mb-2 text-destructive">Error Details</h3>
                  <pre className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded-md overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="button-primary flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="button-secondary flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
            
            <div className="text-center">
              <p className="typography-caption">
                If this problem persists, please check the console for details or report the issue.
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