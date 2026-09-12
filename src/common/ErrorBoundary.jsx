import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './SafeIcon';

const { FiAlertTriangle, FiRefreshCw } = FiIcons;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <SafeIcon icon={FiAlertTriangle} />
          <p className="eyebrow">ARC recovery protocol</p>
          <h1>Command interface interrupted</h1>
          <p>No operational action was dispatched. Reload to re-establish the secure edge session.</p>
          <button type="button" onClick={() => window.location.reload()}>
            <SafeIcon icon={FiRefreshCw} /> Reconnect ARC
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;