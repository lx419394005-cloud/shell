/**
 * ChatPanel - AI Chat Panel
 *
 * @description AI chat panel with streaming responses
 * @example <ChatPanel />
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Loader2, Copy, Check, Sparkles, AlertCircle, Trash2, X, Brain, 
  Coffee, Ghost, Palette, Music, 
  ChevronDown, ChevronRight, Edit2, Save, Paperclip, ArrowUp, 
  Lightbulb, Code, Plus, FileText, Settings, 
  History, Share2, Download, Image as ImageIcon, Type, Layout, Palette as PaletteIcon,
  Maximize, Square, Smartphone, MousePointer2, ShieldAlert
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { cn } from '../../../utils/cn';
import { Button, Modal } from '../../common';
import { sendChatMessage, createChatAbortController, AUTH_TOKEN } from '../../../services/chatApi';
import { getActiveApiConfig, getCurrentChatSessionId, setCurrentChatSessionId } from '../../../utils/apiConfig';
import { 
  saveChatSessionToDB, 
  getAllChatSessionsFromDB, 
  deleteChatSessionFromDB,
  saveAgentToDB,
  getAllAgentsFromDB,
  deleteAgentFromDB,
  migrateLocalStorageData
} from '../../../utils/db';
import type { ChatMessage } from '../../../types/api';
import type { Message, Agent, ChatSession } from '../../../types';

/** ChatPanel props interface */
export interface ChatPanelProps {
  /** CSS class name */
  className?: string;
  /** Image history from parent */
  history?: any[];
}

/** Export Template Types */
type ExportTemplate = 'default' | 'minimal' | 'gradient' | 'dark' | 'polaroid';
type AspectRatio = 'auto' | '1:1' | '3:4' | '9:16';

/** Export Card Component */
const MessageExportCard: React.FC<{ 
  message: Message; 
  agent: Agent;
  id: string;
  template?: ExportTemplate;
  editedContent?: string;
  aspectRatio?: AspectRatio;
  fontSize?: number;
  onContentChange?: (content: string) => void;
  isEditing?: boolean;
}> = ({ message, agent, id, template = 'default', editedContent, aspectRatio = 'auto', fontSize = 15, onContentChange, isEditing = false }) => {
  const isAI = message.role === 'assistant';
  const content = editedContent || message.content;
  const dateStr = new Date(message.timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1': return 'aspect-square';
      case '3:4': return 'aspect-[3/4]';
      case '9:16': return 'aspect-[9/16]';
      default: return '';
    }
  };

  const renderContent = (textColor: string) => {
    const hasImage = content.includes('![');
    if (hasImage) {
      const parts = content.split('\n');
      const text = parts[0];
      const imageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
      return (
        <div className="space-y-4">
          {isEditing ? (
            <textarea
              className="w-full bg-transparent border-none focus:outline-none resize-none p-0 overflow-hidden text-center"
              style={{ color: textColor, fontSize: `${fontSize}px` }}
              value={text}
              onChange={(e) => onContentChange?.(e.target.value + (imageMatch ? `\n![Generated](${imageMatch[2]})` : ''))}
              rows={Math.max(1, text.split('\n').length)}
            />
          ) : (
            <p style={{ color: textColor, fontSize: `${fontSize}px` }}>{text}</p>
          )}
          {imageMatch && (
            <div className={cn(
              "overflow-hidden shadow-md border",
              template === 'polaroid' ? "rounded-none border-gray-200 p-2 bg-white" : "rounded-2xl border-gray-100"
            )}>
              <img 
                src={imageMatch[2]} 
                alt="Generated" 
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      );
    }
    
    const textValue = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    if (isEditing) {
      return (
        <textarea
          className="w-full bg-transparent border-none focus:outline-none resize-none p-0 overflow-hidden text-inherit leading-relaxed text-center"
          style={{ color: textColor, fontSize: `${fontSize}px` }}
          value={textValue}
          onChange={(e) => onContentChange?.(e.target.value)}
          rows={Math.max(1, textValue.split('\n').length)}
        />
      );
    }

    return (
      <div 
        className="whitespace-pre-wrap break-words"
        style={{ color: textColor, fontSize: `${fontSize}px` }}
      >
        {textValue}
      </div>
    );
  };

  const containerBaseClass = cn(
    "w-[400px] flex flex-col transition-all duration-300",
    getAspectRatioClass(),
    aspectRatio !== 'auto' ? "h-[auto] overflow-hidden" : ""
  );

  if (template === 'minimal') {
    return (
      <div id={id} className={cn(containerBaseClass, "bg-white p-10 font-sans border border-gray-100")}>
        <div className="mb-10 shrink-0 text-center">
          <div className="inline-block px-3 py-1 bg-gray-50 rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            {dateStr}
          </div>
          <h2 className="text-xl font-serif italic text-gray-800">{isAI ? agent.name : '用户'}</h2>
        </div>
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <div className="text-gray-600 leading-relaxed font-serif text-center">
            {renderContent('#4b5563')}
          </div>
        </div>
        <div className="mt-12 text-center border-t border-gray-50 pt-6 shrink-0">
          <span className="text-[10px] text-gray-300 font-medium tracking-[0.2em]">PICS AI STUDIO</span>
        </div>
      </div>
    );
  }

  if (template === 'gradient') {
    return (
      <div id={id} className={cn(containerBaseClass, "bg-gradient-to-br from-[#6366f1] to-[#a855f7] p-8 font-sans relative overflow-hidden")}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-6 relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                {isAI ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{isAI ? agent.name : '用户'}</div>
                <div className="text-white/60 text-[10px]">{dateStr}</div>
              </div>
            </div>
            <div className="text-white leading-relaxed flex-1 flex flex-col justify-center text-center overflow-hidden">
              {renderContent('#ffffff')}
            </div>
          </div>
        </div>
        <div className="mt-6 text-center shrink-0">
          <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Pics AI Card</span>
        </div>
      </div>
    );
  }

  if (template === 'dark') {
    return (
      <div id={id} className={cn(containerBaseClass, "bg-[#0a0a0a] p-8 font-sans border border-white/10")}>
        <div className="flex justify-between items-start mb-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold tracking-tighter uppercase">{isAI ? agent.name : 'USER'}</span>
          </div>
          <span className="text-[9px] text-gray-600 font-mono">{dateStr}</span>
        </div>
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <div className="text-gray-300 leading-relaxed font-mono text-center">
            {renderContent('#d1d5db')}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center shrink-0">
          <div className="text-[10px] text-gray-600 font-mono">ID: {message.id.slice(0, 8)}</div>
          <div className="text-[10px] text-[var(--color-primary)] font-bold">PICS_AI_OS</div>
        </div>
      </div>
    );
  }

  if (template === 'polaroid') {
    return (
      <div id={id} className={cn(containerBaseClass, "bg-[#f8f9fa] p-6 font-sans shadow-lg border border-gray-200")}>
        <div className="bg-white p-4 shadow-sm border border-gray-100 min-h-[300px] flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col justify-center overflow-hidden">
            <div className="text-gray-800 leading-relaxed font-handwriting mb-6 text-center">
              {renderContent('#1f2937')}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 shrink-0">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-gray-900 font-bold text-lg leading-none mb-1">{isAI ? agent.name : '用户'}</div>
                <div className="text-gray-400 text-[10px] font-medium">{dateStr}</div>
              </div>
              <div className="w-8 h-8 opacity-20">
                <Sparkles className="w-full h-full text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center shrink-0">
          <div className="w-12 h-1 mx-auto bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  // Default template
  return (
    <div 
      id={id}
      className={cn(containerBaseClass, "bg-white p-8 font-sans relative overflow-hidden")}
      style={{ 
        backgroundImage: 'radial-gradient(circle at 2px 2px, #f0f0f0 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-soft)] opacity-20 rounded-bl-full -mr-10 -mt-10 shrink-0" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--color-primary-soft)] opacity-20 rounded-tr-full -ml-10 -mb-10 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Pics AI</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Creative Assistant</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{dateStr}</div>
        </div>
      </div>

      {/* Content Card */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl p-6 shadow-xl relative z-10 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-inner",
              isAI ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "bg-gray-100 text-gray-500"
            )}>
              {isAI ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <span className="font-bold text-gray-800 text-sm">{isAI ? agent.name : '用户'}</span>
          </div>

          <div className="text-gray-700 leading-relaxed flex-1 flex flex-col justify-center text-center overflow-hidden">
            {renderContent('#374151')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-xs text-gray-400 font-medium">Generated by Pics AI Engine</span>
        </div>
        <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
          <span className="text-[10px] text-gray-400 font-bold">@pics-ai-studio</span>
        </div>
      </div>
    </div>
  );
};

/** Preset agents */
const PRESET_AGENTS: Agent[] = [
  { id: 'helper', name: '全能助手', icon: 'Sparkles', systemPrompt: '你是一个全能、亲切的 AI 助手。你的回答应该专业、清晰且充满鼓励，尽可能为用户提供有实际帮助的建议。' },
  { id: 'philosopher', name: '赛博哲人', icon: 'Brain', systemPrompt: '你是一位生活在数字时代的哲学家。你喜欢用深刻但幽默的方式思考科技与人性的关系。你的回答往往带有哲理感，偶尔会说一些耐人寻味的诗意话语。' },
  { id: 'critic', name: '毒舌影评人', icon: 'Ghost', systemPrompt: '你是一个眼光犀利、说话辛辣的影评人。你热爱电影但对烂片零容忍。你的语气幽默且刻薄，经常使用讽刺手法，但你的专业度不容置疑。' },
  { id: 'storyteller', name: '深夜说书人', icon: 'Music', systemPrompt: '你是一位擅长营造氛围的说书人。你说话语气温和，富有感染力。当用户让你讲故事或聊天时，你会带入一种沉浸式的叙事风格。' },
  { id: 'companion', name: '午后咖啡友', icon: 'Coffee', systemPrompt: '你就像用户的一位老朋友。我们正坐在温暖的咖啡馆里闲聊。你的语气轻松、随意，不端架子，喜欢聊生活琐事、美食和心情。' },
];

/** Message Item Component */
const ChatMessageItem = React.memo<{
  message: Message;
  isStreaming: boolean;
  streamingContent?: string;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onCopy: (id: string, content: string) => void;
  onStartEdit: (message: Message) => void;
  onExportPreview: (message: Message) => void;
  isCopied: boolean;
  isAI: boolean;
}>(({ 
  message, isStreaming, streamingContent, isCollapsed, onToggleCollapse, 
  onCopy, onStartEdit, onExportPreview, isCopied, isAI 
}) => {
  const content = isStreaming ? streamingContent || '' : message.content;
  
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] italic">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Thinking...
      </div>
    );
  }

  const hasThink = content.includes('<think>');
  const parts = content.split(/<think>|<\/think>/);
  
  const renderMessageContent = () => {
    if (content.includes('![')) {
      return (
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-[13px] sm:text-sm leading-relaxed">{content.split('\n')[0]}</p>
          {content.match(/!\[(.*?)\]\((.*?)\)/) && (
            <img 
              src={content.match(/!\[(.*?)\]\((.*?)\)/)![2]} 
              alt="Generated" 
              className="rounded-lg w-full h-auto shadow-sm"
            />
          )}
        </div>
      );
    }

    if (!hasThink) {
      return (
        <div className="text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      );
    }

    const thinkingContent = parts[1] || '';
    const mainContent = (parts[0] + parts.slice(2).join('')).trim();

    return (
      <>
        <div className="mb-2 border-l-2 border-[var(--color-primary-soft)] pl-3">
          <button
            onClick={() => onToggleCollapse(message.id)}
            className="flex items-center gap-1.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <span>思考过程</span>
            {isStreaming && !content.includes('</think>') && parts.length < 3 && (
              <Loader2 className="w-2.5 h-2.5 animate-spin ml-1" />
            )}
          </button>
          
          {!isCollapsed && (
            <div className="text-[12px] text-[var(--color-text-muted)] italic leading-relaxed mt-1">
              {thinkingContent}
            </div>
          )}
        </div>

        {(mainContent || (isStreaming && content.includes('</think>'))) && (
          <div className="text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">
            {mainContent}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={cn(
        'max-w-[85%] sm:max-w-[75%] px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl relative group',
        isAI
          ? 'bg-[var(--color-surface)] rounded-tl-sm'
          : 'bg-[var(--color-primary)] text-white rounded-tr-sm'
      )}
    >
      {renderMessageContent()}
      
      {/* Actions */}
      {!isStreaming && (
        <div className={cn(
          "absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
          !isAI ? "left-0" : "right-0"
        )}>
          <button
            onClick={() => onCopy(message.id, content)}
            className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] shadow-sm transition-all"
            title="复制内容"
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={() => onStartEdit(message)}
            className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] shadow-sm transition-all"
            title="编辑并生成卡片"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onExportPreview(message)}
            className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] shadow-sm transition-all"
            title="直接导出图片"
          >
            <Share2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
});

/** ChatPanel component implementation */
export const ChatPanel: React.FC<ChatPanelProps> = ({ className, history }) => {
  // --- Sessions State ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isDBLoaded, setIsDBLoaded] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        await migrateLocalStorageData(); // 统一在初始化时执行迁移
        const dbSessions = await getAllChatSessionsFromDB();
        
        if (dbSessions.length > 0) {
          setSessions(dbSessions);
        } else {
          // Initial default session
          const initialSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            agentId: PRESET_AGENTS[0].id,
            messages: [
              {
                id: '1',
                role: 'assistant',
                content: 'Hello! I am your AI assistant. How can I help you today?',
                timestamp: Date.now(),
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveChatSessionToDB(initialSession);
          setSessions([initialSession]);
        }
      } catch (err) {
        console.error('Failed to load sessions from IndexedDB:', err);
      } finally {
        setIsDBLoaded(true);
      }
    };
    loadFromDB();
  }, []);

  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Update currentSessionId if empty after DB load
  useEffect(() => {
    const initSessionId = async () => {
      const savedId = await getCurrentChatSessionId();
      if (savedId) {
        setCurrentSessionId(savedId);
      } else if (isDBLoaded && sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    };
    initSessionId();
  }, [isDBLoaded, sessions]);

  // --- Custom Agents State ---
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        await migrateLocalStorageData(); // 确保迁移已执行
        const dbAgents = await getAllAgentsFromDB();
        setCustomAgents(dbAgents);
      } catch (err) {
        console.error('Failed to load agents from IndexedDB:', err);
      }
    };
    loadAgents();
  }, []);

  const allAgents = useMemo(() => [...PRESET_AGENTS, ...customAgents], [customAgents]);

  // --- UI States ---
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Record<string, boolean>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [newAgentData, setNewAgentData] = useState({ name: '', systemPrompt: '', icon: 'Sparkles' });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<{ id: string, content: string } | null>(null);
  const [activeApi, setActiveApi] = useState<any>(null);
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    const loadApiInfo = async () => {
      const config = await getActiveApiConfig('chat');
      setActiveApi(config);
      setHasToken(!!(config || AUTH_TOKEN));
    };
    loadApiInfo();
  }, []);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const isInitialMount = useRef(true);
  
  // --- Current Session & Agent ---
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || sessions[0],
    [sessions, currentSessionId]
  );

  const messages = useMemo(() => {
    const msgs = currentSession?.messages || [];
    if (!streamingMessage || !currentSessionId) return msgs;

    const exists = msgs.some((m: Message) => m.id === streamingMessage.id);
    if (exists) {
      return msgs.map((m: Message) => 
        m.id === streamingMessage.id ? { ...m, content: streamingMessage.content } : m
      );
    }

    return [...msgs, {
      id: streamingMessage.id,
      role: 'assistant',
      content: streamingMessage.content,
      timestamp: Date.now()
    } as Message];
  }, [currentSession?.messages, streamingMessage, currentSessionId]);

  // Update ref when messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const selectedAgent = useMemo(() => 
    allAgents.find((a: Agent) => a.id === currentSession?.agentId) || PRESET_AGENTS[0],
    [allAgents, currentSession?.agentId]
  );

  // --- Persistence ---
  useEffect(() => {
    if (currentSessionId) {
      setCurrentChatSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // --- Session Actions ---
  const createNewSession = async (agentId: string = PRESET_AGENTS[0].id) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      agentId,
      messages: [
        {
          id: Date.now().toString() + '-init',
          role: 'assistant',
          content: `Hello! I am your ${allAgents.find((a: Agent) => a.id === agentId)?.name || 'AI assistant'}. How can I help you today?`,
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await saveChatSessionToDB(newSession);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setIsSessionsModalOpen(false);
    } catch (err) {
      console.error('Failed to save new session:', err);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteChatSessionFromDB(id);
      
      let nextSessionId = currentSessionId;
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== id);
        if (filtered.length === 0) {
          const initialSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            agentId: PRESET_AGENTS[0].id,
            messages: [{ id: '1', role: 'assistant', content: 'Hello!', timestamp: Date.now() }],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          saveChatSessionToDB(initialSession);
          nextSessionId = initialSession.id;
          return [initialSession];
        }
        if (currentSessionId === id) {
          nextSessionId = filtered[0].id;
        }
        return filtered;
      });
      setCurrentSessionId(nextSessionId);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const updateSessionMessages = useCallback(async (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        // Auto-title if it's the first user message
        let title = s.title;
        if (s.title === 'New Chat') {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '');
          }
        }
        const updatedSession = { ...s, messages: newMessages, updatedAt: Date.now(), title };
        // Background update DB
        saveChatSessionToDB(updatedSession).catch(console.error);
        return updatedSession;
      }
      return s;
    }));
  }, []);

  const setSelectedAgentForCurrentSession = async (agent: Agent) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const updated = { ...s, agentId: agent.id };
        saveChatSessionToDB(updated).catch(console.error);
        return updated;
      }
      return s;
    }));
    setIsAgentSelectorOpen(false);
  };

  const handleAddCustomAgent = async () => {
    if (!newAgentData.name || !newAgentData.systemPrompt) return;
    
    try {
      if (editingAgent) {
        if (editingAgent.isCustom) {
          const updatedAgent = {
            ...editingAgent,
            name: newAgentData.name,
            systemPrompt: newAgentData.systemPrompt,
            icon: newAgentData.icon
          };
          await saveAgentToDB(updatedAgent);
          setCustomAgents(prev => prev.map(a => a.id === editingAgent.id ? updatedAgent : a));
        }
      } else {
        const newAgent: Agent = {
          id: 'custom-' + Date.now(),
          name: newAgentData.name,
          icon: newAgentData.icon,
          systemPrompt: newAgentData.systemPrompt,
          isCustom: true
        };
        await saveAgentToDB(newAgent);
        setCustomAgents(prev => [...prev, newAgent]);
      }
      
      setNewAgentData({ name: '', systemPrompt: '', icon: 'Sparkles' });
      setIsAddAgentModalOpen(false);
      setEditingAgent(null);
    } catch (err) {
      console.error('Failed to save agent:', err);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      await deleteAgentFromDB(id);
      setCustomAgents(prev => prev.filter(a => a.id !== id));
      
      // 如果删除的是当前选中的 Agent，则切换回默认
      if (selectedAgent.id === id) {
        // 找到第一个非删除的 Agent 或者使用默认 PRESET_AGENTS[0]
        const remainingAgents = allAgents.filter(a => a.id !== id);
        const nextAgent = remainingAgents.length > 0 ? remainingAgents[0] : PRESET_AGENTS[0];
        setSelectedAgentForCurrentSession(nextAgent);
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
      setError('删除角色失败');
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setNewAgentData({
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      icon: agent.icon
    });
    setIsAddAgentModalOpen(true);
  };

  const generateAIPrompt = async () => {
    if (!newAgentData.name || isGeneratingPrompt) return;
    
    setIsGeneratingPrompt(true);
    try {
      const prompt = `你是一个专业的 Prompt 工程师。请为名为 "${newAgentData.name}" 的 AI 角色编写一段专业的 System Prompt（角色设定）。
要求：
1. 语气专业且符合角色定位。
2. 包含具体的行为准则和回复风格。
3. 语言精炼，直接输出 Prompt 内容，不要包含任何解释性文字。`;

      await sendChatMessage(
        [{ role: 'user', content: prompt }],
        (_, full) => {
          setNewAgentData(prev => ({ ...prev, systemPrompt: full }));
        }
      );
    } catch (err) {
      console.error('Failed to generate prompt:', err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const insertGuidedTemplate = () => {
    const template = `# 角色定位\n[在此描述 AI 的身份，例如：资深前端开发专家]\n\n# 核心任务\n[描述 AI 需要完成的具体工作，例如：代码审查、性能优化建议]\n\n# 语言风格\n[描述回复的语气，例如：专业、严谨、通俗易懂]`;
    setNewAgentData(prev => ({ ...prev, systemPrompt: template }));
  };

  // Sync image history to chat messages
  const lastHistoryCount = useRef(history?.length || 0);
  
  useEffect(() => {
    if (history && history.length > lastHistoryCount.current) {
      // Find new items
      const newItems = history.slice(0, history.length - lastHistoryCount.current);
      
      // Add each new image to current session
      if (currentSessionId) {
        const imageMessages: Message[] = newItems.map(item => ({
          id: `img-${item.id}`,
          role: 'assistant',
          content: `🎨 我为您生成了一张图片：\n![${item.prompt}](${item.imageUrl})`,
          timestamp: item.timestamp,
        }));

        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            // Prevent duplicates
            const existingIds = new Set(s.messages.map(m => m.id));
            const filteredNew = imageMessages.filter(m => !existingIds.has(m.id));
            if (filteredNew.length === 0) return s;
            
            const updatedSession = { ...s, messages: [...s.messages, ...filteredNew], updatedAt: Date.now() };
            // 同步保存到 IndexedDB
            saveChatSessionToDB(updatedSession).catch(console.error);
            return updatedSession;
          }
          return s;
        }));
      }
      
      lastHistoryCount.current = history.length;
    }
  }, [history, currentSessionId]);

  const agentSelectorRef = useRef<HTMLDivElement>(null);

  // Close agent selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentSelectorRef.current && !agentSelectorRef.current.contains(event.target as Node)) {
        setIsAgentSelectorOpen(false);
      }
    };

    if (isAgentSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgentSelectorOpen]);
  // Auto-scroll to bottom logic
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If we are within 100px of the bottom, we should auto-scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isAtBottom;
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: isInitialMount.current ? 'auto' : 'smooth' 
      });
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }
  }, [messages, streamingMessage?.content]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, userMessage, aiMessage];
    updateSessionMessages(currentSessionId, newMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setStreamingMessage({ id: aiMessageId, content: '' }); // 初始化流式状态
    setCollapsedMessages(prev => ({ ...prev, [aiMessageId]: false }));

    try {
      abortControllerRef.current = createChatAbortController();

      const apiMessages: ChatMessage[] = [...currentMessages, userMessage].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let fullResponse = '';

      await sendChatMessage(
        apiMessages,
        (_, response) => {
          fullResponse = response;
          // 确保每一块数据都触发 streamingMessage 更新
          setStreamingMessage({ id: aiMessageId, content: response });
        },
        { 
          temperature: 0.7,
          enable_thinking: isThinkingEnabled,
          systemPrompt: selectedAgent.systemPrompt
        }
      );

      // Update with final message
      const finalMsgs = newMessages.map((m) =>
        m.id === aiMessageId ? { ...m, content: fullResponse } : m
      );
      updateSessionMessages(currentSessionId, finalMsgs);
    } catch (err) {
      // Remove the empty AI message on error
      const filteredMsgs = newMessages.filter((m) => m.id !== aiMessageId);
      updateSessionMessages(currentSessionId, filteredMsgs);

      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
      abortControllerRef.current = null;
      setCollapsedMessages(prev => ({ ...prev, [aiMessageId]: true }));
    }
  }, [inputValue, isLoading, currentSessionId, isThinkingEnabled, selectedAgent]);

  // Handle copy
  const handleCopy = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    const clearedMessages: Message[] = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hello! I am your AI assistant. How can I help you today?',
        timestamp: Date.now(),
      },
    ];
    updateSessionMessages(currentSessionId, clearedMessages);
    setError(null);
  }, [currentSessionId]);

  // Handle toggle collapse
  const toggleCollapse = useCallback((id: string) => {
    setCollapsedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  // Handle start edit
  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditValue(message.content);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId) return;
    
    const updatedMsgs = messagesRef.current.map(m => 
      m.id === editingMessageId ? { ...m, content: editValue } : m
    );
    updateSessionMessages(currentSessionId, updatedMsgs);
    setEditingMessageId(null);
    setEditValue('');
  }, [editingMessageId, editValue, currentSessionId]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditValue('');
  }, []);

  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportPreviewMessage, setExportPreviewMessage] = useState<Message | null>(null);
  const [editedExportContent, setEditedExportContent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate>('default');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('auto');
  const [exportFontSize, setExportFontSize] = useState<number>(15);

  // Handle export image
  const handleExportImage = async (message: Message) => {
    setIsExporting(message.id);
    const element = document.getElementById(`export-card-preview`);
    if (element) {
      try {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: 2, // Higher quality
        });
        const link = document.createElement('a');
        link.download = `pics-ai-message-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        setExportPreviewMessage(null); // Close modal after export
      } catch (err) {
        console.error('Failed to export image:', err);
        setError('导出图片失败');
      }
    }
    setIsExporting(null);
  };

  /**
   * Render agent icon based on name
   */
  const getAgentIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Lightbulb': return <Lightbulb className={className} />;
      case 'Code': return <Code className={className} />;
      case 'Brain': return <Brain className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Ghost': return <Ghost className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Music': return <Music className={className} />;
      case 'Alien': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
          <path d="M9 10a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
          <path d="M15 10a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
          <path d="M12 16c-1.5 0-2.5-1-2.5-1" />
          <path d="M8 2l2 2" />
          <path d="M16 2l-2 2" />
        </svg>
      );
      case 'Robot': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
          <line x1="8" y1="16" x2="8" y2="16" />
          <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
      );
      case 'Gamepad': return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" />
          <path d="M18 6H6a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4z" />
        </svg>
      );
      default: return <User className={className} />;
    }
  };

  const openExportPreview = useCallback((message: Message) => {
    setExportPreviewMessage(message);
    const cleanContent = message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    setEditedExportContent(cleanContent);
    setSelectedTemplate('default');
    setSelectedAspectRatio('auto');
    
    // Simple heuristic for font size
    const length = cleanContent.length;
    let initialSize = 15;
    if (length < 20) initialSize = 24;
    else if (length < 50) initialSize = 20;
    else if (length < 100) initialSize = 18;
    else if (length > 300) initialSize = 13;
    setExportFontSize(initialSize);
  }, []);

  // --- Render Loading State ---
  if (!isDBLoaded) {
    return (
      <div className={cn('relative h-full bg-[var(--color-bg)] flex flex-col min-h-0', className)}>
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {/* Skeleton Header */}
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg)]/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-border)] animate-pulse shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[var(--color-border)] rounded animate-pulse" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)] animate-pulse" />
                    <div className="h-3 w-16 bg-[var(--color-border)] rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-9 h-9 bg-[var(--color-border)] rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Skeleton Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "flex-row-reverse" : "")}>
                <div className="w-8 h-8 rounded-full bg-[var(--color-border)] animate-pulse shrink-0" />
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <div className={cn(
                    "h-12 w-full rounded-2xl animate-pulse",
                    i % 2 === 0 ? "bg-[var(--color-primary-soft)]/30" : "bg-[var(--color-surface)]"
                  )} />
                  {i === 1 && <div className="h-8 w-3/4 rounded-2xl bg-[var(--color-surface)] animate-pulse" />}
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Input Area */}
          <div className="p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] pb-[calc(env(safe-area-inset-bottom,0px)+80px)] sm:pb-6">
            <div className="relative flex flex-col bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] h-[100px] animate-pulse">
              <div className="flex-1 p-3">
                <div className="h-4 w-1/2 bg-[var(--color-border)] rounded" />
              </div>
              <div className="flex items-center justify-between px-3 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-7 bg-[var(--color-border)] rounded-full" />
                  <div className="w-24 h-7 bg-[var(--color-border)] rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--color-border)] rounded-full" />
                  <div className="w-8 h-8 bg-[var(--color-border)] rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-2.5">
              <div className="h-3 w-32 bg-[var(--color-border)]/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full bg-[var(--color-bg)] flex flex-col min-h-0', className)}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-bg)]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-all"
                onClick={() => setIsAgentManagerOpen(true)}
                title="管理角色"
              >
                {getAgentIcon(selectedAgent.icon, "w-6 h-6")}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-[var(--color-text)] leading-tight truncate">
                  {currentSession?.title || 'AI Chat'}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                    {selectedAgent.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeApi && (
                <div className="hidden sm:flex flex-col items-end mr-3 text-[10px] leading-tight text-[var(--color-text-secondary)]">
                  <span className="font-bold text-[var(--color-text)] opacity-80">{activeApi.name}</span>
                  <span className="opacity-60 max-w-[120px] truncate">{activeApi.apiKey.slice(0, 8)}***</span>
                </div>
              )}
              <button
                onClick={() => setIsSessionsModalOpen(true)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/10 rounded-xl transition-all"
                title="会话管理"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Token Missing Warning */}
        {!hasToken && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">未检测到 API Token</p>
                <p className="text-[10px] text-amber-700/70 dark:text-amber-400/60 truncate">请在左侧侧边栏“API 设置”中配置您的 Key 才能开始对话</p>
              </div>
            </div>
          </div>
        )}

      {/* Error message - 对话流样式 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-3 pt-3 sm:px-4 sm:pt-4 flex justify-start"
          >
            <div className="flex gap-2.5 max-w-[90%]">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="relative p-2.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">System Error</span>
                  <button 
                    onClick={() => setError(null)}
                    className="p-0.5 hover:bg-red-200/50 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed">{error}</p>
                
                {/* 小三角 */}
                <div className="absolute left-0 top-3.5 -translate-x-1/2 w-1.5 h-1.5 bg-red-50 border-l border-b border-red-100 rotate-45" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages list */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 pb-10 relative"
      >
        <div className="mx-auto max-w-4xl space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                {getAgentIcon(selectedAgent.icon, "w-8 h-8")}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">与 {selectedAgent.name} 开始对话</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-[240px]">
                  {selectedAgent.systemPrompt.slice(0, 60)}...
                </p>
              </div>
            </div>
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-2 sm:gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role !== 'user'
                      ? 'bg-[var(--gradient-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  )}
                >
                  {message.role !== 'user' ? (
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>

                {/* Message content */}
                <ChatMessageItem
                  message={message}
                  isStreaming={message.id === streamingMessage?.id}
                  streamingContent={streamingMessage?.content}
                  isCollapsed={collapsedMessages[message.id] ?? (message.id === streamingMessage?.id ? false : true)}
                  onToggleCollapse={toggleCollapse}
                  onCopy={handleCopy}
                  onStartEdit={handleStartEdit}
                  onExportPreview={openExportPreview}
                  isCopied={copiedId === message.id}
                  isAI={message.role !== 'user'}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className={cn(
         "p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0",
         "pb-[calc(env(safe-area-inset-bottom,0px)+80px)] sm:pb-6"
       )}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mx-auto max-w-4xl relative flex flex-col bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] focus-within:border-[var(--color-primary)] transition-all shadow-sm"
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            enterKeyHint="send"
            placeholder={`给 ${selectedAgent.name} 发送消息`}
            className={cn(
              'w-full px-4 pt-3 pb-1',
              'bg-transparent',
              'text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-muted)] text-[14px] sm:text-[15px]',
              'resize-none',
              'focus:outline-none',
              'min-h-[44px] max-h-[160px]'
            )}
            rows={1}
          />

          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-2">
              {/* Agent Selector Button */}
              <div className="relative" ref={agentSelectorRef}>
                <button
                  type="button"
                  onClick={() => setIsAgentSelectorOpen(!isAgentSelectorOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                    "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {getAgentIcon(selectedAgent.icon, "w-3.5 h-3.5")}
                  <span>{selectedAgent.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isAgentSelectorOpen ? "rotate-180" : "")} />
                </button>

                <AnimatePresence mode="popLayout">
                  {isAgentSelectorOpen && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      className="absolute bottom-full left-0 mb-2 w-full min-w-[130px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden z-[100] p-1.5"
                      style={{ maxHeight: 'none' }}
                    >
                      <div className="flex flex-col gap-1">
                        {allAgents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => setSelectedAgentForCurrentSession(agent)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all text-left",
                              selectedAgent.id === agent.id
                                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold"
                                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                            )}
                          >
                            <span className="shrink-0 opacity-90">{getAgentIcon(agent.icon, "w-4 h-4")}</span>
                            <span className="truncate">{agent.name}</span>
                            {selectedAgent.id === agent.id && (
                              <Check className="w-3.5 h-3.5 ml-auto shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                  isThinkingEnabled
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-soft)]"
                    : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                )}
              >
                <Brain className={cn("w-3.5 h-3.5", isThinkingEnabled ? "animate-pulse" : "")} />
                <span>深度思考</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-full transition-all"
                title="上传附件"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  "p-2 rounded-full transition-all flex items-center justify-center",
                  inputValue.trim() && !isLoading
                    ? "bg-[var(--color-primary)] text-white hover:opacity-90"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5px]" />
                )}
              </button>
            </div>
          </div>
        </form>
        
        <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-2.5 opacity-80">
          内容由 AI 生成，请仔细甄别
        </p>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editingMessageId !== null}
        onClose={handleCancelEdit}
        title="编辑 AI 回复"
        size="5xl"
      >
        <div className="space-y-4">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm sm:text-base',
              'bg-[var(--color-surface)] text-[var(--color-text)]',
              'border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              'min-h-[300px] resize-y'
            )}
            placeholder="编辑消息内容..."
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleCancelEdit}
              variant="secondary"
              className="px-6"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="px-6 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存修改
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sessions Management Modal */}
      <Modal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        title="会话管理"
        size="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">所有会话 ({sessions.length})</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all text-[12px] font-medium border border-red-100"
                title="清空当前会话的消息记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空当前对话
              </button>
              <button
                onClick={() => createNewSession()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-all text-[12px] font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                开启新会话
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setIsSessionsModalOpen(false);
                }}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border",
                  currentSessionId === session.id
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]/20"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                  {getAgentIcon(allAgents.find(a => a.id === session.agentId)?.icon || 'Sparkles', "w-4 h-4")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold truncate leading-tight">
                    {session.title}
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-2">
                    <span>{new Date(session.updatedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{session.messages.length} 条消息</span>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className={cn(
                    "p-2 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all",
                    currentSessionId === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  title="删除此会话"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button 
              onClick={() => {
                setIsAgentManagerOpen(true);
                setIsSessionsModalOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] rounded-xl transition-all border border-dashed border-[var(--color-border)]"
            >
              <Settings className="w-4 h-4" />
              管理 AI 角色 (Agent)
            </button>
          </div>
        </div>
      </Modal>

      {/* Agent Management Modal */}
      <Modal
        isOpen={isAgentManagerOpen}
        onClose={() => setIsAgentManagerOpen(false)}
        title="管理 AI 角色 (Agent)"
        size="4xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allAgents.map(agent => (
              <div 
                key={agent.id}
                className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-start gap-3 relative group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                  {getAgentIcon(agent.icon, "w-5 h-5")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[14px]">{agent.name}</h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {agent.isCustom && (
                        <button 
                          onClick={() => handleEditAgent(agent)}
                          className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-all"
                          title="编辑角色"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {agent.isCustom && (
                        <button 
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                          title="删除自定义角色"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                    {agent.systemPrompt}
                  </p>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setIsAddAgentModalOpen(true)}
              className="p-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/10 transition-all flex flex-col items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] group min-h-[100px]"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[13px] font-medium">添加自定义角色</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Agent Modal */}
      <Modal
        isOpen={isAddAgentModalOpen}
        onClose={() => {
          setIsAddAgentModalOpen(false);
          setEditingAgent(null);
        }}
        title={editingAgent ? "编辑 AI 角色" : "新建 AI 角色"}
        size="xl"
      >
        <div className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[var(--color-text-secondary)] ml-1">角色名称</label>
              <div className="relative">
                <input
                  type="text"
                  value={newAgentData.name}
                  onChange={(e) => setNewAgentData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="给您的角色起个名字，如：翻译专家"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none text-[14px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[13px] font-bold text-[var(--color-text-secondary)]">角色设定 (System Prompt)</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={insertGuidedTemplate}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition-all"
                  >
                    <FileText className="w-3 h-3" />
                    使用引导模板
                  </button>
                  <button
                    onClick={generateAIPrompt}
                    disabled={!newAgentData.name || isGeneratingPrompt}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                      newAgentData.name && !isGeneratingPrompt
                        ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border)]"
                    )}
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        AI 生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        AI 自动完善
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                value={newAgentData.systemPrompt}
                onChange={(e) => setNewAgentData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="描述这个 AI 角色的行为、语气和专业领域，或者点击“使用引导模板”按提示填写..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none text-[14px] min-h-[160px] resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-[var(--color-text-secondary)] ml-1">图标选择</label>
              <div className="flex flex-wrap gap-3">
                {['Sparkles', 'Brain', 'Coffee', 'Ghost', 'Music', 'Alien', 'Robot', 'Gamepad'].map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewAgentData(prev => ({ ...prev, icon }))}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      newAgentData.icon === icon
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {getAgentIcon(icon, "w-6 h-6")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddAgentModalOpen(false);
                setEditingAgent(null);
              }}
              className="px-6 rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleAddCustomAgent}
              disabled={!newAgentData.name || !newAgentData.systemPrompt || isGeneratingPrompt}
              className={cn(
                "px-8 rounded-xl transition-all duration-300",
                !(!newAgentData.name || !newAgentData.systemPrompt || isGeneratingPrompt) 
                  ? "bg-gradient-to-r from-[#FF4500] via-[#FF6B33] to-[#FF4500] bg-[length:200%_auto] hover:bg-right shadow-[0_8px_20px_-6px_rgba(255,69,0,0.4)] hover:shadow-[0_12px_25px_-5px_rgba(255,69,0,0.5)] animate-shine" 
                  : ""
              )}
            >
              {editingAgent ? "保存修改" : "立即创建"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Preview Modal */}
      <Modal
        isOpen={exportPreviewMessage !== null}
        onClose={() => setExportPreviewMessage(null)}
        title="分享卡片预览"
        size="4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-2">
          {/* Left: Editor & Template Selector */}
          <div className="space-y-6">
            <div className="bg-[var(--color-primary-soft)]/10 border border-[var(--color-primary-soft)]/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <MousePointer2 className="w-4 h-4" />
              </div>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                <strong>温馨提示：</strong> 您可以直接在右侧预览图的文字区域进行编辑，修改后的内容将实时同步到卡片中。
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px] font-bold text-[var(--color-text-secondary)] ml-1">
                <Layout className="w-4 h-4" />
                选择模版风格
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'default', name: '经典', icon: <Sparkles className="w-4 h-4" /> },
                  { id: 'minimal', name: '简约', icon: <Type className="w-4 h-4" /> },
                  { id: 'gradient', name: '绚丽', icon: <PaletteIcon className="w-4 h-4" /> },
                  { id: 'dark', name: '极客', icon: <Code className="w-4 h-4" /> },
                  { id: 'polaroid', name: '拍立得', icon: <ImageIcon className="w-4 h-4" /> },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id as ExportTemplate)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all",
                      selectedTemplate === tpl.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {tpl.icon}
                    <span className="text-[11px] font-bold">{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px] font-bold text-[var(--color-text-secondary)] ml-1">
                <Maximize className="w-4 h-4" />
                选择导出比例
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'auto', name: '自适应', icon: <Maximize className="w-4 h-4" /> },
                  { id: '1:1', name: '1:1 正方形', icon: <Square className="w-4 h-4" /> },
                  { id: '3:4', name: '3:4 经典', icon: <Layout className="w-4 h-4" /> },
                  { id: '9:16', name: '9:16 长图', icon: <Smartphone className="w-4 h-4" /> },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedAspectRatio(ratio.id as AspectRatio)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left",
                      selectedAspectRatio === ratio.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-muted)]"
                    )}
                  >
                    {ratio.icon}
                    <span className="text-[12px] font-bold">{ratio.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="flex items-center gap-2 text-[13px] font-bold text-[var(--color-text-secondary)]">
                  <Type className="w-4 h-4" />
                  调节字号
                </label>
                <span className="text-[11px] font-mono text-[var(--color-text-muted)] bg-gray-100 px-2 py-0.5 rounded-md">
                  {exportFontSize}px
                </span>
              </div>
              <div className="flex items-center gap-4 px-1">
                <span className="text-[10px] text-gray-400">小</span>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={exportFontSize}
                  onChange={(e) => setExportFontSize(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
                <span className="text-[14px] text-gray-400">大</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setExportPreviewMessage(null)}
                className="flex-1 rounded-xl"
              >
                取消
              </Button>
              <Button
                onClick={() => exportPreviewMessage && handleExportImage(exportPreviewMessage)}
                disabled={isExporting !== null}
                className="flex-1 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[#FF6B33] text-white shadow-lg font-bold"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    下载卡片
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: Preview Area */}
          <div className="flex flex-col items-center justify-center bg-gray-100/50 rounded-[2.5rem] p-4 sm:p-8 border border-dashed border-gray-200 min-h-[500px] overflow-hidden">
            <div className="relative group max-w-full">
              {exportPreviewMessage && (
                <div className="shadow-2xl scale-[0.6] sm:scale-[0.75] lg:scale-[0.85] origin-center transition-transform">
                  <MessageExportCard 
                    message={exportPreviewMessage} 
                    agent={allAgents.find(a => a.id === currentSession.agentId) || PRESET_AGENTS[0]}
                    id="export-card-preview"
                    template={selectedTemplate}
                    editedContent={editedExportContent}
                    aspectRatio={selectedAspectRatio}
                    fontSize={exportFontSize}
                    onContentChange={setEditedExportContent}
                    isEditing={true}
                  />
                </div>
              )}
              <div className="absolute -top-4 -right-4 bg-white px-3 py-1 rounded-full shadow-md border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none">
                Preview
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
);
};

export default ChatPanel;
