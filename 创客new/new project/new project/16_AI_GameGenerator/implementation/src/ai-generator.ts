/**
 * AI游戏生成器 - 主类（简化版本）
 */
import type {
  IAIGameGenerator,
  GenerationOptions,
  OptimizationSuggestion,
  Project,
} from './types';

import { AIService } from './services/ai-service';
import { PromptParser } from './prompt-parser';
import { TemplateEngine } from './template-engine';
import { ProjectGenerator } from './project-generator';

export class AIGameGenerator implements IAIGameGenerator {
  private aiService: AIService;
  private promptParser: PromptParser;
  private templateEngine: TemplateEngine;
  private projectGenerator: ProjectGenerator;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AI服务API密钥不能为空');
    }

    this.aiService = new AIService(apiKey);
    this.promptParser = new PromptParser(this.aiService);
    this.templateEngine = new TemplateEngine();
    this.projectGenerator = new ProjectGenerator();
  }

  async generateFromPrompt(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Project> {
    console.log('🚀 开始生成游戏项目...');
    console.log('📝 用户输入:', prompt);

    try {
      // Step 1: 解析用户输入
      console.log('\n[1/4] 解析游戏描述...');
      const intent = await this.promptParser.parse(prompt);
      console.log(`✓ 识别游戏类型: ${intent.gameType}`);
      console.log(`✓ 置信度: ${(intent.confidence * 100).toFixed(0)}%`);

      if (intent.confidence < 0.5) {
        console.warn('⚠️  置信度较低，可能需要更详细的描述');
      }

      // Step 2: 匹配游戏模板
      console.log('\n[2/4] 匹配游戏模板...');
      const template = this.templateEngine.matchTemplate(intent.gameType, intent);
      console.log(`✓ 使用模板: ${template.name}`);

      // Step 3: 定制化模板
      console.log('\n[3/4] 定制化模板...');
      const customized = this.templateEngine.customizeTemplate(template, {
        elements: intent.elements,
        rules: intent.rules,
        ui: intent.ui,
      });
      console.log(`✓ 定制完成`);

      // Step 4: 生成项目
      console.log('\n[4/4] 生成项目结构...');
      const project = await this.projectGenerator.generateProject(customized);
      console.log(`✓ 项目生成完成: ${project.name}`);
      console.log(`  - 页面数: ${project.pages.length}`);
      console.log(`  - 组件数: ${project.pages[0]?.components.length || 0}`);
      console.log(`  - 事件数: ${project.pages[0]?.events.length || 0}`);

      console.log('\n✅ 游戏项目生成成功！');
      return project;
    } catch (error: any) {
      console.error('\n❌ 生成失败:', error.message);
      throw error;
    }
  }

  async optimizeProject(project: Project): Promise<OptimizationSuggestion[]> {
    console.log('🔍 分析项目优化建议...');

    const suggestions: OptimizationSuggestion[] = [];

    // 简化版：提供一些基础建议
    suggestions.push({
      type: 'performance',
      severity: 'info',
      description: '考虑为图片资源添加懒加载以提升性能',
    });

    suggestions.push({
      type: 'ux',
      severity: 'info',
      description: '建议添加音效开关，提升用户体验',
    });

    console.log(`✓ 找到 ${suggestions.length} 条优化建议`);
    return suggestions;
  }

  async refineWithFeedback(
    project: Project,
    feedback: string
  ): Promise<Project> {
    console.log('🔄 根据反馈改进项目...');
    console.log('📝 反馈:', feedback);

    // 简化版：直接返回原项目
    // 未来可以通过AI分析反馈并修改项目
    console.log('⚠️  反馈迭代功能开发中，当前返回原项目');

    return project;
  }

  /**
   * 获取AI使用统计
   */
  async getUsage() {
    return await this.aiService.getUsage();
  }
}
