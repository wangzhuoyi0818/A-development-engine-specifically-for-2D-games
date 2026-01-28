/**
 * 微信小程序可视化开发平台 - 核心类型定义
 *
 * 本文件定义了项目结构管理模块的所有 TypeScript 类型接口
 * 参考 GDevelop 的 Project/Layout/Object 结构,适配微信小程序特性
 */

// ============================================================================
// 项目相关类型
// ============================================================================

/**
 * 微信小程序项目
 * 对应 GDevelop 的 gd::Project
 */
export interface MiniProgramProject {
  /** 项目唯一标识 (UUID v4) */
  id: string;

  /** 项目名称 */
  name: string;

  /** 项目版本号 (语义化版本, 如 "1.0.0") */
  version: string;

  /** 项目描述 */
  description?: string;

  /** 微信小程序 AppID */
  appId?: string;

  /** 项目配置 (对应 app.json) */
  config: ProjectConfig;

  /** 页面列表 */
  pages: Page[];

  /** 全局自定义组件定义 */
  globalComponents: ComponentDefinition[];

  /** 资源列表 (图片、音频等) */
  resources: Resource[];

  /** 全局变量 */
  globalVariables: Variable[];

  /** 项目创建时间 */
  createdAt: Date;

  /** 项目最后更新时间 */
  updatedAt: Date;
}

/**
 * 项目配置
 * 对应微信小程序的 app.json
 */
export interface ProjectConfig {
  /** 全局窗口配置 */
  window: WindowConfig;

  /** 底部标签栏配置 */
  tabBar?: TabBarConfig;

  /** 网络超时配置 */
  networkTimeout?: NetworkTimeout;

  /** 权限配置 */
  permission?: Permission;

  /** 是否开启调试模式 */
  debug?: boolean;

  /** 分包配置 */
  subPackages?: SubPackage[];

  /** 插件配置 */
  plugins?: Record<string, PluginConfig>;
}

/**
 * 窗口配置
 * 对应 app.json 中的 window 字段
 */
export interface WindowConfig {
  /** 导航栏背景颜色 (如 #ffffff) */
  navigationBarBackgroundColor?: string;

  /** 导航栏标题颜色 (white 或 black) */
  navigationBarTextStyle?: 'white' | 'black';

  /** 导航栏标题文字 */
  navigationBarTitleText?: string;

  /** 窗口背景色 */
  backgroundColor?: string;

  /** 下拉 loading 的样式 (dark 或 light) */
  backgroundTextStyle?: 'dark' | 'light';

  /** 是否开启下拉刷新 */
  enablePullDownRefresh?: boolean;

  /** 页面上拉触底事件触发时距页面底部距离 (单位px) */
  onReachBottomDistance?: number;

  /** 屏幕旋转设置 */
  pageOrientation?: 'auto' | 'portrait' | 'landscape';
}

/**
 * 底部标签栏配置
 */
export interface TabBarConfig {
  /** 文字默认颜色 */
  color: string;

  /** 文字选中时的颜色 */
  selectedColor: string;

  /** 背景色 */
  backgroundColor: string;

  /** 边框颜色 (black 或 white) */
  borderStyle?: 'black' | 'white';

  /** tab 列表 */
  list: TabBarItem[];

  /** 位置 (bottom 或 top) */
  position?: 'bottom' | 'top';

  /** 自定义图标 */
  custom?: boolean;
}

/**
 * 标签栏项
 */
export interface TabBarItem {
  /** 页面路径 */
  pagePath: string;

  /** 按钮文字 */
  text: string;

  /** 图标路径 */
  iconPath?: string;

  /** 选中时图标路径 */
  selectedIconPath?: string;
}

/**
 * 网络超时配置
 */
export interface NetworkTimeout {
  /** wx.request 超时时间 (毫秒) */
  request?: number;

  /** wx.connectSocket 超时时间 (毫秒) */
  connectSocket?: number;

  /** wx.uploadFile 超时时间 (毫秒) */
  uploadFile?: number;

  /** wx.downloadFile 超时时间 (毫秒) */
  downloadFile?: number;
}

/**
 * 权限配置
 */
export interface Permission {
  /** 位置权限 */
  'scope.userLocation'?: PermissionDesc;

  /** 相机权限 */
  'scope.camera'?: PermissionDesc;

  /** 录音权限 */
  'scope.record'?: PermissionDesc;

  /** 通讯录权限 */
  'scope.writePhotosAlbum'?: PermissionDesc;

  /** 其他权限 */
  [key: string]: PermissionDesc | undefined;
}

/**
 * 权限描述
 */
export interface PermissionDesc {
  /** 权限描述 */
  desc: string;
}

/**
 * 分包配置
 */
export interface SubPackage {
  /** 分包根目录 */
  root: string;

  /** 分包页面路径 */
  pages: string[];

  /** 分包别名 */
  name?: string;

  /** 是否是独立分包 */
  independent?: boolean;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 插件版本 */
  version: string;

  /** 插件 AppID */
  provider: string;
}

// ============================================================================
// 页面相关类型
// ============================================================================

/**
 * 小程序页面
 * 对应 GDevelop 的 gd::Layout
 */
export interface Page {
  /** 页面唯一标识 (UUID v4) */
  id: string;

  /** 页面名称 */
  name: string;

  /** 页面路径 (如 "pages/index/index") */
  path: string;

  /** 页面配置 (对应 page.json) */
  config: PageConfig;

  /** 页面组件树 (根级组件列表) */
  components: Component[];

  /** 页面初始数据 */
  data: Record<string, any>;

  /** 页面变量 */
  variables: Variable[];

  /** 生命周期事件处理 */
  lifecycleEvents: LifecycleEvent[];

  /** 自定义事件处理 */
  customEvents: CustomEvent[];
}

/**
 * 页面配置
 * 对应微信小程序的 page.json
 */
export interface PageConfig {
  /** 导航栏标题文字 */
  navigationBarTitleText?: string;

  /** 导航栏背景颜色 */
  navigationBarBackgroundColor?: string;

  /** 导航栏标题颜色 */
  navigationBarTextStyle?: 'white' | 'black';

  /** 窗口背景色 */
  backgroundColor?: string;

  /** 是否开启下拉刷新 */
  enablePullDownRefresh?: boolean;

  /** 是否禁用页面右滑返回 */
  disableScroll?: boolean;

  /** 页面使用的自定义组件 */
  usingComponents?: Record<string, string>;
}

// ============================================================================
// 组件相关类型
// ============================================================================

/**
 * 组件实例
 * 对应 GDevelop 的 gd::Object/gd::InitialInstance
 */
export interface Component {
  /** 组件唯一标识 (UUID v4) */
  id: string;

  /** 组件类型 (如 'view', 'text', 'button') */
  type: string;

  /** 组件名称 (可选,便于识别) */
  name?: string;

  /** 组件属性列表 */
  properties: ComponentProperty[];

  /** 组件样式 */
  style: ComponentStyle;

  /** 组件事件绑定 */
  events: ComponentEvent[];

  /** 子组件列表 */
  children: Component[];

  /** 数据绑定 */
  dataBindings: DataBinding[];

  /** 条件渲染表达式 (如 "{{showContent}}") */
  condition?: string;

  /** 列表渲染配置 */
  listRendering?: ListRenderingConfig;
}

/**
 * 组件属性
 */
export interface ComponentProperty {
  /** 属性名 */
  name: string;

  /** 属性值 */
  value: any;

  /** 属性类型 */
  type: PropertyType;

  /** 是否是数据绑定 */
  isBinding?: boolean;
}

/**
 * 属性类型
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'color'
  | 'image'
  | 'event';

/**
 * 组件样式
 */
export interface ComponentStyle {
  /** 宽度 */
  width?: string;

  /** 高度 */
  height?: string;

  /** 内边距 */
  padding?: string;

  /** 外边距 */
  margin?: string;

  /** 背景色 */
  backgroundColor?: string;

  /** 边框 */
  border?: string;

  /** 圆角 */
  borderRadius?: string;

  /** 字体大小 */
  fontSize?: string;

  /** 字体颜色 */
  color?: string;

  /** 文本对齐 */
  textAlign?: 'left' | 'center' | 'right';

  /** 显示方式 */
  display?: 'block' | 'inline' | 'flex' | 'inline-flex' | 'none';

  /** Flex 方向 */
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';

  /** Flex 对齐 */
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';

  /** Flex 交叉轴对齐 */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';

  /** 其他样式 */
  [key: string]: string | undefined;
}

/**
 * 组件事件
 */
export interface ComponentEvent {
  /** 事件名称 (如 'tap', 'input') */
  name: string;

  /** 事件处理函数名 */
  handler: string;

  /** 事件参数 */
  params?: Record<string, any>;

  /** 事件动作列表 (可视化事件系统) */
  actions?: EventAction[];
}

/**
 * 事件动作
 */
export interface EventAction {
  /** 动作类型 */
  type: EventActionType;

  /** 动作参数 */
  params: Record<string, any>;
}

/**
 * 事件动作类型
 */
export type EventActionType =
  | 'navigate'       // 页面跳转
  | 'setData'        // 设置数据
  | 'showToast'      // 显示提示
  | 'showModal'      // 显示模态框
  | 'request'        // 发起请求
  | 'custom';        // 自定义动作

/**
 * 数据绑定
 */
export interface DataBinding {
  /** 绑定的属性名 */
  property: string;

  /** 绑定的数据路径 (如 "user.name") */
  dataPath: string;

  /** 绑定模式 */
  mode: 'oneWay' | 'twoWay';

  /** 数据转换函数 */
  transform?: string;
}

/**
 * 列表渲染配置
 */
export interface ListRenderingConfig {
  /** 数据源路径 (如 "items") */
  dataSource: string;

  /** 循环项变量名 (默认 "item") */
  itemName?: string;

  /** 循环索引变量名 (默认 "index") */
  indexName?: string;

  /** 列表项唯一key (如 "id") */
  key?: string;
}

/**
 * 自定义组件定义
 */
export interface ComponentDefinition {
  /** 组件ID */
  id: string;

  /** 组件名称 */
  name: string;

  /** 组件类型标识 */
  type: string;

  /** 组件模板 */
  template: Component[];

  /** 组件属性定义 */
  properties: ComponentPropertyDef[];

  /** 组件事件定义 */
  events: ComponentEventDef[];
}

/**
 * 组件属性定义
 */
export interface ComponentPropertyDef {
  /** 属性名 */
  name: string;

  /** 属性类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: any;

  /** 属性描述 */
  description?: string;
}

/**
 * 组件事件定义
 */
export interface ComponentEventDef {
  /** 事件名 */
  name: string;

  /** 事件描述 */
  description?: string;

  /** 事件参数 */
  params?: string[];
}

// ============================================================================
// 事件相关类型
// ============================================================================

/**
 * 生命周期事件
 */
export interface LifecycleEvent {
  /** 生命周期名称 */
  name: LifecycleType;

  /** 事件动作列表 */
  actions: EventAction[];
}

/**
 * 生命周期类型
 */
export type LifecycleType =
  | 'onLoad'         // 页面加载
  | 'onShow'         // 页面显示
  | 'onReady'        // 页面初次渲染完成
  | 'onHide'         // 页面隐藏
  | 'onUnload'       // 页面卸载
  | 'onPullDownRefresh'  // 下拉刷新
  | 'onReachBottom'  // 上拉触底
  | 'onShareAppMessage'; // 分享

/**
 * 自定义事件
 */
export interface CustomEvent {
  /** 事件ID */
  id: string;

  /** 事件名称 */
  name: string;

  /** 事件参数定义 */
  params: EventParam[];

  /** 事件动作列表 */
  actions: EventAction[];
}

/**
 * 事件参数
 */
export interface EventParam {
  /** 参数名 */
  name: string;

  /** 参数类型 */
  type: PropertyType;

  /** 参数描述 */
  description?: string;
}

// ============================================================================
// 变量相关类型
// ============================================================================

/**
 * 变量定义
 */
export interface Variable {
  /** 变量ID */
  id: string;

  /** 变量名 */
  name: string;

  /** 变量类型 */
  type: VariableType;

  /** 初始值 */
  initialValue: any;

  /** 变量描述 */
  description?: string;

  /** 是否是持久化变量 */
  persistent?: boolean;
}

/**
 * 变量类型
 */
export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

// ============================================================================
// 资源相关类型
// ============================================================================

/**
 * 资源
 */
export interface Resource {
  /** 资源ID */
  id: string;

  /** 资源名称 */
  name: string;

  /** 资源类型 */
  type: ResourceType;

  /** 资源URL或路径 */
  url: string;

  /** 资源大小 (字节) */
  size?: number;

  /** 资源元数据 */
  metadata?: Record<string, any>;
}

/**
 * 资源类型
 */
export type ResourceType =
  | 'image'
  | 'audio'
  | 'video'
  | 'font'
  | 'data';

// ============================================================================
// 事务相关类型
// ============================================================================

/**
 * 事务
 */
export interface Transaction {
  /** 事务ID */
  id: string;

  /** 项目ID */
  projectId: string;

  /** 操作列表 */
  operations: Operation[];

  /** 快照 (用于回滚) */
  snapshot: MiniProgramProject;

  /** 事务创建时间 */
  createdAt: Date;
}

/**
 * 操作记录
 */
export interface Operation {
  /** 操作类型 */
  type: 'add' | 'remove' | 'update';

  /** 操作目标 */
  target: 'project' | 'page' | 'component' | 'variable' | 'resource';

  /** 操作数据 */
  data: any;

  /** 回滚数据 */
  rollbackData?: any;
}

// ============================================================================
// 验证相关类型
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误路径 */
  path?: string;

  /** 错误详情 */
  details?: any;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告路径 */
  path?: string;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 创建项目选项
 */
export interface ProjectOptions {
  /** 项目名称 */
  name: string;

  /** AppID */
  appId?: string;

  /** 版本号 */
  version?: string;

  /** 描述 */
  description?: string;

  /** 初始配置 */
  config?: Partial<ProjectConfig>;
}

/**
 * 更新项目选项
 */
export interface UpdateProjectOptions {
  /** 项目名称 */
  name?: string;

  /** 版本号 */
  version?: string;

  /** 描述 */
  description?: string;

  /** AppID */
  appId?: string;
}
