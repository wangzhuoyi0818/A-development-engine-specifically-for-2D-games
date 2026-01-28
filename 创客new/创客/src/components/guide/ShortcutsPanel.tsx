import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Input,
  Tag,
  Space,
  Tabs,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ControlOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // 文件操作
  { key: 'Ctrl+S', description: '保存项目', category: 'file' },
  { key: 'Ctrl+Shift+S', description: '另存为', category: 'file' },
  { key: 'Ctrl+N', description: '新建页面', category: 'file' },
  { key: 'Ctrl+E', description: '导出项目', category: 'file' },

  // 编辑操作
  { key: 'Ctrl+Z', description: '撤销', category: 'edit' },
  { key: 'Ctrl+Y', description: '重做', category: 'edit' },
  { key: 'Ctrl+C', description: '复制组件', category: 'edit' },
  { key: 'Ctrl+V', description: '粘贴组件', category: 'edit' },
  { key: 'Ctrl+X', description: '剪切组件', category: 'edit' },
  { key: 'Ctrl+D', description: '复制并粘贴组件', category: 'edit' },
  { key: 'Delete', description: '删除选中组件', category: 'edit' },
  { key: 'Backspace', description: '删除选中组件', category: 'edit' },
  { key: 'Ctrl+A', description: '全选组件', category: 'edit' },

  // 视图操作
  { key: 'Ctrl++', description: '放大画布', category: 'view' },
  { key: 'Ctrl+-', description: '缩小画布', category: 'view' },
  { key: 'Ctrl+0', description: '重置缩放', category: 'view' },
  { key: 'Ctrl+1', description: '切换左侧面板', category: 'view' },
  { key: 'Ctrl+2', description: '切换右侧面板', category: 'view' },
  { key: 'Ctrl+G', description: '显示/隐藏网格', category: 'view' },

  // 预览和调试
  { key: 'F5', description: '开始/暂停预览', category: 'preview' },
  { key: 'F12', description: '打开/关闭调试面板', category: 'preview' },
  { key: 'Ctrl+R', description: '刷新预览', category: 'preview' },

  // 组件操作
  { key: '↑', description: '向上移动组件 1px', category: 'component' },
  { key: '↓', description: '向下移动组件 1px', category: 'component' },
  { key: '←', description: '向左移动组件 1px', category: 'component' },
  { key: '→', description: '向右移动组件 1px', category: 'component' },
  { key: 'Shift+↑', description: '向上移动组件 10px', category: 'component' },
  { key: 'Shift+↓', description: '向下移动组件 10px', category: 'component' },
  { key: 'Shift+←', description: '向左移动组件 10px', category: 'component' },
  { key: 'Shift+→', description: '向右移动组件 10px', category: 'component' },
  { key: 'Ctrl+L', description: '锁定/解锁组件', category: 'component' },
  { key: 'Ctrl+H', description: '显示/隐藏组件', category: 'component' },
  { key: '[', description: '下移一层', category: 'component' },
  { key: ']', description: '上移一层', category: 'component' },
  { key: 'Ctrl+[', description: '移到最底层', category: 'component' },
  { key: 'Ctrl+]', description: '移到最顶层', category: 'component' },
];

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'file', label: '文件' },
  { key: 'edit', label: '编辑' },
  { key: 'view', label: '视图' },
  { key: 'preview', label: '预览' },
  { key: 'component', label: '组件' },
];

interface ShortcutsPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({
  visible = false,
  onClose,
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 过滤快捷键
  const filteredShortcuts = SHORTCUTS.filter((shortcut) => {
    const matchCategory = activeCategory === 'all' || shortcut.category === activeCategory;
    const matchSearch = !searchText ||
      shortcut.key.toLowerCase().includes(searchText.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 按分类分组
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const renderShortcutItem = (shortcut: Shortcut) => (
    <div
      key={`${shortcut.key}-${shortcut.description}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Text>{shortcut.description}</Text>
      <Space size={4}>
        {shortcut.key.split('+').map((k, i) => (
          <Tag
            key={i}
            style={{
              fontFamily: 'monospace',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              boxShadow: '0 2px 0 rgba(0,0,0,0.05)',
            }}
          >
            {k}
          </Tag>
        ))}
      </Space>
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          <ControlOutlined />
          快捷键参考
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
    >
      {/* 搜索框 */}
      <Input
        placeholder="搜索快捷键..."
        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        style={{ marginBottom: 16 }}
      />

      {/* 分类标签 */}
      <Tabs
        activeKey={activeCategory}
        onChange={setActiveCategory}
        size="small"
        items={CATEGORIES.map((cat) => ({
          key: cat.key,
          label: cat.label,
        }))}
      />

      {/* 快捷键列表 */}
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {activeCategory === 'all' ? (
          Object.entries(groupedShortcuts).map(([category, shortcuts]) => {
            const categoryLabel = CATEGORIES.find(c => c.key === category)?.label || category;
            return (
              <div key={category}>
                <Divider orientation="left" style={{ margin: '12px 0 8px' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{categoryLabel}</Text>
                </Divider>
                {shortcuts.map(renderShortcutItem)}
              </div>
            );
          })
        ) : (
          filteredShortcuts.map(renderShortcutItem)
        )}

        {filteredShortcuts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            没有找到匹配的快捷键
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div style={{ marginTop: 16, padding: '12px', background: '#f5f5f5', borderRadius: 6 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          提示：按 <Tag style={{ fontSize: 11 }}>?</Tag> 键可以快速打开此面板
        </Text>
      </div>
    </Modal>
  );
};

export default ShortcutsPanel;
