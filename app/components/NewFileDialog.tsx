"use client";
import { useState, useEffect, useRef } from "react";
import { FileIcon } from "./Icons";

interface FileType {
  name: string;
  extension: string;
  icon?: React.ReactNode;
}

const FILE_TYPES: FileType[] = [
  { name: "Markdown", extension: "md" },
  { name: "Text", extension: "txt" },
  { name: "JSON", extension: "json" },
  { name: "PDF", extension: "pdf" },
  { name: "TypeScript", extension: "ts" },
  { name: "JavaScript", extension: "js" },
  { name: "TypeScript React", extension: "tsx" },
  { name: "JavaScript React", extension: "jsx" },
  { name: "HTML", extension: "html" },
  { name: "CSS", extension: "css" },
  { name: "Python", extension: "py" },
  { name: "YAML", extension: "yml" },
  { name: "XML", extension: "xml" },
  { name: "Shell Script", extension: "sh" },
  { name: "Rust", extension: "rs" },
  { name: "Go", extension: "go" },
  { name: "Java", extension: "java" },
  { name: "C++", extension: "cpp" },
  { name: "C", extension: "c" },
  { name: "C#", extension: "cs" },
  { name: "PHP", extension: "php" },
  { name: "Ruby", extension: "rb" },
  { name: "Swift", extension: "swift" },
  { name: "Kotlin", extension: "kt" },
  { name: "Scala", extension: "scala" },
  { name: "R", extension: "r" },
  { name: "SQL", extension: "sql" },
  { name: "Dockerfile", extension: "dockerfile" },
  { name: "Gitignore", extension: "gitignore" },
];

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fileName: string) => void;
  currentPath: string;
}

/**
 * NewFileDialog - Cursor-like file creation dialog
 */
export function NewFileDialog({
  isOpen,
  onClose,
  onCreate,
  currentPath,
}: NewFileDialogProps) {
  const [fileName, setFileName] = useState("");
  const [selectedExtension, setSelectedExtension] = useState("md");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setSelectedExtension("md");
      // Focus input after dialog opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCreate();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleEnter);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleEnter);
    };
  }, [isOpen, fileName, selectedExtension]);

  const handleCreate = () => {
    if (!fileName.trim()) return;

    // For sections, just use the name as-is (no extension)
    // For files, add extension
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
    const finalFileName = selectedExtension ? `${nameWithoutExt}.${selectedExtension}` : nameWithoutExt;
    onCreate(finalFileName);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl w-[480px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            New File
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
            {currentPath}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* File Name Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              File Name
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                className="flex-1 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
                autoFocus
              />
              <span className="text-sm text-[var(--text-secondary)]">
                .{selectedExtension}
              </span>
            </div>
          </div>

          {/* File Type Selection */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              File Type
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
              {FILE_TYPES.map((type) => (
                <button
                  key={type.extension}
                  onClick={() => setSelectedExtension(type.extension)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors
                    ${
                      selectedExtension === type.extension
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    }
                  `}
                >
                  <FileIcon extension={type.extension} className="w-4 h-4" />
                  <span className="text-xs">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-primary)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!fileName.trim()}
            className="px-4 py-1.5 text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

