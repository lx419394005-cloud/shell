/**
 * Common types for the application
 */

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl?: string;
  timestamp: number;
  aspectRatio?: string;
  model?: string;
  size?: string;
  groupId?: string;
  status?: 'loading' | 'success' | 'error';
  error?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  systemPrompt: string;
  description?: string;
  isCustom?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  updatedAt: number;
  createdAt: number;
}

export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  type: 'image' | 'chat' | 'all';
}
