/**
 * Container - 响应式容器组件
 *
 * @description 根据屏幕宽度限制内容最大宽度
 * @example <Container size="xl">内容</Container>
 *
 * @props
 * - size: 容器大小 sm/md/lg/xl/full
 * - children: 内容
 * - className: CSS 类名
 */

import React from 'react';
import { cn } from '@/utils/cn';

/** 容器尺寸 */
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** 容器属性接口 */
export interface ContainerProps {
  /** 容器尺寸 */
  size?: ContainerSize;
  /** 内容 */
  children: React.ReactNode;
  /** CSS 类名 */
  className?: string;
}

/**
 * 获取容器最大宽度
 */
const getMaxWidth = (size: ContainerSize): string => {
  const widths: Record<ContainerSize, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    full: '100%',
  };
  return widths[size];
};

/**
 * Container 组件实现
 */
export const Container: React.FC<ContainerProps> = ({
  size = 'xl',
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        // 基础样式 - w-full 和 min-w-0 确保在 flex 布局中正确扩展
        'w-full min-w-0 mx-auto',
        // 内边距
        'px-4 sm:px-6 lg:px-8',
        // 最大宽度
        getMaxWidth(size) !== '100%' ? `max-w-[${getMaxWidth(size)}]` : '',
        className
      )}
      style={getMaxWidth(size) !== '100%' ? {} : { maxWidth: getMaxWidth(size) }}
    >
      {children}
    </div>
  );
};

export default Container;
