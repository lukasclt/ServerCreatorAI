import { ApiConfig, Project } from '../types';

const CONFIG_KEY = 'server_creator_config';
const PROJECTS_KEY = 'server_creator_projects';

// Helper functions for Cookie Management
const setCookie = (name: string, value: string, days: number = 365) => {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  // Using SameSite=Lax for general compatibility
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/; SameSite=Lax";
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

const eraseCookie = (name: string) => {   
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const storageService = {
  // --- Configuration ---
  getApiConfig: (): ApiConfig | null => {
    const stored = getCookie(CONFIG_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Failed to parse API config cookie", e);
      return null;
    }
  },

  saveApiConfig: (config: ApiConfig) => {
    setCookie(CONFIG_KEY, JSON.stringify(config));
  },

  clearApiConfig: () => {
    eraseCookie(CONFIG_KEY);
  },

  // --- Projects ---
  getProjects: (): Project[] => {
    const stored = getCookie(PROJECTS_KEY);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse Projects cookie", e);
      return [];
    }
  },

  createProject: (name: string): Project => {
    const projects = storageService.getProjects();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      lastOpened: Date.now()
    };
    // Cookies have size limits (~4KB). 
    // This is fine for a demo with metadata, but would need DB for heavy data.
    const updatedProjects = [...projects, newProject];
    setCookie(PROJECTS_KEY, JSON.stringify(updatedProjects));
    return newProject;
  },

  deleteProject: (projectId: string) => {
    let projects = storageService.getProjects();
    projects = projects.filter(p => p.id !== projectId);
    setCookie(PROJECTS_KEY, JSON.stringify(projects));
  }
};