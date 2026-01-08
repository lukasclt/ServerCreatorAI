import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ApiConfig } from '../types';
import { IconZap, IconLoader, IconSave } from './Icons';

interface ApiSetupProps {
  onComplete: (config: ApiConfig) => void;
}

export const ApiSetup: React.FC<ApiSetupProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-2.0-flash-001');
  const [loading, setLoading] = useState(false);

  // Pre-fill if exists (allow editing)
  useEffect(() => {
    const existing = storageService.getApiConfig();
    if (existing) {
      setApiKey(existing.apiKey);
      setModel(existing.model);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Small artificial delay for UX
      await new Promise(r => setTimeout(r, 400));
      const config: ApiConfig = { apiKey, model };
      storageService.saveApiConfig(config);
      onComplete(config);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-full">
            <IconZap className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">Server Creator AI</h1>
        <p className="text-slate-500 text-center text-sm mb-8">
          Enter your OpenRouter credentials to start building Minecraft servers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">OpenRouter API Key</label>
            <input
              type="password"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-mono"
              placeholder="sk-or-..."
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Key is stored locally in your browser.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Model Selection</label>
            <div className="relative">
              <input 
                type="text" 
                list="models" 
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Select or type a model..."
              />
              <datalist id="models">
                <option value="google/gemini-2.0-flash-001" />
                <option value="google/gemini-pro-1.5" />
                <option value="anthropic/claude-3.5-sonnet" />
                <option value="openai/gpt-4o" />
                <option value="deepseek/deepseek-r1" />
              </datalist>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Gemini 2.0 Flash or Claude 3.5 Sonnet recommended.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
          >
            {loading ? <IconLoader className="animate-spin w-5 h-5" /> : <IconSave className="w-4 h-4" />}
            {loading ? 'Connecting...' : 'Connect to AI'}
          </button>
        </form>
      </div>
    </div>
  );
};