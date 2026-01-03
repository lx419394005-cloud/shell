/**
 * Image Generation API Service
 *
 * @description API service for Doubao-Seedream-4.5 image generation
 * @docs API_GUIDE.md for detailed specifications
 */

import type { ImageGenerationOptions, ImageGenerationResult } from '@/types/api';

/** API base URL - Cloud function proxy to bypass CORS */
const LAF_APP_BASE_URL = import.meta.env.VITE_LAF_APP_URL || 'https://ax0rcpp85w.sealosbja.site';
/** Full image generation API endpoint */
const IMAGE_API_URL = `${LAF_APP_BASE_URL}/generate-image`;

/** Default model */
const DEFAULT_MODEL = 'Doubao-Seedream-4.5';

/** Aspect ratio presets */
export const ASPECT_RATIOS = {
  '1:1': { label: '1:1 Square', ratio: '1:1', width: 1024, height: 1024 },
  '4:3': { label: '4:3 Standard', ratio: '4:3', width: 1024, height: 768 },
  '3:4': { label: '3:4 Portrait', ratio: '3:4', width: 768, height: 1024 },
  '16:9': { label: '16:9 Landscape', ratio: '16:9', width: 1280, height: 720 },
  '9:16': { label: '9:16 Story', ratio: '9:16', width: 720, height: 1280 },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

/**
 * Generate images using Doubao-Seedream-4.5 model
 *
 * @param prompt - Positive prompt (aspect ratio will be appended)
 * @param options - Generation options
 * @returns Promise with generated image URLs
 *
 * @example
 * const images = await generateImage('A beautiful sunset over ocean', {
 *   aspectRatio: '16:9',
 *   negativePrompt: 'blurry, low quality',
 *   size: '2K',
 *   maxImages: 4
 * });
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    aspectRatio = '1:1',
    negativePrompt = '',
    size = '2K',
    scale = 1,
    maxImages = 4,
  } = options;

  // Build aspect ratio string for prompt
  const ratio = ASPECT_RATIOS[aspectRatio as AspectRatioKey] || ASPECT_RATIOS['1:1'];
  const promptWithRatio = `${prompt} (aspect ratio: ${ratio.ratio})`;

  // Build request body per API spec
  const body = {
    model: DEFAULT_MODEL,
    input: {
      prompt: promptWithRatio,
      negative_prompt: negativePrompt,
    },
    extra_body: {
      size,
      scale,
      watermark: false,
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: maxImages,
      },
      provider: {
        only: [],
        order: [],
        sort: null,
        output_price_range: [],
        latency_range: [],
      },
    },
  };

  try {
    const response = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse response: { data: [{ url: string }] }
    const imageUrls = data.data?.map((item: { url: string }) => item.url) || [];

    return {
      success: true,
      images: imageUrls,
      prompt: promptWithRatio,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      success: false,
      images: [],
      prompt: promptWithRatio,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Abort controller for image generation
 */
export function createImageAbortController(): AbortController {
  return new AbortController();
}

export default {
  generateImage,
  createImageAbortController,
  ASPECT_RATIOS,
};
