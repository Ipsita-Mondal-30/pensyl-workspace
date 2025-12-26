"use client";
import { useEffect, useState } from "react";

export interface CursorPosition {
  line: number;
  column: number;
}



export interface StatusBarProps {
  cursorPosition?: CursorPosition;
  fileType?: string;
  lastSaved?: Date | null;
  editorMode?: "Insert" | "Overwrite";
  isAIConnected?: boolean;
}

/**
 * StatusBar - Bottom status bar component (Cursor IDE style)
 */
export function StatusBar({
  cursorPosition = { line: 1, column: 1 },
  fileType,
  lastSaved,
  editorMode = "Insert",
  isAIConnected = true,
}: StatusBarProps) {
  const [formattedSavedTime, setFormattedSavedTime] = useState<string>("");

  // Format last saved time
  useEffect(() => {
    if (lastSaved) {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 10) {
        setFormattedSavedTime("Just now");
      } else if (seconds < 60) {
        setFormattedSavedTime(`${seconds}s ago`);
      } else if (minutes < 60) {
        setFormattedSavedTime(`${minutes}m ago`);
      } else if (hours < 24) {
        setFormattedSavedTime(`${hours}h ago`);
      } else {
        setFormattedSavedTime(lastSaved.toLocaleDateString());
      }
    } else {
      setFormattedSavedTime("");
    }
  }, [lastSaved]);

  // Get file type display name
  const getFileTypeDisplay = (type?: string) => {
    if (!type) return "Plain Text";
    
    const typeMap: Record<string, string> = {
      md: "Markdown",
      markdown: "Markdown",
      txt: "Text",
      json: "JSON",
      js: "JavaScript",
      ts: "TypeScript",
      jsx: "React JSX",
      tsx: "React TSX",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      py: "Python",
      java: "Java",
      cpp: "C++",
      c: "C",
      go: "Go",
      rs: "Rust",
      php: "PHP",
      rb: "Ruby",
      swift: "Swift",
      kt: "Kotlin",
      sh: "Shell",
      yaml: "YAML",
      yml: "YAML",
      xml: "XML",
      sql: "SQL",
      vue: "Vue",
      svelte: "Svelte",
    };

    return typeMap[type.toLowerCase()] || type.toUpperCase();
  };

  return (
    <div className="h-6 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex items-center justify-between px-3 text-[11px] text-[var(--text-secondary)] shrink-0">
      {/* Left: Cursor Position */}
      <div className="flex gap-4 items-center">
        <span className="font-mono">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>

      {/* Middle: File Type */}
      <div className="flex items-center">
        {fileType && (
          <span className="px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            {getFileTypeDisplay(fileType)}
          </span>
        )}
      </div>

      {/* Right: Saved Time, Editor Mode, AI Status */}
      <div className="flex gap-3 items-center">
        {/* Last Saved Time */}
        {formattedSavedTime && (
          <span className="text-[var(--text-tertiary)]">
            Saved {formattedSavedTime}
          </span>
        )}

        {/* Editor Mode */}
        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)] font-mono text-[10px]">
          {editorMode}
        </span>

        {/* AI Status Icon */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isAIConnected
                ? "bg-green-500"
                : "bg-[var(--text-tertiary)]"
            }`}
            title={isAIConnected ? "AI Connected" : "AI Disconnected"}
          />
          <span className="text-[10px] text-[var(--text-tertiary)]">
            AI
          </span>
        </div>
      </div>
    </div>
  );
}

