"use client";
import { useState } from "react";

interface DiffLine {
  lineNumber?: number;
  type: "unchanged" | "added" | "removed" | "context";
  content: string;
}

interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  fileName?: string;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
  startLine?: number;
  endLine?: number;
}

/**
 * DiffViewer - Shows side-by-side or unified diff view
 * Displays changes with add/remove highlighting like Cursor IDE
 */
export function DiffViewer({
  originalContent,
  modifiedContent,
  fileName,
  onAccept,
  onReject,
  showActions = true,
  startLine = 1,
  endLine,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");

  // Generate diff lines
  const diffLines = generateDiff(originalContent, modifiedContent, startLine);

  return (
    <div className="diff-viewer border-2 border-[var(--border-primary)] rounded-xl overflow-hidden bg-[var(--bg-secondary)] shadow-lg">
      {/* Header - Two rows for better layout */}
      <div className="diff-header bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b-2 border-[var(--border-primary)]">
        {/* Row 1: File info and actions */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)]/50">
          <div className="flex flex-1 gap-2 items-center min-w-0">
            {fileName && (
              <>
                <span className="text-lg">📄</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {fileName}
                </span>
              </>
            )}
            {startLine && endLine && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-full whitespace-nowrap">
                Lines {startLine}-{endLine}
              </span>
            )}
          </div>

          {/* Actions - Always visible */}
          {showActions && (
            <div className="flex flex-shrink-0 gap-2 items-center ml-4">
              <button
                onClick={onReject}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg transition-all whitespace-nowrap"
              >
                ✕ Reject
              </button>
              <button
                onClick={onAccept}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap"
              >
                ✓ Accept
              </button>
            </div>
          )}
        </div>

        {/* Row 2: View mode toggle */}
        <div className="flex justify-center items-center px-4 py-2">
          <div className="flex items-center gap-1 bg-[var(--bg-primary)] rounded-lg p-1 border border-[var(--border-primary)]">
            <button
              onClick={() => setViewMode("unified")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "unified"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              📝 Unified
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === "split"
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              📊 Split
            </button>
          </div>
        </div>
      </div>

      {/* Diff Content */}
      <div className="diff-content overflow-auto max-h-[500px] bg-[var(--bg-primary)]">
        {viewMode === "unified" ? (
          <UnifiedDiffView lines={diffLines} />
        ) : (
          <SplitDiffView
            originalContent={originalContent}
            modifiedContent={modifiedContent}
            startLine={startLine}
          />
        )}
      </div>

      {/* Footer with quick stats */}
      <div className="diff-footer px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] text-xs text-[var(--text-tertiary)] flex items-center gap-3">
        <span className="flex gap-1 items-center">
          <span className="font-semibold text-green-600">
            +{diffLines.filter((l) => l.type === "added").length}
          </span>
          <span>additions</span>
        </span>
        <span className="text-[var(--border-primary)]">•</span>
        <span className="flex gap-1 items-center">
          <span className="font-semibold text-red-600">
            -{diffLines.filter((l) => l.type === "removed").length}
          </span>
          <span>deletions</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Unified diff view (like git diff)
 */
function UnifiedDiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs leading-relaxed unified-diff">
      {lines.map((line, index) => (
        <div
          key={index}
          className={`diff-line flex border-l-4 ${
            line.type === "added"
              ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400"
              : line.type === "removed"
              ? "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400"
              : "border-transparent text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          } transition-colors`}
        >
          <div className="line-number w-14 flex-shrink-0 px-3 py-2 text-right text-[var(--text-tertiary)] select-none font-medium bg-[var(--bg-primary)]/50">
            {line.lineNumber || ""}
          </div>
          <div
            className={`line-marker w-8 flex-shrink-0 px-2 py-2 font-bold select-none text-center ${
              line.type === "added"
                ? "text-green-600"
                : line.type === "removed"
                ? "text-red-600"
                : "text-[var(--text-tertiary)]"
            }`}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : ""}
          </div>
          <div className="overflow-x-auto flex-1 px-3 py-2 whitespace-pre line-content">
            {line.content || " "}
          </div>
        </div>
      ))}
    </div>
  );
}



/**
 * Split diff view (side-by-side)
 */
function SplitDiffView({
  originalContent,
  modifiedContent,
  startLine,
}: {
  originalContent: string;
  modifiedContent: string;
  startLine: number;
}) {
  const originalLines = originalContent.split("\n");
  const modifiedLines = modifiedContent.split("\n");
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  return (
    <div className="grid grid-cols-2 gap-0 font-mono text-xs leading-relaxed split-diff">
      {/* Original (left) */}
      <div className="original border-r-2 border-[var(--border-primary)]">
        <div className="flex gap-2 items-center px-4 py-2 text-xs font-semibold text-red-700 border-b-2 border-red-300 header bg-red-500/20 dark:text-red-400 dark:border-red-900">
          <span className="text-base">−</span>
          <span>Original</span>
        </div>
        {originalLines.map((line, index) => (
          <div
            key={index}
            className="flex border-l-4 border-red-400 transition-colors diff-line bg-red-500/5 hover:bg-red-500/15"
          >
            <div className="line-number w-14 flex-shrink-0 px-3 py-2 text-right text-[var(--text-tertiary)] select-none font-medium bg-[var(--bg-primary)]/30">
              {startLine + index}
            </div>
            <div className="overflow-x-auto flex-1 px-3 py-2 text-red-800 whitespace-pre line-content dark:text-red-300">
              {line || " "}
            </div>
          </div>
        ))}
      </div>

      {/* Modified (right) */}
      <div className="modified">
        <div className="flex gap-2 items-center px-4 py-2 text-xs font-semibold text-green-700 border-b-2 border-green-300 header bg-green-500/20 dark:text-green-400 dark:border-green-900">
          <span className="text-base">+</span>
          <span>Modified</span>
        </div>
        {modifiedLines.map((line, index) => (
          <div
            key={index}
            className="flex border-l-4 border-green-400 transition-colors diff-line bg-green-500/5 hover:bg-green-500/15"
          >
            <div className="line-number w-14 flex-shrink-0 px-3 py-2 text-right text-[var(--text-tertiary)] select-none font-medium bg-[var(--bg-primary)]/30">
              {startLine + index}
            </div>
            <div className="overflow-x-auto flex-1 px-3 py-2 text-green-800 whitespace-pre line-content dark:text-green-300">
              {line || " "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Generate unified diff lines
 */
function generateDiff(
  original: string,
  modified: string,
  startLine: number = 1
): DiffLine[] {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");
  const diffLines: DiffLine[] = [];

  // Simple line-by-line diff (can be enhanced with proper diff algorithm)
  const maxLength = Math.max(originalLines.length, modifiedLines.length);

  let lineNumber = startLine;

  for (let i = 0; i < maxLength; i++) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[i];

    if (origLine === modLine) {
      // Unchanged line
      diffLines.push({
        lineNumber: lineNumber++,
        type: "unchanged",
        content: origLine || "",
      });
    } else {
      // Changed line - show both removed and added
      if (origLine !== undefined) {
        diffLines.push({
          lineNumber: lineNumber,
          type: "removed",
          content: origLine,
        });
      }
      if (modLine !== undefined) {
        diffLines.push({
          lineNumber: lineNumber,
          type: "added",
          content: modLine,
        });
      }
      lineNumber++;
    }
  }

  return diffLines;
}
