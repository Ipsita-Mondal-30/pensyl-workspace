/**
 * AI Orchestrator Component
 * 
 * React component for AI orchestration.
 * Handles user prompts and displays results.
 */

'use client';

import { useState } from 'react';
import { useAIOrchestration } from '../../hooks/useAIOrchestration';

export interface AIOrchestratorProps {
  onResult?: (result: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AIOrchestrator({
  onResult,
  placeholder = 'Enter your prompt...',
  disabled = false,
}: AIOrchestratorProps) {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const { orchestrating, result, error, orchestrate, reset } = useAIOrchestration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || disabled || orchestrating) {
      return;
    }

    await orchestrate({
      prompt: prompt.trim(),
      context: context.trim() || undefined,
    });
  };

  // Call onResult callback when result is available
  if (result && onResult && result.output) {
    onResult(result.output);
  }

  return (
    <div className="ai-orchestrator w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || orchestrating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-50"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-2">
            Context (Optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Additional context..."
            disabled={disabled || orchestrating}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:opacity-50"
            rows={2}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={disabled || orchestrating || !prompt.trim()}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {orchestrating ? 'Orchestrating...' : 'Submit'}
          </button>

          {result && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold mb-2">Result</h3>
            <div className="whitespace-pre-wrap">{result.output}</div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Intent: {result.intent}</p>
            <p>Agents: {result.agents.join(', ')}</p>
            {result.metadata.confidence && (
              <p>Confidence: {(result.metadata.confidence * 100).toFixed(1)}%</p>
            )}
            {result.metadata.reasoning && (
              <p>Reasoning: {result.metadata.reasoning}</p>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              <p className="font-semibold">Warnings:</p>
              <ul className="list-disc list-inside">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

