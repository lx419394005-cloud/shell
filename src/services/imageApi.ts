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

/** Direct API base URL for local fetch (uses Vite proxy in dev) */
const DIRECT_API_URL = '/api/v1/images/generations';
/** Auth token for direct API */
const AUTH_TOKEN = import.meta.env.VITE_API_TOKEN || 'QC-3832b621c6e6ef01e7e65bd6811a875e-ce9870a4261b87deeec35f4bad62f57f';
/** Whether to use cloud proxy */
export const getUseCloudProxy = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('use_cloud_proxy');
    if (saved !== null) return saved === 'true';
  }
  return import.meta.env.VITE_USE_CLOUD_PROXY === 'true';
};

export const setUseCloudProxy = (value: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('use_cloud_proxy', value.toString());
  }
};

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
  options: ImageGenerationOptions & { signal?: AbortSignal } = {}
): Promise<ImageGenerationResult> {
  const {
    aspectRatio = '1:1',
    negativePrompt = '',
    size = '2K',
    scale = 1,
    maxImages = 4,
    signal,
  } = options;

  // Build aspect ratio and resolution string for prompt
  const ratio = ASPECT_RATIOS[aspectRatio as AspectRatioKey] || ASPECT_RATIOS["1:1"];
  const promptWithSettings = `${prompt} (aspect ratio: ${ratio.ratio}, resolution: ${size})`;

  // Build request body per API spec
  const body = {
    model: DEFAULT_MODEL,
    input: {
      prompt: promptWithSettings,
      negative_prompt: negativePrompt,
    },
    extra_body: {
      enable_image_base64: true,
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

  const useCloudProxy = getUseCloudProxy();
  const targetUrl = useCloudProxy ? IMAGE_API_URL : DIRECT_API_URL;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!useCloudProxy) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  console.log('Image API Request:', {
    mode: useCloudProxy ? 'Cloud Proxy' : 'Local Direct',
    url: targetUrl,
    headers: {
      ...headers,
      Authorization: headers.Authorization ? headers.Authorization.substring(0, 15) + '...' : undefined
    },
    body
  });

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal, // 传递 AbortSignal
    });

    console.log('Image API Response Status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      mode: useCloudProxy ? 'Cloud Proxy' : 'Local Direct'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Details:', errorData);
      
      // 处理特定的错误结构
      const errorMessage = errorData.error?.message || 
                          errorData.message || 
                          `请求失败 (${response.status}): ${response.statusText}`;
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Image API Raw Response Data:', JSON.stringify(data, null, 2));

    // Parse response: { data: [{ url: string, b64_json?: string, base64?: string }] }
    const imageUrls = data.data?.map((item: any) => {
      if (item.url) return item.url;
      return null;
    }).filter(Boolean) || [];
    
    console.log('Extracted Image URLs:', imageUrls);

    const base64Images = data.data?.map((item: any, index: number) => {
      // 兼容多种可能的 base64 字段名
      const b64Data = item.b64_json || item.base64 || item.image_base64;
      
      console.log(`Item ${index} base64 detection:`, {
        has_b64_json: !!item.b64_json,
        has_base64: !!item.base64,
        has_image_base64: !!item.image_base64,
        data_length: b64Data ? b64Data.length : 0
      });

      if (b64Data) {
        // 确保 base64 带有正确的 Data URL 前缀
        if (!b64Data.startsWith('data:')) {
          return `data:image/png;base64,${b64Data}`;
        }
        return b64Data;
      }
      return null;
    }).filter(Boolean) || [];

    console.log('Successfully extracted Base64 images count:', base64Images.length);

    return {
      success: true,
      images: imageUrls,
      base64Images: base64Images.length > 0 ? base64Images : undefined,
      prompt: prompt, // 返回原始 prompt，不包含尺寸注入
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
