/**
 * 评论面板组件
 */

import React, { useState } from 'react';
import {
  Avatar,
  Button,
  Input,
  Typography,
  Space,
  Tag,
  Tooltip,
  Empty,
  Dropdown,
  Popconfirm,
  Switch,
  Spin,
} from 'antd';
import {
  MessageOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useComments } from '../../hooks/useComments';
import { useAuthStore } from '../../stores/authStore';
import type { Comment, CommentReply } from '../../types/collaboration';
import { getUserColor } from './UserPresence';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface CommentPanelProps {
  projectId: string | null;
  currentPageId?: string;
}

// 单条评论组件
const CommentItem: React.FC<{
  comment: Comment;
  currentUserId: string | undefined;
  onResolve: (commentId: string, resolved: boolean) => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
  onAddReply: (commentId: string, content: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onSelect: (commentId: string) => void;
  isActive: boolean;
}> = ({
  comment,
  currentUserId,
  onResolve,
  onDelete,
  onUpdate,
  onAddReply,
  onDeleteReply,
  onSelect,
  isActive,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const isOwner = comment.user_id === currentUserId;

  // 保存编辑
  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(comment.id, editContent);
      setIsEditing(false);
    }
  };

  // 添加回复
  const handleAddReply = () => {
    if (replyContent.trim()) {
      onAddReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  // 下拉菜单
  const menuItems = [
    ...(isOwner
      ? [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: '编辑',
            onClick: () => {
              setEditContent(comment.content);
              setIsEditing(true);
            },
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: '删除',
            danger: true,
            onClick: () => onDelete(comment.id),
          },
        ]
      : []),
    {
      key: 'resolve',
      icon: <CheckCircleOutlined />,
      label: comment.resolved ? '标记为未解决' : '标记为已解决',
      onClick: () => onResolve(comment.id, !comment.resolved),
    },
  ];

  return (
    <div
      style={{
        padding: '12px',
        borderBottom: '1px solid #303030',
        backgroundColor: isActive ? '#1a1a1a' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onClick={() => onSelect(comment.id)}
    >
      {/* 评论头部 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Avatar
          src={comment.profile?.avatar_url}
          icon={<UserOutlined />}
          size="small"
          style={{ backgroundColor: getUserColor(comment.user_id) }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text strong style={{ fontSize: 13 }}>
                {comment.profile?.username || '未知用户'}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {new Date(comment.created_at).toLocaleString()}
              </Text>
              {comment.resolved && (
                <Tag color="success" style={{ marginLeft: 4 }}>
                  已解决
                </Tag>
              )}
            </Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>

          {/* 评论内容 */}
          {isEditing ? (
            <div style={{ marginTop: 8 }}>
              <TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoSize={{ minRows: 2 }}
                onClick={(e) => e.stopPropagation()}
              />
              <Space style={{ marginTop: 8 }}>
                <Button size="small" onClick={() => setIsEditing(false)}>
                  取消
                </Button>
                <Button size="small" type="primary" onClick={handleSaveEdit}>
                  保存
                </Button>
              </Space>
            </div>
          ) : (
            <Paragraph style={{ marginTop: 4, marginBottom: 0, fontSize: 13 }}>
              {comment.content}
            </Paragraph>
          )}

          {/* 评论位置标记 */}
          {comment.position && (
            <Tag style={{ marginTop: 4 }} color="blue">
              画布标记
            </Tag>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 32, marginTop: 8 }}>
          {comment.replies.map((reply: CommentReply) => (
            <div
              key={reply.id}
              style={{
                padding: '8px 0',
                borderTop: '1px solid #303030',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <Avatar
                  src={reply.profile?.avatar_url}
                  icon={<UserOutlined />}
                  size={20}
                  style={{ backgroundColor: getUserColor(reply.user_id) }}
                />
                <div style={{ flex: 1 }}>
                  <Space>
                    <Text strong style={{ fontSize: 12 }}>
                      {reply.profile?.username || '未知用户'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {new Date(reply.created_at).toLocaleString()}
                    </Text>
                  </Space>
                  <Paragraph style={{ marginTop: 2, marginBottom: 0, fontSize: 12 }}>
                    {reply.content}
                  </Paragraph>
                </div>
                {reply.user_id === currentUserId && (
                  <Popconfirm
                    title="确定删除此回复？"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteReply(comment.id, reply.id);
                    }}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回复输入 */}
      {showReplyInput ? (
        <div
          style={{ marginLeft: 32, marginTop: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <TextArea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="输入回复..."
            autoSize={{ minRows: 1 }}
            autoFocus
          />
          <Space style={{ marginTop: 8 }}>
            <Button size="small" onClick={() => setShowReplyInput(false)}>
              取消
            </Button>
            <Button size="small" type="primary" onClick={handleAddReply}>
              回复
            </Button>
          </Space>
        </div>
      ) : (
        <Button
          type="link"
          size="small"
          style={{ marginLeft: 32, marginTop: 4, padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowReplyInput(true);
          }}
        >
          回复
        </Button>
      )}
    </div>
  );
};

export const CommentPanel: React.FC<CommentPanelProps> = ({
  projectId,
  currentPageId,
}) => {
  const [newComment, setNewComment] = useState('');
  const currentUser = useAuthStore((state) => state.user);

  const {
    comments,
    activeCommentId,
    isLoading,
    filter,
    createComment,
    updateComment,
    resolveComment,
    deleteComment,
    addReply,
    deleteReply,
    setActiveComment,
    toggleShowResolved,
  } = useComments(projectId);

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment(newComment, currentPageId);
      setNewComment('');
    } catch (error) {
      console.error('添加评论失败:', error);
    }
  };

  if (!projectId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="请先保存项目到云端"
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #303030',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <MessageOutlined />
          <Text strong>评论</Text>
          <Tag>{comments.length}</Tag>
        </Space>
        <Space>
          <Tooltip title={filter.showResolved ? '隐藏已解决' : '显示已解决'}>
            <Switch
              size="small"
              checked={filter.showResolved}
              onChange={toggleShowResolved}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 新建评论 */}
      <div style={{ padding: 12, borderBottom: '1px solid #303030' }}>
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="添加评论..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) {
              handleSubmitComment();
            }
          }}
        />
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            Ctrl + Enter 发送
          </Text>
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
          >
            发送
          </Button>
        </div>
      </div>

      {/* 评论列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : comments.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无评论"
            style={{ padding: 40 }}
          />
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              onResolve={resolveComment}
              onDelete={deleteComment}
              onUpdate={updateComment}
              onAddReply={addReply}
              onDeleteReply={deleteReply}
              onSelect={setActiveComment}
              isActive={activeCommentId === comment.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentPanel;
