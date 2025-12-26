"use client";

/**
 * Citation Service
 * 
 * Service for finding and managing academic citations using OpenAlex API via backend
 */

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  doi?: string;
  openalexId: string;
  relevance: number;
  citationText: string;
}

export interface CitationOutput {
  citations: Citation[];
  inTextCitations: Array<{
    text: string;
    citationIds: string[];
  }>;
}

export interface CitationRequest {
  prompt: string; // The text to search citations for
  context?: string; // Additional context
  citationStyle?: 'apa' | 'mla' | 'chicago' | 'ieee';
  metadata?: Record<string, any>;
}

export interface CitationResponse {
  content: string; // JSON string of CitationOutput
  metadata?: {
    totalFound?: number;
    selected?: number;
    style?: string;
    message?: string;
  };
  error?: {
    message: string;
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
 * Search for citations using OpenAlex API via backend
 */
export async function searchCitations(
  request: CitationRequest
): Promise<CitationOutput> {
  try {
    const backendUrl = getBackendUrl();
    const sessionId = getSessionId();

    const response = await fetch(`${backendUrl}/api/ai/agents/citation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt: request.prompt,
        context: request.context,
        metadata: {
          ...request.metadata,
          citationStyle: request.citationStyle || 'apa',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `Citation search failed: ${response.status}`,
      );
    }

    const data: CitationResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Parse the content (it's JSON stringified)
    try {
      const citationOutput: CitationOutput = JSON.parse(data.content);
      return citationOutput;
    } catch (parseError) {
      // If parsing fails, return empty result
      console.error('[CitationService] Failed to parse citation output:', parseError);
      return {
        citations: [],
        inTextCitations: [],
      };
    }
  } catch (error: any) {
    console.error('[CitationService] Citation search error:', error);
    throw new Error(
      `Citation search failed: ${error?.message || 'Unknown error'}`,
    );
  }
}

/**
 * Format citation text for insertion into editor
 */
export function formatCitationForEditor(
  citation: Citation,
  format: 'intext' | 'full' = 'full'
): string {
  if (format === 'intext') {
    // In-text citation format (e.g., "(Author et al., 2023)")
    if (citation.authors.length > 0) {
      const firstAuthor = citation.authors[0].split(' ').pop() || citation.authors[0];
      const year = citation.year;
      return `(${firstAuthor} et al., ${year})`;
    }
    return `(${citation.year})`;
  }

  // Full citation format
  return citation.citationText;
}

