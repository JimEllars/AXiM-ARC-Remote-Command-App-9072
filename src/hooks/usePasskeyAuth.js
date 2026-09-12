import { useCallback, useEffect, useState } from 'react';
import {
  authenticateWithPasskey,
  getPassportSession
} from '../services/passkeyService';

export function usePasskeyAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
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