"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Focus } from "@tiptap/extension-focus";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { Gapcursor } from "@tiptap/extension-gapcursor";
import { createLowlight } from "lowlight";
import { uploadImageToWorkspaceBucket } from "../../lib/supabase-client";
// Research paper extensions
import { PaperNode } from "../../extensions/research-paper/PaperNode";
import { FrontMatterNode } from "../../extensions/research-paper/FrontMatterNode";
import { AbstractNode } from "../../extensions/research-paper/AbstractNode";
import { SectionNode } from "../../extensions/research-paper/SectionNode";
import { FigureNode } from "../../extensions/research-paper/FigureNode";
import { CaptionNode } from "../../extensions/research-paper/CaptionNode";
import { TableCaption } from "../../extensions/research-paper/TableCaption";
import { InlineMathNode } from "../../extensions/research-paper/InlineMathNode";
import { BlockEquationNode } from "../../extensions/research-paper/BlockEquationNode";
import { CitationMark } from "../../extensions/research-paper/CitationMark";
import { ReferenceNode } from "../../extensions/research-paper/ReferenceNode";
import { TrackChanges } from "../../extensions/research-paper/TrackChanges";
import { CommentMark } from "../../extensions/research-paper/CommentMark";
import { FontSize } from "../../extensions/FontSize";
// Contextual toolbar
import { useSectionContext } from "../../hooks/useSectionContext";
import { ContextualToolbar } from "./ContextualToolbar";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

// Import languages for syntax highlighting
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("css", css);
lowlight.register("html", html);
lowlight.register("xml", html);
lowlight.register("json", json);
lowlight.register("python", python);
lowlight.register("bash", bash);
lowlight.register("sh", bash);
lowlight.register("markdown", markdown);
lowlight.register("java", java);
lowlight.register("cpp", cpp);
lowlight.register("c", cpp);
lowlight.register("go", go);
lowlight.register("rust", rust);
lowlight.register("php", php);
lowlight.register("ruby", ruby);
lowlight.register("sql", sql);
lowlight.register("yaml", yaml);
lowlight.register("yml", yaml);

interface EditorProps {
  content: string;
  onChange?: (content: string) => void;
  onUpdate?: (isModified: boolean) => void;
  onCursorChange?: (line: number, column: number) => void;
  editable?: boolean;
  viewMode?: "writing" | "paper" | "latex";
}

/**
 * Advanced Editor component using TipTap with extensive features
 */
export const Editor = forwardRef<any, EditorProps>(function Editor(
  {
    content,
    onChange,
    onUpdate,
    onCursorChange,
    editable = true,
    viewMode = "writing",
  },
  ref
) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [currentLine, setCurrentLine] = useState(1);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false); // Track if update is from user typing

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatches, setSearchMatches] = useState<
    Array<{ start: number; end: number }>
  >([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Floating toolbar state (Notion-style)
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const floatingToolbarRef = useRef<HTMLDivElement>(null);

  // Contextual toolbar state (research-aware) - will be set after editor is created
  const [showContextualToolbar, setShowContextualToolbar] = useState(false);
  const [contextualToolbarPosition, setContextualToolbarPosition] = useState({
    top: 0,
    left: 0,
  });

  const editor = useEditor({
    immediatelyRender: false, // Required for SSR/Next.js to avoid hydration mismatches
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "editor-table research-table",
        },
      }),
      TableCaption,
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "editor-task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "editor-task-item",
        },
      }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Focus.configure({
        className: "editor-focused",
        mode: "all",
      }),
      Dropcursor.configure({
        color: "var(--accent-primary)",
        width: 2,
      }),
      Gapcursor,
      // Research paper nodes (optional - maintains backward compatibility)
      PaperNode,
      FrontMatterNode,
      AbstractNode,
      SectionNode,
      FigureNode,
      CaptionNode,
      InlineMathNode,
      BlockEquationNode,
      CitationMark,
      ReferenceNode,
      TrackChanges,
      CommentMark,
    ],
    content: content || "<p></p>", // Ensure valid HTML structure
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      isInternalUpdate.current = true; // Mark this as user edit
      onChange?.(html);
      onUpdate?.(html !== content);
      // Reset flag after a short delay
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 100);
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none px-4 py-3",
      },
      handlePaste: (view, event) => {
        // Handle image paste from clipboard and upload to Supabase storage
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(
          (item) => item.type.indexOf("image") !== -1
        );

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            console.info("[Editor] Image paste detected, starting upload", {
              name: file.name,
              size: file.size,
              type: file.type,
            });
            (async () => {
              try {
                const publicUrl = await uploadImageToWorkspaceBucket(file);
                const { state, dispatch } = view;
                const { selection } = state;
                const { from } = selection;
                const imageNode = state.schema.nodes.image.create({
                  src: publicUrl,
                });
                const tr = state.tr.insert(from, imageNode);
                dispatch(tr);
                console.info("[Editor] Image inserted with URL", publicUrl);
              } catch (err) {
                console.error("Failed to upload image to Supabase:", err);
                alert(
                  "Image upload failed. Please check Supabase config and bucket permissions."
                );
              }
            })();
            return true; // Handled
          }
        }
        return false; // Let TipTap handle other paste events
      },
      handleDrop: (view, event, slice, moved) => {
        // Handle image drop -> upload to Supabase
        if (moved) return false; // Let TipTap handle moved content

        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find(
          (file) => file.type.indexOf("image") !== -1
        );

        if (imageFile) {
          event.preventDefault();
          event.stopPropagation();
          console.info("[Editor] Image drop detected, starting upload", {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
          });
          (async () => {
            try {
              const publicUrl = await uploadImageToWorkspaceBucket(imageFile);
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (coordinates) {
                const { state, dispatch } = view;
                const { pos } = coordinates;

                const imageNode = state.schema.nodes.image.create({
                  src: publicUrl,
                });

                const tr = state.tr.insert(pos, imageNode);
                dispatch(tr);
                console.info("[Editor] Image inserted with URL", publicUrl);
              }
            } catch (err) {
              console.error("Failed to upload image to Supabase (drop):", err);
              alert(
                "Image upload failed. Please check Supabase config, bucket permissions, and RLS."
              );
            }
          })();
          return true; // Handled
        }
        return false; // Let TipTap handle other drop events
      },
    },
  });

  // Expose editor instance to parent via ref
  useImperativeHandle(ref, () => editor, [editor]);

  // Contextual toolbar state (research-aware) - initialize after editor is created
  // Always call the hook (Rules of Hooks) - it handles null editor internally
  const sectionContext = useSectionContext(editor);

  // Handle floating toolbar on text selection (Notion-style)
  useEffect(() => {
    if (!editor || !editable || !editorContentRef.current) return;

    const updateToolbar = () => {
      if (!editorContentRef.current) return;

      const { state } = editor.view;
      const { selection } = state;
      const { from, to } = selection;

      // Only show toolbar if there's a selection (not just cursor)
      if (from !== to) {
        try {
          const start = editor.view.coordsAtPos(from);
          const end = editor.view.coordsAtPos(to);

          // Get editor container position
          const editorRect = editorContentRef.current.getBoundingClientRect();

          // Position toolbar above selection, centered
          const top = Math.min(start.top, end.top) - 10 + window.scrollY;
          const left = (start.left + end.left) / 2 + window.scrollX;

          setToolbarPosition({ top, left });
          setShowFloatingToolbar(true);
        } catch (error) {
          setShowFloatingToolbar(false);
        }
      } else {
        setShowFloatingToolbar(false);
      }
    };

    // Update contextual toolbar position when cursor moves (no selection)
    const updateContextualToolbar = () => {
      if (!editorContentRef.current) return;

      const { state } = editor.view;
      const { selection } = state;
      const { from, to } = selection;

      // Show contextual toolbar when there's no selection (just cursor)
      if (from === to && sectionContext) {
        try {
          const coords = editor.view.coordsAtPos(from);
          const top = coords.top - 10 + window.scrollY;
          const left = coords.left + window.scrollX;

          setContextualToolbarPosition({ top, left });
          setShowContextualToolbar(true);
        } catch (error) {
          setShowContextualToolbar(false);
        }
      } else {
        setShowContextualToolbar(false);
      }
    };

    editor.on("selectionUpdate", updateToolbar);
    editor.on("selectionUpdate", updateContextualToolbar);
    editor.on("transaction", updateToolbar);
    editor.on("transaction", updateContextualToolbar);

    // Also listen to mouseup for selection changes
    const handleMouseUp = () => {
      setTimeout(() => {
        updateToolbar();
        updateContextualToolbar();
      }, 10);
    };
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("selectionUpdate", updateContextualToolbar);
      editor.off("transaction", updateToolbar);
      editor.off("transaction", updateContextualToolbar);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor, editable, sectionContext]);

  // Track cursor position and line count based on visual lines
  useEffect(() => {
    if (!editor || !editorContentRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let lastLine = 1;
    let lastColumn = 1;

    const updateLineNumbers = () => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const { state } = editor.view;
        const { selection } = state;
        const { $anchor } = selection;
        const doc = state.doc;
        const pos = $anchor.pos;

        // Get the actual DOM element to count visual lines
        const editorElement = editorContentRef.current?.querySelector(
          ".ProseMirror"
        ) as HTMLElement;

        let calculatedLineCount = 1;
        let calculatedCursorLine = 1;

        if (editorElement) {
          // Count visual lines by counting block elements (p, h1-h6, pre, etc.)
          // Each block element represents a visual line in TipTap
          const blockElements = editorElement.querySelectorAll(
            "p, h1, h2, h3, h4, h5, h6, pre, blockquote, li"
          );
          let blockCount = blockElements.length;

          // Count hard breaks (<br> tags)
          const brElements = editorElement.querySelectorAll("br");
          blockCount += brElements.length;

          // Count newlines in text content (for code blocks or pre-formatted text)
          const fullText = editorElement.textContent || "";
          const newlineCount = (fullText.match(/\n/g) || []).length;
          calculatedLineCount = Math.max(1, blockCount + newlineCount);

          // Calculate cursor line using DOM selection position
          try {
            const domSelection = window.getSelection();
            if (
              domSelection &&
              domSelection.rangeCount > 0 &&
              domSelection.anchorNode
            ) {
              const range = document.createRange();
              range.setStart(
                domSelection.anchorNode,
                Math.min(
                  domSelection.anchorOffset,
                  domSelection.anchorNode.textContent?.length || 0
                )
              );
              range.setEnd(
                domSelection.anchorNode,
                Math.min(
                  domSelection.anchorOffset,
                  domSelection.anchorNode.textContent?.length || 0
                )
              );

              const rect = range.getBoundingClientRect();
              const editorRect = editorElement.getBoundingClientRect();
              const lineHeight =
                parseFloat(getComputedStyle(editorElement).lineHeight) || 24;
              const paddingTop =
                parseFloat(getComputedStyle(editorElement).paddingTop) || 16;

              const relativeTop =
                rect.top -
                editorRect.top +
                editorElement.scrollTop -
                paddingTop;
              calculatedCursorLine = Math.max(
                1,
                Math.floor(relativeTop / lineHeight) + 1
              );
            }
          } catch (e) {
            // Fallback to document-based calculation
            const textBefore = doc.textBetween(0, pos, "\n");
            calculatedCursorLine = Math.max(
              1,
              (textBefore.match(/\n/g) || []).length + 1
            );
          }
        }

        // Fallback: count by document structure if DOM method didn't work
        if (calculatedLineCount === 1 && doc.content.size > 0) {
          // Count block nodes (each is a visual line)
          let blockCount = 0;
          doc.descendants((node) => {
            if (node.isBlock) blockCount++;
          });

          // Count newlines in text content
          const fullText = doc.textContent || "";
          const newlineCount = (fullText.match(/\n/g) || []).length;
          calculatedLineCount = Math.max(1, blockCount + newlineCount);

          const textBefore = doc.textBetween(0, pos, "\n");
          calculatedCursorLine = Math.max(
            1,
            (textBefore.match(/\n/g) || []).length + 1
          );
        }

        // Calculate column position
        const textBefore = doc.textBetween(0, pos, "\n");
        const lines = textBefore.split("\n");
        const column = (lines[lines.length - 1] || "").length + 1;

        // Update states
        setLineCount(calculatedLineCount);
        setCurrentLine(calculatedCursorLine);

        // Only update if position actually changed
        if (calculatedCursorLine !== lastLine || column !== lastColumn) {
          lastLine = calculatedCursorLine;
          lastColumn = column;
          onCursorChange?.(calculatedCursorLine, column);
        }
      }, 100); // Slightly longer debounce for DOM measurements
    };

    // Listen to selection updates and content updates
    editor.on("selectionUpdate", updateLineNumbers);
    editor.on("update", updateLineNumbers);

    // Initial update
    updateLineNumbers();

    return () => {
      clearTimeout(timeoutId);
      editor.off("selectionUpdate", updateLineNumbers);
      editor.off("update", updateLineNumbers);
    };
  }, [editor, onCursorChange]);

  // Remove this useEffect entirely - let onUpdate handle content changes
  // This prevents the circular update loop that causes cursor jumping
  // The editor manages its own content, and only syncs to parent via onChange

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Re-apply highlights when editor content updates (if search is active)
  useEffect(() => {
    if (
      !editor ||
      !isSearchOpen ||
      !searchTerm.trim() ||
      searchMatches.length === 0
    ) {
      return;
    }

    const handleUpdate = () => {
      // Re-apply highlights after a short delay to let ProseMirror finish updating
      setTimeout(() => {
        if (
          currentMatchIndex >= 0 &&
          currentMatchIndex < searchMatches.length
        ) {
          highlightAllMatches(searchMatches, currentMatchIndex);
        }
      }, 50);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, isSearchOpen, searchTerm, searchMatches, currentMatchIndex]);

  // Handle Cmd+F / Ctrl+F keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+F on Mac, Ctrl+F on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        // Focus search input after a brief delay to ensure it's rendered
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }

      // Escape to close search
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchTerm("");
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
        clearSearchHighlights();
        editor?.commands.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, isSearchOpen]);

  // Perform search when search term changes and highlight matches
  useEffect(() => {
    if (!editor || !searchTerm.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      clearSearchHighlights();
      return;
    }

    const text = editor.getText();
    const flags = caseSensitive ? "g" : "gi";
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedTerm, flags);
    const matches: Array<{ start: number; end: number }> = [];
    let match;

    // Find all matches
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    setSearchMatches(matches);

    // Highlight all matches
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      highlightAllMatches(matches, 0);
      scrollToMatch(matches[0].start, matches[0].end);
    } else {
      setCurrentMatchIndex(-1);
      clearSearchHighlights();
    }
  }, [editor, searchTerm, caseSensitive]);

  // Clear all search highlights using TipTap's API
  const clearSearchHighlights = () => {
    if (!editor) return;

    // Remove all highlight marks from the entire document
    const { state } = editor.view;
    const { tr } = state;
    const highlightType = state.schema.marks.highlight;

    // Remove all highlight marks
    state.doc.descendants((node, pos) => {
      if (node.isText && node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === highlightType) {
            // Check if it's a search highlight (yellow or orange)
            const color = mark.attrs?.color;
            if (color === "#ffff00" || color === "#ffa500") {
              tr.removeMark(pos, pos + node.nodeSize, highlightType);
            }
          }
        });
      }
    });

    editor.view.dispatch(tr);
  };

  // Convert text position to ProseMirror document position
  const textPosToDocPos = (textPos: number): number => {
    if (!editor) return 1;

    const { state } = editor.view;
    let docPos = 1; // Start after the document start

    // Walk through the document and count text positions
    let textOffset = 0;
    state.doc.descendants((node, pos) => {
      if (node.isText && textOffset <= textPos) {
        const nodeText = node.text || "";
        if (textOffset + nodeText.length >= textPos) {
          // Found the node containing this position
          const offsetInNode = textPos - textOffset;
          docPos = pos + offsetInNode + 1; // +1 for the node start
          return false; // Stop iteration
        }
        textOffset += nodeText.length;
      }
      return true;
    });

    return docPos;
  };

  // Highlight all matches using TipTap's Highlight extension
  const highlightAllMatches = (
    matches: Array<{ start: number; end: number }>,
    currentIndex: number
  ) => {
    if (!editor || matches.length === 0) return;

    // Clear existing highlights first
    clearSearchHighlights();

    // Use TipTap's transaction system
    const { state } = editor.view;
    const { tr } = state;
    const highlightType = state.schema.marks.highlight;

    // Process matches in reverse order to avoid position shifting
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const isCurrent = i === currentIndex;
      const color = isCurrent ? "#ffa500" : "#ffff00"; // Orange for current, yellow for others

      try {
        // Convert text positions to document positions
        const docStart = textPosToDocPos(match.start);
        const docEnd = textPosToDocPos(match.end);

        if (docStart < docEnd && docStart > 0) {
          // Create highlight mark
          const mark = highlightType.create({ color });

          // Add mark to the transaction
          tr.addMark(docStart, docEnd, mark);
        }
      } catch (error) {
        console.warn(`Error highlighting match ${i}:`, error);
      }
    }

    // Dispatch the transaction if there are changes
    if (tr.steps.length > 0) {
      editor.view.dispatch(tr);
      console.log(
        `✅ Highlighted ${matches.length} matches (current: ${
          currentIndex + 1
        })`
      );
    }
  };

  // Scroll to a specific match position and highlight it
  const scrollToMatch = (from: number, to: number) => {
    if (!editor) return;

    const { state } = editor.view;
    const docSize = state.doc.content.size;
    const safeFrom = Math.min(Math.max(0, from), docSize);
    const safeTo = Math.min(Math.max(safeFrom, to), docSize);

    // Set selection to highlight the match (this will visually highlight it)
    editor.commands.setTextSelection({ from: safeFrom, to: safeTo });

    // Scroll into view
    setTimeout(() => {
      try {
        const domPos = editor.view.domAtPos(safeFrom);
        if (domPos.node) {
          const element =
            domPos.node instanceof HTMLElement
              ? domPos.node
              : domPos.node.parentElement;
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch (error) {
        // Fallback: scroll the editor container
        const editorElement = editorContentRef.current;
        if (editorElement) {
          editorElement.scrollTop =
            editorElement.scrollHeight * (safeFrom / docSize);
        }
      }
    }, 50);
  };

  // Navigate to next match
  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    highlightAllMatches(searchMatches, nextIndex);
    const match = searchMatches[nextIndex];
    scrollToMatch(match.start, match.end);
  };

  // Navigate to previous match
  const goToPreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex =
      currentMatchIndex <= 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    highlightAllMatches(searchMatches, prevIndex);
    const match = searchMatches[prevIndex];
    scrollToMatch(match.start, match.end);
  };

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
        Loading editor...
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
    disabled = false,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`
        px-2.5 py-1.5 rounded text-sm transition-all duration-200 ease-in-out
        flex items-center justify-center min-w-[32px]
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isActive
            ? "bg-[var(--accent-primary)] text-white shadow-sm"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }
      `}
    >
      {children}
    </button>
  );

  const ToolbarSeparator = () => (
    <div className="w-px h-6 bg-[var(--border-primary)] mx-1" />
  );

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setShowLinkDialog(false);
    setLinkUrl("");
  };

  const handleAddImage = () => {
    setImageUrl("");
    setShowImageDialog(true);
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setShowImageDialog(false);
    setImageUrl("");
  };

  const handleAddTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)] relative">
      {/* Contextual Toolbar (Research-aware) - appears when cursor is in a section */}
      {editable && showContextualToolbar && sectionContext && (
        <ContextualToolbar
          editor={editor}
          context={sectionContext}
          position={contextualToolbarPosition}
          onAction={(action) => {
            // Handle contextual actions
            console.log(
              "Contextual action:",
              action,
              "in section:",
              sectionContext.sectionType
            );
            // TODO: Implement action handlers in Phase 2 completion
          }}
        />
      )}

      {/* Floating Toolbar (Notion-style) - appears on text selection */}
      {editable && showFloatingToolbar && (
        <div
          ref={floatingToolbarRef}
          className="fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {/* Bold */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleBold().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("bold")}
            title="Bold (⌘B)"
          >
            <strong className="text-sm font-bold">B</strong>
          </ToolbarButton>

          {/* Italic */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleItalic().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("italic")}
            title="Italic (⌘I)"
          >
            <em className="text-sm italic">I</em>
          </ToolbarButton>

          {/* Underline */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleUnderline().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("underline")}
            title="Underline (⌘U)"
          >
            <u className="text-sm">U</u>
          </ToolbarButton>

          {/* Strikethrough */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleStrike().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <s className="text-sm">S</s>
          </ToolbarButton>

          {/* Code */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleCode().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("code")}
            title="Code"
          >
            <span className="font-mono text-xs">&lt;/&gt;</span>
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Link */}
          <ToolbarButton
            onClick={() => {
              handleAddLink();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("link")}
            title="Add Link"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M6.5 8.5C6.5 7.11929 7.61929 6 9 6H10.5C11.8807 6 13 7.11929 13 8.5C13 9.88071 11.8807 11 10.5 11H9C7.61929 11 6.5 9.88071 6.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M9.5 8.5C9.5 9.88071 10.6193 11 12 11H13.5C14.8807 11 16 9.88071 16 8.5C16 7.11929 14.8807 6 13.5 6H12C10.6193 6 9.5 7.11929 9.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5 8.5H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </ToolbarButton>

          {/* Highlight */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleHighlight().run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("highlight")}
            title="Highlight"
          >
            <span className="px-1 text-xs text-black bg-yellow-400 rounded">
              H
            </span>
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Heading 1 */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <span className="text-xs font-bold">H1</span>
          </ToolbarButton>

          {/* Heading 2 */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <span className="text-xs font-semibold">H2</span>
          </ToolbarButton>

          {/* Heading 3 */}
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().toggleHeading({ level: 3 }).run();
              setShowFloatingToolbar(false);
            }}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <span className="text-xs font-medium">H3</span>
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Font Size */}
          <div className="relative group">
            <ToolbarButton onClick={() => {}} title="Font Size">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 2V14M8 2V14M12 2V14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M2 4H6M2 8H10M2 12H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </ToolbarButton>
            <div className="absolute top-full left-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl py-1 min-w-[100px] max-h-[300px] overflow-y-auto z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("12");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                12
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("14");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                14
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("16");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                16
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("18");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                18
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("20");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                20
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("24");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                24
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("28");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                28
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("32");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                32
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("36");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                36
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("48");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                48
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("60");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                60
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  (editor.commands as any).setFontSize("72");
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)]"
              >
                72
              </button>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="relative group">
            <ToolbarButton onClick={() => {}} title="Text Alignment">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4H14M2 8H14M2 12H10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </ToolbarButton>
            <div className="absolute top-full left-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl py-1 min-w-[120px] z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editor.chain().focus().setTextAlign("left").run();
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4H14M2 8H14M2 12H10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Left
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editor.chain().focus().setTextAlign("center").run();
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4H12M2 8H14M4 12H12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Center
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editor.chain().focus().setTextAlign("right").run();
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4H14M2 8H14M10 12H14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Right
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-4 min-w-[400px]">
          <div className="flex gap-2 items-center mb-3">
            <label className="text-sm text-[var(--text-primary)]">
              Link URL:
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInsertLink();
                } else if (e.key === "Escape") {
                  setShowLinkDialog(false);
                }
              }}
              placeholder="https://example.com"
              className="flex-1 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end items-center">
            <button
              onClick={() => setShowLinkDialog(false)}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertLink}
              className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded text-sm font-medium transition-colors"
            >
              Insert
            </button>
            {editor.isActive("link") && (
              <button
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setShowLinkDialog(false);
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-4 min-w-[400px]">
          <div className="flex gap-2 items-center mb-3">
            <label className="text-sm text-[var(--text-primary)]">
              Image URL:
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInsertImage();
                } else if (e.key === "Escape") {
                  setShowImageDialog(false);
                }
              }}
              placeholder="https://example.com/image.png"
              className="flex-1 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end items-center">
            <button
              onClick={() => setShowImageDialog(false)}
              className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertImage}
              className="px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded text-sm font-medium transition-colors"
            >
              Insert
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="absolute top-0 right-0 z-50 bg-[var(--bg-secondary)] border-b border-l border-[var(--border-primary)] rounded-bl-lg shadow-xl">
          <div className="flex gap-2 items-center px-3 py-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0"
            >
              <path
                d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 10L14 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  goToNextMatch();
                } else if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  goToPreviousMatch();
                } else if (e.key === "Escape") {
                  setIsSearchOpen(false);
                  setSearchTerm("");
                  setSearchMatches([]);
                  setCurrentMatchIndex(-1);
                  editor?.commands.focus();
                }
              }}
              placeholder="Search..."
              className="w-64 px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              autoFocus
            />
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setCaseSensitive(!caseSensitive)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  caseSensitive
                    ? "text-white bg-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                }`}
                title="Case sensitive"
              >
                Aa
              </button>
              <button
                onClick={goToPreviousMatch}
                disabled={searchMatches.length === 0}
                className="px-2 py-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous match (Shift+Enter)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-4 h-4"
                >
                  <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={goToNextMatch}
                disabled={searchMatches.length === 0}
                className="px-2 py-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next match (Enter)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-4 h-4"
                >
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {searchMatches.length > 0 && (
                <span className="px-2 py-1 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {currentMatchIndex + 1} / {searchMatches.length}
                </span>
              )}
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm("");
                  setSearchMatches([]);
                  setCurrentMatchIndex(-1);
                  clearSearchHighlights();
                  editor?.commands.focus();
                }}
                className="px-2 py-1 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                title="Close (Esc)"
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
          </div>
        </div>
      )}

      {/* Editor Content with Line Numbers */}
      <div className="flex overflow-hidden flex-1">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="line-numbers-gutter flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] text-right select-none overflow-y-auto overflow-x-hidden"
          style={{ width: "44px", minWidth: "44px" }}
        >
          <div
            className="line-numbers-content font-mono text-xs text-[var(--text-tertiary)]"
            style={{
              paddingTop: "1rem",
              paddingBottom: "1rem",
              paddingLeft: "0.5rem",
              paddingRight: "0.5rem",
              lineHeight: "1.5rem",
            }}
          >
            {Array.from(
              { length: Math.max(lineCount, 1) },
              (_, i) => i + 1
            ).map((lineNum) => (
              <div
                key={lineNum}
                className={`line-number flex items-center justify-end pr-3 transition-colors ${
                  lineNum === currentLine
                    ? "text-[var(--accent-primary)] font-semibold"
                    : ""
                }`}
                style={{
                  height: "1.5rem",
                  minHeight: "1.5rem",
                  lineHeight: "1.5rem",
                }}
              >
                {lineNum}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Content Area */}
        <div
          ref={editorContentRef}
          className="overflow-x-auto overflow-y-auto relative flex-1"
          onScroll={(e) => {
            // Sync line numbers scroll with editor scroll
            const lineNumbersContent = lineNumbersRef.current?.querySelector(
              ".line-numbers-content"
            ) as HTMLElement;
            if (lineNumbersContent) {
              lineNumbersContent.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
});
