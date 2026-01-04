/**
 * Prompt Utilities
 */

/**
 * 注入图片数量到 Prompt
 */
export const injectPromptCount = (prompt: string, count: number): string => {
  const countMap: Record<number, string> = {
    1: '一张图片',
    2: '两张图片',
    4: '四张图片'
  };
  const countStr = `, ${countMap[count] || `${count}张图片`}`;
  if (prompt.endsWith(countStr)) return prompt;
  return `${prompt.trim()}${countStr}`;
};

/**
 * 从 Prompt 中移除注入的图片数量提示
 */
export const stripPromptCount = (prompt: string): string => {
  if (!prompt) return '';
  // 匹配 ", N张图片" 或 ", [一两三四]张图片" 模式
  return prompt.replace(/, (\d+|[一两三四])张图片$/, '').trim();
};
