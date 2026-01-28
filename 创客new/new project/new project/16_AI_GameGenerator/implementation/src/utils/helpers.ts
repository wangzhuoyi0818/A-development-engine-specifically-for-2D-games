/**
 * 工具函数
 */

/**
 * 生成随机ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 验证JSON字符串
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * 提取JSON从文本（可能包含markdown代码块）
 */
export function extractJSON(text: string): string {
  let cleaned = text.trim();

  // 移除markdown代码块
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  return cleaned.trim();
}

/**
 * 安全解析JSON
 */
export function safeJSONParse<T>(text: string, fallback: T): T {
  try {
    const cleaned = extractJSON(text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('JSON解析失败，使用fallback:', error);
    return fallback;
  }
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options;

  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries - 1) {
        onRetry?.(error, i + 1);
        await sleep(delay * (i + 1)); // 指数退避
      }
    }
  }

  throw lastError!;
}

/**
 * 验证游戏描述的完整性
 */
export function validatePrompt(prompt: string): {
  valid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // 长度检查
  if (prompt.length < 10) {
    errors.push('描述太短，至少需要10个字符');
  }

  if (prompt.length > 1000) {
    errors.push('描述太长，请控制在1000字符以内');
  }

  // 关键词检查
  const hasGameKeyword = /游戏|game|玩|play/i.test(prompt);
  if (!hasGameKeyword) {
    suggestions.push('建议明确说明这是一个游戏');
  }

  const hasAction = /点击|跳|跑|答|射|移动|收集/i.test(prompt);
  if (!hasAction) {
    suggestions.push('建议描述玩家的主要操作');
  }

  const hasGoal = /得分|分数|过关|胜利|完成|目标/i.test(prompt);
  if (!hasGoal) {
    suggestions.push('建议说明游戏目标或获胜条件');
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions,
  };
}

/**
 * 格式化项目信息为可读文本
 */
export function formatProjectInfo(project: any): string {
  return `
项目名称: ${project.name}
描述: ${project.description}
页面数: ${project.pages?.length || 0}
组件数: ${project.pages?.[0]?.components?.length || 0}
事件数: ${project.pages?.[0]?.events?.length || 0}
变量数: ${Object.keys(project.pages?.[0]?.variables || {}).length}
资源数: ${project.resources?.length || 0}
创建时间: ${new Date(project.createdAt).toLocaleString()}
  `.trim();
}
