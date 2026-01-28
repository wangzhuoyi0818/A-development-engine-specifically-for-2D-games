import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, Input, message } from 'antd';
import { MainLayout } from '@/components/layout';
import { useProjectStore, usePageStore } from '@/stores';
import { ExportDialog, PerformanceMonitor } from '@/components/publish';

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [addPageModalOpen, setAddPageModalOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [form] = Form.useForm();

  const { selectProject, currentProject, addPage } = useProjectStore();
  const { setCurrentPage, currentPageId } = usePageStore();

  // 加载项目
  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
    }
  }, [projectId, selectProject]);

  // 自动选择第一个页面
  useEffect(() => {
    if (currentProject && currentProject.pages.length > 0 && !currentPageId) {
      setCurrentPage(currentProject.pages[0].id);
    }
  }, [currentProject, currentPageId, setCurrentPage]);

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  // 导出项目
  const handleExport = () => {
    if (!currentProject) {
      message.error('请先选择一个项目');
      return;
    }
    setExportDialogOpen(true);
  };

  // 添加新页面
  const handleAddPage = async () => {
    try {
      const values = await form.validateFields();
      const path = `pages/${values.name}/${values.name}`;
      addPage(values.title || values.name, path);
      message.success('页面创建成功');
      setAddPageModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('创建页面失败:', error);
    }
  };

  if (!currentProject) {
    return null;
  }

  return (
    <>
      <MainLayout
        onExport={handleExport}
        onBack={handleBack}
      />

      {/* 导出对话框 */}
      <ExportDialog
        visible={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />

      {/* 性能监控 */}
      <PerformanceMonitor visible compact />

      {/* 添加页面弹窗 */}
      <Modal
        title="新建页面"
        open={addPageModalOpen}
        onOk={handleAddPage}
        onCancel={() => {
          setAddPageModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="页面名称（英文）"
            rules={[
              { required: true, message: '请输入页面名称' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: '请输入有效的页面名称（字母开头）' },
            ]}
          >
            <Input placeholder="例如: detail, list, profile" />
          </Form.Item>
          <Form.Item name="title" label="页面标题">
            <Input placeholder="例如: 详情页、列表页" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EditorPage;
