/**
 * 协作状态管理 Store
 */

import { create } from 'zustand';
import type {
  Collaborator,
  CollaboratorRole,
  ShareLink,
  UserPresence,
  CursorPosition,
  RealtimeEvent,
  SyncStatus,
  SyncError,
} from '../types/collaboration';
import {
  getCollaborators,
  inviteCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  createShareLink,
  getShareLinks,
  deleteShareLink,
  updatePresence,
  getOnlineUsers,
  leaveProject,
  subscribeToProject,
  unsubscribeFromProject,
  broadcastCursorMove,
  broadcastSelectionChange,
  trackUserPresence,
  untrackUserPresence,
} from '../services/supabase';

interface CollaborationState {
  // 状态
  projectId: string | null;
  collaborators: Collaborator[];
  shareLinks: ShareLink[];
  onlineUsers: UserPresence[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, string | null>;
  isCollaborating: boolean;
  syncStatus: SyncStatus;
  syncError: SyncError | null;
  isLoading: boolean;

  // 操作
  // 会话管理
  joinSession: (projectId: string) => Promise<void>;
  leaveSession: () => Promise<void>;

  // 协作者管理
  loadCollaborators: (projectId: string) => Promise<void>;
  inviteCollaborator: (email: string, role: CollaboratorRole) => Promise<void>;
  updateCollaboratorRole: (collaboratorId: string, role: CollaboratorRole) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;

  // 分享链接管理
  loadShareLinks: (projectId: string) => Promise<void>;
  createShareLink: (permission: 'view' | 'edit', expiresInDays?: number) => Promise<ShareLink>;
  deleteShareLink: (linkId: string) => Promise<void>;

  // 光标和选中状态
  updateCursor: (position: CursorPosition) => Promise<void>;
  updateSelection: (componentId: string | null) => Promise<void>;

  // 实时事件处理
  handleRealtimeEvent: (event: RealtimeEvent) => void;

  // 在线用户
  refreshOnlineUsers: () => Promise<void>;

  // 同步状态
  setSyncStatus: (status: SyncStatus, error?: SyncError) => void;
}

export const useCollaborationStore = create<CollaborationState>()((set, get) => {
  // 实时订阅取消函数
  let unsubscribe: (() => void) | null = null;
  // 光标更新节流
  let cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  // 在线用户刷新定时器
  let onlineUsersRefreshTimer: ReturnType<typeof setInterval> | null = null;

  return {
    // 初始状态
    projectId: null,
    collaborators: [],
    shareLinks: [],
    onlineUsers: [],
    cursors: new Map(),
    selections: new Map(),
    isCollaborating: false,
    syncStatus: 'idle',
    syncError: null,
    isLoading: false,

    // 加入协作会话
    joinSession: async (projectId) => {
      const { leaveSession } = get();

      // 先离开当前会话
      await leaveSession();

      set({ isLoading: true, projectId });

      try {
        // 订阅项目实时事件
        unsubscribe = await subscribeToProject(projectId, get().handleRealtimeEvent);

        // 追踪用户在线状态
        await trackUserPresence(projectId, {});

        // 加载协作者和在线用户
        await Promise.all([
          get().loadCollaborators(projectId),
          get().loadShareLinks(projectId),
          get().refreshOnlineUsers(),
        ]);

        // 定期刷新在线用户
        onlineUsersRefreshTimer = setInterval(() => {
          get().refreshOnlineUsers();
        }, 10000);

        set({
          isCollaborating: true,
          isLoading: false,
          syncStatus: 'synced',
        });
      } catch (error) {
        set({
          isLoading: false,
          syncStatus: 'error',
          syncError: {
            code: 'JOIN_FAILED',
            message: error instanceof Error ? error.message : '加入协作失败',
            timestamp: Date.now(),
          },
        });
        throw error;
      }
    },

    // 离开协作会话
    leaveSession: async () => {
      const { projectId } = get();

      if (projectId) {
        // 取消实时订阅
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        // 清除在线用户刷新定时器
        if (onlineUsersRefreshTimer) {
          clearInterval(onlineUsersRefreshTimer);
          onlineUsersRefreshTimer = null;
        }

        // 取消追踪用户状态
        await untrackUserPresence(projectId);

        // 离开项目
        await leaveProject(projectId);

        // 取消订阅
        await unsubscribeFromProject(projectId);
      }

      set({
        projectId: null,
        collaborators: [],
        shareLinks: [],
        onlineUsers: [],
        cursors: new Map(),
        selections: new Map(),
        isCollaborating: false,
        syncStatus: 'idle',
        syncError: null,
      });
    },

    // 加载协作者列表
    loadCollaborators: async (projectId) => {
      try {
        const collaborators = await getCollaborators(projectId);
        set({ collaborators });
      } catch (error) {
        console.error('加载协作者失败:', error);
      }
    },

    // 邀请协作者
    inviteCollaborator: async (email, role) => {
      const { projectId, collaborators } = get();
      if (!projectId) throw new Error('未加入协作会话');

      const newCollaborator = await inviteCollaborator({
        projectId,
        email,
        role,
      });

      set({ collaborators: [...collaborators, newCollaborator] });
    },

    // 更新协作者权限
    updateCollaboratorRole: async (collaboratorId, role) => {
      await updateCollaboratorRole(collaboratorId, role);

      set({
        collaborators: get().collaborators.map((c) =>
          c.id === collaboratorId ? { ...c, role } : c
        ),
      });
    },

    // 移除协作者
    removeCollaborator: async (collaboratorId) => {
      await removeCollaborator(collaboratorId);

      set({
        collaborators: get().collaborators.filter((c) => c.id !== collaboratorId),
      });
    },

    // 加载分享链接列表
    loadShareLinks: async (projectId) => {
      try {
        const shareLinks = await getShareLinks(projectId);
        set({ shareLinks });
      } catch (error) {
        console.error('加载分享链接失败:', error);
      }
    },

    // 创建分享链接
    createShareLink: async (permission, expiresInDays) => {
      const { projectId, shareLinks } = get();
      if (!projectId) throw new Error('未加入协作会话');

      const newLink = await createShareLink({
        projectId,
        permission,
        expiresInDays,
      });

      set({ shareLinks: [newLink, ...shareLinks] });

      return newLink;
    },

    // 删除分享链接
    deleteShareLink: async (linkId) => {
      await deleteShareLink(linkId);

      set({
        shareLinks: get().shareLinks.filter((l) => l.id !== linkId),
      });
    },

    // 更新光标位置（节流处理）
    updateCursor: async (position) => {
      const { projectId } = get();
      if (!projectId) return;

      // 清除之前的节流定时器
      if (cursorThrottleTimer) {
        clearTimeout(cursorThrottleTimer);
      }

      // 50ms 节流
      cursorThrottleTimer = setTimeout(async () => {
        try {
          await Promise.all([
            updatePresence(projectId, position),
            broadcastCursorMove(projectId, position),
            trackUserPresence(projectId, { cursor: position }),
          ]);
        } catch (error) {
          console.error('更新光标位置失败:', error);
        }
      }, 50);
    },

    // 更新选中状态
    updateSelection: async (componentId) => {
      const { projectId } = get();
      if (!projectId) return;

      try {
        await Promise.all([
          updatePresence(projectId, undefined, componentId || undefined),
          broadcastSelectionChange(projectId, componentId),
          trackUserPresence(projectId, { selectedComponent: componentId }),
        ]);
      } catch (error) {
        console.error('更新选中状态失败:', error);
      }
    },

    // 处理实时事件
    handleRealtimeEvent: (event) => {
      const { cursors, selections, onlineUsers } = get();

      switch (event.type) {
        case 'cursor:move': {
          const payload = event.payload as CursorPosition;
          const newCursors = new Map(cursors);
          newCursors.set(event.userId, payload);
          set({ cursors: newCursors });
          break;
        }

        case 'selection:change': {
          const payload = event.payload as { componentId: string | null };
          const newSelections = new Map(selections);
          newSelections.set(event.userId, payload.componentId);
          set({ selections: newSelections });
          break;
        }

        case 'user:join': {
          const payload = event.payload as UserPresence;
          // 避免重复添加
          if (!onlineUsers.find((u) => u.user_id === event.userId)) {
            set({ onlineUsers: [...onlineUsers, payload] });
          }
          break;
        }

        case 'user:leave': {
          // 移除离开的用户
          const newCursors = new Map(cursors);
          newCursors.delete(event.userId);
          const newSelections = new Map(selections);
          newSelections.delete(event.userId);

          set({
            onlineUsers: onlineUsers.filter((u) => u.user_id !== event.userId),
            cursors: newCursors,
            selections: newSelections,
          });
          break;
        }

        case 'project:update':
        case 'component:add':
        case 'component:update':
        case 'component:delete':
          // 这些事件由 projectStore 处理
          // 可以在这里添加通知或其他 UI 反馈
          break;

        case 'comment:add':
        case 'comment:update':
        case 'comment:delete':
          // 这些事件由 commentStore 处理
          break;

        default:
          console.log('未处理的实时事件:', event.type);
      }
    },

    // 刷新在线用户列表
    refreshOnlineUsers: async () => {
      const { projectId } = get();
      if (!projectId) return;

      try {
        const onlineUsers = await getOnlineUsers(projectId);
        set({ onlineUsers });
      } catch (error) {
        console.error('刷新在线用户失败:', error);
      }
    },

    // 设置同步状态
    setSyncStatus: (status, error) => {
      set({
        syncStatus: status,
        syncError: error || null,
      });
    },
  };
});

export default useCollaborationStore;
