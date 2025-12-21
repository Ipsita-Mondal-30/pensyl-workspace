// Component exports for easier imports - organized by feature

// Layout components
export { TopBar } from './layout/TopBar';
export { Sidebar } from './layout/Sidebar';
export { StatusBar, type CursorPosition, type StatusBarProps } from './layout/StatusBar';

// Editor components
export { Editor } from './editor/Editor';
export { ContextualToolbar } from './editor/ContextualToolbar';
export { AutoToC } from './editor/AutoToC';

// Dialog components
export { SettingsModal } from './dialogs/SettingsModal';
export { InputDialog } from './dialogs/InputDialog';
export { CitationDialog } from './dialogs/CitationDialog';
export { FigureEditor } from './dialogs/FigureEditor';
export { MathEditor } from './dialogs/MathEditor';
export { TableInsertDialog } from './dialogs/TableInsertDialog';
export { NewFileDialog } from './dialogs/NewFileDialog';
export { CommandPalette, type Command } from './dialogs/CommandPalette';

// Tab components
export { Tab, type TabData } from './tabs/Tab';
export { TabStrip } from './tabs/TabStrip';

// AI components
export { ChatPanel } from './ai/ChatPanel';
export { AIOrchestrator } from './ai/AIOrchestrator';
export { PatchPreview } from './ai/PatchPreview';
export { DiffViewer } from './ai/DiffViewer';

// Citation components
export { CitationHeatmap } from './citations/CitationHeatmap';
export { MissingCitationIndicator } from './citations/MissingCitationIndicator';
export { ReferencesPanel } from './citations/ReferencesPanel';

// Analytics components
export { SectionAnalytics } from './analytics/SectionAnalytics';
export { ReviewPanel } from './analytics/ReviewPanel';
export { CommentThread } from './analytics/CommentThread';

// Table components
export { TableEditor } from './tables/TableEditor';

// UI components
export * from './ui/Icons';
export { ContextMenu } from './ui/ContextMenu';
export { ViewModeToggle, type ViewMode } from './ui/ViewModeToggle';

// Re-export Patch type from utils
export type { Patch } from '../utils/patchParser';
