/**
 * useAIOrchestration Hook
 * 
 * React hook for AI orchestration.
 * Manages state and orchestration calls.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  aiOrchestrationClient,
  OrchestrationRequest,
  OrchestrationResponse,
} from '../lib/ai-orchestration-client';

export interface UseAIOrchestrationReturn {
  orchestrating: boolean;
  result: OrchestrationResponse | null;
  error: string | null;
  orchestrate: (request: OrchestrationRequest) => Promise<void>;
  reset: () => void;
}

export function useAIOrchestration(): UseAIOrchestrationReturn {
  const [orchestrating, setOrchestrating] = useState(false);
  const [result, setResult] = useState<OrchestrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orchestrate = useCallback(async (request: OrchestrationRequest) => {
    setOrchestrating(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiOrchestrationClient.orchestrate(request);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Orchestration failed');
      console.error('[useAIOrchestration] Orchestration error', err);
    } finally {
      setOrchestrating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setOrchestrating(false);
  }, []);

  return {
    orchestrating,
    result,
    error,
    orchestrate,
    reset,
  };
}

