/**
 * PicUI API Service
 * 
 * @description Service for uploading images to picui.cn
 * @docs https://picui.cn/page/api-docs.html
 */

const PICUI_API_BASE = 'https://picui.cn/api/v1';
const PICUI_TOKEN = import.meta.env.VITE_PICUI_TOKEN;

export interface PicUIUploadResponse {
  status: boolean;
  message: string;
  data: {
    key: string;
    name: string;
    pathname: string;
    origin_name: string;
    size: number;
    mimetype: string;
    extension: string;
    md5: string;
    sha1: string;
    links: {
      url: string;
      html: string;
      bbcode: string;
      markdown: string;
      thumbnail_url: string;
      delete_link: string;
    };
  };
}

/**
 * Upload an image to PicUI
 * @param file File object to upload
 * @returns Promise with upload result
 */
export async function uploadToPicUI(file: File): Promise<PicUIUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  // If token is provided, use it for authorized upload
  // Otherwise, it will be treated as guest upload if allowed by the server
  if (PICUI_TOKEN) {
    headers['Authorization'] = `Bearer ${PICUI_TOKEN}`;
  }

  try {
    const response = await fetch(`${PICUI_API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || `Upload failed with status ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('PicUI Upload Error:', error);
    throw error instanceof Error ? error : new Error('Unknown upload error');
  }
}
