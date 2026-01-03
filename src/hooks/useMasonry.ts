/**
 * useMasonry - 瀑布流计算 Hook
 *
 * @description 根据容器宽度计算瀑布流列数
 * @example const columns = useMasonry(containerRef, { minColumns: 2, maxColumns: 6 });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/** Hook 配置接口 */
interface UseMasonryOptions {
  /** 最小列数 */
  minColumns?: number;
  /** 最大列数 */
  maxColumns?: number;
  /** 列间距（px） */
  gap?: number;
  /** 最小卡片宽度（px） */
  minItemWidth?: number;
}

/**
 * useMasonry Hook
 */
export const useMasonry = (
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseMasonryOptions = {}
): number => {
  const {
    minColumns = 2,
    maxColumns = 6,
    gap = 16,
    minItemWidth = 180,
  } = options;

  const [columnCount, setColumnCount] = useState(minColumns);

  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const calculated = Math.max(
      minColumns,
      Math.min(maxColumns, Math.floor((containerWidth + gap) / (minItemWidth + gap)))
    );

    setColumnCount(calculated);
  }, [containerRef, minColumns, maxColumns, gap, minItemWidth]);

  useEffect(() => {
    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [calculateColumns]);

  return columnCount;
};

/**
 * 将项目分配到各列
 */
export const distributeToColumns = <T>(
  items: T[],
  columnCount: number
): T[][] => {
  // 初始化列数组
  const columns: T[][] = Array.from({ length: columnCount }, () => []);

  // 轮流分配项目到各列（实现交错效果）
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });

  return columns;
};

export default useMasonry;
