"use client";

/**
 * Unified AI Service
 * 
 * Now uses Backend AI API (OpenRouter models via backend)
 * Falls back to Gemini Direct API if backend is unavailable
 */

import { streamMessageToGemini, type ChatMessage as GeminiChatMessage } from './gemini';
import { streamAI, type BackendModel } from './backend-ai.service';

export type AIProvider = 'backend' | 'gemini';

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  provider?: AIProvider;
  context?: string;
  metadata?: Record<string, any>;
  selectedModelId?: string; // Model ID from backend model registry
}

/**
 * Get the configured AI provider (default: backend with Gemini as fallback)
 */
function getDefaultProvider(): AIProvider {
  if (typeof window === 'undefined') {
    return 'backend';
  }
  
  const stored = localStorage.getItem('intellirite_ai_provider');
  return (stored === 'gemini' || stored === 'backend') ? stored : 'backend';
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
 * Stream a message using the backend AI API (OpenRouter models)
 */
async function* streamMessageViaBackend(
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
    // Call backend AI execute API
    yield* streamAI(
      {
        task: 'generate',
        input: lastMessage.content,
        context,
        metadata: {
          ...options.metadata,
          messageHistory: contextMessages.length,
        },
      },
      options.selectedModelId
    );

    console.log('✅ Backend AI Response completed');

  } catch (error: any) {
    console.error('Backend AI API error:', error);
    throw new Error(
      `Backend AI failed: ${error?.message || 'Unknown error'}. Try using Gemini provider as fallback.`
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
 * Stream a message - uses backend API by default, falls back to Gemini if needed
 * 
 * @param messages Chat message history
 * @param options Streaming options including provider selection and model ID
 * @returns Async generator yielding response chunks
 */
export async function* streamAIMessage(
  messages: ChatMessage[],
  options: StreamOptions = {}
): AsyncGenerator<string, void, unknown> {
  const provider = options.provider || getDefaultProvider();

  try {
    if (provider === 'backend') {
      // Try backend AI API first
      yield* streamMessageViaBackend(messages, options);
    } else {
      // Use Gemini
      yield* streamMessageViaGemini(messages);
    }
  } catch (error: any) {
    // If backend fails and we're using it, try Gemini as fallback
    if (provider === 'backend') {
      console.warn('Backend AI failed, falling back to Gemini:', error);
      try {
        yield* streamMessageViaGemini(messages);
      } catch (geminiError: any) {
        throw new Error(
          `Both backend AI and Gemini failed. Backend: ${error?.message || 'Unknown'}, Gemini: ${geminiError?.message || 'Unknown'}`
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

/**
 * Export backend model type for use in components
 */
export type { BackendModel } from './backend-ai.service';

