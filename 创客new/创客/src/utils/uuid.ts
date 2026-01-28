import { v4 as uuidv4 } from 'uuid';

/**
 * 生成唯一 ID
 */
export const generateId = (): string => {
  return uuidv4();
};

/**
 * 生成短 ID（8位）
 */
export const generateShortId = (): string => {
  return uuidv4().slice(0, 8);
};

/**
 * 生成时间戳 ID
 */
export const generateTimestampId = (): string => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export default {
  generateId,
  generateShortId,
  generateTimestampId,
};
