"use client";

import { useState, useCallback } from "react";
import { useProjects } from "../../hooks/useProjects";
import { projectsClient } from "../../lib/projects-client";
import { PlusIcon, TrashIcon, EditIcon } from "../ui/Icons";

interface ProjectsScreenProps {
  onOpenProject: (projectId: string) => Promise<void> | void;
}

/**
 * Projects screen shown when the user clicks Research → Open projects.
 * Lists all projects, supports create/delete, and opens a project workspace.
 */
export function ProjectsScreen({ onOpenProject }: ProjectsScreenProps) {
  const {
    projects,
    loading,
    error,
    refreshProjects,
    createProject,
    deleteProject,
  } = useProjects();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const project = await createProject({
        name: newProjectName.trim(),
        content: { type: "doc", content: [{ type: "paragraph" }] },
      });
      setNewProjectName("");
      setShowCreateDialog(false);
      await onOpenProject(project.id);
    } catch (err: any) {
      console.error("Failed to create project:", err);
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  }, [newProjectName, createProject, onOpenProject]);

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!confirm("Delete this project? This cannot be undone.")) return;
      try {
        await deleteProject(projectId);
      } catch (err: any) {
        console.error("Failed to delete project:", err);
        alert(`Failed to delete project: ${err.message}`);
      }
    },
    [deleteProject]
  );

  const handleRenameProject = useCallback(
    async (projectId: string, currentName: string) => {
      const newName = prompt("Enter new project name", currentName);
      if (!newName || !newName.trim() || newName === currentName) return;
      try {
        await projectsClient.updateProject(projectId, { name: newName.trim() });
        await refreshProjects();
      } catch (err: any) {
        console.error("Failed to rename project:", err);
        alert(`Failed to rename project: ${err.message}`);
      }
    },
    [refreshProjects]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Select a project to open, or create a new one.
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && projects.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            Loading projects...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-red-500">{error}</div>
            <button
              onClick={refreshProjects}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-secondary)]">
            <p>No projects yet</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:opacity-90"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{project.name}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      Last saved {formatDate(project.lastSavedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameProject(project.id, project.name);
                      }}
                      className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded"
                      title="Rename"
                    >
                      <EditIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create project dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Create new project</h3>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 border border-[var(--border-primary)] rounded bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") setShowCreateDialog(false);
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewProjectName("");
                }}
                className="px-4 py-2 border border-[var(--border-primary)] rounded hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || isCreating}
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
