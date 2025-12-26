"use client";
import { DiffViewer } from "./DiffViewer";
import type { Patch } from "../../utils/patchParser";

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
 * Compact, consistent design
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
  if (patches.length === 0) {
    return null;
  }

  return (
    <div className="patch-preview space-y-2">
      {/* Compact header with bulk actions */}
      {patches.length > 1 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md">
          <span className="text-xs text-[var(--text-secondary)]">
            {patches.length} change{patches.length > 1 ? "s" : ""} suggested
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRejectAll}
              className="px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              Reject all
            </button>
            <button
              onClick={onAcceptAll}
              className="px-2 py-0.5 text-[11px] font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      )}

      {/* Individual patches */}
      {patches.map((patch, index) => {
        const { original, modified, startLine, endLine } = extractPatchContent(
          patch,
          currentFileContent
        );

        return (
          <div
            key={index}
            className="border border-[var(--border-primary)] rounded-md overflow-hidden bg-[var(--bg-secondary)]"
          >
            {/* Compact patch header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {getPatchTypeLabel(patch.type)}
                </span>
                {startLine && endLine && startLine !== endLine && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    L{startLine}-{endLine}
                  </span>
                )}
                {startLine && endLine && startLine === endLine && (
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    L{startLine}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onRejectPatch(patch)}
                  className="px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-hover)] rounded transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onAcceptPatch(patch)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>

            {/* Diff content */}
            <div className="overflow-hidden">
              <DiffViewer
                originalContent={original}
                modifiedContent={modified}
                fileName={currentFileName}
                startLine={startLine}
                endLine={endLine}
                onAccept={() => onAcceptPatch(patch)}
                onReject={() => onRejectPatch(patch)}
                showActions={false}
              />
            </div>
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
      return "Insert";
    case "replace":
      return "Replace";
    case "delete":
      return "Delete";
    default:
      return "Modify";
  }
}
