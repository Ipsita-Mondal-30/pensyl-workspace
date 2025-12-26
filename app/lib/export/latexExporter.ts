import type { Editor } from "@tiptap/core";

/**
 * Export TipTap editor content to LaTeX
 * Basic implementation - converts research paper nodes to LaTeX
 */
export function exportToLaTeX(editor: Editor | null): string {
  if (!editor) {
    return "";
  }

  const { state } = editor.view;
  const { doc } = state;
  let latex = "";

  // Process document nodes
  doc.descendants((node: any, pos: number) => {
    const nodeType = node.type.name;

    switch (nodeType) {
      case "heading":
        const level = node.attrs.level || 1;
        const headingText = node.textContent || "";
        latex += `\\${"sub".repeat(level - 1)}section{${headingText}}\n\n`;
        return false;

      case "paragraph":
        const paraText = node.textContent || "";
        if (paraText.trim()) {
          latex += `${paraText}\n\n`;
        }
        return false;

      case "blockEquation":
        const latexCode = node.attrs.latex || "";
        const eqNumber = node.attrs.number || 0;
        if (latexCode) {
          latex += `\\begin{equation}\n${latexCode}\n\\end{equation}\n\n`;
          if (eqNumber > 0) {
            latex += `\\label{eq:${eqNumber}}\n\n`;
          }
        }
        return false;

      case "figure":
        const src = node.attrs.src || "";
        const caption = node.attrs.caption || "";
        const figNumber = node.attrs.number || 0;
        if (src) {
          latex += `\\begin{figure}[h]\n\\centering\n\\includegraphics{${src}}\n`;
          if (caption) {
            latex += `\\caption{${caption}}\n`;
          }
          if (figNumber > 0) {
            latex += `\\label{fig:${figNumber}}\n`;
          }
          latex += `\\end{figure}\n\n`;
        }
        return false;

      case "citation":
        const citationId = node.attrs.id || "";
        if (citationId) {
          latex += `\\cite{${citationId}}`;
        }
        return false;

      case "references":
        latex += `\\begin{thebibliography}{99}\n`;
        // Process citations
        latex += `\\end{thebibliography}\n\n`;
        return false;

      default:
        return true;
    }
  });

  return latex;
}

