import React, { useState } from 'react';
import {
  Typography,
  Input,
  Collapse,
  Tag,
  Empty,
  Space,
  Descriptions,
  Button,
  Form,
  Select,
  Modal,
  message,
} from 'antd';
import {
  SearchOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { WECHAT_APIS, API_CATEGORIES, getApisByCategory, searchApis } from '@/types/api';

const { Title, Text, Paragraph } = Typography;

export const ApiPanel: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedApi, setSelectedApi] = useState<typeof WECHAT_APIS[0] | null>(null);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 过滤 API
  const filteredApis = searchText
    ? searchApis(searchText)
    : WECHAT_APIS;

  // 按 API 分类显示
  const apisByCategory = () => {
    if (searchText) {
      return [
        {
          category: API_CATEGORIES[0],
          apis: filteredApis,
        },
      ];
    }

    return API_CATEGORIES.map((cat) => ({
      category: cat,
      apis: getApisByCategory(cat.key),
    })).filter((item) => item.apis.length > 0);
  };

  // 选择 API
  const handleSelectApi = (api: typeof WECHAT_APIS[0]) => {
    setSelectedApi(api);
  };

  // 生成代码
  const handleGenerateCode = async () => {
    if (!selectedApi) return;

    const values = await form.validateFields();
    const code = generateApiCallCode(selectedApi, values);
    navigator.clipboard.writeText(code);
    setCodeModalVisible(true);
  };

  // 生成 API 调用代码
  const generateApiCallCode = (api: typeof WECHAT_APIS[0], params: Record<string, unknown>) => {
    const requiredParams = api.params.filter((p) => p.required);
    const paramPairs = requiredParams
      .filter((p) => params[p.name] !== undefined)
      .map((p) => {
        const value = params[p.name];
        if (typeof value === 'string') {
          return `  ${p.name}: '${value}'`;
        }
        return `  ${p.name}: ${JSON.stringify(value)}`;
      })
      .join(',\n');

    return `wx.${api.name.replace('wx.', '')}({
${paramPairs}
})`;
  };

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
          微信 API
        </Title>
      </div>

      {/* 搜索栏 */}
      <div style={{ padding: '8px 16px' }}>
        <Input
          placeholder="搜索 API..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      {/* API 列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        {filteredApis.length === 0 ? (
          <Empty
            description="没有找到匹配的 API"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        ) : (
          <Collapse
            ghost
            size="small"
            items={apisByCategory().map(({ category, apis }) => ({
              key: category.key,
              label: (
                <Space>
                  {category.icon}
                  {category.label}
                  <Tag>{apis.length}</Tag>
                </Space>
              ),
              children: apis.map((api) => (
                <div
                  key={api.id}
                  onClick={() => handleSelectApi(api)}
                  style={{
                    padding: '8px 12px',
                    margin: '4px 0',
                    background:
                      selectedApi?.id === api.id ? 'rgba(22, 119, 255, 0.2)' : '#262626',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border:
                      selectedApi?.id === api.id ? '1px solid #1677ff' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 12 }}>
                      {api.displayName}
                    </Text>
                    {api.deprecated && (
                      <Tag color="red">
                        已废弃
                      </Tag>
                    )}
                  </div>
                  <Paragraph
                    type="secondary"
                    ellipsis
                    style={{ fontSize: 11, margin: '4px 0 0' }}
                  >
                    {api.description}
                  </Paragraph>
                </div>
              )),
            }))}
          />
        )}
      </div>

      {/* API 详情面板 */}
      {selectedApi && (
        <div
          style={{
            borderTop: '1px solid #424242',
            padding: '12px',
            background: '#1a1a1a',
            maxHeight: '50%',
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>{selectedApi.displayName}</Text>
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleGenerateCode}
            >
              生成代码
            </Button>
          </div>

          <Descriptions
            size="small"
            column={1}
            items={[
              {
                label: 'API',
                children: <Text code>{selectedApi.name}</Text>,
              },
              {
                label: '描述',
                children: <Text type="secondary">{selectedApi.description}</Text>,
              },
              {
                label: '返回值',
                children: <Text code style={{ fontSize: 11 }}>{selectedApi.returnType}</Text>,
              },
            ]}
          />

          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              参数：
            </Text>
            <Form form={form} layout="vertical" size="small" style={{ marginTop: 8 }}>
              {selectedApi.params.map((param) => (
                <Form.Item
                  key={param.name}
                  name={param.name}
                  label={
                    <Space size={4}>
                      <span>{param.name}</span>
                      {param.required && <Tag color="red">必填</Tag>}
                    </Space>
                  }
                  initialValue={param.defaultValue}
                  rules={param.required ? [{ required: true, message: `请输入${param.name}` }] : []}
                >
                  {param.options ? (
                    <Select
                      size="small"
                      options={param.options}
                      placeholder={`请选择${param.name}`}
                    />
                  ) : param.type === 'boolean' ? (
                    <Select
                      size="small"
                      options={[
                        { label: 'true', value: true },
                        { label: 'false', value: false },
                      ]}
                    />
                  ) : param.type === 'array' ? (
                    <Input.TextArea
                      rows={2}
                      size="small"
                      placeholder={`[${param.name}]`}
                    />
                  ) : param.type === 'object' ? (
                    <Input.TextArea
                      rows={2}
                      size="small"
                      placeholder={`{${param.name}}`}
                    />
                  ) : (
                    <Input
                      size="small"
                      type={param.type === 'number' ? 'number' : 'text'}
                      placeholder={`请输入${param.name}`}
                    />
                  )}
                </Form.Item>
              ))}
            </Form>
          </div>
        </div>
      )}

      {/* 代码预览弹窗 */}
      <Modal
        title="生成代码"
        open={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCodeModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="copy"
            type="primary"
            onClick={() => {
              const code = generateApiCallCode(selectedApi!, form.getFieldsValue());
              navigator.clipboard.writeText(code);
              message.success('已复制到剪贴板');
            }}
          >
            复制代码
          </Button>,
        ]}
      >
        <pre
          style={{
            background: '#1f1f1f',
            padding: 12,
            borderRadius: 4,
            fontSize: 12,
            overflow: 'auto',
            maxHeight: 300,
          }}
        >
          {selectedApi && generateApiCallCode(selectedApi, form.getFieldsValue())}
        </pre>
      </Modal>
    </div>
  );
};

export default ApiPanel;
