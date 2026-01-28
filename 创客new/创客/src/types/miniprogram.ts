// 小程序项目类型
export interface MiniProgramProject {
  id: string;
  name: string;
  description?: string;
  appId: string;
  version: string;
  pages: Page[];
  config: ProjectConfig;
  globalStyles: Record<string, unknown>;
  customComponents: ComponentDefinition[];
  createdAt: number;
  updatedAt: number;
  lastOpened: number;
}

// 项目配置 (app.json)
export interface ProjectConfig {
  pages: string[];
  window: WindowConfig;
  tabBar?: TabBarConfig;
  networkTimeout?: NetworkTimeoutConfig;
  debug?: boolean;
}

export interface WindowConfig {
  navigationBarTitleText: string;
  navigationBarBackgroundColor: string;
  navigationBarTextStyle: 'black' | 'white';
  backgroundColor: string;
  backgroundTextStyle: 'dark' | 'light';
  enablePullDownRefresh?: boolean;
}

export interface TabBarConfig {
  color: string;
  selectedColor: string;
  backgroundColor: string;
  borderStyle?: 'black' | 'white';
  position?: 'bottom' | 'top';
  list: TabBarItem[];
}

export interface TabBarItem {
  pagePath: string;
  text: string;
  iconPath?: string;
  selectedIconPath?: string;
}

export interface NetworkTimeoutConfig {
  request?: number;
  connectSocket?: number;
  uploadFile?: number;
  downloadFile?: number;
}

// 背景图层类型
export interface BackgroundLayer {
  id: string;
  name: string;           // 图层名称
  imageUrl: string;       // 图片路径
  parallaxSpeed: number;  // 视差速度 (0-2，0表示固定，1表示跟随，>1表示超前)
  order: number;          // 图层顺序（越小越靠后）
  visible: boolean;       // 是否可见
  tileWidth?: number;     // 平铺单元宽度（用于无限循环，默认为画布宽度375）
  tileHeight?: number;    // 平铺单元高度（用于无限循环，默认为画布高度667）
}

// 页面类型
export interface Page {
  id: string;
  name: string;
  path: string;
  components: ComponentInstance[];
  pageData: Record<string, unknown>;
  lifecycleEvents: LifecycleEvent[];
  styles: Record<string, unknown>;
  config?: PageConfig;
  backgroundLayers?: BackgroundLayer[];  // 背景图层列表
}

export interface PageConfig {
  navigationBarTitleText?: string;
  navigationBarBackgroundColor?: string;
  navigationBarTextStyle?: 'black' | 'white';
  backgroundColor?: string;
  enablePullDownRefresh?: boolean;
  usingComponents?: Record<string, string>;
}

// 组件定义
export interface ComponentDefinition {
  id: string;
  type: string;
  name: string;
  icon: string;
  category: ComponentCategory;
  defaultProps: Record<string, unknown>;
  defaultStyles: Record<string, unknown>;
  propDefinitions: PropDefinition[];
  styleDefinitions: StyleDefinition[];
  events: string[];
  allowChildren: boolean;
  isCustom: boolean;
  template?: string;
  script?: string;
  style?: string;
}

export type ComponentCategory =
  | 'basic'      // 基础组件
  | 'form'       // 表单组件
  | 'media'      // 媒体组件
  | 'navigation' // 导航组件
  | 'container'  // 容器组件
  | 'feedback'   // 反馈组件
  | 'custom';    // 自定义组件

// 组件实例
export interface ComponentInstance {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  events: ComponentEvent[];
  children: ComponentInstance[];
  position: Position;
  size: Size;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  parentId: string | null;
  // 游戏角色属性
  gameRole?: {
    roleType: string;  // player, enemy, item, etc.
    properties: Record<string, unknown>;  // hp, attack, defense, etc.
  };
  // 积木块脚本 - 按事件触发器分组存储
  scripts?: {
    [trigger: string]: import('@/types/block').Block[];
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// 属性定义
export interface PropDefinition {
  name: string;
  label: string;
  type: PropType;
  defaultValue: unknown;
  required?: boolean;
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
  step?: number;
}

export type PropType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'image'
  | 'expression'
  | 'array'
  | 'object';

// 样式定义
export interface StyleDefinition {
  name: string;
  label: string;
  type: StyleType;
  defaultValue: unknown;
  unit?: string;
  options?: { label: string; value: string }[];
}

export type StyleType =
  | 'size'
  | 'color'
  | 'select'
  | 'number'
  | 'spacing'
  | 'border'
  | 'shadow'
  | 'font';

// 组件事件
export interface ComponentEvent {
  id: string;
  trigger: EventTrigger;
  condition?: Condition;
  actions: Action[];
}

export type EventTrigger =
  | 'tap'
  | 'longpress'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'input'
  | 'change'
  | 'focus'
  | 'blur'
  | 'submit'
  | 'scroll'
  | 'load'
  | 'error';

// 条件判断
export interface Condition {
  type: ConditionType;
  left: string;
  operator: ConditionOperator;
  right: unknown;
}

export type ConditionType = 'simple' | 'expression';
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';

// 动作
export interface Action {
  id: string;
  type: ActionType;
  params: Record<string, unknown>;
}

export type ActionType =
  | 'setData'
  | 'navigateTo'
  | 'redirectTo'
  | 'switchTab'
  | 'navigateBack'
  | 'reLaunch'
  | 'request'
  | 'toast'
  | 'showModal'
  | 'showLoading'
  | 'hideLoading'
  | 'setStorage'
  | 'getStorage'
  | 'custom';

// 生命周期事件
export interface LifecycleEvent {
  type: LifecycleType;
  actions: Action[];
}

export type LifecycleType =
  | 'onLoad'
  | 'onShow'
  | 'onReady'
  | 'onHide'
  | 'onUnload'
  | 'onPullDownRefresh'
  | 'onReachBottom'
  | 'onShareAppMessage';

// 微信内置组件类型
export type WechatComponentType =
  | 'view' | 'scroll-view' | 'swiper' | 'swiper-item' | 'movable-area' | 'movable-view'
  | 'text' | 'rich-text' | 'icon' | 'progress'
  | 'button' | 'checkbox' | 'checkbox-group' | 'form' | 'input' | 'label'
  | 'picker' | 'picker-view' | 'picker-view-column' | 'radio' | 'radio-group'
  | 'slider' | 'switch' | 'textarea'
  | 'navigator' | 'functional-page-navigator'
  | 'audio' | 'camera' | 'image' | 'live-player' | 'live-pusher' | 'video'
  | 'map' | 'canvas'
  | 'cover-image' | 'cover-view';
