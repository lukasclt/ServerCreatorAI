export interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: FileNode[];
  content?: string; // Cache content for preview
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  generatedFiles?: string[]; // List of filenames generated in this turn
}

export interface GeneratedFile {
  filename: string;
  content: string;
  directory?: string; // Optional subdirectory
}

export interface ApiConfig {
  apiKey: string;
  model: string;
}

export interface Project {
  id: string;
  name: string;
  lastOpened: number;
}

export interface User {
  username: string;
}

export enum AppState {
  API_SETUP = 'API_SETUP', // First screen: Config API
  PROJECT_SELECT = 'PROJECT_SELECT',
  IDLE = 'IDLE', // Connected to project, waiting for action
  GENERATING = 'GENERATING',
  ERROR = 'ERROR'
}