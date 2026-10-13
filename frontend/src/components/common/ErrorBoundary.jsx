import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = 'home';
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.hash = 'home';
      if (window.navigateTo) {
        window.navigateTo('home');
      } else {
        window.location.reload();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F4FBFA 0%, #FFFFFF 100%)',
            padding: '24px',
            fontFamily: "'Poppins', sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: 540,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 36px rgba(13, 122, 117, 0.1)',
              border: '1px solid #BCEAE6'
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#FFF2EF',
                color: '#FF6B50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '1px solid #FFD4CC'
              }}
            >
              <AlertTriangle size={32} strokeWidth={2.2} />
            </div>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#12263A',
                marginBottom: 8
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                fontSize: '0.95rem',
                color: '#64748B',
                lineHeight: 1.6,
                marginBottom: 24
              }}
            >
              An unexpected issue occurred while rendering this page. You can safely return to the home page or reload.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 20
              }}
            >
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0D7A75',
                  color: '#FFFFFF',
                  padding: '11px 22px',
                  borderRadius: 12,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(13, 122, 117, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Home size={16} />
                Return to Home
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F1F5F9',
                  color: '#334155',
                  padding: '11px 20px',
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  marginTop: 16,
                  textAlign: 'left',
                  background: '#F8FAFC',
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
              >
                <summary style={{ fontWeight: 600, color: '#0D7A75' }}>
                  Technical Details
                </summary>
                <pre
                  style={{
                    marginTop: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#DC2626',
                    fontFamily: 'monospace'
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
