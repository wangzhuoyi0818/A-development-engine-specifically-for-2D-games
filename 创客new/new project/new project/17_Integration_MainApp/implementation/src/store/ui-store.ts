/**
 * UI 存储 (Zustand Store)
 * 管理 UI 相关的状态，包括主题、模态框、侧边栏等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UITheme, ModalOptions, ToastOptions } from '../types';

interface UIState {
  // 主题
  theme: UITheme;
  setTheme: (theme: UITheme) => void;

  // 模态框
  modals: ModalOptions[];
  showModal: (modal: ModalOptions) => void;
  closeModal: (index?: number) => void;
  closeAllModals: () => void;

  // 提示框
  toasts: ToastOptions[];
  showToast: (toast: ToastOptions) => void;
  closeToast: (index?: number) => void;

  // 侧边栏
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // 面板
  expandedPanels: Set<string>;
  togglePanel: (panelId: string) => void;

  // 加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // 通知
  notification?: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  };
  setNotification: (notification?: any) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: {
        name: 'light',
        colors: {
          primary: '#3366ff',
          secondary: '#666666',
          background: '#ffffff',
          border: '#eeeeee',
        },
        fonts: {
          body: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          mono: '"Fira Code", monospace',
        },
      },

      setTheme: (theme) => set({ theme }),

      modals: [],

      showModal: (modal) => {
        set((state) => ({
          modals: [...state.modals, modal],
        }));
      },

      closeModal: (index) => {
        set((state) => {
          const modals = [...state.modals];
          if (index !== undefined) {
            modals.splice(index, 1);
          } else {
            modals.pop();
          }
          return { modals };
        });
      },

      closeAllModals: () => {
        set({ modals: [] });
      },

      toasts: [],

      showToast: (toast) => {
        const id = Date.now();
        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        // 自动关闭（如果指定了 duration）
        if (toast.duration !== undefined && toast.duration > 0) {
          setTimeout(() => {
            get().closeToast(0);
          }, toast.duration);
        }
      },

      closeToast: (index) => {
        set((state) => {
          const toasts = [...state.toasts];
          if (index !== undefined) {
            toasts.splice(index, 1);
          } else {
            toasts.shift();
          }
          return { toasts };
        });
      },

      isSidebarCollapsed: false,

      toggleSidebar: () => {
        set((state) => ({
          isSidebarCollapsed: !state.isSidebarCollapsed,
        }));
      },

      expandedPanels: new Set(),

      togglePanel: (panelId) => {
        set((state) => {
          const panels = new Set(state.expandedPanels);
          if (panels.has(panelId)) {
            panels.delete(panelId);
          } else {
            panels.add(panelId);
          }
          return { expandedPanels: panels };
        });
      },

      isLoading: false,

      setLoading: (loading) => set({ isLoading: loading }),

      notification: undefined,

      setNotification: (notification) => set({ notification }),
    }),
    {
      name: 'ui-store',
      version: 1,
    }
  )
);
