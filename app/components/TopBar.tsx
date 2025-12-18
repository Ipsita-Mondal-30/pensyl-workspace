"use client";
import { useState, useRef, useEffect } from "react";

interface TopBarProps {
  onOpenSettings?: () => void;
  onOpenAI?: () => void;
  onAddSource?: (type: "pdf" | "doi" | "zotero") => void;
  onCite?: () => void;
  onExport?: (format: "pdf" | "docx" | "latex" | "markdown") => void;
  onInsert?: (type: "title" | "abstract" | "introduction" | "methods" | "results" | "discussion" | "conclusion" | "figure" | "equation" | "citation" | "table") => void;
  onFormat?: (action: "bold" | "italic" | "underline" | "heading1" | "heading2" | "heading3" | "bulletList" | "orderedList" | "blockquote" | "codeBlock") => void;
  onViewModeChange?: (mode: "writing" | "paper" | "latex") => void;
  currentViewMode?: "writing" | "paper" | "latex";
  onToggleToC?: () => void;
  showToC?: boolean;
}

/**
 * TopBar component - Research-focused toolbar with core features
 */
export function TopBar({
  onOpenSettings,
  onOpenAI,
  onAddSource,
  onCite,
  onExport,
  onInsert,
  onFormat,
  onViewModeChange,
  currentViewMode = "writing",
  onToggleToC,
  showToC = false,
}: TopBarProps = {}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const ignoreNextClickRef = useRef(false);

  const toggleDropdown = (id: string) => {
    // Use functional update to avoid race conditions
    setOpenDropdown((current) => {
      if (current === id) {
        return null;
      }
      return id;
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Ignore if we're in the middle of a button click
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }

      const target = event.target as HTMLElement;
      if (!target) return;

      const dropdown = dropdownRefs.current[openDropdown];
      const buttonContainer = target.closest(`[data-dropdown-container="${openDropdown}"]`);

      // If click is inside the dropdown or its button container, don't close
      if (dropdown?.contains(target) || buttonContainer) {
        return;
      }

      // Click is outside, close dropdown
      setOpenDropdown(null);
    };

    // Use a longer delay to ensure button clicks are processed first
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside, true);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [openDropdown]);

  const TopBarButton = ({
    id,
    label,
    icon,
    onClick,
    hasDropdown = false,
    children,
  }: {
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    hasDropdown?: boolean;
    children?: React.ReactNode;
  }) => (
    <div 
      className="relative" 
      style={{ zIndex: 10001 }} 
      data-topbar-button
      data-dropdown-container={id}
    >
      <button
        data-dropdown-id={id}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (hasDropdown) {
            // Set flag to ignore the next click outside event
            ignoreNextClickRef.current = true;
            toggleDropdown(id);
            // Reset flag after click is processed
            setTimeout(() => {
              ignoreNextClickRef.current = false;
            }, 100);
          } else {
            onClick?.();
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap
          transition-all duration-150
          ${!label ? "px-1.5" : ""}
          ${
            openDropdown === id
              ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }
        `}
        title={label || id}
      >
        {icon}
        {label && <span>{label}</span>}
        {hasDropdown && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
    fill="none"
            className={`transition-transform duration-150 ${
              openDropdown === id ? "rotate-180" : ""
            }`}
          >
    <path
              d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
              strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
        )}
      </button>
      {hasDropdown && openDropdown === id && children && (
        <div
          ref={(el) => {
            dropdownRefs.current[id] = el;
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{ zIndex: 10002 }}
          className="absolute top-full left-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl py-1.5 min-w-[200px]"
        >
          {children}
        </div>
      )}
    </div>
  );

  const DropdownItem = ({
    icon,
    label,
    onClick,
    shortcut,
  }: {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    shortcut?: string;
  }) => (
    <button
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
        // Close dropdown after action completes
        setTimeout(() => {
          setOpenDropdown(null);
        }, 10);
      }}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-left"
  >
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      )}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-xs text-[var(--text-tertiary)] font-mono">
          {shortcut}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex items-center justify-between h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-3 select-none relative z-[10000]">
      {/* Left: Core Features */}
      <div className="flex items-center gap-0.5 flex-1 min-w-0">
        {/* 0. Insert - Research Paper Elements */}
        <TopBarButton
          id="insert"
          label="Insert"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
                d="M8 3V13M3 8H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
          }
          hasDropdown={true}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Document Structure
          </div>
          <DropdownItem
            icon="📝"
            label="Title"
            onClick={() => onInsert?.("title")}
            shortcut="⌘T"
          />
          <DropdownItem
            icon="📄"
            label="Abstract"
            onClick={() => onInsert?.("abstract")}
          />
          <DropdownItem
            icon="📖"
            label="Introduction"
            onClick={() => onInsert?.("introduction")}
          />
          <DropdownItem
            icon="🔬"
            label="Methods"
            onClick={() => onInsert?.("methods")}
          />
          <DropdownItem
            icon="📊"
            label="Results"
            onClick={() => onInsert?.("results")}
          />
          <DropdownItem
            icon="💭"
            label="Discussion"
            onClick={() => onInsert?.("discussion")}
          />
          <DropdownItem
            icon="✅"
            label="Conclusion"
            onClick={() => onInsert?.("conclusion")}
          />
          <div className="border-t border-[var(--border-primary)] my-1" />
          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Research Elements
          </div>
          <DropdownItem
            icon="🖼️"
            label="Figure"
            onClick={() => onInsert?.("figure")}
            shortcut="⌘F"
          />
          <DropdownItem
            icon="∑"
            label="Equation"
            onClick={() => onInsert?.("equation")}
            shortcut="⌘E"
          />
          <DropdownItem
            icon="🔖"
            label="Citation"
            onClick={() => onInsert?.("citation")}
            shortcut="⌘⇧C"
          />
          <DropdownItem
            icon="📋"
            label="Table"
            onClick={() => onInsert?.("table")}
            shortcut="⌘⇧T"
          />
        </TopBarButton>

        {/* 1. Add Source */}
        <TopBarButton
          id="add-source"
          label="Add Source"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
                d="M8 3V13M3 8H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem
            icon="📄"
            label="Upload PDF"
            onClick={() => onAddSource?.("pdf")}
          />
          <DropdownItem
            icon="🔗"
            label="Add via DOI / BibTeX"
            onClick={() => onAddSource?.("doi")}
          />
          <DropdownItem
            icon="📚"
            label="Import from Zotero / Mendeley"
            onClick={() => onAddSource?.("zotero")}
          />
        </TopBarButton>

        {/* 2. Cite */}
        <TopBarButton
          id="cite"
          label="Cite"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6C4 4.89543 4.89543 4 6 4H10C11.1046 4 12 4.89543 12 6V10C12 11.1046 11.1046 12 10 12H6C4.89543 12 4 11.1046 4 10V6Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem
            label="Insert in-text citation at cursor"
            onClick={() => onCite?.()}
            shortcut="⌘⇧C"
          />
          <DropdownItem label="Search existing references" onClick={() => {}} />
          <div className="border-t border-[var(--border-primary)] my-1" />
          <DropdownItem label="APA Format" onClick={() => {}} />
          <DropdownItem label="IEEE Format" onClick={() => {}} />
          <DropdownItem label="MLA Format" onClick={() => {}} />
        </TopBarButton>

        {/* 3. Ask AI */}
        <TopBarButton
          id="ask-ai"
          label="AI"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
              <path
                d="M8 5V8M8 11H8.01"
      stroke="currentColor"
      strokeWidth="1.5"
                strokeLinecap="round"
    />
  </svg>
          }
          hasDropdown={true}
          onClick={onOpenAI}
        >
          <DropdownItem label="Rewrite section" onClick={() => {}} />
          <DropdownItem label="Explain concept" onClick={() => {}} />
          <DropdownItem label="Improve clarity" onClick={() => {}} />
          <DropdownItem label="Reviewer feedback" onClick={() => {}} />
        </TopBarButton>

        {/* 4. Research Tools */}
        <TopBarButton
          id="research"
          label="Search"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="7"
                cy="7"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
    <path
                d="M10 10L13 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem
            label="Search papers (Semantic Scholar)"
            onClick={() => {}}
          />
          <DropdownItem label="Search arXiv" onClick={() => {}} />
          <DropdownItem label="Related work suggestions" onClick={() => {}} />
          <DropdownItem label="PDF summaries" onClick={() => {}} />
          <DropdownItem label="Key quote extraction" onClick={() => {}} />
        </TopBarButton>

        {/* 5. Listen */}
        <TopBarButton
          id="listen"
          label="Listen"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2V6M8 10V14M8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8C6 6.89543 6.89543 6 8 6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem label="Convert to audio" onClick={() => {}} />
          <DropdownItem label="Play / Pause" onClick={() => {}} />
          <DropdownItem label="Speed control" onClick={() => {}} />
        </TopBarButton>

        {/* 6. Humanize */}
        <TopBarButton
          id="humanize"
          label="Humanize"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5.5 6.5C5.5 7.05228 5.94772 7.5 6.5 7.5C7.05228 7.5 7.5 7.05228 7.5 6.5C7.5 5.94772 7.05228 5.5 6.5 5.5C5.94772 5.5 5.5 5.94772 5.5 6.5Z"
                fill="currentColor"
              />
              <path
                d="M8.5 6.5C8.5 7.05228 8.94772 7.5 9.5 7.5C10.0523 7.5 10.5 7.05228 10.5 6.5C10.5 5.94772 10.0523 5.5 9.5 5.5C8.94772 5.5 8.5 5.94772 8.5 6.5Z"
                fill="currentColor"
              />
              <path
                d="M6 10C6 10 7 11.5 8 11.5C9 11.5 10 10 10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem label="Fix formatting everywhere" onClick={() => {}} />
          <DropdownItem label="Match journal style" onClick={() => {}} />
          <DropdownItem label="Normalize citations" onClick={() => {}} />
          <DropdownItem label="Fix headings & numbering" onClick={() => {}} />
        </TopBarButton>

        {/* 7. Research Gap Finder */}
        <TopBarButton
          id="find-gaps"
          label="Find Gaps"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L10.5 6L15 7L11.5 10.5L12 15L8 12.5L4 15L4.5 10.5L1 7L5.5 6L8 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="8"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          }
          onClick={() => {
            // Research Gap Finder action
            console.log("Find research gaps");
          }}
        />

        {/* 8. Format */}
        <TopBarButton
          id="format"
          label="Format"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4H12M4 8H12M4 12H8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
          hasDropdown={true}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Text Formatting
          </div>
          <DropdownItem
            icon="B"
            label="Bold"
            onClick={() => onFormat?.("bold")}
            shortcut="⌘B"
          />
          <DropdownItem
            icon="I"
            label="Italic"
            onClick={() => onFormat?.("italic")}
            shortcut="⌘I"
          />
          <DropdownItem
            icon="U"
            label="Underline"
            onClick={() => onFormat?.("underline")}
            shortcut="⌘U"
          />
          <div className="border-t border-[var(--border-primary)] my-1" />
          <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Structure
          </div>
          <DropdownItem
            icon="H1"
            label="Heading 1"
            onClick={() => onFormat?.("heading1")}
            shortcut="⌘⇧1"
          />
          <DropdownItem
            icon="H2"
            label="Heading 2"
            onClick={() => onFormat?.("heading2")}
            shortcut="⌘⇧2"
          />
          <DropdownItem
            icon="H3"
            label="Heading 3"
            onClick={() => onFormat?.("heading3")}
            shortcut="⌘⇧3"
          />
          <div className="border-t border-[var(--border-primary)] my-1" />
          <DropdownItem
            icon="•"
            label="Bullet List"
            onClick={() => onFormat?.("bulletList")}
          />
          <DropdownItem
            icon="1."
            label="Numbered List"
            onClick={() => onFormat?.("orderedList")}
          />
          <DropdownItem
            icon="❝"
            label="Blockquote"
            onClick={() => onFormat?.("blockquote")}
          />
          <DropdownItem
            icon="</>"
            label="Code Block"
            onClick={() => onFormat?.("codeBlock")}
          />
        </TopBarButton>

        {/* 9. LaTeX */}
        <TopBarButton
          id="latex"
          label="LaTeX"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L8 8L12 4M4 12L8 8L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem label="Toggle LaTeX view" onClick={() => {}} />
          <DropdownItem label="Export to LaTeX" onClick={() => {}} />
          <DropdownItem label="Copy LaTeX snippet" onClick={() => {}} />
          <DropdownItem label="Math blocks manager" onClick={() => {}} />
        </TopBarButton>

        {/* 10. Export */}
        <TopBarButton
          id="export"
          label="Export"
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2V10M8 10L5 7M8 10L11 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12V13C2 14.1046 2.89543 15 4 15H12C13.1046 15 14 14.1046 14 13V12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
          hasDropdown={true}
        >
          <DropdownItem
            label="PDF (submission-ready)"
            onClick={() => onExport?.("pdf")}
          />
          <DropdownItem label="DOCX" onClick={() => onExport?.("docx")} />
          <DropdownItem label="LaTeX" onClick={() => onExport?.("latex")} />
          <DropdownItem
            label="Markdown"
            onClick={() => onExport?.("markdown")}
          />
        </TopBarButton>
      </div>

      {/* Right: Optional Icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* View Mode Toggle - Moved here from top */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded p-0.5 mr-1">
            <button
              onClick={() => onViewModeChange("writing")}
              className={`px-1.5 py-1 text-xs font-medium rounded transition-colors ${
                currentViewMode === "writing"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
              title="Writing Mode"
            >
              ✍️
            </button>
            <button
              onClick={() => onViewModeChange("paper")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentViewMode === "paper"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
              title="Paper Preview"
            >
              📄
            </button>
            <button
              onClick={() => onViewModeChange("latex")}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                currentViewMode === "latex"
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
              title="LaTeX Preview"
            >
              ∑
          </button>
          </div>
        )}
        {/* Version History */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded transition-colors"
          title="Version history"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M8 5V8L10 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Collaborators */}
        <button
          className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded transition-colors"
          title="Collaborators"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="6"
              cy="5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M2 13C2 11.3431 3.34315 10 5 10H7C8.65685 10 10 11.3431 10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="11"
              cy="6"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M13 12C13 10.8954 12.1046 10 11 10H9C7.89543 10 7 10.8954 7 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Table of Contents Toggle */}
        {onToggleToC && (
          <button
            onClick={onToggleToC}
            className={`w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded transition-colors ${
              showToC ? "bg-[var(--bg-active)] text-[var(--text-primary)]" : ""
            }`}
            title="Toggle Table of Contents"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H8M2 8H14M2 12H10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded transition-colors"
          title="Project settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 2V4M8 12V14M14 8H12M4 8H2M12.5 3.5L11 5M5 11L3.5 12.5M12.5 12.5L11 11M5 5L3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
