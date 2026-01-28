import React, { useState, useMemo } from 'react';
import { Input, Tag, Empty, Rate, Space, Typography, Button, Segmented, Modal } from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  DownloadOutlined,
  EyeOutlined,
  SoundOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PauseOutlined,
} from '@ant-design/icons';
import {
  MaterialItem,
  MaterialCategory,
  MaterialStyle,
  MATERIAL_CATEGORIES,
  MATERIAL_STYLES,
  POPULAR_TAGS,
  OFFICIAL_MATERIALS,
  searchMaterials,
  formatFileSize,
  formatDuration,
} from '@/types/material';

const { Text } = Typography;

interface MaterialLibraryProps {
  onSelectMaterial?: (material: MaterialItem) => void;
  onUseMaterial?: (material: MaterialItem) => void;
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({
  onSelectMaterial,
  onUseMaterial,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | 'all'>('all');
  const [activeStyle, setActiveStyle] = useState<MaterialStyle | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // 过滤素材
  const filteredMaterials = useMemo(() => {
    let materials = OFFICIAL_MATERIALS;

    // 搜索过滤
    if (searchQuery) {
      materials = searchMaterials(searchQuery);
    }

    // 分类过滤
    if (activeCategory !== 'all') {
      materials = materials.filter(m => m.category === activeCategory);
    }

    // 风格过滤
    if (activeStyle !== 'all') {
      materials = materials.filter(m => m.style === activeStyle);
    }

    return materials;
  }, [searchQuery, activeCategory, activeStyle]);

  // 切换收藏
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 播放音频
  const toggleAudio = (material: MaterialItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingAudio === material.id) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(material.id);
    }
  };

  // 处理素材拖拽开始
  const handleDragStart = (e: React.DragEvent, material: MaterialItem) => {
    // 设置素材数据，供画布使用
    e.dataTransfer.setData('material', JSON.stringify(material));
    // 同时设置组件类型为 'image'，以便画布能够识别
    e.dataTransfer.setData('componentType', 'image');
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 处理素材拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    // 拖拽结束时确保数据被清除
    e.dataTransfer.clearData();
  };

  // 渲染素材卡片
  const renderMaterialCard = (material: MaterialItem) => {
    const isFavorite = favorites.has(material.id);
    const isPlaying = playingAudio === material.id;
    const isAudio = material.type === 'audio';
    const categoryConfig = MATERIAL_CATEGORIES.find(c => c.key === material.category);

    return (
      <div
        key={material.id}
        draggable
        onDragStart={(e) => handleDragStart(e, material)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectMaterial?.(material)}
        style={{
          background: '#252525',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'grab',
          border: '1px solid #333',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1677ff';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* 缩略图区域 */}
        <div
          style={{
            height: viewMode === 'grid' ? 100 : 60,
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {isAudio ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <SoundOutlined style={{ fontSize: 32, color: categoryConfig?.color }} />
              <Button
                type="primary"
                size="small"
                shape="circle"
                icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
                onClick={(e) => toggleAudio(material, e)}
              />
              {material.duration && (
                <Text style={{ fontSize: 10, color: '#888' }}>
                  {formatDuration(material.duration)}
                </Text>
              )}
            </div>
          ) : material.thumbnail ? (
            <img
              src={material.thumbnail}
              alt={material.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <PictureOutlined style={{ fontSize: 32, color: '#555' }} />
          )}

          {/* 收藏按钮 */}
          <Button
            type="text"
            size="small"
            icon={isFavorite ? <StarFilled style={{ color: '#FFD700' }} /> : <StarOutlined style={{ color: '#888' }} />}
            onClick={(e) => toggleFavorite(material.id, e)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
            }}
          />

          {/* 预览按钮 */}
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewMaterial(material);
            }}
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              color: '#888',
            }}
          />

          {/* 分类标签 */}
          <Tag
            color={categoryConfig?.color}
            style={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              margin: 0,
              fontSize: 10,
            }}
          >
            {categoryConfig?.icon} {categoryConfig?.label}
          </Tag>
        </div>

        {/* 信息区域 */}
        <div style={{ padding: '8px 10px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <Text
              strong
              ellipsis
              style={{ fontSize: 12, color: '#e0e0e0', flex: 1 }}
            >
              {material.name}
            </Text>
            {material.isOfficial && (
              <Tag color="blue" style={{ marginLeft: 4, fontSize: 10, padding: '0 4px' }}>
                官方
              </Tag>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Space size={4}>
              <Text style={{ fontSize: 10, color: '#888' }}>
                {formatFileSize(material.size)}
              </Text>
              {material.width && material.height && (
                <Text style={{ fontSize: 10, color: '#888' }}>
                  {material.width}×{material.height}
                </Text>
              )}
            </Space>
            <Space size={2}>
              <Rate
                disabled
                defaultValue={material.rating || 0}
                count={1}
                style={{ fontSize: 10 }}
              />
              <Text style={{ fontSize: 10, color: '#888' }}>
                {material.rating?.toFixed(1)}
              </Text>
            </Space>
          </div>

          {/* 标签 */}
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {material.tags.slice(0, 2).map(tag => (
              <Tag
                key={tag.id}
                style={{
                  fontSize: 10,
                  padding: '0 4px',
                  margin: 0,
                  background: '#333',
                  border: 'none',
                  color: '#aaa',
                }}
              >
                {tag.name}
              </Tag>
            ))}
          </div>

          {/* 使用按钮 */}
          <Button
            type="primary"
            size="small"
            block
            icon={<DownloadOutlined />}
            style={{ marginTop: 8 }}
            onClick={(e) => {
              e.stopPropagation();
              onUseMaterial?.(material);
            }}
          >
            使用素材
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 搜索栏 */}
      <div style={{ padding: '12px 12px 8px' }}>
        <Input
          placeholder="搜索素材..."
          prefix={<SearchOutlined style={{ color: '#888' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          style={{ background: '#252525', border: '1px solid #333' }}
        />
      </div>

      {/* 分类标签 */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          <Tag
            color={activeCategory === 'all' ? 'blue' : undefined}
            style={{ cursor: 'pointer', margin: 0 }}
            onClick={() => setActiveCategory('all')}
          >
            全部
          </Tag>
          {MATERIAL_CATEGORIES.map(cat => (
            <Tag
              key={cat.key}
              color={activeCategory === cat.key ? cat.color : undefined}
              style={{ cursor: 'pointer', margin: 0 }}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.icon} {cat.label}
            </Tag>
          ))}
        </div>
      </div>

      {/* 风格筛选 */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
        }}>
          <Tag
            color={activeStyle === 'all' ? 'purple' : undefined}
            style={{ cursor: 'pointer', margin: 0, fontSize: 11 }}
            onClick={() => setActiveStyle('all')}
          >
            全部风格
          </Tag>
          {MATERIAL_STYLES.map(style => (
            <Tag
              key={style.key}
              color={activeStyle === style.key ? 'purple' : undefined}
              style={{ cursor: 'pointer', margin: 0, fontSize: 11 }}
              onClick={() => setActiveStyle(style.key)}
            >
              {style.icon} {style.label}
            </Tag>
          ))}
        </div>
      </div>

      {/* 热门标签 */}
      <div style={{ padding: '0 12px 12px', borderBottom: '1px solid #333' }}>
        <Text style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>
          热门标签:
        </Text>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {POPULAR_TAGS.slice(0, 6).map(tag => (
            <Tag
              key={tag.id}
              style={{
                cursor: 'pointer',
                margin: 0,
                fontSize: 10,
                background: '#2a2a2a',
                border: 'none',
                color: tag.color,
              }}
              onClick={() => setSearchQuery(tag.name)}
            >
              {tag.name}
            </Tag>
          ))}
        </div>
      </div>

      {/* 结果统计和视图切换 */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 12, color: '#888' }}>
          {filteredMaterials.length} 个素材
        </Text>
        <Segmented
          size="small"
          value={viewMode}
          onChange={(v) => setViewMode(v as 'grid' | 'list')}
          options={[
            { value: 'grid', icon: <span>田</span> },
            { value: 'list', icon: <span>≡</span> },
          ]}
        />
      </div>

      {/* 素材列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0 12px 12px',
      }}>
        {filteredMaterials.length === 0 ? (
          <Empty
            description="暂无匹配素材"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(2, 1fr)' : '1fr',
              gap: 10,
            }}
          >
            {filteredMaterials.map(renderMaterialCard)}
          </div>
        )}
      </div>

      {/* 素材预览弹窗 */}
      <Modal
        title={previewMaterial?.name}
        open={!!previewMaterial}
        onCancel={() => setPreviewMaterial(null)}
        footer={[
          <Button key="cancel" onClick={() => setPreviewMaterial(null)}>
            关闭
          </Button>,
          <Button
            key="use"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (previewMaterial) {
                onUseMaterial?.(previewMaterial);
                setPreviewMaterial(null);
              }
            }}
          >
            使用素材
          </Button>,
        ]}
        width={500}
      >
        {previewMaterial && (
          <div style={{ textAlign: 'center' }}>
            {previewMaterial.type === 'audio' ? (
              <div style={{ padding: 40 }}>
                <SoundOutlined style={{ fontSize: 64, color: '#1677ff' }} />
                <div style={{ marginTop: 16 }}>
                  <audio controls src={previewMaterial.url} style={{ width: '100%' }} />
                </div>
              </div>
            ) : (
              <img
                src={previewMaterial.url || previewMaterial.thumbnail}
                alt={previewMaterial.name}
                style={{ maxWidth: '100%', maxHeight: 300 }}
              />
            )}
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">类型: </Text>
                  <Text>{MATERIAL_CATEGORIES.find(c => c.key === previewMaterial.category)?.label}</Text>
                </div>
                <div>
                  <Text type="secondary">尺寸: </Text>
                  <Text>
                    {previewMaterial.width}×{previewMaterial.height}px
                  </Text>
                </div>
                <div>
                  <Text type="secondary">大小: </Text>
                  <Text>{formatFileSize(previewMaterial.size)}</Text>
                </div>
                <div>
                  <Text type="secondary">评分: </Text>
                  <Rate disabled defaultValue={previewMaterial.rating || 0} style={{ fontSize: 14 }} />
                </div>
                <div>
                  <Text type="secondary">标签: </Text>
                  {previewMaterial.tags.map(tag => (
                    <Tag key={tag.id} color={tag.color}>{tag.name}</Tag>
                  ))}
                </div>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialLibrary;
