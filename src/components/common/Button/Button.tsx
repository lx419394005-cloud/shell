/**
 * Button - 渐变按钮组件
 *
 * @description 提供多种样式的按钮，支持渐变背景、圆角、hover动效
 * @example <Button variant="primary" size="lg">点击我</Button>
 *
 * @props
 * - variant: 按钮样式 primary/secondary/outline/ghost
 * - size: 按钮尺寸 sm/md/lg
 * - rounded: 是否 pill 样式（圆角full）
 * - gradient: 是否使用渐变背景
 * - loading: 是否显示加载状态
 * - disabled: 是否禁用
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/** 按钮样式变体 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/** 按钮尺寸 */
type ButtonSize = 'sm' | 'md' | 'lg';

/** 按钮属性接口 */
export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'color'> {
  /** 按钮样式变体 */
  variant?: ButtonVariant;
  /** 按钮尺寸 */
  size?: ButtonSize;
  /** 是否 pill 样式（圆角full） */
  rounded?: boolean;
  /** 是否使用渐变背景 */
  gradient?: boolean;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 按钮内容 */
  children: React.ReactNode;
  /** CSS 类名 */
  className?: string;
}

/**
 * 获取按钮变体的样式
 */
const getVariantStyles = (variant: ButtonVariant, gradient: boolean): string => {
  const baseStyles = 'font-medium transition-all duration-200';

  const variants: Record<ButtonVariant, string> = {
    /** 主要按钮 - 渐变橙色背景 */
    primary: gradient
      ? 'bg-[var(--gradient-primary)] text-white shadow-[var(--shadow-primary)] hover:opacity-90 active:scale-95 disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed'
      : 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-primary)] hover:opacity-90 active:scale-95 disabled:grayscale disabled:opacity-30 disabled:cursor-not-allowed',

    /** 次要按钮 - 柔和背景 */
    secondary: 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-border)]',

    /** 轮廓按钮 - 边框样式 */
    outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',

    /** 幽灵按钮 - 透明背景 */
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]',
  };

  return cn(baseStyles, variants[variant]);
};

/**
 * 获取按钮尺寸样式
 */
const getSizeStyles = (size: ButtonSize, rounded: boolean): string => {
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const radius = rounded ? '[var(--radius-full)]' : '[var(--radius-lg)]';

  return cn(sizes[size], `rounded-${radius}`);
};

/**
 * Button 组件实现
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      rounded = false,
      gradient = true,
      loading = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          // 基础布局
          'inline-flex items-center justify-center gap-2',
          // 圆角（pill 或圆角-lg）
          rounded ? 'rounded-[var(--radius-full)]' : 'rounded-[var(--radius-lg)]',
          // 变体样式
          getVariantStyles(variant, gradient),
          // 尺寸样式
          getSizeStyles(size, rounded),
          // 禁用状态
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          // 聚焦样式
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
          className
        )}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.02, translateY: -1 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98, translateY: 0 } : undefined}
        {...props}
      >
        {/* 加载状态 */}
        {loading && (
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ animationDuration: '1s' }}
          />
        )}
        {/* 按钮内容 */}
        {children}
      </motion.button>
    );
  }
);

/** 显示名称 */
Button.displayName = 'Button';

export default Button;
