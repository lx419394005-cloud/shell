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
import { cn } from './utils/cn';

// 导入新组件
import {
  Container,
  MasonryGrid,
  ImageCard,
  Welcome,
  HomeView,
  CreateView,
  WorkbenchView,
  Modal,
  Toast,
  type ToastType,
  GalleryHeader,
  type SortOrder,
  RatioIcon,
  SettingsModal,
} from './components';

import { ExportModal } from './components/home/ExportModal/ExportModal';

import { type HistoryItem, type Message } from './types';

import { 
  generateImageStream,
  DEFAULT_MODEL 
} from './services/imageApi';
import { Copy, Trash2, Download, X, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAllImagesFromDB, deleteImageFromDB, saveImageToDB, clearAllImagesFromDB, migrateLocalStorageData } from './utils/db';
import { stripPromptCount } from './utils/prompt';
import { 
  getThemeSetting, 
  setThemeSetting, 
  getSidebarCollapsedSetting, 
  setSidebarCollapsedSetting,
  getSelectedChatModelSetting,
  setSelectedChatModelSetting,
  getActiveViewSetting,
  setActiveViewSetting,
  getCreateModeSetting,
  setCreateModeSetting
} from './utils/apiConfig';

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
  const [activeView, setActiveView] = useState<'home' | 'create' | 'landing'>('landing');
  const [createMode, setCreateMode] = useState<'draw' | 'chat'>('draw');
  const [previewImage, setPreviewImage] = useState<HistoryItem | null>(null);
  const [previewList, setPreviewList] = useState<HistoryItem[]>([]);
  const [exportImage, setExportImage] = useState<HistoryItem | null>(null);
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast 状态
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // ===== 初始化状态 =====
  const [isInitializing, setIsInitializing] = useState(true);

  // ===== 图库批量操作状态 =====
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handlePreviewImage = useCallback((item: HistoryItem, list?: HistoryItem[]) => {
     setPreviewImage(item);
     if (list) setPreviewList(list);
   }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

   // 导航预览
   const handleNavigatePreview = useCallback((direction: 'prev' | 'next') => {
    if (!previewImage || previewList.length === 0) return;
    
    const currentIndex = previewList.findIndex(item => item.id === previewImage.id);
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % previewList.length;
    } else {
      nextIndex = (currentIndex - 1 + previewList.length) % previewList.length;
    }
    
    setPreviewImage(previewList[nextIndex]);
  }, [previewImage, previewList]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ===== 主题状态 =====
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // 清空所有历史
  const handleClearAll = useCallback(async () => {
    if (history.length === 0) return;
    if (!confirm('确定要清空所有历史记录吗？此操作不可撤销。')) return;

    try {
      await clearAllImagesFromDB();
      setHistory([]);
      showToast('已清空所有历史记录', 'success');
    } catch (error) {
      console.error('清空失败:', error);
      showToast('清空失败', 'error');
    }
  }, [history.length]);

  // 加载 IndexedDB 数据
  const loadHistory = async () => {
    try {
      await migrateLocalStorageData(); // 先执行迁移
      const dbImages = await getAllImagesFromDB();
      setHistory(dbImages);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  // 初始加载
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. 数据迁移
        await migrateLocalStorageData();

        // 2. 并行加载核心设置
        const [
          savedTheme, 
          savedSidebar, 
          savedModel, 
          dbImages,
          savedActiveView,
          savedCreateMode
        ] = await Promise.all([
          getThemeSetting(),
          getSidebarCollapsedSetting(),
          getSelectedChatModelSetting(),
          getAllImagesFromDB(),
          getActiveViewSetting(),
          getCreateModeSetting()
        ]);

        // 3. 应用设置
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(prefersDark);
        }

        setIsSidebarCollapsed(savedSidebar);
        
        if (savedModel && CHAT_MODELS.some(m => m.value === savedModel)) {
          setSelectedChatModel(savedModel);
        }

        if (savedActiveView) setActiveView(savedActiveView as 'home' | 'create' | 'landing');
        if (savedCreateMode) setCreateMode(savedCreateMode as 'draw' | 'chat');

        setHistory(dbImages);
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
    
    // 监听 storage 事件（主要用于跨标签页，虽然 IndexedDB 不触发，但保留作为兜底或未来扩展）
    const handleStorageChange = () => {
      loadHistory();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ===== 聊天状态 =====
  const [chatMessages] = useState<Message[]>([]);

  const [selectedChatModel, setSelectedChatModel] = useState(CHAT_MODELS[0].value);

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
    setThemeSetting(isDarkMode);
  }, [isDarkMode]);

  // 保存聊天模型
  useEffect(() => {
    setSelectedChatModelSetting(selectedChatModel);
  }, [selectedChatModel]);

  // 保存侧边栏状态
  useEffect(() => {
    setSidebarCollapsedSetting(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // 保存当前视图状态
  useEffect(() => {
    if (!isInitializing) {
      setActiveViewSetting(activeView);
    }
  }, [activeView, isInitializing]);

  // 保存创作模式状态
  useEffect(() => {
    if (!isInitializing) {
      setCreateModeSetting(createMode);
    }
  }, [createMode, isInitializing]);

  // 图片预览键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewImage) return;

      if (e.key === 'ArrowLeft') {
        handleNavigatePreview('prev');
      } else if (e.key === 'ArrowRight') {
        handleNavigatePreview('next');
      } else if (e.key === 'Escape') {
        setPreviewImage(null);
        setShowImageDetails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, handleNavigatePreview]);

  // ===== 处理函数 =====

  // 切换视图并保存
  const handleViewChange = useCallback((view: 'home' | 'create' | 'landing') => {
    setActiveView(view);
    setActiveViewSetting(view);
  }, []);

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
    navigator.clipboard.writeText(stripPromptCount(prompt));
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

  // 导出图片
  const handleExport = (item: HistoryItem) => {
    setExportImage(item);
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
    
    const finalPrompt = prompt;

    // 创建一个新的 groupId 用于这一批次
    const groupId = `batch-${Date.now()}`;
    
    // 预先创建占位符（作为加载反馈）
    const numImages = options.maxImages || 1;
    const placeholders: HistoryItem[] = Array.from({ length: numImages }).map((_, i) => ({
      id: `${groupId}-${i + 1}`,
      groupId,
      prompt: finalPrompt,
      timestamp: Date.now(),
      aspectRatio: options.aspectRatio,
      size: options.size,
      model: DEFAULT_MODEL,
      status: 'loading'
    }));

    setHistory(prev => [...placeholders, ...prev]);

    // 立即保存占位符到数据库，确保刷新后也能看到“生成中”状态
    for (const placeholder of placeholders) {
      saveImageToDB(placeholder).catch(err => console.error('Failed to save placeholder:', err));
    }

    try {
      // 检查是否已停止
      if (stopGenerationRef.current) {
        const errorItems = placeholders.map(item => ({ ...item, status: 'error' as const, error: '已停止生成' }));
        setHistory(prev => prev.map(item => 
          item.groupId === groupId ? { ...item, status: 'error', error: '已停止生成' } : item
        ));
        for (const item of errorItems) await saveImageToDB(item);
        return;
      }

      // 使用流式生成，实现“生成一张显示一张”
      const result = await generateImageStream(finalPrompt, {
        ...options,
        maxImages: numImages,
        onProgress: async (current, total, data) => {
          if (data.error) {
            // 更新单张图片的错误状态
            const errorId = `${groupId}-${current}`;
            setHistory(prev => prev.map(item => 
              item.id === errorId ? { ...item, status: 'error', error: data.error } : item
            ));
            // 同步到数据库
            const errorItem = { ...placeholders[current - 1], status: 'error' as const, error: data.error };
            await saveImageToDB(errorItem);
          } else if (data.b64) {
            // 更新单张图片的成功状态
            const successId = `${groupId}-${current}`;
            const newItem: HistoryItem = {
              ...placeholders[current - 1],
              id: successId,
              imageUrl: data.b64,
              status: 'success',
              timestamp: Date.now()
            };
            
            setHistory(prev => prev.map(item => 
              item.id === successId ? newItem : item
            ));
            // 同步到数据库
            await saveImageToDB(newItem);
          }
        }
      });
      
      if (!result.success && result.error) {
        throw new Error(result.error);
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
      for (const placeholder of placeholders) {
        await saveImageToDB({ ...placeholder, status: 'error', error: err.message || '生成失败' });
      }
    } finally {
      setIsGenerating(false);
      setGenStartTime(null);
      window.dispatchEvent(new Event('storage'));
    }
  };

  // 处理图片上传成功
  // 已移至 DrawPanel 内部处理，不再存入历史记录

  // ===== 渲染 =====

  // 打开工作台
  const handleEnterWorkbench = () => {
    setActiveView('home');
    setActiveViewSetting('home');
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--color-primary-soft)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {activeView === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <HomeView onStartCreate={handleEnterWorkbench} />
        </motion.div>
      ) : (
        <motionHtml.div
          key="workbench"
          className={cn(
            'h-screen h-[100dvh]',
            'bg-[var(--color-bg)]',
            'text-[var(--color-text)]',
            'transition-colors duration-300',
            'overflow-hidden'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
                    alt={stripPromptCount(previewImage.prompt)}
                    className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                  
                  {/* 顶部操作按钮 */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (confirm('确定要删除这张图片吗？')) {
                          handleDeleteImage(previewImage.id);
                          setPreviewImage(null);
                          setShowImageDetails(false);
                        }
                      }}
                      className="p-2 bg-black/40 text-red-400 rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/20"
                      title="删除图片"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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

                  {/* 左右切换按钮 */}
                  {previewList.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigatePreview('prev');
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:flex"
                        title="上一个 (←)"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigatePreview('next');
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 hidden md:flex"
                        title="下一个 (→)"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

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
                              {stripPromptCount(previewImage.prompt)}
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

                          {/* 更多元数据 */}
                          <div className="grid grid-cols-2 gap-4">
                            {previewImage.model && (
                              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">模型</span>
                                <span className="text-sm font-medium text-[var(--color-text)] truncate block">{previewImage.model}</span>
                              </div>
                            )}
                            {previewImage.size && (
                              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">分辨率</span>
                                <span className="text-sm font-medium text-[var(--color-text)]">{previewImage.size}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 底部操作 */}
                      <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] sticky bottom-0">
                        <button
                          onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
                          className="w-full h-12 bg-[image:var(--gradient-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
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

          {/* 导出卡片弹窗 */}
          <ExportModal
            isOpen={!!exportImage}
            onClose={() => setExportImage(null)}
            imageUrl={exportImage?.imageUrl || ''}
            prompt={exportImage?.prompt || ''}
          />

          {/* 核心工作台视图 */}
          <WorkbenchView
            activeView={activeView as 'home' | 'create'}
            createMode={createMode}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onViewChange={handleViewChange}
            onOpenDraw={handleOpenDraw}
            onOpenChat={handleOpenChat}
          >
            <Container className="flex-1 flex flex-col md:pt-6 h-full min-h-0">
              <PageContent
                activeView={activeView as 'home' | 'create'}
                createMode={createMode}
                onModeChange={setCreateMode}
                history={history}
                chatMessages={chatMessages}
                onOpenDraw={handleOpenDraw}
                onCopyPrompt={handleCopyPrompt}
                onDeleteImage={handleDeleteImage}
                onDeleteGroup={handleDeleteGroup}
                onDownload={handleDownload}
                onExport={handleExport}
                onPreviewImage={handlePreviewImage}
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
                onClearAll={handleClearAll}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
              />
            </Container>
          </WorkbenchView>

          {/* 设置弹窗 */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          {/* 全局 Toast */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </motionHtml.div>
      )}
    </AnimatePresence>
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
  onDeleteImage: (id: string) => void;
  onDownload: (url: string | undefined, prompt: string) => void;
  onPreviewImage: (item: any, allItems?: any[], index?: number) => void;
  onDeleteGroup: (groupId: string) => void;
  onExport: (item: HistoryItem) => void;
  onImageUploaded?: (url: string) => void;
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
  onClearAll?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

const PageContent: React.FC<PageContentProps> = ({
  activeView,
  createMode,
  onModeChange,
  history,
  onOpenDraw,
  onCopyPrompt,
  onDeleteImage,
  onDownload,
  onPreviewImage,
  onDeleteGroup,
  onExport,
  onImageUploaded,
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
  onClearAll,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortOrderChange,
}) => {
  const isDesktop = useMemo(() => window.innerWidth >= 768, []);

  // 检测桌面端
  const [currentIsDesktop, setCurrentIsDesktop] = useState(isDesktop);
  useEffect(() => {
    const check = () => setCurrentIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 过滤和分组逻辑
  const filteredHistory = useMemo(() => {
    let result = history;
    
    // 比例过滤
    if (aspectRatioFilter !== 'all') {
      result = result.filter(item => item.aspectRatio === aspectRatioFilter);
    }
    
    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.prompt.toLowerCase().includes(query)
      );
    }
    
    // 排序
    const sortedResult = [...result].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
    });
    
    return sortedResult;
  }, [history, aspectRatioFilter, searchQuery, sortOrder]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const sorted = [...filteredHistory];
  if (sortOrder === 'newest') {
    sorted.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    sorted.sort((a, b) => a.timestamp - b.timestamp);
  }

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

  // 获取当前所有可见图片的 ID（用于全选）
  const allVisibleIds = useMemo(() => filteredHistory.map(item => item.id), [filteredHistory]);

  return (
    <div className="flex flex-col h-full min-h-0 relative overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        {activeView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full flex flex-col relative"
          >
            {/* 可滚动区域 */}
            <div className={cn(
              'flex-1 overflow-y-auto',
              !currentIsDesktop && 'pb-32'
            )}>
              {/* 顶部标题和过滤器 */}
              <GalleryHeader
                totalCount={filteredHistory.length}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                aspectRatioFilter={aspectRatioFilter}
                onAspectRatioFilterChange={onAspectRatioFilterChange}
                isSelectionMode={isSelectionMode || false}
                onToggleSelectionMode={onToggleSelectionMode || (() => {})}
                selectedCount={selectedIds?.size || 0}
                onSelectAll={() => onSelectAll?.(allVisibleIds)}
                isAllSelected={selectedIds?.size === allVisibleIds.length}
                onBatchDownload={onBatchDownload || (() => {})}
                onBatchDelete={onBatchDelete || (() => {})}
                onClearAll={onClearAll}
                sortOrder={sortOrder}
                onSortOrderChange={onSortOrderChange}
                isDesktop={currentIsDesktop}
              />

              <div className={cn(
                currentIsDesktop ? 'pt-8 px-4' : 'px-3 pt-4'
              )}>
                {history.length === 0 && (
                  <Welcome />
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
                          maxColumns={8}
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
                              onExport={() => onExport(item)}
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
                  <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-secondary)]">
                    <button
                      onClick={onOpenDraw}
                      className="px-10 py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[var(--color-primary)]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      立即开始创作
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
            className="h-full flex flex-col overflow-hidden relative"
          >
            {/* 创作视图 */}
            <div className="flex-1 h-full min-h-0 overflow-hidden">
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
                onImageUploaded={onImageUploaded}
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
