import React from 'react';
import { Folder, FileCode, Terminal, ChevronRight, ChevronDown, Zap, Save, RefreshCw, FolderOpen, Send, Loader2 } from 'lucide-react';

export const IconFolder = ({ className }: { className?: string }) => <Folder className={className} />;
export const IconFile = ({ className }: { className?: string }) => <FileCode className={className} />;
export const IconTerminal = ({ className }: { className?: string }) => <Terminal className={className} />;
export const IconChevronRight = ({ className }: { className?: string }) => <ChevronRight className={className} />;
export const IconChevronDown = ({ className }: { className?: string }) => <ChevronDown className={className} />;
export const IconZap = ({ className }: { className?: string }) => <Zap className={className} />;
export const IconSave = ({ className }: { className?: string }) => <Save className={className} />;
export const IconRefresh = ({ className }: { className?: string }) => <RefreshCw className={className} />;
export const IconFolderOpen = ({ className }: { className?: string }) => <FolderOpen className={className} />;
export const IconSend = ({ className }: { className?: string }) => <Send className={className} />;
export const IconLoader = ({ className }: { className?: string }) => <Loader2 className={className} />;