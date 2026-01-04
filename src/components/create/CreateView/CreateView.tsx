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
  /** 图片生成回调 */
  onImageGenerated?: (images: string[], prompt: string) => void;
  /** 生成状态 */
  isGenerating?: boolean;
  /** 生成开始时间 */
  genStartTime?: number | null;
  /** 历史记录 */
  history?: any[];
  /** 启动生成回调 */
  onStartGeneration?: (prompt: string, options: any) => Promise<void>;
  /** 预览图片回调 */
  onPreviewImage?: (item: any) => void;
  /** 全局提示回调 */
  showToast?: (message: string, type?: any) => void;
  /** CSS 类名 */
  className?: string;
}

/**
 * CreateView 组件实现
 */
export const CreateView: React.FC<CreateViewProps> = ({
  activeMode,
  onModeChange,
  onImageGenerated,
  isGenerating,
  genStartTime,
  history,
  onStartGeneration,
  onPreviewImage,
  showToast,
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
        <div className="flex gap-2 p-3 pb-0">
          <button
            onClick={() => onModeChange('draw')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
              activeMode === 'draw'
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            )}
          >
            <Palette className="w-4 h-4" />
            <span className="text-sm">AI 绘图</span>
          </button>
          <button
            onClick={() => onModeChange('chat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
              activeMode === 'chat'
                ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">智能对话</span>
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
              <DrawPanel 
                onImageGenerated={onImageGenerated}
                isGenerating={isGenerating}
                genStartTime={genStartTime}
                onStartGeneration={onStartGeneration}
                history={history}
                onPreviewImage={onPreviewImage}
                showToast={showToast}
              />
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
              <ChatPanel history={history} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateView;
