/**
 * API Type Definitions
 *
 * @description Type definitions for API services
 */

/** Message role types */
export type MessageRole = 'system' | 'user' | 'assistant';

/** Chat message interface */
export interface ChatMessage {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

/** Chat API options */
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  max_completion_tokens?: number;
  top_p?: number;
  top_k?: number;
  presence_penalty?: number;
  enable_thinking?: boolean;
  provider?: ChatProvider;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

/** Chat provider options */
export interface ChatProvider {
  only?: string[];
  order?: string[];
  sort?: ('input_price' | 'output_price' | 'throughput' | 'latency' | 'input_length')[];
  input_price_range?: number[];
  output_price_range?: number[];
  throughput_range?: number[];
  latency_range?: number[];
  input_length_range?: number[];
  allow_fallbacks?: boolean;
  ignore?: string[];
  allow_filter_prompt_length?: boolean;
}

/** Chat streaming callback */
export type ChatStreamCallback = (chunk: string, fullResponse: string) => void;

/** Image generation options */
export interface ImageGenerationOptions {
  aspectRatio?: string;
  negativePrompt?: string;
  size?: '2K' | '4K';
  scale?: number;
  maxImages?: number;
}

/** Image generation result */
export interface ImageGenerationResult {
  success: boolean;
  images: string[];
  base64Images?: string[];
  prompt: string;
  error?: string;
}

/** API error interface */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
