import React, { useState } from 'react';
import { Layout, Collapse, Tree, Button, Empty, Tooltip, Space, Typography, Dropdown, Modal, Input, Tabs, Upload, message, Popconfirm } from 'antd';
import type { TreeDataNode, MenuProps } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UnlockOutlined,
  MoreOutlined,
  EditOutlined,
  CaretRightOutlined,
  FileImageOutlined,
  SoundOutlined,
  FontSizeOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UploadOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useProjectStore, usePageStore, useUIStore, useResourceStore } from '@/stores';
import { COMPONENT_CATEGORIES, getComponentsByCategory } from '@/constants/components';
import type { Page, ComponentCategory } from '@/types/miniprogram';
import type { ResourceType, ResourceCategory } from '@/types/resource';
import { PRESET_ASSETS, RESOURCE_CATEGORIES } from '@/types/presetAssets';

const { Sider } = Layout;
const { Text } = Typography;

interface LeftSidebarProps {
  onAddPage?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const {
    leftSidebarCollapsed,
    leftSidebarWidth,
  } = useUIStore();

  const { currentProject, deletePage, duplicatePage, renamePage, addPage } = useProjectStore();
  const {
    currentPageId,
    setCurrentPage,
    selectedComponentId,
    selectComponent,
    addComponent,
    getCurrentPage,
    deleteComponent,
    duplicateComponent,
    lockComponent,
    toggleComponentVisibility,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    // 背景图层操作
    addBackgroundLayer,
    deleteBackgroundLayer,
    moveBackgroundLayerUp,
    moveBackgroundLayerDown,
    toggleBackgroundLayerVisibility,
  } = usePageStore();

  // 资源管理
  const {
    resources,
    addResource,
    deleteResource,
    getResourcesByType,
  } = useResourceStore();

  // 重命名场景状态
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingPage, setRenamingPage] = useState<Page | null>(null);
  const [newPageName, setNewPageName] = useState('');

  // 添加场景状态
  const [addPageModalVisible, setAddPageModalVisible] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');

  // 资源管理当前选中类型
  const [resourceType, setResourceType] = useState<ResourceType | 'all'>('all');

  // 折叠面板展开状态
  const [activeKeys, setActiveKeys] = useState<string[]>(['scenes', 'backgroundLayers', 'layers', 'materials', 'resources']);

  // 素材库当前选中分类
  const [materialCategory, setMaterialCategory] = useState<string>('all');

  const currentPage = getCurrentPage();

  // 获取当前类型的资源
  const getFilteredResources = () => {
    if (resourceType === 'all') {
      return resources;
    }
    return getResourcesByType(resourceType);
  };

  // 资源类型配置
  const resourceTypes: { key: ResourceType | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: '全部', icon: <AppstoreOutlined /> },
    { key: 'image', label: '图片', icon: <FileImageOutlined /> },
    { key: 'audio', label: '音频', icon: <SoundOutlined /> },
    { key: 'video', label: '视频', icon: <VideoCameraOutlined /> },
    { key: 'font', label: '字体', icon: <FontSizeOutlined /> },
  ];

  // 处理文件上传
  const handleUpload = (file: File) => {
    const type = file.type.startsWith('image/') ? 'image' :
                 file.type.startsWith('audio/') ? 'audio' :
                 file.type.startsWith('video/') ? 'video' :
                 file.type.includes('font') ? 'font' : 'file';

    // 创建本地 URL
    const url = URL.createObjectURL(file);

    addResource({
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: type as ResourceType,
      path: url,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });

    message.success(`已添加资源: ${file.name}`);
    return false; // 阻止默认上传行为
  };

  // 处理添加场景
  const handleAddPage = () => {
    const defaultName = `场景${(currentProject?.pages?.length || 0) + 1}`;
    setNewSceneName(defaultName);
    setAddPageModalVisible(true);
  };

  const handleAddPageConfirm = () => {
    if (newSceneName.trim()) {
      const pagePath = `/pages/${newSceneName.trim().toLowerCase().replace(/\s+/g, '-')}`;
      const newPage = addPage(newSceneName.trim(), pagePath);
      if (newPage) {
        setCurrentPage(newPage.id);
      }
      setAddPageModalVisible(false);
      setNewSceneName('');
    }
  };

  // 图层树数据
  const layerTreeData: TreeDataNode[] = currentPage?.components
    .slice()
    .sort((a, b) => b.zIndex - a.zIndex)
    .map((comp) => ({
      key: comp.id,
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Text ellipsis style={{ flex: 1, fontSize: 12 }}>{comp.name}</Text>
          <Space size={2}>
            <Tooltip title={comp.visible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                icon={comp.visible ? <EyeOutlined style={{ fontSize: 12 }} /> : <EyeInvisibleOutlined style={{ fontSize: 12 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComponentVisibility(comp.id);
                }}
                style={{ width: 20, height: 20, minWidth: 20 }}
              />
            </Tooltip>
            <Tooltip title={comp.locked ? '解锁' : '锁定'}>
              <Button
                type="text"
                size="small"
                icon={comp.locked ? <LockOutlined style={{ fontSize: 12 }} /> : <UnlockOutlined style={{ fontSize: 12 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  lockComponent(comp.id, !comp.locked);
                }}
                style={{ width: 20, height: 20, minWidth: 20 }}
              />
            </Tooltip>
          </Space>
        </div>
      ),
    })) || [];

  // 处理重命名
  const handleRename = (page: Page) => {
    setRenamingPage(page);
    setNewPageName(page.name);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = () => {
    if (renamingPage && newPageName.trim()) {
      renamePage(renamingPage.id, newPageName.trim());
      setRenameModalVisible(false);
      setRenamingPage(null);
      setNewPageName('');
    }
  };

  // 场景卡片菜单
  const getSceneMenuItems = (page: Page): MenuProps['items'] => [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: '重命名',
      onClick: () => handleRename(page),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: '复制场景',
      onClick: () => duplicatePage(page.id),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除场景',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确认删除',
          content: `确定要删除场景"${page.name}"吗？此操作不可恢复。`,
          okText: '删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => deletePage(page.id),
        });
      },
    },
  ];

  // 素材库分类（使用预置素材分类）
  const materialTabs = [
    { key: 'all', label: '全部', icon: <AppstoreOutlined /> },
    ...RESOURCE_CATEGORIES.filter(cat =>
      // 只显示有素材的分类
      cat.key === 'player' || cat.key === 'enemy' || cat.key === 'npc' || cat.key === 'other'
    ).map(cat => ({
      key: cat.key,
      label: cat.label,
      icon: <span>{cat.icon}</span>
    })),
    { key: 'components', label: '组件', icon: <AppstoreOutlined /> },
  ];

  // 处理组件拖拽开始
  const handleDragStart = (e: React.DragEvent, componentType: string) => {
    e.dataTransfer.setData('componentType', componentType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 获取素材列表
  const getMaterialItems = () => {
    if (materialCategory === 'all') {
      // 显示所有预置素材
      return PRESET_ASSETS.map(asset => ({
        id: asset.name,
        name: asset.name,
        type: 'image',
        path: asset.path,
        category: asset.category,
        isPreset: true,
      }));
    } else if (materialCategory === 'components') {
      // 显示组件
      return COMPONENT_CATEGORIES.flatMap(cat =>
        getComponentsByCategory(cat.key as ComponentCategory).map(comp => ({
          id: comp.id,
          name: comp.name,
          type: comp.type,
          icon: <AppstoreOutlined />,
          isComponent: true,
        }))
      );
    } else {
      // 按分类筛选预置素材
      return PRESET_ASSETS.filter(asset => asset.category === materialCategory).map(asset => ({
        id: asset.name,
        name: asset.name,
        type: 'image',
        path: asset.path,
        category: asset.category,
        isPreset: true,
      }));
    }
  };

  if (leftSidebarCollapsed) {
    return null;
  }

  return (
    <Sider
      width={leftSidebarWidth}
      style={{
        background: '#1a1a1a',
        borderRight: '1px solid #333',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(keys as string[])}
          bordered={false}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: 10, color: '#888' }} />
          )}
          style={{ background: 'transparent' }}
        >
          {/* 场景管理 */}
          <Collapse.Panel
            key="scenes"
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#ccc' }}>场景管理</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined style={{ fontSize: 12 }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPage();
                  }}
                  style={{ width: 20, height: 20, minWidth: 20, color: '#888' }}
                />
              </div>
            }
            style={{ borderBottom: '1px solid #333' }}
          >
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {currentProject?.pages && currentProject.pages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {currentProject.pages.map((page) => (
                    <div
                      key={page.id}
                      onClick={() => setCurrentPage(page.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: currentPageId === page.id ? '#2a4a6a' : 'transparent',
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: currentPageId === page.id ? '1px solid #1677ff' : '1px solid transparent',
                      }}
                    >
                      <Text
                        ellipsis
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: currentPageId === page.id ? '#fff' : '#aaa',
                        }}
                      >
                        {page.name}
                      </Text>
                      <Dropdown menu={{ items: getSceneMenuItems(page) }} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined style={{ fontSize: 12 }} />}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 20, height: 20, minWidth: 20, color: '#888' }}
                        />
                      </Dropdown>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="暂无场景" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '12px 0' }} />
              )}
            </div>
          </Collapse.Panel>

          {/* 背景图层 */}
          <Collapse.Panel
            key="backgroundLayers"
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#ccc' }}>背景图层</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined style={{ fontSize: 12 }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 添加背景图层
                    message.info('请从资源管理中右键图片添加为背景');
                  }}
                  style={{ width: 20, height: 20, minWidth: 20, color: '#888' }}
                />
              </div>
            }
            style={{ borderBottom: '1px solid #333' }}
          >
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {currentPage?.backgroundLayers && currentPage.backgroundLayers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {currentPage.backgroundLayers
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((layer, index) => (
                      <div
                        key={layer.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '6px 8px',
                          background: '#222',
                          borderRadius: 4,
                          border: '1px solid #333',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text ellipsis style={{ flex: 1, fontSize: 12, color: '#ccc' }}>
                            {layer.name}
                          </Text>
                          <Space size={2}>
                            <Tooltip title="上移">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowUpOutlined style={{ fontSize: 10 }} />}
                                disabled={index === 0}
                                onClick={() => moveBackgroundLayerUp(layer.id)}
                                style={{ width: 18, height: 18, minWidth: 18, color: '#888' }}
                              />
                            </Tooltip>
                            <Tooltip title="下移">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowDownOutlined style={{ fontSize: 10 }} />}
                                disabled={index === currentPage.backgroundLayers!.length - 1}
                                onClick={() => moveBackgroundLayerDown(layer.id)}
                                style={{ width: 18, height: 18, minWidth: 18, color: '#888' }}
                              />
                            </Tooltip>
                            <Tooltip title={layer.visible ? '隐藏' : '显示'}>
                              <Button
                                type="text"
                                size="small"
                                icon={layer.visible ? <EyeOutlined style={{ fontSize: 10 }} /> : <EyeInvisibleOutlined style={{ fontSize: 10 }} />}
                                onClick={() => toggleBackgroundLayerVisibility(layer.id)}
                                style={{ width: 18, height: 18, minWidth: 18, color: '#888' }}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Popconfirm
                                title="确认删除"
                                description={`确定要删除背景图层"${layer.name}"吗？`}
                                onConfirm={() => deleteBackgroundLayer(layer.id)}
                                okText="删除"
                                cancelText="取消"
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                                  style={{ width: 18, height: 18, minWidth: 18 }}
                                />
                              </Popconfirm>
                            </Tooltip>
                          </Space>
                        </div>
                        <div style={{ display: 'flex', gap: 4, fontSize: 11 }}>
                          <Text style={{ color: '#666' }}>视差:</Text>
                          <Text style={{ color: '#888' }}>{layer.parallaxSpeed.toFixed(1)}x</Text>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <Empty
                  description={
                    <Text style={{ fontSize: 11, color: '#666' }}>
                      从资源管理右键图片<br/>添加为背景图层
                    </Text>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '12px 0' }}
                />
              )}
            </div>
          </Collapse.Panel>

          {/* 图层层级 */}
          <Collapse.Panel
            key="layers"
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#ccc' }}>图层层级</Text>
              </div>
            }
            style={{ borderBottom: '1px solid #333' }}
          >
            {/* 图层操作工具栏 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              padding: '4px 0',
              borderBottom: '1px solid #333',
            }}>
              <Space size={2}>
                <Tooltip title="置顶">
                  <Button
                    type="text"
                    size="small"
                    icon={<VerticalAlignTopOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && bringToFront(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24, color: '#888' }}
                  />
                </Tooltip>
                <Tooltip title="上移一层">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && bringForward(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24, color: '#888' }}
                  />
                </Tooltip>
                <Tooltip title="下移一层">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && sendBackward(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24, color: '#888' }}
                  />
                </Tooltip>
                <Tooltip title="置底">
                  <Button
                    type="text"
                    size="small"
                    icon={<VerticalAlignBottomOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && sendToBack(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24, color: '#888' }}
                  />
                </Tooltip>
              </Space>
              <Space size={2}>
                <Tooltip title="复制">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && duplicateComponent(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24, color: '#888' }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                    disabled={!selectedComponentId}
                    onClick={() => selectedComponentId && deleteComponent(selectedComponentId)}
                    style={{ width: 24, height: 24, minWidth: 24 }}
                  />
                </Tooltip>
              </Space>
            </div>
            {/* 图层列表 */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {layerTreeData.length > 0 ? (
                <Tree
                  treeData={layerTreeData}
                  selectedKeys={selectedComponentId ? [selectedComponentId] : []}
                  onSelect={(keys) => {
                    selectComponent(keys.length > 0 ? (keys[0] as string) : null);
                  }}
                  style={{ background: 'transparent', fontSize: 12 }}
                />
              ) : (
                <Empty description="暂无图层" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '12px 0' }} />
              )}
            </div>
          </Collapse.Panel>

          {/* 素材库 */}
          <Collapse.Panel
            key="materials"
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#ccc' }}>素材库</Text>
              </div>
            }
            style={{ borderBottom: '1px solid #333' }}
          >
            {/* 分类标签 */}
            <div style={{ marginBottom: 8 }}>
              <Tabs
                size="small"
                activeKey={materialCategory}
                onChange={setMaterialCategory}
                items={materialTabs.map(tab => ({
                  key: tab.key,
                  label: (
                    <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {tab.icon}
                      {tab.label}
                    </span>
                  ),
                }))}
                style={{ marginBottom: 0 }}
              />
            </div>
            {/* 素材网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {getMaterialItems().map((item: { id: string; name: string; type: string; path?: string; icon?: React.ReactNode; isComponent?: boolean; isPreset?: boolean }) => (
                <Tooltip key={item.id} title={item.name}>
                  <div
                    draggable={item.isComponent}
                    onDragStart={(e) => {
                      if (item.isComponent) {
                        handleDragStart(e, item.type);
                      } else if (item.isPreset && item.path) {
                        // 预置素材拖拽 - 传递图片路径
                        e.dataTransfer.setData('componentType', 'image');
                        e.dataTransfer.setData('imageSrc', item.path);
                        e.dataTransfer.setData('imageName', item.name);
                        e.dataTransfer.effectAllowed = 'copy';
                      }
                    }}
                    onClick={() => {
                      if (item.isComponent) {
                        addComponent(item.type);
                      } else if (item.isPreset && item.path) {
                        // 点击预置素材添加图片组件
                        addComponent('image', {
                          props: { src: item.path },
                          name: item.name,
                        });
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px 4px',
                      background: '#262626',
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1677ff';
                      e.currentTarget.style.background = '#1f1f1f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.background = '#262626';
                    }}
                  >
                    {item.isPreset && item.path ? (
                      <img
                        src={item.path}
                        alt={item.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'contain',
                          marginBottom: 2,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 16, marginBottom: 2 }}>
                        {typeof item.icon === 'string' ? item.icon : item.icon}
                      </span>
                    )}
                    <Text style={{ fontSize: 10, color: '#aaa' }} ellipsis>
                      {item.name}
                    </Text>
                  </div>
                </Tooltip>
              ))}
            </div>
          </Collapse.Panel>

          {/* 资源管理 */}
          <Collapse.Panel
            key="resources"
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={{ fontSize: 12, color: '#ccc' }}>资源管理 ({resources.length})</Text>
              </div>
            }
            style={{ borderBottom: '1px solid #333' }}
          >
            {/* 资源类型筛选 */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              {resourceTypes.map((type) => (
                <Button
                  key={type.key}
                  type={resourceType === type.key ? 'primary' : 'text'}
                  size="small"
                  icon={type.icon}
                  onClick={() => setResourceType(type.key)}
                  style={{
                    fontSize: 11,
                    padding: '0 6px',
                    height: 24,
                    color: resourceType === type.key ? undefined : '#888',
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {/* 上传按钮 */}
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              multiple
              accept="image/*,audio/*,video/*,.ttf,.otf,.woff,.woff2"
            >
              <Button
                type="dashed"
                size="small"
                icon={<UploadOutlined />}
                style={{ width: '100%', marginBottom: 8, color: '#888' }}
              >
                上传资源
              </Button>
            </Upload>

            {/* 资源列表 */}
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {getFilteredResources().length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {getFilteredResources().map((resource) => {
                    // 为图片资源创建右键菜单
                    const resourceMenuItems: MenuProps['items'] = resource.type === 'image' ? [
                      {
                        key: 'addAsBackground',
                        icon: <FileImageOutlined />,
                        label: '添加为背景图层',
                        onClick: () => {
                          if (resource.path) {
                            const layer = addBackgroundLayer(resource.path, resource.name);
                            if (layer) {
                              message.success(`已添加背景图层: ${layer.name}`);
                            }
                          }
                        },
                      },
                      {
                        key: 'addToCanvas',
                        icon: <AppstoreOutlined />,
                        label: '添加到画布',
                        onClick: () => {
                          if (resource.path) {
                            addComponent('image', {
                              props: { src: resource.path },
                              name: resource.name,
                            });
                            message.success(`已添加到画布: ${resource.name}`);
                          }
                        },
                      },
                      {
                        type: 'divider',
                      },
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除资源',
                        danger: true,
                        onClick: () => {
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除资源"${resource.name}"吗？`,
                            okText: '删除',
                            okType: 'danger',
                            cancelText: '取消',
                            onOk: () => deleteResource(resource.id),
                          });
                        },
                      },
                    ] : undefined;

                    return (
                      <Dropdown
                        key={resource.id}
                        menu={resourceMenuItems ? { items: resourceMenuItems } : undefined}
                        trigger={['contextMenu']}
                        disabled={resource.type !== 'image'}
                      >
                        <div
                          draggable={resource.type === 'image'}
                          onDragStart={(e) => {
                            if (resource.type === 'image' && resource.path) {
                              e.dataTransfer.setData('componentType', 'image');
                              e.dataTransfer.setData('imageSrc', resource.path);
                              e.dataTransfer.setData('imageName', resource.name);
                              e.dataTransfer.effectAllowed = 'copy';
                            }
                          }}
                          onClick={() => {
                            // 点击图片资源直接添加到画布
                            if (resource.type === 'image' && resource.path) {
                              addComponent('image', {
                                props: { src: resource.path },
                                name: resource.name,
                              });
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: '#262626',
                            borderRadius: 4,
                            cursor: resource.type === 'image' ? 'grab' : 'default',
                            border: '1px solid transparent',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (resource.type === 'image') {
                              e.currentTarget.style.borderColor = '#1677ff';
                              e.currentTarget.style.background = '#1f1f1f';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.background = '#262626';
                          }}
                        >
                      <Space size={8} style={{ flex: 1, minWidth: 0 }}>
                        {resource.type === 'image' && resource.path ? (
                          <img
                            src={resource.path}
                            alt={resource.name}
                            style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 2 }}
                          />
                        ) : resource.type === 'audio' ? (
                          <SoundOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                        ) : resource.type === 'video' ? (
                          <VideoCameraOutlined style={{ fontSize: 16, color: '#1677ff' }} />
                        ) : resource.type === 'font' ? (
                          <FontSizeOutlined style={{ fontSize: 16, color: '#faad14' }} />
                        ) : (
                          <FileOutlined style={{ fontSize: 16, color: '#888' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text ellipsis style={{ fontSize: 11, display: 'block', color: '#ccc' }}>
                            {resource.name}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#666' }}>
                            {(resource.size / 1024).toFixed(1)} KB
                          </Text>
                        </div>
                      </Space>
                      <Popconfirm
                        title="确定删除此资源？"
                        onConfirm={() => deleteResource(resource.id)}
                        okText="删除"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 20, height: 20, minWidth: 20 }}
                        />
                      </Popconfirm>
                    </div>
                      </Dropdown>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  description="暂无资源"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: '12px 0' }}
                />
              )}
            </div>
          </Collapse.Panel>
        </Collapse>
      </div>

      {/* 重命名对话框 */}
      <Modal
        title="重命名场景"
        open={renameModalVisible}
        onOk={handleRenameConfirm}
        onCancel={() => {
          setRenameModalVisible(false);
          setRenamingPage(null);
          setNewPageName('');
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          placeholder="请输入场景名称"
          onPressEnter={handleRenameConfirm}
        />
      </Modal>

      {/* 添加场景对话框 */}
      <Modal
        title="添加场景"
        open={addPageModalVisible}
        onOk={handleAddPageConfirm}
        onCancel={() => {
          setAddPageModalVisible(false);
          setNewSceneName('');
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          value={newSceneName}
          onChange={(e) => setNewSceneName(e.target.value)}
          placeholder="请输入场景名称"
          onPressEnter={handleAddPageConfirm}
          autoFocus
        />
      </Modal>
    </Sider>
  );
};

export default LeftSidebar;
