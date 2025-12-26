"use client";
import { useState, useRef } from "react";
import type { Editor } from "@tiptap/core";
import type { FigureNodeAttributes } from "../../extensions/research-paper/FigureNode";

interface FigureEditorProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (figure: Partial<FigureNodeAttributes>) => void;
  existingFigure?: Partial<FigureNodeAttributes> | null;
}

export function FigureEditor({
  editor,
  isOpen,
  onClose,
  onInsert,
  existingFigure,
}: FigureEditorProps) {
  const [src, setSrc] = useState(existingFigure?.src || "");
  const [caption, setCaption] = useState(existingFigure?.caption || "");
  const [label, setLabel] = useState(existingFigure?.label || "");
  const [alt, setAlt] = useState(existingFigure?.alt || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Create a data URL for the image
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSrc(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInsert = () => {
    if (!src) {
      alert("Please provide an image source");
      return;
    }

    onInsert({
      src,
      caption,
      label,
      alt: alt || caption,
    });

    // Reset form
    setSrc("");
    setCaption("");
    setLabel("");
    setAlt("");
    onClose();
  };

  const handleCancel = () => {
    setSrc("");
    setCaption("");
    setLabel("");
    setAlt("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {existingFigure ? "Edit Figure" : "Insert Figure"}
        </h2>

        <div className="space-y-4">
          {/* Image Source */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Image Source
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                placeholder="URL or data URL"
                className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
              >
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview */}
          {src && (
            <div className="border border-[var(--border-primary)] rounded p-2">
              <img
                src={src}
                alt="Preview"
                className="max-w-full h-auto max-h-48 mx-auto"
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Figure caption"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
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
              placeholder="fig:example"
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Alt Text (accessibility)
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Alternative text for screen readers"
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
            onClick={handleInsert}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity"
          >
            {existingFigure ? "Update" : "Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}
