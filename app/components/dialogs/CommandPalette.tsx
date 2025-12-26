"use client";
import { useState, useEffect, useRef, useCallback } from "react";




export interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon?: string;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  onExecute?: (commandId: string) => void;
}

/**
 * Simple fuzzy search function
 */
function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length;
}

/**
 * CommandPalette - VSCode-like command palette component
 */
export function CommandPalette({
  isOpen,
  onClose,
  commands,
  onExecute,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query
  const filteredCommands = searchQuery.trim()
    ? commands.filter(
        (cmd) =>
          fuzzySearch(searchQuery, cmd.label) ||
          fuzzySearch(searchQuery, cmd.description || "") ||
          fuzzySearch(searchQuery, cmd.category)
      )
    : commands;

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length, searchQuery]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          const command = filteredCommands[selectedIndex];
          command.action();
          onExecute?.(command.id);
          onClose();
        }
        return;
      }
    },
    [filteredCommands, selectedIndex, onClose, onExecute]
  );

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-command-palette]') === null) {
        onClose();
      }
    };

    // Delay to avoid immediate close on open
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 backdrop-blur-sm bg-black/50 fade-in"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div
        data-command-palette
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl z-50 overflow-hidden scale-in"
      >
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
            >
              <path
                d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.5 10.5L14 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command name..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            />
          </div>
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action();
                      onExecute?.(command.id);
                      onClose();
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
                      ${
                        isSelected
                          ? "bg-[var(--accent-primary)] text-white"
                          : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      }
                    `}
                  >
                    {/* Icon placeholder */}
                    {command.icon && (
                      <span className="text-lg shrink-0">{command.icon}</span>
                    )}
                    
                    {/* Command Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center">
                        <span className={`font-medium ${isSelected ? "text-white" : ""}`}>
                          {command.label}
                        </span>
                        {command.shortcut && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[var(--bg-primary)] text-[var(--text-tertiary)]"
                            }`}
                          >
                            {command.shortcut}
                          </span>
                        )}
                      </div>
                      {command.description && (
                        <div
                          className={`text-xs mt-0.5 ${
                            isSelected
                              ? "text-white/70"
                              : "text-[var(--text-tertiary)]"
                          }`}
                        >
                          {command.description}
                        </div>
                      )}
                    </div>

                    {/* Category badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {command.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--border-primary)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <div className="flex gap-4 items-center">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>{filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  );
}

