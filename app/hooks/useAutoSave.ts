"use client";

import { useEffect, useRef, useCallback } from 'react';
import { projectsClient } from '../lib/projects-client';

interface UseAutoSaveOptions {
  projectId: string | null;
  content: any; // TipTap JSON content
  enabled?: boolean;
  interval?: number; // Auto-save interval in milliseconds (default: 7.5 seconds)
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Auto-save hook that saves project content periodically
 * 
 * @param options Configuration options for auto-save
 * @returns Object with save function and status
 */
export function useAutoSave({
  projectId,
  content,
  enabled = true,
  interval = 7500, // Default: 7.5 seconds (between 5-10 seconds)
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<any>(null);
  const isSavingRef = useRef(false);
  const projectIdRef = useRef<string | null>(projectId);

  // Update projectId ref when it changes
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  /**
   * Save function that debounces and prevents duplicate saves
   */
  const save = useCallback(async () => {
    // Don't save if no project ID
    if (!projectIdRef.current) {
      return;
    }

    // Don't save if content hasn't changed
    if (JSON.stringify(lastSavedContentRef.current) === JSON.stringify(content)) {
      return;
    }

    // Don't save if already saving
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      await projectsClient.updateProject(projectIdRef.current, {
        content,
      });

      lastSavedContentRef.current = JSON.parse(JSON.stringify(content)); // Deep clone
      onSaveSuccess?.();
    } catch (error: any) {
      console.error('[useAutoSave] Failed to save:', error);
      onSaveError?.(error);
    } finally {
      isSavingRef.current = false;
    }
  }, [content, onSaveSuccess, onSaveError]);

  /**
   * Setup auto-save interval
   */
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set up new timeout
    saveTimeoutRef.current = setInterval(() => {
      save();
    }, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [enabled, projectId, interval, save]);

  /**
   * Save immediately when content changes significantly (manual save trigger)
   */
  const saveNow = useCallback(async () => {
    if (!projectIdRef.current) {
      return;
    }

    // Clear the auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately
    await save();

    // Restart the auto-save interval
    if (enabled && projectIdRef.current) {
      saveTimeoutRef.current = setInterval(() => {
        save();
      }, interval);
    }
  }, [enabled, interval, save]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearInterval(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    save: saveNow,
  };
}

