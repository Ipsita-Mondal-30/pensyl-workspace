import type { Editor } from "@tiptap/core";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

/**
 * Export TipTap editor content to Markdown
 */
export function exportToMarkdown(editor: Editor | null): string {
  if (!editor) {
    return "";
  }

  const html = editor.getHTML();
  const markdown = turndownService.turndown(html);
  return markdown;
}

