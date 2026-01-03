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
  prompt: string;
  error?: string;
}

/** API error interface */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
