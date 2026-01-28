/**
 * 微信小程序内置组件定义
 *
 * 媒体组件：image, video, audio, camera
 */

import {
  ComponentDefinition,
  ComponentCategory,
  PropertyType,
} from './types';

/**
 * image 组件
 */
export const imageComponent: ComponentDefinition = {
  id: 'wechat-image',
  name: 'image',
  label: 'Image 图片',
  description: '图片组件',
  category: ComponentCategory.Media,
  icon: 'icon-image',
  tags: ['图片', '媒体'],
  canHaveChildren: false,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'src',
      label: '图片源',
      type: PropertyType.Image,
      description: '图片资源地址',
      required: true,
    },
    {
      name: 'mode',
      label: '缩放裁剪模式',
      type: PropertyType.Enum,
      defaultValue: 'scaleToFill',
      description: '图片裁剪、缩放的模式',
      options: [
        { value: 'scaleToFill', label: '缩放填充' },
        { value: 'aspectFit', label: '按比例缩放' },
        { value: 'aspectFill', label: '按比例裁剪' },
        { value: 'widthFix', label: '宽度固定' },
        { value: 'top', label: '顶部裁剪' },
        { value: 'bottom', label: '底部裁剪' },
        { value: 'center', label: '中间裁剪' },
        { value: 'left', label: '左边裁剪' },
        { value: 'right', label: '右边裁剪' },
        { value: 'top left', label: '左上裁剪' },
        { value: 'top right', label: '右上裁剪' },
        { value: 'bottom left', label: '左下裁剪' },
        { value: 'bottom right', label: '右下裁剪' },
      ],
    },
    {
      name: 'lazy-load',
      label: '懒加载',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '图片懒加载',
    },
    {
      name: 'show-menu-by-longpress',
      label: '长按显示菜单',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '长按图片时显示发送给朋友、收藏、保存图片等菜单',
    },
    {
      name: 'loading',
      label: '加载中类名',
      type: PropertyType.String,
      description: '图片加载中时显示的类名',
    },
    {
      name: 'error',
      label: '加载失败类名',
      type: PropertyType.String,
      description: '图片加载失败时显示的类名',
    },
    {
      name: 'draggable',
      label: '可拖拽',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '图片是否可拖拽',
    },
  ],
  events: [
    {
      name: 'load',
      label: '加载完成',
      description: '图片加载完成时触发',
    },
    {
      name: 'error',
      label: '加载失败',
      description: '图片加载失败时触发',
    },
    {
      name: 'tap',
      label: '点击',
      description: '图片被点击时触发',
    },
    {
      name: 'longpress',
      label: '长按',
      description: '图片被长按时触发',
    },
  ],
  example: '<image src="https://example.com/image.png" mode="scaleToFill"></image>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/image.html',
};

/**
 * video 组件
 */
export const videoComponent: ComponentDefinition = {
  id: 'wechat-video',
  name: 'video',
  label: 'Video 视频',
  description: '视频播放组件',
  category: ComponentCategory.Media,
  icon: 'icon-video',
  tags: ['视频', '媒体'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'src',
      label: '视频源',
      type: PropertyType.String,
      description: '视频资源的地址',
      required: true,
    },
    {
      name: 'duration',
      label: '时长',
      type: PropertyType.Number,
      description: '指定视频时长',
      unit: 's',
    },
    {
      name: 'controls',
      label: '显示控制',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示默认播放控件',
    },
    {
      name: 'danmu-list',
      label: '弹幕列表',
      type: PropertyType.Array,
      description: '弹幕列表',
    },
    {
      name: 'danmu-btn',
      label: '显示弹幕按钮',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否展示弹幕按钮',
    },
    {
      name: 'enable-danmu',
      label: '启用弹幕',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否启用弹幕',
    },
    {
      name: 'autoplay',
      label: '自动播放',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否自动播放',
    },
    {
      name: 'loop',
      label: '循环播放',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否循环播放',
    },
    {
      name: 'muted',
      label: '静音',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否静音播放',
    },
    {
      name: 'initial-time',
      label: '初始播放位置',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      description: '指定视频初始播放位置',
      unit: 's',
    },
    {
      name: 'page-gesture',
      label: '页面手势',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '在非全屏模式下，是否启用亮度与音量调节手势',
    },
    {
      name: 'enable-progress-gesture',
      label: '启用进度手势',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否启用进度条手势',
    },
    {
      name: 'show-progress',
      label: '显示进度',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '若不设置，宽度大于 240 时才会显示',
    },
    {
      name: 'show-fullscreen-btn',
      label: '显示全屏按钮',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示全屏按钮',
    },
    {
      name: 'show-play-btn',
      label: '显示播放按钮',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示视频底部控制栏的播放按钮',
    },
    {
      name: 'show-center-play-btn',
      label: '显示中心播放按钮',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示视频中间的播放按钮',
    },
    {
      name: 'picture-in-picture-mode',
      label: '画中画模式',
      type: PropertyType.Array,
      description: '设置小窗模式',
    },
    {
      name: 'poster',
      label: '封面',
      type: PropertyType.Image,
      description: '视频封面的图片网络资源地址',
    },
    {
      name: 'object-fit',
      label: '图片缩放',
      type: PropertyType.Enum,
      defaultValue: 'contain',
      description: '当视频大小与 video 容器大小不一致时的处理方式',
      options: [
        { value: 'contain', label: '包含' },
        { value: 'fill', label: '填充' },
        { value: 'cover', label: '覆盖' },
      ],
    },
    {
      name: 'object-position',
      label: '图片位置',
      type: PropertyType.String,
      description: '视频的位置',
    },
    {
      name: 'ad-unit-id',
      label: '广告单元ID',
      type: PropertyType.String,
      description: '广告单元 id',
    },
    {
      name: 'vslip-duration',
      label: '快进快退时长',
      type: PropertyType.Number,
      description: '快进快退的时长',
      unit: 'ms',
    },
  ],
  events: [
    {
      name: 'play',
      label: '播放',
      description: '当开始/继续播放时触发',
    },
    {
      name: 'pause',
      label: '暂停',
      description: '当暂停播放时触发',
    },
    {
      name: 'ended',
      label: '结束',
      description: '当播放到末尾时触发',
    },
    {
      name: 'timeupdate',
      label: '时间更新',
      description: '播放进度变化时触发',
    },
    {
      name: 'fullscreenchange',
      label: '全屏变化',
      description: '进入或退出全屏时触发',
    },
    {
      name: 'loading',
      label: '加载',
      description: '视频出现缓冲时触发',
    },
    {
      name: 'error',
      label: '错误',
      description: '视频播放出错时触发',
    },
  ],
  example: '<video src="https://example.com/video.mp4" controls></video>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/video.html',
};

/**
 * audio 组件
 */
export const audioComponent: ComponentDefinition = {
  id: 'wechat-audio',
  name: 'audio',
  label: 'Audio 音频',
  description: '音频组件',
  category: ComponentCategory.Media,
  icon: 'icon-audio',
  tags: ['音频', '媒体'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'id',
      label: '音频ID',
      type: PropertyType.String,
      description: '音频组件的唯一标识',
    },
    {
      name: 'src',
      label: '音频源',
      type: PropertyType.String,
      description: '音频资源的地址',
      required: true,
    },
    {
      name: 'loop',
      label: '循环播放',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否循环播放',
    },
    {
      name: 'controls',
      label: '显示控制',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示默认控制组件',
    },
    {
      name: 'poster',
      label: '封面',
      type: PropertyType.Image,
      description: '音频封面的图片网络资源地址',
    },
    {
      name: 'name',
      label: '音频名称',
      type: PropertyType.String,
      description: 'audio 的名称',
    },
    {
      name: 'author',
      label: '作者',
      type: PropertyType.String,
      description: 'audio 的作者',
    },
  ],
  events: [
    {
      name: 'play',
      label: '播放',
      description: '当开始播放时触发',
    },
    {
      name: 'pause',
      label: '暂停',
      description: '当暂停播放时触发',
    },
    {
      name: 'ended',
      label: '结束',
      description: '当播放到末尾时触发',
    },
    {
      name: 'timeupdate',
      label: '时间更新',
      description: '播放进度变化时触发',
    },
    {
      name: 'error',
      label: '错误',
      description: '音频播放出错时触发',
    },
  ],
  example: '<audio src="https://example.com/audio.mp3" controls></audio>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/audio.html',
};

/**
 * camera 组件
 */
export const cameraComponent: ComponentDefinition = {
  id: 'wechat-camera',
  name: 'camera',
  label: 'Camera 相机',
  description: '相机组件',
  category: ComponentCategory.Media,
  icon: 'icon-camera',
  tags: ['相机', '媒体'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'device-position',
      label: '摄像头位置',
      type: PropertyType.Enum,
      defaultValue: 'back',
      description: '摄像头的朝向',
      options: [
        { value: 'front', label: '前置' },
        { value: 'back', label: '后置' },
      ],
    },
    {
      name: 'flash',
      label: '闪光灯',
      type: PropertyType.Enum,
      defaultValue: 'auto',
      description: '闪光灯，值为 on, off, auto',
      options: [
        { value: 'on', label: '开' },
        { value: 'off', label: '关' },
        { value: 'auto', label: '自动' },
      ],
    },
    {
      name: 'frame-size',
      label: '分辨率',
      type: PropertyType.String,
      defaultValue: 'medium',
      description: '指定期望的相机帧数据大小',
    },
    {
      name: 'alpha',
      label: '透明度',
      type: PropertyType.Number,
      defaultValue: 1,
      min: 0,
      max: 1,
      description: '相机组件的透明度',
    },
  ],
  events: [
    {
      name: 'stop',
      label: '停止',
      description: '摄像头在未停止时',
    },
    {
      name: 'error',
      label: '错误',
      description: '用户不允许使用摄像头时',
    },
    {
      name: 'initdone',
      label: '初始化完成',
      description: '相机初始化完成时',
    },
    {
      name: 'scancode',
      label: '扫码',
      description: '扫码识别的结果',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/camera.html',
};

export const builtinMediaComponents = [
  imageComponent,
  videoComponent,
  audioComponent,
  cameraComponent,
];
