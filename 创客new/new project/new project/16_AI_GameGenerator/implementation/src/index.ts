/**
 * AI游戏生成器 - 主入口
 */

// 导出主类
export { AIGameGenerator } from './ai-generator';

// 导出服务类（高级用户可能需要）
export { AIService } from './services/ai-service';
export { PromptParser } from './prompt-parser';
export { TemplateEngine } from './template-engine';
export { ProjectGenerator } from './project-generator';

// 导出所有类型
export type * from './types';

// 导出模板
export * from './templates';

// 版本信息
export const VERSION = '1.0.0';
