/**
 * 微信小程序内置组件定义
 *
 * 表单组件：button, input, checkbox, form, picker, radio, slider, switch, textarea
 */

import {
  ComponentDefinition,
  ComponentCategory,
  PropertyType,
} from './types';

/**
 * button 组件
 */
export const buttonComponent: ComponentDefinition = {
  id: 'wechat-button',
  name: 'button',
  label: 'Button 按钮',
  description: '按钮组件',
  category: ComponentCategory.Form,
  icon: 'icon-button',
  tags: ['按钮', '表单'],
  canHaveChildren: true,
  isContainer: true,
  isInline: true,
  properties: [
    {
      name: 'size',
      label: '按钮大小',
      type: PropertyType.Enum,
      defaultValue: 'default',
      description: '按钮的大小',
      options: [
        { value: 'default', label: '默认大小' },
        { value: 'mini', label: '小尺寸' },
      ],
    },
    {
      name: 'type',
      label: '按钮类型',
      type: PropertyType.Enum,
      defaultValue: 'default',
      description: '按钮的样式类型',
      options: [
        { value: 'primary', label: '主色' },
        { value: 'default', label: '默认' },
        { value: 'warn', label: '警告' },
      ],
    },
    {
      name: 'plain',
      label: '镂空',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '按钮是否镂空，背景色透明',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用按钮',
    },
    {
      name: 'loading',
      label: '加载中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '名字前是否带 loading 图标',
    },
    {
      name: 'form-type',
      label: '表单操作',
      type: PropertyType.Enum,
      description: '用于 form 组件，点击分别会触发 form 组件的 submit/reset 事件',
      options: [
        { value: 'submit', label: '提交' },
        { value: 'reset', label: '重置' },
      ],
    },
    {
      name: 'open-type',
      label: '开放能力',
      type: PropertyType.Enum,
      description: '微信开放能力',
      options: [
        { value: 'contact', label: '打开客服' },
        { value: 'share', label: '分享' },
        { value: 'getUserInfo', label: '获取用户信息' },
        { value: 'getPhoneNumber', label: '获取用户手机号' },
        { value: 'getUserProfile', label: '获取用户信息（新）' },
        { value: 'launchApp', label: '启动 App' },
        { value: 'openSetting', label: '打开设置' },
        { value: 'feedback', label: '打开反馈页' },
        { value: 'chooseAvatar', label: '选择头像' },
      ],
    },
    {
      name: 'hover-class',
      label: '按下状态样式类',
      type: PropertyType.String,
      defaultValue: 'button-hover',
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
      label: '松开后保持时间',
      type: PropertyType.Number,
      defaultValue: 70,
      min: 0,
      description: '手指松开后点击态保留时间',
      unit: 'ms',
    },
  ],
  events: [
    {
      name: 'tap',
      label: '点击',
      description: '按钮被点击时触发',
    },
    {
      name: 'getphonenumber',
      label: '获取手机号',
      description: 'open-type="getPhoneNumber" 时使用',
    },
    {
      name: 'getuserinfo',
      label: '获取用户信息',
      description: 'open-type="getUserInfo" 时使用',
    },
    {
      name: 'getUserProfile',
      label: '获取用户信息（新）',
      description: 'open-type="getUserProfile" 时使用',
    },
    {
      name: 'error',
      label: '错误',
      description: '当使用开放能力时，调用失败的回调',
    },
    {
      name: 'opensetting',
      label: '打开设置',
      description: 'open-type="openSetting" 时使用',
    },
  ],
  example: '<button type="primary">按钮</button>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/button.html',
};

/**
 * input 组件
 */
export const inputComponent: ComponentDefinition = {
  id: 'wechat-input',
  name: 'input',
  label: 'Input 输入框',
  description: '输入框组件',
  category: ComponentCategory.Form,
  icon: 'icon-input',
  tags: ['输入', '表单'],
  canHaveChildren: false,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'type',
      label: '输入类型',
      type: PropertyType.Enum,
      defaultValue: 'text',
      description: '输入框的类型',
      options: [
        { value: 'text', label: '文本' },
        { value: 'number', label: '数字' },
        { value: 'idcard', label: '身份证' },
        { value: 'digit', label: '小数' },
        { value: 'tel', label: '电话' },
        { value: 'safe-password', label: '安全密码' },
        { value: 'nickname', label: '昵称' },
      ],
    },
    {
      name: 'password',
      label: '密码输入',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否是密码类型',
    },
    {
      name: 'placeholder',
      label: '占位符',
      type: PropertyType.String,
      description: '输入框为空时占位符',
    },
    {
      name: 'placeholder-style',
      label: '占位符样式',
      type: PropertyType.String,
      description: '指定 placeholder 的样式',
    },
    {
      name: 'placeholder-class',
      label: '占位符样式类',
      type: PropertyType.String,
      description: '指定 placeholder 的样式类',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'maxlength',
      label: '最大长度',
      type: PropertyType.Number,
      defaultValue: 140,
      min: 0,
      description: '最大输入长度',
    },
    {
      name: 'cursor-spacing',
      label: '光标距键盘距离',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      description: '指定光标与键盘的距离',
      unit: 'px',
    },
    {
      name: 'auto-focus',
      label: '自动焦点',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '自动获得焦点',
    },
    {
      name: 'focus',
      label: '获得焦点',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '获得焦点',
    },
    {
      name: 'confirm-type',
      label: '确认按钮',
      type: PropertyType.Enum,
      defaultValue: 'done',
      description: '设置键盘右下角按钮的文字',
      options: [
        { value: 'send', label: '发送' },
        { value: 'search', label: '搜索' },
        { value: 'next', label: '下一个' },
        { value: 'go', label: '前往' },
        { value: 'done', label: '完成' },
      ],
    },
    {
      name: 'confirm-hold',
      label: '确认按钮保持',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '点击确认按钮时是否保持键盘不收起',
    },
    {
      name: 'cursor',
      label: '光标位置',
      type: PropertyType.Number,
      description: '指定光标位置',
    },
    {
      name: 'selection-start',
      label: '选中开始位置',
      type: PropertyType.Number,
      defaultValue: -1,
      description: '选中文本的开始位置',
    },
    {
      name: 'selection-end',
      label: '选中结束位置',
      type: PropertyType.Number,
      defaultValue: -1,
      description: '选中文本的结束位置',
    },
  ],
  events: [
    {
      name: 'input',
      label: '输入',
      description: '当键盘输入时，触发 input 事件',
    },
    {
      name: 'focus',
      label: '获焦',
      description: '输入框聚焦时触发',
    },
    {
      name: 'blur',
      label: '失焦',
      description: '输入框失焦时触发',
    },
    {
      name: 'confirm',
      label: '完成输入',
      description: '点击完成按钮时触发',
    },
    {
      name: 'keyboardheightchange',
      label: '键盘高度变化',
      description: '键盘高度发生变化的时候触发此事件',
    },
  ],
  example: '<input type="text" placeholder="请输入内容" />',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/input.html',
};

/**
 * checkbox 组件
 */
export const checkboxComponent: ComponentDefinition = {
  id: 'wechat-checkbox',
  name: 'checkbox',
  label: 'Checkbox 复选框',
  description: '复选框组件',
  category: ComponentCategory.Form,
  icon: 'icon-checkbox',
  tags: ['复选', '表单'],
  canHaveChildren: true,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'value',
      label: '值',
      type: PropertyType.String,
      description: 'checkbox 标识，选中时触发 checkbox-group 的 change 事件',
      required: true,
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'checked',
      label: '选中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '当前是否选中',
    },
    {
      name: 'color',
      label: '颜色',
      type: PropertyType.Color,
      defaultValue: '#09BB07',
      description: 'checkbox 的颜色',
    },
  ],
  events: [
    {
      name: 'change',
      label: '变化',
      description: '选中状态改变时触发',
    },
  ],
  example: '<checkbox value="yes">选项</checkbox>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/checkbox.html',
};

/**
 * checkbox-group 组件
 */
export const checkboxGroupComponent: ComponentDefinition = {
  id: 'wechat-checkbox-group',
  name: 'checkbox-group',
  label: 'CheckboxGroup 复选框组',
  description: '复选框组容器',
  category: ComponentCategory.Form,
  icon: 'icon-checkbox-group',
  tags: ['复选', '表单'],
  canHaveChildren: true,
  allowedChildren: ['checkbox'],
  isContainer: true,
  isInline: false,
  properties: [],
  events: [
    {
      name: 'change',
      label: '变化',
      description: 'checkbox-group 中选中项发生改变是触发 change 事件',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/checkbox.html#checkbox-group',
};

/**
 * radio 组件
 */
export const radioComponent: ComponentDefinition = {
  id: 'wechat-radio',
  name: 'radio',
  label: 'Radio 单选框',
  description: '单选框组件',
  category: ComponentCategory.Form,
  icon: 'icon-radio',
  tags: ['单选', '表单'],
  canHaveChildren: true,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'value',
      label: '值',
      type: PropertyType.String,
      description: 'radio 的标识符',
      required: true,
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'checked',
      label: '选中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '当前是否选中',
    },
    {
      name: 'color',
      label: '颜色',
      type: PropertyType.Color,
      defaultValue: '#09BB07',
      description: 'radio 的颜色',
    },
  ],
  events: [
    {
      name: 'change',
      label: '变化',
      description: '选中状态改变时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/radio.html',
};

/**
 * radio-group 组件
 */
export const radioGroupComponent: ComponentDefinition = {
  id: 'wechat-radio-group',
  name: 'radio-group',
  label: 'RadioGroup 单选框组',
  description: '单选框组容器',
  category: ComponentCategory.Form,
  icon: 'icon-radio-group',
  tags: ['单选', '表单'],
  canHaveChildren: true,
  allowedChildren: ['radio'],
  isContainer: true,
  isInline: false,
  properties: [],
  events: [
    {
      name: 'change',
      label: '变化',
      description: 'radio-group 中的选中项发生改变时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/radio.html#radio-group',
};

/**
 * switch 组件
 */
export const switchComponent: ComponentDefinition = {
  id: 'wechat-switch',
  name: 'switch',
  label: 'Switch 开关',
  description: '开关选择器组件',
  category: ComponentCategory.Form,
  icon: 'icon-switch',
  tags: ['开关', '表单'],
  canHaveChildren: false,
  isContainer: false,
  isInline: true,
  properties: [
    {
      name: 'checked',
      label: '选中',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否选中',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'type',
      label: '开关类型',
      type: PropertyType.Enum,
      defaultValue: 'switch',
      description: '开关的类型',
      options: [
        { value: 'switch', label: '开关' },
        { value: 'checkbox', label: '复选框' },
      ],
    },
    {
      name: 'color',
      label: '颜色',
      type: PropertyType.Color,
      defaultValue: '#04BE02',
      description: '开关打开时的背景色',
    },
  ],
  events: [
    {
      name: 'change',
      label: '变化',
      description: 'checked 改变时触发 change 事件',
    },
  ],
  example: '<switch checked="false"></switch>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/switch.html',
};

/**
 * slider 组件
 */
export const sliderComponent: ComponentDefinition = {
  id: 'wechat-slider',
  name: 'slider',
  label: 'Slider 滑块',
  description: '滑块选择器组件',
  category: ComponentCategory.Form,
  icon: 'icon-slider',
  tags: ['滑块', '表单'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'min',
      label: '最小值',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '最小值',
    },
    {
      name: 'max',
      label: '最大值',
      type: PropertyType.Number,
      defaultValue: 100,
      description: '最大值',
    },
    {
      name: 'step',
      label: '步长',
      type: PropertyType.Number,
      defaultValue: 1,
      min: 0,
      description: '步长，取值必须大于 0，且可被 (max - min) 整除',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'value',
      label: '当前值',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '当前取值',
    },
    {
      name: 'color',
      label: '背景色',
      type: PropertyType.Color,
      defaultValue: '#e9e9e9',
      description: '背景条的颜色',
    },
    {
      name: 'selected-color',
      label: '已选颜色',
      type: PropertyType.Color,
      defaultValue: '#1aad19',
      description: '已选择的颜色',
    },
    {
      name: 'activeColor',
      label: '活跃颜色',
      type: PropertyType.Color,
      defaultValue: '#1aad19',
      description: '滑块的颜色',
    },
    {
      name: 'track-size',
      label: '轨道大小',
      type: PropertyType.Number,
      defaultValue: 4,
      min: 0,
      description: '轨道的高度',
      unit: 'px',
    },
    {
      name: 'handle-size',
      label: '滑块大小',
      type: PropertyType.Number,
      defaultValue: 28,
      min: 0,
      description: '滑块的大小',
      unit: 'px',
    },
    {
      name: 'show-value',
      label: '显示当前值',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否显示当前 value',
    },
  ],
  events: [
    {
      name: 'change',
      label: '变化',
      description: '完成一次拖动后触发的事件',
    },
    {
      name: 'changing',
      label: '拖动中',
      description: '拖动过程中触发的事件',
    },
  ],
  example: '<slider min="0" max="100" value="50"></slider>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/slider.html',
};

/**
 * picker 组件
 */
export const pickerComponent: ComponentDefinition = {
  id: 'wechat-picker',
  name: 'picker',
  label: 'Picker 选择器',
  description: '从底部弹起的滚动选择器',
  category: ComponentCategory.Form,
  icon: 'icon-picker',
  tags: ['选择', '表单'],
  canHaveChildren: true,
  isContainer: true,
  isInline: true,
  properties: [
    {
      name: 'mode',
      label: '选择器类型',
      type: PropertyType.Enum,
      defaultValue: 'selector',
      description: '选择器的类型',
      options: [
        { value: 'selector', label: '普通选择器' },
        { value: 'multiSelector', label: '多列选择器' },
        { value: 'time', label: '时间选择' },
        { value: 'date', label: '日期选择' },
        { value: 'region', label: '地区选择' },
      ],
    },
    {
      name: 'range',
      label: '选项数组',
      type: PropertyType.Array,
      description: '当 mode="selector" 时，range 是一个数组',
    },
    {
      name: 'range-key',
      label: '选项对象键',
      type: PropertyType.String,
      description: '当 range 是一个 Object Array 时，通过 range-key 来指定 Object 中 key 的值',
    },
    {
      name: 'value',
      label: '选中值',
      type: PropertyType.Number,
      defaultValue: 0,
      description: '表示选择了 range 中的第几个（下标从 0 开始）',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'start',
      label: '开始日期',
      type: PropertyType.String,
      description: '有效年份 1000-2050',
    },
    {
      name: 'end',
      label: '结束日期',
      type: PropertyType.String,
      description: '有效年份 1000-2050',
    },
    {
      name: 'fields',
      label: '日期字段',
      type: PropertyType.Enum,
      defaultValue: 'day',
      description: '有效值 year,month,day',
      options: [
        { value: 'year', label: '年' },
        { value: 'month', label: '月' },
        { value: 'day', label: '日' },
      ],
    },
  ],
  events: [
    {
      name: 'change',
      label: '变化',
      description: 'value 改变时触发 change 事件',
    },
    {
      name: 'cancel',
      label: '取消',
      description: '用户点击取消时触发',
    },
    {
      name: 'columnchange',
      label: '列变化',
      description: '某一列的值改变时触发',
    },
  ],
  example: '<picker mode="selector" range="[\'苹果\', \'橙子\', \'香蕉\']">选择器</picker>',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/picker.html',
};

/**
 * form 组件
 */
export const formComponent: ComponentDefinition = {
  id: 'wechat-form',
  name: 'form',
  label: 'Form 表单',
  description: '表单容器',
  category: ComponentCategory.Form,
  icon: 'icon-form',
  tags: ['表单'],
  canHaveChildren: true,
  isContainer: true,
  isInline: false,
  properties: [
    {
      name: 'report-submit',
      label: '上报提交',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否返回 formId 用于发送模板消息',
    },
    {
      name: 'report-submit-timeout',
      label: '上报超时',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      description: '当 report-submit 为 true 时，form 提交时会返回 formId',
      unit: 'ms',
    },
  ],
  events: [
    {
      name: 'submit',
      label: '提交',
      description: '携带 form 中的数据触发 submit 事件',
    },
    {
      name: 'reset',
      label: '重置',
      description: '表单重置时触发',
    },
  ],
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/form.html',
};

/**
 * textarea 组件
 */
export const textareaComponent: ComponentDefinition = {
  id: 'wechat-textarea',
  name: 'textarea',
  label: 'Textarea 多行输入',
  description: '多行输入框组件',
  category: ComponentCategory.Form,
  icon: 'icon-textarea',
  tags: ['输入', '表单'],
  canHaveChildren: false,
  isContainer: false,
  isInline: false,
  properties: [
    {
      name: 'value',
      label: '值',
      type: PropertyType.String,
      description: '输入框的内容',
    },
    {
      name: 'placeholder',
      label: '占位符',
      type: PropertyType.String,
      description: '输入框为空时占位符',
    },
    {
      name: 'placeholder-style',
      label: '占位符样式',
      type: PropertyType.String,
      description: '指定 placeholder 的样式',
    },
    {
      name: 'placeholder-class',
      label: '占位符样式类',
      type: PropertyType.String,
      description: '指定 placeholder 的样式类',
    },
    {
      name: 'disabled',
      label: '禁用',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否禁用',
    },
    {
      name: 'maxlength',
      label: '最大长度',
      type: PropertyType.Number,
      defaultValue: 140,
      min: 0,
      description: '最大输入长度',
    },
    {
      name: 'auto-height',
      label: '自动高度',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '是否自动增高',
    },
    {
      name: 'fixed',
      label: '固定',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: 'textarea 是否为固定定位',
    },
    {
      name: 'cursor-spacing',
      label: '光标距键盘距离',
      type: PropertyType.Number,
      defaultValue: 0,
      min: 0,
      description: '指定光标与键盘的距离',
      unit: 'px',
    },
    {
      name: 'auto-focus',
      label: '自动焦点',
      type: PropertyType.Boolean,
      defaultValue: false,
      description: '自动获得焦点',
    },
    {
      name: 'show-confirm-bar',
      label: '显示确认栏',
      type: PropertyType.Boolean,
      defaultValue: true,
      description: '是否显示键盘上方带有"完成"按钮那一栏',
    },
  ],
  events: [
    {
      name: 'input',
      label: '输入',
      description: '当键盘输入时，触发 input 事件',
    },
    {
      name: 'focus',
      label: '获焦',
      description: '输入框聚焦时触发',
    },
    {
      name: 'blur',
      label: '失焦',
      description: '输入框失焦时触发',
    },
    {
      name: 'confirm',
      label: '完成',
      description: '点击完成时触发',
    },
    {
      name: 'linechange',
      label: '行数变化',
      description: '输入框行数变化时触发',
    },
  ],
  example: '<textarea placeholder="请输入内容" />',
  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/textarea.html',
};

export const builtinFormComponents = [
  buttonComponent,
  inputComponent,
  checkboxComponent,
  checkboxGroupComponent,
  radioComponent,
  radioGroupComponent,
  switchComponent,
  sliderComponent,
  pickerComponent,
  formComponent,
  textareaComponent,
];
