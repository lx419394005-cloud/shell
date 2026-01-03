/**
 * MasonryGrid - Pinterest 瀑布流组件
 *
 * @description 响应式瀑布流布局，支持动态列数计算
 * @example
 * <MasonryGrid items={images}>
 *   {(item) => <ImageCard {...item} />}
 * </MasonryGrid>
 *
 * @props
 * - items: 数据数组
 * - children: 渲染函数
 * - className: CSS 类名
 * - columnCount: 固定列数（可选）
 */

import React, { useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMasonry, distributeToColumns } from '@/hooks/useMasonry';
import { cn } from '@/utils/cn';
import { staggerItem } from '@/utils/animations';

/** 瀑布流属性接口 */
export interface MasonryGridProps<T> {
  /** 数据数组 */
  items: T[];
  /** 渲染函数 */
  children: (item: T, index: number) => React.ReactNode;
  /** CSS 类名 */
  className?: string;
  /** 固定列数（覆盖自动计算） */
  columnCount?: number;
  /** 最小列数 */
  minColumns?: number;
  /** 最大列数 */
  maxColumns?: number;
  /** 列间距 */
  gap?: number;
}

/**
 * MasonryGrid 组件实现
 */
export function MasonryGrid<T>({
  items,
  children,
  className,
  columnCount: fixedColumnCount,
  minColumns = 2,
  maxColumns = 6,
  gap = 16,
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 Hook 计算列数，或使用固定值
  const columnCount = fixedColumnCount || useMasonry(containerRef, { minColumns, maxColumns, gap });

  // 将项目分配到各列
  const columns = useMemo(
    () => distributeToColumns(items, columnCount),
    [items, columnCount]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        // 布局方式：使用 flex 实现瀑布流
        'flex gap-4',
        className
      )}
      style={{ paddingBottom: gap }}
    >
      {columns.map((column, colIndex) => (
        <div
          key={colIndex}
          className="flex-1 flex flex-col gap-4"
        >
          <AnimatePresence mode="popLayout">
            {column.map((item, itemIndex) => (
              <motion.div
                key={`${colIndex}-${itemIndex}`}
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                {children(item, colIndex * columnCount + itemIndex)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default MasonryGrid;
