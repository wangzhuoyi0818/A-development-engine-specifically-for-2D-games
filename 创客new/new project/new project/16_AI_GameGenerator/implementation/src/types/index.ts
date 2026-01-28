/**
 * AI游戏生成器 - 核心类型定义
 */

// ============ 游戏类型 ============

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

// ============ 游戏意图 ============

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

export interface GameElement {
  type: 'character' | 'obstacle' | 'collectible' | 'ui' | 'background' | 'effect';
  name: string;
  description?: string;
  properties: Record<string, any>;
  behaviors?: string[];
}

export interface GameRule {
  type: 'scoring' | 'timing' | 'collision' | 'level' | 'winning' | 'losing';
  description: string;
  parameters: Record<string, any>;
  priority?: number;
}

export interface UIRequirement {
  type: 'button' | 'text' | 'image' | 'progress' | 'timer' | 'menu';
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  content: string;
  style?: Record<string, any>;
}

// ============ 生成选项 ============

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

// ============ 模板系统 ============

export interface GameTemplate {
  id: string;
  name: string;
  gameType: GameType;
  description: string;
  tags: string[];
  difficulty: 'simple' | 'medium' | 'complex';
  structure: ProjectStructure;
  components: ComponentDefinition[];
  events: EventDefinition[];
  variables: VariableDefinition[];
  customizableParams: TemplateParameter[];
}

export interface CustomizedTemplate extends GameTemplate {
  customization: CustomizationParams;
  generatedAt: number;
}

export interface CustomizationParams {
  elements?: Partial<GameElement>[];
  rules?: Partial<GameRule>[];
  ui?: Partial<UIRequirement>[];
  [key: string]: any;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'image';
  defaultValue: any;
  description: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ============ 项目结构 ============

export interface ProjectStructure {
  name: string;
  description: string;
  pageCount: number;
  componentCount: number;
  resources: ResourceConfig[];
  config: ProjectConfig;
}

export interface ResourceConfig {
  type: 'image' | 'audio' | 'video' | 'font';
  name: string;
  url: string;
}

export interface ProjectConfig {
  appId?: string;
  projectName?: string;
  [key: string]: any;
}

// ============ 组件定义 ============

export interface ComponentDefinition {
  type: string;
  name: string;
  properties: Record<string, any>;
  eventBindings?: EventBinding[];
  children?: ComponentDefinition[];
}

export interface EventBinding {
  eventName: string;
  handler: string;
}

// ============ 事件定义 ============

export interface EventDefinition {
  name: string;
  type: string;
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
}

export interface ConditionDefinition {
  type: string;
  parameters: any[];
}

export interface ActionDefinition {
  type: string;
  parameters: any[];
}

// ============ 变量定义 ============

export interface VariableDefinition {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'object' | 'array';
  initialValue: any;
  scope: 'global' | 'page' | 'component';
}

// ============ 生成的项目 ============

export interface Project {
  name: string;
  description: string;
  config: ProjectConfig;
  pages: Page[];
  resources: ResourceConfig[];
  createdAt: number;
  updatedAt: number;
}

export interface Page {
  id: string;
  name: string;
  title: string;
  components: Component[];
  events: Event[];
  variables: VariableContainer | null;
  style: Record<string, any>;
}

export interface Component {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  children?: Component[];
  style: Record<string, any>;
  events: EventBinding[];
}

export interface Event {
  id: string;
  name: string;
  type: string;
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
}

export interface VariableContainer {
  [key: string]: {
    type: string;
    value: any;
    scope: string;
  };
}

// ============ AI服务 ============

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  finishReason: 'stop' | 'length' | 'error';
  raw?: any;
}

export interface TokenUsage {
  totalTokens: number;
  sessionTokens: number;
  estimatedCost: number;
}

// ============ 优化建议 ============

export interface OptimizationSuggestion {
  type: 'performance' | 'ux' | 'balance' | 'code-quality';
  severity: 'info' | 'warning' | 'critical';
  description: string;
  fix?: {
    description: string;
    autoApply?: boolean;
    apply: () => Promise<void>;
  };
}

// ============ 接口定义 ============

export interface IAIGameGenerator {
  generateFromPrompt(prompt: string, options?: GenerationOptions): Promise<Project>;
  optimizeProject(project: Project): Promise<OptimizationSuggestion[]>;
  refineWithFeedback(project: Project, feedback: string): Promise<Project>;
}

export interface IPromptParser {
  parse(prompt: string): Promise<GameIntent>;
  extractGameType(intent: GameIntent): GameType;
  extractElements(intent: GameIntent): GameElement[];
  extractRules(intent: GameIntent): GameRule[];
}

export interface ITemplateEngine {
  matchTemplate(gameType: GameType, intent: GameIntent): GameTemplate;
  customizeTemplate(template: GameTemplate, params: CustomizationParams): CustomizedTemplate;
  getAllTemplates(): GameTemplate[];
  addTemplate(template: GameTemplate): void;
}

export interface IProjectGenerator {
  generateProject(template: CustomizedTemplate): Promise<Project>;
  generateStructure(template: CustomizedTemplate): ProjectStructure;
  generatePages(template: CustomizedTemplate): Page[];
  generateComponents(template: CustomizedTemplate): Component[];
  generateEvents(template: CustomizedTemplate): Event[];
  generateVariables(template: CustomizedTemplate): VariableContainer;
}

export interface IAIService {
  chat(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;
  streamChat(prompt: string, onChunk: (chunk: string) => void, options?: AIRequestOptions): Promise<void>;
  getUsage(): Promise<TokenUsage>;
}
