"use client";
import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { streamAIMessage, type ChatMessage as AIChatMessage } from '../services/ai-service';
import { localStorageFS } from '../lib/localStorageFS';
import { extractEditorBlocks } from '../utils/editor-blocks';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface AIMessageOptions {
    editor?: Editor;
    currentFilePath?: string;
    currentFileName?: string;
    cursorInfo?: { line: number; column: number };
    workspacePath?: string;
    selectedModelId?: string; // Model ID from backend model registry
}

/**
 * Simplified useAIChat hook for web version
 */
export function useAIChat() {
    const [isProcessing, setIsProcessing] = useState(false);

    const extractFileReferences = useCallback((message: string): string[] => {
        const regex = /@([\w-]+\.[\w]+)/g;
        const matches = message.matchAll(regex);
        return Array.from(matches, m => m[1]);
    }, []);

    /**
     * Format document with line numbers for AI context
     * Ensures proper alignment: line numbers are right-aligned in a fixed-width column
     */
    const formatDocumentWithLineNumbers = useCallback((content: string): string => {
        const lines = content.split('\n');
        const formattedLines: string[] = [];
        let currentSection = '';
        
        // Calculate max line number width for alignment (e.g., if max is 100, width is 3)
        const maxLineNumber = lines.length;
        const lineNumberWidth = Math.max(3, maxLineNumber.toString().length);

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trim();

            // Detect section markers (headings in markdown)
            if (trimmedLine.match(/^#{1,6}\s+.+$/)) {
                const sectionName = trimmedLine.replace(/^#+\s+/, '');
                if (currentSection) {
                    formattedLines.push(`[Section: ${currentSection} ends at line ${lineNumber - 1}]`);
                }
                currentSection = sectionName;
                formattedLines.push(`[Section: ${currentSection} starts at line ${lineNumber}]`);
            }

            // Format line with right-aligned line number: "  1: content" or "100: content"
            const lineNumberStr = lineNumber.toString().padStart(lineNumberWidth, ' ');
            formattedLines.push(`${lineNumberStr}: ${line}`);
        });

        // Add final section marker
        if (currentSection && lines.length > 0) {
            formattedLines.push(`[Section: ${currentSection} ends at line ${lines.length}]`);
        }

        return formattedLines.join('\n');
    }, []);

    const loadFileContent = useCallback(async (fileName: string, workspacePath?: string): Promise<string | null> => {
        try {
            let filePath = fileName;
            if (workspacePath && !fileName.startsWith('/')) {
                filePath = `${workspacePath}/${fileName}`;
            }

            const result = await localStorageFS.readFile(filePath);
            if (!result.success || !result.content) {
                return null;
            }

            const lines = result.content.split('\n');
            const CHUNK_SIZE = 60;

            if (lines.length <= CHUNK_SIZE) {
                return result.content;
            }

            const chunk = lines.slice(0, CHUNK_SIZE).join('\n');
            const totalLines = lines.length;
            const summary = `\n\n[... ${totalLines - CHUNK_SIZE} more lines (${totalLines} total). Showing first ${CHUNK_SIZE} lines]`;

            return chunk + summary;
        } catch (error) {
            console.error('Error loading file:', fileName, error);
            return null;
        }
    }, []);

    const sendAIMessage = useCallback(async function* (
        userMessage: string,
        chatHistory: ChatMessage[],
        options: AIMessageOptions
    ): AsyncGenerator<string, void, unknown> {
        setIsProcessing(true);

        try {
            let fullContext = userMessage;

            // Add current file context if available
            if (options.editor && options.currentFileName) {
                const editorContent = options.editor.getText();
                // Format document with line numbers for document editing operations
                const formattedContent = formatDocumentWithLineNumbers(editorContent);
                fullContext = `Current file: ${options.currentFileName}\n\n${formattedContent}\n\nUser request: ${userMessage}`;
            }

            // Load referenced files
            const fileRefs = extractFileReferences(userMessage);
            for (const fileName of fileRefs) {
                const content = await loadFileContent(fileName, options.workspacePath);
                if (content) {
                    fullContext += `\n\n--- File: ${fileName} ---\n${content}`;
                }
            }

            // Build messages array for AI service (orchestration or Gemini)
            const messages: AIChatMessage[] = [
                ...chatHistory.slice(-5).map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                })),
                {
                    role: 'user' as const,
                    content: fullContext,
                },
            ];

            // Extract editor blocks for accurate section resolution
            const blocks = options.editor ? extractEditorBlocks(options.editor) : [];
            
            // Stream response using unified AI service (backend by default)
            for await (const chunk of streamAIMessage(messages, {
                context: options.currentFileName 
                    ? `Context: Editing ${options.currentFileName}${options.cursorInfo ? ` at line ${options.cursorInfo.line}` : ''}`
                    : undefined,
                metadata: {
                    currentFile: options.currentFileName,
                    currentFilePath: options.currentFilePath,
                    workspacePath: options.workspacePath,
                    blocks: blocks, // CRITICAL: Send block structure for accurate section resolution
                },
                selectedModelId: options.selectedModelId, // Pass selected model ID if provided
            })) {
                yield chunk;
            }
        } catch (error: any) {
            console.error('AI processing error:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [extractFileReferences, loadFileContent, formatDocumentWithLineNumbers]);

    return {
        sendAIMessage,
        isProcessing,
        extractFileReferences,
    };
}

