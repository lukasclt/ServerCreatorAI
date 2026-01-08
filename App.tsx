import React, { useState, useEffect, useRef } from 'react';
import { AppState, FileNode, ChatMessage, ApiConfig, Project } from './types';
import { getFilesRecursive, writeFile, readFile } from './services/fileSystem';
import { generateServerCode } from './services/geminiService';
import { storageService } from './services/storage';
import { FileTree } from './components/FileTree';
import { IconTerminal, IconSend, IconLoader, IconRefresh, IconFolder, IconFile } from './components/Icons';
import { ApiSetup } from './components/ApiSetup';
import { ProjectSelect } from './components/ProjectSelect';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.API_SETUP);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for existing API configuration
    const config = storageService.getApiConfig();
    if (config && config.apiKey) {
      setApiConfig(config);
      setAppState(AppState.PROJECT_SELECT);
    } else {
      setAppState(AppState.API_SETUP);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleApiSetupComplete = (config: ApiConfig) => {
    setApiConfig(config);
    setAppState(AppState.PROJECT_SELECT);
  };

  const handleChangeKey = () => {
    setAppState(AppState.API_SETUP);
    setRootHandle(null);
    setCurrentProject(null);
  };

  const handleProjectSelected = async (handle: FileSystemDirectoryHandle, project: Project) => {
    setRootHandle(handle);
    setCurrentProject(project);
    setAppState(AppState.IDLE);
    await refreshFiles(handle);
    addSystemMessage(`Connected to project: ${project.name}. Using model: ${apiConfig?.model || 'Unknown'}`);
  };

  const handleBackToProjects = () => {
    setAppState(AppState.PROJECT_SELECT);
    setRootHandle(null);
    setFileStructure([]);
    setChatHistory([]);
  };

  const refreshFiles = async (handle: FileSystemDirectoryHandle) => {
    if (!handle) return;
    const structure = await getFilesRecursive(handle);
    setFileStructure(structure);
  };

  const addSystemMessage = (text: string) => {
    setChatHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      text,
      timestamp: Date.now()
    }]);
  };

  const handleFileSelect = async (file: FileNode) => {
    if (file.kind !== 'file' || !file.handle) return;
    
    try {
      const content = await readFile(file.handle as FileSystemFileHandle);
      setSelectedFile(file);
      setFileContent(content);
    } catch (err) {
      console.error("Error reading file:", err);
      addSystemMessage(`Error reading ${file.name}`);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !rootHandle || isProcessing || !apiConfig) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsProcessing(true);

    try {
      const flattenFiles = (nodes: FileNode[]): string[] => {
        let paths: string[] = [];
        for (const node of nodes) {
          paths.push(node.path);
          if (node.children) paths = [...paths, ...flattenFiles(node.children)];
        }
        return paths;
      };
      const context = `Current project structure: ${flattenFiles(fileStructure).join(', ')}`;

      const { message, files } = await generateServerCode(
        userMsg.text, 
        context, 
        apiConfig.apiKey, 
        apiConfig.model
      );

      const generatedNames: string[] = [];
      for (const file of files) {
        await writeFile(rootHandle, file.filename, file.content, file.directory);
        generatedNames.push(file.directory ? `${file.directory}/${file.filename}` : file.filename);
      }

      await refreshFiles(rootHandle);

      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: message,
        timestamp: Date.now(),
        generatedFiles: generatedNames
      }]);

    } catch (error) {
      setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // State Routing
  if (appState === AppState.API_SETUP) {
    return <ApiSetup onComplete={handleApiSetupComplete} />;
  }

  if (appState === AppState.PROJECT_SELECT) {
    return (
      <ProjectSelect 
        onSelectProject={handleProjectSelected} 
        onChangeKey={handleChangeKey}
      />
    );
  }

  // Render Main Workspace
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* LEFT: File Explorer */}
      <div className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex flex-col">
             <h2 className="font-semibold text-slate-300 flex items-center gap-2">
                <IconFolder className="w-4 h-4 text-indigo-400" />
                {currentProject?.name}
             </h2>
             <button onClick={handleBackToProjects} className="text-xs text-slate-500 hover:text-indigo-400 text-left mt-1">
                ← Switch Project
             </button>
          </div>
          <button onClick={() => rootHandle && refreshFiles(rootHandle)} className="text-slate-500 hover:text-white transition">
            <IconRefresh className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {fileStructure.length === 0 ? (
            <div className="text-center mt-10 text-slate-600 text-sm">Empty Directory</div>
          ) : (
            <FileTree 
              files={fileStructure} 
              onFileSelect={handleFileSelect} 
              selectedFile={selectedFile} 
            />
          )}
        </div>
      </div>

      {/* CENTER: Editor / Preview */}
      <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-800">
        {selectedFile ? (
          <>
            <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-950">
              <span className="text-sm text-slate-400 font-mono">{selectedFile.path}</span>
            </div>
            <div className="flex-1 overflow-auto relative group">
              <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed min-h-full">
                {fileContent}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
            <IconFile className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a file to view content</p>
          </div>
        )}
      </div>

      {/* RIGHT: Chat Interface */}
      <div className="w-96 flex-shrink-0 bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-slate-950 z-10">
          <h2 className="font-semibold text-indigo-400 flex items-center gap-2">
            <IconTerminal className="w-4 h-4" />
            AI Server Architect
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Model: {apiConfig?.model || 'Unknown'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[90%] rounded-lg p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : msg.role === 'system'
                    ? 'bg-slate-800 text-slate-400 text-xs italic'
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                }`}
              >
                {msg.text}
              </div>
              
              {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                <div className="mt-2 text-xs bg-slate-900/50 p-2 rounded border border-slate-800 w-full">
                  <span className="text-indigo-400 font-bold block mb-1">Generated:</span>
                  <ul className="list-disc list-inside text-slate-500 font-mono">
                    {msg.generatedFiles.map(f => (
                      <li key={f} className="truncate">{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-start">
              <div className="bg-slate-800 rounded-lg rounded-bl-none p-4 flex gap-2 items-center text-slate-400 text-sm">
                <IconLoader className="w-4 h-4 animate-spin" />
                Processing request...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="relative">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Create a lobby plugin with double jump..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-20 outline-none scrollbar-hide"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isProcessing || !chatInput.trim()}
              className="absolute right-2 bottom-2 p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconSend className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}