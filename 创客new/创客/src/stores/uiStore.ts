import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DEVICE, DEFAULT_ZOOM, DEVICE_PRESETS } from '@/constants/defaults';

interface Device {
  name: string;
  width: number;
  height: number;
}

interface UIStore {
  // 侧边栏状态
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;

  // 画布状态
  zoom: number;
  showGrid: boolean;
  showRuler: boolean;
  snapToGrid: boolean;
  device: Device;

  // 面板状态
  activeLeftPanel: 'pages' | 'components' | 'layers' | 'variables' | 'resources' | 'materials' | 'api';
  activeRightPanel: 'properties' | 'sprite-attrs' | 'events' | 'styles' | 'ai-assistant';

  // 编辑器模式
  editorMode: 'design' | 'preview' | 'code';
  isPlaying: boolean;
  showDebugPanel: boolean;

  // 素材选择模态框
  showMaterialModal: boolean;
  materialModalComponentId: string | null;

  // 操作
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;

  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  toggleGrid: () => void;
  toggleRuler: () => void;
  toggleSnapToGrid: () => void;

  setDevice: (device: Device) => void;
  setDeviceByName: (name: string) => void;

  setActiveLeftPanel: (panel: 'pages' | 'components' | 'layers' | 'variables' | 'resources' | 'materials' | 'api') => void;
  setActiveRightPanel: (panel: 'properties' | 'sprite-attrs' | 'events' | 'styles' | 'ai-assistant') => void;

  setEditorMode: (mode: 'design' | 'preview' | 'code') => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleDebugPanel: () => void;
  setShowDebugPanel: (show: boolean) => void;

  // 素材选择模态框操作
  openMaterialModal: (componentId: string) => void;
  closeMaterialModal: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      leftSidebarWidth: 240,
      rightSidebarWidth: 420,

      zoom: DEFAULT_ZOOM,
      showGrid: true,
      showRuler: true,
      snapToGrid: true,
      device: DEFAULT_DEVICE,

      activeLeftPanel: 'components',
      activeRightPanel: 'properties',

      editorMode: 'design',
      isPlaying: false,
      showDebugPanel: false,

      // 素材选择模态框初始状态
      showMaterialModal: false,
      materialModalComponentId: null,

      // 侧边栏操作
      toggleLeftSidebar: () => {
        set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed }));
      },

      toggleRightSidebar: () => {
        set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed }));
      },

      setLeftSidebarWidth: (width: number) => {
        set({ leftSidebarWidth: Math.max(200, Math.min(400, width)) });
      },

      setRightSidebarWidth: (width: number) => {
        set({ rightSidebarWidth: Math.max(300, Math.min(600, width)) });
      },

      // 缩放操作
      setZoom: (zoom: number) => {
        set({ zoom: Math.max(0.25, Math.min(3, zoom)) });
      },

      zoomIn: () => {
        const { zoom } = get();
        set({ zoom: Math.min(3, zoom + 0.25) });
      },

      zoomOut: () => {
        const { zoom } = get();
        set({ zoom: Math.max(0.25, zoom - 0.25) });
      },

      resetZoom: () => {
        set({ zoom: DEFAULT_ZOOM });
      },

      // 网格/标尺操作
      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      toggleRuler: () => {
        set((state) => ({ showRuler: !state.showRuler }));
      },

      toggleSnapToGrid: () => {
        set((state) => ({ snapToGrid: !state.snapToGrid }));
      },

      // 设备操作
      setDevice: (device: Device) => {
        set({ device });
      },

      setDeviceByName: (name: string) => {
        const device = DEVICE_PRESETS.find((d) => d.name === name);
        if (device) {
          set({ device });
        }
      },

      // 面板操作
      setActiveLeftPanel: (panel) => {
        set({ activeLeftPanel: panel });
      },

      setActiveRightPanel: (panel) => {
        set({ activeRightPanel: panel });
      },

      // 模式操作
      setEditorMode: (mode) => {
        set({ editorMode: mode });
      },

      togglePlay: () => {
        set((state) => ({ isPlaying: !state.isPlaying }));
      },

      setIsPlaying: (isPlaying: boolean) => {
        set({ isPlaying });
      },

      toggleDebugPanel: () => {
        set((state) => ({ showDebugPanel: !state.showDebugPanel }));
      },

      setShowDebugPanel: (show: boolean) => {
        set({ showDebugPanel: show });
      },

      // 素材选择模态框操作
      openMaterialModal: (componentId: string) => {
        set({ showMaterialModal: true, materialModalComponentId: componentId });
      },

      closeMaterialModal: () => {
        set({ showMaterialModal: false, materialModalComponentId: null });
      },
    }),
    {
      name: 'miniprogram-ui-settings',
      partialize: (state) => ({
        leftSidebarWidth: state.leftSidebarWidth,
        rightSidebarWidth: state.rightSidebarWidth,
        showGrid: state.showGrid,
        showRuler: state.showRuler,
        snapToGrid: state.snapToGrid,
        device: state.device,
      }),
    }
  )
);
