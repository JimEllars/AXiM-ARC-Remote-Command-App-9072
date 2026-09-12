import React, { useEffect, useState } from 'react';
import AuthGate from './components/auth/AuthGate';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './common/ErrorBoundary';
import { usePasskeyAuth } from './hooks/usePasskeyAuth';

function App() {
  const auth = usePasskeyAuth();
  const [previewMode, setPreviewMode] = useState(
    window.location.hash === '#preview'
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (auth.loading && !previewMode) {
    return (
      <main className="boot-screen">
        <div className="boot-mark">AX</div>
        <p>Establishing secure edge session</p>
        <span />
      </main>
    );
  }

  return (
    <ErrorBoundary>
      {auth.session || previewMode ? (
        <AppShell
          previewMode={previewMode}
          onExitPreview={() => {
            window.location.hash = '';
            setPreviewMode(false);
          }}
        />
      ) : (
        <AuthGate
          auth={auth}
          onPreview={() => {
            window.location.hash = 'preview';
            setPreviewMode(true);
          }}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;