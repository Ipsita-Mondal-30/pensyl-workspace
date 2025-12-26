"use client";

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
 * DiffViewer - Compact unified diff view
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
  // Generate diff lines
  const diffLines = generateDiff(originalContent, modifiedContent, startLine);

  return (
    <div className="diff-viewer bg-[var(--bg-primary)]">
      {/* Diff Content */}
      <div className="diff-content overflow-auto max-h-[400px]">
        <UnifiedDiffView lines={diffLines} />
      </div>
    </div>
  );
}

/**
 * Unified diff view (compact)
 */
function UnifiedDiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-[11px] leading-tight unified-diff">
      {lines.map((line, index) => (
        <div
          key={index}
          className={`diff-line flex border-l-2 ${
            line.type === "added"
              ? "bg-green-500/8 border-green-500/50 text-green-400"
              : line.type === "removed"
              ? "bg-red-500/8 border-red-500/50 text-red-400"
              : "border-transparent text-[var(--text-secondary)]"
          }`}
        >
          <div className="line-number w-10 flex-shrink-0 px-2 py-1 text-right text-[var(--text-tertiary)] select-none text-[10px]">
            {line.lineNumber || ""}
          </div>
          <div
            className={`line-marker w-5 flex-shrink-0 px-1 py-1 text-center text-[10px] font-semibold ${
              line.type === "added"
                ? "text-green-400"
                : line.type === "removed"
                ? "text-red-400"
                : "text-[var(--text-tertiary)]"
            }`}
          >
            {line.type === "added" ? "+" : line.type === "removed" ? "-" : ""}
          </div>
          <div className="overflow-x-auto flex-1 px-2 py-1 whitespace-pre line-content">
            {line.content || " "}
          </div>
        </div>
      ))}
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
