"use client";
import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { citationManager } from "../../lib/citationManager";
import { formatBibliography } from "../../utils/citationFormatter";
import type { ReferenceData } from "../../types/research-paper";

interface ReferencesPanelProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReferencesPanel({
  editor,
  isOpen,
  onClose,
}: ReferencesPanelProps) {
  const [style, setStyle] = useState<"apa" | "ieee" | "mla" | "acm">("apa");
  const [bibliography, setBibliography] = useState<string>("");

  useEffect(() => {
    if (editor && isOpen) {
      const html = editor.getHTML();
      const referenceData = citationManager.generateBibliography(html, style);
      const formatted = formatBibliography(referenceData);
      setBibliography(formatted);
    }
  }, [editor, isOpen, style]);

  const handleInsert = () => {
    if (!editor) return;

    const html = editor.getHTML();
    const referenceData = citationManager.generateBibliography(html, style);

    (editor.commands as any).insertReferences(referenceData.citations, style);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          References / Bibliography
        </h2>

        {/* Style Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Citation Style
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as any)}
            className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          >
            <option value="apa">APA</option>
            <option value="ieee">IEEE</option>
            <option value="mla">MLA</option>
            <option value="acm">ACM</option>
          </select>
        </div>

        {/* Bibliography Preview */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded">
            <pre className="text-sm text-[var(--text-primary)] whitespace-pre-wrap font-sans">
              {bibliography || "No citations found in document."}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            Insert References
          </button>
        </div>
      </div>
    </div>
  );
}

