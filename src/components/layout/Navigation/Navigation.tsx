/**
 * Navigation - Responsive navigation component
 *
 * @description Mobile bottom Tab, desktop left sidebar
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

/** View type */
type ViewType = 'home' | 'create';

/** Navigation props interface */
export interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

/** Navigation item config */
interface NavItem {
  view: ViewType;
  icon: React.ReactNode;
  label: string;
}

/** Navigation items definition */
const NAV_ITEMS: NavItem[] = [
  { view: 'home', icon: <Home className="w-5 h-5" />, label: 'Discover' },
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
}

const NavButton: React.FC<NavButtonProps> = ({ item, active, onClick, fullWidth = false }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center transition-colors duration-200 relative',
        'rounded-xl',
        fullWidth ? 'w-full' : 'flex-1',
        fullWidth ? 'h-12' : 'h-full py-2',
        fullWidth ? 'gap-3 px-4' : 'gap-1',
        active
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
      )}
    >
      {item.icon}
      <span className={cn('font-medium text-sm', active && 'font-semibold', !fullWidth && 'text-[10px]')}>
        {fullWidth ? item.label : ''}
      </span>
      {/* Desktop active indicator */}
      {fullWidth && active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--color-primary)] rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {/* Mobile active indicator */}
      {!fullWidth && active && (
        <motion.div
          layoutId="activeNavMobile"
          className="absolute bottom-0 w-8 h-5 bg-[var(--color-primary)] rounded-t-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </button>
  );
};

/**
 * Navigation component implementation
 */
export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange, className }) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <aside className={cn('fixed left-0 top-0 bottom-0 z-40', 'w-64 flex flex-col', 'bg-[var(--color-bg-card)] border-r border-[var(--color-border)]', 'p-4', className)}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-3 mb-6">
          <div className={cn('w-10 h-10 rounded-full', 'bg-[var(--gradient-primary)]', 'flex items-center justify-center', 'text-white shadow-[var(--shadow-primary)]')}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-[var(--color-text)]">Pics AI</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavButton key={item.view} item={item} active={activeView === item.view} onClick={() => onViewChange(item.view)} fullWidth />
          ))}
        </nav>

        {/* Bottom area */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <div className="px-4 py-2 text-xs text-[var(--color-text-muted)]">Creative AI Generator</div>
        </div>
      </aside>
    );
  }

  // Mobile: Bottom Tab
  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 z-40', 'h-16 pb-safe', 'bg-[var(--color-bg-card)] border-t border-[var(--color-border)]', 'flex items-end justify-around px-2', className)}>
      {NAV_ITEMS.map((item) => (
        <NavButton key={item.view} item={item} active={activeView === item.view} onClick={() => onViewChange(item.view)} />
      ))}
    </nav>
  );
};

export default Navigation;
