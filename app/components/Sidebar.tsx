"use client";
"use client";
import { useState } from "react";
import { ChevronRightIcon, FolderIcon, FileIcon, PlusIcon, EditIcon, TrashIcon } from "./Icons";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { NewFileDialog } from "./NewFileDialog";
import type { FileItem } from "../shared/types";

interface SidebarProps {
  currentFolder?: string;
  files?: FileItem[];
  selectedFileId?: string;
  onFileSelect?: (fileId: string) => void;
  onOpenFolder?: () => void;
  onNewFile?: (parentPath: string, fileName?: string) => void;
  onNewFolder?: (parentPath: string) => void;
  onRename?: (itemId: string, newName: string) => void;
  onDelete?: (itemId: string) => void;
}

/**
 * Sidebar component with context menu - File explorer sidebar with collapsible tree view
 */
export function Sidebar({
  currentFolder,
  files = [],
  selectedFileId,
  onFileSelect,
  onOpenFolder,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileItem;
  } | null>(null);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (fileId: string) => {
    onFileSelect?.(fileId);
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") {
      return <FolderIcon />;
    }
    return <FileIcon extension={item.extension} />;
  };






  const getContextMenuItems = (item: FileItem): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    if (item.type === "folder") {
      items.push(
        {
          id: "new-file",
          label: "New File",
          icon: <PlusIcon />,
          onClick: () => {
            onNewFile?.(item.path);
          },
        },
        {
          id: "new-folder",
          label: "New Folder",
          icon: <FolderIcon className="w-3.5 h-3.5" />,
          onClick: () => {
            onNewFolder?.(item.path);
          },
        },
        { id: "sep1", label: "", separator: true }
      );
    }

    items.push(
      {
        id: "rename",
        label: "Rename",
        icon: <EditIcon />,
        onClick: () => {
          onRename?.(item.id, item.name);
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: <TrashIcon />,
        onClick: () => {
          if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
            onDelete?.(item.id);
          }
        },
      }
    );

    return items;
  };

  const renderFileItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
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
              toggleFolder(item.id);
            } else {
              handleFileClick(item.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {/* Expand/Collapse Icon for Folders */}
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

          {/* File/Folder Icon */}
          <div className="w-4 h-4 flex items-center justify-center text-[var(--text-secondary)]">
            {getFileIcon(item)}
          </div>

          {/* File/Folder Name */}
          <span
            className={`
              text-sm flex-1 truncate
              ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
            `}
          >
            {item.name}
          </span>

          {/* Hover Actions - New File/New Folder buttons */}
          {item.type === "folder" && (
            <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="w-5 h-5 flex items-center justify-center hover:bg-[var(--bg-active)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 ease-in-out"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewFile?.(item.path);
                }}
                aria-label="New file"
                title="New file"
              >
                <PlusIcon className="w-3 h-3" />
              </button>
              <button
                className="w-5 h-5 flex items-center justify-center hover:bg-[var(--bg-active)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200 ease-in-out"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewFolder?.(item.path);
                }}
                aria-label="New folder"
                title="New folder"
              >
                <FolderIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Render Children if Folder is Expanded */}
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
      <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] flex flex-col h-full">
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
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewFileDialog(true);
                  }}
                  className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-all duration-200 ease-in-out shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="New file"
                  title="New file"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewFolder?.(currentFolder);
                  }}
                  className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-all duration-200 ease-in-out shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="New folder"
                  title="New folder"
                >
                  <FolderIcon className="w-4 h-4" />
                </button>
              </>
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

        {/* File Tree or Empty State */}
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
                  console.log('Open Folder button clicked');
                  console.log('onOpenFolder function:', onOpenFolder);
                  if (onOpenFolder) {
                    onOpenFolder();
                  } else {
                    console.error('onOpenFolder is not defined');
                    alert('Open folder handler not available');
                  }
                }}
                className="px-4 py-2 text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors mt-2"
              >
                Open Folder
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                No files in this folder
              </p>
            </div>
          ) : (
            <div className="py-1">{files.map((file) => renderFileItem(file))}</div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.item)}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* New File Dialog */}
      {currentFolder && (
        <NewFileDialog
          isOpen={showNewFileDialog}
          onClose={() => setShowNewFileDialog(false)}
          onCreate={(fileName) => {
            onNewFile?.(currentFolder, fileName);
            setShowNewFileDialog(false);
          }}
          currentPath={currentFolder}
        />
      )}
    </>
  );
}

