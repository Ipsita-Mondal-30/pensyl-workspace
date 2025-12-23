"use client";

import { useState, useEffect, useCallback } from 'react';
import { projectsClient, type Project, type ProjectListItem, type CreateProjectDto, type UpdateProjectDto } from '../lib/projects-client';

export interface UseProjectsReturn {
  projects: ProjectListItem[];
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  createProject: (dto: CreateProjectDto) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectsClient.getAllProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
      console.error('[useProjects] Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject = useCallback(async (dto: CreateProjectDto): Promise<Project> => {
    try {
      const newProject = await projectsClient.createProject(dto);
      // Refresh the list
      await refreshProjects();
      return newProject;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      throw err;
    }
  }, [refreshProjects]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      await projectsClient.deleteProject(projectId);
      // Refresh the list
      await refreshProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      throw err;
    }
  }, [refreshProjects]);

  return {
    projects,
    loading,
    error,
    refreshProjects,
    createProject,
    deleteProject,
  };
}

