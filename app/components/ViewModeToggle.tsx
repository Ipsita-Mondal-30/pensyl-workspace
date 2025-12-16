"use client";
import type { Editor } from "@tiptap/core";

export type ViewMode = "writing" | "paper" | "latex";

interface ViewModeToggleProps {
  editor: Editor | null;
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({
  editor,
  currentMode,
  onModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded p-1">
      <button
        onClick={() => onModeChange("writing")}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
          currentMode === "writing"
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
        title="Writing Mode"
      >
        ✍️ Writing
      </button>
      <button
        onClick={() => onModeChange("paper")}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
          currentMode === "paper"
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
        title="Paper Preview Mode"
      >
        📄 Paper
      </button>
      <button
        onClick={() => onModeChange("latex")}
        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
          currentMode === "latex"
            ? "bg-[var(--accent-primary)] text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        }`}
        title="LaTeX Preview Mode"
      >
        ∑ LaTeX
      </button>
    </div>
  );
}

