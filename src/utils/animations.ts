/**
 * Framer Motion 动画配置
 *
 * @description 预设动画变体，方便组件复用
 * @example import { fadeInUp, staggerContainer } from '@/utils/animations';
 */

import type { Variants } from 'framer-motion';

/**
 * 淡入上升动画
 * - 用于单个元素的入场动画
 * - 持续时间: 0.4s
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 缩放入场动画
 * - 用于 Modal、Popover 等弹出元素
 * - 持续时间: 0.3s
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * 容器交错动画
 * - 用于列表项的交错入场
 * - 子元素间隔: 0.1s
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * 交错子元素动画
 * - 配合 staggerContainer 使用
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * 滑入动画 - 从左侧
 * - 用于侧边栏、Drawer 等
 */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 滑入动画 - 从右侧
 * - 用于侧边栏、Drawer 等
 */
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 滑入动画 - 从底部
 * - 用于底部弹出、Sheet 等
 */
export const slideInBottom: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 淡入动画
 * - 用于简单的内容切换
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * 脉冲动画
 * - 用于加载状态、焦点提示
 */
export const pulse: Variants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * 旋转动画
 * - 用于 loading spinner
 */
export const spin: Variants = {
  hidden: {
    rotate: 0,
  },
  visible: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * 弹簧动画 - 弹性效果
 * - 用于按钮点击反馈
 */
export const spring: Variants = {
  tap: {
    scale: 0.95,
  },
};

/**
 * Hover 浮动动画
 * - 用于卡片 hover 效果
 */
export const hoverFloat: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07)',
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(255, 69, 0, 0.15)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * 页面过渡动画
 * - 用于页面切换效果
 */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 列表项动画
 * - 用于 MasonryGrid、MessageList 等
 */
export const listItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 共享过渡配置
 */
export const transitionConfig = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

/**
 * 快速过渡配置
 */
export const quickTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};
