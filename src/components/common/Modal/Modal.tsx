/**
 * Modal - 弹窗组件
 *
 * @description 模态弹窗，支持大圆角、无毛玻璃设计
 * @example <Modal isOpen onClose={handleClose}>内容</Modal>
 *
 * @props
 * - isOpen: 是否显示
 * - onClose: 关闭回调
 * - title: 标题
 * - children: 内容
 * - size: 大小 sm/md/lg
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { scaleIn, fadeIn } from '@/utils/animations';

/** 弹窗尺寸 */
type ModalSize = 'sm' | 'md' | 'lg';

/** 弹窗属性接口 */
export interface ModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 大小 */
  size?: ModalSize;
  /** CSS 类名 */
  className?: string;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
}

/**
 * 获取弹窗尺寸样式
 */
const getSizeStyles = (size: ModalSize): string => {
  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };
  return sizes[size];
};

/**
 * Modal 组件实现
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  showClose = true,
}) => {
  // 点击遮罩层关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleOverlayClick}
          >
            {/* 弹窗主体 */}
            <motion.div
              className={cn(
                // 基础样式
                'bg-[var(--color-bg-card)]',
                // 大圆角
                'rounded-[var(--radius-2xl)]',
                // 阴影
                'shadow-[var(--shadow-xl)]',
                // 宽度
                getSizeStyles(size),
                // 最大高度和溢出
                'max-h-[85vh] overflow-y-auto',
                // 位置
                'relative',
                className
              )}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              {/* 标题栏 */}
              {(title || showClose) && (
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                  {title && (
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-[var(--color-text)]"
                    >
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-[var(--color-surface)] transition-colors"
                      aria-label="关闭"
                    >
                      <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </button>
                  )}
                </div>
              )}

              {/* 内容 */}
              <div className="p-4">{children}</div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
