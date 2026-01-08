import { ApiConfig, Project, User } from '../types';

const CONFIG_KEY = 'server_creator_config';
const PROJECTS_KEY = 'server_creator_projects';
const USERS_KEY = 'server_creator_users';

export const storageService = {
  // --- Configuration ---
  getApiConfig: (): ApiConfig | null => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  saveApiConfig: (config: ApiConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  clearApiConfig: () => {
    localStorage.removeItem(CONFIG_KEY);
  },

  // --- Projects ---
  getProjects: (): Project[] => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  createProject: (name: string): Project => {
    const projects = storageService.getProjects();
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      lastOpened: Date.now()
    };
    projects.push(newProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return newProject;
  },

  deleteProject: (projectId: string) => {
    let projects = storageService.getProjects();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  // --- Auth (Mock) ---
  register: (username: string, password: string): User => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};
    
    if (users[username]) {
      throw new Error("Username already taken");
    }

    // In a real app, never store passwords like this. This is a local mock.
    users[username] = { password };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { username };
  },

  login: (username: string, password: string): User => {
    const usersStr = localStorage.getItem(USERS_KEY);
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (!users[username] || users[username].password !== password) {
      throw new Error("Invalid username or password");
    }

    return { username };
  }
};