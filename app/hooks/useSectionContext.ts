import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/core";
import { detectSectionType, type SectionContext } from "../utils/sectionDetector";

export function useSectionContext(editor: Editor | null): SectionContext | null {
  const [context, setContext] = useState<SectionContext | null>(null);

  useEffect(() => {
    if (!editor) {
      setContext(null);
      return;
    }

    const updateContext = () => {
      try {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const detectedContext = detectSectionType($from, editor);
        setContext(detectedContext);
      } catch (error) {
        console.error("Error detecting section context:", error);
        setContext(null);
      }
    };

    // Initial context detection
    updateContext();

    // Listen to selection updates
    editor.on("selectionUpdate", updateContext);
    editor.on("transaction", updateContext);

    return () => {
      editor.off("selectionUpdate", updateContext);
      editor.off("transaction", updateContext);
    };
  }, [editor]);

  return context;
}

