import React, { useState } from 'react';
import {
  Button,
  Modal,
  Input,
  Typography,
  Tag,
  Empty,
  Upload,
  Image,
  Dropdown,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  DeleteOutlined,
  UploadOutlined,
  PictureOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  FileOutlined,
  MoreOutlined,
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useResourceStore } from '@/stores';
import type { Resource, ResourceType } from '@/types/resource';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const RESOURCE_ICONS: Record<ResourceType, React.ReactNode> = {
  image: <PictureOutlined />,
  audio: <SoundOutlined />,
  video: <VideoCameraOutlined />,
  font: <FileOutlined />,
  json: <FileOutlined />,
  file: <FileOutlined />,
};

const RESOURCE_COLORS: Record<ResourceType, string> = {
  image: 'blue',
  audio: 'green',
  video: 'purple',
  font: 'orange',
  json: 'cyan',
  file: 'default',
};

export const ResourcePanel: React.FC = () => {
  const {
    resources,
    selectedResourceId,
    addResource,
    deleteResource,
    selectResource,
    searchResources,
    updateResource,
  } = useResourceStore();

  const [searchText, setSearchText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTypeFilter, setActiveTypeFilter] = useState<ResourceType | 'all'>('all');

  // 过滤资源
  const filteredResources = searchText
    ? searchResources(searchText)
    : resources.filter(r => activeTypeFilter === 'all' || r.type === activeTypeFilter);

  // 确定资源类型
  const getResourceType = (file: File): ResourceType => {
    const mimeType = file.type;
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('font')) return 'font';
    if (mimeType === 'application/json') return 'json';
    return 'file';
  };

  // 处理文件上传
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const uploadFile = file as File;

    try {
      // 将文件转换为 Base64 编码（持久化存储）
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });

      const type = getResourceType(uploadFile);

      // 获取图片尺寸（如果是图片）
      let width: number | undefined;
      let height: number | undefined;

      if (type === 'image') {
        const img = new window.Image();
        img.src = base64Url;
        await new Promise((resolve) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            resolve(true);
          };
        });
      }

      const resource = addResource({
        name: uploadFile.name.split('.')[0],
        type,
        path: base64Url, // 使用 Base64 编码的 URL
        originalName: uploadFile.name,
        size: uploadFile.size,
        mimeType: uploadFile.type,
        width,
        height,
      });

      message.success(`${uploadFile.name} 上传成功`);
      onSuccess?.(resource);
    } catch (error) {
      message.error(`${uploadFile.name} 上传失败`);
      onError?.(error as Error);
      console.error('[ResourcePanel] 上传失败:', error);
    }
  };

  // 预览资源
  const handlePreview = (resource: Resource) => {
    setPreviewResource(resource);
    setPreviewVisible(true);
  };

  // 删除资源
  const handleDelete = (resourceId: string) => {
    deleteResource(resourceId);
    message.success('资源已删除');
  };

  // 复制路径
  const handleCopyPath = (resource: Resource) => {
    navigator.clipboard.writeText(resource.path);
    message.success('路径已复制');
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 资源卡片菜单
  const getResourceMenu = (resource: Resource) => ({
    items: [
      {
        key: 'preview',
        icon: <EyeOutlined />,
        label: '预览',
        onClick: () => handlePreview(resource),
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制路径',
        onClick: () => handleCopyPath(resource),
      },
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
        onClick: () => {
          const newName = prompt('输入新名称', resource.name);
          if (newName) {
            updateResource(resource.id, { name: newName });
          }
        },
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(resource.id),
      },
    ],
  });

  // 渲染资源缩略图
  const renderThumbnail = (resource: Resource) => {
    if (resource.type === 'image') {
      return (
        <Image
          src={resource.path}
          alt={resource.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          preview={false}
        />
      );
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          color: '#666',
          background: '#262626',
        }}
      >
        {RESOURCE_ICONS[resource.type]}
      </div>
    );
  };

  // 处理资源拖拽开始
  const handleDragStart = (e: React.DragEvent, resource: Resource) => {
    e.dataTransfer.setData('resource', JSON.stringify(resource));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 渲染资源卡片
  const renderResourceCard = (resource: Resource) => (
    <div
      key={resource.id}
      draggable
      onDragStart={(e) => handleDragStart(e, resource)}
      style={{
        border: `1px solid ${selectedResourceId === resource.id ? '#1677ff' : '#424242'}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'grab',
        transition: 'all 0.2s',
      }}
      onClick={() => selectResource(resource.id)}
      onDoubleClick={() => handlePreview(resource)}
    >
      {/* 缩略图 */}
      <div style={{ width: '100%', height: 80, overflow: 'hidden' }}>
        {renderThumbnail(resource)}
      </div>

      {/* 信息 */}
      <div style={{ padding: 8, background: '#1f1f1f' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text ellipsis style={{ flex: 1, fontSize: 12 }}>
            {resource.name}
          </Text>
          <Dropdown menu={getResourceMenu(resource)} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <Tag color={RESOURCE_COLORS[resource.type]} style={{ fontSize: 10, margin: 0 }}>
            {resource.type}
          </Tag>
          <Text type="secondary" style={{ fontSize: 10 }}>
            {formatSize(resource.size)}
          </Text>
        </div>
      </div>
    </div>
  );

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
          资源管理
        </Title>
        <Upload
          customRequest={handleUpload}
          showUploadList={false}
          multiple
          accept="image/*,audio/*,video/*,.json,.ttf,.woff,.woff2"
        >
          <Button type="primary" size="small" icon={<UploadOutlined />}>
            上传
          </Button>
        </Upload>
      </div>

      {/* 搜索栏 */}
      <div style={{ padding: '8px 16px' }}>
        <Search
          placeholder="搜索资源..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      {/* 类型筛选 */}
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Tag
          color={activeTypeFilter === 'all' ? 'blue' : undefined}
          style={{ cursor: 'pointer', margin: 0 }}
          onClick={() => setActiveTypeFilter('all')}
        >
          全部 ({resources.length})
        </Tag>
        {(['image', 'audio', 'video', 'font', 'json', 'file'] as ResourceType[]).map(type => {
          const count = resources.filter(r => r.type === type).length;
          if (count === 0) return null;
          return (
            <Tag
              key={type}
              color={activeTypeFilter === type ? RESOURCE_COLORS[type] : undefined}
              style={{ cursor: 'pointer', margin: 0 }}
              onClick={() => setActiveTypeFilter(type)}
            >
              {RESOURCE_ICONS[type]} {type} ({count})
            </Tag>
          );
        })}
      </div>

      {/* 资源列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
        {filteredResources.length === 0 ? (
          <Empty
            description={searchText ? '没有找到匹配的资源' : '暂无资源'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          >
            {!searchText && (
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                multiple
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  上传第一个资源
                </Button>
              </Upload>
            )}
          </Empty>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}
          >
            {filteredResources.map(renderResourceCard)}
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      <Modal
        title={previewResource?.name}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={600}
      >
        {previewResource && (
          <div style={{ textAlign: 'center' }}>
            {previewResource.type === 'image' && (
              <Image src={previewResource.path} alt={previewResource.name} style={{ maxWidth: '100%' }} />
            )}
            {previewResource.type === 'audio' && (
              <audio controls src={previewResource.path} style={{ width: '100%' }} />
            )}
            {previewResource.type === 'video' && (
              <video controls src={previewResource.path} style={{ width: '100%' }} />
            )}
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <Paragraph>
                <Text type="secondary">文件名：</Text>
                <Text>{previewResource.originalName}</Text>
              </Paragraph>
              <Paragraph>
                <Text type="secondary">大小：</Text>
                <Text>{formatSize(previewResource.size)}</Text>
              </Paragraph>
              {previewResource.width && (
                <Paragraph>
                  <Text type="secondary">尺寸：</Text>
                  <Text>{previewResource.width} × {previewResource.height}</Text>
                </Paragraph>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResourcePanel;
