/**
 * Editor Blocks Utility
 * 
 * Extracts block structure from TipTap editor for backend processing.
 * This provides the exact block structure that the backend needs for accurate section resolution.
 */

import { Editor } from '@tiptap/react';

export interface EditorBlock {
  lineNumber: number;
  type: 'heading' | 'paragraph' | 'codeBlock' | 'blockquote';
  text: string;
  position: number;
  endPosition: number;
  isEmpty: boolean;
}

/**
 * Extract block structure from editor
 * Returns array of blocks with exact line numbers and positions
 */
export function extractEditorBlocks(editor: Editor | null | undefined): EditorBlock[] {
  if (!editor) {
    return [];
  }

  const { state } = editor.view;
  const { doc } = state;
  const blocks: EditorBlock[] = [];

  let lineNumber = 1;
  
  doc.descendants((node, pos) => {
    if (
      node.isBlock &&
      (node.type.name === 'paragraph' ||
       node.type.name.startsWith('heading') ||
       node.type.name === 'codeBlock' ||
       node.type.name === 'blockquote')
    ) {
      const text = node.textContent || '';
      const isEmpty = text.trim().length === 0;
      const endPos = pos + node.nodeSize;
      
      // Map TipTap node types to our block types
      let blockType: 'heading' | 'paragraph' | 'codeBlock' | 'blockquote';
      if (node.type.name.startsWith('heading')) {
        blockType = 'heading';
      } else if (node.type.name === 'codeBlock') {
        blockType = 'codeBlock';
      } else if (node.type.name === 'blockquote') {
        blockType = 'blockquote';
      } else {
        blockType = 'paragraph';
      }

      blocks.push({
        lineNumber: lineNumber++,
        type: blockType,
        text: text,
        position: pos,
        endPosition: endPos,
        isEmpty: isEmpty,
      });
    }
    return true;
  });

  return blocks;
}

