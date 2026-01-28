import type { MiniProgramProject, Page, WindowConfig, ProjectConfig } from '@/types/miniprogram';

// 默认窗口配置
export const DEFAULT_WINDOW_CONFIG: WindowConfig = {
  navigationBarTitleText: '小程序',
  navigationBarBackgroundColor: '#000000',
  navigationBarTextStyle: 'white',
  backgroundColor: '#ffffff',
  backgroundTextStyle: 'light',
  enablePullDownRefresh: false,
};

// 默认项目配置
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  pages: ['pages/index/index'],
  window: DEFAULT_WINDOW_CONFIG,
  debug: false,
};

// 创建默认页面
export const createDefaultPage = (id: string, name: string, path: string): Page => ({
  id,
  name,
  path,
  components: [],
  pageData: {},
  lifecycleEvents: [],
  styles: {},
  config: {
    navigationBarTitleText: name,
  },
});

// 创建默认项目
export const createDefaultProject = (id: string, name: string): Omit<MiniProgramProject, 'pages'> => ({
  id,
  name,
  description: '',
  appId: '',
  version: '1.0.0',
  config: { ...DEFAULT_PROJECT_CONFIG },
  globalStyles: {},
  customComponents: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastOpened: Date.now(),
});

// 设备预设尺寸
export const DEVICE_PRESETS = [
  { name: 'iPhone 6/7/8', width: 375, height: 667 },
  { name: 'iPhone 6/7/8 Plus', width: 414, height: 736 },
  { name: 'iPhone X/XS', width: 375, height: 812 },
  { name: 'iPhone XR/11', width: 414, height: 896 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 12/13 Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Android', width: 360, height: 640 },
];

// 默认设备
export const DEFAULT_DEVICE = DEVICE_PRESETS[0];

// 画布缩放选项
export const ZOOM_OPTIONS = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
];

// 默认缩放
export const DEFAULT_ZOOM = 1;

// 网格大小
export const GRID_SIZE = 10;

// 吸附阈值
export const SNAP_THRESHOLD = 5;
