/**
 * 微信小程序内置组件定义
 *
 * 基础内容组件：text, icon, rich-text, progress 等
 */

import {
  ComponentDefinition,
  ComponentCategory,
  PropertyType,
} from './types';

/**
 * text 组件 - 文本内容
 */
export const textComponent: ComponentDefinition = {
  id: 'wechat-text',
  name: 'text',
  label: 'Text 文本',
  description: '文本组件，只能嵌套 text',
  category: ComponentCategory.BasicContent,
  icon: 'icon-text',
  tags: ['文本', '内容'],
  canHaveChildren: true,
  allowedChildren: ['text'],
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'selectable',
      label: '可选中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '文本是否可选',
    },
    {
      name: 'user-select',
      label: '用户可选',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '文本是否可被用户选中',
    },
    {
      name: 'decode',
      label: '解码 HTML',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否解码 HTML 实体',
    },
    {
      name: 'space',
      label: '空格处理',
      type: PropertyType.Enum,
      defaultValue: 'normal',
      description: '显示的空白处理方式',
      options: [
        { value: 'normal', label: '普通空白' },
        { value: 'ensp', label: '中文空白（半角）' },
        { value: 'emsp', label: '中文空白（全角）' },
        { value: 'nbsp', label: '不换行空格' },
      ],
    },
  ],
  events: [],
  example: '<text>Hello World</text>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/text.html',
};

/**
 * icon 组件 - 图标
 */
export const iconComponent: ComponentDefinition = {
  id: 'wechat-icon',
  name: 'icon',
  label: 'Icon 图标',
  description: '图标组件',
  category: ComponentCategory.BasicContent,
  icon: 'icon-icon',
  tags: ['图标', '内容'],
  canHaveChildren: false,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'type',
      label: '图标类型',
      type: PropertyType.Enum,
      required: true,
      description: '图标类型',
      options: [
        { value: 'success', label: '成功' },
        { value: 'success_no_circle', label: '成功（无圆圈）' },
        { value: 'info', label: '信息' },
        { value: 'warn', label: '警告' },
        { value: 'waiting', label: '等待' },
        { value: 'cancel', label: '取消' },
        { value: 'download', label: '下载' },
        { value: 'search', label: '搜索' },
        { value: 'clear', label: '清除' },
      ],
    },
    {
      name: 'size',
      label: '图标大小',
      type: PropertyType.Number,
      defaultValue: 23,
      min: 0,
      description: '图标大小，单位 px',
      unit: 'px',
    },
    {
      name: 'color',
      label: '图标颜色',
      type: PropertyType.Color,
      description: '图标颜色',
    },
  ],
  events: [],
  example: '<icon type="success" size="23"></icon>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/icon.html',
};

/**
 * rich-text 组件 - 富文本
 */
export const richTextComponent: ComponentDefinition = {
  id: 'wechat-rich-text',
  name: 'rich-text',
  label: 'RichText 富文本',
  description: '富文本组件，支持部分 HTML 标签',
  category: ComponentCategory.BasicContent,
  icon: 'icon-rich-text',
  tags: ['文本', '富文本'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'nodes',
      label: '内容',
      type: PropertyType.Array,
      description: '节点列表，支持字符串或节点对象',
      required: true,
    },
    {
      name: 'space',
      label: '空格处理',
      type: PropertyType.Enum,
      description: '显示的空白处理方式',
      options: [
        { value: 'normal', label: '普通空白' },
        { value: 'ensp', label: '中文空白（半角）' },
        { value: 'emsp', label: '中文空白（全角）' },
        { value: 'nbsp', label: '不换行空格' },
      ],
    },
  ],
  events: [],
  example:
    '<rich-text nodes="[{\n  name: \'div\',\n  attrs: { style: \'color: red;\' },\n  children: [\'Hello World\']\n}]"></rich-text>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/rich-text.html',
};

/**
 * progress 组件 - 进度条
 */
export const progressComponent: ComponentDefinition = {
  id: 'wechat-progress',
  name: 'progress',
  label: 'Progress 进度条',
  description: '进度条显示组件',
  category: ComponentCategory.BasicContent,
  icon: 'icon-progress',
  tags: ['进度', '内容'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'percent',
      label: '进度百分比',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      max: 100,
      description: '百分比 0~100',
    },
    {
      name: 'show-info',
      label: '显示百分比',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '在进度条右侧显示百分比',
    },
    {
      name: 'stroke-width',
      label: '进度条线宽',
      type: PropertyType.Number,
      defaultValue: 6,
      min: 1,
      description: '进度条的宽度，单位px',
      unit: 'px',
    },
    {
      name: 'color',
      label: '进度条颜色',
      type: PropertyType.Color,
      defaultValue: '#09BB07',
      description: '进度条的颜色',
    },
    {
      name: 'activeColor',
      label: '活跃颜色',
      type: PropertyType.Color,
      description: '已选择的进度条的颜色',
    },
    {
      name: 'backgroundColor',
      label: '背景颜色',
      type: PropertyType.Color,
      defaultValue: '#EBEBEB',
      description: '未选择的进度条的颜色',
    },
    {
      name: 'active',
      label: '动画效果',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '进度条从左往右的动画',
    },
    {
      name: 'active-mode',
      label: '动画模式',
      type: PropertyType.Enum,
      defaultValue: 'backwards',
      description: '动画模式',
      options: [
        { value: 'backwards', label: '从起点开始' },
        { value: 'forwards', label: '从终点开始' },
      ],
    },
  ],
  events: [],
  example: '<progress percent="70" show-info="true"></progress>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/progress.html',
};

/**
 * Label 组件
 */
export const labelComponent: ComponentDefinition = {
  id: 'wechat-label',
  name: 'label',
  label: 'Label 标签',
  description: '用来改进表单组件的可用性，使用 for 属性找到对应的 id',
  category: ComponentCategory.BasicContent,
  icon: 'icon-label',
  tags: ['表单', '标签'],
  canHaveChildren: true,
  isContainer: true,
  isInline: true,
  properties: [
    {
      name: 'for',
      label: '关联表单组件',
      type: PropertyType.String,
      description: '绑定控件的 id',
    },
  ],
  events: [],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/label.html',
};

export const builtinContentComponents = [
  textComponent,
  iconComponent,
  richTextComponent,
  progressComponent,
  labelComponent,
];
