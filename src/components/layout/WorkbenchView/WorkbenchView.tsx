import type { ReactNode } from 'react';
import { Navigation } from '../Navigation';

interface WorkbenchViewProps {
  children: ReactNode;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onViewChange: (view: 'home' | 'create' | 'landing') => void;
  onOpenDraw: () => void;
  onOpenChat: () => void;
  activeView: 'home' | 'create' | 'landing';
  createMode: 'draw' | 'chat';
}

export const WorkbenchView = ({
  children,
  isSidebarCollapsed,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  onOpenSettings,
  onViewChange,
  onOpenDraw,
  onOpenChat,
  activeView,
  createMode,
}: WorkbenchViewProps) => {
  return (
    <div className="flex h-screen h-[100dvh] bg-[var(--color-bg)] overflow-hidden">
      {/* 侧边栏 */}
      <Navigation
        collapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
        onViewChange={onViewChange}
        onOpenDraw={onOpenDraw}
        onOpenChat={onOpenChat}
        activeView={activeView}
        createMode={createMode}
      />

      {/* 主内容区 */}
      <main
        className={`flex-1 flex flex-col transition-[padding] duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        } pb-20 md:pb-0 h-full overflow-hidden`}
      >
        {children}
      </main>
    </div>
  );
};
