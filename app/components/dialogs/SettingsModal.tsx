"use client";
import { useState, useEffect } from "react";

export type Theme = "dark" | "light" | "grey";



interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

interface KeyboardShortcut {
  command: string;
  shortcut: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  { command: "Open Folder", shortcut: "⌘O / Ctrl+O", category: "File" },
  { command: "New File", shortcut: "⌘N / Ctrl+N", category: "File" },
  { command: "Save File", shortcut: "⌘S / Ctrl+S", category: "File" },
  { command: "Command Palette", shortcut: "⌘K / Ctrl+K", category: "General" },
  { command: "Toggle Sidebar", shortcut: "⌘B / Ctrl+B", category: "View" },
  { command: "Toggle Chat Panel", shortcut: "⌘⇧I / Ctrl+Shift+I", category: "View" },
  { command: "Close Tab", shortcut: "⌘W / Ctrl+W", category: "Editor" },
  { command: "Bold", shortcut: "⌘B / Ctrl+B", category: "Editor" },
  { command: "Italic", shortcut: "⌘I / Ctrl+I", category: "Editor" },
];

/**
 * SettingsModal - Settings modal with theme selection and keyboard shortcuts
 */
export function SettingsModal({ isOpen, onClose, onLogout }: SettingsModalProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [activeTab, setActiveTab] = useState<"general" | "shortcuts">("general");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("intellirite-theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("intellirite-theme", newTheme);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Handle Esc key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-settings-modal]') === null) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 fade-in"
        onClick={onClose}
      />

      {/* Settings Modal */}
      <div
        data-settings-modal
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] max-h-[85vh] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col scale-in"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close settings"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="w-4 h-4"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex items-center gap-1 border-b border-[var(--border-primary)] shrink-0">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "general"
                ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("shortcuts")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "shortcuts"
                ? "text-[var(--accent-primary)] border-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]"
            }`}
          >
            Keyboard Shortcuts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Appearance
                </h3>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleThemeChange("dark")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        theme === "dark"
                          ? "border-[var(--accent-primary)] bg-[var(--bg-hover)]"
                          : "border-[var(--border-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        Dark
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Default dark theme
                      </div>
                    </button>
                    <button
                      onClick={() => handleThemeChange("light")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        theme === "light"
                          ? "border-[var(--accent-primary)] bg-[var(--bg-hover)]"
                          : "border-[var(--border-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        Light
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Light theme
                      </div>
                    </button>
                    <button
                      onClick={() => handleThemeChange("grey")}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        theme === "grey"
                          ? "border-[var(--accent-primary)] bg-[var(--bg-hover)]"
                          : "border-[var(--border-primary)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
                        Grey
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Grey theme
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shortcuts" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <span className="text-sm text-[var(--text-primary)]">
                              {shortcut.command}
                            </span>
                            <kbd className="px-2 py-1 text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)]">
                              {shortcut.shortcut}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-primary)] flex items-center justify-between shrink-0">
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-red-500 text-red-500 rounded text-sm font-medium transition-colors hover:bg-red-500/10"
          >
            Log out
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

