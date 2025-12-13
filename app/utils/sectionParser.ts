/**
 * Section Parser - Extracts sections (headings) from document content
 */

export interface Section {
  id: string;
  name: string;
  level: number; // 1 for h1, 2 for h2, etc.
  position: number; // Character position in document
  children?: Section[];
}

/**
 * Parse sections from HTML content (TipTap output)
 */
export function parseSectionsFromHTML(html: string): Section[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  const sections: Section[] = [];
  const stack: Section[] = []; // Stack to track parent sections
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const name = heading.textContent?.trim() || `Untitled Section ${index + 1}`;
    const id = `section-${index}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Find the HTML string position (approximate)
    const htmlString = html;
    const headingHTML = heading.outerHTML;
    const position = htmlString.indexOf(headingHTML);
    
    const section: Section = {
      id,
      name,
      level,
      position: position >= 0 ? position : 0,
    };
    
    // Build hierarchy
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      sections.push(section);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(section);
    }
    
    stack.push(section);
  });
  
  return sections;
}

/**
 * Parse sections from markdown content
 */
export function parseSectionsFromMarkdown(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  const stack: Section[] = [];
  let position = 0;
  
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const name = headingMatch[2].trim();
      const id = `section-${lineIndex}-${name.toLowerCase().replace(/\s+/g, '-')}`;
      
      const section: Section = {
        id,
        name,
        level,
        position,
      };
      
      // Build hierarchy
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        sections.push(section);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(section);
      }
      
      stack.push(section);
    }
    
    position += line.length + 1; // +1 for newline
  });
  
  return sections;
}

/**
 * Find section position in editor (for scrolling)
 */
export function findSectionInEditor(editor: any, sectionName: string): number | null {
  if (!editor) return null;
  
  try {
    const { state } = editor.view;
    const { doc } = state;
    
    // Search through the document for the heading
    let foundPos: number | null = null;
    
    doc.descendants((node: any, pos: number) => {
      if (foundPos !== null) return false; // Stop searching once found
      
      // Check if this is a heading node
      if (node.type && node.type.name && node.type.name.startsWith('heading')) {
        const headingText = node.textContent?.trim() || '';
        if (headingText === sectionName) {
          foundPos = pos;
          return false; // Stop iteration
        }
      }
      return true; // Continue searching
    });
    
    return foundPos;
  } catch (error) {
    console.error('Error finding section:', error);
  }
  
  return null;
}

/**
 * Add a new section heading to the end of the document
 */
export function addSectionToDocument(content: string, sectionName: string, level: number = 2): string {
  const trimmed = content.trim();
  const newSection = '\n\n' + '#'.repeat(level) + ' ' + sectionName + '\n\n';
  
  if (!trimmed) {
    return newSection.trim();
  }
  
  return trimmed + newSection;
}

