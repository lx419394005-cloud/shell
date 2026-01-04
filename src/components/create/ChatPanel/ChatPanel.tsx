/**
 * ChatPanel - AI Chat Panel
 *
 * @description AI chat panel with streaming responses
 * @example <ChatPanel />
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, Copy, Check, Sparkles, AlertCircle, Trash2, X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Button } from '../../common';
import { sendChatMessage, createChatAbortController } from '../../../services/chatApi';
import type { ChatMessage } from '../../../types/api';

/** Message interface */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/** ChatPanel props interface */
export interface ChatPanelProps {
  /** CSS class name */
  className?: string;
  /** Image history from parent */
  history?: any[];
}

/** Preset agents */
const PRESET_AGENTS = [
  { id: 'helper', name: 'Assistant', icon: 'Sparkles', systemPrompt: 'You are a helpful and friendly AI assistant.' },
  { id: 'mentor', name: 'Creative', icon: 'Lightbulb', systemPrompt: 'You are a creative writing mentor who helps with ideas and storytelling.' },
  { id: 'coder', name: 'Coder', icon: 'Code', systemPrompt: 'You are a skilled programmer who helps with coding questions and best practices.' },
];

/** ChatPanel component implementation */
export const ChatPanel: React.FC<ChatPanelProps> = ({ className, history }) => {
  // State
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_messages_persisted');
      if (saved) return JSON.parse(saved);
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I am your AI assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ];
  });
  
  // Persistence for chat messages
  useEffect(() => {
    localStorage.setItem('chat_messages_persisted', JSON.stringify(messages));
  }, [messages]);

  // Sync image history to chat messages
  const lastHistoryCount = useRef(history?.length || 0);
  
  useEffect(() => {
    if (history && history.length > lastHistoryCount.current) {
      // Find new items
      const newItems = history.slice(0, history.length - lastHistoryCount.current);
      
      // Add each new image to chat
      newItems.forEach(item => {
        const imageMessage: Message = {
          id: `img-${item.id}`,
          role: 'assistant',
          content: `🎨 我为您生成了一张图片：\n![${item.prompt}](${item.imageUrl})`,
          timestamp: new Date(item.timestamp),
        };
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === imageMessage.id)) return prev;
          return [...prev, imageMessage];
        });
      });
      
      lastHistoryCount.current = history.length;
    }
  }, [history]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState(PRESET_AGENTS[0]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialMount = useRef(true);
  const prevMessagesLength = useRef(messages.length);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      // 如果是初次挂载，直接瞬间滚动到底部，不显示动画
      if (isInitialMount.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        isInitialMount.current = false;
        return;
      }

      // 如果消息数量增加了，则平滑滚动
      if (messages.length > prevMessagesLength.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      prevMessagesLength.current = messages.length;
    }
  }, [messages]);

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
      timestamp: new Date(),
    };

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = createChatAbortController();

      const apiMessages: ChatMessage[] = [...messages, userMessage].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let fullResponse = '';

      await sendChatMessage(
        apiMessages,
        (chunk, response) => {
          fullResponse = response;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, content: response } : m
            )
          );
        },
        { temperature: 0.7 }
      );

      // Update with final message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId ? { ...m, content: fullResponse } : m
        )
      );
    } catch (err) {
      // Remove the empty AI message on error
      setMessages((prev) => prev.filter((m) => m.id !== aiMessageId));

      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [inputValue, isLoading, messages]);

  // Handle copy
  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hello! I am your AI assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text)] leading-tight">
              AI Chat
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 sm:mt-1">
              Start a conversation with AI
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="p-1.5 sm:p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Agent selection */}
        <div className="flex gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 overflow-x-auto pb-1 no-scrollbar">
          {PRESET_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={cn(
                'px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
                selectedAgent.id === agent.id
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
              )}
            >
              {agent.name}
            </button>
          ))}
        </div>
      </div>

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
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
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
              <div
                className={cn(
                  'max-w-[85%] sm:max-w-[75%] px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl',
                  message.role !== 'user'
                    ? 'bg-[var(--color-surface)] rounded-tl-sm'
                    : 'bg-[var(--color-primary)] text-white rounded-tr-sm'
                )}
              >
                {message.content.includes('![') ? (
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-[13px] sm:text-sm leading-relaxed">{message.content.split('\n')[0]}</p>
                    {message.content.match(/!\[(.*?)\]\((.*?)\)/) && (
                      <img 
                        src={message.content.match(/!\[(.*?)\]\((.*?)\)/)![2]} 
                        alt="Generated" 
                        className="rounded-lg w-full h-auto shadow-sm"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content || (
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </p>
                )}

                {/* Copy button */}
                {message.role !== 'user' && message.content && (
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className={cn(
                      'mt-1.5 sm:mt-2 p-1 rounded transition-colors',
                      copiedId === message.id
                        ? 'text-green-500'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    )}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    ) : (
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--gradient-primary)] text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="bg-[var(--color-surface)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-sm text-[var(--color-text-secondary)]">
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 sm:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className={cn(
              'flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl',
              'bg-[var(--color-surface)]',
              'text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-muted)] text-[13px] sm:text-sm',
              'border border-[var(--color-border)]',
              'resize-none',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              'min-h-[40px] sm:min-h-[44px] max-h-[120px]'
            )}
            rows={1}
          />

          <Button
            onClick={handleSend}
            loading={isLoading}
            disabled={!inputValue.trim() || isLoading}
            className="h-10 w-10 sm:h-11 sm:w-11"
            rounded
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
