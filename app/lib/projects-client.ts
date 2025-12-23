/**
 * Projects Client
 * 
 * Type-safe client for managing projects (create, read, update, delete)
 */

/**
 * Get backend API URL
 */
function getBackendUrl(): string {
  // Backend runs on 3001 in this setup
  const defaultUrl = 'http://localhost:3001';
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_BACKEND_URL || defaultUrl;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || defaultUrl;
}

export interface Project {
  id: string;
  name: string;
  content?: any; // TipTap JSON content
  context?: any; // AI context data
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  content?: any;
}

export interface UpdateProjectDto {
  name?: string;
  content?: any;
  context?: any;
}

/**
 * Projects Client class
 */
export class ProjectsClient {
  private apiUrl: string;

  constructor() {
    this.apiUrl = getBackendUrl();
  }

  /**
   * Get all projects for the current user
   */
  async getAllProjects(): Promise<ProjectListItem[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/projects`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to fetch projects: ${response.status}`,
        );
      }

      const data = await response.json();
      return data.projects || [];
    } catch (error: any) {
      console.error('[ProjectsClient] Failed to fetch projects:', error);
      throw error;
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    try {
      const response = await fetch(`${this.apiUrl}/api/projects/${projectId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to fetch project: ${response.status}`,
        );
      }

      const data = await response.json();
      return data.project;
    } catch (error: any) {
      console.error('[ProjectsClient] Failed to fetch project:', error);
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async createProject(dto: CreateProjectDto): Promise<Project> {
    try {
      const response = await fetch(`${this.apiUrl}/api/projects`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to create project: ${response.status}`,
        );
      }

      const data = await response.json();
      return data.project;
    } catch (error: any) {
      console.error('[ProjectsClient] Failed to create project:', error);
      throw error;
    }
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, dto: UpdateProjectDto): Promise<Project> {
    try {
      const response = await fetch(`${this.apiUrl}/api/projects/${projectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to update project: ${response.status}`,
        );
      }

      const data = await response.json();
      return data.project;
    } catch (error: any) {
      console.error('[ProjectsClient] Failed to update project:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to delete project: ${response.status}`,
        );
      }
    } catch (error: any) {
      console.error('[ProjectsClient] Failed to delete project:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const projectsClient = new ProjectsClient();

