/**
 * 用户在线状态组件
 */

import React from 'react';
import { Avatar, Tooltip, Badge, Popover, List, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useAuthStore } from '../../stores/authStore';
import type { UserPresence as UserPresenceType } from '../../types/collaboration';

const { Text } = Typography;

// 用户颜色映射
const userColors = [
  '#1677ff',
  '#52c41a',
  '#faad14',
  '#eb2f96',
  '#722ed1',
  '#13c2c2',
  '#fa541c',
  '#2f54eb',
];

// 获取用户颜色
export const getUserColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return userColors[Math.abs(hash) % userColors.length];
};

interface UserPresenceProps {
  maxDisplay?: number;
  showPopover?: boolean;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  maxDisplay = 5,
  showPopover = true,
}) => {
  const onlineUsers = useCollaborationStore((state) => state.onlineUsers);
  const currentUser = useAuthStore((state) => state.user);

  // 过滤掉当前用户
  const otherUsers = onlineUsers.filter((u) => u.user_id !== currentUser?.id);

  if (otherUsers.length === 0) {
    return null;
  }

  // 显示的用户
  const displayUsers = otherUsers.slice(0, maxDisplay);
  const remainingCount = otherUsers.length - maxDisplay;

  // 用户详情弹出框内容
  const userListContent = (
    <List
      size="small"
      dataSource={otherUsers}
      renderItem={(user: UserPresenceType) => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Badge
                dot
                status="success"
                offset={[-4, 28]}
              >
                <Avatar
                  src={user.profile?.avatar_url}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: getUserColor(user.user_id) }}
                  size="small"
                />
              </Badge>
            }
            title={user.profile?.username || '未知用户'}
            description={
              user.selected_component ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  正在编辑组件
                </Text>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  在线
                </Text>
              )
            }
          />
        </List.Item>
      )}
      style={{ maxHeight: 300, overflow: 'auto', minWidth: 200 }}
    />
  );

  // 头像组
  const avatarGroup = (
    <Avatar.Group
      maxCount={maxDisplay}
      maxStyle={{
        color: '#fff',
        backgroundColor: '#666',
        cursor: 'pointer',
      }}
      size="small"
    >
      {displayUsers.map((user) => (
        <Tooltip
          key={user.user_id}
          title={user.profile?.username || '未知用户'}
        >
          <Badge dot status="success" offset={[-4, 28]}>
            <Avatar
              src={user.profile?.avatar_url}
              icon={<UserOutlined />}
              style={{
                backgroundColor: getUserColor(user.user_id),
                cursor: 'pointer',
              }}
              size="small"
            />
          </Badge>
        </Tooltip>
      ))}
      {remainingCount > 0 && (
        <Tooltip title={`还有 ${remainingCount} 人在线`}>
          <Avatar
            style={{
              backgroundColor: '#666',
              cursor: 'pointer',
            }}
            size="small"
          >
            +{remainingCount}
          </Avatar>
        </Tooltip>
      )}
    </Avatar.Group>
  );

  if (showPopover) {
    return (
      <Popover
        content={userListContent}
        title={`${otherUsers.length} 人在线`}
        trigger="click"
        placement="bottomRight"
      >
        <div style={{ cursor: 'pointer' }}>{avatarGroup}</div>
      </Popover>
    );
  }

  return avatarGroup;
};

export default UserPresence;
