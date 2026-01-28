# 核心接口定义 - AI 游戏生成器

## 📋 核心接口

### 1. AIGameGenerator (主接口)

```typescript
/**
 * AI游戏生成器主类
 */
export interface IAIGameGenerator {
  /**
   * 从提示词生成项目
   * @param prompt 用户输入的游戏描述
   * @param options 生成选项
   * @returns 生成的项目
   */
  generateFromPrompt(
    prompt: string,
    options?: GenerationOptions
  ): Promise<Project>;

  /**
   * 优化现有项目
   * @param project 要优化的项目
   * @returns 优化建议列表
   */
  optimizeProject(project: Project): Promise<OptimizationSuggestion[]>;

  /**
   * 根据反馈改进项目
   * @param project 当前项目
   * @param feedback 用户反馈
   * @returns 改进后的项目
   */
  refineWithFeedback(
    project: Project,
    feedback: string
  ): Promise<Project>;
}

/**
 * 生成选项
 */
export interface GenerationOptions {
  /** AI提供商 */
  aiProvider?: 'openai' | 'wenxin' | 'qwen' | 'local';

  /** 创造性程度 (0-1) */
  creativity?: number;

  /** 复杂度 */
  complexity?: 'simple' | 'medium' | 'complex';

  /** 是否包含注释 */
  includeComments?: boolean;

  /** 是否包含测试 */
  includeTests?: boolean;

  /** 目标平台 */
  targetPlatform?: 'wechat' | 'alipay' | 'tiktok';
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  /** 建议类型 */
  type: 'performance' | 'ux' | 'balance' | 'code-quality';

  /** 严重程度 */
  severity: 'info' | 'warning' | 'critical';

  /** 建议描述 */
  description: string;

  /** 修复方案 */
  fix?: {
    description: string;
    autoApply?: boolean;
    apply: () => Promise<void>;
  };
}
```

---

### 2. PromptParser (提示词解析器)

```typescript
/**
 * 提示词解析器
 */
export interface IPromptParser {
  /**
   * 解析用户输入
   * @param prompt 用户输入的游戏描述
   * @returns 解析后的游戏意图
   */
  parse(prompt: string): Promise<GameIntent>;

  /**
   * 提取游戏类型
   * @param intent 游戏意图
   * @returns 游戏类型
   */
  extractGameType(intent: GameIntent): GameType;

  /**
   * 提取游戏元素
   * @param intent 游戏意图
   * @returns 游戏元素列表
   */
  extractElements(intent: GameIntent): GameElement[];

  /**
   * 提取游戏规则
   * @param intent 游戏意图
   * @returns 游戏规则列表
   */
  extractRules(intent: GameIntent): GameRule[];
}

/**
 * 游戏意图
 */
export interface GameIntent {
  /** 原始提示词 */
  rawPrompt: string;

  /** 游戏类型 */
  gameType: GameType;

  /** 游戏描述 */
  description: string;

  /** 游戏元素 */
  elements: GameElement[];

  /** 游戏规则 */
  rules: GameRule[];

  /** UI需求 */
  ui: UIRequirement[];

  /** 置信度 (0-1) */
  confidence: number;
}

/**
 * 游戏类型
 */
export type GameType =
  | 'click'        // 点击类
  | 'runner'       // 跑酷类
  | 'quiz'         // 答题类
  | 'puzzle'       // 拼图类
  | 'strategy'     // 策略类
  | 'shooter'      // 射击类
  | 'racing'       // 赛车类
  | 'casual'       // 休闲类
  | 'unknown';     // 未知类型

/**
 * 游戏元素
 */
export interface GameElement {
  /** 元素类型 */
  type: 'character' | 'obstacle' | 'collectible' | 'ui' | 'background' | 'effect';

  /** 元素名称 */
  name: string;

  /** 元素描述 */
  description?: string;

  /** 元素属性 */
  properties: Record<string, any>;

  /** 行为 */
  behaviors?: string[];
}

/**
 * 游戏规则
 */
export interface GameRule {
  /** 规则类型 */
  type: 'scoring' | 'timing' | 'collision' | 'level' | 'winning' | 'losing';

  /** 规则描述 */
  description: string;

  /** 规则参数 */
  parameters: Record<string, any>;

  /** 优先级 */
  priority?: number;
}

/**
 * UI需求
 */
export interface UIRequirement {
  /** UI类型 */
  type: 'button' | 'text' | 'image' | 'progress' | 'timer' | 'menu';

  /** 位置 */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';

  /** 内容 */
  content: string;

  /** 样式 */
  style?: Record<string, any>;
}
```

---

### 3. TemplateEngine (模板引擎)

```typescript
/**
 * 模板引擎
 */
export interface ITemplateEngine {
  /**
   * 匹配模板
   * @param gameType 游戏类型
   * @param intent 游戏意图
   * @returns 匹配的模板
   */
  matchTemplate(gameType: GameType, intent: GameIntent): GameTemplate;

  /**
   * 定制化模板
   * @param template 基础模板
   * @param params 定制化参数
   * @returns 定制化后的模板
   */
  customizeTemplate(
    template: GameTemplate,
    params: CustomizationParams
  ): CustomizedTemplate;

  /**
   * 获取所有可用模板
   * @returns 模板列表
   */
  getAllTemplates(): GameTemplate[];

  /**
   * 添加自定义模板
   * @param template 自定义模板
   */
  addTemplate(template: GameTemplate): void;
}

/**
 * 游戏模板
 */
export interface GameTemplate {
  /** 模板ID */
  id: string;

  /** 模板名称 */
  name: string;

  /** 游戏类型 */
  gameType: GameType;

  /** 模板描述 */
  description: string;

  /** 标签 */
  tags: string[];

  /** 难度 */
  difficulty: 'simple' | 'medium' | 'complex';

  /** 项目结构 */
  structure: ProjectStructure;

  /** 组件定义 */
  components: ComponentDefinition[];

  /** 事件定义 */
  events: EventDefinition[];

  /** 变量定义 */
  variables: VariableDefinition[];

  /** 可定制化参数 */
  customizableParams: TemplateParameter[];
}

/**
 * 定制化参数
 */
export interface CustomizationParams {
  /** 游戏元素定制 */
  elements?: Partial<GameElement>[];

  /** 规则定制 */
  rules?: Partial<GameRule>[];

  /** UI定制 */
  ui?: Partial<UIRequirement>[];

  /** 其他参数 */
  [key: string]: any;
}

/**
 * 定制化后的模板
 */
export interface CustomizedTemplate extends GameTemplate {
  /** 定制化参数 */
  customization: CustomizationParams;

  /** 生成时间戳 */
  generatedAt: number;
}

/**
 * 模板参数
 */
export interface TemplateParameter {
  /** 参数名 */
  name: string;

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'color' | 'image';

  /** 默认值 */
  defaultValue: any;

  /** 描述 */
  description: string;

  /** 是否必填 */
  required?: boolean;

  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

---

### 4. ProjectGenerator (项目生成器)

```typescript
/**
 * 项目生成器
 */
export interface IProjectGenerator {
  /**
   * 生成完整项目
   * @param template 定制化模板
   * @returns 生成的项目
   */
  generateProject(template: CustomizedTemplate): Promise<Project>;

  /**
   * 生成项目结构
   * @param template 模板
   * @returns 项目结构
   */
  generateStructure(template: CustomizedTemplate): ProjectStructure;

  /**
   * 生成页面
   * @param template 模板
   * @returns 页面列表
   */
  generatePages(template: CustomizedTemplate): Page[];

  /**
   * 生成组件
   * @param template 模板
   * @returns 组件列表
   */
  generateComponents(template: CustomizedTemplate): Component[];

  /**
   * 生成事件
   * @param template 模板
   * @returns 事件列表
   */
  generateEvents(template: CustomizedTemplate): Event[];

  /**
   * 生成变量
   * @param template 模板
   * @returns 变量容器
   */
  generateVariables(template: CustomizedTemplate): VariableContainer;
}

/**
 * 项目结构
 */
export interface ProjectStructure {
  /** 项目名称 */
  name: string;

  /** 项目描述 */
  description: string;

  /** 页面数量 */
  pageCount: number;

  /** 组件数量 */
  componentCount: number;

  /** 资源配置 */
  resources: ResourceConfig[];

  /** 配置信息 */
  config: ProjectConfig;
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  /** 组件类型 */
  type: string;

  /** 组件名称 */
  name: string;

  /** 属性 */
  properties: Record<string, any>;

  /** 事件绑定 */
  eventBindings?: EventBinding[];

  /** 子组件 */
  children?: ComponentDefinition[];
}

/**
 * 事件定义
 */
export interface EventDefinition {
  /** 事件名称 */
  name: string;

  /** 事件类型 */
  type: string;

  /** 触发条件 */
  conditions: ConditionDefinition[];

  /** 执行动作 */
  actions: ActionDefinition[];
}

/**
 * 变量定义
 */
export interface VariableDefinition {
  /** 变量名 */
  name: string;

  /** 变量类型 */
  type: 'number' | 'string' | 'boolean' | 'object' | 'array';

  /** 初始值 */
  initialValue: any;

  /** 作用域 */
  scope: 'global' | 'page' | 'component';
}

/**
 * 条件定义
 */
export interface ConditionDefinition {
  /** 条件类型 */
  type: string;

  /** 参数 */
  parameters: any[];
}

/**
 * 动作定义
 */
export interface ActionDefinition {
  /** 动作类型 */
  type: string;

  /** 参数 */
  parameters: any[];
}

/**
 * 事件绑定
 */
export interface EventBinding {
  /** 事件名称 */
  eventName: string;

  /** 处理器 */
  handler: string;
}

/**
 * 资源配置
 */
export interface ResourceConfig {
  /** 资源类型 */
  type: 'image' | 'audio' | 'video' | 'font';

  /** 资源名称 */
  name: string;

  /** 资源URL或路径 */
  url: string;
}
```

---

### 5. AIService (AI服务)

```typescript
/**
 * AI服务接口
 */
export interface IAIService {
  /**
   * 发送提示词，获取AI响应
   * @param prompt 提示词
   * @param options 请求选项
   * @returns AI响应
   */
  chat(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;

  /**
   * 流式响应
   * @param prompt 提示词
   * @param onChunk 接收数据块的回调
   * @param options 请求选项
   */
  streamChat(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: AIRequestOptions
  ): Promise<void>;

  /**
   * 获取Token使用情况
   * @returns Token使用统计
   */
  getUsage(): Promise<TokenUsage>;
}

/**
 * AI请求选项
 */
export interface AIRequestOptions {
  /** 模型名称 */
  model?: string;

  /** 温度参数 (0-1) */
  temperature?: number;

  /** 最大Token数 */
  maxTokens?: number;

  /** 系统提示词 */
  systemPrompt?: string;
}

/**
 * AI响应
 */
export interface AIResponse {
  /** 响应内容 */
  content: string;

  /** 使用的Token数 */
  tokensUsed: number;

  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'error';

  /** 原始响应（用于调试）*/
  raw?: any;
}

/**
 * Token使用统计
 */
export interface TokenUsage {
  /** 总Token数 */
  totalTokens: number;

  /** 本次会话Token数 */
  sessionTokens: number;

  /** 预估成本 */
  estimatedCost: number;
}
```

---

## 📦 导出

```typescript
// src/index.ts
export type {
  IAIGameGenerator,
  GenerationOptions,
  OptimizationSuggestion,

  IPromptParser,
  GameIntent,
  GameType,
  GameElement,
  GameRule,
  UIRequirement,

  ITemplateEngine,
  GameTemplate,
  CustomizationParams,
  CustomizedTemplate,
  TemplateParameter,

  IProjectGenerator,
  ProjectStructure,
  ComponentDefinition,
  EventDefinition,
  VariableDefinition,

  IAIService,
  AIRequestOptions,
  AIResponse,
  TokenUsage,
};

export { AIGameGenerator } from './ai-generator';
export { PromptParser } from './prompt-parser';
export { TemplateEngine } from './template-engine';
export { ProjectGenerator } from './project-generator';
export { AIService } from './ai-service';
```

---

最后更新: 2026-01-24
