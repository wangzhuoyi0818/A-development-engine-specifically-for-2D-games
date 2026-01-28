/**
 * AI游戏生成器测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AIGameGenerator } from '../src/ai-generator';

// 注意：这些测试需要真实的API密钥才能运行
// 在CI环境中应该mock AI服务

describe('AIGameGenerator', () => {
  let generator: AIGameGenerator;
  const apiKey = process.env.OPENAI_API_KEY || 'test-key';

  beforeEach(() => {
    // 如果没有API密钥，跳过测试
    if (apiKey === 'test-key') {
      console.warn('⚠️  未设置OPENAI_API_KEY，跳过真实AI测试');
      return;
    }
    generator = new AIGameGenerator(apiKey);
  });

  it('应该能创建生成器实例', () => {
    expect(() => new AIGameGenerator('test-key')).not.toThrow();
  });

  it('应该在没有API密钥时抛出错误', () => {
    expect(() => new AIGameGenerator('')).toThrow('AI服务API密钥不能为空');
  });

  it.skipIf(apiKey === 'test-key')('应该能从简单提示词生成点击游戏', async () => {
    const prompt = '创建一个点击收集星星的游戏，60秒倒计时';
    const project = await generator.generateFromPrompt(prompt);

    expect(project).toBeDefined();
    expect(project.name).toBeTruthy();
    expect(project.pages).toHaveLength(2);
    expect(project.pages[0].name).toBe('game');
  }, 30000); // 30秒超时

  it.skipIf(apiKey === 'test-key')('应该能提供优化建议', async () => {
    const prompt = '简单的点击游戏';
    const project = await generator.generateFromPrompt(prompt);
    const suggestions = await generator.optimizeProject(project);

    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
  }, 30000);
});
