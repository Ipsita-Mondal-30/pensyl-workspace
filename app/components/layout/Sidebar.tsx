"use client";
import { useState } from "react";
import { ChevronRightIcon, FolderIcon, FileIcon, PlusIcon, EditIcon, TrashIcon } from "../ui/Icons";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";
import { NewFileDialog } from "../dialogs/NewFileDialog";
import type { FileItem } from "../../shared/types";
import type { Section } from "../../utils/sectionParser";

interface SidebarProps {
  currentFolder?: string;
  files?: FileItem[];
  sections?: Section[];
  selectedSectionId?: string;
  onSectionSelect?: (sectionId: string, sectionName: string) => void;
  onOpenFolder?: () => void;
  onNewSection?: (parentSectionId?: string, sectionName?: string) => void;
  onRename?: (sectionId: string, newName: string) => void;
  onDelete?: (sectionId: string) => void;
  // Legacy props for backward compatibility
  selectedFileId?: string;
  onFileSelect?: (fileId: string) => void;
  onNewFile?: (parentPath: string, fileName?: string) => void;
  onNewFolder?: (parentPath: string) => void;
}

/**
 * Sidebar component with context menu - Section explorer sidebar with collapsible tree view
 */
export function Sidebar({
  currentFolder,
  files = [],
  sections = [],
  selectedSectionId,
  onSectionSelect,
  onOpenFolder,
  onNewSection,
  onRename,
  onDelete,
  // Legacy props
  selectedFileId,
  onFileSelect,
  onNewFile,
  onNewFolder,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    section: Section;
  } | null>(null);
  const [showNewSectionDialog, setShowNewSectionDialog] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (section: Section) => {
    if (section.children && section.children.length > 0) {
      toggleSection(section.id);
    }
    onSectionSelect?.(section.id, section.name);
  };

  const handleFileClick = (fileId: string) => {
    onFileSelect?.(fileId);
  };

  const handleContextMenu = (e: React.MouseEvent, section: Section) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      section,
    });
  };

  const getSectionIcon = (section: Section) => {
    // Use different icons based on heading level
    if (section.level === 1) {
      return <span className="text-xs font-bold">H1</span>;
    } else if (section.level === 2) {
      return <span className="text-xs font-semibold">H2</span>;
    } else {
      return <span className="text-xs">H{section.level}</span>;
    }
  };






  const getContextMenuItems = (section: Section): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
        {
        id: "new-section",
        label: "New Section",
          icon: <PlusIcon />,
          onClick: () => {
          onNewSection?.(section.id);
          },
        },
      { id: "sep1", label: "", separator: true, onClick: () => {} },
      {
        id: "rename",
        label: "Rename",
        icon: <EditIcon />,
        onClick: () => {
          onRename?.(section.id, section.name);
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: <TrashIcon />,
        onClick: () => {
          if (confirm(`Are you sure you want to delete "${section.name}"?`)) {
            onDelete?.(section.id);
          }
        },
      },
    ];

    return items;
  };

  const renderSection = (section: Section, depth: number = 0, isLast: boolean = false, parentIsLast: boolean[] = []) => {
    const isExpanded = expandedSections.has(section.id);
    const isSelected = selectedSectionId === section.id;
    const hasChildren = section.children && section.children.length > 0;
    const indent = depth * 16;
    
    return (
      <div key={section.id} className="relative">
        {/* Vertical line for nested sections */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border-primary)]"
            style={{
              left: `${8 + (depth - 1) * 16}px`,
              height: hasChildren && isExpanded ? '100%' : '1.5rem',
            }}
          />
        )}
        
        <div
          className={`
            group flex items-center gap-1 px-2 py-1 cursor-pointer select-none
            hover:bg-[var(--bg-hover)] transition-all duration-200 ease-in-out relative
            ${isSelected ? "bg-[var(--bg-active)] shadow-sm" : ""}
            rounded-sm
          `}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => handleSectionClick(section)}
          onContextMenu={(e) => handleContextMenu(e, section)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <div className="w-4 h-4 flex items-center justify-center">
              <ChevronRightIcon
                className={`transition-transform duration-150 text-[var(--text-secondary)] ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </div>
          ) : (
            <div className="w-4 h-4" />
          )}

          {/* Section Icon (H1, H2, etc.) */}
          <div className="w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)]">
            {getSectionIcon(section)}
          </div>

          {/* Section Name (no extension) */}
          <span
            className={`
              text-sm flex-1 truncate
              ${isSelected ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}
            `}
          >
            {section.name}
          </span>

          {/* Hover Actions - New Section button */}
          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-5 h-5 flex items-center justify-center hover:bg-[var(--bg-active)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 ease-in-out"
              onClick={(e) => {
                e.stopPropagation();
                onNewSection?.(section.id);
              }}
              aria-label="New section"
              title="New section"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Render Children if Section is Expanded */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {section.children!.map((child, index) => {
              const childIsLast = index === section.children!.length - 1;
              return renderSection(child, depth + 1, childIsLast, [...parentIsLast, isLast]);
            })}
          </div>
        )}
      </div>
    );
  };

  // Legacy file rendering (for backward compatibility)
  const renderFileItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedSections.has(item.id);
    const isSelected = selectedFileId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div key={item.id}>
        <div
          className={`
            group flex items-center gap-1 px-2 py-1 cursor-pointer select-none
            hover:bg-[var(--bg-hover)] transition-all duration-200 ease-in-out relative
            ${isSelected ? "bg-[var(--bg-active)] shadow-sm" : ""}
            rounded-sm
          `}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (item.type === "folder") {
              toggleSection(item.id);
            } else {
              handleFileClick(item.id);
            }
          }}
        >
          {item.type === "folder" && (
            <div className="w-4 h-4 flex items-center justify-center">
              <ChevronRightIcon
                className={`transition-transform duration-150 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </div>
          )}
          {item.type === "file" && <div className="w-4 h-4" />}
          <div className="w-4 h-4 flex items-center justify-center text-[var(--text-secondary)]">
            {item.type === "folder" ? <FolderIcon /> : <FileIcon extension={item.extension} />}
          </div>
          <span
            className={`
              text-sm flex-1 truncate
              ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
            `}
          >
            {item.name.replace(/\.[^.]+$/, '')}
          </span>
        </div>
        {item.type === "folder" && isExpanded && hasChildren && (
          <div className="animate-in fade-in slide-down duration-200">
            {item.children!.map((child) => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col items-center py-2">
        <button
          onClick={toggleCollapse}
          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col h-full">
        {/* Header */}
        <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {currentFolder ? (
              <>
                <FolderIcon className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {currentFolder.split("/").pop() || currentFolder}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Explorer
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* New File Button - Cursor style */}
            {currentFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  setShowNewSectionDialog(true);
                  }}
                  className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-all duration-200 ease-in-out shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="New section"
                title="New section"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
            )}
            <button
              onClick={toggleCollapse}
              className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors shrink-0"
              aria-label="Collapse sidebar"
            >
              <ChevronRightIcon className="w-3 h-3 text-[var(--text-secondary)] rotate-180" />
            </button>
          </div>
        </div>

        {/* Section Tree or Empty State */}
        <div className="flex-1 overflow-y-auto">
          {!currentFolder ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <FolderIcon className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Open a folder to begin writing
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onOpenFolder) {
                    onOpenFolder();
                  } else {
                    alert('Open folder handler not available');
                  }
                }}
                className="px-4 py-2 text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors mt-2"
              >
                Open Folder
              </button>
            </div>
          ) : sections.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                No sections yet. Create your first section!
              </p>
            </div>
          ) : sections.length > 0 ? (
            <div className="py-1">
              {sections.map((section, index) => 
                renderSection(section, 0, index === sections.length - 1, [])
              )}
            </div>
          ) : (
            <div className="py-1">{files.map((file) => renderFileItem(file))}</div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.section)}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* New Section Dialog */}
      {currentFolder && (
        <NewFileDialog
          isOpen={showNewSectionDialog}
          onClose={() => setShowNewSectionDialog(false)}
          onCreate={(sectionName) => {
            onNewSection?.(undefined, sectionName);
            setShowNewSectionDialog(false);
          }}
          currentPath={currentFolder}
        />
      )}
    </>
  );
}

