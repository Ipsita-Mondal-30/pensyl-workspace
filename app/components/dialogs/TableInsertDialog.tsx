"use client";
import { useState } from "react";

interface TableInsertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (options: { rows: number; cols: number; withHeaderRow: boolean; caption?: string; label?: string }) => void;
}

export function TableInsertDialog({
  isOpen,
  onClose,
  onInsert,
}: TableInsertDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [withHeaderRow, setWithHeaderRow] = useState(true);
  const [caption, setCaption] = useState("");
  const [label, setLabel] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onInsert({ rows, cols, withHeaderRow, caption: caption || undefined, label: label || undefined });
    setRows(3);
    setCols(3);
    setWithHeaderRow(true);
    setCaption("");
    setLabel("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Insert Table</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Rows</label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Columns</label>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={withHeaderRow}
              onChange={(e) => setWithHeaderRow(e.target.checked)}
              id="header-row"
              className="w-4 h-4"
            />
            <label htmlFor="header-row" className="text-sm text-[var(--text-secondary)]">Header Row</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Table caption"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Label (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="tab:example"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

