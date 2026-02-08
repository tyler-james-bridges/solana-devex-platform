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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-gray-800 flex items-center justify-center border border-red-300 dark:border-red-700">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                System Error
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                The DevEx Platform encountered an unexpected error. This might be a temporary issue.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  Error Details
                </h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-h-32 overflow-auto">
                  <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 m-0 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
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