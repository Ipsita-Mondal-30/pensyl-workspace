"use client";
import { GoogleGenAI } from "@google/genai";

// Gemini API Key - Read from environment variables
// Set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file
const API_KEY = (typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_GEMINI_API_KEY || "") : "");

if (!API_KEY) {
  console.warn(
    "⚠️ NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables.\n" +
    "Please create a .env.local file in the project root with:\n" +
    "NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here"
  );
}

// Available Gemini models (updated to match actual available models)
export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fast and efficient (recommended)" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Most capable model" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast model" },
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Experimental)", description: "Experimental flash model" },
  { id: "gemini-pro-latest", name: "Gemini Pro (Latest)", description: "Latest pro model" },
  { id: "gemini-flash-latest", name: "Gemini Flash (Latest)", description: "Latest flash model" },
];

export type GeminiModel = typeof GEMINI_MODELS[number]["id"];

// Initialize Gemini AI
// Only initialize if API key is available
let ai: GoogleGenAI | null = null;

function getAIInstance(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      "Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file."
    );
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}

export interface AvailableModel {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  category: 'flash' | 'pro' | 'experimental' | 'embedding' | 'other';
  costTier: number; // 1 = cheapest, 2 = medium, 3 = expensive, 4 = most expensive
}

/**
 * List available models from the API with metadata
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    // Try v1beta first
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    if (!response.ok) {
      // Try v1 if v1beta fails
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
      );
    }
    
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.models && Array.isArray(data.models)) {
      const modelNames = data.models
        .map((m: any) => {
          // Extract model name - could be in name field or just the model ID
          const name = m.name?.replace('models/', '') || m.name || '';
          return name;
        })
        .filter((name: string) => name && (name.includes('gemini') || name.includes('models/')));
      
      return modelNames;
    }
    
    return [];
  } catch (error) {
    console.error('Error listing models:', error);
    return [];
  }
}

/**
 * Get available models with formatted metadata for UI
 * Filters duplicates and sorts by cost (cheapest first)
 */
export async function getAvailableModelsForUI(): Promise<AvailableModel[]> {
  try {
    const modelIds = await listAvailableModels();
    
    const modelMap = new Map<string, AvailableModel>();
    
    modelIds
      .filter(id => !id.includes('embedding') && !id.includes('image-generation') && !id.includes('tts') && !id.includes('robotics') && !id.includes('computer-use'))
      .forEach(id => {
        // Categorize and format model names
        let category: AvailableModel['category'] = 'other';
        let displayName = id;
        let description = '';
        let costTier = 3; // Default to medium cost
        let shouldInclude = false;
        
        // Prioritize newer versions and filter out duplicates
        if (id.includes('2.5-flash') && !id.includes('lite') && !id.includes('preview') && !id.includes('image')) {
          category = 'flash';
          displayName = 'Gemini 2.5 Flash';
          description = 'Fast and efficient (recommended)';
          costTier = 1; // Cheapest
          shouldInclude = true;
        } else if (id.includes('2.5-pro') && !id.includes('preview') && !id.includes('tts')) {
          category = 'pro';
          displayName = 'Gemini 2.5 Pro';
          description = 'Most capable model for complex tasks';
          costTier = 4; // Most expensive
          shouldInclude = true;
        } else if (id.includes('2.0-flash') && !id.includes('exp') && !id.includes('lite') && !id.includes('preview')) {
          category = 'flash';
          displayName = 'Gemini 2.0 Flash';
          description = 'Fast model';
          costTier = 1; // Cheapest
          shouldInclude = true;
        } else if (id.includes('2.0-pro') && !id.includes('exp') && !id.includes('preview')) {
          category = 'pro';
          displayName = 'Gemini 2.0 Pro';
          description = 'Advanced capabilities';
          costTier = 3; // Expensive
          shouldInclude = true;
        } else if (id.includes('flash-latest') && !id.includes('lite')) {
          category = 'flash';
          displayName = 'Gemini Flash (Latest)';
          description = 'Latest flash model';
          costTier = 1; // Cheapest
          shouldInclude = true;
        } else if (id.includes('pro-latest')) {
          category = 'pro';
          displayName = 'Gemini Pro (Latest)';
          description = 'Latest pro model';
          costTier = 3; // Expensive
          shouldInclude = true;
        } else if (id.includes('2.0-flash-exp') && !id.includes('image')) {
          category = 'experimental';
          displayName = 'Gemini 2.0 Flash (Experimental)';
          description = 'Experimental features';
          costTier = 2; // Medium
          shouldInclude = true;
        } else if (id.includes('2.0-pro-exp')) {
          category = 'experimental';
          displayName = 'Gemini 2.0 Pro (Experimental)';
          description = 'Experimental pro model';
          costTier = 3; // Expensive
          shouldInclude = true;
        } else if (id.includes('3-pro') && !id.includes('image')) {
          category = 'pro';
          displayName = 'Gemini 3 Pro';
          description = 'Next generation pro model';
          costTier = 4; // Most expensive
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Only add if we don't already have a model with this display name
          if (!modelMap.has(displayName)) {
            modelMap.set(displayName, {
              id,
              name: displayName,
              description,
              category,
              costTier,
            });
          }
        }
      });
    
    const models = Array.from(modelMap.values()).sort((a, b) => {
      // Sort by cost tier first (cheapest to costlier)
      if (a.costTier !== b.costTier) {
        return a.costTier - b.costTier;
      }
      // Then by category
      const categoryOrder: Record<AvailableModel['category'], number> = { 
        flash: 0, 
        pro: 1, 
        experimental: 2, 
        other: 3,
        embedding: 4 
      };
      const aOrder = categoryOrder[a.category] ?? 5;
      const bOrder = categoryOrder[b.category] ?? 5;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      // Finally by name
      return a.name.localeCompare(b.name);
    });
    
    return models;
  } catch (error) {
    console.error('Error getting models for UI:', error);
    return [];
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a message to Gemini API and get response
 */
export async function sendMessageToGemini(
  messages: ChatMessage[],
  model: GeminiModel = "gemini-2.5-flash"
): Promise<string> {
  try {
    // Get the last message (user's current message)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      throw new Error("Last message must be from user");
    }

    // Build contents array for the new API
    const contents = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Use the new API format
    const response = await getAIInstance().models.generateContent({
      model,
      contents,
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(
      error?.message || "Failed to get response from Gemini API"
    );
  }
}

/**
 * Stream a message to Gemini API and get streaming response
 */
// Cache for available models
let availableModelsCache: string[] | null = null;

export async function* streamMessageToGemini(
  messages: ChatMessage[],
  requestedModel: GeminiModel = "gemini-2.5-flash"
): AsyncGenerator<string, void, unknown> {
  // Get available models if not cached
  if (!availableModelsCache) {
    availableModelsCache = await listAvailableModels();
    if (availableModelsCache.length > 0) {
      console.log('Using available models from API:', availableModelsCache);
    }
  }

  // Get the last message (user's current message)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from user");
  }

  // Build contents array for the new API
  const contents = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  // Try the requested model first, then fallback to available models
  const modelsToTry = availableModelsCache && availableModelsCache.length > 0
    ? [requestedModel, ...availableModelsCache.slice(0, 3).filter(m => m !== requestedModel)]
    : [requestedModel, "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

  let lastError: any = null;

  for (const modelToTry of modelsToTry) {
    try {
      // Use the new streaming API - try different method names
      let stream: any;
      
      // Try streamGenerateContent first
      const aiInstance = getAIInstance();
      if (typeof (aiInstance.models as any).streamGenerateContent === 'function') {
        stream = await (aiInstance.models as any).streamGenerateContent({
          model: modelToTry,
          contents,
        });
      } else if (typeof (aiInstance.models as any).generateContentStream === 'function') {
        stream = await (aiInstance.models as any).generateContentStream({
          model: modelToTry,
          contents,
        });
      } else {
        // Fallback: use generateContent with stream option
        stream = await (aiInstance.models as any).generateContent({
          model: modelToTry,
          contents,
          stream: true,
        });
      }

      // Stream the response
      for await (const chunk of stream) {
        const text = chunk.text || (chunk as any).text();
        if (text) {
          yield text;
        }
      }
      
      // Success - return early
      console.log(`✅ Successfully used model: ${modelToTry}`);
      return;
    } catch (error: any) {
      console.warn(`Model ${modelToTry} failed, trying next...`, error);
      lastError = error;
      // Continue to next model
      continue;
    }
  }

  // All SDK models failed - try direct REST API as last resort
  console.warn("All SDK models failed, trying direct REST API with available models...");
  
  // Use available models from cache, or try common ones
  const restModelsToTry = availableModelsCache && availableModelsCache.length > 0
    ? availableModelsCache.slice(0, 3)
    : ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
  
  for (const restModel of restModelsToTry) {
    try {
      // Try direct REST API call with v1 endpoint
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== "user") {
        throw new Error("Last message must be from user");
      }

      // Build history for REST API
      let historyMessages = messages
        .slice(0, -1)
        .filter((msg) => msg.content.trim().length > 0);
      
      while (historyMessages.length > 0 && historyMessages[0].role === "assistant") {
        historyMessages = historyMessages.slice(1);
      }

      const contents = [
        ...historyMessages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        {
          role: "user",
          parts: [{ text: lastMessage.content }],
        },
      ];

      // Clean model name (remove 'models/' prefix if present)
      const cleanModel = restModel.replace('models/', '');
      
      // Try with v1 endpoint first, then v1beta
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1/models/${cleanModel}:streamGenerateContent?alt=sse&key=${API_KEY}`,
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:streamGenerateContent?alt=sse&key=${API_KEY}`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ contents }),
          });

          if (!response.ok) {
            console.warn(`REST API failed for ${endpoint}: ${response.status}`);
            continue; // Try next endpoint
          }

          // Stream the response
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error("No response body");
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    yield text;
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          console.log(`✅ Successfully used REST API with model: ${cleanModel}`);
          return; // Success
        } catch (endpointError: any) {
          console.warn(`Endpoint ${endpoint} failed:`, endpointError);
          continue; // Try next endpoint
        }
      }
    } catch (restError: any) {
      console.warn(`REST API failed for model ${restModel}:`, restError);
      continue; // Try next model
    }
  }
  
  console.error("REST API failed for all models");

  // All methods failed
  console.error("All model variations and REST API failed. Last error:", lastError);
  
  // Provide more detailed error messages
  let errorMessage = "Failed to stream response from Gemini API. ";
  if (lastError?.message) {
    errorMessage += lastError.message;
  } else if (lastError?.status) {
    errorMessage += `API Error ${lastError.status}: ${lastError.statusText || "Unknown error"}`;
  } else {
    errorMessage += "Please check your API key and model availability.";
  }
  
  throw new Error(errorMessage);
}

