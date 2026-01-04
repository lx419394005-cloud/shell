import React from 'react';
import { cn } from '@/utils/cn';

export interface RatioIconProps {
  ratio: string;
  active?: boolean;
  className?: string;
}

export const RatioIcon: React.FC<RatioIconProps> = ({ ratio, active, className }) => {
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
