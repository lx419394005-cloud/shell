/**
 * Pics AI - React + TypeScript + Vite PWA
 *
 * @description AI 绘图与智能对话助手 - Pinterest 风格重构版
 * @design-system
 * - 主题色: #FF4500 (亮橙色)
 * - 圆角: 大圆角设计 (24px+)
 * - 阴影: 纯色阴影，禁止毛玻璃
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionHtml } from 'framer-motion';
import {
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from './utils/cn';

// 导入新组件
import {
  Navigation,
  Container,
  MasonryGrid,
  ImageCard,
  QuickAction,
  Welcome,
  CreateView,
  Modal,
  Toast,
  type ToastType,
} from './components';

import { generateImage, generateImageStream, type AspectRatioKey, DEFAULT_MODEL } from './services/imageApi';
import { Copy, Trash2, Download, X, Info, ChevronRight, Settings2 } from 'lucide-react';
import { getAllImagesFromDB, deleteImageFromDB, saveImageToDB } from './utils/db';

// 类型定义
interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl?: string;
  timestamp: number;
  // 增加生成参数，支持 feed 流展示
  aspectRatio?: string;
  model?: string;
  size?: string;
  groupId?: string; // 用于将一组生成的图片归类
  status?: 'loading' | 'success' | 'error';
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 预设聊天模型
const CHAT_MODELS = [
  { label: 'DeepSeek-V3.2', value: 'DeepSeek-V3.2' },
  { label: 'GLM-4.7', value: 'GLM-4.7' },
  { label: 'MiniMax-M2.1', value: 'MiniMax-M2.1' },
];

/**
 * 主应用组件
 */
function App() {
  // ===== 视图状态 =====
  const [activeView, setActiveView] = useState<'home' | 'create'>('home');
  const [createMode, setCreateMode] = useState<'draw' | 'chat'>('draw');
  const [previewImage, setPreviewImage] = useState<HistoryItem | null>(null);
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<string>('all');

  // Toast 状态
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // ===== 图库批量操作状态 =====
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  // ===== 主题状态 =====
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // ===== 绘图状态 =====
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // ===== 图库批量操作逻辑 =====
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectImage = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      if (prev.size === ids.length) {
        return new Set();
      }
      return new Set(ids);
    });
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 张图片吗？`)) return;

    try {
      const idsToDelete = Array.from(selectedIds);
      await Promise.all(idsToDelete.map(id => deleteImageFromDB(id)));
      setHistory(prev => prev.filter(item => !selectedIds.has(item.id)));
      showToast(`已删除 ${selectedIds.size} 张图片`, 'success');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('批量删除失败:', error);
      showToast('删除失败', 'error');
    }
  }, [selectedIds]);

  const handleBatchDownload = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    showToast(`正在准备 ${selectedIds.size} 张图片进行下载...`, 'info');
    
    const selectedItems = history.filter(item => selectedIds.has(item.id) && item.imageUrl);
    
    for (const item of selectedItems) {
      await handleDownload(item.imageUrl, item.prompt);
      // 添加一小段延迟，防止浏览器拦截多个下载
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    showToast('批量下载任务已启动', 'success');
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, [selectedIds, history]);

  // 计算内存占用 (仅针对 Base64 图片)
  const memoryUsage = useMemo(() => {
    const totalBytes = history.reduce((acc, item) => {
      if (item.imageUrl?.startsWith('data:image')) {
        // 粗略计算：base64 字符串长度 * 0.75 为实际字节数
        return acc + (item.imageUrl.length * 0.75);
      }
      return acc;
    }, 0);
    
    // 转为 MB，保留一位小数
    const mb = totalBytes / (1024 * 1024);
    return mb.toFixed(1);
  }, [history]);

  // 加载 IndexedDB 数据
  const loadHistory = async () => {
    try {
      const dbImages = await getAllImagesFromDB();
      
      // 数据迁移：如果 LocalStorage 有数据但 DB 没数据，执行迁移
      const localHistoryStr = localStorage.getItem('image_history');
      if (localHistoryStr && dbImages.length === 0) {
        const localHistory = JSON.parse(localHistoryStr);
        if (localHistory.length > 0) {
          console.log('正在将 LocalStorage 数据迁移到 IndexedDB...');
          for (const item of localHistory) {
            await saveImageToDB(item);
          }
          // 迁移完成后清空 LocalStorage
          localStorage.removeItem('image_history');
          const finalImages = await getAllImagesFromDB();
          setHistory(finalImages);
          return;
        }
      }
      
      setHistory(dbImages);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    loadHistory();
    
    // 监听 storage 事件（跨页面通信）
    const handleStorageChange = () => {
      loadHistory();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ===== 聊天状态 =====
  const [chatMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: Record<string, unknown>) => ({
            id: msg.id as string,
            role: (msg.role === 'ai' ? 'assistant' : msg.role) as 'user' | 'assistant',
            content: msg.content as string,
            timestamp: new Date(msg.timestamp as string),
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [selectedChatModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected_chat_model');
      if (saved && CHAT_MODELS.some((m) => m.value === saved)) {
        return saved;
      }
      return CHAT_MODELS[0].value;
    }
    return CHAT_MODELS[0].value;
  });

  // ===== 后台生成状态 =====
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const stopGenerationRef = useRef(false);

  // ===== 副作用 =====

  // 主题切换
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 保存历史记录逻辑已迁移至 IndexedDB
  // 此处原有的 localStorage.setItem('image_history', ...) 应该移除

  // 保存聊天记录
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // 保存聊天模型
  useEffect(() => {
    localStorage.setItem('selected_chat_model', selectedChatModel);
  }, [selectedChatModel]);

  // 保存侧边栏状态
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // ===== 处理函数 =====

  // 切换主题
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // 打开绘图
  const handleOpenDraw = () => {
    setActiveView('create');
    setCreateMode('draw');
  };

  // 打开聊天
  const handleOpenChat = () => {
    setActiveView('create');
    setCreateMode('chat');
  };

  // 复制提示词
  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // 可以添加 toast 提示
  };

  // 删除历史图片
  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImageFromDB(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast('已删除图片', 'success');
    } catch (error) {
      console.error('删除图片失败:', error);
      showToast('删除失败', 'error');
    }
  };

  /**
   * 处理删除整组图片
   */
  const handleDeleteGroup = async (groupId: string) => {
    try {
      // 找出该组的所有图片
      const groupItems = history.filter(item => item.groupId === groupId);
      
      // 并行删除数据库中的记录
      await Promise.all(groupItems.map(item => deleteImageFromDB(item.id)));
      
      // 更新 state
      setHistory(prev => prev.filter(item => item.groupId !== groupId));
      
      showToast('已删除该组记录', 'success');
      
      // 触发 storage 事件通知其他页面
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('删除组失败:', error);
      showToast('删除失败', 'error');
    }
  };

  // 下载图片
  const handleDownload = async (url: string | undefined, prompt: string) => {
    if (!url) return;
    try {
      // 如果已经是 Base64，直接下载
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        const cleanPrompt = prompt.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 15);
        link.download = `pics-ai-${cleanPrompt || 'image'}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 否则（如果是 URL），尝试使用 fetch 获取图片数据并转为 Blob
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });

      if (!response.ok) throw new Error('Download request failed');

      const blob = await response.blob();
      
      // 2. 确保 Blob 的 MIME 类型正确（强制设为 image/png 或从 response 获取）
      const downloadBlob = new Blob([blob], { type: blob.type || 'image/png' });
      const blobUrl = URL.createObjectURL(downloadBlob);

      // 3. 创建隐藏的下载链接并触发
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // 格式化文件名：pics-ai-提示词前10位-时间戳.png
      const cleanPrompt = prompt.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 15);
      link.download = `pics-ai-${cleanPrompt || 'image'}-${Date.now()}.png`;
      
      document.body.appendChild(link);
      link.click();
      
      // 4. 清理
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error('直接下载失败，尝试 canvas 渲染下载方案:', error);
      
      // 5. 备用方案：如果 fetch 被拦截，尝试用 Canvas 重新绘制（可绕过部分 CORS 限制）
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((canvasBlob) => {
              if (canvasBlob) {
                const canvasUrl = URL.createObjectURL(canvasBlob);
                const a = document.createElement('a');
                a.href = canvasUrl;
                a.download = `pics-ai-fallback-${Date.now()}.png`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(canvasUrl), 1000);
              }
            }, 'image/png');
          }
        };
      } catch (canvasError) {
        console.error('Canvas 方案也失败:', canvasError);
        // 最后实在不行才打开新窗口
        window.open(url, '_blank');
      }
    }
  };

  // 处理图片生成
  const handleImageGenerated = async (
    images: string[], 
    prompt: string, 
    base64Images?: string[],
    options?: { aspectRatio?: string; size?: string; model?: string }
  ) => {
    const groupId = Math.random().toString(36).substring(2, 11);
    const newItems: HistoryItem[] = images.map((url, index) => ({
      id: Math.random().toString(36).substring(2, 11),
      prompt,
      // 如果有 Base64 则优先使用，否则使用 URL
      imageUrl: (base64Images && base64Images[index]) ? base64Images[index] : url,
      timestamp: Date.now(),
      aspectRatio: options?.aspectRatio,
      size: options?.size,
      model: options?.model || 'Doubao-Seedream-4.5',
      groupId,
    }));

    // 异步保存到 IndexedDB
    try {
      for (const item of newItems) {
        await saveImageToDB(item);
      }
    } catch (error) {
      console.error('保存到 IndexedDB 失败:', error);
    }

    // 更新内存中的历史状态
    setHistory((prev) => [...newItems, ...prev]);
    
    // 触发全局事件，让图库和绘制面板感知到新图片
    window.dispatchEvent(new Event('storage'));
  };

  const handleStopGeneration = useCallback(() => {
    if (isGenerating) {
      stopGenerationRef.current = true;
      showToast('已停止生成', 'info');
    }
  }, [isGenerating]);

  // 处理开始生成图片
  const handleStartGeneration = async (prompt: string, options: any) => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenStartTime(Date.now());
    stopGenerationRef.current = false;
    
    // 注入生成数量提示（根据用户要求：如果选择了多张，注入到提示词中）
    let finalPrompt = prompt;
    if (options.maxImages > 1 && !prompt.includes('生成') && !prompt.includes('张')) {
      finalPrompt = `生成${options.maxImages}张关于: ${prompt}`;
    }

    // 创建一个新的 groupId 用于这一批次
    const groupId = `batch-${Date.now()}`;
    
    // 预先创建一个占位符（作为加载反馈）
    const placeholder: HistoryItem = {
      id: `${groupId}-1`,
      groupId,
      prompt: finalPrompt,
      timestamp: Date.now(),
      aspectRatio: options.aspectRatio,
      size: options.size,
      model: DEFAULT_MODEL,
      status: 'loading'
    };

    setHistory(prev => [placeholder, ...prev]);

    try {
      // 检查是否已停止
      if (stopGenerationRef.current) {
        setHistory(prev => prev.map(item => 
          item.groupId === groupId ? { ...item, status: 'error', error: '已停止生成' } : item
        ));
        return;
      }

      // 单次请求生成所有图片 (API 内部已硬编码 max_images: 4)
      const result = await generateImage(finalPrompt, {
        ...options,
        maxImages: 4 // 确保后端允许最多 4 张
      });
      
      if (result.success && result.base64Images && result.base64Images.length > 0) {
        const newItems: HistoryItem[] = result.base64Images.map((b64, i) => {
          return {
            id: `${groupId}-${i + 1}`,
            groupId,
            prompt: finalPrompt,
            imageUrl: b64, // 仅使用 Base64
            timestamp: Date.now(),
            aspectRatio: options.aspectRatio,
            size: options.size,
            model: DEFAULT_MODEL,
            status: 'success'
          };
        });

        // 完全替换占位符逻辑：移除旧的 loading 占位符，插入实际返回的结果
        setHistory(prev => {
          const filtered = prev.filter(item => item.groupId !== groupId);
          return [...newItems, ...filtered];
        });

        // 保存到数据库
        for (const item of newItems) {
          await saveImageToDB(item);
        }
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      // 更新该组的所有项为错误状态
      setHistory(prev => prev.map(item => 
        item.groupId === groupId && item.status === 'loading'
          ? { ...item, status: 'error', error: err.message || '生成失败' }
          : item
      ));
      
      // 保存错误状态到数据库
      await saveImageToDB({ ...placeholder, status: 'error', error: err.message || '生成失败' });
    } finally {
      setIsGenerating(false);
      setGenStartTime(null);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // ===== 渲染 =====

  return (
    <motionHtml.div
      className={cn(
        'min-h-screen',
        'bg-[var(--color-bg)]',
        'text-[var(--color-text)]',
        'transition-colors duration-300'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 图片预览弹窗 */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => {
          setPreviewImage(null);
          setShowImageDetails(false);
        }}
        size="lg"
        className="!p-0 !max-w-[95vw] !max-h-[95vh] !bg-transparent !shadow-none overflow-visible"
        showClose={false}
      >
        {previewImage && (
          <div className="flex flex-col md:flex-row h-full max-h-[95vh] items-center justify-center">
            {/* 图片展示区 */}
            <div className={cn(
              "relative group transition-all duration-300 ease-in-out",
              "flex items-center justify-center",
              showImageDetails ? "md:w-2/3 w-full" : "w-full"
            )}>
              <img
                src={previewImage.imageUrl || ''}
                alt={previewImage.prompt}
                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              
              {/* 顶部操作按钮 */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => setShowImageDetails(!showImageDetails)}
                  className={cn(
                    "p-2 rounded-full transition-all backdrop-blur-md border",
                    showImageDetails 
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg" 
                      : "bg-black/40 text-white border-white/20 hover:bg-black/60"
                  )}
                  title={showImageDetails ? "隐藏详情" : "查看详情"}
                >
                  <Info className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setShowImageDetails(false);
                  }}
                  className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 底部悬浮操作栏 (仅在详情关闭时显示) */}
              <AnimatePresence>
                {!showImageDetails && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className="absolute bottom-6 left-1/2 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button 
                      onClick={() => handleCopyPrompt(previewImage.prompt)}
                      className="p-2 text-white/80 hover:text-white transition-colors"
                      title="复制提示词"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <div className="w-px h-4 bg-white/20" />
                    <button 
                      onClick={() => handleDownload(previewImage.imageUrl || '', previewImage.prompt)}
                      className="p-2 text-white/80 hover:text-white transition-colors"
                      title="下载图片"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 详情面板 (右侧) */}
            <AnimatePresence>
              {showImageDetails && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "w-full md:w-[380px] bg-[var(--color-bg-card)] md:h-[90vh] overflow-y-auto",
                    "rounded-2xl md:ml-4 shadow-2xl border border-[var(--color-border)]",
                    "flex flex-col"
                  )}
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-[var(--color-text)]">图片详情</h3>
                      <button 
                        onClick={() => setShowImageDetails(false)}
                        className="p-1.5 hover:bg-[var(--color-surface)] rounded-full transition-colors text-[var(--color-text-secondary)]"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">提示词</h4>
                        <div className="p-4 bg-[var(--color-surface)] rounded-xl text-sm leading-relaxed border border-[var(--color-border)] text-[var(--color-text)]">
                          {previewImage.prompt}
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(previewImage.prompt)}
                          className="mt-3 flex items-center gap-2 text-[var(--color-primary)] text-sm font-medium hover:opacity-80 transition-opacity"
                        >
                          <Copy className="w-4 h-4" />
                          复制提示词
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">生成时间</span>
                          <span className="text-sm font-medium text-[var(--color-text)]">{new Date(previewImage.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">比例</span>
                          <div className="flex items-center gap-2">
                            <RatioIcon ratio={previewImage.aspectRatio || '1:1'} className="text-[var(--color-text)]" />
                            <span className="text-sm font-medium text-[var(--color-text)]">{previewImage.aspectRatio || '1:1'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 底部操作 */}
                  <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] sticky bottom-0">
                    <button
                      onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
                      className="w-full h-12 bg-[var(--gradient-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-5 h-5" />
                      保存到本地
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这张图片吗？')) {
                          handleDeleteImage(previewImage.id);
                          setPreviewImage(null);
                          setShowImageDetails(false);
                        }
                      }}
                      className="w-full mt-3 h-12 text-red-500 font-medium flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      删除图片
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Modal>

      {/* 全局提示 */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* 桌面端布局 */}
      <div className="hidden md:flex">
        {/* 侧边栏导航 */}
        <Navigation
          activeView={activeView}
          onViewChange={setActiveView}
          createMode={createMode}
          onOpenDraw={handleOpenDraw}
          onOpenChat={handleOpenChat}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          memoryUsage={memoryUsage}
        />

        {/* 主内容区域 */}
        <main className={cn(
          "flex-1 h-screen overflow-hidden transition-all duration-300",
          isSidebarCollapsed ? "ml-20" : "ml-64"
        )}>
          <Container className="h-full">
            <PageContent
                activeView={activeView}
                createMode={createMode}
                onModeChange={setCreateMode}
                history={history}
                chatMessages={chatMessages}
                onOpenDraw={handleOpenDraw}
                onOpenChat={handleOpenChat}
                onCopyPrompt={handleCopyPrompt}
                onDeleteImage={handleDeleteImage}
                onDeleteGroup={handleDeleteGroup}
                onDownload={handleDownload}
                onPreviewImage={setPreviewImage}
                showToast={showToast}
                isGenerating={isGenerating}
                genStartTime={genStartTime}
                onStartGeneration={handleStartGeneration}
                onStopGeneration={handleStopGeneration}
                aspectRatioFilter={aspectRatioFilter}
                onAspectRatioFilterChange={setAspectRatioFilter}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedIds}
                onToggleSelectionMode={toggleSelectionMode}
                onToggleSelectImage={toggleSelectImage}
                onSelectAll={handleSelectAll}
                onBatchDelete={handleBatchDelete}
                onBatchDownload={handleBatchDownload}
              />
          </Container>
        </main>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden">
        {/* 主内容 */}
        <main className="min-h-screen">
          <PageContent
            activeView={activeView}
            createMode={createMode}
            onModeChange={setCreateMode}
            history={history}
            chatMessages={chatMessages}
            onOpenDraw={handleOpenDraw}
            onOpenChat={handleOpenChat}
            onCopyPrompt={handleCopyPrompt}
            onDeleteImage={handleDeleteImage}
            onDeleteGroup={handleDeleteGroup}
            onDownload={handleDownload}
            onPreviewImage={setPreviewImage}
            showToast={showToast}
            isGenerating={isGenerating}
            genStartTime={genStartTime}
            onStartGeneration={handleStartGeneration}
            onStopGeneration={handleStopGeneration}
            aspectRatioFilter={aspectRatioFilter}
            onAspectRatioFilterChange={setAspectRatioFilter}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedIds}
            onToggleSelectionMode={toggleSelectionMode}
            onToggleSelectImage={toggleSelectImage}
            onSelectAll={handleSelectAll}
            onBatchDelete={handleBatchDelete}
            onBatchDownload={handleBatchDownload}
          />
        </main>

        {/* 底部导航 */}
        <Navigation
          activeView={activeView}
          onViewChange={setActiveView}
          memoryUsage={memoryUsage}
        />
      </div>
    </motionHtml.div>
  );
}

/**
 * 页面内容组件
 */
interface PageContentProps {
  activeView: 'home' | 'create';
  createMode: 'draw' | 'chat';
  onModeChange: (mode: 'draw' | 'chat') => void;
  history: HistoryItem[];
  chatMessages: Message[];
  onOpenDraw: () => void;
  onOpenChat: () => void;
  onDeleteImage: (id: string) => void;
  onDownload: (url: string | undefined, prompt: string) => void;
  onPreviewImage: (item: any, allItems?: any[], index?: number) => void;
  onDeleteGroup?: (groupId: string) => void;
  showToast: (message: string, type?: ToastType) => void;
  isGenerating: boolean;
  genStartTime: number | null;
  onStartGeneration: (prompt: string, options: any) => Promise<void>;
  onStopGeneration: () => void;
  aspectRatioFilter: string;
  onAspectRatioFilterChange: (filter: string) => void;
  onCopyPrompt: (prompt: string) => void;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelectionMode?: () => void;
  onToggleSelectImage?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onBatchDelete?: () => void;
  onBatchDownload?: () => void;
}

/**
 * 比例图标组件
 */
const RatioIcon = ({ ratio, active, className }: { ratio: string; active?: boolean; className?: string }) => {
  const getRect = () => {
    switch (ratio) {
      case '1:1': return { width: 12, height: 12 };
      case '4:3': return { width: 14, height: 10.5 };
      case '3:4': return { width: 10.5, height: 14 };
      case '16:9': return { width: 16, height: 9 };
      case '9:16': return { width: 9, height: 16 };
      default: return null;
    }
  };

  const rect = getRect();
  if (!rect) return null;

  return (
    <div 
      className={cn(
        "flex items-center justify-center transition-all duration-300",
        ratio === '16:9' || ratio === '9:16' ? "w-5 h-5" : "w-4 h-4",
        className
      )}
    >
      <div 
        style={{ 
          width: `${rect.width}px`, 
          height: `${rect.height}px`,
          borderWidth: '1.5px'
        }}
        className={cn(
          "rounded-[2px] border-current transition-all duration-300",
          active ? "opacity-100" : "opacity-40"
        )}
      />
    </div>
  );
};

const PageContent: React.FC<PageContentProps> = ({
  activeView,
  createMode,
  onModeChange,
  history,
  onOpenDraw,
  onOpenChat,
  onCopyPrompt,
  onDeleteImage,
  onDownload,
  onPreviewImage,
  onDeleteGroup,
  showToast,
  isGenerating,
  genStartTime,
  onStartGeneration,
  onStopGeneration,
  aspectRatioFilter,
  onAspectRatioFilterChange,
  isSelectionMode,
  selectedIds,
  onToggleSelectionMode,
  onToggleSelectImage,
  onSelectAll,
  onBatchDelete,
  onBatchDownload,
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测桌面端
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 过滤和分组逻辑
  const filteredHistory = useMemo(() => {
    let result = history;
    if (aspectRatioFilter !== 'all') {
      result = result.filter(item => item.aspectRatio === aspectRatioFilter);
    }
    return result;
  }, [history, aspectRatioFilter]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const sorted = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let label = '';
      if (date.toDateString() === today.toDateString()) {
        label = '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = '昨天';
      } else {
        label = `${date.getMonth() + 1}月${date.getDate()}日`;
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
  }, [filteredHistory]);

  const aspectRatios = ['all', '1:1', '4:3', '3:4', '16:9', '9:16'];

  // 获取当前所有可见图片的 ID（用于全选）
  const allVisibleIds = useMemo(() => filteredHistory.map(item => item.id), [filteredHistory]);

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {activeView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* 可滚动区域 */}
            <div className={cn(
              'flex-1 overflow-y-auto',
              !isDesktop && 'pb-20'
            )}>
              {/* 顶部标题和过滤器 - 固定定位 */}
              <div className={cn(
                "sticky top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-md px-6 py-4 border-b border-[var(--color-border)]/50 transition-all",
                !isDesktop && "px-4 py-3"
              )}>
                <div className={cn(
                  "flex flex-col md:flex-row md:items-center justify-between gap-4",
                )}>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">我的图库</h2>
                    <div className="px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider">
                      {filteredHistory.length}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                    {/* 批量操作触发按钮 */}
                    {filteredHistory.length > 0 && (
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

                    <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

                    {aspectRatios.map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => onAspectRatioFilterChange(ratio)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border flex items-center gap-2",
                          aspectRatioFilter === ratio
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary-soft)]"
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
              </div>

              <div className={cn(
                isDesktop ? 'pt-8 px-6' : 'px-3 pt-4'
              )}>
                {!isDesktop && history.length === 0 && (
                  <div className="px-4 pb-2">
                    <Welcome />
                  </div>
                )}

                {groupedHistory.length > 0 ? (
                  <div className="space-y-12 pb-10">
                    {groupedHistory.map(group => (
                      <div key={group.label} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h2 className="text-xl font-bold text-[var(--color-text)] whitespace-nowrap">
                            {group.label}
                          </h2>
                          <div className="h-px w-full bg-gradient-to-r from-[var(--color-border)] to-transparent" />
                        </div>
                        
                        <MasonryGrid
                          items={group.items}
                          minColumns={2}
                          maxColumns={5}
                          gap={isDesktop ? 16 : 10}
                        >
                          {(item) => (
                            <ImageCard
                              key={item.id}
                              imageUrl={item.imageUrl}
                              prompt={item.prompt}
                              status={item.status}
                              error={item.error}
                              onClick={() => onPreviewImage(item)}
                              onCopy={() => onCopyPrompt(item.prompt)}
                              onDelete={() => onDeleteImage(item.id)}
                          onDownload={() => onDownload(item.imageUrl, item.prompt)}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedIds?.has(item.id)}
                          onToggleSelect={() => onToggleSelectImage?.(item.id)}
                        />
                          )}
                        </MasonryGrid>
                      </div>
                    ))}
                  </div>
                ) : (
                  history.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
                      <p className="text-lg">没有找到该尺寸的图片</p>
                      <button
                        onClick={() => onAspectRatioFilterChange('all')}
                        className="mt-4 text-[var(--color-primary)] font-medium hover:underline"
                      >
                        显示全部
                      </button>
                    </div>
                  )
                )}

                {/* 完全空状态 */}
                {history.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg">还没有作品，开始创作吧！</p>
                    <button
                      onClick={onOpenDraw}
                      className="mt-6 px-6 py-2 bg-[var(--color-primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                      去创作
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 批量操作工具栏 */}
            <AnimatePresence>
              {isSelectionMode && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
                >
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 flex items-center justify-between backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          已选择 {selectedIds?.size || 0} 项
                        </span>
                        <button 
                          onClick={() => onSelectAll?.(allVisibleIds)}
                          className="text-[10px] text-[var(--color-primary)] font-bold uppercase hover:underline text-left"
                        >
                          {selectedIds?.size === allVisibleIds.length ? '取消全选' : '全选当前'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={onBatchDownload}
                        disabled={!selectedIds || selectedIds.size === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--color-primary)]/20"
                      >
                        <Download className="w-4 h-4" />
                        批量保存
                      </button>
                      <button
                        onClick={onBatchDelete}
                        disabled={!selectedIds || selectedIds.size === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        批量删除
                      </button>
                      <div className="w-px h-8 bg-[var(--color-border)] mx-2" />
                      <button
                        onClick={onToggleSelectionMode}
                        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors bg-[var(--color-surface)] rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col overflow-hidden"
          >
            {/* 创作视图 */}
            <div className="flex-1 overflow-hidden">
              <CreateView
                activeMode={createMode}
                onModeChange={onModeChange}
                isGenerating={isGenerating}
                genStartTime={genStartTime}
                history={history}
                onStartGeneration={onStartGeneration}
                onStopGeneration={onStopGeneration}
                onPreviewImage={onPreviewImage}
                onDeleteImage={onDeleteImage}
                onDeleteGroup={onDeleteGroup}
                showToast={showToast}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
