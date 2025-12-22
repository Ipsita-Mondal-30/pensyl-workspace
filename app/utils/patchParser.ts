"use client";

export interface Patch {
  file: string;
  type?: "insert" | "replace" | "delete";
  line?: number;
  from?: number;
  to?: number;
  target?: {
    startLine: number;
    endLine: number;
  };
  content?: string;
  replacement?: string;
}

export function parseAIResponse(response: string, fileName?: string): {
  hasPatches: boolean;
  patches: Patch[];
  textContent: string;
} {
  try {
    // Try to extract JSON patches from the response
    // Format 1: JSON code block at the end
    const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1]);
        
        // Check if it's an object with patches property
        if (parsed.patches && Array.isArray(parsed.patches)) {
          // Extract explanation (text before the JSON block)
          const explanation = response.substring(0, jsonBlockMatch.index).trim();
          
          // Convert backend patch format to frontend Patch format
          const patches: Patch[] = parsed.patches.map((p: any) => ({
            type: p.type || 'replace',
            target: p.target || { startLine: 1, endLine: 1 },
            content: p.content || '',
            file: fileName || '',
          }));

          return {
            hasPatches: patches.length > 0,
            patches,
            textContent: explanation || parsed.explanation || response,
          };
        }
        
        // Check if it's a direct array of patches
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
          // Extract explanation (text before the JSON block)
          const explanation = response.substring(0, jsonBlockMatch.index).trim();
          
          // Convert backend patch format to frontend Patch format
          const patches: Patch[] = parsed.map((p: any) => ({
            type: p.type || 'replace',
            target: p.target || { startLine: 1, endLine: 1 },
            content: p.content || '',
            file: fileName || '',
          }));

          console.log('[parseAIResponse] Found patches array directly:', patches);
          
          return {
            hasPatches: patches.length > 0,
            patches,
            textContent: explanation || 'Document edits completed',
          };
        }
      } catch (e) {
        console.warn('[parseAIResponse] Failed to parse JSON block:', e);
      }
    }

    // Format 2: Pure JSON response (if using structured output)
    try {
      const parsed = JSON.parse(response);
      if (parsed.patches && Array.isArray(parsed.patches)) {
        const patches: Patch[] = parsed.patches.map((p: any) => ({
          type: p.type || 'replace',
          target: p.target || { startLine: 1, endLine: 1 },
          content: p.content || '',
          file: fileName || '',
        }));

        return {
          hasPatches: patches.length > 0,
          patches,
          textContent: parsed.explanation || 'Document edits completed',
        };
      }
    } catch (e) {
      // Not valid JSON, continue to fallback
    }

    // Format 3: Try to find JSON object anywhere in the response
    const jsonObjectMatch = response.match(/\{[\s\S]*"patches"[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0]);
        if (parsed.patches && Array.isArray(parsed.patches)) {
          const patches: Patch[] = parsed.patches.map((p: any) => ({
            type: p.type || 'replace',
            target: p.target || { startLine: 1, endLine: 1 },
            content: p.content || '',
            file: fileName || '',
          }));

          // Extract explanation (text before/after the JSON)
          const explanation = response.replace(jsonObjectMatch[0], '').trim();

          return {
            hasPatches: patches.length > 0,
            patches,
            textContent: explanation || parsed.explanation || 'Document edits completed',
          };
        }
      } catch (e) {
        console.warn('[parseAIResponse] Failed to parse JSON object:', e);
      }
    }

    // Fallback: no patches found, return raw response
    return {
      hasPatches: false,
      patches: [],
      textContent: response,
    };
  } catch (error) {
    console.error('[parseAIResponse] Error parsing response:', error);
    return {
      hasPatches: false,
      patches: [],
      textContent: response,
    };
  }
}

export function applyPatch(content: string, patch: Patch): string {
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Handle new format with type and target (preferred)
  if (patch.target && patch.type) {
    const { startLine, endLine } = patch.target;

    // Validate line numbers
    if (startLine < 1 || endLine < 1 || startLine > totalLines + 1 || endLine > totalLines + 1) {
      console.warn(`[applyPatch] Invalid line numbers: startLine=${startLine}, endLine=${endLine}, totalLines=${totalLines}`);
      return content; // Return unchanged on invalid line numbers
    }

    switch (patch.type) {
      case "delete":
        // Delete lines from startLine to endLine (inclusive)
        const beforeDelete = lines.slice(0, startLine - 1);
        const afterDelete = lines.slice(endLine);
        return [...beforeDelete, ...afterDelete].join('\n');

      case "replace":
        // Replace lines from startLine to endLine (inclusive) with new content
        if (!patch.content) {
          console.warn('[applyPatch] Replace operation requires content');
          return content;
        }
        const beforeReplace = lines.slice(0, startLine - 1);
        const afterReplace = lines.slice(endLine);
        const replacementLines = patch.content.split('\n');
        return [...beforeReplace, ...replacementLines, ...afterReplace].join('\n');

      case "insert":
        // Insert content at startLine (startLine and endLine should be equal for insert)
        if (!patch.content) {
          console.warn('[applyPatch] Insert operation requires content');
          return content;
        }
        const insertLine = startLine;
        const beforeInsert = lines.slice(0, insertLine - 1);
        const afterInsert = lines.slice(insertLine - 1);
        const insertLines = patch.content.split('\n');
        return [...beforeInsert, ...insertLines, ...afterInsert].join('\n');

      default:
        console.warn(`[applyPatch] Unknown patch type: ${patch.type}`);
        return content;
    }
  }

  // Handle old format with line number (backward compatibility)
  if (patch.type === "insert" && typeof patch.line === 'number' && patch.content) {
    if (patch.line < 1 || patch.line > totalLines + 1) {
      console.warn(`[applyPatch] Invalid line number: ${patch.line}, totalLines=${totalLines}`);
      return content;
    }
    const beforeInsert = lines.slice(0, patch.line - 1);
    const afterInsert = lines.slice(patch.line - 1);
    const insertLines = patch.content.split('\n');
    return [...beforeInsert, ...insertLines, ...afterInsert].join('\n');
  }

  // Handle old format with from/to (backward compatibility)
  if (typeof patch.from === 'number' && typeof patch.to === 'number' && patch.content) {
    if (patch.from < 1 || patch.to < 1 || patch.from > totalLines || patch.to > totalLines) {
      console.warn(`[applyPatch] Invalid line numbers: from=${patch.from}, to=${patch.to}, totalLines=${totalLines}`);
      return content;
    }
    const before = lines.slice(0, patch.from - 1);
    const after = lines.slice(patch.to);
    const replacementLines = patch.content.split('\n');
    return [...before, ...replacementLines, ...after].join('\n');
  }

  // Fallback: just append content
  if (patch.content) {
    return content + '\n' + patch.content;
  }

  return content;
}

export function applyPatches(content: string, patches: Patch[]): string {
  let result = content;
  for (const patch of patches) {
    result = applyPatch(result, patch);
  }
  return result;
}
