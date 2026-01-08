import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { storageService } from '../services/storage';
import { IconFolderOpen, IconZap, IconFolder } from './Icons';

interface ProjectSelectProps {
  onSelectProject: (handle: FileSystemDirectoryHandle, project: Project) => void;
  onChangeKey: () => void;
}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({ onSelectProject, onChangeKey }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(storageService.getProjects());
  }, []);

  const handleCreate = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      const newProject = storageService.createProject(handle.name);
      setProjects([...projects, newProject]);
      onSelectProject(handle, newProject);
    } catch (err) {
      console.log('Cancelled creation');
    }
  };

  const handleImport = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      // Check if exists, else create
      const existing = projects.find(p => p.name === handle.name);
      if (existing) {
        onSelectProject(handle, existing);
      } else {
        const newProject = storageService.createProject(handle.name);
        setProjects([...projects, newProject]);
        onSelectProject(handle, newProject);
      }
    } catch (err) {
      console.log('Cancelled import');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center bg-slate-950 text-white p-4 overflow-y-auto">
      <div className="w-full max-w-4xl mt-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/20 rounded-lg">
                <IconZap className="w-6 h-6 text-indigo-400" />
             </div>
             <div>
               <h1 className="text-xl font-bold">Server Creator</h1>
               <p className="text-xs text-slate-500">Architecture: Hypixel/MushMC Standard</p>
             </div>
          </div>
          <button onClick={onChangeKey} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded px-3 py-1.5 transition">
             Change API Key
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div 
            onClick={handleCreate}
            className="group cursor-pointer p-6 rounded-xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <IconZap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create New Server</h3>
            <p className="text-sm text-slate-400">Initialize a new folder with high-performance defaults.</p>
          </div>

          <div 
            onClick={handleImport}
            className="group cursor-pointer p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all"
          >
            <div className="bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <IconFolderOpen className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Import Project</h3>
            <p className="text-sm text-slate-400">Open an existing folder to manage plugins.</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-600">
              No projects found. Create or import one to get started.
            </div>
          ) : (
            projects.map(project => (
              <div 
                key={project.id} 
                className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between group hover:border-indigo-500/50 transition cursor-default"
              >
                <div className="flex items-center gap-3">
                  <IconFolder className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  <div>
                    <h3 className="font-medium text-slate-200">{project.name}</h3>
                    <p className="text-xs text-slate-500">Last opened: {new Date(project.lastOpened).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};