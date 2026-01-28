/**
 * 云同步状态组件
 */

import React from 'react';
import { Tooltip, Badge, Space, Typography } from 'antd';
import {
  CloudOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DisconnectOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useCollaborationStore } from '../../stores/collaborationStore';
import type { SyncStatus } from '../../types/collaboration';

const { Text } = Typography;

interface CloudSyncStatusProps {
  showText?: boolean;
  size?: 'small' | 'default';
}

// 状态配置
const statusConfig: Record<
  SyncStatus,
  {
    icon: React.ReactNode;
    color: string;
    text: string;
    description: string;
  }
> = {
  idle: {
    icon: <CloudOutlined />,
    color: '#666',
    text: '未同步',
    description: '项目未同步到云端',
  },
  syncing: {
    icon: <LoadingOutlined spin />,
    color: '#1677ff',
    text: '同步中',
    description: '正在同步到云端...',
  },
  synced: {
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    text: '已同步',
    description: '所有更改已保存到云端',
  },
  error: {
    icon: <ExclamationCircleOutlined />,
    color: '#ff4d4f',
    text: '同步失败',
    description: '同步出错，请重试',
  },
  offline: {
    icon: <DisconnectOutlined />,
    color: '#faad14',
    text: '离线',
    description: '网络已断开，更改将在恢复连接后同步',
  },
};

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({
  showText = false,
  size = 'default',
}) => {
  const syncStatus = useCollaborationStore((state) => state.syncStatus);
  const syncError = useCollaborationStore((state) => state.syncError);

  const config = statusConfig[syncStatus];
  const iconSize = size === 'small' ? 14 : 16;

  const content = (
    <Space size={4}>
      <span
        style={{
          color: config.color,
          fontSize: iconSize,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {config.icon}
      </span>
      {showText && (
        <Text
          style={{
            color: config.color,
            fontSize: size === 'small' ? 12 : 14,
          }}
        >
          {config.text}
        </Text>
      )}
    </Space>
  );

  const tooltipContent = (
    <div>
      <div>{config.description}</div>
      {syncError && (
        <div style={{ marginTop: 4, color: '#ff4d4f' }}>
          错误: {syncError.message}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="bottom">
      <div style={{ cursor: 'default', display: 'inline-flex' }}>{content}</div>
    </Tooltip>
  );
};

// 同步状态徽章
export const SyncBadge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const syncStatus = useCollaborationStore((state) => state.syncStatus);

  let badgeStatus: 'success' | 'processing' | 'error' | 'default' | 'warning' =
    'default';

  switch (syncStatus) {
    case 'synced':
      badgeStatus = 'success';
      break;
    case 'syncing':
      badgeStatus = 'processing';
      break;
    case 'error':
      badgeStatus = 'error';
      break;
    case 'offline':
      badgeStatus = 'warning';
      break;
    default:
      badgeStatus = 'default';
  }

  return (
    <Badge status={badgeStatus} dot>
      {children}
    </Badge>
  );
};

export default CloudSyncStatus;
