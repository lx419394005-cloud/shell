import { getAllApiConfigsFromDB, getSettingFromDB, saveSettingToDB } from './db';
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

/**
 * 设置云端代理状态
 */
export async function setUseCloudProxy(use: boolean): Promise<void> {
  await saveSettingToDB('use_cloud_proxy', use);
}

/**
 * 获取云端代理状态
 */
export async function getUseCloudProxy(): Promise<boolean> {
  const saved = await getSettingFromDB<boolean>('use_cloud_proxy');
  if (saved !== null) return saved;
  return import.meta.env.VITE_USE_CLOUD_PROXY === 'true';
}

/**
 * 设置主题状态
 */
export async function setThemeSetting(isDark: boolean): Promise<void> {
  await saveSettingToDB('theme', isDark ? 'dark' : 'light');
}

/**
 * 获取主题状态
 */
export async function getThemeSetting(): Promise<'dark' | 'light' | null> {
  return getSettingFromDB<'dark' | 'light'>('theme');
}

/**
 * 设置侧边栏折叠状态
 */
export async function setSidebarCollapsedSetting(collapsed: boolean): Promise<void> {
  await saveSettingToDB('sidebar_collapsed', collapsed);
}

/**
 * 获取侧边栏折叠状态
 */
export async function getSidebarCollapsedSetting(): Promise<boolean> {
  const saved = await getSettingFromDB<boolean>('sidebar_collapsed');
  return saved || false;
}

/**
 * 设置选中的聊天模型
 */
export async function setSelectedChatModelSetting(model: string): Promise<void> {
  await saveSettingToDB('selected_chat_model', model);
}

/**
 * 获取选中的聊天模型
 */
export async function getSelectedChatModelSetting(): Promise<string | null> {
  return getSettingFromDB<string>('selected_chat_model');
}

/**
 * 获取当前聊天会话 ID
 */
export async function getCurrentChatSessionId(): Promise<string | null> {
  return getSettingFromDB<string>('current_chat_session_id');
}

/**
 * 设置当前聊天会话 ID
 */
export async function setCurrentChatSessionId(id: string | null): Promise<void> {
  await saveSettingToDB('current_chat_session_id', id);
}

/**
 * 获取当前激活的视图 (home | create | landing)
 */
export async function getActiveViewSetting(): Promise<'home' | 'create' | 'landing'> {
  const saved = await getSettingFromDB<'home' | 'create' | 'landing'>('active_view');
  return saved || 'landing';
}

/**
 * 设置当前激活的视图
 */
export async function setActiveViewSetting(view: 'home' | 'create' | 'landing'): Promise<void> {
  await saveSettingToDB('active_view', view);
}

/**
 * 获取当前的创作模式 (draw | chat)
 */
export async function getCreateModeSetting(): Promise<'draw' | 'chat' | null> {
  return getSettingFromDB<'draw' | 'chat'>('create_mode');
}

/**
 * 设置当前的创作模式
 */
export async function setCreateModeSetting(mode: 'draw' | 'chat'): Promise<void> {
  await saveSettingToDB('create_mode', mode);
}
