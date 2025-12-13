"use client";
import { useState, useRef, useEffect } from "react";
import { FileIcon } from "./Icons";




export interface TabData {
  id: string;
  filePath: string;
  fileName: string;
  isModified: boolean;
  content?: string;
}

interface TabProps {
  tab: TabData;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
  onRevealInExplorer: () => void;
  onRename: (newName: string) => void;
}

/**
 * Tab component - Individual tab in the tab strip
 */
export function Tab({
  tab,
  isActive,
  onSelect,
  onClose,
  onCloseOthers,
  onCloseAll,
  onRevealInExplorer,
  onRename,
}: TabProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tab.fileName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;

    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  const handleDoubleClick = () => {
    setIsRenaming(true);
    setRenameValue(tab.fileName);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== tab.fileName) {
      onRename(renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setRenameValue(tab.fileName);
    setIsRenaming(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(e);
  };

  const getFileExtension = () => {
    const parts = tab.fileName.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  return (
    <>
      <div
        className={`
          group flex items-center gap-2 px-3 py-1.5 min-w-0 max-w-[200px] cursor-pointer
          border-r border-[var(--border-primary)]
          transition-all duration-200 ease-in-out relative
          ${isActive ? "bg-[var(--bg-primary)] shadow-sm border-b-2 border-b-[var(--accent-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]"}
        `}
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* File Icon */}
        <div className="flex-shrink-0 w-4 h-4">
          <FileIcon extension={getFileExtension()} className="w-4 h-4" />
        </div>

        {/* File Name */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRenameSubmit();
              } else if (e.key === "Escape") {
                handleRenameCancel();
              }
            }}
            className="flex-1 min-w-0 px-1 py-0.5 bg-[var(--bg-primary)] border border-[var(--accent-primary)] rounded text-xs text-[var(--text-primary)] focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 min-w-0 text-xs text-[var(--text-primary)] truncate">
            {tab.fileName}
          </span>
        )}

        {/* Modified Dot */}
        {tab.isModified && !isRenaming && (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
        )}

        {/* Close Button */}
        {!isRenaming && (
          <button
            onClick={handleClose}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--bg-active)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            aria-label="Close tab"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-[var(--text-secondary)]"
            >
              <path
                d="M3 3L9 9M9 3L3 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-dropdown bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-lg py-1 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center w-full px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            onClick={() => {
              onClose(new MouseEvent("click") as any);
              setContextMenu(null);
            }}
          >
            Close
          </button>
          <button
            className="flex items-center w-full px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            onClick={() => {
              onCloseOthers();
              setContextMenu(null);
            }}
          >
            Close Others
          </button>
          <button
            className="flex items-center w-full px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            onClick={() => {
              onCloseAll();
              setContextMenu(null);
            }}
          >
            Close All
          </button>
          <div className="border-t border-[var(--border-primary)] my-1" />
          <button
            className="flex items-center w-full px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            onClick={() => {
              onRevealInExplorer();
              setContextMenu(null);
            }}
          >
            Reveal in Explorer
          </button>
        </div>
      )}
    </>
  );
}

