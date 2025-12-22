"use client";
/**
 * LocalStorage-based File System Service
 * Replaces Electron file system APIs for web version
 */

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileItem[];
}

const STORAGE_KEY = 'intellirite-filesystem';
const ROOT_SECTION = 'root';

interface FileSystemData {
  [path: string]: {
    type: 'file' | 'folder';
    content?: string;
    children?: string[]; // Array of child paths for folders
  };
}

/**
 * Get all filesystem data from localStorage
 */
function getFSData(): FileSystemData {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Save filesystem data to localStorage
 */
function saveFSData(data: FileSystemData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Initialize with default structure if empty
 */
function initializeDefaultStructure(): void {
  const data = getFSData();
  if (Object.keys(data).length === 0) {
    // Create root folder with a welcome file
    const welcomeContent = `# Welcome to Pensyl

This is a web-based version of Pensyl. All your files are stored in browser localStorage.

## Getting Started

- Create new files using the sidebar
- Use the AI chat panel for assistance
- All data is stored locally in your browser

Enjoy writing!`;

    saveFSData({
      [ROOT_SECTION]: {
        type: 'folder',
        children: ['root/welcome.md'],
      },
      'root/welcome.md': {
        type: 'file',
        content: welcomeContent,
      },
    });
  }
}

/**
 * Convert filesystem data to FileItem tree structure
 */
function buildFileTree(pathPrefix: string = ROOT_SECTION): FileItem[] {
  const data = getFSData();
  const items: FileItem[] = [];

  // Get children for this path
  const parent = data[pathPrefix];
  if (!parent || parent.type !== 'folder' || !parent.children) {
    return items;
  }

  for (const childPath of parent.children) {
    const child = data[childPath];
    if (!child) continue;

    const name = childPath.split('/').pop() || childPath;
    const extension = child.type === 'file' ? name.split('.').pop() : undefined;

    const item: FileItem = {
      id: childPath,
      name,
      path: pathPrefix,
      type: child.type,
      extension,
    };

    if (child.type === 'folder' && child.children) {
      item.children = buildFileTree(childPath);
    }

    items.push(item);
  }

  return items.sort((a, b) => {
    // Folders first, then files, both alphabetically
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * File System API - mimics Electron fileSystem API
 */
export const localStorageFS = {
  /**
   * Open folder (in web version, we use sections stored in localStorage)
   * Returns the section name (default: 'root')
   */
  async openFolder(): Promise<string> {
    initializeDefaultStructure();
    return ROOT_SECTION;
  },

  /**
   * Read folder structure
   */
  async readFolder(path: string): Promise<FileItem[]> {
    initializeDefaultStructure();
    return buildFileTree(path);
  },

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<{ success: boolean; content?: string }> {
    initializeDefaultStructure();
    const data = getFSData();
    const file = data[filePath];

    if (!file || file.type !== 'file') {
      return { success: false };
    }

    return {
      success: true,
      content: file.content || '',
    };
  },

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const data = getFSData();
    if (!data[filePath]) {
      // File doesn't exist, create it
      const pathParts = filePath.split('/');
      const parentPath = pathParts.slice(0, -1).join('/') || ROOT_SECTION;
      const fileName = pathParts[pathParts.length - 1];

      // Ensure parent folder exists
      if (!data[parentPath]) {
        data[parentPath] = {
          type: 'folder',
          children: [],
        };
      }

      // Add to parent's children
      if (data[parentPath].type === 'folder') {
        const children = data[parentPath].children || [];
        if (!children.includes(filePath)) {
          children.push(filePath);
          data[parentPath].children = children;
        }
      }

      // Create file
      data[filePath] = {
        type: 'file',
        content,
      };
    } else {
      // Update existing file
      data[filePath].content = content;
    }

    saveFSData(data);
  },

  /**
   * Create a new file
   */
  async createFile(parentPath: string, fileName: string): Promise<void> {
    initializeDefaultStructure();
    const data = getFSData();

    // Ensure parent exists and is a folder
    if (!data[parentPath]) {
      data[parentPath] = {
        type: 'folder',
        children: [],
      };
    }

    if (data[parentPath].type !== 'folder') {
      throw new Error('Parent is not a folder');
    }

    const filePath = parentPath === ROOT_SECTION 
      ? `${ROOT_SECTION}/${fileName}`
      : `${parentPath}/${fileName}`;

    // Check if file already exists
    if (data[filePath]) {
      throw new Error('File already exists');
    }

    // Create file
    data[filePath] = {
      type: 'file',
      content: '',
    };

    // Add to parent's children
    const children = data[parentPath].children || [];
    children.push(filePath);
    data[parentPath].children = children;

    saveFSData(data);
  },

  /**
   * Create a new folder (section)
   */
  async createFolder(parentPath: string, folderName: string): Promise<void> {
    initializeDefaultStructure();
    const data = getFSData();

    // Ensure parent exists and is a folder
    if (!data[parentPath]) {
      data[parentPath] = {
        type: 'folder',
        children: [],
      };
    }

    if (data[parentPath].type !== 'folder') {
      throw new Error('Parent is not a folder');
    }

    const folderPath = parentPath === ROOT_SECTION
      ? `${ROOT_SECTION}/${folderName}`
      : `${parentPath}/${folderName}`;

    // Check if folder already exists
    if (data[folderPath]) {
      throw new Error('Folder already exists');
    }

    // Create folder
    data[folderPath] = {
      type: 'folder',
      children: [],
    };

    // Add to parent's children
    const children = data[parentPath].children || [];
    children.push(folderPath);
    data[parentPath].children = children;

    saveFSData(data);
  },

  /**
   * Rename file or folder
   */
  async rename(oldPath: string, newName: string): Promise<void> {
    initializeDefaultStructure();
    const data = getFSData();

    if (!data[oldPath]) {
      throw new Error('File or folder not found');
    }

    const pathParts = oldPath.split('/');
    const parentPath = pathParts.slice(0, -1).join('/') || ROOT_SECTION;
    const newPath = parentPath === ROOT_SECTION
      ? `${ROOT_SECTION}/${newName}`
      : `${parentPath}/${newName}`;

    // Check if new path already exists
    if (data[newPath]) {
      throw new Error('A file or folder with that name already exists');
    }

    // Move the item
    data[newPath] = data[oldPath];

    // Update parent's children list
    if (data[parentPath] && data[parentPath].type === 'folder') {
      const children = data[parentPath].children || [];
      const index = children.indexOf(oldPath);
      if (index !== -1) {
        children[index] = newPath;
        data[parentPath].children = children;
      }
    }

    // If it's a folder, update all child paths
    if (data[newPath].type === 'folder' && data[newPath].children) {
      const newChildren: string[] = [];
      for (const childPath of data[newPath].children || []) {
        const relativePath = childPath.substring(oldPath.length);
        newChildren.push(newPath + relativePath);
      }
      // Recursively update all descendant paths
      // This is simplified - in a real implementation, we'd need to update all nested paths
      data[newPath].children = newChildren;
    }

    // Delete old path
    delete data[oldPath];

    saveFSData(data);
  },

  /**
   * Delete file or folder
   */
  async delete(path: string): Promise<void> {
    initializeDefaultStructure();
    const data = getFSData();

    if (!data[path]) {
      throw new Error('File or folder not found');
    }

    // If it's a folder, delete all children recursively
    if (data[path].type === 'folder' && data[path].children) {
      for (const childPath of data[path].children || []) {
        await this.delete(childPath);
      }
    }

    // Remove from parent's children
    const pathParts = path.split('/');
    const parentPath = pathParts.slice(0, -1).join('/') || ROOT_SECTION;

    if (data[parentPath] && data[parentPath].type === 'folder') {
      const children = data[parentPath].children || [];
      const index = children.indexOf(path);
      if (index !== -1) {
        children.splice(index, 1);
        data[parentPath].children = children;
      }
    }

    // Delete the item
    delete data[path];

    saveFSData(data);
  },
};

// Make it available globally for compatibility with Electron code
if (typeof window !== 'undefined') {
  (window as any).fileSystem = localStorageFS;
}

