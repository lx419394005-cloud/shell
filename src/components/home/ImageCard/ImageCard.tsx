/**
 * ImageCard - 图片卡片组件
 *
 * @description Pinterest 风格的图片卡片，支持悬浮操作
 * @example <ImageCard url={url} prompt={prompt} onClick={handleClick} />
 *
 * @props
 * - imageUrl: 图片地址
 * - prompt: 提示词
 * - aspectRatio: 宽高比 1:1 / 3:4 / 2:3
 * - onClick: 点击回调
 * - onCopy: 复制提示词回调
 * - onDelete: 删除回调
 * - onDownload: 下载回调
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Trash2, Download, Maximize2, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/** 宽高比类型 */
type AspectRatio = '1:1' | '3:4' | '2:3';

/** 图片卡片属性接口 */
export interface ImageCardProps {
  /** 图片地址 */
  imageUrl?: string;
  /** 提示词 */
  prompt: string;
  /** 宽高比 */
  aspectRatio?: AspectRatio;
  /** 状态 */
  status?: 'loading' | 'success' | 'error';
  /** 错误信息 */
  error?: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 复制提示词回调 */
  onCopy?: () => void;
  /** 删除回调 */
  onDelete?: () => void;
  /** 下载回调 */
  onDownload?: () => void;
  /** 是否处于选择模式 */
  isSelectionMode?: boolean;
  /** 是否已选中 */
  isSelected?: boolean;
  /** 切换选中状态回调 */
  onToggleSelect?: () => void;
  /** CSS 类名 */
  className?: string;
}

/** 宽高比对应的 CSS 类 */
const ASPECT_RATIO_CLASS: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '2:3': 'aspect-[2/3]',
};

/**
 * 获取宽高比（用于提示词后缀）
 */
const getAspectRatioString = (ratio: AspectRatio): string => {
  const ratios: Record<AspectRatio, string> = {
    '1:1': '1:1',
    '3:4': '3:4',
    '2:3': '2:3',
  };
  return ratios[ratio];
};

/**
 * ImageCard 组件实现
 */
export const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  prompt,
  aspectRatio = '3:4',
  status = 'success',
  error,
  onClick,
  onCopy,
  onDelete,
  onDownload,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  // 处理加载中或失败的状态
  const isLoading = status === 'loading';
  const isError = status === 'error';

  // 处理复制
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || isError) return;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    });
  };

  // 处理删除确认
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张图片吗？')) {
      onDelete?.();
    }
  };

  return (
    <motion.div
      className={cn(
        // 基础样式
        'relative rounded-[var(--radius-2xl)] overflow-hidden',
        // 阴影和过渡
        'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-hover)]',
        'transition-shadow duration-300 cursor-pointer group',
        // 加载中和错误状态的背景
        (isLoading || isError) && 'bg-[var(--color-surface)] aspect-[3/4] flex items-center justify-center border border-[var(--color-border)]',
        className
      )}
      onMouseEnter={() => !isLoading && !isError && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isLoading || isError) return;
        if (isSelectionMode) {
          onToggleSelect?.();
        } else {
          onClick?.();
        }
      }}
      whileHover={!isLoading && !isError && !isSelectionMode ? { y: -4 } : {}}
      layout
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 p-4 text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">生成中...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 p-4 text-center">
          <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <span className="text-lg">!</span>
          </div>
          <span className="text-xs text-red-500 font-medium line-clamp-2 px-2">{error || '生成失败'}</span>
        </div>
      ) : (
        <>
          {/* 图片 - 移除 h-full object-cover，使用 w-full 保持比例 */}
          <img
            src={imageUrl}
            alt={prompt}
            loading="lazy"
            className={cn(
              "w-full h-auto block transition-transform duration-500",
              isHovered && !isSelectionMode && "scale-105",
              isSelected && "scale-95 opacity-80"
            )}
          />

          {/* 选择模式下的选中标记 */}
          <AnimatePresence>
            {(isSelectionMode || isSelected) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "absolute top-3 left-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected 
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg" 
                    : "bg-black/20 border-white/50 text-transparent"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 选中状态的边框效果 */}
          {isSelected && (
            <div className="absolute inset-0 border-4 border-[var(--color-primary)] rounded-[var(--radius-2xl)] pointer-events-none z-20" />
          )}

          {/* 悬浮遮罩 */}
          <motion.div
            className={cn(
              // 渐变遮罩
              'absolute inset-0',
              'bg-gradient-to-t from-black/70 via-black/20 to-black/0',
              'opacity-0 transition-opacity duration-300',
              // 定位操作按钮
              'flex flex-col justify-end p-3 sm:p-4',
              isSelectionMode && 'hidden' // 选择模式下隐藏原有的悬浮遮罩
            )}
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            {/* 提示词 */}
            <p className="text-white text-xs sm:text-sm font-medium line-clamp-2 mb-2 sm:mb-3">
              {prompt}
            </p>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 复制按钮 */}
              <button
                onClick={handleCopy}
                className={cn(
                  'p-1.5 sm:p-2 rounded-full transition-colors',
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 hover:bg-white/40 text-white'
                )}
                title="复制提示词"
              >
                {copied ? (
                  <span className="text-[10px] sm:text-xs">✓</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 sm:w-4 h-4" />
                )}
              </button>

              {/* 下载按钮 */}
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                  title="下载"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              )}

              {/* 预览按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
                title="预览"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 h-4" />
              </button>

              {/* 删除按钮 */}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 sm:p-2 ml-auto bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* 移动端长按提示 */}
      <div
        className={cn(
          'absolute top-3 right-3',
          'p-1.5 rounded-full bg-black/30 text-white/80',
          'text-xs',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'md:hidden'
        )}
      >
        长按操作
      </div>
    </motion.div>
  );
};

export default ImageCard;
