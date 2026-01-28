/**
 * 分享对话框组件
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Tag,
  Space,
  Typography,
  Tooltip,
  message,
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  UserAddOutlined,
  LinkOutlined,
  CopyOutlined,
  DeleteOutlined,
  UserOutlined,
  CrownOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { buildShareUrl } from '../../services/supabase';
import type { Collaborator, ShareLink, CollaboratorRole } from '../../types/collaboration';

const { Text } = Typography;

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName,
}) => {
  const [inviteForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [inviteLoading, setInviteLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  const {
    collaborators,
    shareLinks,
    loadCollaborators,
    loadShareLinks,
    inviteCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    createShareLink,
    deleteShareLink,
  } = useCollaborationStore();

  // 加载数据
  useEffect(() => {
    if (open && projectId) {
      loadCollaborators(projectId);
      loadShareLinks(projectId);
    }
  }, [open, projectId, loadCollaborators, loadShareLinks]);

  // 邀请协作者
  const handleInvite = async (values: { email: string; role: CollaboratorRole }) => {
    setInviteLoading(true);
    try {
      await inviteCollaborator(values.email, values.role);
      message.success('邀请已发送');
      inviteForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '邀请失败');
    } finally {
      setInviteLoading(false);
    }
  };

  // 更新权限
  const handleUpdateRole = async (collaboratorId: string, role: CollaboratorRole) => {
    try {
      await updateCollaboratorRole(collaboratorId, role);
      message.success('权限已更新');
    } catch (error) {
      message.error('更新权限失败');
    }
  };

  // 移除协作者
  const handleRemove = async (collaboratorId: string) => {
    try {
      await removeCollaborator(collaboratorId);
      message.success('已移除');
    } catch (error) {
      message.error('移除失败');
    }
  };

  // 创建分享链接
  const handleCreateLink = async (values: {
    permission: 'view' | 'edit';
    expiresInDays?: number;
  }) => {
    setLinkLoading(true);
    try {
      const link = await createShareLink(values.permission, values.expiresInDays);
      const url = buildShareUrl(link.token);
      await navigator.clipboard.writeText(url);
      message.success('链接已创建并复制到剪贴板');
      linkForm.resetFields();
    } catch (error) {
      message.error('创建链接失败');
    } finally {
      setLinkLoading(false);
    }
  };

  // 复制链接
  const handleCopyLink = async (token: string) => {
    const url = buildShareUrl(token);
    await navigator.clipboard.writeText(url);
    message.success('链接已复制');
  };

  // 删除分享链接
  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteShareLink(linkId);
      message.success('链接已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 角色标签
  const getRoleTag = (role: CollaboratorRole) => {
    switch (role) {
      case 'owner':
        return (
          <Tag icon={<CrownOutlined />} color="gold">
            所有者
          </Tag>
        );
      case 'editor':
        return (
          <Tag icon={<EditOutlined />} color="blue">
            编辑者
          </Tag>
        );
      case 'viewer':
        return (
          <Tag icon={<EyeOutlined />} color="default">
            查看者
          </Tag>
        );
    }
  };

  // 协作者列表
  const collaboratorList = (
    <div>
      {/* 邀请表单 */}
      <Form
        form={inviteForm}
        layout="inline"
        onFinish={handleInvite}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效邮箱' },
          ]}
          style={{ flex: 1 }}
        >
          <Input placeholder="输入邮箱邀请协作者" prefix={<UserAddOutlined />} />
        </Form.Item>
        <Form.Item name="role" initialValue="editor">
          <Select style={{ width: 100 }}>
            <Select.Option value="editor">编辑者</Select.Option>
            <Select.Option value="viewer">查看者</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={inviteLoading}>
            邀请
          </Button>
        </Form.Item>
      </Form>

      {/* 协作者列表 */}
      <List
        dataSource={collaborators}
        renderItem={(collaborator: Collaborator) => (
          <List.Item
            actions={
              collaborator.role !== 'owner'
                ? [
                    <Select
                      key="role"
                      value={collaborator.role}
                      onChange={(value) =>
                        handleUpdateRole(collaborator.id, value as CollaboratorRole)
                      }
                      style={{ width: 100 }}
                      size="small"
                    >
                      <Select.Option value="editor">编辑者</Select.Option>
                      <Select.Option value="viewer">查看者</Select.Option>
                    </Select>,
                    <Popconfirm
                      key="remove"
                      title="确定要移除此协作者吗？"
                      onConfirm={() => handleRemove(collaborator.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar src={collaborator.profile?.avatar_url} icon={<UserOutlined />} />
              }
              title={collaborator.profile?.username || '未知用户'}
              description={getRoleTag(collaborator.role)}
            />
          </List.Item>
        )}
        locale={{ emptyText: '暂无协作者' }}
      />
    </div>
  );

  // 分享链接面板
  const shareLinkPanel = (
    <div>
      {/* 创建链接表单 */}
      <Form
        form={linkForm}
        layout="inline"
        onFinish={handleCreateLink}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="permission" initialValue="view" label="权限">
          <Select style={{ width: 100 }}>
            <Select.Option value="view">查看</Select.Option>
            <Select.Option value="edit">编辑</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="expiresInDays" label="有效期（天）">
          <InputNumber min={1} max={365} placeholder="永久" />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={linkLoading}
            icon={<LinkOutlined />}
          >
            创建链接
          </Button>
        </Form.Item>
      </Form>

      {/* 链接列表 */}
      <List
        dataSource={shareLinks}
        renderItem={(link: ShareLink) => {
          const url = buildShareUrl(link.token);
          const isExpired =
            link.expires_at ? new Date(link.expires_at) < new Date() : false;

          return (
            <List.Item
              actions={[
                <Tooltip key="copy" title="复制链接">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyLink(link.token)}
                    disabled={isExpired}
                  />
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title="确定要删除此链接吗？"
                  onConfirm={() => handleDeleteLink(link.id)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<LinkOutlined />}
                    style={{
                      backgroundColor: isExpired ? '#999' : '#1677ff',
                    }}
                  />
                }
                title={
                  <Space>
                    <Text
                      copyable={{ text: url }}
                      style={{
                        maxWidth: 200,
                        textDecoration: isExpired ? 'line-through' : 'none',
                      }}
                      ellipsis
                    >
                      {url}
                    </Text>
                    <Tag color={link.permission === 'edit' ? 'blue' : 'default'}>
                      {link.permission === 'edit' ? '可编辑' : '仅查看'}
                    </Tag>
                    {isExpired && <Tag color="red">已过期</Tag>}
                  </Space>
                }
                description={
                  link.expires_at
                    ? `过期时间: ${new Date(link.expires_at).toLocaleDateString()}`
                    : '永久有效'
                }
              />
            </List.Item>
          );
        }}
        locale={{ emptyText: '暂无分享链接' }}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'collaborators',
      label: (
        <span>
          <UserOutlined />
          协作者
        </span>
      ),
      children: collaboratorList,
    },
    {
      key: 'links',
      label: (
        <span>
          <LinkOutlined />
          分享链接
        </span>
      ),
      children: shareLinkPanel,
    },
  ];

  return (
    <Modal
      title={`分享 "${projectName}"`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default ShareDialog;
