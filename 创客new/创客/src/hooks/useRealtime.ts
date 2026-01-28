/**
 * 实时协作相关 Hooks
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useAuthStore } from '../stores/authStore';
import type { CursorPosition, RealtimeEvent } from '../types/collaboration';

/**
 * 实时同步 Hook
 * 用于订阅项目的实时变更
 */
export function useRealtime(projectId: string | null, enabled: boolean = true) {
  const { joinSession, leaveSession, syncStatus, syncError, isCollaborating } =
    useCollaborationStore();

  useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }

    joinSession(projectId);

    return () => {
      leaveSession();
    };
  }, [projectId, enabled, joinSession, leaveSession]);

  return {
    isCollaborating,
    syncStatus,
    syncError,
  };
}

/**
 * 用户在线状态 Hook
 */
export function usePresence(projectId: string | null) {
  const onlineUsers = useCollaborationStore((state) => state.onlineUsers);
  const refreshOnlineUsers = useCollaborationStore((state) => state.refreshOnlineUsers);

  // 定期刷新在线用户列表
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(() => {
      refreshOnlineUsers();
    }, 10000);

    return () => clearInterval(interval);
  }, [projectId, refreshOnlineUsers]);

  return {
    onlineUsers,
    refreshOnlineUsers,
  };
}

/**
 * 光标同步 Hook
 */
export function useCursorSync(_projectId: string | null) {
  const updateCursor = useCollaborationStore((state) => state.updateCursor);
  const cursors = useCollaborationStore((state) => state.cursors);
  const user = useAuthStore((state) => state.user);

  // 节流后的光标更新函数
  const throttledUpdateCursor = useCallback(
    (position: CursorPosition) => {
      updateCursor(position);
    },
    [updateCursor]
  );

  // 获取其他用户的光标位置
  const otherCursors = useCallback(() => {
    if (!user) return new Map<string, CursorPosition>();

    const otherCursorsMap = new Map<string, CursorPosition>();
    cursors.forEach((cursor, userId) => {
      if (userId !== user.id) {
        otherCursorsMap.set(userId, cursor);
      }
    });

    return otherCursorsMap;
  }, [cursors, user]);

  return {
    updateCursor: throttledUpdateCursor,
    cursors: otherCursors(),
    allCursors: cursors,
  };
}

/**
 * 选中状态同步 Hook
 */
export function useSelectionSync(projectId: string | null) {
  const updateSelection = useCollaborationStore((state) => state.updateSelection);
  const selections = useCollaborationStore((state) => state.selections);
  const user = useAuthStore((state) => state.user);

  // 更新选中状态
  const broadcastSelection = useCallback(
    (componentId: string | null) => {
      if (projectId) {
        updateSelection(componentId);
      }
    },
    [projectId, updateSelection]
  );

  // 获取其他用户的选中状态
  const otherSelections = useCallback(() => {
    if (!user) return new Map<string, string | null>();

    const otherSelectionsMap = new Map<string, string | null>();
    selections.forEach((selection, userId) => {
      if (userId !== user.id) {
        otherSelectionsMap.set(userId, selection);
      }
    });

    return otherSelectionsMap;
  }, [selections, user]);

  return {
    broadcastSelection,
    selections: otherSelections(),
    allSelections: selections,
  };
}

/**
 * 实时事件监听 Hook
 */
export function useRealtimeEventListener(
  projectId: string | null,
  eventType: string,
  handler: (event: unknown) => void,
  enabled: boolean = true
) {
  const collaborationStore = useCollaborationStore();
  const handlerRef = useRef(handler);

  // 更新 handler 引用
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!projectId || !enabled) return;

    // 保存原始处理函数
    const originalHandler = collaborationStore.handleRealtimeEvent;

    // 模拟订阅（实际由 collaborationStore 管理）
    collaborationStore.handleRealtimeEvent = (event: RealtimeEvent) => {
      if (event.type === eventType) {
        handlerRef.current(event);
      }
      // 调用原始处理函数
      if (originalHandler) {
        originalHandler(event);
      }
    };

    return () => {
      // 清理
    };
  }, [projectId, eventType, enabled, collaborationStore]);
}

/**
 * 协作会话 Hook
 * 综合管理协作会话
 */
export function useCollaborationSession(_projectId: string | null) {
  const {
    onlineUsers,
    cursors,
    selections,
    isCollaborating,
    syncStatus,
    updateCursor,
    updateSelection,
  } = useCollaborationStore();
  const user = useAuthStore((state) => state.user);

  // 获取其他用户的在线状态
  const otherUsers = useCallback(() => {
    if (!user) return [];
    return onlineUsers.filter((u) => u.user_id !== user.id);
  }, [onlineUsers, user]);

  // 获取其他用户的光标
  const otherCursors = useCallback(() => {
    if (!user) return new Map();
    const result = new Map();
    cursors.forEach((cursor, userId) => {
      if (userId !== user.id) {
        result.set(userId, cursor);
      }
    });
    return result;
  }, [cursors, user]);

  // 获取其他用户的选中状态
  const otherSelections = useCallback(() => {
    if (!user) return new Map();
    const result = new Map();
    selections.forEach((selection, userId) => {
      if (userId !== user.id) {
        result.set(userId, selection);
      }
    });
    return result;
  }, [selections, user]);

  return {
    // 状态
    isCollaborating,
    syncStatus,
    onlineUsers: otherUsers(),
    otherCursors: otherCursors(),
    otherSelections: otherSelections(),

    // 操作
    updateCursor,
    updateSelection,
  };
}

export default useRealtime;
