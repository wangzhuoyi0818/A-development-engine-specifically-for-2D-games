/**
 * 微信小程序内置组件定义
 *
 * 地图、画布、导航和开放能力组件
 */

import {
  ComponentDefinition,
  ComponentCategory,
  PropertyType,
} from './types';

/**
 * map 组件
 */
export const mapComponent: ComponentDefinition = {
  id: 'wechat-map',
  name: 'map',
  label: 'Map 地图',
  description: '地图组件',
  category: ComponentCategory.Map,
  icon: 'icon-map',
  tags: ['地图'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'longitude',
      label: '经度',
      type: PropertyType.Number,
      description: '中心经度',
      required: true,
    },
    {
      name: 'latitude',
      label: '纬度',
      type: PropertyType.Number,
      description: '中心纬度',
      required: true,
    },
    {
      name: 'scale',
      label: '缩放级别',
      type: PropertyType.Number,
      defaultValue: 16,
      min: 3,
      max: 20,
      description: '缩放级别，取值范围为 3-20',
    },
    {
      name: 'min-scale',
      label: '最小缩放级别',
      type: PropertyType.Number,
      defaultValue: 3,
      min: 3,
      max: 20,
      description: '最小缩放级别',
    },
    {
      name: 'max-scale',
      label: '最大缩放级别',
      type: PropertyType.Number,
      defaultValue: 20,
      min: 3,
      max: 20,
      description: '最大缩放级别',
    },
    {
      name: 'markers',
      label: '标记点',
      type: PropertyType.Array,
      description: '标记点数组',
    },
    {
      name: 'polyline',
      label: '路线',
      type: PropertyType.Array,
      description: '路线数组',
    },
    {
      name: 'circles',
      label: '圆形',
      type: PropertyType.Array,
      description: '圆形数组',
    },
    {
      name: 'controls',
      label: '控制',
      type: PropertyType.Array,
      description: '控制点数组',
    },
    {
      name: 'show-location',
      label: '显示位置',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否显示带有方向的当前定位点',
    },
    {
      name: 'polygons',
      label: '多边形',
      type: PropertyType.Array,
      description: '多边形数组',
    },
    {
      name: 'enable-3d',
      label: '启用3D',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用3D',
    },
    {
      name: 'show-compass',
      label: '显示罗盘',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否显示罗盘',
    },
    {
      name: 'enable-overlooking',
      label: '启用俯瞰',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用俯瞰',
    },
    {
      name: 'enable-rotate',
      label: '启用旋转',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用旋转',
    },
    {
      name: 'enable-scroll',
      label: '启用滚动',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否启用滚动',
    },
    {
      name: 'enable-zoom',
      label: '启用缩放',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否启用缩放',
    },
    {
      name: 'enable-saturation',
      label: '启用饱和度',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用饱和度',
    },
    {
      name: 'enable-traffic',
      label: '启用交通',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用实时路况',
    },
    {
      name: 'layer-style',
      label: '图层样式',
      type: PropertyType.Number,
      defaultValue: 1,
      description: '图层样式',
    },
    {
      name: 'setting',
      label: '设置',
      type: PropertyType.Object,
      description: '地图设置',
    },
  ],
  events: [
    {
      name: 'tap',
      label: '点击',
      description: '地图点击时触发',
    },
    {
      name: 'markertap',
      label: '标记点击',
      description: '标记点被点击时触发',
    },
    {
      name: 'controltap',
      label: '控制点击',
      description: '控制点被点击时触发',
    },
    {
      name: 'callouttap',
      label: '信息框点击',
      description: '信息框被点击时触发',
    },
    {
      name: 'updated',
      label: '更新',
      description: '地图渲染更新完成时触发',
    },
    {
      name: 'regionchange',
      label: '区域变化',
      description: '地图区域变化时触发',
    },
    {
      name: 'poitap',
      label: '地点点击',
      description: '点击地图 poi 时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/map.html',
};

/**
 * canvas 组件
 */
export const canvasComponent: ComponentDefinition = {
  id: 'wechat-canvas',
  name: 'canvas',
  label: 'Canvas 画布',
  description: '画布组件',
  category: ComponentCategory.Canvas,
  icon: 'icon-canvas',
  tags: ['画布'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'type',
      label: '渲染上下文类型',
      type: PropertyType.Enum,
      defaultValue: '2d',
      description: '指定 canvas 类型',
      options: [
        { value: '2d', label: '2D 上下文' },
        { value: 'webgl', label: 'WebGL 上下文' },
      ],
    },
    {
      name: 'canvas-id',
      label: '画布ID',
      type: PropertyType.String,
      description: '画布标识，不支持动态修改',
    },
    {
      name: 'disable-scroll',
      label: '禁用滚动',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用滚动',
    },
    {
      name: 'width',
      label: '宽度',
      type: PropertyType.Number,
      defaultValue: 300,
      description: '画布宽度，单位px',
      unit: 'px',
    },
    {
      name: 'height',
      label: '高度',
      type: PropertyType.Number,
      defaultValue: 150,
      description: '画布高度，单位px',
      unit: 'px',
    },
  ],
  events: [
    {
      name: 'touchstart',
      label: '触摸开始',
      description: '触摸开始时触发',
    },
    {
      name: 'touchmove',
      label: '触摸移动',
      description: '触摸移动时触发',
    },
    {
      name: 'touchend',
      label: '触摸结束',
      description: '触摸结束时触发',
    },
    {
      name: 'touchcancel',
      label: '触摸取消',
      description: '触摸被中断时触发',
    },
    {
      name: 'longtap',
      label: '长按',
      description: '长按时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/canvas.html',
};

/**
 * navigator 组件
 */
export const navigatorComponent: ComponentDefinition = {
  id: 'wechat-navigator',
  name: 'navigator',
  label: 'Navigator 导航',
  description: '页面链接跳转',
  category: ComponentCategory.Navigation,
  icon: 'icon-navigator',
  tags: ['导航', '链接'],
  canHaveChildren: true,
  isContainer: true,
  isInline: true,
  properties: [
    {
      name: 'target',
      label: '打开目标',
      type: PropertyType.Enum,
      defaultValue: 'self',
      description: '在哪个目标上发生跳转',
      options: [
        { value: 'self', label: '当前窗口' },
        { value: 'blank', label: '新窗口' },
      ],
    },
    {
      name: 'url',
      label: '链接地址',
      type: PropertyType.String,
      description: '当前小程序内的跳转链接',
      required: true,
    },
    {
      name: 'open-type',
      label: '跳转方式',
      type: PropertyType.Enum,
      defaultValue: 'navigate',
      description: '跳转类型',
      options: [
        { value: 'navigate', label: '保留当前页面' },
        { value: 'redirect', label: '关闭当前页面' },
        { value: 'switchTab', label: '切换 Tab' },
        { value: 'reLaunch', label: '重启应用' },
        { value: 'navigateBack', label: '返回上一页' },
        { value: 'exit', label: '退出小程序' },
      ],
    },
    {
      name: 'delta',
      label: '返回层级',
      type: PropertyType.Number,
      defaultValue: 1,
      min: 0,
      description: '当 open-type 为 navigateBack 时生效',
    },
    {
      name: 'app-id',
      label: '应用ID',
      type: PropertyType.String,
      description: '当 target="blank" 时，跳转的应用 AppId',
    },
    {
      name: 'path',
      label: '路径',
      type: PropertyType.String,
      description: '当 target="blank" 时，跳转的应用路径',
    },
    {
      name: 'extra-data',
      label: '额外数据',
      type: PropertyType.Object,
      description: '当 target="blank" 时，跳转需要传递的数据',
    },
    {
      name: 'version',
      label: '版本',
      type: PropertyType.Enum,
      defaultValue: 'release',
      description: '当 target="blank" 时，跳转的应用版本',
      options: [
        { value: 'stable', label: '稳定版' },
        { value: 'develop', label: '开发版' },
        { value: 'trial', label: '体验版' },
        { value: 'release', label: '正式版' },
      ],
    },
    {
      name: 'hover-class',
      label: '按下样式类',
      type: PropertyType.String,
      defaultValue: 'navigator-hover',
      description: '指定按下去的样式类',
    },
    {
      name: 'hover-start-time',
      label: '按下延迟',
      type: PropertyType.Number,
      defaultValue: 20,
      min: 0,
      description: '按住后多久出现点击态',
      unit: 'ms',
    },
    {
      name: 'hover-stay-time',
      label: '松开保持时间',
      type: PropertyType.Number,
      defaultValue: 600,
      min: 0,
      description: '手指松开后点击态保留时间',
      unit: 'ms',
    },
    {
      name: 'short-code',
      label: '短链',
      type: PropertyType.String,
      description: '当 target="blank" 时，使用短链跳转',
    },
    {
      name: 'show-share-menu',
      label: '显示分享菜单',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否显示分享菜单',
    },
  ],
  events: [
    {
      name: 'success',
      label: '成功',
      description: '当跳转成功时触发',
    },
    {
      name: 'fail',
      label: '失败',
      description: '当跳转失败时触发',
    },
    {
      name: 'complete',
      label: '完成',
      description: '当跳转完成时触发',
    },
  ],
  example: '<navigator url="/pages/index/index">首页</navigator>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/navigator.html',
};

/**
 * web-view 组件
 */
export const webViewComponent: ComponentDefinition = {
  id: 'wechat-web-view',
  name: 'web-view',
  label: 'WebView 网页',
  description: '网页组件',
  category: ComponentCategory.Navigation,
  icon: 'icon-webview',
  tags: ['网页', '导航'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'src',
      label: '网页地址',
      type: PropertyType.String,
      description: '网页链接',
      required: true,
    },
  ],
  events: [
    {
      name: 'message',
      label: '消息',
      description: '网页向小程序 postMessage 时触发',
    },
    {
      name: 'load',
      label: '加载',
      description: '网页加载成功时触发',
    },
    {
      name: 'error',
      label: '错误',
      description: '网页加载失败时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html',
};

/**
 * ad 组件 - 广告
 */
export const adComponent: ComponentDefinition = {
  id: 'wechat-ad',
  name: 'ad',
  label: 'Ad 广告',
  description: '广告组件',
  category: ComponentCategory.OpenAbility,
  icon: 'icon-ad',
  tags: ['广告'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'unit-id',
      label: '广告单元ID',
      type: PropertyType.String,
      description: '广告单元 id',
      required: true,
    },
    {
      name: 'ad-intervals',
      label: '更新间隔',
      type: PropertyType.Number,
      defaultValue: 30,
      min: 10,
      description: '广告自动刷新间隔，单位秒',
      unit: 's',
    },
  ],
  events: [
    {
      name: 'load',
      label: '加载',
      description: '广告加载成功时触发',
    },
    {
      name: 'error',
      label: '错误',
      description: '广告加载失败时触发',
    },
    {
      name: 'close',
      label: '关闭',
      description: '广告被关闭时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/ad.html',
};

/**
 * open-data 组件
 */
export const openDataComponent: ComponentDefinition = {
  id: 'wechat-open-data',
  name: 'open-data',
  label: 'OpenData 开放数据',
  description: '开放数据显示组件',
  category: ComponentCategory.OpenAbility,
  icon: 'icon-open-data',
  tags: ['开放数据'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'type',
      label: '数据类型',
      type: PropertyType.Enum,
      description: '开放数据类型',
      required: true,
      options: [
        { value: 'userNickName', label: '用户昵称' },
        { value: 'userAvatarUrl', label: '用户头像' },
        { value: 'userGender', label: '用户性别' },
        { value: 'userProvince', label: '用户省份' },
        { value: 'userCity', label: '用户城市' },
        { value: 'userCountry', label: '用户国家' },
        { value: 'groupName', label: '群名称' },
      ],
    },
    {
      name: 'lang',
      label: '语言',
      type: PropertyType.Enum,
      description: '用于展示用户昵称的语言',
      options: [
        { value: 'zh_CN', label: '简体中文' },
        { value: 'zh_TW', label: '繁体中文' },
        { value: 'en', label: '英文' },
      ],
    },
  ],
  events: [
    {
      name: 'error',
      label: '错误',
      description: '数据获取失败时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/open-data.html',
};

export const builtinMapCanvasNavigatorComponents = [
  mapComponent,
  canvasComponent,
  navigatorComponent,
  webViewComponent,
  adComponent,
  openDataComponent,
];
