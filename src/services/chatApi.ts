/**
 * Chat API Service
 *
 * @description API service for AI chat with streaming support (SSE)
 * @docs API_GUIDE.md for detailed specifications
 */

import type { ChatMessage, ChatOptions, ChatStreamCallback } from '@/types/api';

/** API endpoint - Use proxy in dev to avoid CORS */
const API_BASE_URL = import.meta.env.DEV
  ? '/api-proxy'
  : (import.meta.env.VITE_LOCAL_API_URL || 'https://www.aiping.cn/api/v1');

/** Default model */
const DEFAULT_MODEL = 'DeepSeek-V3.2';

/** Authorization token */
const AUTH_TOKEN = import.meta.env.VITE_API_TOKEN || 'QC-3832b621c6e6ef01e7e65bd6811a875e-ce9870a4261b87deeec35f4bad62f57f';

/** System prompt */
const SYSTEM_PROMPT = `You are a helpful and creative AI assistant. You excel at:
- Answering questions clearly and accurately
- Engaging in meaningful conversations
- Providing creative suggestions
- Explaining complex concepts simply

Keep responses concise but helpful.`;

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
  const { model = DEFAULT_MODEL, temperature = 0.7 } = options;

  // Build messages array with system prompt
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  const body = {
    model,
    messages: apiMessages,
    stream: true,
    extra_body: {
      provider: {
        only: [],
        order: [],
        sort: null,
        input_price_range: [],
        output_price_range: [],
        input_length_range: [],
        throughput_range: [],
        latency_range: [],
      },
    },
  };

  // Debug log
  console.log('=== Chat API Request ===');
  console.log('URL:', `${API_BASE_URL}/chat/completions`);
  console.log('Headers:', { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AUTH_TOKEN.substring(0, 20)}...` });
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('========================');

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
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
  const { model = DEFAULT_MODEL, temperature = 0.7 } = options;

  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  const body = {
    model,
    messages: apiMessages,
    temperature,
    stream: false,
    extra_body: {
      provider: {
        only: [],
        order: [],
        sort: null,
        input_price_range: [],
        output_price_range: [],
        input_length_range: [],
        throughput_range: [],
        latency_range: [],
      },
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
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
