/**
 * DrawPanel - AI Image Generation Panel
 *
 * @description AI image generation panel with prompt input and settings
 * @example <DrawPanel />
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings2, ImageIcon, AlertCircle, X, Loader2, Wand2, RotateCcw, Trash2, Download, ShieldAlert } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ASPECT_RATIOS, type AspectRatioKey } from '@/services/imageApi';
import { getActiveApiConfig } from '@/utils/apiConfig';
import { uploadToPicUI } from '@/services/picuiApi';
import { optimizePrompt } from '@/services/chatApi';
import { RatioIcon } from '@/components/common/RatioIcon/RatioIcon';
import { stripPromptCount, injectPromptCount } from '@/utils/prompt';

/** DrawPanel props interface */
export interface DrawPanelProps {
  /** CSS class name */
  className?: string;
  /** Background generation state */
  isGenerating?: boolean;
  /** Generation start time */
  genStartTime?: number | null;
  /** Start generation callback */
  onStartGeneration?: (prompt: string, options: any) => Promise<void>;
  /** Stop generation callback */
  onStopGeneration?: () => void;
  /** Image generated callback */
  onImageGenerated?: (images: string[], prompt: string) => void;
  /** All image history for feed style */
  history?: any[];
  /** Preview image callback */
  onPreviewImage?: (item: any, allItems: any[], index: number) => void;
  /** Toast callback */
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  /** Delete group callback */
  onDeleteGroup?: (groupId: string) => void;
  /** Delete image callback */
  onDeleteImage?: (id: string) => Promise<void> | void;
}

/** Resolution presets */
const RESOLUTIONS = [
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
] as const;

/** Generation Timer Component */
const GenerationTimer: React.FC<{ startTime: number | null }> = ({ startTime }) => {
  const [elapsedTime, setElapsedTime] = useState<string>('0.0');

  useEffect(() => {
    let interval: number;
    if (startTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;
        setElapsedTime(diff.toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <span className="text-[10px] text-[var(--color-primary)]/60 font-mono ml-1 group-hover/stop:hidden">
      {elapsedTime}s
    </span>
  );
};

/** DrawPanel component implementation */
export const DrawPanel: React.FC<DrawPanelProps> = ({ 
  className, 
  isGenerating: isGeneratingProp,
  genStartTime: genStartTimeProp,
  onStartGeneration,
  onStopGeneration,
  history = [],
  onPreviewImage,
  showToast,
  onDeleteGroup,
  onDeleteImage,
}) => {
  // State
  const [prompt, setPrompt] = useState('');
  const [negativePrompt] = useState('blurry, low quality, distorted, deformed');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');
  const [maxImages, setMaxImages] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // API 信息状态
  const [activeApi, setActiveApi] = useState<any>(null);
  const [hasToken, setHasToken] = useState(true);

  useEffect(() => {
    const loadApiInfo = async () => {
      const config = await getActiveApiConfig('image');
      setActiveApi(config);
      setHasToken(!!config);
    };
    loadApiInfo();
  }, []);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // 使用 prop 或本地 fallback
  const isGenerating = isGeneratingProp ?? false;
  const startTime = genStartTimeProp ?? null;

  // 按组聚合历史记录
  const groupedHistory = React.useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    
    const groups: { [key: string]: any } = {};
    // 修改排序：时间戳升序，旧的在上，新的在下
    const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedHistory.forEach(item => {
        const gId = item.groupId || `single-${item.id}`;
        if (!groups[gId]) {
          groups[gId] = {
            id: gId,
            prompt: stripPromptCount(item.prompt),
            timestamp: item.timestamp,
            images: [], // 存储原始 item 对象以供预览
            aspectRatio: item.aspectRatio,
            size: item.size,
            model: item.model
          };
        }
        groups[gId].images.push(item);
      });
    
    return Object.values(groups);
  }, [history]);

  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const prevHistoryLength = useRef(groupedHistory.length);

  // ... (keeping other effects)

  // Handle upload
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单验证文件类型
    if (!file.type.startsWith('image/')) {
      showToast?.('只能上传图片文件', 'error');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast?.('图片大小不能超过 5MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadToPicUI(file);
      if (result.status) {
        showToast?.('图片上传成功', 'success');
        setUploadedImageUrl(result.data.links.url);
      } else {
        showToast?.(result.message || '上传失败', 'error');
      }
    } catch (err) {
      showToast?.(err instanceof Error ? err.message : '上传过程中发生错误', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      // 如果是初次挂载，直接瞬间滚动到底部，不显示动画
      if (isInitialMount.current) {
        endRef.current.scrollIntoView({ behavior: 'auto' });
        isInitialMount.current = false;
        return;
      }

      // 如果正在生成，或者历史记录增加了，则平滑滚动
      if (isGenerating || groupedHistory.length > prevHistoryLength.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      prevHistoryLength.current = groupedHistory.length;
    }
  }, [groupedHistory.length, isGenerating]);

  // Handle prompt optimization
  const handleOptimizePrompt = async () => {
    if (!prompt.trim() || isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      const optimized = await optimizePrompt(prompt);
      if (optimized) {
        setPrompt(optimized);
        showToast?.('提示词已优化', 'success');
      }
    } catch (err) {
      showToast?.('优化失败，请重试', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle generation
  const handleGenerate = async (customPrompt?: string) => {
    const rawPrompt = customPrompt || prompt;
    if (!rawPrompt.trim() || isGenerating) return;
    
    // 注入图片数量提示词
    const finalPrompt = injectPromptCount(rawPrompt, maxImages);
    setError(null);
    
    try {
      if (onStartGeneration) {
        // 先清空输入框和上传的图片，提供即时反馈
        setPrompt('');
        setUploadedImageUrl(null);
        
        // 异步执行生成，不阻塞 UI 逻辑
        onStartGeneration(finalPrompt, {
          aspectRatio,
          negativePrompt,
          size: resolution,
          maxImages,
          image: uploadedImageUrl,
        }).catch(err => {
          if (err instanceof Error && err.name !== 'AbortError') {
            setError(err.message);
          }
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    }
  };

  // 批量操作处理函数
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectImage = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = history.filter(item => item.status === 'success').map(item => item.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 张图片吗？`)) return;

    try {
      for (const id of Array.from(selectedIds)) {
        await onDeleteImage?.(id);
      }
      showToast?.(`已成功删除 ${selectedIds.size} 张图片`, 'success');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      showToast?.('批量删除失败，请重试', 'error');
    }
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    
    const selectedItems = history.filter(item => selectedIds.has(item.id));
    
    showToast?.(`正在导出 ${selectedIds.size} 张图片...`, 'info');
    
    // 逐个下载（由于是 Base64，浏览器通常允许并发触发下载）
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = item.imageUrl;
        link.download = `pics-ai-${Date.now()}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200); // 增加延迟避免浏览器拦截
    });
  };

  return (
    <div className={cn('relative h-full bg-[var(--color-bg)] flex flex-col min-h-0', className)}>
      {/* Header - 保持简洁 */}
      <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between flex-shrink-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
            AI 绘画
          </h2>
          
          {history.length > 0 && (
            <>
              <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />
              <button
                onClick={toggleSelectionMode}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  isSelectionMode
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] border border-[var(--color-border)]"
                )}
              >
                {isSelectionMode ? "取消选择" : "批量操作"}
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isSelectionMode && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
              >
                {selectedIds.size === history.filter(item => item.status === 'success').length ? "取消全选" : "全选"}
              </button>
            </div>
          )}

          {/* API 信息显示 */}
          {activeApi && (
            <div className="hidden sm:flex flex-col items-end text-[10px] leading-tight text-[var(--color-text-secondary)]">
              <span className="font-bold text-[var(--color-text)] opacity-80">{activeApi.name}</span>
              <span className="opacity-60 max-w-[120px] truncate">{activeApi.apiKey.slice(0, 8)}***</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Feed Style */}
      <div className="flex-1 overflow-y-auto px-4 py-4" ref={scrollRef}>
        <div className="max-w-5xl mx-auto space-y-10 pb-40">
          {/* 历史记录流 */}
          {groupedHistory.map((group, groupIdx) => {
            const date = new Date(group.timestamp);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let dateLabel = '';
            if (date.toDateString() === today.toDateString()) {
              dateLabel = groupIdx === 0 ? '今天' : '';
            } else if (date.toDateString() === yesterday.toDateString()) {
              // 只在组的第一条显示“昨天”
              const prevGroup = groupedHistory[groupIdx - 1];
              const prevDate = prevGroup ? new Date(prevGroup.timestamp) : null;
              if (!prevDate || prevDate.toDateString() !== yesterday.toDateString()) {
                dateLabel = '昨天';
              }
            } else {
              const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
              const prevGroup = groupedHistory[groupIdx - 1];
              const prevDate = prevGroup ? new Date(prevGroup.timestamp) : null;
              if (!prevDate || prevDate.toDateString() !== date.toDateString()) {
                dateLabel = dateStr;
              }
            }

            return (
              <div key={group.id} className="space-y-4">
                {dateLabel && (
                  <h3 className="text-lg font-bold text-[var(--color-text)] mt-8 mb-4">{dateLabel}</h3>
                )}
                
                <div className="flex flex-col gap-3">
                  {/* 提示词和参数 */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-sm text-[var(--color-text)] leading-relaxed flex-1 min-w-[300px]">
                      {group.prompt}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] font-medium">
                      <div className="flex items-center gap-1">
                        <RatioIcon ratio={group.aspectRatio || '1:1'} className="scale-75" />
                        <span>{group.aspectRatio || '1:1'}</span>
                      </div>
                      <span className="opacity-30">|</span>
                      <span>{group.size || '2K'}</span>
                      <span className="opacity-30">|</span>
                      <span>{group.model || '4.5'}</span>
                    </div>
                  </div>

                  {/* 图片网格 */}
                  <div className={cn(
                    "grid gap-2 sm:gap-3",
                    group.images.length === 1 ? "grid-cols-1 max-w-[280px] sm:max-w-xs" : 
                    group.images.length === 2 ? "grid-cols-2 max-w-lg" : 
                    "grid-cols-2 md:grid-cols-4 max-w-4xl"
                  )}>
                    {group.images.map((item: any, imgIdx: number) => (
                      <motion.div
                        key={item.id || `${group.id}-${imgIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: imgIdx * 0.05 }}
                        className={cn(
                          "relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm group bg-[var(--color-surface)] border transition-all duration-300 flex items-center justify-center",
                          isSelectionMode ? "cursor-default" : "cursor-pointer",
                          selectedIds.has(item.id) 
                            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg)]" 
                            : "border-[var(--color-border)]"
                        )}
                        onClick={() => {
                          if (item.status === 'loading') return;
                          if (isSelectionMode) {
                            toggleSelectImage(item.id);
                          } else {
                            onPreviewImage?.(item, group.images, imgIdx);
                          }
                        }}
                      >
                        {item.status === 'loading' ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                            <span className="text-[10px] text-[var(--color-text-muted)]">生成中...</span>
                          </div>
                        ) : item.status === 'error' ? (
                          <div className="flex flex-col items-center gap-2 px-3 text-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-[10px] text-red-500 line-clamp-2">{item.error || '生成失败'}</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={item.imageUrl}
                              alt={`Generated ${imgIdx + 1}`}
                              className={cn(
                                "w-full h-full object-cover transition-transform duration-500",
                                !isSelectionMode && "group-hover:scale-110"
                              )}
                              loading="lazy"
                            />
                            
                            {/* 选择指示器 */}
                            {isSelectionMode && (
                              <div className="absolute top-2 right-2 z-10">
                                <div className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                  selectedIds.has(item.id)
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg"
                                    : "bg-black/20 border-white/50 backdrop-blur-sm"
                                )}>
                                  {selectedIds.has(item.id) && (
                                    <motion.svg 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-3.5 h-3.5" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor" 
                                      strokeWidth={3}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </motion.svg>
                                  )}
                                </div>
                              </div>
                            )}

                            {!isSelectionMode && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>


                  {/* 生成进度提示 - 仅在当前组有正在生成的图片时显示 */}
                  {group.images.some((item: any) => item.status === 'loading') && (
                    <div className="flex items-center gap-2 mt-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onStopGeneration?.();
                        }}
                        className="group/stop flex items-center gap-2 px-3 py-1 bg-[var(--color-primary-soft)] hover:bg-red-500/10 rounded-full border border-[var(--color-primary-soft)] hover:border-red-500/20 transition-all"
                        title="点击停止生成"
                      >
                        <Loader2 className="w-3 h-3 text-[var(--color-primary)] animate-spin group-hover/stop:hidden" />
                        <X className="w-3 h-3 text-red-500 hidden group-hover/stop:block" />
                        <span className="text-[10px] font-medium text-[var(--color-primary)] group-hover/stop:text-red-500">
                          正在生成 ({group.images.filter((item: any) => item.status === 'success').length}/{group.images.length})
                        </span>
                        <GenerationTimer startTime={startTime} />
                      </button>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => setPrompt(group.prompt)}
                      className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[11px] font-medium text-[var(--color-text)] flex items-center gap-1.5 hover:bg-[var(--color-border)] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      重新编辑
                    </button>
                    <button 
                      onClick={() => handleGenerate(group.prompt)}
                      className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[11px] font-medium text-[var(--color-text)] flex items-center gap-1.5 hover:bg-[var(--color-border)] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      再次生成
                    </button>
                    <button 
                      onClick={() => onDeleteGroup?.(group.id)}
                      className="px-3 py-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[11px] font-medium text-red-500 flex items-center gap-1.5 hover:bg-red-500/10 transition-colors ml-auto"
                      title="删除此组记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!isGenerating && groupedHistory.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
              <div className="w-20 h-20 bg-[var(--color-surface)] rounded-3xl flex items-center justify-center mb-6">
                <ImageIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-lg">说说今天想做点什么</p>
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={endRef} className="h-px" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        {/* 批量操作工具栏 */}
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-[calc(100%+16px)] left-4 right-4 z-40"
            >
              <div className="max-w-xl mx-auto bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-3 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3 px-2">
                  <span className="text-sm font-bold text-[var(--color-primary)]">
                    已选择 {selectedIds.size} 项
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBatchDownload}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    批量导出
                  </button>
                  
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    批量删除
                  </button>
                  
                  <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
                  
                  <button
                    onClick={toggleSelectionMode}
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Missing Warning */}
        {!hasToken && (
          <div className="mx-4 mb-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg shadow-amber-500/5 backdrop-blur-md animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">未检测到 API Token</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/60">请在侧边栏"API 设置"中配置您的 Key 才能开始创作</p>
              </div>
            </div>
          </div>
        )}

        <div className={cn(
          "px-4 flex justify-center bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent pt-10",
           "pb-[calc(env(safe-area-inset-bottom,0px)+100px)] sm:pb-6"
        )}>
        <div className="w-full max-w-3xl bg-[var(--color-bg-card)]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[var(--color-border)] p-3">
          <div className="flex items-start gap-3 mb-2">
            <div className="relative flex-shrink-0 mt-0.5">
              <button 
                onClick={handleUploadButtonClick}
                disabled={isUploading}
                className={cn(
                  "w-10 h-10 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center transition-all overflow-hidden border border-transparent hover:border-[var(--color-primary)]/30",
                  isUploading && "opacity-70 cursor-not-allowed",
                  uploadedImageUrl && "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-card)]"
                )}
                title={uploadedImageUrl ? "点击更换图片" : "上传参考图"}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                ) : uploadedImageUrl ? (
                  <img src={uploadedImageUrl} alt="参考图" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                )}
              </button>
              
              {uploadedImageUrl && !isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedImageUrl(null);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm z-10"
                  title="移除参考图"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={800}
              placeholder="说说今天想做点什么"
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 text-sm sm:text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] resize-none transition-all duration-300 py-1",
                isFocused || prompt.length > 50 ? "min-h-[120px]" : "min-h-[40px]"
              )}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 relative">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button 
                ref={settingsButtonRef}
                onClick={() => {
                  console.log('Settings button clicked, current state:', showSettings);
                  setShowSettings(!showSettings);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-medium border transition-all whitespace-nowrap active:scale-95",
                  showSettings 
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-soft)] shadow-sm" 
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]"
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <RatioIcon ratio={aspectRatio} active={showSettings} className="scale-75 -mx-1" />
                <span>{aspectRatio} · {resolution} · {maxImages}张</span>
              </button>

              <button 
                onClick={handleOptimizePrompt}
                disabled={!prompt.trim() || isOptimizing}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-bg)] text-[var(--color-text-secondary)] rounded-full text-[10px] sm:text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-text-muted)] transition-all whitespace-nowrap active:scale-95",
                  isOptimizing && "opacity-70 cursor-wait",
                  (!prompt.trim() || isOptimizing) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isOptimizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                {isOptimizing ? '优化中...' : '智能优化'}
              </button>
            </div>

            {/* 尺寸和分辨率设置浮窗 - 使用 absolute 定位在按钮上方 */}
            <AnimatePresence>
              {showSettings && (
                <>
                  {/* 点击外部关闭的透明层 */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSettings(false);
                    }} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-4 w-72 bg-[var(--color-bg-card)] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[var(--color-border)] p-5 z-[101] backdrop-blur-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-2">
                        <h3 className="text-sm font-bold text-[var(--color-text)]">生成设置</h3>
                        <button 
                          onClick={() => setShowSettings(false)}
                          className="p-1 hover:bg-[var(--color-surface)] rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                      </div>

                      {/* 比例选择 */}
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-3">图片比例</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => (
                            <button
                              key={key}
                              onClick={() => {
                                setAspectRatio(key);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-bold border transition-all",
                                aspectRatio === key
                                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                              )}
                            >
                              <RatioIcon ratio={key} active={aspectRatio === key} className="mb-0.5" />
                              {key}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 分辨率选择 */}
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-3">输出清晰度</label>
                        <div className="flex gap-2">
                          {RESOLUTIONS.map((res) => (
                            <button
                              key={res.value}
                              onClick={() => {
                                setResolution(res.value as '2K' | '4K');
                              }}
                              className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                                resolution === res.value
                                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                              )}
                            >
                              {res.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 生成数量选择 */}
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-3">生成张数</label>
                        <div className="flex gap-2">
                          {[1, 2, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setMaxImages(num);
                              }}
                              className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                                maxImages === num
                                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                              )}
                            >
                              {num}张
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 小三角 */}
                    <div className="absolute bottom-[-6px] left-8 w-3 h-3 bg-[var(--color-bg-card)] border-r border-b border-[var(--color-border)] rotate-45 shadow-[2px_2px_5px_rgba(0,0,0,0.05)]" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 ml-auto">
              <span className={cn(
                "text-[10px] font-mono transition-colors",
                prompt.length >= 700 ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
              )}>
                {prompt.length}/800
              </span>
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                  prompt.trim() && !isGenerating
                    ? "bg-[var(--color-text)] text-white shadow-md scale-105 hover:bg-[var(--color-text-secondary)] hover:shadow-lg"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed opacity-50"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 p-3 bg-red-500 text-white rounded-xl flex items-center gap-2 text-sm shadow-xl z-50"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrawPanel;
