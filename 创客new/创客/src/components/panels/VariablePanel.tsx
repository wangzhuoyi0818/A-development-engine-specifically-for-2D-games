import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  Tag,
  Popconfirm,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useVariableStore } from '@/stores';
import type { Variable, VariableType } from '@/types/variable';

const { Text, Title } = Typography;

const VARIABLE_TYPE_OPTIONS = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '对象', value: 'object' },
  { label: '数组', value: 'array' },
];

const VARIABLE_TYPE_COLORS: Record<VariableType, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'orange',
  object: 'purple',
  array: 'cyan',
};

export const VariablePanel: React.FC = () => {
  const {
    globalVariables,
    selectedVariableId,
    addVariable,
    updateVariable,
    deleteVariable,
    selectVariable,
  } = useVariableStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [form] = Form.useForm();

  // 打开新增/编辑弹窗
  const openModal = (variable?: Variable) => {
    if (variable) {
      setEditingVariable(variable);
      form.setFieldsValue(variable);
    } else {
      setEditingVariable(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 保存变量
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingVariable) {
        updateVariable(editingVariable.id, values);
      } else {
        addVariable({ scope: 'global' }, values);
      }

      setModalVisible(false);
      setEditingVariable(null);
      form.resetFields();
    } catch (error) {
      console.error('保存变量失败:', error);
    }
  };

  // 删除变量
  const handleDelete = (variableId: string) => {
    deleteVariable(variableId);
  };

  // 复制变量
  const handleDuplicate = (variable: Variable) => {
    addVariable(
      { scope: 'global' },
      {
        ...variable,
        name: `${variable.name}_copy`,
      }
    );
  };

  // 渲染变量值预览
  const renderValuePreview = (variable: Variable) => {
    const { initialValue, type } = variable;

    if (type === 'boolean') {
      return <Tag color={initialValue ? 'green' : 'red'}>{String(initialValue)}</Tag>;
    }

    if (type === 'object' || type === 'array') {
      return (
        <Text code style={{ fontSize: 12 }}>
          {JSON.stringify(initialValue).slice(0, 30)}
          {JSON.stringify(initialValue).length > 30 ? '...' : ''}
        </Text>
      );
    }

    return <Text>{String(initialValue ?? '-')}</Text>;
  };

  // 表格列定义
  const columns = [
    {
      title: '变量名',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: Variable) => (
        <Space>
          <Text strong style={{ color: record.readonly ? '#999' : undefined }}>
            {name}
          </Text>
          {record.readonly && <Tag color="default">只读</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: VariableType) => (
        <Tag color={VARIABLE_TYPE_COLORS[type]}>{type}</Tag>
      ),
    },
    {
      title: '初值',
      dataIndex: 'initialValue',
      key: 'initialValue',
      render: (_: unknown, record: Variable) => renderValuePreview(record),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description?: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {description || '-'}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: Variable) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              disabled={record.readonly}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此变量吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.readonly}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #424242',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          全局变量
        </Title>
        <Space size={4}>
          <Tooltip title="导出变量">
            <Button type="text" size="small" icon={<ExportOutlined />} />
          </Tooltip>
          <Tooltip title="导入变量">
            <Button type="text" size="small" icon={<ImportOutlined />} />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新建
          </Button>
        </Space>
      </div>

      {/* 变量列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {globalVariables.length === 0 ? (
          <Empty
            description="暂无变量"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              创建第一个变量
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={globalVariables}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            onRow={(record) => ({
              onClick: () => selectVariable(record.id),
              style: {
                background:
                  selectedVariableId === record.id ? 'rgba(22, 119, 255, 0.1)' : undefined,
              },
            })}
          />
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingVariable ? '编辑变量' : '新建变量'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          setEditingVariable(null);
          form.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        width={400}
      >
        <Form form={form} layout="vertical" size="small">
          <Form.Item
            name="name"
            label="变量名"
            rules={[
              { required: true, message: '请输入变量名' },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '变量名只能包含字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="例如: userName, count" disabled={editingVariable?.readonly} />
          </Form.Item>

          <Form.Item name="type" label="变量类型" rules={[{ required: true }]}>
            <Select options={VARIABLE_TYPE_OPTIONS} disabled={editingVariable?.readonly} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type') as VariableType;

              if (type === 'string') {
                return (
                  <Form.Item name="initialValue" label="初值">
                    <Input placeholder="默认值" />
                  </Form.Item>
                );
              }

              if (type === 'number') {
                return (
                  <Form.Item name="initialValue" label="初值">
                    <Input type="number" placeholder="默认值" />
                  </Form.Item>
                );
              }

              if (type === 'boolean') {
                return (
                  <Form.Item name="initialValue" label="初值" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                );
              }

              if (type === 'object') {
                return (
                  <Form.Item name="initialValue" label="初值 (JSON)">
                    <Input.TextArea
                      rows={3}
                      placeholder='{"key": "value"}'
                    />
                  </Form.Item>
                );
              }

              if (type === 'array') {
                return (
                  <Form.Item name="initialValue" label="初值 (JSON)">
                    <Input.TextArea
                      rows={3}
                      placeholder='["item1", "item2"]'
                    />
                  </Form.Item>
                );
              }

              return null;
            }}
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="变量说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VariablePanel;
