import { useState } from "react";
import { DiffViewer } from "./DiffViewer";

export interface Patch {
  file: string;
  type: "insert" | "replace" | "delete";
  line?: number;
  target?: {
    startLine: number;
    endLine: number;
  };
  content?: string;
  replacement?: string;
}

interface PatchPreviewProps {
  patches: Patch[];
  currentFileContent: string;
  currentFileName: string;
  onAcceptPatch: (patch: Patch) => void;
  onRejectPatch: (patch: Patch) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

/**
 * PatchPreview - Shows AI-suggested changes with accept/reject
 * Displays patches as visual diffs like Cursor IDE
 */
export function PatchPreview({
  patches,
  currentFileContent,
  currentFileName,
  onAcceptPatch,
  onRejectPatch,
  onAcceptAll,
  onRejectAll,
}: PatchPreviewProps) {
  console.log("🎨 PatchPreview rendering:", {
    patchCount: patches.length,
    currentFileName,
    hasContent: !!currentFileContent,
  });

  const [expandedPatches, setExpandedPatches] = useState<Set<number>>(
    new Set(patches.map((_, i) => i))
  );

  const togglePatch = (index: number) => {
    setExpandedPatches((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (patches.length === 0) {
    console.log("⚠️ PatchPreview: No patches to display");
    return null;
  }

  return (
    <div className="patch-preview space-y-3 animate-fadeIn">
      {/* Header with bulk actions */}
      {patches.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-900 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔧</span>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {patches.length} Change{patches.length > 1 ? "s" : ""}{" "}
                  Suggested
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  Review and apply changes to your file
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onRejectAll}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-lg transition-all whitespace-nowrap"
              >
                ✕ Reject All
              </button>
              <button
                onClick={onAcceptAll}
                className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all whitespace-nowrap"
              >
                ✓ Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual patches */}
      {patches.map((patch, index) => {
        const isExpanded = expandedPatches.has(index);
        const { original, modified, startLine, endLine } = extractPatchContent(
          patch,
          currentFileContent
        );

        return (
          <div
            key={index}
            className="patch-item rounded-xl border-2 border-[var(--border-primary)] overflow-hidden shadow-md hover:shadow-lg transition-all"
          >
            {/* Patch header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-primary)] border-b-2 border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-all"
              onClick={() => togglePatch(index)}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-lg transition-transform"
                  style={{
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {getPatchTypeLabel(patch.type)}
                </span>
                {startLine && endLine && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-full">
                    Lines {startLine}-{endLine}
                  </span>
                )}
              </div>
            </div>

            {/* Patch content */}
            {isExpanded && (
              <div className="overflow-hidden">
                <DiffViewer
                  originalContent={original}
                  modifiedContent={modified}
                  fileName={currentFileName}
                  startLine={startLine}
                  endLine={endLine}
                  onAccept={() => {
                    console.log("🎯 Accept button clicked for patch:", patch);
                    onAcceptPatch(patch);
                  }}
                  onReject={() => {
                    console.log("🚫 Reject button clicked for patch:", patch);
                    onRejectPatch(patch);
                  }}
                  showActions={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Extract original and modified content for a patch
 */
function extractPatchContent(
  patch: Patch,
  fileContent: string
): {
  original: string;
  modified: string;
  startLine: number;
  endLine: number;
} {
  const lines = fileContent.split("\n");

  switch (patch.type) {
    case "replace": {
      if (!patch.target) {
        return {
          original: "",
          modified: patch.replacement || "",
          startLine: 1,
          endLine: 1,
        };
      }

      const { startLine, endLine } = patch.target;
      const original = lines.slice(startLine - 1, endLine).join("\n");
      const modified = patch.replacement || "";

      return {
        original,
        modified,
        startLine,
        endLine,
      };
    }

    case "insert": {
      const lineNum = patch.line || 1;
      return {
        original: "",
        modified: patch.content || "",
        startLine: lineNum,
        endLine: lineNum,
      };
    }

    case "delete": {
      if (!patch.target) {
        return {
          original: "",
          modified: "",
          startLine: 1,
          endLine: 1,
        };
      }

      const { startLine, endLine } = patch.target;
      const original = lines.slice(startLine - 1, endLine).join("\n");

      return {
        original,
        modified: "",
        startLine,
        endLine,
      };
    }

    default:
      return {
        original: "",
        modified: "",
        startLine: 1,
        endLine: 1,
      };
  }
}

/**
 * Get human-readable label for patch type
 */
function getPatchTypeLabel(type: Patch["type"]): string {
  switch (type) {
    case "insert":
      return "✨ Insert Content";
    case "replace":
      return "✏️ Replace Text";
    case "delete":
      return "🗑️ Delete Lines";
    default:
      return "📝 Modify";
  }
}
