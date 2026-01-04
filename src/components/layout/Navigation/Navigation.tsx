/**
 * Navigation - Responsive navigation component
 *
 * @description Mobile bottom Tab, desktop left sidebar
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Sparkles, Plus, ChevronLeft, ChevronRight, Palette, MessageSquare, Sun, Moon } from 'lucide-react';
import { cn } from '@/utils/cn';

/** View type */
type ViewType = 'home' | 'create';
/** Create mode type */
type CreateMode = 'draw' | 'chat';

/** Navigation props interface */
export interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  createMode?: CreateMode;
  onOpenDraw?: () => void;
  onOpenChat?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** Navigation item config */
interface NavItem {
  view: ViewType;
  icon: React.ReactNode;
  label: string;
}

/** Navigation items definition */
const NAV_ITEMS: NavItem[] = [
  { view: 'home', icon: <Home className="w-5 h-5" />, label: '图库' },
  { view: 'create', icon: <Plus className="w-5 h-5" />, label: 'Create' },
];

/**
 * Check if desktop
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
 * Navigation button component
 */
interface NavButtonProps {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  fullWidth?: boolean;
  collapsed?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ item, active, onClick, fullWidth = false, collapsed = false }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center transition-all duration-200 relative',
        'rounded-xl group',
        fullWidth ? 'w-full' : 'flex-none',
        fullWidth ? 'h-12' : 'h-10 px-4',
        fullWidth ? (collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-4') : 'justify-center gap-1',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
      )}
      title={collapsed ? item.label : undefined}
    >
      <div className={cn("transition-transform duration-200", !active && "group-hover:scale-110")}>
        {item.icon}
      </div>
      {!fullWidth && (
        <span className={cn('font-medium text-xs', active && 'font-semibold')}>
          {item.label}
        </span>
      )}
      {fullWidth && !collapsed && (
        <span className={cn('font-medium text-sm whitespace-nowrap overflow-hidden', active && 'font-semibold')}>
          {item.label}
        </span>
      )}
    </button>
  );
};

/**
 * Navigation component implementation
 */
export const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  onViewChange, 
  createMode,
  onOpenDraw,
  onOpenChat,
  isDarkMode,
  onToggleTheme,
  className,
  collapsed = false,
  onToggleCollapse
}) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <nav
        className={cn(
          'fixed left-0 top-0 h-screen bg-[var(--color-bg-card)] border-r border-[var(--color-border)] z-50',
          'flex flex-col py-6 transition-all duration-300',
          collapsed ? 'w-20 px-3' : 'w-64 px-4',
          className
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          "flex items-center mb-8 px-2 transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-[var(--gradient-primary)] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-[var(--color-text)]">Pics AI</span>
            </motion.div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-[var(--gradient-primary)] rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Create Section */}
        <div className="flex flex-col gap-2 mb-8">
          {!collapsed && (
            <div className="px-2 mb-1">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                开始创作
              </span>
            </div>
          )}
          <button
            onClick={onOpenDraw}
            className={cn(
              'flex items-center transition-all duration-200 rounded-xl group h-12 w-full',
              collapsed ? 'justify-center' : 'gap-3 px-4',
              activeView === 'create' && createMode === 'draw'
                ? 'bg-[var(--gradient-primary)] text-white shadow-md'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            )}
            title={collapsed ? "AI 绘图" : undefined}
          >
            <Palette className={cn("w-5 h-5", activeView === 'create' && createMode === 'draw' ? "text-white" : "text-[var(--color-primary)]")} />
            {!collapsed && <span className="font-semibold text-sm">AI 绘图</span>}
          </button>
          
          <button
            onClick={onOpenChat}
            className={cn(
              'flex items-center transition-all duration-200 rounded-xl group h-12 w-full',
              collapsed ? 'justify-center' : 'gap-3 px-4',
              activeView === 'create' && createMode === 'chat'
                ? 'bg-[var(--gradient-primary)] text-white shadow-md'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
            )}
            title={collapsed ? "智能对话" : undefined}
          >
            <MessageSquare className={cn("w-5 h-5", activeView === 'create' && createMode === 'chat' ? "text-white" : "text-[var(--color-primary)]")} />
            {!collapsed && <span className="font-semibold text-sm">智能对话</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-2">
          {!collapsed && (
            <div className="px-2 mb-1">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                发现内容
              </span>
            </div>
          )}
          {NAV_ITEMS.filter(item => item.view !== 'create').map((item) => (
            <NavButton
              key={item.view}
              item={item}
              active={activeView === item.view}
              onClick={() => onViewChange(item.view)}
              fullWidth
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Collapse Toggle & Theme Toggle */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={onToggleTheme}
            className={cn(
              "flex items-center justify-center h-10 w-full rounded-xl",
              "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]",
              "transition-colors duration-200"
            )}
            title={isDarkMode ? "切换亮色模式" : "切换暗色模式"}
          >
            {collapsed ? (
              isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-3 px-2 w-full">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span className="text-sm font-medium">{isDarkMode ? '亮色模式' : '暗色模式'}</span>
              </div>
            )}
          </button>

          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center justify-center h-10 w-full rounded-xl",
              "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]",
              "transition-colors duration-200"
            )}
            title={collapsed ? "展开" : "收起"}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : (
              <div className="flex items-center gap-3 px-2 w-full">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">收起侧边栏</span>
              </div>
            )}
          </button>
        </div>
      </nav>
    );
  }

  // Mobile navigation
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 h-14 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] z-50',
        'flex items-center px-6 gap-8 justify-around',
        className
      )}
    >
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.view}
          item={item}
          active={activeView === item.view}
          onClick={() => onViewChange(item.view)}
        />
      ))}
    </nav>
  );
};

export default Navigation;
