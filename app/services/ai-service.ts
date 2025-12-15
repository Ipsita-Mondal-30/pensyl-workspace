"use client";

/**
 * Unified AI Service
 * 
 * Supports both:
 * 1. Backend Orchestration API (default) - Uses OpenRouter models via orchestration layer
 * 2. Gemini Direct API (fallback) - Direct Gemini API calls
 */

import { streamMessageToGemini, type ChatMessage as GeminiChatMessage } from './gemini';
import { aiOrchestrationClient } from '../lib/ai-orchestration-client';

export type AIProvider = 'orchestration' | 'gemini';

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  provider?: AIProvider;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Get the configured AI provider (default: orchestration with Gemini as fallback)
 */
function getDefaultProvider(): AIProvider {
  if (typeof window === 'undefined') {
    return 'orchestration';
  }
  
  const stored = localStorage.getItem('intellirite_ai_provider');
  return (stored === 'gemini' || stored === 'orchestration') ? stored : 'orchestration';
}

/**
 * Set the AI provider preference
 */
export function setAIProvider(provider: AIProvider): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('intellirite_ai_provider', provider);
  }
}

/**
 * Stream a message using the backend orchestration API
 * This uses the agent orchestration layer with OpenRouter models
 */
async function* streamMessageViaOrchestration(
  messages: ChatMessage[],
  options: StreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  // Get the last user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  // Build context from previous messages
  const contextMessages = messages.slice(0, -1);
  const context = contextMessages.length > 0
    ? contextMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
    : options.context;

  try {
    // Call orchestration API
    const response = await aiOrchestrationClient.orchestrate({
      prompt: lastMessage.content,
      context,
      metadata: {
        ...options.metadata,
        messageHistory: contextMessages.length,
      },
    });

    // Simulate streaming by chunking the response
    // In the future, the backend can support SSE streaming
    const output = response.output || '';
    const chunks = output.split(' ');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
      yield chunk;
      
      // Small delay to simulate streaming
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Log orchestration details for debugging
    console.log('🤖 Orchestration Response:', {
      intent: response.intent,
      agents: response.agents,
      confidence: response.metadata?.confidence,
      reasoning: response.metadata?.reasoning,
      agentOutputs: Object.keys(response.agentOutputs || {}),
    });

    // Store orchestration metadata for UI display
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-orchestration-complete', {
        detail: {
          intent: response.intent,
          agents: response.agents,
          confidence: response.metadata?.confidence,
          reasoning: response.metadata?.reasoning,
          agentOutputs: response.agentOutputs,
        },
      }));
    }

  } catch (error: any) {
    console.error('Orchestration API error:', error);
    throw new Error(
      `Orchestration failed: ${error?.message || 'Unknown error'}. Try using Gemini provider as fallback.`
    );
  }
}

/**
 * Stream a message using Gemini API (fallback)
 */
async function* streamMessageViaGemini(
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const geminiMessages: GeminiChatMessage[] = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  yield* streamMessageToGemini(geminiMessages);
}

/**
 * Stream a message - uses orchestration by default, falls back to Gemini if needed
 * 
 * @param messages Chat message history
 * @param options Streaming options including provider selection
 * @returns Async generator yielding response chunks
 */
export async function* streamAIMessage(
  messages: ChatMessage[],
  options: StreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const provider = options.provider || getDefaultProvider();

  try {
    if (provider === 'orchestration') {
      // Try orchestration first
      yield* streamMessageViaOrchestration(messages, options);
    } else {
      // Use Gemini
      yield* streamMessageViaGemini(messages);
    }
  } catch (error: any) {
    // If orchestration fails and we're using it, try Gemini as fallback
    if (provider === 'orchestration') {
      console.warn('Orchestration failed, falling back to Gemini:', error);
      try {
        yield* streamMessageViaGemini(messages);
      } catch (geminiError: any) {
        throw new Error(
          `Both orchestration and Gemini failed. Orchestration: ${error?.message || 'Unknown'}, Gemini: ${geminiError?.message || 'Unknown'}`
        );
      }
    } else {
      throw error;
    }
  }
}

/**
 * Send a message and get complete response (non-streaming)
 */
export async function sendAIMessage(
  messages: ChatMessage[],
  options: StreamOptions = {}
): Promise<string> {
  let fullResponse = '';
  for await (const chunk of streamAIMessage(messages, options)) {
    fullResponse += chunk;
  }
  return fullResponse;
}

