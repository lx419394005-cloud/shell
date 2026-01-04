/**
 * Toast - 全局提示组件
 * 
 * @description 用于显示成功、错误、警告等全局反馈
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    info: 'bg-blue-50 border-blue-100',
    warning: 'bg-amber-50 border-amber-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-[100]',
        'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg min-w-[300px] max-w-[90vw]',
        'backdrop-blur-xl',
        bgColors[type]
      )}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-gray-800 break-words">
        {message}
      </p>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
};
