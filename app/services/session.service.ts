/**
 * Session Service
 * 
 * Manages guest session IDs and syncs with backend context service.
 */

const SESSION_ID_KEY = 'intellirite_session_id';

export interface SessionInfo {
  sessionId: string;
  isGuest: boolean;
  userId?: string;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get or create session ID from localStorage
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Set session ID (useful after login)
 */
export function setSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
}

/**
 * Clear session ID
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_ID_KEY);
  }
}

/**
 * Get session info
 */
export function getSessionInfo(): SessionInfo {
  const sessionId = getSessionId();
  // Check if we have user info (from auth context or similar)
  // This would be populated from your auth system
  const userId = undefined; // TODO: Get from auth context

  return {
    sessionId,
    isGuest: !userId,
    userId,
  };
}

/**
 * Sync session with backend (verify it exists)
 */
export async function syncSessionWithBackend(
  sessionId: string,
): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Optionally ping backend to ensure session is tracked
    // This could be a lightweight endpoint or part of context service
    // For now, we just return true
    return true;
  } catch (error) {
    console.error('[SessionService] Failed to sync session with backend', error);
    return false;
  }
}

