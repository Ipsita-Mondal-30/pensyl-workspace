// Shared types for Pensyl

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  children?: FileItem[];
  isExpanded?: boolean;
}

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  isModified: boolean;
  content: string;
}

export interface EditorState {
  activeTabId: string | null;
  tabs: Tab[];
  cursorPosition: {
    line: number;
    column: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
}

export interface WindowState {
  isMaximized: boolean;
  isSidebarOpen: boolean;
  isChatOpen: boolean;
}

export type Theme = 'dark' | 'light' | 'system';

export interface Settings {
  theme: Theme;
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  autoSaveDelay: number;
}

