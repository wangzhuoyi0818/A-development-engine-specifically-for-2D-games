import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { MiniProgramProject, Page } from '@/types/miniprogram';
import { createDefaultProject, createDefaultPage } from '@/constants/defaults';
import type { CloudProject, SyncStatus } from '@/types/collaboration';
import {
  saveProject as saveProjectToCloud,
  loadProject as loadProjectFromCloud,
  listProjects as listCloudProjects,
  deleteProject as deleteCloudProject,
} from '@/services/supabase';

interface ProjectStore {
  // 状态
  projects: MiniProgramProject[];
  currentProject: MiniProgramProject | null;
  isLoading: boolean;

  // 云端同步状态
  cloudProjects: CloudProject[];
  cloudProjectId: string | null; // 当前项目对应的云端 ID
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
  isSyncing: boolean;

  // 操作
  loadProjects: () => void;
  createProject: (name: string, description?: string) => MiniProgramProject;
  updateProject: (project: MiniProgramProject) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string) => void;
  closeProject: () => void;
  duplicateProject: (id: string) => MiniProgramProject;

  // 页面操作
  addPage: (name: string, path: string) => Page;
  updatePage: (page: Page) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => Page | null;
  renamePage: (pageId: string, newName: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // 云端同步操作
  syncToCloud: () => Promise<void>;
  loadFromCloud: (cloudProjectId: string) => Promise<void>;
  loadCloudProjects: () => Promise<void>;
  deleteCloudProject: (cloudProjectId: string) => Promise<void>;
  setCloudProjectId: (cloudProjectId: string | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      isLoading: false,

      // 云端同步状态初始值
      cloudProjects: [],
      cloudProjectId: null,
      syncStatus: 'idle' as SyncStatus,
      lastSyncedAt: null,
      isSyncing: false,

      loadProjects: () => {
        set({ isLoading: true });
        // 数据已通过 persist 中间件自动加载
        set({ isLoading: false });
      },

      createProject: (name: string, description?: string) => {
        const id = uuidv4();
        const defaultPageId = uuidv4();

        // 创建默认首页
        const defaultPage = createDefaultPage(
          defaultPageId,
          '首页',
          'pages/index/index'
        );

        const newProject: MiniProgramProject = {
          ...createDefaultProject(id, name),
          description,
          pages: [defaultPage],
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProject: newProject,
        }));

        return newProject;
      },

      updateProject: (project: MiniProgramProject) => {
        const updatedProject = { ...project, updatedAt: Date.now() };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? updatedProject : p
          ),
          currentProject:
            state.currentProject?.id === project.id
              ? updatedProject
              : state.currentProject,
        }));
      },

      deleteProject: (id: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        }));
      },

      selectProject: (id: string) => {
        const project = get().projects.find((p) => p.id === id);
        if (project) {
          const updatedProject = { ...project, lastOpened: Date.now() };
          set((state) => ({
            currentProject: updatedProject,
            projects: state.projects.map((p) =>
              p.id === id ? updatedProject : p
            ),
          }));
        }
      },

      closeProject: () => {
        set({ currentProject: null });
      },

      duplicateProject: (id: string) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) throw new Error('Project not found');

        const newId = uuidv4();
        const duplicated: MiniProgramProject = {
          ...JSON.parse(JSON.stringify(project)),
          id: newId,
          name: `${project.name} (副本)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastOpened: Date.now(),
        };

        // 重新生成所有页面和组件的 ID
        duplicated.pages = duplicated.pages.map((page) => ({
          ...page,
          id: uuidv4(),
          components: page.components.map((comp) => ({
            ...comp,
            id: uuidv4(),
          })),
        }));

        set((state) => ({
          projects: [...state.projects, duplicated],
        }));

        return duplicated;
      },

      // 页面操作
      addPage: (name: string, path: string) => {
        const { currentProject } = get();
        if (!currentProject) throw new Error('No project selected');

        const newPage = createDefaultPage(uuidv4(), name, path);

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages: [...currentProject.pages, newPage],
          config: {
            ...currentProject.config,
            pages: [...currentProject.config.pages, path],
          },
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));

        return newPage;
      },

      updatePage: (page: Page) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages: currentProject.pages.map((p) =>
            p.id === page.id ? page : p
          ),
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));
      },

      deletePage: (pageId: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const pageToDelete = currentProject.pages.find((p) => p.id === pageId);
        if (!pageToDelete) return;

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages: currentProject.pages.filter((p) => p.id !== pageId),
          config: {
            ...currentProject.config,
            pages: currentProject.config.pages.filter(
              (path) => path !== pageToDelete.path
            ),
          },
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));
      },

      duplicatePage: (pageId: string) => {
        const { currentProject } = get();
        if (!currentProject) return null;

        const pageToDuplicate = currentProject.pages.find((p) => p.id === pageId);
        if (!pageToDuplicate) return null;

        const newPageId = uuidv4();
        const newPath = pageToDuplicate.path.replace(/\/([^/]+)$/, `/${Date.now()}`);

        const duplicatedPage: Page = {
          ...JSON.parse(JSON.stringify(pageToDuplicate)),
          id: newPageId,
          name: `${pageToDuplicate.name} (副本)`,
          path: newPath,
          components: pageToDuplicate.components.map((comp) => ({
            ...JSON.parse(JSON.stringify(comp)),
            id: uuidv4(),
          })),
        };

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages: [...currentProject.pages, duplicatedPage],
          config: {
            ...currentProject.config,
            pages: [...currentProject.config.pages, newPath],
          },
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));

        return duplicatedPage;
      },

      renamePage: (pageId: string, newName: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages: currentProject.pages.map((p) =>
            p.id === pageId ? { ...p, name: newName } : p
          ),
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));
      },

      reorderPages: (fromIndex: number, toIndex: number) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const pages = [...currentProject.pages];
        const [removed] = pages.splice(fromIndex, 1);
        pages.splice(toIndex, 0, removed);

        const pagePaths = pages.map((p) => p.path);

        const updatedProject: MiniProgramProject = {
          ...currentProject,
          pages,
          config: {
            ...currentProject.config,
            pages: pagePaths,
          },
          updatedAt: Date.now(),
        };

        set((state) => ({
          currentProject: updatedProject,
          projects: state.projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p
          ),
        }));
      },

      // 云端同步操作
      syncToCloud: async () => {
        const { currentProject, cloudProjectId } = get();
        if (!currentProject) {
          throw new Error('没有打开的项目');
        }

        set({ isSyncing: true, syncStatus: 'syncing' });

        try {
          const cloudProject = await saveProjectToCloud(
            currentProject,
            cloudProjectId || undefined
          );

          set({
            cloudProjectId: cloudProject.id,
            syncStatus: 'synced',
            lastSyncedAt: Date.now(),
            isSyncing: false,
          });
        } catch (error) {
          set({
            syncStatus: 'error',
            isSyncing: false,
          });
          throw error;
        }
      },

      loadFromCloud: async (cloudProjectId: string) => {
        set({ isLoading: true });

        try {
          const cloudProject = await loadProjectFromCloud(cloudProjectId);
          const projectData = cloudProject.data as MiniProgramProject;

          // 检查本地是否已有此项目
          const existingProject = get().projects.find(
            (p) => p.id === projectData.id
          );

          if (existingProject) {
            // 更新本地项目
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectData.id ? projectData : p
              ),
              currentProject: projectData,
              cloudProjectId,
              syncStatus: 'synced',
              lastSyncedAt: Date.now(),
              isLoading: false,
            }));
          } else {
            // 添加到本地项目列表
            set((state) => ({
              projects: [...state.projects, projectData],
              currentProject: projectData,
              cloudProjectId,
              syncStatus: 'synced',
              lastSyncedAt: Date.now(),
              isLoading: false,
            }));
          }
        } catch (error) {
          set({ isLoading: false, syncStatus: 'error' });
          throw error;
        }
      },

      loadCloudProjects: async () => {
        try {
          const cloudProjects = await listCloudProjects({ ownedByMe: true });
          set({ cloudProjects });
        } catch (error) {
          console.error('加载云端项目列表失败:', error);
        }
      },

      deleteCloudProject: async (cloudProjectId: string) => {
        await deleteCloudProject(cloudProjectId);
        set((state) => ({
          cloudProjects: state.cloudProjects.filter((p) => p.id !== cloudProjectId),
          // 如果删除的是当前项目的云端版本，清除云端 ID
          cloudProjectId:
            state.cloudProjectId === cloudProjectId ? null : state.cloudProjectId,
        }));
      },

      setCloudProjectId: (cloudProjectId: string | null) => {
        set({ cloudProjectId });
      },

      setSyncStatus: (status: SyncStatus) => {
        set({ syncStatus: status });
      },
    }),
    {
      name: 'miniprogram-projects',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
        cloudProjectId: state.cloudProjectId,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);
