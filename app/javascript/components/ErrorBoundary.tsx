import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  section?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error(`[ErrorBoundary] ${this.props.section ?? 'Unknown'}:`, error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 16,
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <p style={{ color: '#DC2626', fontWeight: 600, marginBottom: 4 }}>
            {this.props.section ? `${this.props.section} failed to load` : 'Something went wrong'}
          </p>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: '#028090',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 20px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}