import { FileNode } from '../types';

export const verifyPermission = async (fileHandle: FileSystemHandle, readWrite: boolean): Promise<boolean> => {
  const options: any = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  if ((await (fileHandle as any).queryPermission(options)) === 'granted') {
    return true;
  }
  if ((await (fileHandle as any).requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
};

export const getFilesRecursive = async (dirHandle: FileSystemDirectoryHandle, path: string = ''): Promise<FileNode[]> => {
  const files: FileNode[] = [];
  
  for await (const entry of dirHandle.values()) {
    const fullPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'file') {
      files.push({
        name: entry.name,
        kind: 'file',
        path: fullPath,
        handle: entry as FileSystemFileHandle
      });
    } else if (entry.kind === 'directory') {
      const dirEntry = entry as FileSystemDirectoryHandle;
      const children = await getFilesRecursive(dirEntry, fullPath);
      files.push({
        name: entry.name,
        kind: 'directory',
        path: fullPath,
        handle: dirEntry,
        children
      });
    }
  }
  
  // Sort: Directories first, then files
  return files.sort((a, b) => {
    if (a.kind === b.kind) return a.name.localeCompare(b.name);
    return a.kind === 'directory' ? -1 : 1;
  });
};

export const writeFile = async (
  rootHandle: FileSystemDirectoryHandle, 
  filename: string, 
  content: string, 
  directoryPath?: string
): Promise<void> => {
  let targetDirHandle = rootHandle;

  // Navigate or create subdirectories
  if (directoryPath) {
    const parts = directoryPath.split('/').filter(p => p.trim() !== '');
    for (const part of parts) {
      targetDirHandle = await targetDirHandle.getDirectoryHandle(part, { create: true });
    }
  }

  // Handle nested paths in filename (e.g., "src/index.js")
  const parts = filename.split('/');
  const actualFilename = parts.pop();
  
  if (!actualFilename) throw new Error("Invalid filename");

  // If filename had path parts, go deeper
  for (const part of parts) {
    targetDirHandle = await targetDirHandle.getDirectoryHandle(part, { create: true });
  }

  const fileHandle = await targetDirHandle.getFileHandle(actualFilename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

export const readFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  const file = await fileHandle.getFile();
  return await file.text();
};