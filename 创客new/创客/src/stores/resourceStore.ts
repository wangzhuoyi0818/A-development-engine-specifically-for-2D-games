import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Resource, ResourceType, ResourceFolder } from '@/types/resource';

interface ResourceStore {
  // 状态
  resources: Resource[];
  folders: ResourceFolder[];
  selectedResourceId: string | null;
  currentFolderId: string | null;

  // 资源操作
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => Resource;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  selectResource: (id: string | null) => void;

  // 文件夹操作
  addFolder: (name: string, parentId?: string | null) => ResourceFolder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setCurrentFolder: (id: string | null) => void;

  // 查询
  getResourcesByType: (type: ResourceType) => Resource[];
  getResourcesByFolder: (folderId: string | null) => Resource[];
  searchResources: (keyword: string) => Resource[];

  // 批量操作
  importResources: (resources: Resource[]) => void;
  clearAllResources: () => void;
}

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set, get) => ({
      resources: [],
      folders: [],
      selectedResourceId: null,
      currentFolderId: null,

      addResource: (resourceData) => {
        const now = Date.now();
        const newResource: Resource = {
          ...resourceData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          resources: [...state.resources, newResource],
          selectedResourceId: newResource.id,
        }));

        return newResource;
      },

      updateResource: (id, updates) => {
        set((state) => ({
          resources: state.resources.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r
          ),
        }));
      },

      deleteResource: (id) => {
        set((state) => ({
          resources: state.resources.filter((r) => r.id !== id),
          selectedResourceId:
            state.selectedResourceId === id ? null : state.selectedResourceId,
        }));
      },

      selectResource: (id) => {
        set({ selectedResourceId: id });
      },

      addFolder: (name, parentId = null) => {
        const newFolder: ResourceFolder = {
          id: uuidv4(),
          name,
          parentId,
          children: [],
        };

        set((state) => ({
          folders: [...state.folders, newFolder],
        }));

        return newFolder;
      },

      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, name } : f
          ),
        }));
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          currentFolderId:
            state.currentFolderId === id ? null : state.currentFolderId,
        }));
      },

      setCurrentFolder: (id) => {
        set({ currentFolderId: id });
      },

      getResourcesByType: (type) => {
        return get().resources.filter((r) => r.type === type);
      },

      getResourcesByFolder: (_folderId) => {
        // 简单实现：所有资源都在根目录
        return get().resources;
      },

      searchResources: (keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        return get().resources.filter(
          (r) =>
            r.name.toLowerCase().includes(lowerKeyword) ||
            r.originalName.toLowerCase().includes(lowerKeyword)
        );
      },

      importResources: (resources) => {
        set((state) => ({
          resources: [...state.resources, ...resources],
        }));
      },

      clearAllResources: () => {
        set({ resources: [], selectedResourceId: null });
      },
    }),
    {
      name: 'miniprogram-resources',
    }
  )
);
