# 实现指南 - AI 游戏生成器

## 📋 概述

本指南详细说明如何从零开始实现AI游戏生成器模块。

⚠️ **注意**: 此模块是全新功能，无需从GDevelop迁移，但需要参考其他15个模块的接口和数据结构。

---

## 🎯 实现目标

### 最小可行产品 (MVP)
- ✅ 支持2-3种基础游戏类型（点击、跑酷、答题）
- ✅ 集成1个AI服务（OpenAI或文心一言）
- ✅ 能生成可运行的基础项目
- ✅ 生成时间 < 1分钟

### 完整版本
- 支持8种游戏类型
- 集成多个AI服务
- 智能优化建议
- 反馈迭代功能

---

## 📂 实现步骤

### 阶段 1: 环境搭建 (第1天)

#### 1.1 创建项目结构

```bash
cd "C:\Users\wzy16\Desktop\new project\16_AI_GameGenerator\implementation"

# 创建目录
mkdir -p src/{templates,utils,services}
mkdir -p tests

# 创建配置文件
touch package.json tsconfig.json vite.config.ts .env.example
```

#### 1.2 配置 package.json

```json
{
  "name": "@miniprogram-platform/ai-game-generator",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "openai": "^4.20.1",
    "langchain": "^0.1.0",
    "handlebars": "^4.7.8",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

#### 1.3 配置 TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### 1.4 安装依赖

```bash
npm install
```

---

### 阶段 2: 核心接口实现 (第2-3天)

#### 2.1 实现类型定义

```typescript
// src/types/index.ts
export type GameType =
  | 'click'
  | 'runner'
  | 'quiz'
  | 'puzzle'
  // ... 更多类型

export interface GameIntent {
  rawPrompt: string;
  gameType: GameType;
  description: string;
  elements: GameElement[];
  rules: GameRule[];
  ui: UIRequirement[];
  confidence: number;
}

// ... 其他类型定义（参考 INTERFACES.md）
```

#### 2.2 实现 AI 服务封装

```typescript
// src/services/ai-service.ts
import OpenAI from 'openai';
import type { IAIService, AIResponse, AIRequestOptions } from '../types';

export class AIService implements IAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chat(
    prompt: string,
    options?: AIRequestOptions
  ): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
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
    });

    return {
      content: response.choices[0].message.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: response.choices[0].finish_reason as any,
      raw: response,
    };
  }

  async streamChat(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: AIRequestOptions
  ): Promise<void> {
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
  }

  async getUsage() {
    // 实现使用统计（需要额外的数据存储）
    return {
      totalTokens: 0,
      sessionTokens: 0,
      estimatedCost: 0,
    };
  }
}
```

#### 2.3 实现提示词解析器

```typescript
// src/prompt-parser.ts
import type { IPromptParser, GameIntent, GameType } from './types';
import { AIService } from './services/ai-service';

export class PromptParser implements IPromptParser {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async parse(prompt: string): Promise<GameIntent> {
    // 使用AI解析用户输入
    const systemPrompt = `
你是一个游戏设计专家。用户会描述一个游戏创意，你需要：
1. 识别游戏类型
2. 提取游戏元素
3. 提取游戏规则
4. 提取UI需求

请以JSON格式返回解析结果。
`;

    const userPrompt = `
请分析以下游戏描述：
${prompt}

返回JSON格式：
{
  "gameType": "click | runner | quiz | ...",
  "description": "游戏描述",
  "elements": [
    {
      "type": "character | obstacle | collectible | ...",
      "name": "元素名称",
      "properties": {}
    }
  ],
  "rules": [
    {
      "type": "scoring | timing | collision | ...",
      "description": "规则描述",
      "parameters": {}
    }
  ],
  "ui": [
    {
      "type": "button | text | ...",
      "position": "top | bottom | ...",
      "content": "内容"
    }
  ],
  "confidence": 0.85
}
`;

    const response = await this.aiService.chat(userPrompt, {
      systemPrompt,
      temperature: 0.3, // 降低创造性，提高准确性
    });

    // 解析AI返回的JSON
    const result = JSON.parse(response.content);

    return {
      rawPrompt: prompt,
      gameType: result.gameType,
      description: result.description,
      elements: result.elements || [],
      rules: result.rules || [],
      ui: result.ui || [],
      confidence: result.confidence || 0.5,
    };
  }

  extractGameType(intent: GameIntent): GameType {
    return intent.gameType;
  }

  extractElements(intent: GameIntent) {
    return intent.elements;
  }

  extractRules(intent: GameIntent) {
    return intent.rules;
  }
}
```

---

### 阶段 3: 模板系统 (第4-5天)

#### 3.1 创建游戏模板

```typescript
// src/templates/click-game.ts
import type { GameTemplate } from '../types';

export const clickGameTemplate: GameTemplate = {
  id: 'click-game-basic',
  name: '基础点击游戏',
  gameType: 'click',
  description: '点击收集物品，计分和计时',
  tags: ['简单', '休闲', '单人'],
  difficulty: 'simple',

  structure: {
    name: '点击游戏',
    description: 'AI生成的点击游戏',
    pageCount: 2,
    componentCount: 3,
    resources: [
      {
        type: 'image',
        name: 'star',
        url: 'https://example.com/star.png',
      },
    ],
    config: {
      // 项目配置
    },
  },

  components: [
    {
      type: 'view',
      name: 'game-container',
      properties: {
        class: 'game-container',
        style: 'width: 100%; height: 100vh; position: relative;',
      },
      children: [
        {
          type: 'view',
          name: 'score-board',
          properties: {
            class: 'score-board',
          },
          children: [
            {
              type: 'text',
              name: 'score-text',
              properties: {
                content: '{{score}}',
              },
            },
            {
              type: 'text',
              name: 'time-text',
              properties: {
                content: '{{timeLeft}}s',
              },
            },
          ],
        },
        {
          type: 'image',
          name: 'collectible',
          properties: {
            src: '{{collectibleImage}}',
            style: 'position: absolute; left: {{x}}px; top: {{y}}px;',
          },
          eventBindings: [
            {
              eventName: 'tap',
              handler: 'onCollectibleTap',
            },
          ],
        },
      ],
    },
  ],

  events: [
    {
      name: 'onCollectibleTap',
      type: 'tap',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['isPlaying', '==', true],
        },
      ],
      actions: [
        {
          type: 'variable-increment',
          parameters: ['score', 1],
        },
        {
          type: 'function-call',
          parameters: ['spawnNewCollectible'],
        },
        {
          type: 'play-sound',
          parameters: ['collect-sound'],
        },
      ],
    },
    {
      name: 'onGameStart',
      type: 'lifecycle',
      conditions: [],
      actions: [
        {
          type: 'variable-set',
          parameters: ['isPlaying', true],
        },
        {
          type: 'variable-set',
          parameters: ['score', 0],
        },
        {
          type: 'variable-set',
          parameters: ['timeLeft', 60],
        },
        {
          type: 'start-timer',
          parameters: ['gameTimer', 1000],
        },
      ],
    },
    {
      name: 'onTimerTick',
      type: 'timer',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['timeLeft', '>', 0],
        },
      ],
      actions: [
        {
          type: 'variable-decrement',
          parameters: ['timeLeft', 1],
        },
      ],
    },
    {
      name: 'onGameEnd',
      type: 'condition-met',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['timeLeft', '<=', 0],
        },
      ],
      actions: [
        {
          type: 'variable-set',
          parameters: ['isPlaying', false],
        },
        {
          type: 'stop-timer',
          parameters: ['gameTimer'],
        },
        {
          type: 'navigate-to',
          parameters: ['/pages/result'],
        },
      ],
    },
  ],

  variables: [
    {
      name: 'score',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
    {
      name: 'timeLeft',
      type: 'number',
      initialValue: 60,
      scope: 'page',
    },
    {
      name: 'isPlaying',
      type: 'boolean',
      initialValue: false,
      scope: 'page',
    },
    {
      name: 'collectibleX',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
    {
      name: 'collectibleY',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
  ],

  customizableParams: [
    {
      name: 'gameDuration',
      type: 'number',
      defaultValue: 60,
      description: '游戏时长（秒）',
      required: false,
      validation: {
        min: 10,
        max: 300,
      },
    },
    {
      name: 'collectibleImage',
      type: 'image',
      defaultValue: 'https://example.com/star.png',
      description: '收集物图片',
      required: true,
    },
    {
      name: 'backgroundColor',
      type: 'color',
      defaultValue: '#ffffff',
      description: '背景颜色',
    },
  ],
};
```

#### 3.2 实现模板引擎

```typescript
// src/template-engine.ts
import type {
  ITemplateEngine,
  GameType,
  GameIntent,
  GameTemplate,
  CustomizedTemplate,
  CustomizationParams,
} from './types';

// 导入所有模板
import { clickGameTemplate } from './templates/click-game';
// import { runnerGameTemplate } from './templates/runner-game';
// import { quizGameTemplate } from './templates/quiz-game';

export class TemplateEngine implements ITemplateEngine {
  private templates: Map<string, GameTemplate> = new Map();

  constructor() {
    // 注册内置模板
    this.addTemplate(clickGameTemplate);
    // this.addTemplate(runnerGameTemplate);
    // this.addTemplate(quizGameTemplate);
  }

  matchTemplate(gameType: GameType, intent: GameIntent): GameTemplate {
    // 查找匹配的模板
    for (const template of this.templates.values()) {
      if (template.gameType === gameType) {
        return template;
      }
    }

    throw new Error(`No template found for game type: ${gameType}`);
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

    // 应用定制化参数
    if (params.elements) {
      customized.components = this.customizeComponents(
        customized.components,
        params.elements
      );
    }

    if (params.rules) {
      customized.events = this.customizeEvents(
        customized.events,
        params.rules
      );
    }

    return customized;
  }

  private customizeComponents(components: any[], elements: any[]) {
    // 根据元素定制组件
    // TODO: 实现逻辑
    return components;
  }

  private customizeEvents(events: any[], rules: any[]) {
    // 根据规则定制事件
    // TODO: 实现逻辑
    return events;
  }

  getAllTemplates(): GameTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: GameTemplate): void {
    this.templates.set(template.id, template);
  }
}
```

---

### 阶段 4: 项目生成器 (第6-7天)

#### 4.1 实现项目生成器

```typescript
// src/project-generator.ts
import type {
  IProjectGenerator,
  CustomizedTemplate,
  Project,
  Page,
  Component,
  Event,
  VariableContainer,
} from './types';

// 导入核心模块的类型
import type { Project as CoreProject } from '../../01_Core_ProjectStructure/implementation/types';

export class ProjectGenerator implements IProjectGenerator {
  async generateProject(template: CustomizedTemplate): Promise<Project> {
    const project: Project = {
      name: template.structure.name,
      description: template.structure.description,
      config: template.structure.config,
      pages: this.generatePages(template),
      resources: template.structure.resources,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return project;
  }

  generateStructure(template: CustomizedTemplate) {
    return template.structure;
  }

  generatePages(template: CustomizedTemplate): Page[] {
    // 生成游戏页面
    const gamePage: Page = {
      id: 'game-page',
      name: 'game',
      title: '游戏',
      components: this.generateComponents(template),
      events: this.generateEvents(template),
      variables: this.generateVariables(template),
      style: {},
    };

    // 生成结果页面
    const resultPage: Page = {
      id: 'result-page',
      name: 'result',
      title: '结果',
      components: [],
      events: [],
      variables: null,
      style: {},
    };

    return [gamePage, resultPage];
  }

  generateComponents(template: CustomizedTemplate): Component[] {
    return template.components.map((def) => this.componentFromDefinition(def));
  }

  private componentFromDefinition(def: any): Component {
    return {
      id: `component-${Math.random().toString(36).substr(2, 9)}`,
      type: def.type,
      name: def.name,
      properties: def.properties,
      children: def.children?.map((child: any) =>
        this.componentFromDefinition(child)
      ),
      style: def.properties.style || {},
      events: def.eventBindings || [],
    };
  }

  generateEvents(template: CustomizedTemplate): Event[] {
    return template.events.map((def) => ({
      id: `event-${Math.random().toString(36).substr(2, 9)}`,
      name: def.name,
      type: def.type,
      conditions: def.conditions,
      actions: def.actions,
    }));
  }

  generateVariables(template: CustomizedTemplate): VariableContainer {
    // 使用03_Core_VariableSystem的VariableContainer
    // TODO: 导入并使用实际的VariableContainer类
    const container: any = {};

    template.variables.forEach((varDef) => {
      container[varDef.name] = {
        type: varDef.type,
        value: varDef.initialValue,
        scope: varDef.scope,
      };
    });

    return container;
  }
}
```

---

### 阶段 5: 主生成器整合 (第8天)

#### 5.1 实现主生成器

```typescript
// src/ai-generator.ts
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
    this.aiService = new AIService(apiKey);
    this.promptParser = new PromptParser(this.aiService);
    this.templateEngine = new TemplateEngine();
    this.projectGenerator = new ProjectGenerator();
  }

  async generateFromPrompt(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Project> {
    console.log('Step 1: 解析用户输入...');
    const intent = await this.promptParser.parse(prompt);

    if (intent.confidence < 0.5) {
      throw new Error('无法理解游戏描述，请提供更详细的信息');
    }

    console.log('Step 2: 匹配游戏模板...');
    const template = this.templateEngine.matchTemplate(
      intent.gameType,
      intent
    );

    console.log('Step 3: 定制化模板...');
    const customized = this.templateEngine.customizeTemplate(template, {
      elements: intent.elements,
      rules: intent.rules,
      ui: intent.ui,
    });

    console.log('Step 4: 生成项目...');
    const project = await this.projectGenerator.generateProject(customized);

    console.log('✅ 项目生成完成！');
    return project;
  }

  async optimizeProject(project: Project): Promise<OptimizationSuggestion[]> {
    // 使用AI分析项目并提供优化建议
    const suggestions: OptimizationSuggestion[] = [];

    // TODO: 实现优化分析逻辑

    return suggestions;
  }

  async refineWithFeedback(
    project: Project,
    feedback: string
  ): Promise<Project> {
    // 根据用户反馈改进项目
    // TODO: 实现反馈迭代逻辑

    return project;
  }
}
```

#### 5.2 导出模块

```typescript
// src/index.ts
export { AIGameGenerator } from './ai-generator';
export { AIService } from './services/ai-service';
export { PromptParser } from './prompt-parser';
export { TemplateEngine } from './template-engine';
export { ProjectGenerator } from './project-generator';

export type * from './types';
```

---

### 阶段 6: 测试 (第9-10天)

#### 6.1 编写单元测试

```typescript
// tests/ai-generator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AIGameGenerator } from '../src/ai-generator';

describe('AIGameGenerator', () => {
  let generator: AIGameGenerator;

  beforeEach(() => {
    generator = new AIGameGenerator(process.env.OPENAI_API_KEY!);
  });

  it('应该能从简单提示词生成点击游戏', async () => {
    const prompt = '创建一个点击收集星星的游戏，60秒倒计时';
    const project = await generator.generateFromPrompt(prompt);

    expect(project).toBeDefined();
    expect(project.name).toBeTruthy();
    expect(project.pages).toHaveLength(2);
  });

  it('应该能识别跑酷游戏类型', async () => {
    const prompt = '做一个跑酷游戏，角色跳跃躲避障碍';
    const project = await generator.generateFromPrompt(prompt);

    expect(project).toBeDefined();
    // 验证游戏类型和结构
  });
});
```

---

### 阶段 7: 集成到主应用 (第11天)

参考集成指南 `17_Integration_MainApp/design/integration-guide.md` 第7部分。

---

## ✅ 验收标准

### MVP验收
- [ ] 能解析用户输入并识别游戏类型
- [ ] 能生成至少2种游戏类型的项目
- [ ] 生成的项目包含完整的页面、组件、事件和变量
- [ ] 生成时间 < 1分钟
- [ ] 通过所有单元测试

### 完整版验收
- [ ] 支持8种游戏类型
- [ ] 集成多个AI服务
- [ ] 提供智能优化建议
- [ ] 支持反馈迭代
- [ ] 成功率 > 85%

---

## 🔧 开发技巧

### 1. 提示词工程
- 提供清晰的系统提示词
- 使用少量示例（Few-shot learning）
- 要求AI返回结构化JSON

### 2. 错误处理
- 处理AI返回格式错误
- 处理模板匹配失败
- 提供友好的错误提示

### 3. 性能优化
- 缓存AI响应
- 并行处理多个请求
- 使用流式响应提升体验

---

## 📚 参考资料

- OpenAI API文档: https://platform.openai.com/docs
- LangChain文档: https://js.langchain.com/docs
- Prompt Engineering指南: https://www.promptingguide.ai/

---

最后更新: 2026-01-24
