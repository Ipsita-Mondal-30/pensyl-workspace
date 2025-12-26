"use client";

import { useState, useEffect, useCallback } from 'react';
import { authClient, type User, type Session } from '../lib/auth-client';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const currentSession = await authClient.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
    } catch (error) {
      console.error('[useAuth] Failed to refresh session:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only refresh session once on mount
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const signInEmail = useCallback(async (email: string, password: string) => {
    const result = await authClient.signInEmail(email, password);
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    } else if (!result.error) {
      // If no error but no session, refresh from server
      await refreshSession();
    }
    return { error: result.error };
  }, [refreshSession]);

  const signUpEmail = useCallback(async (email: string, password: string, name?: string) => {
    const result = await authClient.signUpEmail(email, password, name);
    if (result.session) {
      setSession(result.session);
      setUser(result.session.user);
    } else if (!result.error) {
      // If no error but no session, refresh from server
      await refreshSession();
    }
    return { error: result.error };
  }, [refreshSession]);

  const signInWithGoogle = useCallback(async () => {
    await authClient.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return {
    user,
    session,
    loading,
    signInEmail,
    signUpEmail,
    signInWithGoogle,
    signOut,
    refreshSession,
  };
}

