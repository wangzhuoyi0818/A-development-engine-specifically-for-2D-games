/**
 * 版本历史组件
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Timeline,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Empty,
  Spin,
  Popconfirm,
  Input,
  message,
} from 'antd';
import {
  HistoryOutlined,
  RollbackOutlined,
  SaveOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  listVersions,
  createVersion,
  restoreVersion,
} from '../../services/supabase';
import { getUserColor } from './UserPresence';
import type { Version } from '../../types/collaboration';

const { Text, Paragraph } = Typography;

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  projectData: unknown;
  onRestore: (data: unknown) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  open,
  onClose,
  projectId,
  projectData,
  onRestore,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // 加载版本列表
  useEffect(() => {
    if (open && projectId) {
      loadVersions();
    }
  }, [open, projectId]);

  const loadVersions = async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const data = await listVersions(projectId);
      setVersions(data);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新版本
  const handleCreateVersion = async () => {
    if (!projectId) return;

    setIsSaving(true);
    try {
      await createVersion(
        {
          projectId,
          name: newVersionName || undefined,
          description: newVersionDesc || undefined,
        },
        projectData
      );
      message.success('版本已保存');
      setShowSaveForm(false);
      setNewVersionName('');
      setNewVersionDesc('');
      loadVersions();
    } catch (error) {
      message.error('保存版本失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 恢复版本
  const handleRestore = async (versionId: string) => {
    try {
      const result = await restoreVersion(versionId);
      onRestore(result.data);
      message.success('版本已恢复');
      onClose();
    } catch (error) {
      message.error('恢复版本失败');
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} 分钟前`;
    }

    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} 小时前`;
    }

    // 小于7天
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} 天前`;
    }

    return date.toLocaleDateString();
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          版本历史
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      {/* 保存新版本 */}
      <div style={{ marginBottom: 16 }}>
        {showSaveForm ? (
          <div
            style={{
              padding: 12,
              backgroundColor: '#1f1f1f',
              borderRadius: 8,
            }}
          >
            <Input
              placeholder="版本名称（可选）"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Input.TextArea
              placeholder="版本描述（可选）"
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ marginBottom: 8 }}
            />
            <Space>
              <Button onClick={() => setShowSaveForm(false)}>取消</Button>
              <Button
                type="primary"
                onClick={handleCreateVersion}
                loading={isSaving}
              >
                保存版本
              </Button>
            </Space>
          </div>
        ) : (
          <Button
            type="dashed"
            icon={<SaveOutlined />}
            onClick={() => setShowSaveForm(true)}
            block
          >
            保存当前版本
          </Button>
        )}
      </div>

      {/* 版本时间线 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : versions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无版本历史"
        />
      ) : (
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <Timeline
            items={versions.map((version, index) => ({
              key: version.id,
              dot:
                index === 0 ? (
                  <Tag color="blue">最新</Tag>
                ) : (
                  <ClockCircleOutlined style={{ fontSize: 16 }} />
                ),
              children: (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#1f1f1f',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <Text strong>
                        {version.name || `版本 ${version.version_number}`}
                      </Text>
                      <br />
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Avatar
                          src={version.profile?.avatar_url}
                          icon={<UserOutlined />}
                          size={16}
                          style={{
                            backgroundColor: getUserColor(version.created_by),
                          }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {version.profile?.username || '未知用户'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatTime(version.created_at)}
                        </Text>
                      </Space>
                      {version.description && (
                        <Paragraph
                          type="secondary"
                          style={{
                            fontSize: 12,
                            marginTop: 4,
                            marginBottom: 0,
                          }}
                        >
                          {version.description}
                        </Paragraph>
                      )}
                    </div>
                    <Popconfirm
                      title="确定要恢复到此版本吗？"
                      description="当前未保存的更改将会丢失"
                      onConfirm={() => handleRestore(version.id)}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<RollbackOutlined />}
                      >
                        恢复
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      )}
    </Modal>
  );
};

export default VersionHistory;
