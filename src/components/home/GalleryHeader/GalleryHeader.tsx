import React, { useState } from 'react';
import { Search, Settings2, X, Filter, SortDesc, SortAsc, Trash2, Download, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { RatioIcon } from '@/components/common/RatioIcon/RatioIcon';

/** Aspect ratio options */
const ASPECT_RATIOS = ['all', '1:1', '4:3', '3:4', '16:9', '9:16'];

/** Sort options */
export type SortOrder = 'newest' | 'oldest';

export interface GalleryHeaderProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  aspectRatioFilter: string;
  onAspectRatioFilterChange: (filter: string) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  selectedCount: number;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onBatchDownload: () => void;
  onBatchDelete: () => void;
  onClearAll?: () => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  isDesktop?: boolean;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  totalCount,
  searchQuery,
  onSearchChange,
  aspectRatioFilter,
  onAspectRatioFilterChange,
  isSelectionMode,
  onToggleSelectionMode,
  selectedCount,
  onSelectAll,
  isAllSelected,
  onBatchDownload,
  onBatchDelete,
  onClearAll,
  sortOrder,
  onSortOrderChange,
  isDesktop = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={cn(
      "sticky top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]/50 transition-all",
      "pt-[calc(env(safe-area-inset-top,0px)+16px)]",
      isDesktop ? "px-4 pb-4" : "px-4 pb-3"
    )}>
      <div className="flex flex-col gap-4">
        {/* Top Row: Search and Actions (Title removed) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索提示词..."
              className="w-full h-10 pl-10 pr-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--color-border)] rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onClearAll && totalCount > 0 && !isSelectionMode && (
              <button
                onClick={onClearAll}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                title="清空所有历史记录"
              >
                <Trash2 className="w-4 h-4" />
                清空全部
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-full border transition-all",
                showFilters || aspectRatioFilter !== 'all'
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-soft)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
              )}
              title="筛选与排序"
            >
              <Filter className="w-5 h-5" />
            </button>

            {totalCount > 0 && (
              <button
                onClick={onToggleSelectionMode}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  isSelectionMode 
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20" 
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                )}
              >
                {isSelectionMode ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    取消选择
                  </>
                ) : (
                  <>
                    <Settings2 className="w-3.5 h-3.5" />
                    批量管理
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Filters and Sorting */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between py-3 border-t border-[var(--color-border)]/30 mt-2 bg-[var(--color-primary-soft)]/30 px-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {isAllSelected ? '取消全选' : '全选'}
                  </button>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    已选择 <span className="font-bold text-[var(--color-primary)]">{selectedCount}</span> 项
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={onBatchDownload}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 text-[var(--color-text)] border border-[var(--color-border)] rounded-lg text-xs font-bold hover:border-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                  <button
                    onClick={onBatchDelete}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showFilters && !isSelectionMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-6 py-2 border-t border-[var(--color-border)]/30 mt-2">
                {/* Ratio Filters */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    尺寸筛选
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {ASPECT_RATIOS.map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => onAspectRatioFilterChange(ratio)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border flex items-center gap-2",
                          aspectRatioFilter === ratio
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border)]"
                        )}
                      >
                        {ratio !== 'all' && (
                          <RatioIcon ratio={ratio} active={aspectRatioFilter === ratio} />
                        )}
                        <span>{ratio === 'all' ? '全部尺寸' : ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Toggle */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    排序方式
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSortOrderChange('newest')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        sortOrder === 'newest'
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border)]"
                      )}
                    >
                      <SortDesc className="w-3.5 h-3.5" />
                      最新
                    </button>
                    <button
                      onClick={() => onSortOrderChange('oldest')}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        sortOrder === 'oldest'
                          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-border)]"
                      )}
                    >
                      <SortAsc className="w-3.5 h-3.5" />
                      最早
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
