/**
 * Card - 通用卡片组件
 *
 * @description 基础卡片容器，支持 hover 浮动效果
 * @example <Card hoverEffect>卡片内容</Card>
 *
 * @props
 * - hoverEffect: 是否启用 hover 浮动效果
 * - children: 卡片内容
 * - className: CSS 类名
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

/** 卡片属性接口 - 运动版 */
export interface CardMotionProps extends HTMLMotionProps<'div'> {
  /** 是否启用 hover 浮动效果 */
  hoverEffect?: boolean;
  /** 卡片内容 */
  children: React.ReactNode;
  /** CSS 类名 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

/** 卡片属性接口 - 普通版 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 是否启用 hover 浮动效果 */
  hoverEffect?: boolean;
  /** 卡片内容 */
  children: React.ReactNode;
  /** CSS 类名 */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

/**
 * Card 组件实现 - 始终使用 motion.div 以保持类型安全
 */
export const Card = React.forwardRef<HTMLDivElement, CardMotionProps>(
  ({ hoverEffect = false, children, className, onClick, whileHover, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // 基础样式
          'bg-[var(--color-bg-card)]',
          // 大圆角
          'rounded-[var(--radius-xl)]',
          // 基础阴影
          'shadow-[var(--shadow-md)]',
          // 溢出隐藏
          'overflow-hidden',
          // 点击样式
          onClick && 'cursor-pointer',
          // Hover 效果（CSS 方式）
          hoverEffect && 'hover:shadow-[var(--shadow-hover)] hover:-translate-y-1',
          // 过渡动画
          'transition-all duration-200',
          className
        )}
        onClick={onClick}
        whileHover={hoverEffect ? { y: -4 } : whileHover}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

/** 显示名称 */
Card.displayName = 'Card';

export default Card;
