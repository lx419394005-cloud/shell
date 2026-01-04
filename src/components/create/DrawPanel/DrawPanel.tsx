/**
 * DrawPanel - AI Image Generation Panel
 *
 * @description AI image generation panel with prompt input and settings
 * @example <DrawPanel />
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings2, ImageIcon, Clock, AlertCircle, X, Loader2, Wand2, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ASPECT_RATIOS, type AspectRatioKey, getUseCloudProxy, setUseCloudProxy } from '@/services/imageApi';
import { optimizePrompt } from '@/services/chatApi';

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
  /** All image history for feed style */
  history?: any[];
  /** Preview image callback */
  onPreviewImage?: (image: string, allImages: string[], index: number) => void;
  /** Toast callback */
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/** Resolution presets */
const RESOLUTIONS = [
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
] as const;

/** DrawPanel component implementation */
export const DrawPanel: React.FC<DrawPanelProps> = ({ 
  className, 
  isGenerating: isGeneratingProp,
  genStartTime: genStartTimeProp,
  onStartGeneration,
  history = [],
  onPreviewImage,
  showToast,
}) => {
  // State
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, deformed');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');
  const [imageCount, setImageCount] = useState<number>(4);
  const [useCloudProxy, setUseCloudProxyState] = useState(getUseCloudProxy());
  
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
            prompt: item.prompt,
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

  const [elapsedTime, setElapsedTime] = useState<string>('0.0');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // 引用设置面板的位置
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // 滚动引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupedHistory.length, isGenerating]);

  // Persistence Effects
  useEffect(() => {
    // 监听来自其他页面的 storage 变更
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gen_error' && e.newValue) {
        setError(e.newValue);
        localStorage.removeItem('gen_error');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (isGenerating && startTime) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const diff = (now - startTime) / 1000;
        setElapsedTime(diff.toFixed(1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  // Toggle proxy mode
  const toggleProxyMode = () => {
    const newValue = !useCloudProxy;
    setUseCloudProxyState(newValue);
    setUseCloudProxy(newValue);
  };

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
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || isGenerating) return;
    setError(null);
    
    try {
      if (onStartGeneration) {
        await onStartGeneration(finalPrompt, {
          aspectRatio,
          negativePrompt,
          size: resolution,
          imageCount,
        });
        // 生成成功后清空当前输入框
        setPrompt('');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    }
  };

  return (
    <div className={cn('relative h-full bg-[var(--color-bg)] overflow-hidden flex flex-col', className)}>
      {/* Header - 保持简洁 */}
      <div className="px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between flex-shrink-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)]">
            AI 绘画
          </h2>
        </div>
        
        {/* Proxy Switcher */}
        <button
          onClick={toggleProxyMode}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-all border",
            useCloudProxy 
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-soft)]"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]"
          )}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            useCloudProxy ? "bg-[var(--color-primary)]" : "bg-gray-400"
          )} />
          {useCloudProxy ? "云模式" : "直连"}
        </button>
      </div>

      {/* Main Content - Feed Style */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar" ref={scrollRef}>
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
                      <span>图片 {group.images.length}</span>
                      <span className="opacity-30">|</span>
                      <span>{group.aspectRatio || '1:1'}</span>
                      <span className="opacity-30">|</span>
                      <span>{group.size || '2K'}</span>
                      <span className="opacity-30">|</span>
                      <span>{group.model || '4.5'}</span>
                    </div>
                  </div>

                  {/* 图片网格 */}
                  <div className={cn(
                    "grid gap-2 sm:gap-3",
                    group.images.length === 1 ? "grid-cols-1 max-w-md" : 
                    group.images.length === 2 ? "grid-cols-2" : 
                    "grid-cols-2 md:grid-cols-4"
                  )}>
                    {group.images.map((item: any, imgIdx: number) => (
                      <motion.div
                        key={`${group.id}-${imgIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: imgIdx * 0.05 }}
                        className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm group bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer"
                        onClick={() => onPreviewImage?.(item.imageUrl, group.images.map((img: any) => img.imageUrl), imgIdx)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`Generated ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

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

          {/* 生成中的状态 */}
          {isGenerating && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text)]">正在为您生成精美图片...</span>
                  <div className="flex items-center gap-2 text-[var(--color-primary)] font-mono text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{elapsedTime}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 - 对话流样式 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="relative p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-xs font-bold">系统提示</span>
                      <button 
                        onClick={() => setError(null)}
                        className="p-0.5 hover:bg-red-200/50 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed">{error}</p>
                    <div className="absolute left-0 top-4 -translate-x-1/2 w-2 h-2 bg-red-50 border-l border-b border-red-100 rotate-45" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 滚动锚点 */}
          <div ref={endRef} className="h-px" />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:pb-6 flex justify-center z-20 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent pt-10">
        <div className="w-full max-w-3xl bg-[var(--color-bg-card)]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[var(--color-border)] p-3">
          <div className="flex items-start gap-3 mb-2">
            <button 
              onClick={() => showToast?.('图片上传功能开发中', 'info')}
              className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center flex-shrink-0 mt-0.5 hover:bg-[var(--color-border)] transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
            </button>
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
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-medium border transition-all whitespace-nowrap",
                  showSettings 
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary-soft)] shadow-sm" 
                    : "bg-[var(--color-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{aspectRatio} · {resolution} · {imageCount}张</span>
              </button>

              <button 
                onClick={handleOptimizePrompt}
                disabled={!prompt.trim() || isOptimizing}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--color-bg)] text-[var(--color-text-secondary)] rounded-full text-[10px] sm:text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-all whitespace-nowrap",
                  isOptimizing && "opacity-70 cursor-wait"
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
                                "py-2.5 rounded-xl text-xs font-semibold border transition-all",
                                aspectRatio === key
                                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
                              )}
                            >
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

                      {/* 数量选择 */}
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-3">生成数量</label>
                        <div className="flex gap-2">
                          {[1, 2, 4].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setImageCount(num);
                              }}
                              className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                                imageCount === num
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
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  prompt.trim() && !isGenerating
                    ? "bg-[var(--color-text)] text-white shadow-md scale-105"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                )}
              >
                <Sparkles className="w-4 h-4" />
              </button>
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
