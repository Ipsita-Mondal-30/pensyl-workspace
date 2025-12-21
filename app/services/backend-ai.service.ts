"use client";

/**
 * Backend AI Service
 * 
 * Service for interacting with the backend AI API (OpenRouter models)
 */

export interface BackendModel {
  id: string; // e.g., "openrouter/openai/gpt-4o"
  name: string;
  displayName: string;
  description: string;
  category: 'cheap' | 'balanced' | 'quality' | 'premium';
  costTier: number; // 1 = cheapest, 4 = most expensive
  speed: 'fast' | 'medium' | 'slow';
  capabilities: 'basic' | 'standard' | 'advanced';
  maxTokens: number;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
}

export interface AIExecuteRequest {
  task: 'generate' | 'classify' | 'embed' | 'summarize';
  input: string;
  context?: string;
  priority?: 'cheap' | 'balanced' | 'quality';
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AIExecuteResponse {
  response: string;
  parsedJson?: any;
  metadata: {
    model: string;
    provider: string;
    usedJsonMode: boolean;
    task: string;
    executionTimeMs: number;
  };
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  error?: {
    message: string;
    code?: string;
    providerError?: any;
  };
}

/**
 * Get backend API URL
 */
function getBackendUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
}

/**
 * Get session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return `server-${Date.now()}`;
  }
  
  const key = 'intellirite_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/**
 * Fetch available models from backend
 */
export async function getAvailableModels(): Promise<BackendModel[]> {
  try {
    const backendUrl = getBackendUrl();
    
    // Check if backend URL is accessible (basic validation)
    if (!backendUrl || backendUrl === 'undefined') {
      console.warn('[BackendAIService] Backend URL not configured, using fallback');
      return [];
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${backendUrl}/api/ai/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[BackendAIService] Backend returned ${response.status}: ${errorText}`);
        return [];
      }

      const data = await response.json();
      // Backend returns an array directly, not wrapped in a models property
      const models = Array.isArray(data) ? data : (data.models || []);
      
      if (models.length === 0) {
        console.warn('[BackendAIService] Backend returned empty model list');
      }
      
      return models;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error: any) {
    // Handle network errors, timeouts, CORS, etc.
    if (error.name === 'AbortError') {
      console.warn('[BackendAIService] Request timed out - backend may be unavailable');
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('[BackendAIService] Network error - backend may not be running or CORS issue. Check:', {
        backendUrl: getBackendUrl(),
        error: error.message,
      });
    } else {
      console.error('[BackendAIService] Failed to fetch models:', error);
    }
    
    // Return empty array instead of throwing - allows UI to continue with fallback
    return [];
  }
}

/**
 * Execute AI task via backend
 * 
 * Maps model selection to priority level:
 * - costTier 1 → priority: 'cheap'
 * - costTier 2 → priority: 'balanced'
 * - costTier 3-4 → priority: 'quality'
 */
export async function executeAI(
  request: AIExecuteRequest,
  selectedModelId?: string
): Promise<AIExecuteResponse> {
  try {
    const backendUrl = getBackendUrl();
    const sessionId = request.sessionId || getSessionId();
    
    // Determine priority from selected model if provided
    let priority = request.priority;
    if (selectedModelId && !priority) {
      try {
        const models = await getAvailableModels();
        const selectedModel = models.find(m => m.id === selectedModelId);
        if (selectedModel) {
          // Map cost tier to priority
          if (selectedModel.costTier === 1) {
            priority = 'cheap';
          } else if (selectedModel.costTier === 2) {
            priority = 'balanced';
          } else {
            priority = 'quality';
          }
        }
      } catch (error) {
        console.warn('[BackendAIService] Failed to map model to priority, using default:', error);
        priority = priority || 'balanced';
      }
    }

    const response = await fetch(`${backendUrl}/api/ai/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({
        ...request,
        priority: priority || 'balanced',
        sessionId,
        metadata: {
          ...request.metadata,
          selectedModelId, // Include selected model ID in metadata for reference
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `AI execution failed: ${response.status}`,
      );
    }

    return response.json();
  } catch (error: any) {
    console.error('[BackendAIService] AI execution error:', error);
    throw new Error(
      `AI execution failed: ${error?.message || 'Unknown error'}`,
    );
  }
}

/**
 * Stream AI response (simulated by chunking)
 * 
 * Note: Backend doesn't support streaming yet, so we simulate it
 */
export async function* streamAI(
  request: AIExecuteRequest,
  selectedModelId?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const result = await executeAI(request, selectedModelId);
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    // Simulate streaming by chunking the response
    const text = result.response || '';
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      yield chunk;
      
      // Small delay to simulate streaming
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  } catch (error: any) {
    console.error('[BackendAIService] Streaming error:', error);
    throw error;
  }
}

