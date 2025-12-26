/**
 * Context Service
 * 
 * Manages AI context persistence and guest→login merge on the frontend.
 */

export interface AIContext {
  projectId?: string;
  projectName?: string;
  conversations?: Array<{
    id: string;
    messages: Array<{
      role: string;
      content: string;
      timestamp: Date;
    }>;
  }>;
  files?: Array<{
    path: string;
    content?: string;
    metadata?: any;
  }>;
  custom?: Record<string, any>;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  };
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * Save context to backend
 */
export async function saveContext(
  context: AIContext,
  sessionId: string,
  userId?: string,
): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/api/context/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({
        context,
        userId,
        sessionId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[ContextService] Failed to save context', error);
    return false;
  }
}

/**
 * Load context from backend
 */
export async function loadContext(
  sessionId: string,
  userId?: string,
): Promise<AIContext | null> {
  try {
    const apiUrl = getApiUrl();
    
    const url = userId
      ? `${apiUrl}/api/context?userId=${userId}`
      : `${apiUrl}/api/context?sessionId=${sessionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.context || null;
  } catch (error) {
    console.error('[ContextService] Failed to load context', error);
    return null;
  }
}

/**
 * Merge guest context with user context
 * Called during login flow
 */
export async function mergeGuestContextToUser(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/api/context/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionId,
        userId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[ContextService] Failed to merge contexts', error);
    return false;
  }
}

/**
 * Get user projects
 */
export async function getUserProjects(userId: string): Promise<any[]> {
  try {
    const apiUrl = getApiUrl();
    
    const response = await fetch(`${apiUrl}/api/context/projects?userId=${userId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('[ContextService] Failed to get user projects', error);
    return [];
  }
}

