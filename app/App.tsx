"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  TopBar,
  Sidebar,
  TabStrip,
  Editor,
  ChatPanel,
  StatusBar,
  CommandPalette,
  SettingsModal,
  InputDialog,
  type CursorPosition,
  type Command,
} from "./components";
import type { FileItem } from "./shared/types";
import type { TabData } from "./components/Tab";
import TurndownService from "turndown";
import { marked } from "marked";
import { localStorageFS } from "./lib/localStorageFS";

function App() {
  const [currentFolder, setCurrentFolder] = useState<string | undefined>();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [fileSystemReady, setFileSystemReady] = useState(false);

  // Tab management
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Auto-save debounce refs
  const saveTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const turndownService = useRef(new TurndownService());
  
  // Editor ref for AI chat integration
  const editorRef = useRef<any>(null);

  // Chat panel state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Status bar state
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    line: 1,
    column: 1,
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Input dialog state (for folder/file creation)
  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    defaultValue?: string;
    onSubmit: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    placeholder: "",
    defaultValue: "",
    onSubmit: () => {},
  });

  // Initialize file system
  useEffect(() => {
    setFileSystemReady(true);
    // Auto-open root folder
    handleOpenFolder();
  }, []);

  // Load folder structure
  const loadFolder = useCallback(async (folderPath: string) => {
    try {
      const fileItems = await localStorageFS.readFolder(folderPath);
      setFiles(fileItems);
      setCurrentFolder(folderPath);
    } catch (error) {
      console.error("Error loading folder:", error);
      alert(`Failed to load folder: ${error}`);
    }
  }, []);

  // Handle open folder
  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await localStorageFS.openFolder();
      if (folderPath) {
        await loadFolder(folderPath);
      }
    } catch (error: any) {
      console.error("Error opening folder:", error);
      alert(`Failed to open folder: ${error?.message || String(error)}`);
    }
  }, [loadFolder]);

  // Handle new file
  const handleNewFile = useCallback(
    (parentPath: string, fileName?: string) => {
      if (fileName) {
        (async () => {
          try {
            await localStorageFS.createFile(parentPath, fileName);
            await loadFolder(currentFolder || parentPath);
          } catch (error) {
            console.error("Error creating file:", error);
            alert(`Failed to create file: ${error}`);
          }
        })();
        return;
      }

      setInputDialog({
        isOpen: true,
        title: "New File",
        placeholder: "Enter file name (e.g., example.txt)",
        onSubmit: async (finalFileName: string) => {
          try {
            await localStorageFS.createFile(parentPath, finalFileName);
            await loadFolder(currentFolder || parentPath);
          } catch (error) {
            console.error("Error creating file:", error);
            alert(`Failed to create file: ${error}`);
          }
        },
      });
    },
    [currentFolder, loadFolder]
  );

  // Handle new folder
  const handleNewFolder = useCallback(
    (parentPath: string) => {
      setInputDialog({
        isOpen: true,
        title: "New Folder",
        placeholder: "Enter folder name",
        onSubmit: async (folderName: string) => {
          try {
            await localStorageFS.createFolder(parentPath, folderName);
            await loadFolder(currentFolder || parentPath);
          } catch (error) {
            console.error("Error creating folder:", error);
            alert(`Failed to create folder: ${error}`);
          }
        },
      });
    },
    [currentFolder, loadFolder]
  );

  // Handle rename
  const handleRename = useCallback(
    (itemId: string, currentName?: string) => {
      setInputDialog({
        isOpen: true,
        title: "Rename",
        placeholder: "Enter new name",
        defaultValue: currentName || "",
        onSubmit: async (newName: string) => {
          try {
            await localStorageFS.rename(itemId, newName);
            await loadFolder(currentFolder!);
          } catch (error) {
            console.error("Error renaming:", error);
            alert(`Failed to rename: ${error}`);
          }
        },
      });
    },
    [currentFolder, loadFolder]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (itemId: string) => {
      try {
        await localStorageFS.delete(itemId);
        await loadFolder(currentFolder!);
      } catch (error) {
        console.error("Error deleting:", error);
        alert(`Failed to delete: ${error}`);
      }
    },
    [currentFolder, loadFolder]
  );

  // Handle file select - open file in tab
  const handleFileSelect = useCallback(
    async (fileId: string) => {
      setSelectedFileId(fileId);

      // Check if tab already exists
      const existingTab = tabs.find((tab) => tab.filePath === fileId);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      // Create new tab
      try {
        const result = await localStorageFS.readFile(fileId);
        let content = result.content || "";

        // Convert markdown to HTML for TipTap if it's a markdown file
        const extension = fileId.split(".").pop()?.toLowerCase();
        if (extension === "md" || extension === "markdown") {
          if (content.trim() && !content.trim().startsWith("<")) {
            content = marked.parse(content) as string;
          }
        } else {
          // For non-markdown files, convert plain text to HTML paragraphs
          if (!content.trim().startsWith("<")) {
            const lines = content
              .split("\n")
              .filter((line) => line.trim());
            if (lines.length > 0) {
              content = lines.map((line) => `<p>${line}</p>`).join("");
            } else {
              content = "<p></p>";
            }
          }
        }

        const fileName = fileId.split("/").pop() || "Untitled";
        const newTab: TabData = {
          id: `tab-${Date.now()}-${Math.random()}`,
          filePath: fileId,
          fileName: fileName,
          isModified: false,
          content: content,
        };

        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
      } catch (error) {
        console.error("Error opening file:", error);
        alert(`Failed to open file: ${error}`);
      }
    },
    [tabs]
  );

  // Handle editor content change with auto-save
  const handleEditorChange = useCallback(
    (tabId: string, content: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, content, isModified: true } : t
        )
      );

      const existingTimeout = saveTimeouts.current.get(tabId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          const extension = tab.filePath.split(".").pop()?.toLowerCase();
          let contentToSave = content;

          if (extension === "md" || extension === "markdown") {
            contentToSave = turndownService.current.turndown(content);
          } else if (extension === "txt") {
            const div = document.createElement("div");
            div.innerHTML = content;
            contentToSave = div.textContent || div.innerText || "";
          }

          await localStorageFS.writeFile(tab.filePath, contentToSave);

          setTabs((prev) =>
            prev.map((t) =>
              t.id === tabId ? { ...t, isModified: false } : t
            )
          );

          setLastSaved(new Date());
        } catch (error) {
          console.error("Error auto-saving file:", error);
        }

        saveTimeouts.current.delete(tabId);
      }, 1000);

      saveTimeouts.current.set(tabId, timeout);
    },
    [tabs]
  );

  const handleEditorUpdate = useCallback(
    (_tabId: string, _isModified: boolean) => {},
    []
  );

  const handleChatInsert = useCallback(
    (content: string) => {
      if (activeTabId) {
        const tab = tabs.find((t) => t.id === activeTabId);
        if (tab) {
          const newContent = tab.content + "\n\n" + content;
          handleEditorChange(activeTabId, newContent);
        }
      }
    },
    [activeTabId, tabs, handleEditorChange]
  );

  const handleChatReplace = useCallback(
    (content: string) => {
      if (activeTabId) {
        handleEditorChange(activeTabId, content);
      }
    },
    [activeTabId, handleEditorChange]
  );

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((tab) => tab.id !== tabId);
        if (tabId === activeTabId) {
          if (newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
          } else {
            setActiveTabId(null);
          }
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  const handleTabCloseOthers = useCallback((tabId: string) => {
    setTabs((prev) => prev.filter((tab) => tab.id === tabId));
    setActiveTabId(tabId);
  }, []);

  const handleTabCloseAll = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const handleTabRevealInExplorer = useCallback(async (filePath: string) => {
    console.log("Reveal in explorer:", filePath);
  }, []);

  const handleTabRename = useCallback(
    async (tabId: string, newName: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      try {
        await localStorageFS.rename(tab.filePath, newName);
        const newPath = tab.filePath.replace(tab.fileName, newName);
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? { ...t, fileName: newName, filePath: newPath }
              : t
          )
        );

        if (currentFolder) {
          await loadFolder(currentFolder);
        }
      } catch (error) {
        console.error("Error renaming file:", error);
        alert(`Failed to rename file: ${error}`);
      }
    },
    [tabs, currentFolder, loadFolder]
  );

  const commands: Command[] = [
    {
      id: "open-folder",
      label: "Open Folder",
      description: "Open a folder to start working",
      category: "File",
      shortcut: "⌘O",
      action: handleOpenFolder,
    },
    {
      id: "new-file",
      label: "New File",
      description: "Create a new file",
      category: "File",
      shortcut: "⌘N",
      action: () => {
        if (currentFolder) {
          handleNewFile(currentFolder);
        } else {
          alert("Please open a folder first");
        }
      },
    },
    {
      id: "toggle-chat",
      label: "Toggle Chat Panel",
      description: "Show or hide the AI chat panel",
      category: "View",
      shortcut: "⌘⇧I",
      action: () => {
        setIsChatCollapsed(!isChatCollapsed);
      },
    },
    {
      id: "command-palette",
      label: "Show Command Palette",
      description: "Open the command palette",
      category: "General",
      shortcut: "⌘K",
      action: () => {
        setIsCommandPaletteOpen(true);
      },
    },
    {
      id: "settings",
      label: "Open Settings",
      description: "Open settings and preferences",
      category: "General",
      action: () => {
        setIsSettingsOpen(true);
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault();
        handleOpenFolder();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (currentFolder) {
          handleNewFile(currentFolder);
        }
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "i"
      ) {
        e.preventDefault();
        setIsChatCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleOpenFolder, handleNewFile, currentFolder]);

  useEffect(() => {
    return () => {
      saveTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      saveTimeouts.current.clear();
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <TopBar onOpenSettings={() => setIsSettingsOpen(true)} />
      <div className="flex overflow-hidden flex-1">
        <Sidebar
          currentFolder={currentFolder}
          files={files}
          selectedFileId={selectedFileId}
          onFileSelect={handleFileSelect}
          onOpenFolder={handleOpenFolder}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
        <div className="flex overflow-hidden flex-col flex-1">
          <TabStrip
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onTabCloseOthers={handleTabCloseOthers}
            onTabCloseAll={handleTabCloseAll}
            onTabRevealInExplorer={handleTabRevealInExplorer}
            onTabRename={handleTabRename}
          />

          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
            {activeTabId ? (
              (() => {
                const activeTab = tabs.find((t) => t.id === activeTabId);
                return activeTab ? (
                  <Editor
                    ref={editorRef}
                    content={activeTab.content || ""}
                    onChange={(content) =>
                      handleEditorChange(activeTab.id, content)
                    }
                    onUpdate={(isModified) =>
                      handleEditorUpdate(activeTab.id, isModified)
                    }
                    onCursorChange={(line, column) => {
                      setCursorPosition({ line, column });
                    }}
                    editable={true}
                  />
                ) : null;
              })()
            ) : (
              <div className="flex flex-col flex-1 gap-4 justify-center items-center p-8">
                <h1 className="text-xl font-semibold text-[var(--text-white)]">
                  Intellirite
                </h1>
                <p className="text-md text-[var(--text-secondary)]">
                  Desktop Writing IDE
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-4">
                  Click a file in the sidebar to open it
                </p>
              </div>
            )}
          </div>
        </div>

        <ChatPanel
          isCollapsed={isChatCollapsed}
          onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
          onInsertToEditor={handleChatInsert}
          onReplaceInEditor={handleChatReplace}
          editor={editorRef.current}
          currentFilePath={activeTabId ? tabs.find(t => t.id === activeTabId)?.filePath : undefined}
          currentFileName={activeTabId ? tabs.find(t => t.id === activeTabId)?.fileName : undefined}
          workspacePath={currentFolder}
          cursorPosition={cursorPosition}
        />
      </div>

      <StatusBar
        cursorPosition={cursorPosition}
        fileType={
          activeTabId
            ? tabs
                .find((t) => t.id === activeTabId)
                ?.fileName.split(".")
                .pop()
            : undefined
        }
        lastSaved={lastSaved}
        editorMode="Insert"
        isAIConnected={true}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <InputDialog
        isOpen={inputDialog.isOpen}
        onClose={() =>
          setInputDialog({
            isOpen: false,
            title: "",
            placeholder: "",
            defaultValue: "",
            onSubmit: () => {},
          })
        }
        onSubmit={inputDialog.onSubmit}
        title={inputDialog.title}
        placeholder={inputDialog.placeholder}
        defaultValue={inputDialog.defaultValue}
      />
    </div>
  );
}

export default App;

