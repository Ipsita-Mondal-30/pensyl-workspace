/**
 * Editor Lines Utility
 * 
 * Extracts true line-by-line structure from TipTap editor (split by \n).
 * Each visual line = one line, with character positions for surgical edits.
 */

import { Editor } from '@tiptap/react';

export interface EditorLine {
  lineNumber: number;        // 1-indexed line number
  text: string;              // Text content (no \n)
  from: number;              // Character position start
  to: number;                // Character position end
  isEmpty: boolean;          // true if whitespace only
  isHeading: boolean;        // true if starts with # or is Title Case
  headingLevel?: number;     // 1-6 for markdown headings
  sectionName?: string;      // 'abstract', 'introduction', etc.
}

export interface DocumentLines {
  lines: EditorLine[];
  totalCharacters: number;
  lineMap: Map<number, EditorLine>; // lineNumber -> EditorLine
}

/**
 * Extract line-by-line structure from editor with character positions.
 * Each block node (paragraph, heading) = one line.
 * If a block's text contains \n, split it into multiple lines.
 * This creates a true line-by-line representation where each visual line = one line.
 */
export function extractEditorLines(editor: Editor | null | undefined): DocumentLines {
  if (!editor) {
    return {
      lines: [],
      totalCharacters: 0,
      lineMap: new Map(),
    };
  }

  const { state } = editor.view;
  const { doc } = state;
  const lines: EditorLine[] = [];
  let lineNumber = 1;
  
  // Build a text representation with newlines between block nodes
  // This simulates how the document would look as plain text
  let reconstructedText = '';
  const nodePositions: Array<{ nodePos: number; textStart: number; textEnd: number }> = [];
  
  // First pass: reconstruct text and track positions, splitting long paragraphs by sentences
  doc.descendants((node, nodePos) => {
    if (
      node.isBlock &&
      (node.type.name === 'paragraph' ||
       node.type.name.startsWith('heading') ||
       node.type.name === 'codeBlock' ||
       node.type.name === 'blockquote')
    ) {
      const nodeText = node.textContent || '';
      const isNodeHeading = node.type.name.startsWith('heading');
      
      // For long paragraphs (non-headings), split by sentences for surgical editing
      // Headings and short text stay as single lines
      if (!isNodeHeading && nodeText.length > 100 && nodeText.trim().length > 0) {
        // Split by sentence endings: . ! ? followed by space and capital letter
        // This enables surgical edits on individual sentences
        // Pattern: punctuation (. ! ?) followed by space and capital letter
        const sentenceRegex = /([.!?])\s+([A-Z])/g;
        let lastIndex = 0;
        let match;
        const sentences: string[] = [];
        const matches: Array<{ index: number; end: number }> = [];
        
        // Find all sentence boundaries
        while ((match = sentenceRegex.exec(nodeText)) !== null) {
          matches.push({
            index: match.index,
            end: match.index + 1, // Include the punctuation
          });
        }
        
        // If we found sentence boundaries, split the text
        if (matches.length > 0) {
          for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const sentence = nodeText.substring(lastIndex, match.end).trim();
            if (sentence.length > 0) {
              sentences.push(sentence);
            }
            lastIndex = match.end + 2; // Skip punctuation + space
          }
          
          // Add remaining text as last sentence
          if (lastIndex < nodeText.length) {
            const remaining = nodeText.substring(lastIndex).trim();
            if (remaining.length > 0) {
              sentences.push(remaining);
            }
          }
          
          // If we successfully split into multiple sentences, add them as separate lines
          if (sentences.length > 1) {
            for (const sentence of sentences) {
              const textStart = reconstructedText.length;
              reconstructedText += sentence;
              const textEnd = reconstructedText.length;
              nodePositions.push({ nodePos, textStart, textEnd });
              reconstructedText += '\n';
            }
            return true; // Skip the default newline addition below
          }
        }
      }
      
      // For headings, short paragraphs, or if sentence splitting didn't work
      const textStart = reconstructedText.length;
      reconstructedText += nodeText;
      const textEnd = reconstructedText.length;
      
      nodePositions.push({ nodePos, textStart, textEnd });
      
      // Add newline after block node (to separate from next block)
      reconstructedText += '\n';
    }
    return true;
  });
  
  // Second pass: split reconstructed text by newlines to get true lines
  const textLines = reconstructedText.split('\n').filter(line => line !== '' || reconstructedText.includes('\n\n')); // Keep empty lines if they exist
  let currentTextPos = 0;
  
  for (let i = 0; i < textLines.length; i++) {
    const lineText = textLines[i];
    const trimmed = lineText.trim();
    const from = currentTextPos;
    const to = currentTextPos + lineText.length;
    
    // Find which node this line belongs to
    const nodeInfo = nodePositions.find(np => 
      from >= np.textStart && from <= np.textEnd
    );
    
    // Detect if this is a heading
    const isNodeHeading = nodeInfo ? 
      doc.nodeAt(nodeInfo.nodePos)?.type.name.startsWith('heading') : false;
    const isMarkdownHeading = /^#{1,6}\s/.test(lineText);
    const isTitleCase = !isNodeHeading && !isMarkdownHeading && 
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed) && 
      trimmed.length <= 50;
    const isHeading = isNodeHeading || isMarkdownHeading || isTitleCase;
    
    // Extract heading level
    let headingLevel: number | undefined;
    if (isNodeHeading && nodeInfo) {
      const node = doc.nodeAt(nodeInfo.nodePos);
      if (node) {
        const match = node.type.name.match(/heading(\d)/);
        headingLevel = match ? parseInt(match[1], 10) : undefined;
      }
    } else if (isMarkdownHeading) {
      const match = lineText.match(/^(#+)/);
      headingLevel = match ? match[1].length : undefined;
    }
    
    // Extract section name if heading matches known sections
    let sectionName: string | undefined;
    if (isHeading) {
      const normalized = lineText.replace(/^#+\s*/, '').trim().toLowerCase();
      const knownSections = [
        'abstract',
        'introduction',
        'methodology',
        'methods',
        'results',
        'discussion',
        'conclusion',
        'conclusions',
        'references',
        'acknowledgments',
        'acknowledgements',
        'appendix',
        'literature review',
        'background',
        'related work',
        'future work',
        'limitations',
      ];
      
      if (knownSections.includes(normalized)) {
        sectionName = normalized;
      }
    }
    
    lines.push({
      lineNumber: lineNumber++,
      text: lineText,
      from,
      to,
      isEmpty: trimmed.length === 0,
      isHeading,
      headingLevel,
      sectionName,
    });
    
    // Move to next line position (line text + newline)
    currentTextPos = to + 1;
  }
  
  const lineMap = new Map(lines.map(line => [line.lineNumber, line]));
  
  return {
    lines,
    totalCharacters: reconstructedText.length,
    lineMap,
  };
}

/**
 * Find a section by name in the document lines
 */
export function findSection(documentLines: DocumentLines, sectionName: string): {
  headingLine: EditorLine;
  contentLines: EditorLine[];
} | null {
  const normalizedTarget = sectionName.toLowerCase();
  
  for (let i = 0; i < documentLines.lines.length; i++) {
    const line = documentLines.lines[i];
    
    if (line.isHeading && line.sectionName === normalizedTarget) {
      // Found the heading, collect content lines until next heading
      const contentLines: EditorLine[] = [];
      
      for (let j = i + 1; j < documentLines.lines.length; j++) {
        const nextLine = documentLines.lines[j];
        if (nextLine.isHeading) {
          break; // Stop at next heading
        }
        contentLines.push(nextLine);
      }
      
      return {
        headingLine: line,
        contentLines,
      };
    }
  }
  
  return null;
}

/**
 * Get all sections from document lines
 */
export function getAllSections(documentLines: DocumentLines): Array<{
  name: string;
  headingLine: EditorLine;
  contentLines: EditorLine[];
}> {
  const sections: Array<{
    name: string;
    headingLine: EditorLine;
    contentLines: EditorLine[];
  }> = [];
  
  for (let i = 0; i < documentLines.lines.length; i++) {
    const line = documentLines.lines[i];
    
    if (line.isHeading && line.sectionName) {
      // Found a section heading
      const contentLines: EditorLine[] = [];
      
      for (let j = i + 1; j < documentLines.lines.length; j++) {
        const nextLine = documentLines.lines[j];
        if (nextLine.isHeading) {
          break;
        }
        contentLines.push(nextLine);
      }
      
      sections.push({
        name: line.sectionName,
        headingLine: line,
        contentLines,
      });
    }
  }
  
  return sections;
}

