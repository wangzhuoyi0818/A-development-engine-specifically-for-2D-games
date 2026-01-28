/**
 * 模板引擎 - 简化版本
 */
import type {
  ITemplateEngine,
  GameType,
  GameIntent,
  GameTemplate,
  CustomizedTemplate,
  CustomizationParams,
} from '../types';
import { clickGameTemplate } from './templates';

export class TemplateEngine implements ITemplateEngine {
  private templates: Map<string, GameTemplate> = new Map();

  constructor() {
    // 注册内置模板
    this.addTemplate(clickGameTemplate);
  }

  matchTemplate(gameType: GameType, intent: GameIntent): GameTemplate {
    // 简化版：直接根据游戏类型匹配
    for (const template of this.templates.values()) {
      if (template.gameType === gameType) {
        return template;
      }
    }

    // 如果没找到匹配的，返回默认的点击游戏模板
    console.warn(`未找到${gameType}类型的模板，使用默认点击游戏模板`);
    return clickGameTemplate;
  }

  customizeTemplate(
    template: GameTemplate,
    params: CustomizationParams
  ): CustomizedTemplate {
    // 深拷贝模板
    const customized: CustomizedTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      customization: params,
      generatedAt: Date.now(),
    };

    // 应用定制化参数（简化版）
    if (params.elements && params.elements.length > 0) {
      // 更新收集物配置
      const element = params.elements[0];
      if (element.name) {
        customized.structure.name = `${element.name}收集游戏`;
      }
    }

    if (params.rules) {
      // 更新游戏规则
      const timingRule = params.rules.find((r) => r.type === 'timing');
      if (timingRule && timingRule.parameters?.duration) {
        const timeVar = customized.variables.find((v) => v.name === 'timeLeft');
        if (timeVar) {
          timeVar.initialValue = timingRule.parameters.duration;
        }
      }
    }

    return customized;
  }

  getAllTemplates(): GameTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: GameTemplate): void {
    this.templates.set(template.id, template);
  }
}
