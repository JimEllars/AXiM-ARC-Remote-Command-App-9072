import { useCallback, useEffect, useState } from 'react';
import {
  authenticateWithPasskey,
  getPassportSession
} from '../services/passkeyService';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function usePasskeyAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Check for incoming SSO tokens in URL
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token') || searchParams.get('session_token') || searchParams.get('sso_payload');

      if (token) {
        const payload = parseJwt(token);
        if (payload && payload.role === 'super_user') {
          const ssoSession = {
            user: {
              email: payload.email || payload.sub,
              role: payload.role,
              permissions: payload.permissions || [],
              exp: payload.exp
            },
            token
          };
          sessionStorage.setItem('arc_sso_session', JSON.stringify(ssoSession));

          // Clean the browser URL parameters
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

          setSession(ssoSession);
          setLoading(false);
          return;
        }
      }

      // 2. Check for stored SSO session
      const storedSsoSession = sessionStorage.getItem('arc_sso_session');
      if (storedSsoSession) {
        const parsedSession = JSON.parse(storedSsoSession);
        // Check expiry if exists
        if (!parsedSession.user.exp || (parsedSession.user.exp * 1000 > Date.now())) {
            setSession(parsedSession);
            setLoading(false);
            return;
        } else {
            sessionStorage.removeItem('arc_sso_session');
        }
      }

      // 3. Fallback to API check
      const activeSession = await getPassportSession();
      setSession(activeSession);
    } catch (sessionError) {
      setSession(null);
      if (!sessionError.message.includes('session check failed')) {
        setError(sessionError.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithBiometrics = async (email) => {
    setAuthenticating(true);
    setError('');
    try {
      const activeSession = await authenticateWithPasskey(email);
      setSession(activeSession);
      return true;
    } catch (authenticationError) {
      setError(authenticationError.message);
      return false;
    } finally {
      setAuthenticating(false);
    }
  };

  return {
    session,
    loading,
    authenticating,
    error,
    loginWithBiometrics,
    refreshSession
  };
}
