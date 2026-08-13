import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './useTheme';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Admin App rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ef4444', background: '#0a0c14', height: '100vh', boxSizing: 'border-box' }}>
          <h2>Admin Console Encountered an Initialization Error</h2>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', color: '#f8fafc', overflow: 'auto' }}>
            {String(this.state.error?.stack || this.state.error || 'Unknown error')}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', background: '#f59e0b', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
} catch (err) {
  console.error("Failed to mount Admin App:", err);
}
