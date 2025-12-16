/**
 * AI Client Wrapper
 * 
 * Type-safe client for calling the backend AI execution API.
 * Handles session ID management for guest users.
 */

export type AITask = "generate" | "classify" | "embed" | "summarize";
export type PriorityLevel = "cheap" | "balanced" | "quality";

export interface JSONSchema {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
}

export interface AIExecuteOptions {
  task: AITask;
  input: string;
  context?: string;
  schema?: JSONSchema;
  priority?: PriorityLevel;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AIExecuteResult {
  response: string;
  parsedJson?: any;
  metadata: {
    model: string;
    provider: string;
    usedJsonMode: boolean;
    task: AITask;
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
 * Get or create session ID from localStorage
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
 * Get backend API URL
 */
function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * AI Client class for making AI execution requests
 */
export class AIClient {
  private sessionId: string;
  private apiUrl: string;

  constructor() {
    this.sessionId = getSessionId();
    this.apiUrl = getApiUrl();
  }

  /**
   * Update session ID (useful after login)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('intellirite_session_id', sessionId);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Execute AI task
   */
  async execute(options: AIExecuteOptions): Promise<AIExecuteResult> {
    const response = await fetch(`${this.apiUrl}/api/ai/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
      },
      credentials: 'include', // Include cookies for auth
      body: JSON.stringify({
        ...options,
        sessionId: options.sessionId || this.sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `AI API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Generate text/completion
   */
  async generate(
    input: string,
    options?: {
      context?: string;
      schema?: JSONSchema;
      priority?: PriorityLevel;
      metadata?: Record<string, any>;
    },
  ): Promise<AIExecuteResult> {
    return this.execute({
      task: 'generate',
      input,
      ...options,
    });
  }

  /**
   * Classify/categorize text
   */
  async classify(
    input: string,
    options?: {
      context?: string;
      schema?: JSONSchema;
      priority?: PriorityLevel;
      metadata?: Record<string, any>;
    },
  ): Promise<AIExecuteResult> {
    return this.execute({
      task: 'classify',
      input,
      ...options,
    });
  }

  /**
   * Create embeddings
   */
  async embed(
    input: string,
    options?: {
      priority?: PriorityLevel;
      metadata?: Record<string, any>;
    },
  ): Promise<AIExecuteResult> {
    return this.execute({
      task: 'embed',
      input,
      ...options,
    });
  }

  /**
   * Summarize text
   */
  async summarize(
    input: string,
    options?: {
      context?: string;
      priority?: PriorityLevel;
      metadata?: Record<string, any>;
    },
  ): Promise<AIExecuteResult> {
    return this.execute({
      task: 'summarize',
      input,
      ...options,
    });
  }
}

// Export singleton instance
export const aiClient = new AIClient();

