/**
 * Welcome - 首页欢迎区组件
 *
 * @description 显示欢迎语和副标题
 * @example <Welcome />
 *
 * @props
 * - title: 主标题
 * - subtitle: 副标题
 * - className: CSS 类名
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

/** 欢迎区属性接口 */
export interface WelcomeProps {
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** CSS 类名 */
  className?: string;
}

/**
 * 默认文案
 */
const DEFAULT_TITLE = '发现创意灵感';
const DEFAULT_SUBTITLE = '浏览 AI 生成的作品，获取创作灵感';

/**
 * Welcome 组件实现
 */
export const Welcome: React.FC<WelcomeProps> = ({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        // 布局
        'flex flex-col gap-2',
        'mb-6',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 标题行 */}
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div
          className={cn(
            'p-2 rounded-full',
            'bg-[var(--gradient-primary)]',
            'text-white',
            'shadow-[var(--shadow-primary)]'
          )}
        >
          <Sparkles className="w-5 h-5" />
        </div>

        {/* 主标题 */}
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {title}
        </h1>
      </div>

      {/* 副标题 */}
      <p className="text-[var(--color-text-secondary)] ml-12">
        {subtitle}
      </p>
    </motion.div>
  );
};

export default Welcome;
