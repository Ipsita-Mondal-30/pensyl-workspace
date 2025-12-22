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

  // Handle accepting a patch
  const handleAcceptPatch = async (patch: Patch) => {
    console.log("🔧 Applying patch:", patch);

    if (!editor) {
      console.error("❌ Cannot apply patch: no editor instance");
      alert("Editor not available. Please try again.");
      return;
    }

    try {
      // Get current content from editor
      let currentContent = "";

      // Try multiple methods to get content
      if (typeof editor.getText === "function") {
        currentContent = editor.getText();
      } else if (typeof editor.getHTML === "function") {
        // Convert HTML to text if needed
        const html = editor.getHTML();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        currentContent = tempDiv.textContent || "";
      } else if (editor.state?.doc) {
        currentContent = editor.state.doc.textContent || "";
      }

      console.log("📄 Current content length:", currentContent.length);
      console.log("📝 First 100 chars:", currentContent.substring(0, 100));

      if (!currentContent) {
        console.warn("⚠️ Editor content is empty, using empty string");
        currentContent = "";
      }

      // Apply the patch - explicitly type patch to ensure compatibility
      const newContent = applyPatch(currentContent, patch as Patch);

      console.log("✨ New content length:", newContent.length);
      console.log("📝 First 100 chars:", newContent.substring(0, 100));

      // Update editor - use commands API for TipTap
      if (editor.commands) {
        // Clear and set new content
        editor.commands.setContent(newContent);
        console.log("✅ Patch applied via TipTap commands");
      } else if (onReplaceInEditor) {
        // Fallback to parent handler
        onReplaceInEditor(newContent);
        console.log("✅ Patch applied via replace handler");
      } else {
        console.error("❌ No method to update editor");
        alert("Cannot update editor. Please try manually copying the content.");
        return;
      }

      // Show success message
      console.log("✅ Patch applied successfully!");

      // Optional: Show a brief success indicator
      // You could add a toast notification here
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
      // Get current content from editor
      let currentContent = "";

      if (typeof editor.getText === "function") {
        currentContent = editor.getText();
      } else if (editor.state?.doc) {
        currentContent = editor.state.doc.textContent || "";
      }

      console.log("📄 Current content length:", currentContent.length);

      // Apply all patches in sequence
      const newContent = applyPatches(currentContent, patches);

      console.log("✨ New content length:", newContent.length);

      // Update editor
      if (editor.commands) {
        editor.commands.setContent(newContent);
        console.log(`✅ Applied ${patches.length} patches via TipTap commands`);
      } else if (onReplaceInEditor) {
        onReplaceInEditor(newContent);
        console.log(`✅ Applied ${patches.length} patches via replace handler`);
      }
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
      const { hasPatches, patches, textContent } = parseAIResponse(
        fullResponse,
        currentFileName || undefined
      );

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
