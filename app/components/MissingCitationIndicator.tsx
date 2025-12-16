"use client";
import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";

interface MissingCitationIndicatorProps {
  editor: Editor | null;
}

/**
 * Component that identifies potentially uncited claims
 * This is a simplified version - in production, you'd use NLP to detect claims
 */
export function MissingCitationIndicator({ editor }: MissingCitationIndicatorProps) {
  const [uncitedClaims, setUncitedClaims] = useState<string[]>([]);

  useEffect(() => {
    if (!editor) {
      setUncitedClaims([]);
      return;
    }

    const { state } = editor.view;
    const { doc } = state;
    const claims: string[] = [];

    // Simple heuristic: look for sentences with claim words that don't have citations
    const claimKeywords = [
      "shows",
      "demonstrates",
      "proves",
      "indicates",
      "suggests",
      "reveals",
      "found",
      "discovered",
      "established",
    ];

    doc.descendants((node: any, pos: number) => {
      if (node.isText) {
        const text = node.text || "";
        const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);

        sentences.forEach((sentence: string) => {
          const hasClaimKeyword = claimKeywords.some((keyword) =>
            sentence.toLowerCase().includes(keyword)
          );

          if (hasClaimKeyword) {
            // Check if this sentence has a citation
            let hasCitation = false;
            if (node.marks) {
              hasCitation = node.marks.some((mark: any) => mark.type.name === "citation");
            }

            if (!hasCitation && sentence.trim().length > 20) {
              claims.push(sentence.trim().substring(0, 100));
            }
          }
        });
      }
      return true;
    });

    setUncitedClaims(claims.slice(0, 10)); // Limit to 10
  }, [editor]);

  if (uncitedClaims.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black p-3 rounded-lg shadow-lg max-w-sm z-50">
      <div className="font-semibold text-sm mb-2">
        ⚠️ Potential Missing Citations ({uncitedClaims.length})
      </div>
      <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
        {uncitedClaims.map((claim, index) => (
          <div key={index} className="border-b border-yellow-600 pb-1">
            "{claim}..."
          </div>
        ))}
      </div>
    </div>
  );
}

