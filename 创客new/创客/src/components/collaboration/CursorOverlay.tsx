/**
 * 协作光标覆盖层组件
 * 显示其他用户的光标位置
 */

import React, { useMemo } from 'react';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useAuthStore } from '../../stores/authStore';
import { getUserColor } from './UserPresence';
import type { CursorPosition, UserPresence } from '../../types/collaboration';

interface CursorOverlayProps {
  currentPageId: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}

// 单个光标组件
const Cursor: React.FC<{
  position: CursorPosition;
  user: UserPresence | undefined;
  zoom: number;
  offsetX: number;
  offsetY: number;
}> = ({ position, user, zoom, offsetX, offsetY }) => {
  const color = getUserColor(user?.user_id || '');
  const username = user?.profile?.username || '未知用户';

  // 计算实际位置
  const x = position.x * zoom + offsetX;
  const y = position.y * zoom + offsetY;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'left 0.1s ease-out, top 0.1s ease-out',
      }}
    >
      {/* 光标图标 */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        }}
      >
        <path
          d="M5.5 3.21V20.79C5.5 21.56 6.41 22 6.99 21.52L11.93 17.35C12.2 17.13 12.55 17 12.91 17H19.5C20.33 17 21 16.33 21 15.5V3.21C21 2.54 20.46 2 19.79 2H6.71C6.04 2 5.5 2.54 5.5 3.21Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* 用户名标签 */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          backgroundColor: color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {username}
      </div>
    </div>
  );
};

// 选中框组件
const SelectionBox: React.FC<{
  componentId: string;
  user: UserPresence | undefined;
  getComponentBounds: (id: string) => { x: number; y: number; width: number; height: number } | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
}> = ({ componentId, user, getComponentBounds, zoom, offsetX, offsetY }) => {
  const bounds = getComponentBounds(componentId);
  if (!bounds) return null;

  const color = getUserColor(user?.user_id || '');

  return (
    <div
      style={{
        position: 'absolute',
        left: bounds.x * zoom + offsetX,
        top: bounds.y * zoom + offsetY,
        width: bounds.width * zoom,
        height: bounds.height * zoom,
        border: `2px dashed ${color}`,
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 9998,
        boxShadow: `0 0 0 1px ${color}20`,
      }}
    >
      {/* 用户标签 */}
      <div
        style={{
          position: 'absolute',
          left: -1,
          top: -22,
          backgroundColor: color,
          color: 'white',
          padding: '1px 6px',
          borderRadius: '4px 4px 0 0',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {user?.profile?.username || '未知用户'}
      </div>
    </div>
  );
};

export const CursorOverlay: React.FC<CursorOverlayProps> = ({
  currentPageId,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}) => {
  const cursors = useCollaborationStore((state) => state.cursors);
  const selections = useCollaborationStore((state) => state.selections);
  const onlineUsers = useCollaborationStore((state) => state.onlineUsers);
  const currentUser = useAuthStore((state) => state.user);

  // 获取用户信息的映射
  const userMap = useMemo(() => {
    const map = new Map<string, UserPresence>();
    onlineUsers.forEach((user) => {
      map.set(user.user_id, user);
    });
    return map;
  }, [onlineUsers]);

  // 过滤当前页面的光标
  const filteredCursors = useMemo(() => {
    const result: Array<{ userId: string; position: CursorPosition }> = [];
    cursors.forEach((position, userId) => {
      // 排除当前用户，且只显示当前页面的光标
      if (userId !== currentUser?.id && position.pageId === currentPageId) {
        result.push({ userId, position });
      }
    });
    return result;
  }, [cursors, currentUser?.id, currentPageId]);

  // 过滤其他用户的选中状态
  const filteredSelections = useMemo(() => {
    const result: Array<{ userId: string; componentId: string }> = [];
    selections.forEach((componentId, userId) => {
      if (userId !== currentUser?.id && componentId) {
        result.push({ userId, componentId });
      }
    });
    return result;
  }, [selections, currentUser?.id]);

  // 获取组件边界的函数（需要从外部传入或通过其他方式获取）
  // 这里提供一个占位实现，实际使用时需要根据项目结构调整
  const getComponentBounds = (componentId: string) => {
    // 尝试从 DOM 获取组件边界
    const element = document.querySelector(`[data-component-id="${componentId}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      const container = document.querySelector('[data-canvas-container]');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        return {
          x: (rect.left - containerRect.left) / zoom,
          y: (rect.top - containerRect.top) / zoom,
          width: rect.width / zoom,
          height: rect.height / zoom,
        };
      }
    }
    return null;
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* 渲染其他用户的选中框 */}
      {filteredSelections.map(({ userId, componentId }) => (
        <SelectionBox
          key={`selection-${userId}`}
          componentId={componentId}
          user={userMap.get(userId)}
          getComponentBounds={getComponentBounds}
          zoom={zoom}
          offsetX={offsetX}
          offsetY={offsetY}
        />
      ))}

      {/* 渲染其他用户的光标 */}
      {filteredCursors.map(({ userId, position }) => (
        <Cursor
          key={`cursor-${userId}`}
          position={position}
          user={userMap.get(userId)}
          zoom={zoom}
          offsetX={offsetX}
          offsetY={offsetY}
        />
      ))}
    </div>
  );
};

export default CursorOverlay;
