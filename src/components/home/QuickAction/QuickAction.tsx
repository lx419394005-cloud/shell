/**
 * QuickAction - 首页快捷操作入口
 *
 * @description 移动端从首页发起创作/对话的核心入口
 * @example <QuickAction onOpenDraw={handleDraw} onOpenChat={handleChat} />
 *
 * @props
 * - onOpenDraw: 打开绘图回调
 * - onOpenChat: 打开聊天回调
 * - className: CSS 类名
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common';

/** 快捷操作属性接口 */
export interface QuickActionProps {
  /** 打开绘图回调 */
  onOpenDraw: () => void;
  /** 打开聊天回调 */
  onOpenChat: () => void;
  /** CSS 类名 */
  className?: string;
}

/**
 * QuickAction 组件实现
 */
export const QuickAction: React.FC<QuickActionProps> = ({
  onOpenDraw,
  onOpenChat,
  className,
}) => {
  return (
    <div
      className={cn(
        // 布局：移动端并排，桌面端也并排
        'flex flex-row gap-2.5 sm:gap-4',
        className
      )}
    >
      {/* 绘图按钮 */}
      <motion.div
        className={cn(
          'flex-1 min-w-0',
          'bg-[var(--gradient-primary)]',
          'rounded-[var(--radius-xl)] sm:rounded-[var(--radius-2xl)]',
          'p-3 sm:p-6',
          'text-white',
          'shadow-[var(--shadow-primary)]',
          'cursor-pointer',
          'overflow-hidden',
          'relative'
        )}
        onClick={onOpenDraw}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 内容 */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          <div className="p-1.5 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
            <Palette className="w-4 h-4 sm:w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-semibold truncate">AI 绘图</h3>
            <p className="text-white/80 text-[10px] sm:text-sm mt-0.5 truncate">
              让 AI 为你创作
            </p>
          </div>
        </div>
      </motion.div>

      {/* 聊天按钮 */}
      <motion.div
        className={cn(
          'flex-1 min-w-0',
          'bg-[var(--color-surface)]',
          'dark:bg-[var(--color-surface)]',
          'rounded-[var(--radius-xl)] sm:rounded-[var(--radius-2xl)]',
          'p-3 sm:p-6',
          'border-2 border-[var(--color-border)]',
          'cursor-pointer',
          'relative',
          'overflow-hidden'
        )}
        onClick={onOpenChat}
        whileHover={{ scale: 1.02, borderColor: 'var(--color-primary)' }}
        whileTap={{ scale: 0.98 }}
      >
        {/* 内容 */}
        <div className="relative flex items-center gap-2 sm:gap-4">
          <div
            className={cn(
              'p-1.5 sm:p-3 rounded-full flex-shrink-0',
              'bg-[var(--color-primary-soft)]',
              'text-[var(--color-primary)]'
            )}
          >
            <MessageSquare className="w-4 h-4 sm:w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-semibold truncate">智能对话</h3>
            <p className="text-[var(--color-text-secondary)] text-[10px] sm:text-sm mt-0.5 truncate">
              获取无限灵感
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickAction;
