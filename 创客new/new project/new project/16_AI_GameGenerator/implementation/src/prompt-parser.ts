/**
 * 提示词解析器 - 简化版本
 */
import type { IPromptParser, GameIntent, GameType, GameElement, GameRule } from '../types';
import { AIService } from './services/ai-service';

export class PromptParser implements IPromptParser {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async parse(prompt: string): Promise<GameIntent> {
    const systemPrompt = `你是游戏设计专家。分析用户的游戏描述，返回JSON格式：
{
  "gameType": "click|runner|quiz|puzzle|strategy|shooter|racing|casual",
  "description": "简短描述",
  "elements": [{"type": "character|obstacle|collectible", "name": "名称", "properties": {}}],
  "rules": [{"type": "scoring|timing|collision", "description": "规则", "parameters": {}}],
  "ui": [{"type": "button|text", "position": "top|bottom", "content": "内容"}],
  "confidence": 0.8
}`;

    const userPrompt = `分析游戏描述并返回JSON：\n${prompt}`;

    try {
      const response = await this.aiService.chat(userPrompt, {
        systemPrompt,
        temperature: 0.3,
      });

      // 提取JSON（去除markdown代码块）
      let jsonStr = response.content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const result = JSON.parse(jsonStr);

      return {
        rawPrompt: prompt,
        gameType: result.gameType || 'unknown',
        description: result.description || prompt,
        elements: result.elements || [],
        rules: result.rules || [],
        ui: result.ui || [],
        confidence: result.confidence || 0.5,
      };
    } catch (error) {
      console.error('提示词解析失败:', error);
      // 返回一个默认的简单点击游戏意图
      return this.getDefaultIntent(prompt);
    }
  }

  private getDefaultIntent(prompt: string): GameIntent {
    return {
      rawPrompt: prompt,
      gameType: 'click',
      description: '简单点击游戏',
      elements: [
        {
          type: 'collectible',
          name: 'star',
          properties: { image: 'star.png' },
        },
      ],
      rules: [
        {
          type: 'scoring',
          description: '点击得分',
          parameters: { pointsPerClick: 1 },
        },
        {
          type: 'timing',
          description: '60秒倒计时',
          parameters: { duration: 60 },
        },
      ],
      ui: [
        {
          type: 'text',
          position: 'top',
          content: '分数: {{score}}',
        },
        {
          type: 'text',
          position: 'top',
          content: '时间: {{timeLeft}}s',
        },
      ],
      confidence: 0.6,
    };
  }

  extractGameType(intent: GameIntent): GameType {
    return intent.gameType;
  }

  extractElements(intent: GameIntent): GameElement[] {
    return intent.elements;
  }

  extractRules(intent: GameIntent): GameRule[] {
    return intent.rules;
  }
}
