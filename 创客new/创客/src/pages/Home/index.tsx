import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Input,
  Empty,
  Typography,
  Space,
  Dropdown,
  Modal,
  Form,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores';
import type { MiniProgramProject } from '@/types/miniprogram';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const {
    projects,
    isLoading,
    loadProjects,
    createProject,
    deleteProject,
    duplicateProject,
    selectProject,
  } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 过滤项目
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 创建新项目
  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
      const project = createProject(values.name, values.description);
      message.success('项目创建成功');
      setCreateModalOpen(false);
      form.resetFields();
      // 直接进入编辑器
      selectProject(project.id);
      navigate(`/editor/${project.id}`);
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  // 打开项目
  const handleOpenProject = (project: MiniProgramProject) => {
    selectProject(project.id);
    navigate(`/editor/${project.id}`);
  };

  // 删除项目
  const handleDeleteProject = (project: MiniProgramProject) => {
    Modal.confirm({
      title: '删除项目',
      content: `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteProject(project.id);
        message.success('项目已删除');
      },
    });
  };

  // 复制项目
  const handleDuplicateProject = (project: MiniProgramProject) => {
    duplicateProject(project.id);
    message.success('项目已复制');
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 项目卡片菜单
  const getProjectMenu = (project: MiniProgramProject) => ({
    items: [
      {
        key: 'open',
        icon: <FolderOpenOutlined />,
        label: '打开项目',
        onClick: () => handleOpenProject(project),
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: '复制项目',
        onClick: () => handleDuplicateProject(project),
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除项目',
        danger: true,
        onClick: () => handleDeleteProject(project),
      },
    ],
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#141414' }}>
      <Content style={{ padding: '40px 60px' }}>
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              万象积木
            </Title>
            <Text type="secondary">游戏创作平台 - 用积木搭建你的游戏世界</Text>
          </div>
          <Space>
            <Input
              placeholder="搜索项目..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              新建项目
            </Button>
          </Space>
        </div>

        {/* 项目列表 */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Empty
            description={searchText ? '没有找到匹配的项目' : '暂无项目，点击上方按钮创建'}
            style={{ marginTop: 100 }}
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                创建第一个项目
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredProjects.map((project) => (
              <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  cover={
                    <div
                      style={{
                        height: 120,
                        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => handleOpenProject(project)}
                    >
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 32,
                          fontWeight: 'bold',
                        }}
                      >
                        {project.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </div>
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenProject(project)}
                    >
                      编辑
                    </Button>,
                    <Dropdown menu={getProjectMenu(project)} trigger={['click']}>
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          ellipsis
                          style={{ maxWidth: '70%', cursor: 'pointer' }}
                          onClick={() => handleOpenProject(project)}
                        >
                          {project.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          v{project.version}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          type="secondary"
                          style={{ marginBottom: 8, minHeight: 44 }}
                        >
                          {project.description || '暂无描述'}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {project.pages.length} 个页面 · 更新于 {formatTime(project.updatedAt)}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* 创建项目弹窗 */}
        <Modal
          title="创建新项目"
          open={createModalOpen}
          onOk={handleCreateProject}
          onCancel={() => {
            setCreateModalOpen(false);
            form.resetFields();
          }}
          okText="创建"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" maxLength={30} />
            </Form.Item>
            <Form.Item name="description" label="项目描述">
              <Input.TextArea placeholder="请输入项目描述（可选）" rows={3} maxLength={200} />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default HomePage;
