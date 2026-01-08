import React, { useState } from 'react';
import { FileNode } from '../types';
import { IconChevronDown, IconChevronRight, IconFile, IconFolder } from './Icons';

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile: FileNode | null;
  level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, selectedFile, level = 0 }) => {
  return (
    <ul className="pl-2">
      {files.map((file) => (
        <FileTreeItem 
          key={file.path} 
          file={file} 
          onFileSelect={onFileSelect} 
          selectedFile={selectedFile}
          level={level}
        />
      ))}
    </ul>
  );
};

const FileTreeItem: React.FC<{ 
  file: FileNode; 
  onFileSelect: (f: FileNode) => void;
  selectedFile: FileNode | null;
  level: number;
}> = ({ file, onFileSelect, selectedFile, level }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFile?.path === file.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.kind === 'directory') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(file);
    }
  };

  return (
    <li className="select-none">
      <div 
        onClick={handleClick}
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
        }`}
        style={{ paddingLeft: `${level * 12}px` }}
      >
        {file.kind === 'directory' && (
          <span className="text-slate-500">
            {isOpen ? <IconChevronDown className="w-4 h-4" /> : <IconChevronRight className="w-4 h-4" />}
          </span>
        )}
        <span className={`${file.kind === 'directory' ? 'text-blue-400' : 'text-slate-400'}`}>
          {file.kind === 'directory' ? <IconFolder className="w-4 h-4" /> : <IconFile className="w-4 h-4" />}
        </span>
        <span className="text-sm truncate">{file.name}</span>
      </div>
      
      {file.kind === 'directory' && isOpen && file.children && (
        <FileTree 
          files={file.children} 
          onFileSelect={onFileSelect} 
          selectedFile={selectedFile}
          level={level + 1}
        />
      )}
    </li>
  );
};