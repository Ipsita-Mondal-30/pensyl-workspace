"use client";
import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { streamAIMessage, type ChatMessage as AIChatMessage } from '../services/ai-service';
import { localStorageFS } from '../lib/localStorageFS';

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
                fullContext = `Current file: ${options.currentFileName}\n\n${editorContent}\n\nUser request: ${userMessage}`;
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

            // Stream response using unified AI service (orchestration by default)
            for await (const chunk of streamAIMessage(messages, {
                context: options.currentFileName 
                    ? `Context: Editing ${options.currentFileName}${options.cursorInfo ? ` at line ${options.cursorInfo.line}` : ''}`
                    : undefined,
                metadata: {
                    currentFile: options.currentFileName,
                    currentFilePath: options.currentFilePath,
                    workspacePath: options.workspacePath,
                },
            })) {
                yield chunk;
            }
        } catch (error: any) {
            console.error('AI processing error:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [extractFileReferences, loadFileContent]);

    return {
        sendAIMessage,
        isProcessing,
        extractFileReferences,
    };
}

