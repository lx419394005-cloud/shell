/**
 * DrawPanel - AI Image Generation Panel
 *
 * @description AI image generation panel with prompt input and settings
 * @example <DrawPanel />
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Settings2, ImageIcon, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common';
import { generateImage, createImageAbortController, ASPECT_RATIOS, type AspectRatioKey } from '@/services/imageApi';

/** DrawPanel props interface */
export interface DrawPanelProps {
  /** CSS class name */
  className?: string;
  /** Callback when new images are generated */
  onImageGenerated?: (images: string[], prompt: string) => void;
}

/** Resolution presets */
const RESOLUTIONS = [
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
] as const;

/** DrawPanel component implementation */
export const DrawPanel: React.FC<DrawPanelProps> = ({ className, onImageGenerated }) => {
  // State
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, deformed');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [resolution, setResolution] = useState<'2K' | '4K'>('2K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = createImageAbortController();

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    abortController.abort();
    const newAbortController = createImageAbortController();

    try {
      const result = await generateImage(prompt, {
        aspectRatio,
        negativePrompt,
        size: resolution,
        maxImages: 4,
      });

      if (result.success && result.images.length > 0) {
        setGeneratedImages(result.images);
        onImageGenerated?.(result.images, result.prompt);
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear generated images
  const clearImages = () => {
    setGeneratedImages([]);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          AI Image Generation
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Describe your idea and let AI bring it to life
        </p>
      </div>

      {/* Image display area */}
      <div className="flex-1 overflow-y-auto p-4">
        {generatedImages.length > 0 ? (
          <div className="space-y-4">
            {/* Generated images grid */}
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((url, index) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative rounded-xl overflow-hidden shadow-md group"
                >
                  <img
                    src={url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Copy URL"
                    >
                      <ImageIcon className="w-4 h-4 text-white" />
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      title="Open full size"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Clear button */}
            <button
              onClick={clearImages}
              className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear all images
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-48 text-[var(--color-text-secondary)]">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No images yet, start creating!</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--color-border)] overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Aspect ratio selection */}
              <div>
                <label className="text-sm font-medium text-[var(--color-text)] mb-2 block">
                  Aspect Ratio
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                    <button
                      key={key}
                      onClick={() => setAspectRatio(key as AspectRatioKey)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        aspectRatio === key
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                      )}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution selection */}
              <div>
                <label className="text-sm font-medium text-[var(--color-text)] mb-2 block">
                  Resolution
                </label>
                <div className="flex gap-2">
                  {RESOLUTIONS.map((res) => (
                    <button
                      key={res.value}
                      onClick={() => setResolution(res.value)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        resolution === res.value
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                      )}
                    >
                      {res.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Negative prompt input */}
              <div>
                <label className="text-sm font-medium text-[var(--color-text)] mb-2 block">
                  Negative Prompt
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid in the image..."
                  className={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-[var(--color-surface)]',
                    'text-[var(--color-text)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    'border border-[var(--color-border)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
                    'text-sm'
                  )}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        {/* Prompt input */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-[var(--color-surface)]',
            'text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-muted)]',
            'border border-[var(--color-border)]',
            'resize-none',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
            'min-h-[80px]'
          )}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              showSettings
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            )}
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Progress indicator */}
        {isGenerating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>AI is creating your image...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawPanel;
