import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { Editor } from "@tiptap/core";

/**
 * Export TipTap editor content to DOCX
 */
export async function exportToDOCX(editor: Editor | null): Promise<Blob> {
  if (!editor) {
    throw new Error("Editor is not available");
  }

  const { state } = editor.view;
  const { doc: proseDoc } = state;
  const children: any[] = [];

  // Process document nodes
  proseDoc.descendants((node: any) => {
    const nodeType = node.type.name;

    switch (nodeType) {
      case "heading":
        const level = node.attrs.level || 1;
        const headingText = node.textContent || "";
        const headingLevels: any = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        children.push(
          new Paragraph({
            text: headingText,
            heading: headingLevels[level] || HeadingLevel.HEADING_1,
          })
        );
        return false;

      case "paragraph":
        const paraText = node.textContent || "";
        if (paraText.trim()) {
          children.push(
            new Paragraph({
              children: [new TextRun(paraText)],
            })
          );
        }
        return false;

      case "blockEquation":
        const latexCode = node.attrs.latex || "";
        if (latexCode) {
          children.push(
            new Paragraph({
              children: [new TextRun(`Equation: ${latexCode}`)],
            })
          );
        }
        return false;

      case "figure":
        const caption = node.attrs.caption || "";
        const figNumber = node.attrs.number || 0;
        if (caption) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Figure ${figNumber}: ${caption}`,
                  italics: true,
                }),
              ],
            })
          );
        }
        return false;

      default:
        return true;
    }
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

