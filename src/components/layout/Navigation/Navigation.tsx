/**
 * Navigation - Responsive navigation component
 *
 * @description Mobile bottom Tab, desktop left sidebar
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, Sparkles, Plus, ChevronLeft, ChevronRight, Palette, MessageSquare, Sun, Moon, Settings, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getActiveApiConfig } from '@/utils/apiConfig';

/** View type */
type ViewType = 'home' | 'create' | 'landing';
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
  onOpenSettings?: () => void;
  memoryUsage?: string;
  totalCount?: number;
}

/** Navigation item config */
interface NavItem {
  view: ViewType;
  icon: React.ReactNode;
  label: string;
}

/** Navigation items definition */
const NAV_ITEMS: NavItem[] = [
  { view: 'landing', icon: <Home className="w-5 h-5 shrink-0" />, label: '首页' },
  { view: 'home', icon: <LayoutGrid className="w-5 h-5 shrink-0" />, label: '图库' },
  { view: 'create', icon: <Plus className="w-5 h-5 shrink-0" />, label: '创作' },
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
  badge?: number;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  fullWidth = false, 
  collapsed = false,
  title,
  badge,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center transition-[color,background-color,transform,padding] duration-300 ease-in-out relative',
        'rounded-xl group active:scale-95',
        fullWidth ? 'w-full' : 'flex-none',
        fullWidth ? 'h-12' : 'h-10 px-4',
        fullWidth ? (collapsed ? 'justify-center px-0' : 'justify-start gap-3 px-4') : 'flex-col justify-center gap-1',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]',
        className
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
        <div className={cn(
          "flex items-center justify-between",
          fullWidth ? "flex-1" : "flex-none"
        )}>
          <span className={cn(
            'font-medium transition-all duration-300',
            fullWidth ? 'text-sm whitespace-nowrap overflow-hidden' : 'text-[10px] leading-none',
            active && 'font-semibold'
          )}>
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-[8px] flex items-center justify-center font-bold border-2 border-[var(--color-bg-card)]">
          {badge > 99 ? '99+' : badge}
        </div>
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
  onOpenSettings,
  memoryUsage,
  totalCount
}) => {
  const isDesktop = useIsDesktop();
  const [hasToken, setHasToken] = useState(true);

  // 检查是否有可用 Token
  useEffect(() => {
    const checkToken = async () => {
      // 检查数据库中是否有激活的配置
      const chatConfig = await getActiveApiConfig('chat');
      const imageConfig = await getActiveApiConfig('image');

      setHasToken(!!(chatConfig || imageConfig));
    };

    checkToken();

    // 每隔几秒检查一次，或者在弹窗关闭后检查
    const timer = setInterval(checkToken, 5000);
    return () => clearInterval(timer);
  }, []);

  if (isDesktop) {
    return (
      <nav
        className={cn(
          'fixed left-0 top-0 h-screen bg-[var(--color-bg-card)] border-r border-[var(--color-border)] z-50',
          'flex flex-col py-6 transition-[width] duration-300 ease-in-out will-change-[width]',
          collapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        <div className={cn(
          "flex flex-col h-full transition-[padding] duration-300 ease-in-out",
          collapsed ? "px-3" : "px-4"
        )}>
        {/* Logo / Brand */}
        <div className={cn(
          "flex items-center mb-8 px-2 transition-all duration-300",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => onViewChange('home')}
            >
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 transition-transform group-hover:scale-110">
                <Sparkles className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tighter text-[var(--color-text)]">PICS</span>
                <span className="text-[10px] font-bold text-[var(--color-primary)] tracking-[0.2em] ml-0.5">STUDIO</span>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <div 
              className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 cursor-pointer transition-transform hover:scale-110"
              onClick={() => onViewChange('home')}
            >
              <Sparkles className="w-6 h-6 text-white fill-current" />
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
            icon={<Palette className="w-5 h-5 shrink-0" />}
            label="AI 绘图"
            fullWidth
            collapsed={collapsed}
          />
          
          <NavButton
            onClick={onOpenChat || (() => {})}
            active={activeView === 'create' && createMode === 'chat'}
            icon={<MessageSquare className="w-5 h-5 shrink-0" />}
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
              badge={item.view === 'home' ? totalCount : undefined}
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
                  <div className={cn(
                    "p-1.5 rounded-lg border transition-colors shadow-sm",
                    isDarkMode 
                      ? "bg-orange-500/10 border-orange-500/20 text-orange-400" 
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-500"
                  )}>
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 fill-current stroke-[2.5px]" />
                    ) : (
                      <Moon className="w-4 h-4 fill-current stroke-[2.5px]" />
                    )}
                  </div>
                  {!collapsed && (
                    <span className={cn(
                      "text-xs font-semibold transition-colors",
                      isDarkMode ? "text-orange-500" : "text-indigo-600"
                    )}>
                      {isDarkMode ? '切换亮色' : '切换暗色'}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <div className={cn(
                    "w-8 h-4 rounded-full p-0.5 transition-colors shadow-inner border border-transparent shrink-0",
                    isDarkMode ? "bg-[var(--color-primary)]" : "bg-zinc-200 dark:bg-zinc-700"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-300",
                      isDarkMode ? "translate-x-4" : "translate-x-0"
                    )} />
                  </div>
                )}
              </button>

              <button
                onClick={onOpenSettings}
                className={cn(
                  "flex items-center gap-3 w-full transition-all group p-1.5 rounded-xl hover:bg-[var(--color-surface)]",
                  collapsed ? "justify-center" : "justify-start",
                  !hasToken && "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
                )}
                title={!hasToken ? "未配置 API Token，点击设置" : "API 设置"}
              >
                <div className={cn(
                  "p-1.5 rounded-lg border transition-colors shadow-sm",
                  !hasToken 
                    ? "bg-amber-100 border-amber-300 text-amber-600 animate-pulse" 
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] group-hover:border-[var(--color-primary)] text-[var(--color-text)]"
                )}>
                  {!hasToken ? <AlertCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                </div>
                {!collapsed && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className={cn(
                      "text-xs font-semibold",
                      !hasToken ? "text-amber-700 dark:text-amber-400" : "text-[var(--color-text)]"
                    )}>
                      {!hasToken ? '缺少 Token' : 'API 设置'}
                    </span>
                    {!hasToken && <span className="text-[10px] text-amber-600/70 dark:text-amber-400/50 truncate">点击立即配置</span>}
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
                            className="h-full bg-[image:var(--gradient-primary)] transition-all duration-500" 
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
            icon={collapsed ? <ChevronRight className="w-5 h-5 shrink-0" /> : <ChevronLeft className="w-5 h-5 shrink-0" />}
            label="收起侧边栏"
            fullWidth
            collapsed={collapsed}
            title={collapsed ? "展开" : "收起"}
          />
        </div>
        </div>
      </nav>
    );
  }

  // Mobile navigation
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)]/80 backdrop-blur-lg border-t border-[var(--color-border)] z-50',
        'pt-4 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]',
        className
      )}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto h-full">
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.view}
            icon={item.icon}
            label={item.label}
            active={activeView === item.view}
            onClick={() => onViewChange(item.view)}
            className="flex-1 h-14"
          />
        ))}
        <NavButton
          icon={<Settings className="w-5 h-5" />}
          label="设置"
          active={false}
          onClick={onOpenSettings || (() => {})}
          className="flex-1 h-14"
        />
      </div>
    </nav>
  );
};

export default Navigation;
