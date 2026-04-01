import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(_error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { this.setState({ error, errorInfo }); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#222', color: '#ff6b6b', height: '100vh', fontFamily: 'monospace' }}>
          <h2>React Crash (White Screen) Caught!</h2>
          <pre style={{ background: '#111', padding: '20px', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
