/**
 * AI服务封装 - 简化版本
 */
import OpenAI from 'openai';
import type { IAIService, AIResponse, AIRequestOptions, TokenUsage } from '../types';

export class AIService implements IAIService {
  private client: OpenAI;
  private totalTokens: number = 0;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // 仅用于开发，生产环境应使用后端代理
    });
  }

  async chat(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || '你是一个游戏设计助手，帮助用户生成小程序游戏。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      });

      const tokensUsed = response.usage?.total_tokens || 0;
      this.totalTokens += tokensUsed;

      return {
        content: response.choices[0].message.content || '',
        tokensUsed,
        finishReason: response.choices[0].finish_reason as any,
        raw: response,
      };
    } catch (error: any) {
      console.error('AI服务调用失败:', error);
      throw new Error(`AI服务错误: ${error.message}`);
    }
  }

  async streamChat(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: AIRequestOptions
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: options?.systemPrompt || '你是一个游戏设计助手',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error: any) {
      console.error('流式AI服务调用失败:', error);
      throw new Error(`AI流式服务错误: ${error.message}`);
    }
  }

  async getUsage(): Promise<TokenUsage> {
    return {
      totalTokens: this.totalTokens,
      sessionTokens: this.totalTokens,
      estimatedCost: this.totalTokens * 0.00003, // 粗略估算，实际成本取决于模型
    };
  }
}
