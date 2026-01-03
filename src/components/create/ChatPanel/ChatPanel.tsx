/**
 * ChatPanel - AI Chat Panel
 *
 * @description AI chat panel with streaming responses
 * @example <ChatPanel />
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, Copy, Check, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common';
import { sendChatMessage, createChatAbortController } from '@/services/chatApi';
import type { ChatMessage } from '@/types/api';

/** Message interface */
interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

/** ChatPanel props interface */
export interface ChatPanelProps {
  /** CSS class name */
  className?: string;
}

/** Preset agents */
const PRESET_AGENTS = [
  { id: 'helper', name: 'Assistant', icon: 'Sparkles', systemPrompt: 'You are a helpful and friendly AI assistant.' },
  { id: 'mentor', name: 'Creative', icon: 'Lightbulb', systemPrompt: 'You are a creative writing mentor who helps with ideas and storytelling.' },
  { id: 'coder', name: 'Coder', icon: 'Code', systemPrompt: 'You are a skilled programmer who helps with coding questions and best practices.' },
];

/** ChatPanel component implementation */
export const ChatPanel: React.FC<ChatPanelProps> = ({ className }) => {
  // State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Hello! I am your AI assistant. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState(PRESET_AGENTS[0]);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Create streaming AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      abortControllerRef.current = createChatAbortController();

      const apiMessages: ChatMessage[] = messages
        .filter((m) => m.id !== aiMessageId)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

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
        role: 'ai',
        content: 'Hello! I am your AI assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              AI Chat
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Start a conversation with AI
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Agent selection */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {PRESET_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
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

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.role === 'ai'
                    ? 'bg-[var(--gradient-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                )}
              >
                {message.role === 'ai' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message content */}
              <div
                className={cn(
                  'max-w-[75%] px-4 py-2.5 rounded-2xl',
                  message.role === 'ai'
                    ? 'bg-[var(--color-surface)] rounded-tl-sm'
                    : 'bg-[var(--color-primary)] text-white rounded-tr-sm'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content || (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </p>

                {/* Copy button */}
                {message.role === 'ai' && message.content && (
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className={cn(
                      'mt-2 p-1 rounded transition-colors',
                      copiedId === message.id
                        ? 'text-green-500'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    )}
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--gradient-primary)] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-[var(--color-surface)] px-4 py-2.5 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="flex gap-2">
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
              'flex-1 px-4 py-2.5 rounded-xl',
              'bg-[var(--color-surface)]',
              'text-[var(--color-text)]',
              'placeholder:text-[var(--color-text-muted)]',
              'border border-[var(--color-border)]',
              'resize-none',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              'min-h-[44px] max-h-[120px]'
            )}
            rows={1}
          />

          <Button
            onClick={handleSend}
            loading={isLoading}
            disabled={!inputValue.trim() || isLoading}
            rounded
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
