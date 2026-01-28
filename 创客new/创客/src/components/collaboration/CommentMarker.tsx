/**
 * 评论标记组件
 * 在画布上显示评论图钉
 */

import React, { useState } from 'react';
import { Popover, Button, Avatar, Typography, Tag, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useCommentStore } from '../../stores/commentStore';
import { getUserColor } from './UserPresence';
import type { Comment, CommentPosition } from '../../types/collaboration';

const { Text } = Typography;

interface CommentMarkerProps {
  comment: Comment;
  onClick?: (comment: Comment) => void;
  onDragEnd?: (comment: Comment, position: CommentPosition) => void;
}

// 单个评论标记
export const CommentMarker: React.FC<CommentMarkerProps> = ({
  comment,
  onClick,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onDragEnd) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - (comment.position?.x || 0),
      y: e.clientY - (comment.position?.y || 0),
    });

    e.stopPropagation();
  };

  React.useEffect(() => {
    const handleMouseMove = (_e: MouseEvent) => {
      if (!isDragging || !dragStart || !comment.position) return;
      // 临时更新位置（视觉反馈）- 可以在此添加实时拖拽效果
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !dragStart || !comment.position) return;

      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };

      onDragEnd?.(comment, newPosition);
      setIsDragging(false);
      setDragStart(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, comment, onDragEnd]);

  // 弹出框内容
  const content = (
    <div style={{ minWidth: 200, maxWidth: 300 }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* 用户信息 */}
        <Space>
          <Avatar
            src={comment.profile?.avatar_url}
            size="small"
            style={{ backgroundColor: getUserColor(comment.user_id) }}
          />
          <Text strong>{comment.profile?.username || '未知用户'}</Text>
          {comment.resolved && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              已解决
            </Tag>
          )}
        </Space>

        {/* 评论内容 */}
        <Text>{comment.content}</Text>

        {/* 回复数 */}
        {comment.replies && comment.replies.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {comment.replies.length} 条回复
          </Text>
        )}
      </Space>
    </div>
  );

  return (
    <Popover
      content={content}
      placement="right"
      trigger="click"
      overlayStyle={{ zIndex: 10000 }}
    >
      <div
        style={{
          position: 'absolute',
          left: comment.position?.x || 0,
          top: comment.position?.y || 0,
          cursor: onDragEnd ? 'grab' : 'pointer',
          transform: 'translate(-50%, -100%)',
          zIndex: 1000,
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(comment);
        }}
      >
        {/* 图钉图标 */}
        <div
          style={{
            position: 'relative',
            filter: isDragging ? 'brightness(1.2)' : 'none',
          }}
        >
          {/* 阴影 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="20" r="6" fill="rgba(0,0,0,0.3)" />
          </svg>

          {/* 图钉 */}
          <svg
            width="24"
            height="30"
            viewBox="0 0 24 30"
            fill="none"
            style={{
              position: 'absolute',
              left: 0,
              top: -6,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            <path
              d="M12 0C7.58 0 4 3.58 4 8c0 2.5 1.14 4.72 2.91 6.22L12 28l5.09-13.78C18.86 12.72 20 10.5 20 8c0-4.42-3.58-8-8-8z"
              fill={comment.resolved ? '#52c41a' : '#1677ff'}
            />
            <circle cx="12" cy="8" r="3" fill="white" />
          </svg>

          {/* 评论数量徽章 */}
          {comment.replies && comment.replies.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -4,
                backgroundColor: '#f5222d',
                color: 'white',
                fontSize: 10,
                fontWeight: 'bold',
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {comment.replies.length}
            </div>
          )}
        </div>
      </div>
    </Popover>
  );
};

// 评论标记层容器
interface CommentMarkersProps {
  projectId: string | null;
  currentPageId?: string;
  onMarkerClick?: (comment: Comment) => void;
  onMarkerDragEnd?: (comment: Comment, position: CommentPosition) => void;
}

export const CommentMarkers: React.FC<CommentMarkersProps> = ({
  projectId,
  currentPageId,
  onMarkerClick,
  onMarkerDragEnd,
}) => {
  const canvasComments = useCommentStore((state) => state.canvasComments);

  // 过滤当前页面的评论
  const filteredComments = currentPageId
    ? canvasComments.filter((c) => !c.page_id || c.page_id === currentPageId)
    : canvasComments;

  if (!projectId || filteredComments.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {filteredComments.map((comment) => (
        <div key={comment.id} style={{ pointerEvents: 'auto' }}>
          <CommentMarker
            comment={comment}
            onClick={onMarkerClick}
            onDragEnd={onMarkerDragEnd}
          />
        </div>
      ))}
    </div>
  );
};

// 新建评论时的预览标记
interface NewCommentMarkerProps {
  position: CommentPosition | null;
  visible: boolean;
  onCancel: () => void;
}

export const NewCommentMarker: React.FC<NewCommentMarkerProps> = ({
  position,
  visible,
  onCancel,
}) => {
  if (!visible || !position) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 1001,
      }}
    >
      <Popover
        content={
          <div style={{ width: 250 }}>
            <Typography.Text>点击画布添加评论</Typography.Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              size="small"
              style={{ position: 'absolute', top: 4, right: 4 }}
              onClick={onCancel}
            />
          </div>
        }
        open={true}
        placement="right"
      >
        <div>
          {/* 脉冲动画的图钉 */}
          <svg
            width="24"
            height="30"
            viewBox="0 0 24 30"
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M12 0C7.58 0 4 3.58 4 8c0 2.5 1.14 4.72 2.91 6.22L12 28l5.09-13.78C18.86 12.72 20 10.5 20 8c0-4.42-3.58-8-8-8z"
              fill="#1677ff"
            >
              <animate
                attributeName="opacity"
                values="0.5;1;0.5"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
            <circle cx="12" cy="8" r="3" fill="white" />
          </svg>
        </div>
      </Popover>
    </div>
  );
};

export default CommentMarker;
