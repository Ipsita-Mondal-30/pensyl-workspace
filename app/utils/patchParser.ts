"use client";

export interface Patch {
  file: string;
  from: number;
  to: number;
  content: string;
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
  const lines = content.split('\n');
  const before = lines.slice(0, patch.from - 1).join('\n');
  const after = lines.slice(patch.to - 1).join('\n');
  return [before, patch.content, after].filter(Boolean).join('\n');
}

export function applyPatches(content: string, patches: Patch[]): string {
  let result = content;
  for (const patch of patches) {
    result = applyPatch(result, patch);
  }
  return result;
}
