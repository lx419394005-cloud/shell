import { getAllApiConfigsFromDB } from './db';
import { type ApiConfig } from '@/types';

/**
 * 获取当前激活的 API 配置
 * @param type API 类型 ('image' | 'chat' | 'all')
 * @returns 激活的配置或 null
 */
export async function getActiveApiConfig(type: 'image' | 'chat'): Promise<ApiConfig | null> {
  try {
    const configs = await getAllApiConfigsFromDB();
    // 优先找匹配特定类型的激活配置，如果没有则找类型为 'all' 的激活配置
    const activeConfig = configs.find(c => 
      c.isActive && (c.type === type || c.type === 'all')
    );
    return activeConfig || null;
  } catch (error) {
    console.error('Failed to get active API config:', error);
    return null;
  }
}

/**
 * 格式化 API URL
 * 确保 URL 以 /v1 结尾或根据需要添加后缀
 */
export function formatApiUrl(baseUrl: string, endpoint: string): string {
  let url = baseUrl.trim();
  // 移除末尾的斜杠
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // 如果 endpoint 已经包含在 url 中，则直接返回 url
  if (url.endsWith(endpoint)) {
    return url;
  }
  
  // 否则拼接 endpoint
  // 注意：这里假设用户输入的是基础 URL，如 https://api.openai.com/v1
  return `${url}${endpoint}`;
}
