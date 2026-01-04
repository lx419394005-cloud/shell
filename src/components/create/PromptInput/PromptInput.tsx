/**
 * PromptInput - 统一输入组件
 *
 * @description 用于绘图和聊天的统一输入框
 * @example <PromptInput onSubmit={handleSubmit} placeholder="输入提示词..." />
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common';

/** 输入框模式 */
type InputMode = 'text' | 'multi-line';

/** 输入属性接口 */
export interface PromptInputProps {
  /** 提交回调 */
  onSubmit: (value: string) => void;
  /** 占位文本 */
  placeholder?: string;
  /** 初始值 */
  defaultValue?: string;
  /** 模式 */
  mode?: InputMode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** CSS 类名 */
  className?: string;
}

/**
 * PromptInput 组件实现
 */
export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  placeholder = '输入内容...',
  defaultValue = '',
  mode = 'multi-line',
  disabled = false,
  loading = false,
  className,
}) => {
  const [value, setValue] = useState(defaultValue);

  // 处理提交
  const handleSubmit = () => {
    if (!value.trim() || disabled || loading) return;
    onSubmit(value.trim());
    setValue('');
  };

  // 处理快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'text') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex items-end gap-2', className)}>
      {/* 输入框 */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={mode === 'multi-line' ? 2 : 1}
          className={cn(
            // 基础样式
            'w-full px-3 py-2.5 sm:px-4 sm:py-3',
            // 圆角
            mode === 'multi-line'
              ? 'rounded-[var(--radius-xl)]'
              : 'rounded-[var(--radius-full)]',
            // 颜色
            'bg-[var(--color-surface)]',
            'text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-muted)] text-sm sm:text-base',
            // 边框
            'border border-[var(--color-border)]',
            // 聚焦状态
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
            // 禁用状态
            disabled && 'opacity-50 cursor-not-allowed',
            // 调整大小
            mode === 'multi-line' && 'resize-none',
            // 最小高度
            'min-h-[44px]'
          )}
        />

        {/* 清除按钮 */}
        {value && !disabled && !loading && (
          <button
            onClick={() => setValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-border)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        )}
      </div>

      {/* 提交按钮 */}
      <Button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled || loading}
        loading={loading}
        rounded
        size="lg"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default PromptInput;
