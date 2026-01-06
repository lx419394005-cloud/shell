/**
 * Image Generation API Service
 *
 * @description API service for Doubao-Seedream-4.5 image generation
 * @docs API_GUIDE.md for detailed specifications
 */

import type { ImageGenerationOptions, ImageGenerationResult } from '@/types/api';
import { getActiveApiConfig, formatApiUrl } from '@/utils/apiConfig';

/** API base URL - Cloud function proxy to bypass CORS */
const LAF_APP_BASE_URL = import.meta.env.VITE_LAF_APP_URL || 'https://ax0rcpp85w.sealosbja.site';
/** Full image generation API endpoint */
const IMAGE_API_URL = `${LAF_APP_BASE_URL}/generate-image`;

/** Resolution presets - 始终使用云函数代理绕过 CORS */

/** Default model */
export const DEFAULT_MODEL = 'Doubao-Seedream-4.5';

/** Aspect ratio presets */
export const ASPECT_RATIOS = {
  '1:1': { label: '1:1 Square', ratio: '1:1', width: 1024, height: 1024 },
  '4:3': { label: '4:3 Standard', ratio: '4:3', width: 1024, height: 768 },
  '3:4': { label: '3:4 Portrait', ratio: '3:4', width: 768, height: 1024 },
  '16:9': { label: '16:9 Landscape', ratio: '16:9', width: 1280, height: 720 },
  '9:16': { label: '9:16 Story', ratio: '9:16', width: 720, height: 1280 },
} as const;

export type AspectRatioKey = keyof typeof ASPECT_RATIOS;

export interface StreamGenerationOptions extends ImageGenerationOptions {
  onProgress?: (index: number, total: number, result: { url?: string; b64?: string; error?: string }) => void;
  signal?: AbortSignal;
}

/**
 * Generate images with streaming progress
 */
export async function generateImageStream(
  prompt: string,
  options: StreamGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    aspectRatio = '1:1',
    negativePrompt = '',
    size = '2K',
    scale = 1,
    maxImages = 1,
    image,
    onProgress,
    signal,
  } = options;

  const ratio = ASPECT_RATIOS[aspectRatio as AspectRatioKey] || ASPECT_RATIOS["1:1"];
  const promptWithSettings = `${prompt.trim()} (aspect ratio: ${ratio.ratio})`;
  
  const buildRequestBody = () => ({
    model: DEFAULT_MODEL,
    input: {
      prompt: promptWithSettings,
      negative_prompt: negativePrompt?.trim() || '',
      image,
    },
    extra_body: {
      size,
      scale,
      watermark: false,
      sequential_image_generation: "auto",
      sequential_image_generation_options: {
        max_images: maxImages
      },
      provider: {
        only: [],
        order: [],
        sort: null,
        output_price_range: [],
        latency_range: [],
        enable_image_base64: true,
      },
      base64: true,
    },
  });

  // 始终使用云函数代理绕过 CORS
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const allImages: string[] = [];
  const allBase64: string[] = [];
  let hasError = false;
  let lastErrorMessage = '';

  // 串行请求以实现“生成一张显示一张”的效果
  for (let i = 0; i < maxImages; i++) {
    if (signal?.aborted) break;

    // 如果不是第一张，增加时间间隔避免请求过快
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 间隔 1 秒
    }

    const body = buildRequestBody();
    console.log('Image Stream Request:', {
      url: IMAGE_API_URL,
      method: 'POST',
      headers,
      body
    });

    try {
      const response = await fetch(IMAGE_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body), // 每次请求 1 张
        signal,
      });

      // Log raw response status and headers
      console.log('Image Stream Response Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        try {
          const errorData = await response.json();
          console.log('Image Stream Error Response Body:', errorData);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          if (response.status === 404) {
            errorMessage = "接口返回 404，可能包含敏感内容或接口暂时不可用";
          }
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Image Stream Response Body:', data);
      const item = data.data?.[0];
      
      if (item) {
        const url = item.url;
        const b64Data = item.b64_json || item.base64 || item.image_base64;
        const b64 = b64Data ? (b64Data.startsWith('data:') ? b64Data : `data:image/png;base64,${b64Data}`) : undefined;
        
        if (url) allImages.push(url);
        if (b64) allBase64.push(b64);
        
        onProgress?.(i + 1, maxImages, { url, b64 });
      }
    } catch (error) {
      hasError = true;
      lastErrorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.(i + 1, maxImages, { error: lastErrorMessage });
    }
  }

  return {
    success: !hasError || allImages.length > 0,
    images: allImages,
    base64Images: allBase64,
    prompt,
    error: hasError ? lastErrorMessage : undefined
  };
}

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
 *   maxImages: 1
 * });
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions & { signal?: AbortSignal } = {}
): Promise<ImageGenerationResult> {
  const {
    aspectRatio = '1:1',
    negativePrompt = '',
    size = '2K',
    scale = 1,
    maxImages = 1,
    image,
    signal,
  } = options;

  // Build aspect ratio string for prompt (resolution removed as requested)
  const ratio = ASPECT_RATIOS[aspectRatio as AspectRatioKey] || ASPECT_RATIOS["1:1"];
  const promptWithSettings = `${prompt.trim()} (aspect ratio: ${ratio.ratio})`;

  // Build request body per API spec
  const buildRequestBody = () => ({
    model: DEFAULT_MODEL,
    input: {
      prompt: promptWithSettings,
      negative_prompt: negativePrompt?.trim() || '',
      image,
    },
    extra_body: {
      size,
      scale,
      watermark: false,
      sequential_image_generation: "auto",
      sequential_image_generation_options: {
        max_images: maxImages
      },
      provider: {
        only: [],
        order: [],
        sort: null,
        output_price_range: [],
        latency_range: [],
        enable_image_base64: true,
      },
      base64: true,
    },
  });

  // 始终使用云函数代理绕过 CORS
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    // 根据 maxImages 决定是单次请求还是多次并发
    // 如果 API 本身支持一次生成多张（通过 max_images），则直接发送一次请求
    // 某些模型可能一次只返回一张，如果需要强制批量，可以使用 Promise.all

    // 目前 API 规范中包含 max_images，我们先尝试单次请求
    // 如果单次请求只返回一张，后续可以改为并发逻辑
    const body = buildRequestBody();

    console.log('Image Generation Full Request:', {
      url: IMAGE_API_URL,
      method: 'POST',
      headers,
      body
    });

    const response = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    // Log raw response status and headers
    console.log('Image Generation Response Status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `请求失败 (${response.status})`;
      try {
        const errorData = await response.json();
        console.log('Image Generation Error Response Body:', errorData);
        console.error('API Error Details:', errorData);
        // 如果是词语拦截，通常会在 error.message 或 message 中体现
        errorMessage = errorData.error?.message || errorData.message || errorMessage;

        // 针对 404 的特殊处理提示
        if (response.status === 404) {
          errorMessage = "云端接口返回 404，可能包含敏感内容或接口暂时不可用";
        }
      } catch (e) {
        console.error('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Image Generation Response Body:', data);
    
    // 仅打印数据结构，不打印具体内容
    console.log('Image API Response Structure:', {
      hasData: !!data.data,
      count: data.data?.length,
      firstItemKeys: data.data?.[0] ? Object.keys(data.data[0]) : []
    });
    
    // 解析返回的所有图片（仅保留 Base64）
    const base64Images = data.data?.map((item: any) => {
      const b64Data = item.b64_json || item.base64 || item.image_base64;
      if (b64Data) {
        return b64Data.startsWith('data:') ? b64Data : `data:image/png;base64,${b64Data}`;
      }
      return null;
    }).filter(Boolean) || [];

    return {
      success: true,
      images: [], // 移除 URL
      base64Images: base64Images,
      prompt: prompt,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    return {
      success: false,
      images: [],
      prompt: prompt, // 返回原始 prompt
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
