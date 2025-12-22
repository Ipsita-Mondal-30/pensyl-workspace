/**
 * AI Orchestration Client
 * 
 * Client wrapper for orchestration endpoint and related AI operations.
 */

export interface OrchestrationRequest {
  prompt: string;
  context?: string;
  metadata?: Record<string, any>;
}

export interface OrchestrationResponse {
  output: string;
  intent: string;
  agents: string[];
  agentOutputs: Record<string, any>;
  errors: string[];
  metadata: {
    confidence?: number;
    reasoning?: string;
  };
}

export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  text: string;
  model: string;
  tokens: number;
}

export interface AsyncTaskRequest {
  type: 'project_summary' | 'audio_generation';
  input: Record<string, any>;
}

export interface AsyncTaskResponse {
  taskId: string;
}

export interface TaskStatus {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * Get backend API URL
 */
function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

/**
 * Get session ID from localStorage
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
 * AI Orchestration Client class
 */
export class AIOrchestrationClient {
  private apiUrl: string;
  private sessionId: string;

  constructor() {
    this.apiUrl = getApiUrl();
    this.sessionId = getSessionId();
  }

  /**
   * Update session ID
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('intellirite_session_id', sessionId);
    }
  }

  /**
   * Orchestrate AI request
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/ai/orchestrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `Orchestration API error: ${response.status} ${response.statusText}`;
        console.error('[AIOrchestrationClient] Orchestration failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error('[AIOrchestrationClient] Fetch error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error(`Cannot connect to backend at ${this.apiUrl}. Is the backend server running?`);
      }
      throw error;
    }
  }

  /**
   * Get embeddings
   */
  async getEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.apiUrl}/api/ai/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Embeddings API error: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * Submit async task
   */
  async submitTask(request: AsyncTaskRequest): Promise<AsyncTaskResponse> {
    const response = await fetch(`${this.apiUrl}/api/ai/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Task API error: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${this.apiUrl}/api/ai/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Task status API error: ${response.status}`,
      );
    }

    return response.json();
  }

  /**
   * Get task result
   */
  async getTaskResult(taskId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/api/ai/tasks/${taskId}/result`, {
      method: 'GET',
      headers: {
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Task result API error: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * Get embeddings for batch
   */
  async getEmbeddingsBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    const response = await fetch(`${this.apiUrl}/api/ai/embeddings/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Batch embeddings API error: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.results;
  }

  /**
   * Get embeddings for project files
   */
  async getProjectEmbeddings(files: Array<{ path: string; content: string }>): Promise<Array<{ path: string; embedding: EmbeddingResponse }>> {
    const response = await fetch(`${this.apiUrl}/api/ai/embeddings/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Project embeddings API error: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.results;
  }
}

// Export singleton instance
export const aiOrchestrationClient = new AIOrchestrationClient();

