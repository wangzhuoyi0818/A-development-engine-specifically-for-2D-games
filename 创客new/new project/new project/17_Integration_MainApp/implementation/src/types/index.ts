/**
 * 主应用类型定义
 * 集成所有模块的类型，提供统一的类型接口
 */

// ============ 项目相关类型 ============

/**
 * 项目配置
 */
export interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  settings?: {
    minProgramVersion?: string;
    requiredPrivateInfoVersion?: string;
  };
}

/**
 * 页面对象
 */
export interface Page {
  id: string;
  name: string;
  title?: string;
  route?: string;
  components: Component[];
  events?: Event[];
  variables?: Variable[];
  metadata?: Record<string, any>;
}

/**
 * 组件对象
 */
export interface Component {
  id: string;
  type: string;
  name?: string;
  parent?: string;
  children?: string[];
  props?: Record<string, any>;
  events?: Event[];
  style?: ComponentStyle;
  metadata?: Record<string, any>;
}

/**
 * 组件样式
 */
export interface ComponentStyle {
  width?: string | number;
  height?: string | number;
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  custom?: Record<string, any>;
}

/**
 * 项目对象
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  version: string;
  pages: Page[];
  resources?: Resource[];
  variables?: Variable[];
  config?: ProjectConfig;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    lastOpenedAt?: string;
  };
}

// ============ 事件相关类型 ============

/**
 * 事件对象
 */
export interface Event {
  id: string;
  type: string;
  trigger: string;
  conditions?: Condition[];
  actions?: Action[];
  metadata?: Record<string, any>;
}

/**
 * 条件
 */
export interface Condition {
  id: string;
  type: string;
  params?: Record<string, any>;
}

/**
 * 动作
 */
export interface Action {
  id: string;
  type: string;
  target?: string;
  params?: Record<string, any>;
}

// ============ 变量相关类型 ============

/**
 * 变量对象
 */
export interface Variable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value?: any;
  scope: 'global' | 'page' | 'component';
  metadata?: Record<string, any>;
}

/**
 * 变量容器
 */
export interface VariableContainer {
  variables: Map<string, Variable>;
  get(name: string): any;
  set(name: string, value: any): void;
  has(name: string): boolean;
  delete(name: string): void;
}

// ============ 资源相关类型 ============

/**
 * 资源对象
 */
export interface Resource {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'font' | 'data' | 'other';
  path?: string;
  url?: string;
  size?: number;
  metadata?: Record<string, any>;
}

// ============ 编辑器相关类型 ============

/**
 * 编辑器模式
 */
export type EditorMode = 'design' | 'event' | 'property' | 'preview';

/**
 * 编辑器工具
 */
export type EditorTool =
  | 'select'
  | 'draw'
  | 'resize'
  | 'rotate'
  | 'delete';

/**
 * 编辑器状态
 */
export interface EditorState {
  currentMode: EditorMode;
  selectedComponentId?: string;
  selectedPageId?: string;
  currentTool: EditorTool;
  zoomLevel: number;
  panX: number;
  panY: number;
  isGridEnabled: boolean;
  gridSize: number;
  showRulers: boolean;
  undoStack: EditorAction[];
  redoStack: EditorAction[];
}

/**
 * 编辑器动作（用于撤销/重做）
 */
export interface EditorAction {
  type: 'add' | 'remove' | 'update' | 'move';
  target: 'component' | 'page' | 'event';
  targetId: string;
  before?: any;
  after?: any;
  timestamp: number;
}

// ============ UI 相关类型 ============

/**
 * UI 主题
 */
export interface UITheme {
  name: 'light' | 'dark';
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
}

/**
 * 模态框选项
 */
export interface ModalOptions {
  title: string;
  content: React.ReactNode;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    type?: 'primary' | 'secondary' | 'danger';
  }>;
  onClose?: () => void;
}

/**
 * 提示框选项
 */
export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============ 代码生成相关类型 ============

/**
 * 生成的代码文件
 */
export interface GeneratedFile {
  path: string;
  filename: string;
  content: string;
  type: 'wxml' | 'wxss' | 'js' | 'json' | 'other';
}

/**
 * 代码生成结果
 */
export interface CodeGenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors?: string[];
  warnings?: string[];
  timestamp: number;
}

// ============ 导出相关类型 ============

/**
 * 导出选项
 */
export interface ExportOptions {
  format: 'zip' | 'folder' | 'git';
  includeAssets: boolean;
  minify: boolean;
  sourceMaps: boolean;
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean;
  path?: string;
  size?: number;
  message?: string;
  timestamp: number;
}

// ============ 插件系统类型 ============

/**
 * 插件钩子
 */
export interface PluginHooks {
  onProjectOpen?: (project: Project) => Promise<void>;
  onProjectSave?: (project: Project) => Promise<void>;
  onComponentAdd?: (component: Component, page: Page) => Promise<void>;
  onComponentRemove?: (componentId: string, page: Page) => Promise<void>;
  onCodeGenerate?: (project: Project) => Promise<CodeGenerationResult>;
  onExport?: (project: Project, options: ExportOptions) => Promise<ExportResult>;
}

/**
 * 插件定义
 */
export interface Plugin {
  name: string;
  version: string;
  author?: string;
  description?: string;
  hooks?: PluginHooks;
}

// ============ 服务接口 ============

/**
 * 代码生成服务接口
 */
export interface ICodeGenerationService {
  generateWXML(project: Project, page: Page): Promise<string>;
  generateWXSS(project: Project, page: Page): Promise<string>;
  generateJS(project: Project, page: Page): Promise<string>;
  generateAll(project: Project): Promise<Record<string, GeneratedFile>>;
}

/**
 * 导出服务接口
 */
export interface IExportService {
  exportProject(project: Project, options?: Partial<ExportOptions>): Promise<Blob>;
  exportPage(project: Project, page: Page): Promise<Blob>;
}

/**
 * 资源服务接口
 */
export interface IResourceService {
  importResource(file: File): Promise<Resource>;
  getResource(id: string): Resource | undefined;
  listResources(): Resource[];
  deleteResource(id: string): void;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  saveProject(project: Project): Promise<void>;
  loadProject(id: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
  clearCache(): Promise<void>;
}

// ============ API 响应类型 ============

/**
 * API 响应
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ 错误类型 ============

/**
 * 应用错误
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

/**
 * 业务错误
 */
export class BusinessError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('BUSINESS_ERROR', message, details);
    this.name = 'BusinessError';
  }
}

// ============ 工具函数类型 ============

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * 格式化选项
 */
export interface FormatOptions {
  indent?: number;
  lineWidth?: number;
  minify?: boolean;
}
