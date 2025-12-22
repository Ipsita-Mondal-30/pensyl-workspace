"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronRightIcon } from "../ui/Icons";
import {
  getAvailableModels,
  type BackendModel,
} from "../../services/backend-ai.service";
import ReactMarkdown from "react-markdown";
import { useAIChat } from "../../hooks/useAIChat";
import type { Editor } from "@tiptap/react";
import { PatchPreview } from "./PatchPreview";
import {
  parseAIResponse,
  applyPatch,
  applyPatches,
  type Patch,
} from "../../utils/patchParser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  patches?: Patch[];
  hasPatches?: boolean;
}

interface ChatPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onInsertToEditor?: (content: string) => void;
  onReplaceInEditor?: (content: string) => void;
  // AI Context props
  editor?: Editor | null;
  currentFilePath?: string;
  currentFileName?: string;
  workspacePath?: string;
  cursorPosition?: { line: number; column: number };
}

/**
 * ChatPanel - AI Chat Panel UI (UI only, no backend)
 */
export function ChatPanel({
  isCollapsed = false,
  onToggleCollapse,
  onInsertToEditor,
  onReplaceInEditor,
  editor,
  currentFilePath,
  currentFileName,
  workspacePath,
  cursorPosition,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Pensyl AI, your intelligent research paper assistant.\n\nI can help you:\n- Answer questions about your research paper\n- Explain concepts and improve your writing\n- Edit and enhance your paper\n- Reference multiple files with @filename\n\nI have access to your current file and can see the full context. Just ask me anything!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<BackendModel[]>([]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [contextFiles, setContextFiles] = useState<string[]>([]);
  const [showPatchTest, setShowPatchTest] = useState(false);
  const [patchTestLineNumber, setPatchTestLineNumber] = useState<string>("");
  const [patchTestText, setPatchTestText] = useState<string>("");
  const [showLineViewer, setShowLineViewer] = useState(false);

  // AI Chat hook for context awareness
  const { sendAIMessage, extractFileReferences } = useAIChat();

  // Get current file content from editor
  const currentFileContent = editor
    ? editor.getText
      ? editor.getText()
      : editor.state?.doc?.textContent || ""
    : "";

  // Debug: Log when content changes
  useEffect(() => {
    console.log("📝 ChatPanel context updated:", {
      hasEditor: !!editor,
      contentLength: currentFileContent?.length || 0,
      fileName: currentFileName,
      filePath: currentFilePath,
    });
  }, [editor, currentFileContent, currentFileName, currentFilePath]);

  // Update context files indicator when props change
  useEffect(() => {
    const files: string[] = [];
    if (currentFileName) {
      files.push(currentFileName);
    }
    // Extract @file references from input
    if (inputValue) {
      const refs = extractFileReferences(inputValue);
      files.push(...refs);
    }
    setContextFiles([...new Set(files)]); // Remove duplicates
  }, [currentFileName, inputValue, extractFileReferences]);

  // Load available models from backend on mount
  useEffect(() => {
    getAvailableModels()
      .then((models) => {
        if (models.length > 0) {
          setAvailableModels(models);
          // Set default to first cheap model (costTier === 1) or first model
          const defaultModel =
            models.find((m) => m.costTier === 1) || models[0];
          if (defaultModel) {
            setSelectedModel(defaultModel.id);
          }
        } else {
          // No models available from backend, use a fallback default
          console.warn("No models available from backend, using fallback");
          setSelectedModel("openrouter/deepseek-chat");
        }
      })
      .catch((error) => {
        console.error("Failed to load models from backend:", error);
        // Set a default model ID if backend fails
        setSelectedModel("openrouter/deepseek-chat");
      });
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Close model selector on outside click
  useEffect(() => {
    if (!showModelSelector) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".relative")) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showModelSelector]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Helper: Count block nodes (visual lines) in the document
  const countBlockNodes = (editor: Editor | null): number => {
    if (!editor) return 0;
    const { state } = editor.view;
    const { doc } = state;
    let count = 0;
    doc.descendants((node) => {
      if (
        node.isBlock &&
        (node.type.name === "paragraph" ||
          node.type.name.startsWith("heading") ||
          node.type.name === "codeBlock" ||
          node.type.name === "blockquote")
      ) {
        count++;
      }
      return true;
    });
    return count;
  };

  // Helper: Generate JSON with line-wise text for debugging
  const generateLineWiseJSON = (): string => {
    if (!editor) {
      return JSON.stringify({ error: "Editor not available" }, null, 2);
    }

    const { state } = editor.view;
    const { doc } = state;
    const lines: Array<{
      lineNumber: number;
      type: string;
      text: string;
      textPreview: string;
      isEmpty: boolean;
      charCount: number;
      estimatedVisualLines: number;
      position: number;
      endPosition: number;
      nodeSize: number;
    }> = [];

    let lineNumber = 1;
    doc.descendants((node, pos) => {
      if (
        node.isBlock &&
        (node.type.name === "paragraph" ||
          node.type.name.startsWith("heading") ||
          node.type.name === "codeBlock" ||
          node.type.name === "blockquote")
      ) {
        const text = node.textContent || "";
        const isEmpty = text.trim() === "";
        const charCount = text.length;
        // Estimate visual lines (assuming ~80 chars per line)
        const estimatedVisualLines =
          charCount === 0 ? 1 : Math.max(1, Math.ceil(charCount / 80));
        // Create a preview: first 100 chars or "[EMPTY]"
        const textPreview = isEmpty
          ? "[EMPTY]"
          : text.substring(0, 100) + (text.length > 100 ? "..." : "");
        const endPos = pos + node.nodeSize;

        lines.push({
          lineNumber: lineNumber++,
          type: node.type.name,
          text: text,
          textPreview: textPreview,
          isEmpty: isEmpty,
          charCount: charCount,
          estimatedVisualLines: estimatedVisualLines,
          position: pos,
          endPosition: endPos,
          nodeSize: node.nodeSize,
        });
      }
      return true;
    });

    return JSON.stringify(
      {
        totalLines: lines.length,
        documentSize: doc.content.size,
        note: "⚠️ IMPORTANT: Line numbers = Block nodes (paragraphs/headings), NOT visual wrapped lines on screen!",
        explanation: {
          blockNodes:
            "Each 'line' is ONE structural element (paragraph, heading, etc.)",
          visualLines:
            "A long paragraph might display as 20+ visual lines but counts as 1 block",
          emptyParagraphs: "Empty paragraphs still count as lines",
          insertion:
            "To insert 'at line N', we insert BEFORE the Nth block node",
        },
        lines: lines,
      },
      null,
      2
    );
  };

  // Helper: Find ProseMirror position for a given line number (counting block nodes)
  // Line numbers are 1-indexed: Line 1 = first block, Line 2 = second block, etc.
  const findBlockNodePosition = (
    editor: Editor,
    targetLineNum: number
  ): number => {
    const { state } = editor.view;
    const { doc } = state;

    // Collect all block nodes (paragraphs, headings, etc.) - each represents a visual line
    const blockNodes: Array<{ pos: number; endPos: number; type: string }> = [];

    doc.descendants((node, pos) => {
      // Count block-level nodes that represent visual lines
      if (
        node.isBlock &&
        (node.type.name === "paragraph" ||
          node.type.name.startsWith("heading") ||
          node.type.name === "codeBlock" ||
          node.type.name === "blockquote")
      ) {
        // Get the end position of this block (after the closing tag)
        const endPos = pos + node.nodeSize;
        blockNodes.push({ pos, endPos, type: node.type.name });
      }
      return true;
    });

    console.log(`📊 Found ${blockNodes.length} block nodes in document`);
    console.log(`🎯 Target line: ${targetLineNum}`);

    // If inserting at line 1, insert at the start of the document (before first block)
    if (targetLineNum === 1) {
      return 1; // Position 1 is right after the document start
    }

    // If target line is beyond the last block, insert at the end
    if (targetLineNum > blockNodes.length + 1) {
      const lastBlock = blockNodes[blockNodes.length - 1];
      console.log(
        `📍 Inserting at end (after last block): ${lastBlock?.endPos}`
      );
      return lastBlock ? lastBlock.endPos : doc.content.size - 1;
    }

    // Line numbers map to block nodes: Line 1 = block 0, Line 2 = block 1, etc.
    // To insert "at line N", we insert BEFORE the Nth block (index N-1)
    // This pushes existing content down and makes new content become line N

    const targetBlockIndex = targetLineNum - 1; // Convert to 0-indexed (Line 1 = block 0)

    if (targetBlockIndex < 0) {
      return 1; // Before first block
    }

    if (targetBlockIndex >= blockNodes.length) {
      // Inserting after the last block - insert at the end
      const lastBlock = blockNodes[blockNodes.length - 1];
      console.log(
        `📍 Inserting at end (after last block at line ${blockNodes.length})`
      );
      return lastBlock ? lastBlock.endPos : doc.content.size - 1;
    }

    // Insert BEFORE the target block
    // In ProseMirror, to insert a block before another block, we need to find
    // the position in the parent container (usually the document) where this block starts
    const targetBlock = blockNodes[targetBlockIndex];

    // The position from descendants is the absolute position in the document
    // For insertContentAt, we can use this position directly - TipTap will handle
    // inserting the block at the correct location
    console.log(
      `📍 Inserting BEFORE block ${targetBlockIndex} (${targetBlock.type}) at line ${targetLineNum}: pos=${targetBlock.pos}`
    );

    // Return the position of the target block - insertContentAt will insert before it
    return targetBlock.pos;
  };

  // Handle patch test - manually apply patch at specific line
  const handlePatchTest = () => {
    if (!editor) {
      alert("Editor not available");
      return;
    }

    const lineNum = parseInt(patchTestLineNumber, 10);
    if (isNaN(lineNum) || lineNum < 1) {
      alert("Please enter a valid line number (>= 1)");
      return;
    }

    if (!patchTestText.trim()) {
      alert("Please enter text to insert");
      return;
    }

    try {
      const { state } = editor.view;
      const { doc } = state;

      // Count block nodes to show user how many lines exist
      const blockNodes: Array<{ type: string; pos: number }> = [];
      doc.descendants((node, pos) => {
        if (
          node.isBlock &&
          (node.type.name === "paragraph" ||
            node.type.name.startsWith("heading") ||
            node.type.name === "codeBlock" ||
            node.type.name === "blockquote")
        ) {
          blockNodes.push({ type: node.type.name, pos });
        }
        return true;
      });

      const totalLines = blockNodes.length;
      console.log("🧪 Patch Test - Applying patch at line:", lineNum);
      console.log(
        "📄 Current document has",
        totalLines,
        "block nodes (visual lines)"
      );

      if (lineNum > totalLines + 1) {
        alert(
          `Line number ${lineNum} is beyond document end (${totalLines} lines). Use ${
            totalLines + 1
          } to insert at the end.`
        );
        return;
      }

      // Find the ProseMirror position for this line number
      const insertPos = findBlockNodePosition(editor, lineNum);
      console.log("📍 ProseMirror insert position:", insertPos);
      console.log("📊 Document size:", doc.content.size);
      console.log(
        "📊 Block nodes:",
        blockNodes.map((b, i) => `Line ${i + 1}: ${b.type} at pos ${b.pos}`)
      );

      // Validate position
      if (insertPos < 1 || insertPos >= doc.content.size) {
        console.warn(
          `⚠️ Invalid position ${insertPos}, clamping to valid range`
        );
        const clampedPos = Math.max(
          1,
          Math.min(insertPos, doc.content.size - 1)
        );
        console.log(`📍 Using clamped position: ${clampedPos}`);
      }

      // Convert the text to HTML (each line becomes a paragraph)
      const htmlContent = patchTestText
        .split("\n")
        .filter((line) => line.trim() !== "") // Remove empty lines
        .map((line) => `<p>${line.trim()}</p>`)
        .join("");

      // If no content after filtering, use a single paragraph
      const finalHtmlContent = htmlContent || `<p>${patchTestText.trim()}</p>`;

      console.log("📝 HTML content to insert:", finalHtmlContent);

      // Insert HTML content at the calculated position using TipTap
      // This preserves the document structure and formatting
      if (editor.commands) {
        // Clamp position to valid range
        const pos = Math.max(1, Math.min(insertPos, doc.content.size - 1));

        console.log(
          `🔧 Attempting to insert at position ${pos} (document size: ${doc.content.size})`
        );

        // Try to insert - TipTap's insertContentAt should handle block insertion
        try {
          editor.commands.insertContentAt(pos, finalHtmlContent);
          console.log("✅ Patch test applied successfully");
          alert(`✅ Patch applied! Text inserted at line ${lineNum}`);
        } catch (insertError: any) {
          console.error("❌ Insert failed:", insertError);
          // Fallback: try inserting at a slightly different position
          const fallbackPos = pos > 1 ? pos - 1 : pos + 1;
          console.log(`🔄 Trying fallback position: ${fallbackPos}`);
          try {
            editor.commands.insertContentAt(fallbackPos, finalHtmlContent);
            console.log("✅ Patch test applied with fallback position");
            alert(
              `✅ Patch applied! Text inserted at line ${lineNum} (used fallback position)`
            );
          } catch (fallbackError: any) {
            console.error("❌ Fallback insert also failed:", fallbackError);
            alert(
              `Failed to insert: ${fallbackError.message || "Invalid position"}`
            );
          }
        }
      } else {
        console.error("❌ Cannot apply patch: no editor commands");
        alert("Failed to apply patch: Editor commands not available");
      }

      // Close dialog and reset
      setShowPatchTest(false);
      setPatchTestLineNumber("");
      setPatchTestText("");
    } catch (error: any) {
      console.error("❌ Patch test failed:", error);
      alert(`Failed to apply patch: ${error.message}`);
    }
  };

  // Helper: Convert markdown-style text to HTML
  const convertTextToHTML = (text: string): string => {
    const lines = text.split("\n");
    const htmlLines: string[] = [];

    // Common heading keywords for research papers
    const headingKeywords = [
      "abstract",
      "introduction",
      "background",
      "methodology",
      "methods",
      "results",
      "discussion",
      "conclusion",
      "references",
      "bibliography",
      "acknowledgments",
      "appendix",
      "summary",
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        // Empty line - skip (don't add empty paragraphs between sections)
        continue;
      }

      // Check for markdown headings (# Heading)
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        htmlLines.push(`<h${level}>${text}</h${level}>`);
        continue;
      }

      // Check for heading-like text:
      // - Short line (< 60 chars)
      // - Title case or all caps
      // - Followed by blank line or is a known heading keyword
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
      const isShort = trimmed.length < 60;
      const isHeadingKeyword = headingKeywords.some(
        (kw) =>
          trimmed.toLowerCase() === kw || trimmed.toLowerCase() === kw + "s"
      );
      const isTitleCase = /^[A-Z][a-z]/.test(trimmed);
      const followedByBlank = nextLine === "";

      if (isShort && (isHeadingKeyword || (isTitleCase && followedByBlank))) {
        // Treat as heading (h2 by default for sections)
        htmlLines.push(`<h2>${trimmed}</h2>`);
        continue;
      }

      // Check for list items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        htmlLines.push(`<li>${trimmed.substring(2)}</li>`);
        continue;
      }

      // Check for numbered list
      if (/^\d+\.\s+/.test(trimmed)) {
        htmlLines.push(`<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
        continue;
      }

      // Regular paragraph
      htmlLines.push(`<p>${trimmed}</p>`);
    }

    return htmlLines.join("");
  };

  // Handle accepting a patch
  const handleAcceptPatch = async (patch: Patch) => {
    console.log("🔧 Applying patch:", patch);

    if (!editor) {
      console.error("❌ Cannot apply patch: no editor instance");
      alert("Editor not available. Please try again.");
      return;
    }

    try {
      // Validate patch has required fields
      if (!patch.target || !patch.type) {
        console.error("❌ Invalid patch format:", patch);
        alert("Invalid patch format. Missing target or type.");
        return;
      }

      const { startLine, endLine } = patch.target;
      console.log(
        `📍 Applying ${patch.type} patch at lines ${startLine}-${endLine}`
      );

      const { state } = editor.view;
      const { doc } = state;

      // For DELETE operations
      if (patch.type === "delete") {
        // Find the position range to delete
        const startPos = findBlockNodePosition(editor, startLine);
        const endPos = findBlockNodePosition(editor, endLine + 1); // +1 to delete up to and including endLine

        console.log(`🗑️ Deleting from position ${startPos} to ${endPos}`);

        // Delete the content
        editor.commands.deleteRange({ from: startPos, to: endPos });
        console.log("✅ Delete patch applied successfully");
        return;
      }

      // For INSERT and REPLACE operations
      if (!patch.content) {
        console.error("❌ Patch has no content:", patch);
        alert("Patch has no content to insert/replace.");
        return;
      }

      // Find the insertion position
      const insertPos = findBlockNodePosition(editor, startLine);
      console.log(`📍 Inserting at position ${insertPos}`);

      // Convert patch content to HTML (handle markdown formatting)
      const htmlContent = convertTextToHTML(patch.content);
      console.log("📝 HTML content to insert:", htmlContent.substring(0, 200));

      // For REPLACE: delete the old content first
      if (patch.type === "replace") {
        const endPos = findBlockNodePosition(editor, endLine + 1);
        console.log(`🔄 Replacing from position ${insertPos} to ${endPos}`);
        editor.commands.deleteRange({ from: insertPos, to: endPos });
      }

      // Insert the new content at the calculated position
      // Clamp position to valid range
      const pos = Math.max(1, Math.min(insertPos, doc.content.size - 1));

      try {
        editor.commands.insertContentAt(pos, htmlContent);
        console.log("✅ Patch applied successfully with formatting preserved");
      } catch (insertError: any) {
        console.error("❌ Insert failed:", insertError);
        // Fallback: try inserting at a slightly different position
        const fallbackPos = pos > 1 ? pos - 1 : pos + 1;
        console.log(`🔄 Trying fallback position: ${fallbackPos}`);
        editor.commands.insertContentAt(fallbackPos, htmlContent);
        console.log("✅ Patch applied with fallback position");
      }
    } catch (error) {
      console.error("❌ Error applying patch:", error);
      alert(
        `Failed to apply patch: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle rejecting a patch
  const handleRejectPatch = (patch: Patch) => {
    console.log("❌ Patch rejected:", patch);
    // Optionally, remove the patch from the message
  };

  // Handle accepting all patches
  const handleAcceptAllPatches = async (patches: Patch[]) => {
    console.log("🔧 Applying all patches:", patches.length);

    if (!editor) {
      console.error("❌ Cannot apply patches: no editor instance");
      alert("Editor not available. Please try again.");
      return;
    }

    try {
      // Apply patches one by one using the same logic as handleAcceptPatch
      for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        console.log(`📍 Applying patch ${i + 1}/${patches.length}:`, patch);

        try {
          await handleAcceptPatch(patch);
        } catch (error) {
          console.error(`❌ Failed to apply patch ${i + 1}:`, error);
          // Continue with next patch even if one fails
        }
      }

      console.log(`✅ Applied ${patches.length} patches successfully`);
    } catch (error) {
      console.error("❌ Error applying patches:", error);
      alert(
        `Failed to apply patches: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle rejecting all patches
  const handleRejectAllPatches = (patches: Patch[]) => {
    console.log(`❌ Rejected ${patches.length} patches`);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Create a placeholder assistant message that will be updated with streaming
    const assistantMessageId = `msg-${Date.now()}-ai`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Use AI-aware message sending with context
      let fullResponse = "";
      abortControllerRef.current = new AbortController();

      // Send message with full context (editor, files, etc.)
      for await (const chunk of sendAIMessage(userInput, messages, {
        editor: editor || undefined,
        currentFilePath,
        currentFileName,
        workspacePath,
        cursorInfo: cursorPosition,
        selectedModelId: selectedModel, // Pass selected model ID
      })) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        fullResponse += chunk;

        // Update the assistant message with streaming content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      }

      // Parse response for patches after streaming completes
      console.log("[ChatPanel] Parsing AI response for patches...", {
        responseLength: fullResponse.length,
        responsePreview: fullResponse.substring(0, 200),
      });

      const { hasPatches, patches, textContent } = parseAIResponse(
        fullResponse,
        currentFileName || undefined
      );

      console.log("[ChatPanel] Parsed AI response:", {
        hasPatches,
        patchCount: patches.length,
        patches: patches,
        textContentPreview: textContent.substring(0, 100),
      });

      // Update message with parsed patches
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: textContent || fullResponse,
                hasPatches,
                patches,
              }
            : msg
        )
      );
    } catch (error: any) {
      console.error("Error getting AI response:", error);

      // Update message with error
      const errorMsg = error?.message || "Failed to get response from AI";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `❌ Error: ${errorMsg}\n\nPlease check:\n- Your internet connection\n- API key is valid\n- Model name is correct`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col items-center py-2">
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors"
          aria-label="Expand chat panel"
        >
          <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)] rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] flex flex-col h-full">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--border-primary)] shrink-0">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Pensyl Chat
        </h2>
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors shrink-0"
          aria-label="Collapse chat panel"
        >
          <ChevronRightIcon className="w-3 h-3 text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="overflow-y-auto flex-1">
        <div className="px-4 py-4 space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              formatTime={formatTime}
              onInsert={onInsertToEditor}
              onReplace={onReplaceInEditor}
              currentFileContent={currentFileContent}
              currentFileName={currentFileName}
              onAcceptPatch={handleAcceptPatch}
              onRejectPatch={handleRejectPatch}
              onAcceptAllPatches={handleAcceptAllPatches}
              onRejectAllPatches={handleRejectAllPatches}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border-primary)] p-4 shrink-0 bg-[var(--bg-secondary)]">
        {/* Patch Test and View Lines Buttons */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowPatchTest(true)}
            className="text-[11px] px-2 py-1 bg-purple-600 hover:bg-purple-700 border border-purple-500 rounded text-white transition-all duration-150 flex items-center gap-1.5"
            title="Test patch insertion"
          >
            <span>🧪 Patch Test</span>
          </button>
          <button
            onClick={() => setShowLineViewer(true)}
            className="text-[11px] px-2 py-1 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded text-white transition-all duration-150 flex items-center gap-1.5"
            title="View document lines as JSON"
          >
            <span>📋 View Lines</span>
          </button>
        </div>

        {/* Patch Test Dialog */}
        {showPatchTest && (
          <div
            className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50"
            onClick={() => setShowPatchTest(false)}
          >
            <div
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                🧪 Patch Test
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                    Line Number (to insert at):
                  </label>
                  <input
                    type="number"
                    value={patchTestLineNumber}
                    onChange={(e) => setPatchTestLineNumber(e.target.value)}
                    placeholder="e.g., 5"
                    min="1"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    autoFocus
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Current document has {countBlockNodes(editor || null)} block
                    nodes (visual lines)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-primary)]">
                    Text to Insert:
                  </label>
                  <textarea
                    value={patchTestText}
                    onChange={(e) => setPatchTestText(e.target.value)}
                    placeholder="Enter text to insert at the specified line..."
                    rows={4}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowPatchTest(false);
                      setPatchTestLineNumber("");
                      setPatchTestText("");
                    }}
                    className="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePatchTest}
                    className="px-4 py-2 text-white bg-purple-600 rounded transition-colors hover:bg-purple-700"
                  >
                    Apply Patch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Lines Dialog */}
        {showLineViewer && (
          <div
            className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50"
            onClick={() => setShowLineViewer(false)}
          >
            <div
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-6xl w-full mx-4 shadow-xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    📋 Document Structure (Block Nodes)
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    ⚠️ Line numbers = block nodes (not visual wrapped lines)
                  </p>
                </div>
                <button
                  onClick={() => setShowLineViewer(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="w-5 h-5"
                  >
                    <path
                      d="M15 5L5 15M5 5L15 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Tabs for Table vs JSON view */}
              <div className="flex gap-2 mb-3 border-b border-[var(--border-primary)]">
                <button
                  onClick={() => {
                    const tab = document.getElementById("lines-table-view");
                    const jsonTab = document.getElementById("lines-json-view");
                    if (tab && jsonTab) {
                      tab.style.display = "block";
                      jsonTab.style.display = "none";
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-t transition-colors"
                >
                  📊 Table
                </button>
                <button
                  onClick={() => {
                    const tab = document.getElementById("lines-table-view");
                    const jsonTab = document.getElementById("lines-json-view");
                    if (tab && jsonTab) {
                      tab.style.display = "none";
                      jsonTab.style.display = "block";
                    }
                  }}
                  className="px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-t transition-colors"
                >
                  📋 JSON
                </button>
              </div>

              {/* Table View */}
              <div id="lines-table-view" className="overflow-auto flex-1 mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                    <tr>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Line#
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Type
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Status
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Chars
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Est. Visual
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Position
                      </th>
                      <th className="text-left p-2 font-semibold text-[var(--text-primary)]">
                        Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      if (!editor) return null;
                      const { state } = editor.view;
                      const { doc } = state;
                      const rows: React.ReactElement[] = [];
                      let lineNum = 1;

                      doc.descendants((node, pos) => {
                        if (
                          node.isBlock &&
                          (node.type.name === "paragraph" ||
                            node.type.name.startsWith("heading") ||
                            node.type.name === "codeBlock" ||
                            node.type.name === "blockquote")
                        ) {
                          const text = node.textContent || "";
                          const isEmpty = text.trim() === "";
                          const charCount = text.length;
                          const estVisual =
                            charCount === 0
                              ? 1
                              : Math.max(1, Math.ceil(charCount / 80));
                          const preview = isEmpty
                            ? "[EMPTY]"
                            : text.substring(0, 60) +
                              (text.length > 60 ? "..." : "");

                          rows.push(
                            <tr
                              key={lineNum}
                              className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <td className="p-2 font-mono font-semibold text-[var(--accent-primary)]">
                                {lineNum}
                              </td>
                              <td className="p-2 text-[var(--text-secondary)]">
                                <code className="text-xs bg-[var(--bg-primary)] px-1 py-0.5 rounded">
                                  {node.type.name}
                                </code>
                              </td>
                              <td className="p-2">
                                {isEmpty ? (
                                  <span className="text-orange-400">
                                    ⚠️ Empty
                                  </span>
                                ) : estVisual > 10 ? (
                                  <span className="text-yellow-400">
                                    ⚠️ Long
                                  </span>
                                ) : (
                                  <span className="text-green-400">
                                    ✓ Normal
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-[var(--text-secondary)] font-mono">
                                {charCount}
                              </td>
                              <td className="p-2 text-[var(--text-secondary)] font-mono">
                                ~{estVisual} lines
                              </td>
                              <td className="p-2 text-[var(--text-tertiary)] font-mono text-[10px]">
                                {pos}-{pos + node.nodeSize}
                              </td>
                              <td className="p-2 text-[var(--text-secondary)] max-w-md truncate">
                                <span className={isEmpty ? "italic" : ""}>
                                  {preview}
                                </span>
                              </td>
                            </tr>
                          );
                          lineNum++;
                        }
                        return true;
                      });

                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>

              {/* JSON View */}
              <div
                id="lines-json-view"
                className="overflow-auto flex-1 mb-4"
                style={{ display: "none" }}
              >
                <pre className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded p-4 text-xs text-[var(--text-primary)] overflow-auto font-mono whitespace-pre-wrap break-words">
                  {generateLineWiseJSON()}
                </pre>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    const json = generateLineWiseJSON();
                    navigator.clipboard.writeText(json);
                    alert("✅ JSON copied to clipboard!");
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => setShowLineViewer(false)}
                  className="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Model Selector - Cursor style, above input */}
        <div className="relative mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowModelSelector(!showModelSelector);
              setModelSearchQuery("");
            }}
            className="text-[11px] px-2 py-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center gap-1.5 group"
            title="Select AI model"
          >
            <span className="text-xs font-medium">
              {availableModels.find((m) => m.id === selectedModel)?.name ||
                selectedModel ||
                "Select Model"}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={`transition-transform duration-150 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] ${
                showModelSelector ? "rotate-180" : ""
              }`}
            >
              <path
                d="M2.5 3.5L5 6L7.5 3.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Model Selector Dropdown - Compact, positioned to not shift UI */}
          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md shadow-2xl py-1.5 w-[260px] max-h-[320px] overflow-hidden flex flex-col z-50">
              {/* Search Input */}
              <div className="px-2 pb-1.5 mb-1">
                <div className="relative">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                  >
                    <path
                      d="M4.5 8C6.433 8 8 6.433 8 4.5C8 2.567 6.433 1 4.5 1C2.567 1 1 2.567 1 4.5C1 6.433 2.567 8 4.5 8Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.5 7.5L10 10"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-6 pr-2 py-1 text-[11px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Model List */}
              <div className="overflow-y-auto flex-1 px-1">
                {(() => {
                  // Filter models by search query
                  const filtered = availableModels.filter(
                    (model) =>
                      model.name
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase()) ||
                      model.description
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase()) ||
                      model.id
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase())
                  );

                  // Sort all models by cost tier (cheapest first), then by name
                  const sorted = [...filtered].sort((a, b) => {
                    if (a.costTier !== b.costTier) {
                      return a.costTier - b.costTier;
                    }
                    return a.name.localeCompare(b.name);
                  });

                  if (sorted.length === 0) {
                    return (
                      <div className="px-2.5 py-4 text-[11px] text-[var(--text-tertiary)] text-center">
                        No models found
                      </div>
                    );
                  }

                  return (
                    <div className="py-0.5">
                      {sorted.map((model) => {
                        const isSelected = selectedModel === model.id;
                        const costBadge =
                          model.costTier === 1
                            ? "💰"
                            : model.costTier === 2
                            ? "💵"
                            : model.costTier === 3
                            ? "💸"
                            : "💳";

                        return (
                          <button
                            key={model.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModel(model.id);
                              setShowModelSelector(false);
                              setModelSearchQuery("");
                            }}
                            className={`
                              w-full text-left px-2 py-1.5 text-[11px] transition-all duration-100 rounded
                              ${
                                isSelected
                                  ? "bg-[var(--accent-primary)] text-white"
                                  : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                              }
                            `}
                          >
                            <div className="flex gap-2 justify-between items-center">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[9px] opacity-70 shrink-0">
                                  {costBadge}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`font-medium truncate text-[11px] ${
                                      isSelected ? "text-white" : ""
                                    }`}
                                  >
                                    {model.name}
                                  </div>
                                  <div
                                    className={`text-[9px] mt-0.5 truncate ${
                                      isSelected
                                        ? "text-white/70"
                                        : "text-[var(--text-tertiary)]"
                                    }`}
                                  >
                                    {model.description}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  className="shrink-0"
                                >
                                  <path
                                    d="M10 3L4.5 8.5L2 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your research paper..."
            disabled={isLoading}
            className="w-full px-4 py-3 pr-24 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            rows={1}
            style={{ maxHeight: "120px", minHeight: "44px" }}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
            {/* Mic Button */}
            <button
              className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Voice input"
              title="Voice input (UI only)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M7 2V6M7 8V12M7 6C8.10457 6 9 5.10457 9 4C9 2.89543 8.10457 2 7 2C5.89543 2 5 2.89543 5 4C5 5.10457 5.89543 6 7 6ZM7 8C8.10457 8 9 8.89543 9 10C9 11.1046 8.10457 12 7 12C5.89543 12 5 11.1046 5 10C5 8.89543 5.89543 8 7 8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Expand input"
              title="Expand input"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M3 3L11 11M11 3L3 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            {/* Stop/Send Button */}
            {isLoading ? (
              <button
                onClick={() => {
                  abortControllerRef.current?.abort();
                  setIsLoading(false);
                }}
                className="flex justify-center items-center w-7 h-7 text-white bg-red-600 rounded transition-colors hover:bg-red-700"
                aria-label="Stop generation"
                title="Stop"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="w-3.5 h-3.5"
                >
                  <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-7 h-7 flex items-center justify-center bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
                title="Send (Enter)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="w-3.5 h-3.5"
                >
                  <path
                    d="M1 7L13 1M13 1L9 13M13 1L1 7L9 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  formatTime: (date: Date) => string;
  onInsert?: (content: string) => void;
  onReplace?: (content: string) => void;
  currentFileContent?: string;
  currentFileName?: string;
  onAcceptPatch?: (patch: Patch) => void;
  onRejectPatch?: (patch: Patch) => void;
  onAcceptAllPatches?: (patches: Patch[]) => void;
  onRejectAllPatches?: (patches: Patch[]) => void;
}

/**
 * MessageBubble - Individual chat message component
 */
function MessageBubble({
  message,
  formatTime,
  onInsert,
  onReplace,
  currentFileContent,
  currentFileName,
  onAcceptPatch,
  onRejectPatch,
  onAcceptAllPatches,
  onRejectAllPatches,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", message.content);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const isUser = message.role === "user";

  return (
    <div
      className={`group flex flex-col w-full ${
        isUser ? "items-end" : "items-start"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable={!isUser}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Patches Preview (if any) - Show BEFORE the message bubble */}
      {!isUser &&
        message.hasPatches &&
        message.patches &&
        message.patches.length > 0 && (
          <div className="mb-3 w-full">
            <PatchPreview
              patches={message.patches}
              currentFileContent={currentFileContent || ""}
              currentFileName={currentFileName || "file"}
              onAcceptPatch={onAcceptPatch!}
              onRejectPatch={onRejectPatch!}
              onAcceptAll={() => onAcceptAllPatches!(message.patches!)}
              onRejectAll={() => onRejectAllPatches!(message.patches!)}
            />
          </div>
        )}

      {/* Message Bubble - Only show text content, not the raw patch XML */}
      {message.content && message.content.trim().length > 0 && (
        <div className="flex flex-col w-full">
          <div
            className={`
            relative w-full rounded-lg px-4 py-3 mb-1
            ${
              isUser
                ? "text-white bg-[var(--accent-primary)]"
                : "border bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]"
            }
            ${isDragging ? "opacity-50" : ""}`}
          >
            {/* Action Buttons (hover) - positioned inside the bubble, top right */}
            {!isUser && showActions && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    // Optional: show toast notification
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] transition-colors shadow-sm"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <button
                  onClick={() => onInsert?.(message.content)}
                  className="w-7 h-7 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] transition-colors shadow-sm"
                  title="Insert into editor"
                >
                  +
                </button>
                <button
                  onClick={() => onReplace?.(message.content)}
                  className="w-7 h-7 flex items-center justify-center bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] transition-colors shadow-sm"
                  title="Replace in editor"
                >
                  ↻
                </button>
              </div>
            )}

            {/* Message Content */}
            <div className="pr-12 text-sm break-words">
              {message.content ? (
                message.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 text-[var(--text-primary)] leading-relaxed">
                          {children}
                        </p>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-xs font-mono text-[var(--accent-primary)]">
                            {children}
                          </code>
                        ) : (
                          <code className="block bg-[var(--bg-secondary)] p-3 rounded text-xs font-mono overflow-x-auto text-[var(--text-primary)] my-2 border border-[var(--border-primary)]">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-[var(--bg-secondary)] p-3 rounded text-xs font-mono overflow-x-auto mb-2 text-[var(--text-primary)] border border-[var(--border-primary)]">
                          {children}
                        </pre>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1.5 text-[var(--text-primary)] ml-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-2 space-y-1.5 text-[var(--text-primary)] ml-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="ml-1">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-[var(--text-primary)]">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic">{children}</em>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0 text-[var(--text-primary)]">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold mb-2 mt-3 first:mt-0 text-[var(--text-primary)]">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0 text-[var(--text-primary)]">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[var(--border-primary)] pl-3 italic my-2 text-[var(--text-secondary)]">
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-[var(--accent-primary)] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed">
                    {message.content}
                  </div>
                )
              ) : (
                <span className="text-[var(--text-tertiary)] italic">
                  Thinking...
                </span>
              )}
            </div>

            {/* Loading indicator for streaming */}
            {!message.content && message.role === "assistant" && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse delay-150" />
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div
            className={`text-[11px] mt-1.5 px-1 ${
              isUser ? "text-white/70" : "text-[var(--text-tertiary)]"
            }`}
          >
            {formatTime(message.timestamp)}
          </div>
        </div>
      )}
    </div>
  );
}
