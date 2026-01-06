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
import { Sparkles, Palette, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';

/** 欢迎区属性接口 */
export interface WelcomeProps {
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** CSS 类名 */
  className?: string;
  /** 是否显示功能列表 */
  showFeatures?: boolean;
}

/** 功能项接口 */
interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Palette className="w-5 h-5" />,
    title: 'AI 艺术绘画',
    desc: '基于顶级绘图模型，支持多种比例与 4K 高清输出。',
    color: 'bg-orange-500'
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: '智能创作助手',
    desc: '深度对话理解，辅助提示词优化，激发无限灵感。',
    color: 'bg-indigo-500'
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: '私密本地存储',
    desc: '所有生成历史记录均存储在本地数据库，安全且即时。',
    color: 'bg-emerald-500'
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: '极速流畅体验',
    desc: '流式生成技术，无需漫长等待，创作过程丝滑顺畅。',
    color: 'bg-amber-500'
  }
];

/**
 * 默认文案
 */
const DEFAULT_TITLE = '欢迎来到 PICS STUDIO';
const DEFAULT_SUBTITLE = '新一代 AI 创意工坊，让想象力触手可及';

/**
 * Welcome 组件实现
 */
export const Welcome: React.FC<WelcomeProps> = ({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  className,
  showFeatures = true,
}) => {
  return (
    <div className={cn('flex flex-col gap-8 mb-12', className)}>
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
            <Sparkles className="w-6 h-6 text-white fill-current" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--color-text)] uppercase">
            {title}
          </h1>
        </div>
        <p className="text-sm sm:text-lg text-[var(--color-text-secondary)] font-medium max-w-2xl">
          {subtitle}
        </p>
      </motion.div>

      {showFeatures && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (idx + 1) }}
              className="group p-5 rounded-3xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-xl transition-all duration-300"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg transition-transform group-hover:scale-110",
                feature.color
              )}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)] mb-1.5">{feature.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Welcome;
