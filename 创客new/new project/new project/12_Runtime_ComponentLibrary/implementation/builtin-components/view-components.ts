/**
 * 微信小程序内置组件定义
 *
 * 视图容器组件：view, scroll-view, swiper, movable-view 等
 */

import {
  ComponentDefinition,
  ComponentCategory,
  PropertyType,
  EventDefinition,
  PropertyDefinition,
} from './types';

/**
 * view 组件 - 基础视图容器
 */
export const viewComponent: ComponentDefinition = {
  id: 'wechat-view',
  name: 'view',
  label: 'View 容器',
  description: '基础视图容器，类似 HTML 中的 div',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-view',
  tags: ['容器', '基础'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'hover-class',
      label: '按下状态样式类',
      type: PropertyType.String,
      defaultValue: 'none',
      description: '指定按下去的样式类。当 hover-class="none" 时，没有点击态效果',
    },
    {
      name: 'hover-stop-propagation',
      label: '阻止冒泡',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '指定是否阻止本节点的祖先节点出现点击态',
    },
    {
      name: 'hover-start-time',
      label: '按下延迟时间',
      type: PropertyType.Number,
      defaultValue: 50,
      min: 0,
      description: '按住后多久出现点击态，单位毫秒',
      unit: 'ms',
    },
    {
      name: 'hover-stay-time',
      label: '松开后保持时间',
      type: PropertyType.Number,
      defaultValue: 400,
      min: 0,
      description: '手指松开后点击态保留时间，单位毫秒',
      unit: 'ms',
    },
  ],
  events: [
    {
      name: 'tap',
      label: '点击',
      description: '组件被点击时触发',
    },
    {
      name: 'longpress',
      label: '长按',
      description: '组件被长按时触发',
    },
  ],
  defaultStyle: {
    display: 'block',
  },
  example: '<view class="container">\n  <view>Hello World</view>\n</view>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/view.html',
};

/**
 * scroll-view 组件 - 可滚动的容器
 */
export const scrollViewComponent: ComponentDefinition = {
  id: 'wechat-scroll-view',
  name: 'scroll-view',
  label: 'ScrollView 滚动容器',
  description: '可滚动的视图容器',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-scroll',
  tags: ['容器', '滚动'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'scroll-x',
      label: '水平滚动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '允许横向滚动',
    },
    {
      name: 'scroll-y',
      label: '垂直滚动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '允许纵向滚动',
    },
    {
      name: 'upper-threshold',
      label: '上拉距离',
      type: PropertyType.Number,
      defaultValue: 50,
      min: 0,
      description: '距顶部/左边多远时（单位px），触发 scrolltoupper 事件',
      unit: 'px',
    },
    {
      name: 'lower-threshold',
      label: '下拉距离',
      type: PropertyType.Number,
      defaultValue: 50,
      min: 0,
      description: '距底部/右边多远时（单位px），触发 scrolltolower 事件',
      unit: 'px',
    },
    {
      name: 'scroll-into-view',
      label: '滚动到元素',
      type: PropertyType.String,
      description: '值应为某子元素id（id不能以数字开头）',
    },
    {
      name: 'scroll-left',
      label: '水平滚动位置',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '设置竖直方向滚动条位置',
      unit: 'px',
    },
    {
      name: 'scroll-top',
      label: '垂直滚动位置',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '设置竖直方向滚动条位置',
      unit: 'px',
    },
    {
      name: 'enable-flex',
      label: '启用 Flex 布局',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '启用 flexbox 布局',
    },
  ],
  events: [
    {
      name: 'scrolltoupper',
      label: '滚到顶部',
      description: '滚动到顶部时触发',
    },
    {
      name: 'scrolltolower',
      label: '滚到底部',
      description: '滚动到底部时触发',
    },
    {
      name: 'scroll',
      label: '滚动中',
      description: '滚动时触发',
      params: [
        {
          name: 'detail',
          type: 'object',
          description: '包含 scrollLeft 和 scrollTop',
        },
      ],
    },
  ],
  example: '<scroll-view scroll-y style="height: 100px;">\n  <view>Item 1</view>\n</scroll-view>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/scroll-view.html',
};

/**
 * swiper 组件 - 轮播图
 */
export const swiperComponent: ComponentDefinition = {
  id: 'wechat-swiper',
  name: 'swiper',
  label: 'Swiper 轮播图',
  description: '滑块视图容器，用于实现轮播图等功能',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-swiper',
  tags: ['容器', '轮播'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  allowedChildren: ['swiper-item'],
  properties: [
    {
      name: 'autoplay',
      label: '自动播放',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否自动切换',
    },
    {
      name: 'interval',
      label: '自动切换间隔',
      type: PropertyType.Number,
      defaultValue: 5000,
      min: 0,
      description: '自动切换时间间隔，单位毫秒',
      unit: 'ms',
    },
    {
      name: 'duration',
      label: '动画时长',
      type: PropertyType.Number,
      defaultValue: 500,
      min: 0,
      description: '滑动动画时长，单位毫秒',
      unit: 'ms',
    },
    {
      name: 'current',
      label: '当前项索引',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      description: '当前所在滑块的 index',
    },
    {
      name: 'circular',
      label: '循环播放',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否采用衔接滑动',
    },
    {
      name: 'vertical',
      label: '纵向',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '滑动方向是否为纵向',
    },
    {
      name: 'display-multiple-items',
      label: '显示数量',
      type: PropertyType.Number,
      defaultValue: 1,
      min: 1,
      description: '同时显示的滑块数量',
    },
    {
      name: 'indicator-dots',
      label: '显示指示点',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否显示面板指示点',
    },
    {
      name: 'indicator-color',
      label: '指示点颜色',
      type: PropertyType.Color,
      defaultValue: 'rgba(0, 0, 0, 0.3)',
      description: '指示点颜色',
    },
    {
      name: 'indicator-active-color',
      label: '活跃指示点颜色',
      type: PropertyType.Color,
      defaultValue: '#000000',
      description: '当前选中的指示点颜色',
    },
  ],
  events: [
    {
      name: 'change',
      label: '切换',
      description: '当前 slide 变化时会触发 change 事件',
    },
  ],
  example: '<swiper indicator-dots="true" autoplay="true">\n  <swiper-item>Item 1</swiper-item>\n</swiper>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html',
};

/**
 * swiper-item 组件
 */
export const swiperItemComponent: ComponentDefinition = {
  id: 'wechat-swiper-item',
  name: 'swiper-item',
  label: 'Swiper Item',
  description: 'swiper 的子元素，只能是 swiper 的直接子节点',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-swiper-item',
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  allowedParents: ['swiper'],
  properties: [],
  events: [],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html#swiper-item',
};

/**
 * movable-view 组件 - 可拖拽的元素
 */
export const movableViewComponent: ComponentDefinition = {
  id: 'wechat-movable-view',
  name: 'movable-view',
  label: 'Movable View 可拖拽',
  description: '可拖拽的视图容器',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-movable',
  tags: ['容器', '拖拽'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'direction',
      label: '拖拽方向',
      type: PropertyType.Enum,
      defaultValue: 'none',
      description: '运动方向',
      options: [
        { value: 'none', label: '不可拖拽' },
        { value: 'all', label: '全方向' },
        { value: 'horizontal', label: '水平' },
        { value: 'vertical', label: '垂直' },
      ],
    },
    {
      name: 'inertia',
      label: '惯性滑动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用惯性滑动',
    },
    {
      name: 'x',
      label: 'X位置',
      type: PropertyType.Number,
      defaultValue: 0,
      description: 'X坐标，单位px',
      unit: 'px',
    },
    {
      name: 'y',
      label: 'Y位置',
      type: PropertyType.Number,
      defaultValue: 0,
      description: 'Y坐标，单位px',
      unit: 'px',
    },
  ],
  events: [
    {
      name: 'change',
      label: '位置变化',
      description: '拖拽过程中触发的事件，event.detail = {x, y, source}',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/movable-view.html',
};

/**
 * cover-view 组件 - 覆盖容器
 */
export const coverViewComponent: ComponentDefinition = {
  id: 'wechat-cover-view',
  name: 'cover-view',
  label: 'CoverView 覆盖容器',
  description: '覆盖在原生组件上的视图',
  category: ComponentCategory.ViewContainer,
  icon: 'icon-cover',
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'scroll-top',
      label: '滚动顶部位置',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '设置覆盖物的竖直滚动条位置',
      unit: 'px',
    },
  ],
  events: [],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/cover-view.html',
};

export const builtinViewComponents = [
  viewComponent,
  scrollViewComponent,
  swiperComponent,
  swiperItemComponent,
  movableViewComponent,
  coverViewComponent,
];
