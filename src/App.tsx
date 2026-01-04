/**
 * Pics AI - React + TypeScript + Vite PWA
 *
 * @description AI 绘图与智能对话助手 - Pinterest 风格重构版
 * @design-system
 * - 主题色: #FF4500 (亮橙色)
 * - 圆角: 大圆角设计 (24px+)
 * - 阴影: 纯色阴影，禁止毛玻璃
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as motionHtml } from 'framer-motion';
import {
  Sparkles,
  Sun,
  Moon,
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

import { generateImage, type AspectRatioKey } from './services/imageApi';
import { Copy, Trash2, Download, X, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { getAllImagesFromDB, deleteImageFromDB, saveImageToDB } from './utils/db';

// 类型定义
interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  // 增加生成参数，支持 feed 流展示
  aspectRatio?: string;
  model?: string;
  size?: string;
  groupId?: string; // 用于将一组生成的图片归类
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
 * 屏幕尺寸检测 Hook
 */
const useIsDesktop = (): boolean => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  return isDesktop;
};

/**
 * 主应用组件
 */
function App() {
  // ===== 视图状态 =====
  const isDesktop = useIsDesktop();
  const [activeView, setActiveView] = useState<'home' | 'create'>('home');
  const [createMode, setCreateMode] = useState<'draw' | 'chat'>('draw');
  const [previewImage, setPreviewImage] = useState<HistoryItem | null>(null);
  const [showImageDetails, setShowImageDetails] = useState(false);

  // Toast 状态
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
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

  const [selectedChatModel, setSelectedChatModel] = useState(() => {
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
    } catch (error) {
      console.error('删除图片失败:', error);
    }
  };

  // 下载图片
  const handleDownload = async (url: string, prompt: string) => {
    try {
      // 1. 尝试使用 fetch 获取图片数据并转为 Blob
      // 这是实现“直接下载”而不是“预览”的关键，因为 Blob 链接不受跨域预览限制
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

  // 启动生成逻辑
  const handleStartGeneration = async (prompt: string, options: {
    aspectRatio: AspectRatioKey;
    negativePrompt: string;
    size: '2K' | '4K';
    imageCount?: number;
  }) => {
    setIsGenerating(true);
    setGenStartTime(Date.now());
    
    // 创建 AbortController 用于超时取消请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000); // 2分钟超时
    
    try {
      const result = await generateImage(prompt, {
        ...options,
        maxImages: options.imageCount || 4,
        signal: controller.signal // 将信号传递给 API
      });

      clearTimeout(timeoutId);

      if (result.success && result.images.length > 0) {
        // 确定最终使用的图片数据（优先 Base64）
        const finalImages = result.images.map((url, index) => 
          (result.base64Images && result.base64Images[index]) ? result.base64Images[index] : url
        );

        // 同时传递 URL 和可选的 Base64 数据到历史记录处理器
        await handleImageGenerated(result.images, result.prompt, result.base64Images, {
          aspectRatio: options.aspectRatio,
          size: options.size,
        });
        
        // 同时存一份到本地给 DrawPanel 展示（优先存 Base64，确保刷新后依然可见）
        localStorage.setItem('last_generated_images', JSON.stringify(finalImages));
        
        showToast('图片生成成功！', 'success');
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      let errorMessage = '生成出错，请重试';
      
      if (error.name === 'AbortError') {
        errorMessage = '生成超时（超过2分钟），请检查网络或稍后重试';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('Background generation error:', error);
      // 将错误存入本地，让 DrawPanel 能感知到
      localStorage.setItem('gen_error', errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
      setGenStartTime(null);
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
                src={previewImage.imageUrl}
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
                      onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
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
                    "w-full md:w-[380px] bg-[var(--color-bg-card)] md:h-[90vh] overflow-y-auto custom-scrollbar",
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
                          <span className="text-sm font-medium text-[var(--color-text)]">1:1 (Square)</span>
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
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onOpenDraw={handleOpenDraw}
                onOpenChat={handleOpenChat}
                onCopyPrompt={handleCopyPrompt}
                onDeleteImage={handleDeleteImage}
                onDownload={handleDownload}
                onPreviewImage={setPreviewImage}
                showToast={showToast}
                isGenerating={isGenerating}
                genStartTime={genStartTime}
                onStartGeneration={handleStartGeneration}
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
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            onOpenDraw={handleOpenDraw}
            onOpenChat={handleOpenChat}
            onCopyPrompt={handleCopyPrompt}
            onDeleteImage={handleDeleteImage}
            onDownload={handleDownload}
            onPreviewImage={setPreviewImage}
            showToast={showToast}
            isGenerating={isGenerating}
            genStartTime={genStartTime}
            onStartGeneration={handleStartGeneration}
          />
        </main>

        {/* 底部导航 */}
        <Navigation
          activeView={activeView}
          onViewChange={setActiveView}
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
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenDraw: () => void;
  onOpenChat: () => void;
  onCopyPrompt: (prompt: string) => void;
  onDeleteImage: (id: string) => void;
  onDownload: (url: string, prompt: string) => void;
  onPreviewImage: (item: any) => void;
  showToast: (message: string, type?: ToastType) => void;
  isGenerating: boolean;
  genStartTime: number | null;
  onStartGeneration: (prompt: string, options: any) => Promise<void>;
}

const PageContent: React.FC<PageContentProps> = ({
  activeView,
  createMode,
  onModeChange,
  history,
  isDarkMode,
  toggleTheme,
  onOpenDraw,
  onOpenChat,
  onCopyPrompt,
  onDeleteImage,
  onDownload,
  onPreviewImage,
  showToast,
  isGenerating,
  genStartTime,
  onStartGeneration,
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测桌面端
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
              'flex-1 overflow-y-auto custom-scrollbar',
              isDesktop ? 'pt-6' : 'pb-20'
            )}>
              {!isDesktop && (
                <div className="px-4 pt-6 pb-2">
                  <Welcome />
                </div>
              )}

              {/* 移动端固定顶部按钮区域 */}
              {!isDesktop && (
                <div className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-md px-4 py-3 border-b border-[var(--color-border)] shadow-sm mb-4">
                  <QuickAction onOpenDraw={onOpenDraw} onOpenChat={onOpenChat} />
                </div>
              )}

              <div className={cn(!isDesktop && 'px-3')}>
                {history.length > 0 && (
                  <>
                    {isDesktop ? (
                      <div className="mb-6" />
                    ) : (
                      <h2 className="text-lg font-bold text-[var(--color-text)] mb-4 px-1">
                        你的历史图片
                      </h2>
                    )}
                    <MasonryGrid
                      items={history}
                    minColumns={2}
                    maxColumns={5}
                    gap={isDesktop ? 16 : 10}
                  >
                    {(item) => (
                      <ImageCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        prompt={item.prompt}
                        onClick={() => onPreviewImage(item)}
                        onCopy={() => onCopyPrompt(item.prompt)}
                        onDelete={() => onDeleteImage(item.id)}
                        onDownload={() => onDownload(item.imageUrl, item.prompt)}
                      />
                    )}
                  </MasonryGrid>
                </>
              )}

              {/* 空状态 */}
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
                onPreviewImage={onPreviewImage}
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
