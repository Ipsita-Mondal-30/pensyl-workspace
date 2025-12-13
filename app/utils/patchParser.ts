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

export function parseAIResponse(response: string): {
  hasPatches: boolean;
  patches: Patch[];
  textContent: string;
} {
  // Simplified parser - just return the text for now
  return {
    hasPatches: false,
    patches: [],
    textContent: response,
  };
}

export function applyPatch(content: string, patch: Patch): string {
  // Handle new format with type and target
  if (patch.type === "delete" && patch.target) {
    const lines = content.split('\n');
    const before = lines.slice(0, patch.target.startLine - 1).join('\n');
    const after = lines.slice(patch.target.endLine).join('\n');
    return [before, after].filter(Boolean).join('\n');
  } else if (patch.type === "replace" && patch.target && patch.content) {
    const lines = content.split('\n');
    const before = lines.slice(0, patch.target.startLine - 1).join('\n');
    const after = lines.slice(patch.target.endLine).join('\n');
    return [before, patch.content, after].filter(Boolean).join('\n');
  } else if (patch.type === "insert" && typeof patch.line === 'number' && patch.content) {
    const lines = content.split('\n');
    lines.splice(patch.line - 1, 0, patch.content);
    return lines.join('\n');
  } 
  // Handle old format with from/to (for backward compatibility)
  else if (typeof patch.from === 'number' && typeof patch.to === 'number' && patch.content) {
    const lines = content.split('\n');
    const before = lines.slice(0, patch.from - 1).join('\n');
    const after = lines.slice(patch.to - 1).join('\n');
    return [before, patch.content, after].filter(Boolean).join('\n');
  }
  // Fallback: just append content
  return content + (patch.content || '');
}

export function applyPatches(content: string, patches: Patch[]): string {
  let result = content;
  for (const patch of patches) {
    result = applyPatch(result, patch);
  }
  return result;
}
