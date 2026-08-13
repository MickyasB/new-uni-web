import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './i18n.ts';
import './index.css';
import { ThemeProvider } from './useTheme';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', border: '2px solid #ef4444', borderRadius: '8px', margin: '20px', fontFamily: 'monospace' }}>
          <h2>Application Render Error</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.message}</p>
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
