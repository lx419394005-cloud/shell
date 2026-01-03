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
} from './components';

// 类型定义
interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
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
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('image_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // ===== 聊天状态 =====
  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((msg: Record<string, unknown>) => ({
            id: msg.id as string,
            role: msg.role as 'user' | 'ai',
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

  // 保存历史记录
  useEffect(() => {
    localStorage.setItem('image_history', JSON.stringify(history));
  }, [history]);

  // 保存聊天记录
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // 保存聊天模型
  useEffect(() => {
    localStorage.setItem('selected_chat_model', selectedChatModel);
  }, [selectedChatModel]);

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
  const handleDeleteImage = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  // 下载图片
  const handleDownload = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `pics-ai-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('下载失败:', error);
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
      {/* 桌面端布局 */}
      <div className="hidden md:flex">
        {/* 侧边栏导航 */}
        <Navigation
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* 主内容区域 */}
        <main className="flex-1 ml-64 min-h-screen">
          <Container>
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
            />
          </Container>
        </main>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden">
        {/* 主内容 */}
        <main className="min-h-screen pb-16">
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
}) => {
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测桌面端
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 桌面端顶部栏
  const DesktopHeader = () => (
    <header className="flex items-center justify-between py-4 mb-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full',
            'bg-[var(--gradient-primary)]',
            'flex items-center justify-center',
            'text-white shadow-[var(--shadow-primary)]'
          )}
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Pics AI</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">创意一键生成</p>
        </div>
      </div>

      {/* 主题切换 */}
      <button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-full transition-colors',
          'bg-[var(--color-surface)] hover:bg-[var(--color-border)]'
        )}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-[var(--color-text-secondary)]" />
        ) : (
          <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
        )}
      </button>
    </header>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {activeView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4"
          >
            {/* 桌面端显示头部 */}
            {isDesktop && <DesktopHeader />}

            {/* 移动端欢迎区 */}
            {!isDesktop && (
              <div className="px-4 py-4">
                <Welcome />
                <QuickAction onOpenDraw={onOpenDraw} onOpenChat={onOpenChat} />
              </div>
            )}

            {/* 图片历史瀑布流 */}
            <div className={cn(!isDesktop && 'px-4')}>
              {history.length > 0 && (
                <>
                  {isDesktop && <div className="mb-6" />}
                  <MasonryGrid
                    items={history}
                    minColumns={2}
                    maxColumns={5}
                    gap={16}
                  >
                    {(item) => (
                      <ImageCard
                        key={item.id}
                        imageUrl={item.imageUrl}
                        prompt={item.prompt}
                        onClick={() => {}}
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
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeView === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[calc(100vh-64px)] md:h-screen"
          >
            {/* 桌面端头部 */}
            {isDesktop && (
              <div className="flex items-center justify-between py-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onModeChange('draw')}
                      className={cn(
                        'px-4 py-2 rounded-xl font-medium transition-colors',
                        createMode === 'draw'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                      )}
                    >
                      🎨 AI 绘图
                    </button>
                    <button
                      onClick={() => onModeChange('chat')}
                      className={cn(
                        'px-4 py-2 rounded-xl font-medium transition-colors',
                        createMode === 'chat'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                      )}
                    >
                      💬 智能对话
                    </button>
                  </div>
                </div>

                {/* 主题切换 */}
                <button
                  onClick={toggleTheme}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    'bg-[var(--color-surface)] hover:bg-[var(--color-border)]'
                  )}
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  ) : (
                    <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  )}
                </button>
              </div>
            )}

            {/* 创作视图 */}
            <CreateView activeMode={createMode} onModeChange={onModeChange} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
