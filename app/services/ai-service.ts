"use client";

/**
 * Unified AI Service
 * 
 * Now uses Backend AI API (OpenRouter models via backend)
 * Falls back to Gemini Direct API if backend is unavailable
 */

import { streamMessageToGemini, type ChatMessage as GeminiChatMessage } from './gemini';
import { streamAI, type BackendModel } from './backend-ai.service';
import { aiOrchestrationClient } from '../lib/ai-orchestration-client';

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
 * Detect if this is a document editing request
 */
function isDocumentEditRequest(userMessage: string, context?: string): boolean {
  const messageLower = userMessage.toLowerCase();
  const contextLower = context?.toLowerCase() || '';
  
  // Check if message contains document editing keywords
  const editKeywords = [
    'add', 'insert', 'update', 'fix', 'complete', 'fill in', 'fill in the',
    'delete', 'remove', 'edit', 'modify', 'change', 'append', 'conclusion',
    'section', 'paragraph', 'content'
  ];
  const hasEditKeyword = editKeywords.some(keyword => messageLower.includes(keyword));
  
  // Check if context contains line-numbered document (format: "  1: content" or "100: content")
  // Look for pattern like "  1:" or "100:" (right-aligned numbers followed by colon and space)
  const hasLineNumbers = /\d+:\s/.test(contextLower);
  
  // If we have edit keywords and context appears to be a document (has "Current file:" or line numbers)
  const hasDocumentContext = contextLower.includes('current file:') || hasLineNumbers;
  
  return hasEditKeyword && hasDocumentContext;
}

/**
 * Stream a message using the backend AI API (OpenRouter models)
 * Uses orchestration for document editing requests, direct execute for others
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

  // Check if this is a document editing request
  // The document context is in lastMessage.content (formatted with line numbers by useAIChat)
  // So we check the full message content for document editing indicators
  // Pass the same content as both message and context since it contains everything
  const useOrchestration = isDocumentEditRequest(lastMessage.content, lastMessage.content);
  
  console.log('[AIService] Document edit detection:', {
    userMessage: lastMessage.content.substring(0, 100),
    hasContext: !!(context || options.context),
    contextPreview: (context || options.context || '').substring(0, 200),
    fullMessagePreview: lastMessage.content.substring(0, 300),
    useOrchestration,
    messageLength: lastMessage.content.length,
    hasLineNumbers: /\d+:\s/.test(lastMessage.content.toLowerCase()),
    hasCurrentFile: lastMessage.content.toLowerCase().includes('current file:'),
    editKeywordsFound: ['add', 'conclusion', 'insert'].filter(kw => lastMessage.content.toLowerCase().includes(kw)),
  });

  try {
    if (useOrchestration) {
      // Use orchestration endpoint for document editing
      console.log('[AIService] ✅ ORCHESTRATION WILL BE USED for document editing');
      console.log('[AIService] Sending to orchestration:', {
        prompt: lastMessage.content,
        contextLength: (context || options.context || '').length,
      });
      
      // Extract blocks from metadata (sent from useAIChat)
      const blocks = options.metadata?.blocks as Array<{
        lineNumber: number;
        type: string;
        text: string;
        position: number;
        endPosition: number;
        isEmpty: boolean;
      }> | undefined;
      
      console.log('[AIService] Sending to orchestration with blocks:', {
        hasBlocks: !!blocks,
        blockCount: blocks?.length || 0,
        blocksPreview: blocks?.slice(0, 3).map((b: any) => ({
          lineNumber: b.lineNumber,
          type: b.type,
          textPreview: b.text?.substring(0, 50),
        })),
      });
      
      const response = await aiOrchestrationClient.orchestrate({
        prompt: lastMessage.content,
        context: context || options.context,
        metadata: {
          ...options.metadata,
          blocks: blocks, // CRITICAL: Pass blocks for accurate section resolution
          messageHistory: contextMessages.length,
          selectedModelId: options.selectedModelId,
        },
      });

      console.log('[AIService] ✅ Orchestration response received:', {
        intent: response.intent,
        agents: response.agents,
        outputLength: response.output?.length || 0,
        outputPreview: response.output?.substring(0, 500),
        errors: response.errors,
        metadata: response.metadata,
      });

      // Yield the output (orchestration returns complete response, not streamed)
      // But we'll simulate streaming by chunking it
      const output = response.output || '';
      const chunkSize = 50; // Characters per chunk for simulated streaming
      for (let i = 0; i < output.length; i += chunkSize) {
        yield output.substring(i, i + chunkSize);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log('✅ Backend Orchestration Response completed');
    } else {
      // Use direct execute API for regular requests
      console.log('[AIService] ⚠️ USING DIRECT EXECUTE (orchestration NOT triggered - patches will NOT be generated)');
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
    }

  } catch (error: any) {
    console.error('[AIService] Backend AI API error:', error);
    
    // If orchestration failed for document editing, don't fall back to direct execute
    // because direct execute won't generate patches - it will just echo the document
    if (useOrchestration) {
      console.error('[AIService] Orchestration failed for document editing request. Cannot fall back to direct execute as it won\'t generate patches.');
      throw new Error(
        `Document editing failed: ${error?.message || 'Orchestration endpoint unavailable'}. Please ensure the backend server is running at ${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}`
      );
    }
    
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

