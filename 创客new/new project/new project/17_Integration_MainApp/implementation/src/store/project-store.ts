/**
 * 项目存储 (Zustand Store)
 * 管理项目级别的状态，包括项目列表、当前项目等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Page, Component } from '../types';

interface ProjectState {
  // 状态
  projects: Project[];
  currentProjectId?: string;
  currentPageId?: string;

  // 操作
  createProject: (name: string, description?: string) => void;
  openProject: (projectId: string) => void;
  closeProject: () => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  saveProject: (projectId: string) => Promise<void>;

  // 页面操作
  createPage: (projectId: string, name: string) => void;
  deletePage: (projectId: string, pageId: string) => void;
  updatePage: (projectId: string, pageId: string, updates: Partial<Page>) => void;
  setCurrentPage: (pageId: string) => void;

  // 获取当前项目和页面
  getCurrentProject: () => Project | undefined;
  getCurrentPage: () => Page | undefined;

  // 辅助方法
  getProject: (projectId: string) => Project | undefined;
  getPage: (projectId: string, pageId: string) => Page | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: undefined,
      currentPageId: undefined,

      createProject: (name, description) => {
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: `project_${Date.now()}`,
              name,
              description,
              version: '1.0.0',
              pages: [],
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          ],
        }));
      },

      openProject: (projectId) => {
        const project = get().getProject(projectId);
        if (project) {
          set({ currentProjectId: projectId });
          if (project.pages.length > 0) {
            set({ currentPageId: project.pages[0].id });
          }
        }
      },

      closeProject: () => {
        set({ currentProjectId: undefined, currentPageId: undefined });
      },

      deleteProject: (projectId) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId:
            state.currentProjectId === projectId
              ? undefined
              : state.currentProjectId,
        }));
      },

      updateProject: (projectId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  ...updates,
                  metadata: {
                    ...p.metadata,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : p
          ),
        }));
      },

      saveProject: async (projectId) => {
        // 实现项目保存逻辑
        const project = get().getProject(projectId);
        if (project) {
          // 这里可以调用 API 或存储服务
          console.log('Project saved:', project);
        }
      },

      createPage: (projectId, name) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: [
                    ...p.pages,
                    {
                      id: `page_${Date.now()}`,
                      name,
                      components: [],
                    },
                  ],
                }
              : p
          ),
        }));
      },

      deletePage: (projectId, pageId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.filter((page) => page.id !== pageId),
                }
              : p
          ),
        }));
      },

      updatePage: (projectId, pageId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((page) =>
                    page.id === pageId ? { ...page, ...updates } : page
                  ),
                }
              : p
          ),
        }));
      },

      setCurrentPage: (pageId) => {
        set({ currentPageId: pageId });
      },

      getCurrentProject: () => get().getProject(get().currentProjectId || ''),

      getCurrentPage: () => {
        const { currentProjectId, currentPageId } = get();
        if (!currentProjectId || !currentPageId) return undefined;
        return get().getPage(currentProjectId, currentPageId);
      },

      getProject: (projectId) => get().projects.find((p) => p.id === projectId),

      getPage: (projectId, pageId) => {
        const project = get().getProject(projectId);
        return project?.pages.find((p) => p.id === pageId);
      },
    }),
    {
      name: 'project-store',
      version: 1,
    }
  )
);
