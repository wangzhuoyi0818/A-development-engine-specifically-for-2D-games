/**
 * 微信小程序组件库
 *
 * 定义所有微信小程序内置组件及其属性、事件
 */

import {
  ComponentLibraryItem,
  ComponentCategory,
  PropertyType,
  PropertyDefinition,
  EventDefinition,
} from './types';

// ============================================================================
// 通用属性定义
// ============================================================================

/** 通用ID属性 */
const idProperty: PropertyDefinition = {
  name: 'id',
  label: 'ID',
  type: PropertyType.String,
  description: '组件的唯一标识',
  group: '基础',
};

/** 通用class属性 */
const classProperty: PropertyDefinition = {
  name: 'class',
  label: '样式类',
  type: PropertyType.String,
  description: '组件的样式类',
  group: '基础',
};

/** 通用style属性 */
const styleProperty: PropertyDefinition = {
  name: 'style',
  label: '内联样式',
  type: PropertyType.String,
  description: '组件的内联样式',
  group: '基础',
};

/** 通用hidden属性 */
const hiddenProperty: PropertyDefinition = {
  name: 'hidden',
  label: '是否隐藏',
  type: PropertyType.Boolean,
  defaultValue: false,
  description: '组件是否隐藏',
  group: '基础',
};

// ============================================================================
// 通用事件定义
// ============================================================================

/** 通用tap事件 */
const tapEvent: EventDefinition = {
  name: 'bindtap',
  label: '点击',
  description: '手指触摸后马上离开',
  params: [
    { name: 'event', type: 'Event', description: '事件对象' },
  ],
};

/** 通用longtap事件 */
const longtapEvent: EventDefinition = {
  name: 'bindlongtap',
  label: '长按',
  description: '手指触摸后,超过350ms再离开',
  params: [
    { name: 'event', type: 'Event', description: '事件对象' },
  ],
};

/** 通用touchstart事件 */
const touchstartEvent: EventDefinition = {
  name: 'bindtouchstart',
  label: '触摸开始',
  description: '手指触摸动作开始',
  params: [
    { name: 'event', type: 'TouchEvent', description: '触摸事件对象' },
  ],
};

/** 通用touchmove事件 */
const touchmoveEvent: EventDefinition = {
  name: 'bindtouchmove',
  label: '触摸移动',
  description: '手指触摸后移动',
  params: [
    { name: 'event', type: 'TouchEvent', description: '触摸事件对象' },
  ],
};

/** 通用touchend事件 */
const touchendEvent: EventDefinition = {
  name: 'bindtouchend',
  label: '触摸结束',
  description: '手指触摸动作结束',
  params: [
    { name: 'event', type: 'TouchEvent', description: '触摸事件对象' },
  ],
};

// ============================================================================
// 视图容器组件
// ============================================================================

/** view 组件 */
const viewComponent: ComponentLibraryItem = {
  id: 'view',
  name: 'view',
  label: '视图容器',
  description: '视图容器,类似HTML的div',
  category: ComponentCategory.ViewContainer,
  icon: 'view',
  tags: ['容器', '布局'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'hover-class',
      label: '指定按下去的样式类',
      type: PropertyType.String,
      defaultValue: 'none',
      description: '指定按下去的样式类。当 hover-class="none" 时,没有点击态效果',
      group: '交互',
    },
    {
      name: 'hover-stop-propagation',
      label: '阻止冒泡',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '指定是否阻止本节点的祖先节点出现点击态',
      group: '交互',
    },
    {
      name: 'hover-start-time',
      label: '按住多久出现点击态',
      type: PropertyType.Number,
      defaultValue: 50,
      description: '按住后多久出现点击态,单位毫秒',
      group: '交互',
      min: 0,
    },
    {
      name: 'hover-stay-time',
      label: '松开后点击态保留时间',
      type: PropertyType.Number,
      defaultValue: 400,
      description: '手指松开后点击态保留时间,单位毫秒',
      group: '交互',
      min: 0,
    },
  ],
  events: [
    tapEvent,
    longtapEvent,
    touchstartEvent,
    touchmoveEvent,
    touchendEvent,
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/view.html',
};

/** scroll-view 组件 */
const scrollViewComponent: ComponentLibraryItem = {
  id: 'scroll-view',
  name: 'scroll-view',
  label: '可滚动视图',
  description: '可滚动视图区域',
  category: ComponentCategory.ViewContainer,
  icon: 'scroll-view',
  tags: ['容器', '滚动'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'scroll-x',
      label: '允许横向滚动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '允许横向滚动',
      group: '滚动',
    },
    {
      name: 'scroll-y',
      label: '允许纵向滚动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '允许纵向滚动',
      group: '滚动',
    },
    {
      name: 'upper-threshold',
      label: '距顶部/左边多远时触发',
      type: PropertyType.Number,
      defaultValue: 50,
      description: '距顶部/左边多远时,触发 scrolltoupper 事件',
      group: '滚动',
      min: 0,
    },
    {
      name: 'lower-threshold',
      label: '距底部/右边多远时触发',
      type: PropertyType.Number,
      defaultValue: 50,
      description: '距底部/右边多远时,触发 scrolltolower 事件',
      group: '滚动',
      min: 0,
    },
    {
      name: 'scroll-top',
      label: '设置竖向滚动条位置',
      type: PropertyType.Number,
      description: '设置竖向滚动条位置',
      group: '滚动',
      bindable: true,
    },
    {
      name: 'scroll-left',
      label: '设置横向滚动条位置',
      type: PropertyType.Number,
      description: '设置横向滚动条位置',
      group: '滚动',
      bindable: true,
    },
    {
      name: 'scroll-into-view',
      label: '滚动到子元素',
      type: PropertyType.String,
      description: '值应为某子元素id(id不能以数字开头)。设置哪个方向可滚动,则在哪个方向滚动到该元素',
      group: '滚动',
      bindable: true,
    },
    {
      name: 'enable-flex',
      label: '启用 flexbox 布局',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '启用 flexbox 布局。开启后,当前节点声明了 display: flex 就会成为 flex container',
      group: '布局',
    },
  ],
  events: [
    {
      name: 'bindscrolltoupper',
      label: '滚动到顶部/左边',
      description: '滚动到顶部/左边时触发',
      params: [{ name: 'event', type: 'Event', description: '事件对象' }],
    },
    {
      name: 'bindscrolltolower',
      label: '滚动到底部/右边',
      description: '滚动到底部/右边时触发',
      params: [{ name: 'event', type: 'Event', description: '事件对象' }],
    },
    {
      name: 'bindscroll',
      label: '滚动',
      description: '滚动时触发',
      params: [
        { name: 'event.detail.scrollLeft', type: 'Number', description: '横向滚动条位置' },
        { name: 'event.detail.scrollTop', type: 'Number', description: '竖向滚动条位置' },
        { name: 'event.detail.scrollHeight', type: 'Number', description: '滚动区域的高度' },
        { name: 'event.detail.scrollWidth', type: 'Number', description: '滚动区域的宽度' },
        { name: 'event.detail.deltaX', type: 'Number', description: '横向滚动量' },
        { name: 'event.detail.deltaY', type: 'Number', description: '竖向滚动量' },
      ],
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html',
};

// ============================================================================
// 基础内容组件
// ============================================================================

/** text 组件 */
const textComponent: ComponentLibraryItem = {
  id: 'text',
  name: 'text',
  label: '文本',
  description: '文本组件',
  category: ComponentCategory.BasicContent,
  icon: 'text',
  tags: ['文本', '内容'],
  canHaveChildren: true,
  isContainer: false,
  isInline: true,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'selectable',
      label: '文本可选',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '文本是否可选',
      group: '基础',
    },
    {
      name: 'user-select',
      label: '文本可选(新)',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '文本是否可选,该属性会使文本节点显示为inline-block',
      group: '基础',
    },
    {
      name: 'space',
      label: '显示连续空格',
      type: PropertyType.Enum,
      options: [
        { value: 'ensp', label: '中文字符空格一半大小' },
        { value: 'emsp', label: '中文字符空格大小' },
        { value: 'nbsp', label: '根据字体设置的空格大小' },
      ],
      description: '显示连续空格',
      group: '基础',
    },
    {
      name: 'decode',
      label: '是否解码',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否解码',
      group: '基础',
    },
  ],
  events: [tapEvent, longtapEvent],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/text.html',
};

/** icon 组件 */
const iconComponent: ComponentLibraryItem = {
  id: 'icon',
  name: 'icon',
  label: '图标',
  description: '图标组件',
  category: ComponentCategory.BasicContent,
  icon: 'icon',
  tags: ['图标'],
  canHaveChildren: false,
  isContainer: false,
  isInline: true,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'type',
      label: '图标类型',
      type: PropertyType.Enum,
      required: true,
      options: [
        { value: 'success', label: '成功' },
        { value: 'success_no_circle', label: '成功(无圆圈)' },
        { value: 'info', label: '信息' },
        { value: 'warn', label: '警告' },
        { value: 'waiting', label: '等待' },
        { value: 'cancel', label: '取消' },
        { value: 'download', label: '下载' },
        { value: 'search', label: '搜索' },
        { value: 'clear', label: '清除' },
      ],
      description: '图标类型',
      group: '基础',
    },
    {
      name: 'size',
      label: '图标大小',
      type: PropertyType.Number,
      defaultValue: 23,
      description: '图标大小,单位px',
      group: '样式',
      min: 0,
    },
    {
      name: 'color',
      label: '图标颜色',
      type: PropertyType.Color,
      description: '图标颜色,同 css 的 color',
      group: '样式',
    },
  ],
  events: [],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/icon.html',
};

// ============================================================================
// 表单组件
// ============================================================================

/** button 组件 */
const buttonComponent: ComponentLibraryItem = {
  id: 'button',
  name: 'button',
  label: '按钮',
  description: '按钮组件',
  category: ComponentCategory.Form,
  icon: 'button',
  tags: ['按钮', '表单'],
  canHaveChildren: true,
  isContainer: false,
  isInline: false,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'size',
      label: '按钮大小',
      type: PropertyType.Enum,
      defaultValue: 'default',
      options: [
        { value: 'default', label: '默认' },
        { value: 'mini', label: '小' },
      ],
      description: '按钮的大小',
      group: '样式',
    },
    {
      name: 'type',
      label: '按钮类型',
      type: PropertyType.Enum,
      defaultValue: 'default',
      options: [
        { value: 'primary', label: '主要' },
        { value: 'default', label: '默认' },
        { value: 'warn', label: '警告' },
      ],
      description: '按钮的样式类型',
      group: '样式',
    },
    {
      name: 'plain',
      label: '镂空',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '按钮是否镂空,背景色透明',
      group: '样式',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
      group: '状态',
    },
    {
      name: 'loading',
      label: '加载中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '名称前是否带 loading 图标',
      group: '状态',
    },
    {
      name: 'form-type',
      label: '表单类型',
      type: PropertyType.Enum,
      options: [
        { value: 'submit', label: '提交' },
        { value: 'reset', label: '重置' },
      ],
      description: '用于 form 组件,点击分别会触发 form 组件的 submit/reset 事件',
      group: '表单',
    },
    {
      name: 'hover-class',
      label: '指定按下去的样式类',
      type: PropertyType.String,
      defaultValue: 'button-hover',
      description: '指定按下去的样式类',
      group: '交互',
    },
  ],
  events: [
    tapEvent,
    longtapEvent,
    {
      name: 'bindgetuserinfo',
      label: '获取用户信息',
      description: '用户点击该按钮时,会返回获取到的用户信息',
      params: [
        { name: 'event.detail.userInfo', type: 'Object', description: '用户信息对象' },
      ],
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/button.html',
};

/** input 组件 */
const inputComponent: ComponentLibraryItem = {
  id: 'input',
  name: 'input',
  label: '输入框',
  description: '输入框组件',
  category: ComponentCategory.Form,
  icon: 'input',
  tags: ['输入', '表单'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'value',
      label: '输入框的值',
      type: PropertyType.String,
      description: '输入框的初始内容',
      group: '数据',
      bindable: true,
    },
    {
      name: 'type',
      label: '输入类型',
      type: PropertyType.Enum,
      defaultValue: 'text',
      required: true,
      options: [
        { value: 'text', label: '文本' },
        { value: 'number', label: '数字' },
        { value: 'idcard', label: '身份证' },
        { value: 'digit', label: '带小数点的数字' },
      ],
      description: 'input 的类型',
      group: '基础',
    },
    {
      name: 'password',
      label: '密码类型',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否是密码类型',
      group: '基础',
    },
    {
      name: 'placeholder',
      label: '占位符',
      type: PropertyType.String,
      description: '输入框为空时占位符',
      group: '基础',
    },
    {
      name: 'placeholder-style',
      label: '占位符样式',
      type: PropertyType.String,
      description: '指定 placeholder 的样式',
      group: '样式',
    },
    {
      name: 'placeholder-class',
      label: '占位符样式类',
      type: PropertyType.String,
      defaultValue: 'input-placeholder',
      description: '指定 placeholder 的样式类',
      group: '样式',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
      group: '状态',
    },
    {
      name: 'maxlength',
      label: '最大长度',
      type: PropertyType.Number,
      defaultValue: 140,
      description: '最大输入长度,设置为 -1 的时候不限制最大长度',
      group: '验证',
      min: -1,
    },
    {
      name: 'confirm-type',
      label: '确认按钮文字',
      type: PropertyType.Enum,
      defaultValue: 'done',
      options: [
        { value: 'send', label: '发送' },
        { value: 'search', label: '搜索' },
        { value: 'next', label: '下一个' },
        { value: 'go', label: '前往' },
        { value: 'done', label: '完成' },
      ],
      description: '设置键盘右下角按钮的文字',
      group: '交互',
    },
  ],
  events: [
    {
      name: 'bindinput',
      label: '输入',
      description: '键盘输入时触发',
      params: [
        { name: 'event.detail.value', type: 'String', description: '输入框内容' },
      ],
    },
    {
      name: 'bindfocus',
      label: '聚焦',
      description: '输入框聚焦时触发',
      params: [
        { name: 'event.detail.value', type: 'String', description: '输入框内容' },
      ],
    },
    {
      name: 'bindblur',
      label: '失焦',
      description: '输入框失去焦点时触发',
      params: [
        { name: 'event.detail.value', type: 'String', description: '输入框内容' },
      ],
    },
    {
      name: 'bindconfirm',
      label: '确认',
      description: '点击完成按钮时触发',
      params: [
        { name: 'event.detail.value', type: 'String', description: '输入框内容' },
      ],
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/input.html',
};

/** checkbox 组件 */
const checkboxComponent: ComponentLibraryItem = {
  id: 'checkbox',
  name: 'checkbox',
  label: '多选框',
  description: '多选项目',
  category: ComponentCategory.Form,
  icon: 'checkbox',
  tags: ['多选', '表单'],
  canHaveChildren: true,
  isContainer: false,
  isInline: true,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'value',
      label: 'checkbox标识',
      type: PropertyType.String,
      required: true,
      description: 'checkbox标识,选中时触发checkbox-group的 change 事件,并携带 checkbox 的 value',
      group: '数据',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
      group: '状态',
    },
    {
      name: 'checked',
      label: '是否选中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '当前是否选中,可用来设置默认选中',
      group: '状态',
      bindable: true,
    },
    {
      name: 'color',
      label: 'checkbox的颜色',
      type: PropertyType.Color,
      description: 'checkbox的颜色,同css的color',
      group: '样式',
    },
  ],
  events: [],
  allowedParents: ['checkbox-group'],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/checkbox.html',
};

// ============================================================================
// 媒体组件
// ============================================================================

/** image 组件 */
const imageComponent: ComponentLibraryItem = {
  id: 'image',
  name: 'image',
  label: '图片',
  description: '图片组件',
  category: ComponentCategory.Media,
  icon: 'image',
  tags: ['图片', '媒体'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    idProperty,
    classProperty,
    styleProperty,
    hiddenProperty,
    {
      name: 'src',
      label: '图片资源地址',
      type: PropertyType.Image,
      required: true,
      description: '图片资源地址',
      group: '基础',
      bindable: true,
    },
    {
      name: 'mode',
      label: '图片裁剪/缩放模式',
      type: PropertyType.Enum,
      defaultValue: 'scaleToFill',
      options: [
        { value: 'scaleToFill', label: '缩放-不保持纵横比缩放,使图片的宽高完全拉伸至填满 image 元素' },
        { value: 'aspectFit', label: '缩放-保持纵横比缩放,使图片的长边能完全显示出来' },
        { value: 'aspectFill', label: '缩放-保持纵横比缩放,只保证图片的短边能完全显示出来' },
        { value: 'widthFix', label: '缩放-宽度不变,高度自动变化,保持原图宽高比不变' },
        { value: 'heightFix', label: '缩放-高度不变,宽度自动变化,保持原图宽高比不变' },
        { value: 'top', label: '裁剪-不缩放,只显示图片的顶部区域' },
        { value: 'bottom', label: '裁剪-不缩放,只显示图片的底部区域' },
        { value: 'center', label: '裁剪-不缩放,只显示图片的中间区域' },
        { value: 'left', label: '裁剪-不缩放,只显示图片的左边区域' },
        { value: 'right', label: '裁剪-不缩放,只显示图片的右边区域' },
      ],
      description: '图片裁剪、缩放的模式',
      group: '基础',
    },
    {
      name: 'lazy-load',
      label: '懒加载',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '图片懒加载,在即将进入一定范围(上下三屏)时才开始加载',
      group: '性能',
    },
    {
      name: 'show-menu-by-longpress',
      label: '长按显示菜单',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '长按图片显示识别小程序码菜单',
      group: '交互',
    },
  ],
  events: [
    {
      name: 'binderror',
      label: '加载失败',
      description: '当错误发生时触发',
      params: [
        { name: 'event.detail.errMsg', type: 'String', description: '错误信息' },
      ],
    },
    {
      name: 'bindload',
      label: '加载完成',
      description: '当图片载入完毕时触发',
      params: [
        { name: 'event.detail.width', type: 'Number', description: '图片宽度' },
        { name: 'event.detail.height', type: 'Number', description: '图片高度' },
      ],
    },
    tapEvent,
    longtapEvent,
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/image.html',
};

// ============================================================================
// 组件库
// ============================================================================

/**
 * 微信小程序组件库
 */
export class WxComponentLibrary {
  private components: Map<string, ComponentLibraryItem> = new Map();
  private categoryIndex: Map<ComponentCategory, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeComponents();
    this.buildIndexes();
  }

  /**
   * 初始化组件库
   */
  private initializeComponents(): void {
    // 视图容器
    this.addComponent(viewComponent);
    this.addComponent(scrollViewComponent);

    // 基础内容
    this.addComponent(textComponent);
    this.addComponent(iconComponent);

    // 表单组件
    this.addComponent(buttonComponent);
    this.addComponent(inputComponent);
    this.addComponent(checkboxComponent);

    // 媒体组件
    this.addComponent(imageComponent);

    // TODO: 添加更多组件
  }

  /**
   * 添加组件到库
   */
  private addComponent(component: ComponentLibraryItem): void {
    this.components.set(component.id, component);
  }

  /**
   * 构建索引
   */
  private buildIndexes(): void {
    this.components.forEach((component) => {
      // 分类索引
      if (!this.categoryIndex.has(component.category)) {
        this.categoryIndex.set(component.category, new Set());
      }
      this.categoryIndex.get(component.category)!.add(component.id);

      // 标签索引
      component.tags?.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(component.id);
      });
    });
  }

  /**
   * 获取组件
   */
  getComponent(id: string): ComponentLibraryItem | undefined {
    return this.components.get(id);
  }

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentLibraryItem[] {
    return Array.from(this.components.values());
  }

  /**
   * 按分类获取组件
   */
  getComponentsByCategory(category: ComponentCategory): ComponentLibraryItem[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((comp): comp is ComponentLibraryItem => comp !== undefined);
  }

  /**
   * 按标签获取组件
   */
  getComponentsByTag(tag: string): ComponentLibraryItem[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((comp): comp is ComponentLibraryItem => comp !== undefined);
  }

  /**
   * 搜索组件
   */
  searchComponents(query: string): ComponentLibraryItem[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllComponents().filter((component) => {
      return (
        component.name.toLowerCase().includes(lowerQuery) ||
        component.label.toLowerCase().includes(lowerQuery) ||
        component.description?.toLowerCase().includes(lowerQuery) ||
        component.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * 获取所有分类
   */
  getCategories(): ComponentCategory[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * 获取所有标签
   */
  getTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }
}

// 导出默认实例
export const wxComponentLibrary = new WxComponentLibrary();
