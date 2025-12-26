"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/core";

interface TableEditorProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  onSetCaption: (caption: string, number?: number, label?: string) => void;
  existingCaption?: string | null;
  existingNumber?: number | null;
  existingLabel?: string | null;
}

export function TableEditor({
  editor,
  isOpen,
  onClose,
  onSetCaption,
  existingCaption,
  existingNumber,
  existingLabel,
}: TableEditorProps) {
  const [caption, setCaption] = useState(existingCaption || "");
  const [label, setLabel] = useState(existingLabel || "");

  if (!isOpen) return null;

  const handleSetCaption = () => {
    onSetCaption(caption, existingNumber || undefined, label || undefined);
    setCaption("");
    setLabel("");
    onClose();
  };

  const handleCancel = () => {
    setCaption("");
    setLabel("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {existingCaption ? "Edit Table Caption" : "Add Table Caption"}
        </h2>

        <div className="space-y-4">
          {/* Table Number Display */}
          {existingNumber && (
            <div className="text-sm text-[var(--text-secondary)]">
              Table {existingNumber}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Table caption"
              rows={3}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Label (for cross-referencing)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="tab:example"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSetCaption}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            {existingCaption ? "Update" : "Add Caption"}
          </button>
        </div>
      </div>
    </div>
  );
}
