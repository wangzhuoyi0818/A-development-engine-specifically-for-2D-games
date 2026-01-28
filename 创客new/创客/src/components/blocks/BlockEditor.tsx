import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Tabs, Typography, Tooltip, Tag, Input } from 'antd';
import { SearchOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Block, BlockCategory, BlockDefinition, BLOCK_COLORS, getBlocksByCategory, createBlock, BlockType } from '@/types/block';

const { Text } = Typography;

// 积木分类配置 - 10大核心模块
const BLOCK_CATEGORIES: { key: BlockCategory; label: string; icon: string; symbol: string; color: string }[] = [
  { key: 'state', label: '状态管理', icon: '⭐', symbol: '★', color: BLOCK_COLORS.state },
  { key: 'event', label: '事件系统', icon: '🚩', symbol: '⚑', color: BLOCK_COLORS.event },
  { key: 'motion', label: '运动控制', icon: '➡️', symbol: '→', color: BLOCK_COLORS.motion },
  { key: 'looks', label: '外观声音', icon: '👁', symbol: '○', color: BLOCK_COLORS.looks },
  { key: 'sensing', label: '侦测物理', icon: '📡', symbol: '?', color: BLOCK_COLORS.sensing },
  { key: 'effects', label: '特效系统', icon: '✨', symbol: '☆', color: BLOCK_COLORS.effects },
  { key: 'logic', label: '逻辑运算', icon: '◇', symbol: '◆', color: BLOCK_COLORS.logic },
  { key: 'data', label: '运算数据', icon: '➕', symbol: '+', color: BLOCK_COLORS.data },
  { key: 'storage', label: '数据存储', icon: '📦', symbol: '□', color: BLOCK_COLORS.storage },
  { key: 'extension', label: '扩展功能', icon: '🔌', symbol: '⊕', color: BLOCK_COLORS.extension },
];

// 流程节点组件 - 单独提取以支持 hooks
interface FlowNodeProps {
  block: Block;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  prefix: string;
  symbol: string;
  blockColor: string;
  formattedContent: string;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const FlowNode: React.FC<FlowNodeProps> = ({
  block,
  isSelected,
  isFirst,
  isLast,
  prefix,
  symbol,
  blockColor,
  formattedContent,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false);
  const linePrefix = prefix ? (isLast ? '`-- ' : '|-- ') : '';

  return (
    <div>
      <div
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          fontFamily: "'Consolas', 'Monaco', monospace",
          fontSize: 12,
          lineHeight: 1.8,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ color: '#6b7280' }}>{prefix}{linePrefix}</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: 4,
              background: isSelected ? 'rgba(22, 119, 255, 0.2)' : hovered ? '#262626' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            <span style={{ color: blockColor, marginRight: 6 }}>{symbol}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.88)' }}>{formattedContent}</span>
          </span>
        </div>
        {/* 操作按钮 */}
        {hovered && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
            <Tooltip title="上移">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                disabled={isFirst}
                style={{
                  width: 18,
                  height: 18,
                  border: 'none',
                  background: isFirst ? '#333' : '#424242',
                  borderRadius: 3,
                  color: isFirst ? '#666' : '#fff',
                  fontSize: 10,
                  cursor: isFirst ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ↑
              </button>
            </Tooltip>
            <Tooltip title="下移">
              <button
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                disabled={isLast}
                style={{
                  width: 18,
                  height: 18,
                  border: 'none',
                  background: isLast ? '#333' : '#424242',
                  borderRadius: 3,
                  color: isLast ? '#666' : '#fff',
                  fontSize: 10,
                  cursor: isLast ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ↓
              </button>
            </Tooltip>
            <Tooltip title="删除">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  width: 18,
                  height: 18,
                  border: 'none',
                  background: '#ff4d4f',
                  borderRadius: 3,
                  color: '#fff',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  componentName?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  componentName = '组件',
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<BlockDefinition | null>(null);
  const [flowViewCollapsed, setFlowViewCollapsed] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Set<BlockCategory>>(new Set(BLOCK_CATEGORIES.map(c => c.key)));
  const [searchText, setSearchText] = useState<string>('');
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 移动积木位置
  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, removed);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  // 上移积木
  const moveBlockUp = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index > 0) {
      moveBlock(index, index - 1);
    }
  }, [blocks, moveBlock]);

  // 下移积木
  const moveBlockDown = useCallback((blockId: string) => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index < blocks.length - 1) {
      moveBlock(index, index + 1);
    }
  }, [blocks, moveBlock]);

  // 滚动到指定积木
  const scrollToBlock = useCallback((blockId: string) => {
    const blockEl = blockRefs.current.get(blockId);
    if (blockEl) {
      blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // 选中并滚动到积木
  const selectAndScrollToBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    setTimeout(() => scrollToBlock(blockId), 100);
  }, [scrollToBlock]);

  // 切换筛选器
  const toggleFilter = (category: BlockCategory) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(category)) {
        newFilters.delete(category);
      } else {
        newFilters.add(category);
      }
      return newFilters;
    });
  };

  // 筛选后的积木列表
  const filteredBlocks = useMemo(() => {
    return blocks.filter(block => activeFilters.has(block.category));
  }, [blocks, activeFilters]);

  // 获取当前使用的分类
  const usedCategories = useMemo(() => {
    const categories = new Set<BlockCategory>();
    blocks.forEach(block => categories.add(block.category));
    return categories;
  }, [blocks]);

  // 获取分类符号（用于流程视图）
  const getCategorySymbol = (category: BlockCategory): string => {
    const cat = BLOCK_CATEGORIES.find(c => c.key === category);
    return cat?.symbol || '*';
  };

  // 格式化积木显示内容
  const formatBlockContent = (b: Block): string => {
    const values = Object.entries(b.values)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${v}`)
      .join(', ');
    return values ? `${b.name} [${values}]` : b.name;
  };

  // 渲染流程视图树节点
  const renderFlowNode = (block: Block, index: number, prefix: string = '', isLast: boolean = true) => {
    const blockColor = BLOCK_COLORS[block.category];
    const symbol = getCategorySymbol(block.category);
    const isSelected = selectedBlockId === block.id;
    const blockIndex = blocks.findIndex(b => b.id === block.id);

    return (
      <FlowNode
        key={block.id}
        block={block}
        isSelected={isSelected}
        isFirst={blockIndex === 0}
        isLast={blockIndex === blocks.length - 1}
        prefix={prefix}
        symbol={symbol}
        blockColor={blockColor}
        formattedContent={formatBlockContent(block)}
        onSelect={() => selectAndScrollToBlock(block.id)}
        onMoveUp={() => moveBlockUp(block.id)}
        onMoveDown={() => moveBlockDown(block.id)}
        onDelete={() => handleDeleteBlock(block.id)}
      />
    );
  };

  // 渲染筛选标签
  const renderFilterTags = () => {
    // 只显示当前使用的分类
    const relevantCategories = BLOCK_CATEGORIES.filter(cat => usedCategories.has(cat.key));
    if (relevantCategories.length === 0) return null;

    return (
      <div style={{
        padding: '6px 12px',
        background: '#1f1f1f',
        borderBottom: '1px solid #424242',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        {relevantCategories.map(cat => {
          const isActive = activeFilters.has(cat.key);
          return (
            <Tag
              key={cat.key}
              onClick={() => toggleFilter(cat.key)}
              style={{
                cursor: 'pointer',
                background: isActive ? cat.color : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${isActive ? cat.color : '#424242'}`,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                transition: 'all 0.15s',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <span style={{ marginRight: 4 }}>{cat.symbol}</span>
              {cat.label}
            </Tag>
          );
        })}
      </div>
    );
  };

  // 渲染流程视图
  const renderFlowView = () => (
    <div style={{
      background: '#1a1a1a',
      borderRadius: 6,
      marginTop: 6,
      overflow: 'hidden',
      border: '1px solid #333',
      transition: 'all 0.2s ease',
    }}>
      {/* 标题栏 */}
      <div
        onClick={() => setFlowViewCollapsed(!flowViewCollapsed)}
        style={{
          padding: '6px 10px',
          background: '#252525',
          borderBottom: flowViewCollapsed ? 'none' : '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text strong style={{ color: '#1677ff', fontSize: 11 }}>
            <span style={{ marginRight: 4, fontFamily: 'Arial, sans-serif' }}>≡</span>
            流程
          </Text>
          {blocks.length > 0 && (
            <span style={{
              background: '#1677ff',
              color: '#fff',
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 8,
            }}>
              {filteredBlocks.length}
            </span>
          )}
        </div>
        <span style={{
          color: '#6b7280',
          fontSize: 10,
          transition: 'transform 0.2s',
          transform: flowViewCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          fontFamily: 'Arial, sans-serif',
        }}>
          ▾
        </span>
      </div>

      {/* 树形结构区域 - 更紧凑 */}
      {!flowViewCollapsed && (
        <div style={{
          padding: 8,
          maxHeight: 120,
          overflow: 'auto',
        }}>
          {blocks.length === 0 ? (
            <div style={{
              color: '#666',
              fontSize: 11,
              textAlign: 'center',
              padding: '8px 0',
            }}>
              暂无积木
            </div>
          ) : filteredBlocks.length === 0 ? (
            <div style={{
              color: '#666',
              fontSize: 11,
              textAlign: 'center',
              padding: '8px 0',
            }}>
              没有匹配的积木
            </div>
          ) : (
            filteredBlocks.map((block, index) => renderFlowNode(block, index, '', index === filteredBlocks.length - 1))
          )}
        </div>
      )}
    </div>
  );

  // 处理从积木库拖拽
  const handleBlockDragStart = (e: React.DragEvent, blockDef: BlockDefinition) => {
    e.dataTransfer.setData('blockType', blockDef.type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedBlock(blockDef);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  // 处理放置到工作区
  const handleWorkspaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType') as BlockType;
    if (!blockType) return;

    const newBlock = createBlock(blockType);
    if (newBlock) {
      onBlocksChange([...blocks, newBlock]);
    }
    setDraggedBlock(null);
  };

  const handleWorkspaceDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // 删除积木
  const handleDeleteBlock = (blockId: string) => {
    onBlocksChange(blocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // 更新积木值
  const handleBlockValueChange = (blockId: string, inputName: string, value: unknown) => {
    onBlocksChange(blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          values: { ...b.values, [inputName]: value },
        };
      }
      return b;
    }));
  };

  // 搜索过滤积木库
  const getFilteredBlocks = (category: BlockCategory) => {
    const categoryBlocks = getBlocksByCategory(category);
    if (!searchText.trim()) return categoryBlocks;
    const search = searchText.toLowerCase();
    return categoryBlocks.filter(b =>
      b.name.toLowerCase().includes(search) ||
      b.description.toLowerCase().includes(search)
    );
  };

  // 当前选中的分类
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>('event');

  // 渲染 Scratch 风格的积木库项目
  const renderLibraryBlock = (blockDef: BlockDefinition) => {
    const darkerColor = blockDef.color.replace(/^#/, '');
    const r = Math.max(0, parseInt(darkerColor.slice(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(darkerColor.slice(2, 4), 16) - 30);
    const b = Math.max(0, parseInt(darkerColor.slice(4, 6), 16) - 30);
    const borderColor = `rgb(${r}, ${g}, ${b})`;

    return (
      <div
        key={blockDef.type}
        draggable
        onDragStart={(e) => handleBlockDragStart(e, blockDef)}
        onDragEnd={handleDragEnd}
        style={{
          position: 'relative',
          marginBottom: 6,
        }}
      >
        <svg width="100%" height="42" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={`lib-grad-${blockDef.type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={blockDef.color} />
              <stop offset="100%" stopColor={borderColor} />
            </linearGradient>
          </defs>
          <path
            d={`M 0 4 Q 0 0 4 0 L 20 0 L 23 4 L 32 4 L 35 0 L 196 0 Q 200 0 200 4 L 200 34 Q 200 38 196 38 L 35 38 L 32 42 L 23 42 L 20 38 L 4 38 Q 0 38 0 34 Z`}
            fill={`url(#lib-grad-${blockDef.type})`}
            stroke={borderColor}
            strokeWidth={1}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 12px',
            cursor: 'grab',
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {blockDef.template.split('{')[0].trim()}
          </div>
          <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {blockDef.description}
          </div>
        </div>
      </div>
    );
  };

  // 渲染积木库 - 重新设计为左右布局（积木预览 + 右侧竖向分类）
  const renderBlockLibrary = () => {
    const filteredCategoryBlocks = getFilteredBlocks(selectedCategory);
    const currentCat = BLOCK_CATEGORIES.find(c => c.key === selectedCategory);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
        {/* 左侧积木预览区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 搜索框 */}
          <div style={{ padding: 8 }}>
            <Input
              placeholder="搜索..."
              prefix={<SearchOutlined style={{ color: '#666' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="small"
              style={{
                background: '#333',
                borderColor: '#424242',
              }}
            />
          </div>

          {/* 分类标题 */}
          <div style={{
            padding: '4px 12px 8px',
            borderBottom: '1px solid #404040',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: currentCat?.color || '#666',
            }} />
            <span style={{ color: '#e0e0e0', fontSize: 12, fontWeight: 600 }}>
              {currentCat?.label || '积木'}
            </span>
            <span style={{ color: '#888', fontSize: 11 }}>
              ({filteredCategoryBlocks.length})
            </span>
          </div>

          {/* 积木列表 */}
          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {filteredCategoryBlocks.length === 0 ? (
              <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                {searchText ? '没有匹配的积木' : '该分类暂无积木'}
              </div>
            ) : (
              filteredCategoryBlocks.map(blockDef => renderLibraryBlock(blockDef))
            )}
          </div>
        </div>

        {/* 右侧竖向分类栏 */}
        <div style={{
          width: 48,
          background: '#1a1a1a',
          borderLeft: '1px solid #404040',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          padding: '4px 0',
        }}>
          {BLOCK_CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.key;
            const catBlocks = getFilteredBlocks(cat.key);
            const hasBlocks = catBlocks.length > 0;

            return (
              <Tooltip key={cat.key} title={`${cat.label} (${catBlocks.length})`} placement="left">
                <div
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    width: 40,
                    height: 40,
                    margin: '2px 4px',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: isActive ? cat.color : 'transparent',
                    border: isActive ? 'none' : `1px solid ${hasBlocks ? cat.color : '#444'}`,
                    opacity: hasBlocks ? 1 : 0.4,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    color: isActive ? '#fff' : cat.color,
                    lineHeight: 1,
                  }}>{cat.symbol}</span>
                  <span style={{
                    fontSize: 8,
                    color: isActive ? '#fff' : '#999',
                    marginTop: 2,
                    lineHeight: 1,
                  }}>{cat.label.slice(0, 2)}</span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  };

  // 判断是否为事件/帽子积木（顶部圆形）
  const isHatBlock = (category: BlockCategory) => {
    return category === 'event' || category === 'game_event';
  };

  // Scratch 风格积木的 SVG 路径
  const getBlockPath = (width: number, height: number, isHat: boolean, hasNotchTop: boolean, hasNotchBottom: boolean) => {
    const notchWidth = 15;
    const notchHeight = 4;
    const notchOffset = 20;
    const radius = 4;
    const hatRadius = isHat ? 20 : 0;

    let path = '';

    if (isHat) {
      // 帽子形状：顶部圆角
      path = `M 0 ${hatRadius} Q 0 0 ${hatRadius} 0 L ${width - hatRadius} 0 Q ${width} 0 ${width} ${hatRadius}`;
    } else if (hasNotchTop) {
      // 顶部有凹槽
      path = `M 0 ${radius} Q 0 0 ${radius} 0 L ${notchOffset} 0 L ${notchOffset + 3} ${notchHeight} L ${notchOffset + notchWidth - 3} ${notchHeight} L ${notchOffset + notchWidth} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius}`;
    } else {
      // 普通顶部
      path = `M 0 ${radius} Q 0 0 ${radius} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius}`;
    }

    // 右侧
    path += ` L ${width} ${height - radius} Q ${width} ${height} ${width - radius} ${height}`;

    // 底部带凸起
    if (hasNotchBottom) {
      path += ` L ${notchOffset + notchWidth} ${height} L ${notchOffset + notchWidth - 3} ${height + notchHeight} L ${notchOffset + 3} ${height + notchHeight} L ${notchOffset} ${height}`;
    }

    // 左侧返回
    path += ` L ${radius} ${height} Q 0 ${height} 0 ${height - radius} Z`;

    return path;
  };

  // 渲染单个积木 - Scratch 风格
  const renderBlock = (block: Block, index: number) => {
    const isSelected = selectedBlockId === block.id;
    const blockColor = BLOCK_COLORS[block.category];
    const isHat = isHatBlock(block.category);
    const hasNotchTop = index > 0 && !isHat;
    const hasNotchBottom = index < blocks.length - 1;

    // 计算积木尺寸
    const blockWidth = 260;
    const baseHeight = 44;
    const inputHeight = block.inputs.length * 32;
    const blockHeight = baseHeight + inputHeight;
    const notchHeight = 4;
    const svgHeight = blockHeight + (hasNotchBottom ? notchHeight : 0);

    // 生成较深的边框颜色
    const darkerColor = blockColor.replace(/^#/, '');
    const r = Math.max(0, parseInt(darkerColor.slice(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(darkerColor.slice(2, 4), 16) - 40);
    const b = Math.max(0, parseInt(darkerColor.slice(4, 6), 16) - 40);
    const borderColor = `rgb(${r}, ${g}, ${b})`;

    return (
      <div
        key={block.id}
        ref={(el) => { if (el) blockRefs.current.set(block.id, el); }}
        onClick={() => setSelectedBlockId(block.id)}
        style={{
          position: 'relative',
          marginBottom: hasNotchBottom ? 0 : 8,
          marginTop: index === 0 ? 0 : (hasNotchTop ? -notchHeight : 8),
          cursor: 'pointer',
          filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          transition: 'filter 0.15s',
        }}
      >
        {/* SVG 积木形状 */}
        <svg
          width={blockWidth}
          height={svgHeight}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={`grad-${block.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={blockColor} />
              <stop offset="100%" stopColor={borderColor} />
            </linearGradient>
          </defs>
          <path
            d={getBlockPath(blockWidth, blockHeight, isHat, hasNotchTop, hasNotchBottom)}
            fill={`url(#grad-${block.id})`}
            stroke={borderColor}
            strokeWidth={1.5}
          />
        </svg>

        {/* 积木内容覆盖层 */}
        <div
          style={{
            position: 'absolute',
            top: isHat ? 8 : 6,
            left: 12,
            right: 12,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        >
          {/* 删除按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBlock(block.id);
            }}
            style={{
              position: 'absolute',
              top: 0,
              right: -4,
              width: 20,
              height: 20,
              border: 'none',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '50%',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.background = 'rgba(255,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
            }}
          >
            x
          </button>

          {/* 积木名称 - 内嵌样式 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6,
            paddingRight: 24,
          }}>
            <span>{block.name}</span>
          </div>

          {/* 输入项 - Scratch 风格嵌入式 */}
          {block.inputs.map(input => (
            <div key={input.name} style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 12, opacity: 0.9 }}>{input.label}</span>
              {input.type === 'string' || input.type === 'expression' ? (
                <input
                  type="text"
                  value={(block.values[input.name] as string) || ''}
                  onChange={(e) => handleBlockValueChange(block.id, input.name, e.target.value)}
                  placeholder={input.placeholder || '...'}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    minWidth: 60,
                    padding: '3px 8px',
                    border: 'none',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    fontSize: 12,
                    outline: 'none',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              ) : input.type === 'number' ? (
                <input
                  type="number"
                  value={(block.values[input.name] as number) || 0}
                  onChange={(e) => handleBlockValueChange(block.id, input.name, Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: 60,
                    padding: '3px 8px',
                    border: 'none',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    fontSize: 12,
                    outline: 'none',
                    textAlign: 'center',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              ) : input.type === 'select' ? (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <select
                    value={(block.values[input.name] as string) || ''}
                    onChange={(e) => handleBlockValueChange(block.id, input.name, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '3px 24px 3px 8px',
                      border: 'none',
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.25)',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {input.options?.map(opt => (
                      <option key={String(opt.value)} value={String(opt.value)} style={{ color: '#333', background: '#fff' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute',
                    right: 8,
                    pointerEvents: 'none',
                    fontSize: 10,
                    opacity: 0.8,
                  }}>▼</span>
                </div>
              ) : input.type === 'boolean' ? (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 10px',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={(block.values[input.name] as boolean) || false}
                    onChange={(e) => handleBlockValueChange(block.id, input.name, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11 }}>{block.values[input.name] ? '是' : '否'}</span>
                </label>
              ) : null}
            </div>
          ))}
        </div>

        {/* 左侧连接线 */}
        {index > 0 && (
          <div style={{
            position: 'absolute',
            left: -16,
            top: -8,
            bottom: hasNotchBottom ? notchHeight : 0,
            width: 3,
            background: `linear-gradient(to bottom, ${BLOCK_COLORS[blocks[index - 1].category]}, ${blockColor})`,
            borderRadius: 2,
          }} />
        )}
      </div>
    );
  };

  // 渲染工作区
  const renderWorkspace = () => (
    <div
      ref={workspaceRef}
      onDrop={handleWorkspaceDrop}
      onDragOver={handleWorkspaceDragOver}
      style={{
        flex: 1,
        background: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        minHeight: 300,
        overflow: 'auto',
        border: draggedBlock ? '2px dashed #1677ff' : '2px dashed transparent',
        transition: 'border-color 0.15s',
      }}
    >
      {blocks.length === 0 ? (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: 32 }}>🧩</div>
          <div>从左侧拖拽积木到这里</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>为 "{componentName}" 添加交互逻辑</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {blocks.map((block, index) => renderBlock(block, index))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 8, height: '100%' }}>
      {/* 左侧积木库 - 自适应宽度 */}
      <div style={{
        width: '45%',
        minWidth: 180,
        maxWidth: 280,
        background: '#252525',
        borderRadius: 6,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '6px 10px',
          background: '#333',
          borderBottom: '1px solid #404040',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text strong style={{ color: '#e0e0e0', fontSize: 11 }}>积木库</Text>
          <span style={{ color: '#888', fontSize: 10 }}>拖拽添加</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {renderBlockLibrary()}
        </div>
      </div>

      {/* 右侧区域：工作区 + 流程视图 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 工作区 */}
        {renderWorkspace()}

        {/* 流程视图 - 更紧凑 */}
        {renderFlowView()}
      </div>
    </div>
  );
};

export default BlockEditor;
