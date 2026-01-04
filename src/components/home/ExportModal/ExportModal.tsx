import React, { useState, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Download, Move, Layout, Smartphone, Square, ZoomIn, Palette, Type, AlignLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { stripPromptCount } from '@/utils/prompt';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
}

type AspectRatio = '9:16' | '3:4' | '1:1';
type TemplateId = 'classic' | 'magazine' | 'minimal' | 'dark';

interface TemplateConfig {
  id: TemplateId;
  name: string;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateConfig[] = [
  { id: 'classic', name: '经典', icon: <Layout className="w-4 h-4" /> },
  { id: 'magazine', name: '杂志', icon: <Type className="w-4 h-4" /> },
  { id: 'minimal', name: '极简', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'dark', name: '深邃', icon: <Palette className="w-4 h-4" /> },
];

const RATIO_CONFIG: Record<AspectRatio, string> = {
  '9:16': 'aspect-[9/16]',
  '3:4': 'aspect-[3/4]',
  '1:1': 'aspect-square',
};

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
}) => {
  const [ratio, setRatio] = useState<AspectRatio>('9:16');
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(1.1);
  const [fontSizeScale, setFontSizeScale] = useState(1.0);
  const previewRef = useRef<HTMLDivElement>(null);

  // 使用 MotionValue 来实现非受控的实时拖拽，性能更好且不会冲突
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 切换比例时重置位置和缩放
  const handleRatioChange = (newRatio: AspectRatio) => {
    setRatio(newRatio);
    handleReset();
  };

  const handleReset = () => {
    x.set(0);
    y.set(0);
    setScale(1.1);
    setFontSizeScale(1.0);
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    try {
      // 预热一下，确保所有图片和样式都加载完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 4, 
        backgroundColor: '#000000',
        imagePlaceholder: imageUrl, // 强制占位确保高质量源图
        style: {
          borderRadius: '32px',
        }
      });
      
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Generated image is empty');
      }
      
      const link = document.createElement('a');
      link.download = `pics-ai-export-${template}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTemplate = () => {
    const cleanPrompt = stripPromptCount(prompt);
    const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // 根据 Prompt 长度动态计算字号，并叠加手动缩放系数
    const getFontSize = (baseSize: number, text: string) => {
      let size = baseSize;
      if (text.length > 200) size = baseSize * 0.5;
      else if (text.length > 100) size = baseSize * 0.7;
      else if (text.length > 50) size = baseSize * 0.85;
      
      return `${size * fontSizeScale}px`;
    };

    switch (template) {
      case 'magazine':
        return (
          <>
            <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 p-8 pt-12 text-white z-20 pointer-events-none">
              <div className="border-l-4 border-white pl-4">
                <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-70 mb-1">Issue #01</h4>
                <h3 className="text-4xl font-serif italic font-light tracking-tighter leading-none">Aesthetic</h3>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-8 pb-12 text-white z-20 pointer-events-none">
              <p 
                className="font-serif leading-relaxed line-clamp-[6] mb-6 drop-shadow-md transition-all duration-300"
                style={{ fontSize: getFontSize(24, cleanPrompt) }}
              >
                "{cleanPrompt}"
              </p>
              <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase font-medium opacity-60">
                <span>Pics AI Studio</span>
                <div className="w-1 h-1 rounded-full bg-white" />
                <span>{dateStr}</span>
              </div>
            </div>
          </>
        );
      case 'minimal':
        return (
          <>
            <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none backdrop-blur-[2px]" />
            <div className="absolute inset-0 flex items-center justify-center p-10 text-white z-20 pointer-events-none">
              <div className="text-center space-y-6">
                <div className="w-12 h-px bg-white/50 mx-auto" />
                <p 
                  className="font-light tracking-[0.1em] leading-loose italic opacity-90 transition-all duration-300"
                  style={{ fontSize: getFontSize(20, cleanPrompt) }}
                >
                  {cleanPrompt}
                </p>
                <div className="w-12 h-px bg-white/50 mx-auto" />
                <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 pt-2">Created with Pics</div>
              </div>
            </div>
          </>
        );
      case 'dark':
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 flex flex-col justify-between p-10 text-white z-20 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-tighter">New Era</div>
                <div className="text-[10px] font-mono opacity-40">{dateStr}</div>
              </div>
              <div className="space-y-4">
                <div className="h-1 w-20 bg-orange-500" />
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none break-words">
                  {cleanPrompt.split(' ').slice(0, 3).join(' ')}
                </h3>
                <p 
                  className="opacity-60 leading-relaxed max-w-[90%] transition-all duration-300"
                  style={{ fontSize: getFontSize(14, cleanPrompt) }}
                >
                  {cleanPrompt}
                </p>
              </div>
            </div>
          </>
        );
      case 'classic':
      default:
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none z-10" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 text-white pointer-events-none z-10">
              <div className="relative z-10 space-y-4 max-w-[95%] pointer-events-none">
                <div className="flex items-center gap-3 mb-2 opacity-80">
                  <div className="w-8 h-px bg-white/50" />
                  <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium">Original Prompt</span>
                </div>
                <h3 
                  className="font-serif leading-tight tracking-wide drop-shadow-lg transition-all duration-300"
                  style={{ fontSize: getFontSize(28, cleanPrompt) }}
                >
                  {cleanPrompt}
                </h3>
                <div className="pt-4 flex items-center justify-between border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold">P</div>
                    <span className="text-xs sm:text-sm font-medium tracking-tight opacity-90">Generated by Pics AI</span>
                  </div>
                  <div className="text-[10px] sm:text-xs font-mono opacity-60">
                    {dateStr}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导出卡片"
      size="5xl"
    >
      <div className="flex flex-col lg:flex-row gap-6 p-2 lg:p-4 overflow-hidden h-full max-h-[calc(90vh-120px)]">
        {/* 左侧预览区 */}
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 rounded-[32px] p-4 lg:p-6 overflow-hidden group min-h-0">
          <div 
            ref={previewRef}
            className={cn(
              "relative w-full max-w-[280px] sm:max-w-[320px] bg-black rounded-[32px] overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] transition-all duration-500",
              RATIO_CONFIG[ratio]
            )}
            style={{ 
              // 确保 html-to-image 能够捕捉到所有的 motion 样式
              transform: 'translateZ(0)'
            }}
          >
            {/* 背景图片 (支持拖拽剪裁) */}
            <div 
              className="absolute inset-0 cursor-move overflow-hidden z-0"
              onWheel={(e) => {
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
              }}
            >
              <motion.img 
                src={imageUrl} 
                alt="Export preview" 
                drag
                dragMomentum={false}
                dragElastic={0}
                className="absolute w-full h-full object-contain opacity-90 select-none pointer-events-auto"
                style={{ 
                  x,
                  y,
                  scale,
                  left: '50%',
                  top: '50%',
                  translateX: '-50%',
                  translateY: '-50%'
                }}
              />
            </div>
            
            {/* 动态模板内容 */}
            {renderTemplate()}
          </div>
          
          <p className="mt-4 text-[10px] font-medium text-[var(--color-text-secondary)] opacity-50">
            滚动滚轮缩放，拖拽调整构图
          </p>
        </div>

        {/* 右侧设置区 */}
        <div className="w-full lg:w-[320px] flex flex-col gap-5 overflow-y-auto lg:overflow-visible pr-2 lg:pr-0">
          <div className="space-y-6">
            {/* 模板选择 */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                <Palette className="w-3 h-3 text-[var(--color-primary)]" />
                排版风格
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group",
                    template === t.id 
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm shadow-[var(--color-primary)]/10" 
                      : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-white dark:bg-zinc-800/50"
                  )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                      template === t.id ? "bg-[var(--color-primary)] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-[var(--color-text-secondary)]"
                    )}>
                      {t.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 比例选择 */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                <Layout className="w-3 h-3 text-[var(--color-primary)]" />
                比例尺寸
              </h3>
              <div className="flex gap-2">
                {[
                  { id: '9:16', label: '9:16', icon: <Smartphone className="w-3 h-3" /> },
                  { id: '3:4', label: '3:4', icon: <Square className="w-3 h-3 text-[0.8em]" /> },
                  { id: '1:1', label: '1:1', icon: <Square className="w-3 h-3" /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleRatioChange(opt.id as AspectRatio)}
                    className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all",
                    ratio === opt.id 
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm shadow-[var(--color-primary)]/10" 
                      : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] bg-white dark:bg-zinc-800/50"
                  )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      ratio === opt.id ? "bg-[var(--color-primary)] text-white" : "bg-zinc-100 dark:bg-zinc-800"
                    )}>
                      {opt.icon}
                    </div>
                    <span className="text-[9px] font-black tracking-widest uppercase">{opt.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 调节工具 */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-[var(--color-text)] flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                <ZoomIn className="w-3 h-3 text-[var(--color-primary)]" />
                画面细节
              </h3>
            <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-2xl border-2 border-[var(--color-border)] space-y-4">
              {/* 图片缩放 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-[var(--color-text)] uppercase tracking-widest opacity-60">Image Scale / {scale.toFixed(1)}x</span>
                  <button 
                    onClick={() => setScale(1.1)}
                    className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="4" 
                  step="0.1" 
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
              </div>

              {/* 字号缩放 */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]/50">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-[var(--color-text)] uppercase tracking-widest opacity-60">Text Size / {fontSizeScale.toFixed(1)}x</span>
                  <button 
                    onClick={() => setFontSizeScale(1.0)}
                    className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.5" 
                  step="0.1" 
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[var(--color-primary)]"
                />
              </div>
            </div>
            </section>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <Button
              onClick={handleExport}
              loading={isExporting}
              className="w-full h-16 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Card
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
