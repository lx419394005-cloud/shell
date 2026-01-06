/**
 * Chat API Service
 *
 * @description API service for AI chat with streaming support (SSE)
 * @docs API_GUIDE.md for detailed specifications
 */

import type { ChatMessage, ChatOptions, ChatStreamCallback } from '@/types/api';
import { getActiveApiConfig, formatApiUrl } from '@/utils/apiConfig';

/** API endpoint - Uses relative path for Vercel rewrite/Vite proxy */
const API_BASE_URL = '/api/v1';

/** Default model */
const DEFAULT_MODEL = 'DeepSeek-V3.2';

/** Authorization token - Removed default, user must configure their own API */
export const AUTH_TOKEN = '';

/** System prompt */
const SYSTEM_PROMPT = `You are a helpful and creative AI assistant. You excel at:
- Answering questions clearly and accurately
- Engaging in meaningful conversations
- Providing creative suggestions
- Explaining complex concepts simply

Keep responses concise but helpful.`;

/** Prompt optimization system prompt */
const OPTIMIZER_SYSTEM_PROMPT = `你是一个专业的 AI 绘画提示词专家。你的任务是将用户简单的想法或描述，改造成详细、生动、具有艺术感的 AI 绘画提示词。

规则：
1. 输出必须直接是优化后的提示词内容。
2. 保持提示词以英文为主，或者中英结合。
3. 加入具体的风格描述（如：油画、赛博朋克、写实、吉卜力风格等）。
4. 加入光影、构图、材质等细节。
5. 不要包含任何解释性文字，只输出优化后的提示词。
6. 不要包含 (aspect ratio: ...) 或分辨率信息，这些由系统后期注入。

用户输入："{prompt}"
请直接输出优化后的提示词：`;

/**
 * Optimize a drawing prompt using DeepSeek-V3.2
 *
 * @param prompt - The original simple prompt
 * @returns Promise with optimized prompt
 */
export async function optimizePrompt(prompt: string): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: OPTIMIZER_SYSTEM_PROMPT.replace("{prompt}", prompt),
    },
    {
      role: "user",
      content: "请优化这个提示词",
    },
  ];

  try {
    const optimized = await sendChatMessageSync(messages, {
      model: "DeepSeek-V3.2",
      temperature: 0.7,
    });
    return optimized.trim();
  } catch (error) {
    console.error("Prompt optimization failed:", error);
    return prompt; // Fallback to original prompt
  }
}

/**
 * Send a chat message and get streaming response
 *
 * @param messages - Array of conversation messages
 * @param onStream - Callback for each chunk of streamed response
 * @param options - Chat options
 * @returns Promise with full response text
 *
 * @example
 * const response = await sendChatMessage(
 *   [{ role: 'user', content: 'Tell me a joke' }],
 *   (chunk) => console.log(chunk),
 *   { model: 'gpt-4o' }
 * );
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  onStream: ChatStreamCallback,
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature,
    maxTokens,
    max_completion_tokens,
    top_p,
    top_k,
    presence_penalty,
    enable_thinking,
    enable_search,
    systemPrompt,
    provider,
    response_format,
  } = options;

  // Build messages array with system prompt and ensure valid roles
  const apiMessages = [
    { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
    ...messages.map(m => ({
      ...m,
      role: (m.role as string) === 'ai' ? 'assistant' : m.role
    })),
  ];

  const body: any = {
    model,
    messages: apiMessages,
    stream: true,
  };

  // Standard OpenAI parameters
  if (temperature !== undefined) body.temperature = temperature;
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (max_completion_tokens !== undefined) body.max_completion_tokens = max_completion_tokens;
  if (top_p !== undefined) body.top_p = top_p;
  if (top_k !== undefined) body.top_k = top_k;
  if (presence_penalty !== undefined) body.presence_penalty = presence_penalty;
  if (response_format !== undefined) body.response_format = response_format;

  // AI Ping specific: Only include extra_body if explicitly needed and with non-empty values
  if (enable_thinking !== undefined || enable_search !== undefined || (provider && Object.keys(provider).length > 0)) {
    body.extra_body = {};
    if (enable_thinking !== undefined) body.extra_body.enable_thinking = enable_thinking;
    if (enable_search !== undefined) body.extra_body.enable_search = enable_search;
    
    if (provider && Object.keys(provider).length > 0) {
      // Clean up provider object to remove undefined/empty fields that might trigger 422
      const cleanProvider: any = {};
      Object.entries(provider).forEach(([key, value]) => {
        if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
          cleanProvider[key] = value;
        }
      });
      if (Object.keys(cleanProvider).length > 0) {
        body.extra_body.provider = cleanProvider;
      }
    }
    
    // If extra_body is still empty after cleanup, remove it
    if (Object.keys(body.extra_body).length === 0) {
      delete body.extra_body;
    }
  }

  const activeConfig = await getActiveApiConfig('chat');
  if (!activeConfig) {
    throw new Error('请先在设置中配置 API');
  }

  const targetUrl = formatApiUrl(activeConfig.baseUrl, '/chat/completions');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${activeConfig.apiKey}`,
  };

  console.log('Chat API Request:', {
    url: targetUrl,
    headers: {
      ...headers,
      'Authorization': 'Bearer ' + activeConfig.apiKey.substring(0, 10) + '...'
    },
    body
  });

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('Chat API Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Chat API Error Response Body:', errorData);
      console.error('Error response:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    // Handle streaming response (SSE)
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and parse SSE format
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          // Skip [DONE] marker
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;
            const content = delta?.content;
            const reasoning_content = delta?.reasoning_content;

            if (reasoning_content) {
              // 包装 reasoning_content 到 <think> 标签中，如果还没有的话
              if (!fullResponse.includes('<think>')) {
                fullResponse = '<think>' + reasoning_content;
              } else {
                fullResponse += reasoning_content;
              }
              onStream(reasoning_content, fullResponse);
            } else if (content) {
              // 如果 reasoning 结束且还没有关闭标签，则关闭它
              if (fullResponse.includes('<think>') && !fullResponse.includes('</think>')) {
                fullResponse += '</think>\n\n';
              }
              fullResponse += content;
              onStream(content, fullResponse);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Chat request failed:', error);
    throw error;
  }
}

/**
 * Send a chat message (non-streaming)
 *
 * @param messages - Array of conversation messages
 * @param options - Chat options
 * @returns Promise with response
 */
export async function sendChatMessageSync(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature,
    maxTokens,
    max_completion_tokens,
    top_p,
    top_k,
    presence_penalty,
    enable_thinking,
    enable_search,
    provider,
    response_format,
  } = options;

  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      ...m,
      role: (m.role as string) === 'ai' ? 'assistant' : m.role
    })),
  ];

  const body: any = {
    model,
    messages: apiMessages,
    stream: false,
  };

  // Standard OpenAI parameters
  if (temperature !== undefined) body.temperature = temperature;
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (max_completion_tokens !== undefined) body.max_completion_tokens = max_completion_tokens;
  if (top_p !== undefined) body.top_p = top_p;
  if (top_k !== undefined) body.top_k = top_k;
  if (presence_penalty !== undefined) body.presence_penalty = presence_penalty;
  if (response_format !== undefined) body.response_format = response_format;

  // AI Ping specific: Only include extra_body if explicitly needed and with non-empty values
  if (enable_thinking !== undefined || enable_search !== undefined || (provider && Object.keys(provider).length > 0)) {
    body.extra_body = {};
    if (enable_thinking !== undefined) body.extra_body.enable_thinking = enable_thinking;
    if (enable_search !== undefined) body.extra_body.enable_search = enable_search;
    
    if (provider && Object.keys(provider).length > 0) {
      // Clean up provider object to remove undefined/empty fields that might trigger 422
      const cleanProvider: any = {};
      Object.entries(provider).forEach(([key, value]) => {
        if (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)) {
          cleanProvider[key] = value;
        }
      });
      if (Object.keys(cleanProvider).length > 0) {
        body.extra_body.provider = cleanProvider;
      }
    }
    
    // If extra_body is still empty after cleanup, remove it
    if (Object.keys(body.extra_body).length === 0) {
      delete body.extra_body;
    }
  }

  const activeConfig = await getActiveApiConfig('chat');
  if (!activeConfig) {
    throw new Error('请先在设置中配置 API');
  }

  const targetUrl = formatApiUrl(activeConfig.baseUrl, '/chat/completions');

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeConfig.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    console.log('Chat API Sync Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Chat API Sync Error Response Body:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Chat API Sync Response Body:', data);
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Chat request failed:', error);
    throw error;
  }
}

/**
 * Abort controller for chat request
 */
export function createChatAbortController(): AbortController {
  return new AbortController();
}

export default {
  sendChatMessage,
  sendChatMessageSync,
  createChatAbortController,
};
