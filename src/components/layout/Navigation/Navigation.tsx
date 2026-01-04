/**
 * Navigation - Responsive navigation component
 *
 * @description Mobile bottom Tab, desktop left sidebar
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Sparkles, Plus, ChevronLeft, ChevronRight, Palette, MessageSquare, Sun, Moon } from 'lucide-react';
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
  memoryUsage?: string;
}

/** Navigation item config */
interface NavItem {
  view: ViewType;
  icon: React.ReactNode;
  label: string;
}

/** Navigation items definition */
const NAV_ITEMS: NavItem[] = [
  { view: 'home', icon: <LayoutGrid className="w-5 h-5" />, label: '图库' },
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
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  fullWidth?: boolean;
  collapsed?: boolean;
  title?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  fullWidth = false, 
  collapsed = false,
  title
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center transition-all duration-300 ease-in-out relative',
        'rounded-xl group active:scale-95',
        fullWidth ? 'w-full' : 'flex-none',
        fullWidth ? 'h-12' : 'h-10 px-4',
        fullWidth ? (collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-4') : 'justify-center gap-1',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]'
      )}
      title={collapsed ? title || label : undefined}
    >
      <div className={cn(
        "transition-transform duration-300 ease-in-out",
        "group-hover:scale-110"
      )}>
        {icon}
      </div>
      {(!fullWidth || (fullWidth && !collapsed)) && (
        <span className={cn(
          'font-medium transition-all duration-300',
          fullWidth ? 'text-sm whitespace-nowrap overflow-hidden' : 'text-xs',
          active && 'font-semibold'
        )}>
          {label}
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
  onToggleCollapse,
  memoryUsage
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
          <NavButton
            onClick={onOpenDraw || (() => {})}
            active={activeView === 'create' && createMode === 'draw'}
            icon={<Palette className="w-5 h-5" />}
            label="AI 绘图"
            fullWidth
            collapsed={collapsed}
          />
          
          <NavButton
            onClick={onOpenChat || (() => {})}
            active={activeView === 'create' && createMode === 'chat'}
            icon={<MessageSquare className="w-5 h-5" />}
            label="智能对话"
            fullWidth
            collapsed={collapsed}
          />
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
              icon={item.icon}
              label={item.label}
              active={activeView === item.view}
              onClick={() => onViewChange(item.view)}
              fullWidth
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Collapse Toggle & Theme Toggle */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Theme Toggle & Memory Usage */}
          <div className="px-2 mb-2">
            <div className={cn(
              "flex flex-col gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] transition-all duration-300",
              collapsed && "items-center px-1"
            )}>
              <button
                onClick={onToggleTheme || (() => {})}
                className={cn(
                  "flex items-center gap-3 w-full transition-all group",
                  collapsed ? "justify-center" : "justify-between"
                )}
                title={isDarkMode ? "切换亮色模式" : "切换暗色模式"}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors">
                    {isDarkMode ? <Sun className="w-4 h-4 text-orange-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  </div>
                  {!collapsed && <span className="text-xs font-semibold text-[var(--color-text)]">{isDarkMode ? '亮色模式' : '暗色模式'}</span>}
                </div>
                {!collapsed && (
                  <div className={cn(
                    "w-8 h-4 rounded-full p-0.5 transition-colors",
                    isDarkMode ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300",
                      isDarkMode ? "translate-x-4" : "translate-x-0"
                    )} />
                  </div>
                )}
              </button>

              {memoryUsage && (
                <>
                  {!collapsed && <div className="h-px bg-[var(--color-border)]/50 mx-1" />}
                  <div className={cn(
                    "flex flex-col gap-1.5",
                    collapsed && "items-center"
                  )}>
                    {!collapsed ? (
                      <>
                        <div className="flex items-center justify-between text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                          <span>存储占用</span>
                          <span className="text-[var(--color-text)]">{memoryUsage} MB</span>
                        </div>
                        <div className="h-1 w-full bg-[var(--color-bg-card)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[var(--gradient-primary)] transition-all duration-500" 
                            style={{ width: `${Math.min(parseFloat(memoryUsage) / 50, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-[9px] font-bold text-[var(--color-primary)]" title={`存储: ${memoryUsage} MB`}>
                        {Math.round(parseFloat(memoryUsage))}M
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <NavButton
            onClick={onToggleCollapse || (() => {})}
            active={false}
            icon={collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            label="收起侧边栏"
            fullWidth
            collapsed={collapsed}
            title={collapsed ? "展开" : "收起"}
          />
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
          icon={item.icon}
          label={item.label}
          active={activeView === item.view}
          onClick={() => onViewChange(item.view)}
        />
      ))}
    </nav>
  );
};

export default Navigation;
