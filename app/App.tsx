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
  ViewModeToggle,
  ReviewPanel,
  SectionAnalytics,
  CitationHeatmap,
  AutoToC,
  MissingCitationIndicator,
  FigureEditor,
  MathEditor,
  CitationDialog,
  TableInsertDialog,
  type CursorPosition,
  type Command,
  type ViewMode,
  type TabData,
} from "./components";
import { LoginPage } from "./components/auth/LoginPage";
import { OnboardingPage } from "./components/onboarding/OnboardingPage";
import { useAuth } from "./hooks/useAuth";
import type { FileItem } from "./shared/types";
import TurndownService from "turndown";
import { marked } from "marked";
import { localStorageFS } from "./lib/localStorageFS";
import {
  parseSectionsFromHTML,
  findSectionInEditor,
  addSectionToDocument,
  type Section,
} from "./utils/sectionParser";
import { exportToMarkdown } from "./lib/export/markdownExporter";
import { exportToLaTeX } from "./lib/export/latexExporter";
import { exportToDOCX } from "./lib/export/docxExporter";
import { calculateDocumentAnalytics } from "./utils/documentAnalytics";
import { researchPaperTemplate1 } from "./lib/templates/research-paper-template-1";

function App() {
  // Auth state
  const { user, loading: authLoading, refreshSession } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Check onboarding status when user is available
  useEffect(() => {
    if (user && hasCompletedOnboarding === null) {
      // User is logged in - check onboarding status
      const onboardingStatus = localStorage.getItem(`onboarding_completed_${user.id}`);
      setHasCompletedOnboarding(onboardingStatus === 'true');
    }
  }, [user, hasCompletedOnboarding]);

  // Handle OAuth callback
  useEffect(() => {
    // Check if we're coming back from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') || urlParams.has('state')) {
      // OAuth callback - refresh session after a short delay
      setTimeout(() => {
        refreshSession();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only check on mount
  const [currentFolder, setCurrentFolder] = useState<string | undefined>();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
  const [fileSystemReady, setFileSystemReady] = useState(false);

  // Section management
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<
    string | undefined
  >();
  const MAIN_FILE_PATH = "root/research-paper.md";

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

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("writing");

  // Review panel state
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);

  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Table of Contents toggle state
  const [showToC, setShowToC] = useState(false);

  // Insert dialog state
  const [showFigureDialog, setShowFigureDialog] = useState(false);
  const [showMathDialog, setShowMathDialog] = useState(false);
  const [showCitationDialog, setShowCitationDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [mathDialogIsBlock, setMathDialogIsBlock] = useState(true);

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

  // Initialize file system and create main file if needed
  useEffect(() => {
    const initialize = async () => {
      setFileSystemReady(true);
      // Auto-open root folder
      await handleOpenFolder();

      // Ensure main file exists
      try {
        const result = await localStorageFS.readFile(MAIN_FILE_PATH);
        if (!result.success) {
          // Create main file
          await localStorageFS.writeFile(
            MAIN_FILE_PATH,
            "# Research Paper\n\n"
          );
        }
        // Open main file
        if (tabs.length === 0) {
          await handleFileSelect(MAIN_FILE_PATH);
        }
      } catch (error) {
        console.error("Error initializing main file:", error);
      }
    };

    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Parse sections from editor content (defined early to avoid initialization issues)
  const updateSections = useCallback((content: string) => {
    try {
      const parsedSections = parseSectionsFromHTML(content);
      setSections(parsedSections);
    } catch (error) {
      console.error("Error parsing sections:", error);
      setSections([]);
    }
  }, []);

  // Handle file select - open file in tab (only one file for sections)
  const handleFileSelect = useCallback(
    async (fileId: string) => {
      setSelectedFileId(fileId);

      // Check if tab already exists
      const existingTab = tabs.find((tab) => tab.filePath === fileId);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        // Update sections
        try {
          const content = existingTab.content || "";
          const parsedSections = parseSectionsFromHTML(content);
          setSections(parsedSections);
        } catch (error) {
          console.error("Error parsing sections:", error);
          setSections([]);
        }
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
            const lines = content.split("\n").filter((line) => line.trim());
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

        // For section-based mode, only keep one tab open
        if (fileId === MAIN_FILE_PATH) {
          setTabs([newTab]);
        } else {
          setTabs((prev) => [...prev, newTab]);
        }
        setActiveTabId(newTab.id);
        // Update sections after tab is set
        setTimeout(() => {
          try {
            const parsedSections = parseSectionsFromHTML(content);
            setSections(parsedSections);
          } catch (error) {
            console.error("Error parsing sections:", error);
            setSections([]);
          }
        }, 0);
      } catch (error) {
        console.error("Error opening file:", error);
        alert(`Failed to open file: ${error}`);
      }
    },
    [tabs]
  );

  // Handle section select - scroll to section in editor
  const handleSectionSelect = useCallback(
    (sectionId: string, sectionName: string) => {
      setSelectedSectionId(sectionId);

      if (!editorRef.current) {
        console.warn("Editor not available");
        return;
      }

      // Find section in editor and scroll to it
      const position = findSectionInEditor(editorRef.current, sectionName);
      if (position !== null) {
        try {
          editorRef.current.commands.setTextSelection({
            from: position,
            to: position,
          });
          setTimeout(() => {
            const domPos = editorRef.current.view.domAtPos(position);
            if (domPos.node) {
              const element =
                domPos.node instanceof HTMLElement
                  ? domPos.node
                  : domPos.node.parentElement;
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }
          }, 50);
        } catch (error) {
          console.error("Error scrolling to section:", error);
        }
      }
    },
    []
  );

  // Handle editor content change with auto-save (defined before handleNewSection)
  const handleEditorChange = useCallback(
    (tabId: string, content: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, content, isModified: true } : t
        )
      );

      // Update sections when content changes
      if (tab.filePath === MAIN_FILE_PATH) {
        try {
          const parsedSections = parseSectionsFromHTML(content);
          setSections(parsedSections);
        } catch (error) {
          console.error("Error parsing sections:", error);
          setSections([]);
        }
      }

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
            prev.map((t) => (t.id === tabId ? { ...t, isModified: false } : t))
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

  // Handle new section creation
  const handleNewSection = useCallback(
    async (parentSectionId?: string, sectionName?: string) => {
      const getMainTab = () => {
        return (
          tabs.find((t) => t.filePath === MAIN_FILE_PATH) ||
          tabs.find((t) => t.id === activeTabId)
        );
      };

      const addSectionToTab = (tab: TabData, name: string) => {
        const content = tab.content || "";
        const markdown = turndownService.current.turndown(content);
        const newContent = addSectionToDocument(markdown, name, 2);
        const htmlContent = marked.parse(newContent) as string;
        handleEditorChange(tab.id, htmlContent);
      };

      if (sectionName) {
        // Direct creation
        const activeTab = getMainTab();
        if (activeTab) {
          addSectionToTab(activeTab, sectionName);
        } else {
          // Ensure main file is open first
          await handleFileSelect(MAIN_FILE_PATH);
          // Wait for tab to be created, then add section
          setTimeout(() => {
            const mainTab = getMainTab();
            if (mainTab) {
              addSectionToTab(mainTab, sectionName);
            }
          }, 200);
        }
        return;
      }

      // Show dialog
      setInputDialog({
        isOpen: true,
        title: "New Section",
        placeholder: "Enter section name",
        onSubmit: async (finalSectionName: string) => {
          const activeTab = getMainTab();
          if (activeTab) {
            addSectionToTab(activeTab, finalSectionName);
          } else {
            await handleFileSelect(MAIN_FILE_PATH);
            setTimeout(() => {
              const mainTab = getMainTab();
              if (mainTab) {
                addSectionToTab(mainTab, finalSectionName);
              }
            }, 200);
          }
        },
      });
    },
    [tabs, activeTabId, handleFileSelect, handleEditorChange]
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
            t.id === tabId ? { ...t, fileName: newName, filePath: newPath } : t
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

  // Handle insert research paper elements
  const handleInsert = useCallback(
    (
      type:
        | "title"
        | "abstract"
        | "introduction"
        | "methods"
        | "results"
        | "discussion"
        | "conclusion"
        | "figure"
        | "equation"
        | "citation"
        | "table"
    ) => {
      if (!editorRef.current) {
        alert("No editor available");
        return;
      }

      const editor = editorRef.current;

      switch (type) {
        case "title":
          // Insert a heading level 1 with "Title" placeholder
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Title" }],
            })
            .run();
          // Select the text so user can immediately type
          setTimeout(() => {
            const { state } = editor.view;
            const { doc } = state;
            const titleNode = doc.firstChild;
            if (titleNode && titleNode.type.name === "heading") {
              editor.commands.setTextSelection({
                from: titleNode.start + 1,
                to: titleNode.end - 1,
              });
            }
          }, 10);
          break;

        case "abstract":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Abstract" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "introduction":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Introduction" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "methods":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Methods" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "results":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Results" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "discussion":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Discussion" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "conclusion":
          editor
            .chain()
            .focus()
            .insertContent({
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Conclusion" }],
            })
            .insertContent({
              type: "paragraph",
              content: [{ type: "text", text: "" }],
            })
            .run();
          break;

        case "figure":
          setShowFigureDialog(true);
          break;

        case "equation":
          setMathDialogIsBlock(true);
          setShowMathDialog(true);
          break;

        case "citation":
          setShowCitationDialog(true);
          break;

        case "table":
          setShowTableDialog(true);
          break;
      }
    },
    []
  );

  // Handle figure insertion
  const handleInsertFigure = useCallback((figure: any) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    (editor.commands as any).insertFigure(figure);
    setShowFigureDialog(false);
  }, []);

  // Handle math insertion
  const handleInsertMath = useCallback((latex: string, isBlock: boolean) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    if (isBlock) {
      (editor.commands as any).insertEquation({ latex });
    } else {
      editor.chain().focus().setInlineMath(latex).run();
    }
    setShowMathDialog(false);
  }, []);

  // Handle citation insertion
  const handleInsertCitation = useCallback(
    (citationId: string, style: "apa" | "ieee" | "mla" | "acm") => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      (editor.commands as any).insertCitation(citationId, style);
      setShowCitationDialog(false);
    },
    []
  );

  // Handle table insertion
  const handleInsertTable = useCallback(
    (options: {
      rows: number;
      cols: number;
      withHeaderRow: boolean;
      caption?: string;
      label?: string;
    }) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      editor
        .chain()
        .focus()
        .insertTable({
          rows: options.rows,
          cols: options.cols,
          withHeaderRow: options.withHeaderRow,
        })
        .run();
      if (options.caption) {
        setTimeout(() => {
          (editor.commands as any).setTableCaption(
            options.caption,
            0,
            options.label || ""
          );
        }, 100);
      }
      setShowTableDialog(false);
    },
    []
  );

  // Handle formatting actions
  const handleFormat = useCallback(
    (
      action:
        | "bold"
        | "italic"
        | "underline"
        | "heading1"
        | "heading2"
        | "heading3"
        | "bulletList"
        | "orderedList"
        | "blockquote"
        | "codeBlock"
    ) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;

      switch (action) {
        case "bold":
          editor.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "underline":
          editor.chain().focus().toggleUnderline().run();
          break;
        case "heading1":
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case "heading2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "heading3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "bulletList":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "orderedList":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "blockquote":
          editor.chain().focus().toggleBlockquote().run();
          break;
        case "codeBlock":
          editor.chain().focus().toggleCodeBlock().run();
          break;
      }
    },
    []
  );

  // Handle export
  const handleExport = useCallback(
    async (format: "pdf" | "docx" | "latex" | "markdown") => {
      if (!editorRef.current) {
        alert("No editor available");
        return;
      }

      try {
        switch (format) {
          case "markdown": {
            const markdown = exportToMarkdown(editorRef.current);
            const blob = new Blob([markdown], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "research-paper.md";
            a.click();
            URL.revokeObjectURL(url);
            break;
          }
          case "latex": {
            const latex = exportToLaTeX(editorRef.current);
            const blob = new Blob([latex], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "research-paper.tex";
            a.click();
            URL.revokeObjectURL(url);
            break;
          }
          case "docx": {
            const blob = await exportToDOCX(editorRef.current);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "research-paper.docx";
            a.click();
            URL.revokeObjectURL(url);
            break;
          }
          case "pdf": {
            // PDF export via server-side API
            try {
              const html = editorRef.current.getHTML();
              const response = await fetch("/api/export/pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html, title: "research-paper" }),
              });

              if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "research-paper.pdf";
                a.click();
                URL.revokeObjectURL(url);
              } else {
                const data = await response.json();
                alert(
                  data.message ||
                    "PDF export is not fully configured. Install puppeteer for full functionality."
                );
              }
            } catch (error) {
              console.error("PDF export error:", error);
              alert("Error exporting PDF. Please check server configuration.");
            }
            break;
          }
        }
      } catch (error) {
        console.error("Export error:", error);
        alert(`Error exporting to ${format}: ${error}`);
      }
    },
    []
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
    {
      id: "review-panel",
      label: "Open Review Panel",
      description: "Open review panel for comments and track changes",
      category: "View",
      action: () => {
        setIsReviewPanelOpen(true);
      },
    },
    {
      id: "analytics",
      label: "Show Document Analytics",
      description: "View document statistics and citation metrics",
      category: "View",
      action: () => {
        setShowAnalytics(true);
        if (editorRef.current) {
          const analyticsData = calculateDocumentAnalytics(editorRef.current);
          setAnalytics(analyticsData);
        }
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

  // Show loading state only while checking auth
  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F7F8F4]">
        <div className="text-[#234E40] text-lg">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage onLoginSuccess={() => refreshSession()} />;
  }

  // Show onboarding if user hasn't completed it
  // If hasCompletedOnboarding is null, we're still checking, so show onboarding as default
  if (hasCompletedOnboarding !== true) {
    const handleOnboardingComplete = (projectType: 'research-paper' | 'other', template?: string) => {
      // Mark onboarding as completed
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      setHasCompletedOnboarding(true);

      // If research paper template selected, load it
      if (projectType === 'research-paper' && template === 'template-1') {
        // Load template into the editor
        setTimeout(() => {
          const templateContent = researchPaperTemplate1;
          // Create the research paper file with template content
          localStorageFS.writeFile(MAIN_FILE_PATH, templateContent).then(() => {
            // Create a new tab with the template
            const newTab: TabData = {
              id: `tab-${Date.now()}`,
              filePath: MAIN_FILE_PATH,
              fileName: "research-paper.md",
              isModified: false,
              content: templateContent,
            };
            setTabs([newTab]);
            setActiveTabId(newTab.id);
          }).catch((error) => {
            console.error('Failed to write template file:', error);
            // Still create the tab even if write fails
            const newTab: TabData = {
              id: `tab-${Date.now()}`,
              filePath: MAIN_FILE_PATH,
              fileName: "research-paper.md",
              isModified: false,
              content: templateContent,
            };
            setTabs([newTab]);
            setActiveTabId(newTab.id);
          });
        }, 100);
      }
    };

    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="w-full h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAI={() => setIsChatCollapsed(false)}
        onExport={handleExport}
        onInsert={handleInsert}
        onFormat={handleFormat}
        onViewModeChange={setViewMode}
        currentViewMode={viewMode}
        onToggleToC={() => setShowToC(!showToC)}
        showToC={showToC}
        onAddSource={(type) => {
          console.log("Add source:", type);
          // TODO: Implement source addition
        }}
        onCite={() => {
          // Get selected text from editor for citation search
          let searchQuery = "";
          if (editorRef.current) {
            const { from, to } = editorRef.current.state.selection;
            const selectedText = editorRef.current.state.doc.textBetween(from, to);
            if (selectedText.trim()) {
              searchQuery = selectedText.trim();
            }
          }
          
          // If no selection, get text around cursor (last sentence or paragraph)
          if (!searchQuery && editorRef.current) {
            const { $from } = editorRef.current.state.selection;
            const currentParagraph = $from.node($from.depth);
            if (currentParagraph && currentParagraph.textContent) {
              // Get last 100 characters as context
              const text = currentParagraph.textContent;
              searchQuery = text.slice(Math.max(0, text.length - 100));
            }
          }
          
          setShowCitationDialog(true);
          // Pass search query will be handled by CitationDialog's initialSearchQuery prop
        }}
      />
      <div className="flex overflow-hidden flex-1">
        <Sidebar
          currentFolder={currentFolder}
          files={files}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionSelect={handleSectionSelect}
          onOpenFolder={handleOpenFolder}
          onNewSection={handleNewSection}
          onRename={handleRename}
          onDelete={handleDelete}
          // Legacy props
          selectedFileId={selectedFileId}
          onFileSelect={handleFileSelect}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
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
                  <>
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
                      viewMode={viewMode}
                    />
                  </>
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
          currentFilePath={
            activeTabId
              ? tabs.find((t) => t.id === activeTabId)?.filePath
              : undefined
          }
          currentFileName={
            activeTabId
              ? tabs.find((t) => t.id === activeTabId)?.fileName
              : undefined
          }
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

      {/* Review Panel */}
      <ReviewPanel
        editor={editorRef.current}
        isOpen={isReviewPanelOpen}
        onClose={() => setIsReviewPanelOpen(false)}
      />

      {/* Missing Citation Indicator - Disabled to avoid interfering with chatbox */}
      {/* <MissingCitationIndicator editor={editorRef.current} /> */}

      {/* Analytics Panel (can be toggled via command palette or button) */}
      {showAnalytics && analytics && (
        <div className="fixed bottom-4 left-4 w-96 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-4 z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Document Analytics
            </h3>
            <button
              onClick={() => setShowAnalytics(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
          <SectionAnalytics analytics={analytics} />
          <div className="mt-4">
            <CitationHeatmap analytics={analytics} />
          </div>
        </div>
      )}

      {/* Auto Table of Contents - Toggleable */}
      {activeTabId && editorRef.current && showToC && (
        <div className="fixed top-20 right-4 w-64 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg p-4 z-40 max-h-[60vh] overflow-y-auto">
          <AutoToC
            editor={editorRef.current}
            onItemClick={(pos) => {
              editorRef.current?.commands.setTextSelection(pos);
            }}
          />
        </div>
      )}

      {/* Insert Dialogs */}
      <FigureEditor
        editor={editorRef.current}
        isOpen={showFigureDialog}
        onClose={() => setShowFigureDialog(false)}
        onInsert={handleInsertFigure}
      />
      <MathEditor
        editor={editorRef.current}
        isOpen={showMathDialog}
        onClose={() => setShowMathDialog(false)}
        onInsert={handleInsertMath}
        isBlock={mathDialogIsBlock}
      />
      <CitationDialog
        editor={editorRef.current}
        isOpen={showCitationDialog}
        onClose={() => setShowCitationDialog(false)}
        onInsert={handleInsertCitation}
        initialSearchQuery={
          editorRef.current?.state.selection
            ? editorRef.current.state.doc.textBetween(
                editorRef.current.state.selection.from,
                editorRef.current.state.selection.to
              ).trim() || undefined
            : undefined
        }
      />
      <TableInsertDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleInsertTable}
      />
    </div>
  );
}

export default App;
