import type { Editor } from "@tiptap/core";
import type { SectionMetadata, PaperMetadata } from "../types/research-paper";

export interface DocumentAnalytics {
  totalWords: number;
  totalCharacters: number;
  totalCitations: number;
  totalFigures: number;
  totalEquations: number;
  totalTables: number;
  sections: SectionAnalytics[];
  citationDensity: number; // citations per 100 words
}

export interface SectionAnalytics {
  sectionName: string;
  sectionType: string;
  wordCount: number;
  citationCount: number;
  figureCount: number;
  equationCount: number;
}

/**
 * Calculate document analytics from editor content
 */
export function calculateDocumentAnalytics(editor: Editor | null): DocumentAnalytics {
  if (!editor) {
    return {
      totalWords: 0,
      totalCharacters: 0,
      totalCitations: 0,
      totalFigures: 0,
      totalEquations: 0,
      totalTables: 0,
      sections: [],
      citationDensity: 0,
    };
  }

  const { state } = editor.view;
  const { doc } = state;
  const text = doc.textContent || "";
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  let totalCitations = 0;
  let totalFigures = 0;
  let totalEquations = 0;
  let totalTables = 0;
  const sections: SectionAnalytics[] = [];

  // Traverse document to count elements
  doc.descendants((node: any) => {
    const nodeType = node.type.name;

    // Count citations
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        if (mark.type.name === "citation") {
          totalCitations++;
        }
      });
    }

    // Count figures
    if (nodeType === "figure") {
      totalFigures++;
    }

    // Count equations
    if (nodeType === "blockEquation") {
      totalEquations++;
    }

    // Count tables
    if (nodeType === "table") {
      totalTables++;
    }

    // Analyze sections
    if (nodeType === "researchSection" || nodeType.startsWith("heading")) {
      const sectionName = node.textContent || "Untitled Section";
      const sectionType = node.attrs?.sectionType || "other";
      
      // Count words in this section (simplified - counts all text in section)
      const sectionText = node.textContent || "";
      const sectionWords = sectionText.split(/\s+/).filter((w: string) => w.length > 0);
      
      // Count citations in section
      let sectionCitations = 0;
      node.descendants((childNode: any) => {
        if (childNode.marks) {
          childNode.marks.forEach((mark: any) => {
            if (mark.type.name === "citation") {
              sectionCitations++;
            }
          });
        }
      });

      sections.push({
        sectionName,
        sectionType,
        wordCount: sectionWords.length,
        citationCount: sectionCitations,
        figureCount: 0, // Would need more complex traversal
        equationCount: 0, // Would need more complex traversal
      });
    }

    return true;
  });

  const citationDensity = words.length > 0 ? (totalCitations / words.length) * 100 : 0;

  return {
    totalWords: words.length,
    totalCharacters: text.length,
    totalCitations,
    totalFigures,
    totalEquations,
    totalTables,
    sections,
    citationDensity: Math.round(citationDensity * 100) / 100,
  };
}

