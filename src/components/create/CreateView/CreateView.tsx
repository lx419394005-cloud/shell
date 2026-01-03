/**
 * CreateView - 创作主视图组件
 *
 * @description 创作页面主容器，包含绘图和聊天面板的切换
 * @example <CreateView activeMode="draw" onModeChange={setMode} />
 *
 * @props
 * - activeMode: 当前模式 draw/chat
 * - onModeChange: 模式切换回调
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DrawPanel } from '../DrawPanel/DrawPanel';
import { ChatPanel } from '../ChatPanel/ChatPanel';

/** 创作模式类型 */
type CreateMode = 'draw' | 'chat';

/** 创作视图属性接口 */
export interface CreateViewProps {
  /** 当前模式 */
  activeMode: CreateMode;
  /** 模式切换回调 */
  onModeChange: (mode: CreateMode) => void;
  /** CSS 类名 */
  className?: string;
}

/**
 * CreateView 组件实现
 */
export const CreateView: React.FC<CreateViewProps> = ({
  activeMode,
  onModeChange,
  className,
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测桌面端
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 模式切换标签（移动端显示） */}
      {!isDesktop && (
        <div className="flex gap-2 p-4 pb-0">
          <button
            onClick={() => onModeChange('draw')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
              activeMode === 'draw'
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            )}
          >
            <Palette className="w-5 h-5" />
            <span>AI 绘图</span>
          </button>
          <button
            onClick={() => onModeChange('chat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
              activeMode === 'chat'
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span>智能对话</span>
          </button>
        </div>
      )}

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeMode === 'draw' ? (
            <motion.div
              key="draw"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <DrawPanel />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ChatPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateView;
