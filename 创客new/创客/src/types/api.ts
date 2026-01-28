// 微信 API 包装器类型定义

// API 分类
export type ApiCategory =
  | 'network'      // 网络
  | 'storage'      // 数据存储
  | 'media'        // 媒体
  | 'location'     // 位置
  | 'file'         // 文件
  | 'device'       // 设备
  | 'ui'           // 界面
  | 'navigation'   // 导航
  | 'open'         // 开放接口
  | 'canvas';      // 画布

// API 参数类型
export type ApiParamType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';

// API 参数定义
export interface ApiParam {
  name: string;
  type: ApiParamType;
  required: boolean;
  defaultValue?: unknown;
  description: string;
  options?: { label: string; value: unknown }[];
}

// API 定义
export interface ApiDefinition {
  id: string;
  name: string;           // wx.xxx
  displayName: string;    // 显示名称
  category: ApiCategory;
  description: string;
  params: ApiParam[];
  returnType: string;
  example?: string;
  deprecated?: boolean;
  minVersion?: string;    // 最低基础库版本
}

// 预定义的微信 API 列表
export const WECHAT_APIS: ApiDefinition[] = [
  // 网络请求
  {
    id: 'request',
    name: 'wx.request',
    displayName: '发起网络请求',
    category: 'network',
    description: '发起 HTTPS 网络请求',
    params: [
      { name: 'url', type: 'string', required: true, description: '请求地址' },
      { name: 'method', type: 'string', required: false, defaultValue: 'GET', description: '请求方法', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ]},
      { name: 'data', type: 'object', required: false, description: '请求参数' },
      { name: 'header', type: 'object', required: false, description: '请求头' },
      { name: 'timeout', type: 'number', required: false, defaultValue: 60000, description: '超时时间' },
    ],
    returnType: 'RequestTask',
  },
  {
    id: 'uploadFile',
    name: 'wx.uploadFile',
    displayName: '上传文件',
    category: 'network',
    description: '上传本地资源到服务器',
    params: [
      { name: 'url', type: 'string', required: true, description: '服务器地址' },
      { name: 'filePath', type: 'string', required: true, description: '文件路径' },
      { name: 'name', type: 'string', required: true, description: '文件对应的 key' },
      { name: 'formData', type: 'object', required: false, description: '额外表单数据' },
    ],
    returnType: 'UploadTask',
  },
  {
    id: 'downloadFile',
    name: 'wx.downloadFile',
    displayName: '下载文件',
    category: 'network',
    description: '下载文件资源到本地',
    params: [
      { name: 'url', type: 'string', required: true, description: '下载地址' },
      { name: 'filePath', type: 'string', required: false, description: '保存路径' },
    ],
    returnType: 'DownloadTask',
  },

  // 数据存储
  {
    id: 'setStorageSync',
    name: 'wx.setStorageSync',
    displayName: '同步存储数据',
    category: 'storage',
    description: '同步将数据存储在本地缓存',
    params: [
      { name: 'key', type: 'string', required: true, description: '键名' },
      { name: 'data', type: 'object', required: true, description: '数据' },
    ],
    returnType: 'void',
  },
  {
    id: 'getStorageSync',
    name: 'wx.getStorageSync',
    displayName: '同步读取数据',
    category: 'storage',
    description: '同步从本地缓存读取数据',
    params: [
      { name: 'key', type: 'string', required: true, description: '键名' },
    ],
    returnType: 'any',
  },
  {
    id: 'removeStorageSync',
    name: 'wx.removeStorageSync',
    displayName: '同步删除数据',
    category: 'storage',
    description: '同步删除本地缓存数据',
    params: [
      { name: 'key', type: 'string', required: true, description: '键名' },
    ],
    returnType: 'void',
  },
  {
    id: 'clearStorageSync',
    name: 'wx.clearStorageSync',
    displayName: '清空本地缓存',
    category: 'storage',
    description: '同步清理本地数据缓存',
    params: [],
    returnType: 'void',
  },

  // 界面交互
  {
    id: 'showToast',
    name: 'wx.showToast',
    displayName: '显示提示',
    category: 'ui',
    description: '显示消息提示框',
    params: [
      { name: 'title', type: 'string', required: true, description: '提示内容' },
      { name: 'icon', type: 'string', required: false, defaultValue: 'success', description: '图标', options: [
        { label: '成功', value: 'success' },
        { label: '加载', value: 'loading' },
        { label: '错误', value: 'error' },
        { label: '无', value: 'none' },
      ]},
      { name: 'duration', type: 'number', required: false, defaultValue: 1500, description: '持续时间' },
      { name: 'mask', type: 'boolean', required: false, defaultValue: false, description: '是否显示遮罩' },
    ],
    returnType: 'void',
  },
  {
    id: 'showModal',
    name: 'wx.showModal',
    displayName: '显示模态框',
    category: 'ui',
    description: '显示模态对话框',
    params: [
      { name: 'title', type: 'string', required: false, description: '标题' },
      { name: 'content', type: 'string', required: false, description: '内容' },
      { name: 'showCancel', type: 'boolean', required: false, defaultValue: true, description: '显示取消按钮' },
      { name: 'cancelText', type: 'string', required: false, defaultValue: '取消', description: '取消按钮文字' },
      { name: 'confirmText', type: 'string', required: false, defaultValue: '确定', description: '确定按钮文字' },
    ],
    returnType: 'Promise<{confirm: boolean, cancel: boolean}>',
  },
  {
    id: 'showLoading',
    name: 'wx.showLoading',
    displayName: '显示加载',
    category: 'ui',
    description: '显示 loading 提示框',
    params: [
      { name: 'title', type: 'string', required: true, description: '提示内容' },
      { name: 'mask', type: 'boolean', required: false, defaultValue: false, description: '是否显示遮罩' },
    ],
    returnType: 'void',
  },
  {
    id: 'hideLoading',
    name: 'wx.hideLoading',
    displayName: '隐藏加载',
    category: 'ui',
    description: '隐藏 loading 提示框',
    params: [],
    returnType: 'void',
  },
  {
    id: 'showActionSheet',
    name: 'wx.showActionSheet',
    displayName: '显示操作菜单',
    category: 'ui',
    description: '显示操作菜单',
    params: [
      { name: 'itemList', type: 'array', required: true, description: '按钮文字数组' },
    ],
    returnType: 'Promise<{tapIndex: number}>',
  },

  // 导航
  {
    id: 'navigateTo',
    name: 'wx.navigateTo',
    displayName: '跳转页面',
    category: 'navigation',
    description: '保留当前页面，跳转到应用内的某个页面',
    params: [
      { name: 'url', type: 'string', required: true, description: '页面路径' },
    ],
    returnType: 'void',
  },
  {
    id: 'redirectTo',
    name: 'wx.redirectTo',
    displayName: '重定向页面',
    category: 'navigation',
    description: '关闭当前页面，跳转到应用内的某个页面',
    params: [
      { name: 'url', type: 'string', required: true, description: '页面路径' },
    ],
    returnType: 'void',
  },
  {
    id: 'switchTab',
    name: 'wx.switchTab',
    displayName: '切换Tab',
    category: 'navigation',
    description: '跳转到 tabBar 页面',
    params: [
      { name: 'url', type: 'string', required: true, description: '页面路径' },
    ],
    returnType: 'void',
  },
  {
    id: 'navigateBack',
    name: 'wx.navigateBack',
    displayName: '返回上页',
    category: 'navigation',
    description: '关闭当前页面，返回上一页面',
    params: [
      { name: 'delta', type: 'number', required: false, defaultValue: 1, description: '返回的页面数' },
    ],
    returnType: 'void',
  },
  {
    id: 'reLaunch',
    name: 'wx.reLaunch',
    displayName: '重启应用',
    category: 'navigation',
    description: '关闭所有页面，打开到应用内的某个页面',
    params: [
      { name: 'url', type: 'string', required: true, description: '页面路径' },
    ],
    returnType: 'void',
  },

  // 位置
  {
    id: 'getLocation',
    name: 'wx.getLocation',
    displayName: '获取位置',
    category: 'location',
    description: '获取当前的地理位置',
    params: [
      { name: 'type', type: 'string', required: false, defaultValue: 'wgs84', description: '坐标类型', options: [
        { label: 'WGS84', value: 'wgs84' },
        { label: 'GCJ02', value: 'gcj02' },
      ]},
      { name: 'altitude', type: 'boolean', required: false, defaultValue: false, description: '是否返回高度信息' },
    ],
    returnType: 'Promise<{latitude: number, longitude: number, ...}>',
  },
  {
    id: 'openLocation',
    name: 'wx.openLocation',
    displayName: '打开位置',
    category: 'location',
    description: '使用微信内置地图查看位置',
    params: [
      { name: 'latitude', type: 'number', required: true, description: '纬度' },
      { name: 'longitude', type: 'number', required: true, description: '经度' },
      { name: 'name', type: 'string', required: false, description: '位置名' },
      { name: 'address', type: 'string', required: false, description: '地址详情' },
      { name: 'scale', type: 'number', required: false, defaultValue: 18, description: '缩放级别' },
    ],
    returnType: 'void',
  },

  // 媒体
  {
    id: 'chooseImage',
    name: 'wx.chooseImage',
    displayName: '选择图片',
    category: 'media',
    description: '从相册选择图片或使用相机拍照',
    params: [
      { name: 'count', type: 'number', required: false, defaultValue: 9, description: '最多可选数量' },
      { name: 'sizeType', type: 'array', required: false, description: '图片尺寸', options: [
        { label: '原图', value: 'original' },
        { label: '压缩图', value: 'compressed' },
      ]},
      { name: 'sourceType', type: 'array', required: false, description: '来源', options: [
        { label: '相册', value: 'album' },
        { label: '相机', value: 'camera' },
      ]},
    ],
    returnType: 'Promise<{tempFilePaths: string[], tempFiles: Object[]}>',
  },
  {
    id: 'previewImage',
    name: 'wx.previewImage',
    displayName: '预览图片',
    category: 'media',
    description: '在新页面中全屏预览图片',
    params: [
      { name: 'urls', type: 'array', required: true, description: '图片链接列表' },
      { name: 'current', type: 'string', required: false, description: '当前显示图片的链接' },
    ],
    returnType: 'void',
  },

  // 设备
  {
    id: 'getSystemInfo',
    name: 'wx.getSystemInfo',
    displayName: '获取系统信息',
    category: 'device',
    description: '获取系统信息',
    params: [],
    returnType: 'Promise<SystemInfo>',
  },
  {
    id: 'getNetworkType',
    name: 'wx.getNetworkType',
    displayName: '获取网络类型',
    category: 'device',
    description: '获取网络类型',
    params: [],
    returnType: 'Promise<{networkType: string}>',
  },
  {
    id: 'makePhoneCall',
    name: 'wx.makePhoneCall',
    displayName: '拨打电话',
    category: 'device',
    description: '拨打电话',
    params: [
      { name: 'phoneNumber', type: 'string', required: true, description: '电话号码' },
    ],
    returnType: 'void',
  },
  {
    id: 'scanCode',
    name: 'wx.scanCode',
    displayName: '扫码',
    category: 'device',
    description: '调起客户端扫码界面',
    params: [
      { name: 'onlyFromCamera', type: 'boolean', required: false, defaultValue: false, description: '是否只能从相机扫码' },
      { name: 'scanType', type: 'array', required: false, description: '扫码类型', options: [
        { label: '一维码', value: 'barCode' },
        { label: '二维码', value: 'qrCode' },
        { label: 'DataMatrix', value: 'datamatrix' },
        { label: 'PDF417', value: 'pdf417' },
      ]},
    ],
    returnType: 'Promise<{result: string, scanType: string, ...}>',
  },
  {
    id: 'setClipboardData',
    name: 'wx.setClipboardData',
    displayName: '设置剪贴板',
    category: 'device',
    description: '设置系统剪贴板的内容',
    params: [
      { name: 'data', type: 'string', required: true, description: '剪贴板内容' },
    ],
    returnType: 'void',
  },
  {
    id: 'getClipboardData',
    name: 'wx.getClipboardData',
    displayName: '获取剪贴板',
    category: 'device',
    description: '获取系统剪贴板的内容',
    params: [],
    returnType: 'Promise<{data: string}>',
  },

  // 开放接口
  {
    id: 'login',
    name: 'wx.login',
    displayName: '登录',
    category: 'open',
    description: '调用接口获取登录凭证（code）',
    params: [
      { name: 'timeout', type: 'number', required: false, description: '超时时间' },
    ],
    returnType: 'Promise<{code: string}>',
  },
  {
    id: 'getUserProfile',
    name: 'wx.getUserProfile',
    displayName: '获取用户信息',
    category: 'open',
    description: '获取用户信息',
    params: [
      { name: 'desc', type: 'string', required: true, description: '声明获取用户个人信息后的用途' },
    ],
    returnType: 'Promise<{userInfo: UserInfo, ...}>',
  },
  {
    id: 'requestPayment',
    name: 'wx.requestPayment',
    displayName: '发起支付',
    category: 'open',
    description: '发起微信支付',
    params: [
      { name: 'timeStamp', type: 'string', required: true, description: '时间戳' },
      { name: 'nonceStr', type: 'string', required: true, description: '随机字符串' },
      { name: 'package', type: 'string', required: true, description: '统一下单接口返回的 prepay_id' },
      { name: 'signType', type: 'string', required: false, defaultValue: 'MD5', description: '签名算法' },
      { name: 'paySign', type: 'string', required: true, description: '签名' },
    ],
    returnType: 'void',
  },
];

// API 分类信息
export const API_CATEGORIES: { key: ApiCategory; label: string; icon: string }[] = [
  { key: 'network', label: '网络', icon: 'GlobalOutlined' },
  { key: 'storage', label: '存储', icon: 'DatabaseOutlined' },
  { key: 'media', label: '媒体', icon: 'PictureOutlined' },
  { key: 'location', label: '位置', icon: 'EnvironmentOutlined' },
  { key: 'file', label: '文件', icon: 'FileOutlined' },
  { key: 'device', label: '设备', icon: 'MobileOutlined' },
  { key: 'ui', label: '界面', icon: 'AppstoreOutlined' },
  { key: 'navigation', label: '导航', icon: 'CompassOutlined' },
  { key: 'open', label: '开放接口', icon: 'ApiOutlined' },
  { key: 'canvas', label: '画布', icon: 'HighlightOutlined' },
];

// 根据分类获取 API
export const getApisByCategory = (category: ApiCategory): ApiDefinition[] => {
  return WECHAT_APIS.filter((api) => api.category === category);
};

// 根据名称搜索 API
export const searchApis = (keyword: string): ApiDefinition[] => {
  const lowerKeyword = keyword.toLowerCase();
  return WECHAT_APIS.filter(
    (api) =>
      api.name.toLowerCase().includes(lowerKeyword) ||
      api.displayName.toLowerCase().includes(lowerKeyword) ||
      api.description.toLowerCase().includes(lowerKeyword)
  );
};
