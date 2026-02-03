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
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1rem',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginBottom: '1rem' 
              }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: '#fee2e2', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid #ef4444'
                }}>
                  <AlertTriangle style={{ width: '32px', height: '32px', color: '#dc2626' }} />
                </div>
              </div>
              
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#111827', 
                marginBottom: '0.5rem' 
              }}>
                System Error
              </h1>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                lineHeight: '1.5' 
              }}>
                The DevEx Platform encountered an unexpected error. This might be a temporary issue.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ 
                marginBottom: '1.5rem',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#dc2626',
                  marginBottom: '0.5rem'
                }}>
                  Error Details
                </h3>
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '0.5rem', 
                  padding: '0.75rem',
                  maxHeight: '128px',
                  overflow: 'auto'
                }}>
                  <pre style={{ 
                    fontSize: '0.75rem', 
                    fontFamily: 'monospace', 
                    color: '#374151',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}>
                    {this.state.error.message}
                  </pre>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Home style={{ width: '16px', height: '16px' }} />
                Go Home
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
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