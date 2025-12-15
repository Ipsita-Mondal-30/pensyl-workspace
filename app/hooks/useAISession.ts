/**
 * useAISession Hook
 * 
 * React hook for managing AI session state.
 * Handles guest → login transition with context merge.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSessionId,
  setSessionId,
  clearSessionId,
  getSessionInfo,
  syncSessionWithBackend,
} from '../services/session.service';
import { aiClient } from '../lib/ai-client';

export interface AISessionState {
  sessionId: string;
  isGuest: boolean;
  userId?: string;
  isInitialized: boolean;
}

export function useAISession(userId?: string) {
  const [sessionState, setSessionState] = useState<AISessionState>(() => {
    const info = getSessionInfo();
    return {
      sessionId: info.sessionId,
      isGuest: info.isGuest,
      userId: info.userId,
      isInitialized: false,
    };
  });

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      const info = getSessionInfo();
      
      // Update session ID in AI client
      aiClient.setSessionId(info.sessionId);
      
      // Sync with backend
      await syncSessionWithBackend(info.sessionId);

      setSessionState({
        sessionId: info.sessionId,
        isGuest: !userId,
        userId: userId || info.userId,
        isInitialized: true,
      });
    };

    initializeSession();
  }, []);

  // Handle login transition (merge guest context with user context)
  const handleLogin = useCallback(
    async (newUserId: string, newSessionId?: string) => {
      const oldSessionId = sessionState.sessionId;

      // If there's a new session ID from the auth system, use it
      if (newSessionId) {
        setSessionId(newSessionId);
        aiClient.setSessionId(newSessionId);
      }

      // Merge guest context with user context
      // This should be called by the backend during login
      // We just need to update the frontend state
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // Call backend to merge contexts
        const response = await fetch(
          `${apiUrl}/api/context/merge?sessionId=${oldSessionId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          console.log('[useAISession] Guest context merged with user context');
        }
      } catch (error) {
        console.error(
          '[useAISession] Failed to merge guest context',
          error,
        );
      }

      setSessionState((prev) => ({
        ...prev,
        sessionId: newSessionId || prev.sessionId,
        isGuest: false,
        userId: newUserId,
      }));
    },
    [sessionState.sessionId],
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    clearSessionId();
    const newSessionId = getSessionId();
    aiClient.setSessionId(newSessionId);

    setSessionState({
      sessionId: newSessionId,
      isGuest: true,
      userId: undefined,
      isInitialized: true,
    });
  }, []);

  return {
    sessionState,
    handleLogin,
    handleLogout,
  };
}

