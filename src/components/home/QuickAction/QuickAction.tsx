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
        // 布局：移动端上下堆叠，桌面端并排
        'flex flex-col sm:flex-row gap-4',
        className
      )}
    >
      {/* 绘图按钮 */}
      <motion.div
        className={cn(
          'flex-1',
          'bg-[var(--gradient-primary)]',
          'rounded-[var(--radius-2xl)]',
          'p-6',
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
        {/* 背景装饰 */}
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        {/* 内容 */}
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">🎨 开始绘图</h3>
            <p className="text-white/80 text-sm mt-1">
              用文字描述，让 AI 为你创作
            </p>
          </div>
        </div>
      </motion.div>

      {/* 聊天按钮 */}
      <motion.div
        className={cn(
          'flex-1',
          'bg-[var(--color-surface)]',
          'dark:bg-[var(--color-surface)]',
          'rounded-[var(--radius-2xl)]',
          'p-6',
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
        <div className="relative flex items-center gap-4">
          <div
            className={cn(
              'p-3 rounded-full',
              'bg-[var(--color-primary-soft)]',
              'text-[var(--color-primary)]'
            )}
          >
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              💬 开始对话
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              与 AI 助手深度交流
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickAction;
