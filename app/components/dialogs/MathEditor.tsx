"use client";
import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { renderMath, isValidLatex } from "../../utils/mathRenderer";

interface MathEditorProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string, isBlock: boolean) => void;
  existingLatex?: string | null;
  isBlock?: boolean;
}

export function MathEditor({
  editor,
  isOpen,
  onClose,
  onInsert,
  existingLatex,
  isBlock = false,
}: MathEditorProps) {
  const [latex, setLatex] = useState(existingLatex || "");
  const [preview, setPreview] = useState("");
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (latex.trim()) {
      const valid = isValidLatex(latex);
      setIsValid(valid);
      if (valid) {
        try {
          const rendered = renderMath(latex, isBlock);
          setPreview(rendered);
        } catch (error) {
          setPreview("");
          setIsValid(false);
        }
      } else {
        setPreview("");
      }
    } else {
      setPreview("");
      setIsValid(true);
    }
  }, [latex, isBlock]);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (!latex.trim()) {
      alert("Please enter LaTeX code");
      return;
    }

    if (!isValid) {
      alert("Invalid LaTeX syntax. Please check your input.");
      return;
    }

    onInsert(latex, isBlock);
    setLatex("");
    setPreview("");
    onClose();
  };

  const handleCancel = () => {
    setLatex("");
    setPreview("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {existingLatex ? "Edit Equation" : isBlock ? "Insert Block Equation" : "Insert Inline Math"}
        </h2>

        <div className="space-y-4">
          {/* LaTeX Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              LaTeX Code
            </label>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder={isBlock ? "E = mc^2" : "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"}
              rows={isBlock ? 4 : 2}
              className={`w-full px-3 py-2 bg-[var(--bg-primary)] border ${
                isValid ? "border-[var(--border-primary)]" : "border-red-500"
              } rounded text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none`}
            />
            {!isValid && latex.trim() && (
              <p className="text-xs text-red-500 mt-1">Invalid LaTeX syntax</p>
            )}
          </div>

          {/* Preview */}
          {preview && isValid && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Preview
              </label>
              <div
                className="border border-[var(--border-primary)] rounded p-4 bg-[var(--bg-primary)] min-h-[60px] flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}

          {/* Examples */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Examples
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setLatex("E = mc^2")}
                className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-hover)] text-left"
              >
                E = mc²
              </button>
              <button
                onClick={() => setLatex("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}")}
                className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-hover)] text-left"
              >
                Quadratic Formula
              </button>
              <button
                onClick={() => setLatex("\\int_{a}^{b} f(x) dx")}
                className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-hover)] text-left"
              >
                Integral
              </button>
              <button
                onClick={() => setLatex("\\sum_{i=1}^{n} x_i")}
                className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded hover:bg-[var(--bg-hover)] text-left"
              >
                Summation
              </button>
            </div>
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
            disabled={!isValid || !latex.trim()}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {existingLatex ? "Update" : "Insert"}
          </button>
        </div>
      </div>
    </div>
  );
}

