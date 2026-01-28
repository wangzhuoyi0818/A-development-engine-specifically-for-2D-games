import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Tabs, Form, Input, InputNumber, Switch, Select, ColorPicker, Empty, Collapse, Typography, Button, Badge, Modal } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { DeleteOutlined, ThunderboltOutlined, MessageOutlined, SettingOutlined, CodeOutlined, DownOutlined, UpOutlined, ApartmentOutlined, EditOutlined, RobotOutlined, PictureOutlined, SwapOutlined } from '@ant-design/icons';
import { useUIStore, usePageStore, useProjectStore, useCommentStore } from '@/stores';
import { getComponentDefinition } from '@/constants/components';
import type { PropDefinition } from '@/types/miniprogram';
import { BlockEditor } from '@/components/blocks';
import type { Block } from '@/types/block';
import { CommentPanel } from '@/components/collaboration';
import { BLOCK_COLORS } from '@/types/block';
import { BEHAVIOR_PRESETS, BEHAVIOR_CATEGORIES, BehaviorPreset, BehaviorCategory } from '@/types/behaviorPreset';
import { GAME_ROLE_TEMPLATES, GameRoleType, getRoleTemplate, createDefaultRoleAttributes, getPropertiesByGroup } from '@/types/gameRole';
import { AIBlockGeneratorPanel } from '@/components/blocks/AIBlockGeneratorPanel';
import { PRESET_ASSETS } from '@/types/presetAssets';

const { Sider } = Layout;
const { Panel } = Collapse;
const { Text } = Typography;

export const RightSidebar: React.FC = () => {
  const [currentEventTrigger, setCurrentEventTrigger] = useState<string>('game_start');
  const [eventBlocks, setEventBlocks] = useState<Record<string, Block[]>>({});
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [blocksCollapsed, setBlocksCollapsed] = useState(false);
  const [behaviorsCollapsed, setBehaviorsCollapsed] = useState(false);
  const [selectedBehaviorCategory, setSelectedBehaviorCategory] = useState<BehaviorCategory>('movement');
  const [isResizing, setIsResizing] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>('all');
  const resizeRef = useRef<HTMLDivElement>(null);

  const {
    rightSidebarCollapsed,
    rightSidebarWidth,
    activeRightPanel,
    showMaterialModal,
    materialModalComponentId,
    setActiveRightPanel,
    setRightSidebarWidth,
    openMaterialModal,
    closeMaterialModal,
  } = useUIStore();

  const {
    selectedComponentId,
    getCurrentPage,
    updateComponent,
    deleteComponent,
    selectComponent,
  } = usePageStore();

  const { cloudProjectId } = useProjectStore();
  const unresolvedCount = useCommentStore((state) => state.unresolvedCount);

  const currentPage = getCurrentPage();
  const selectedComponent = currentPage?.components.find(
    (c) => c.id === selectedComponentId
  );

  // 当选中组件变化时，从组件的 scripts 字段加载积木块
  useEffect(() => {
    if (selectedComponent?.scripts) {
      const loadedBlocks: Record<string, Block[]> = {};
      Object.entries(selectedComponent.scripts).forEach(([trigger, blocks]) => {
        loadedBlocks[`${selectedComponent.id}_${trigger}`] = blocks;
      });
      setEventBlocks(prev => ({ ...prev, ...loadedBlocks }));
    }
  }, [selectedComponentId]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setRightSidebarWidth]);

  // 当选中组件变化时，重置事件触发器
  useEffect(() => {
    if (selectedComponentId) {
      setCurrentEventTrigger('game_start');
    }
  }, [selectedComponentId]);

  // 获取组件定义
  const componentDef = selectedComponent
    ? getComponentDefinition(selectedComponent.type)
    : null;

  // 处理属性变更
  const handlePropChange = (propName: string, value: unknown) => {
    if (!selectedComponentId) return;
    updateComponent(selectedComponentId, {
      props: {
        ...selectedComponent?.props,
        [propName]: value,
      },
    });
  };

  // 处理样式变更
  const handleStyleChange = (styleName: string, value: unknown) => {
    if (!selectedComponentId) return;
    updateComponent(selectedComponentId, {
      styles: {
        ...selectedComponent?.styles,
        [styleName]: value,
      },
    });
  };

  // 渲染属性输入控件
  const renderPropInput = (prop: PropDefinition, value: unknown) => {
    switch (prop.type) {
      case 'string':
        // 如果是文本内容(content)属性，使用多行文本框
        if (prop.name === 'content') {
          return (
            <Input.TextArea
              value={value as string}
              onChange={(e) => handlePropChange(prop.name, e.target.value)}
              placeholder={prop.placeholder || `请输入${prop.label}`}
              size="small"
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ resize: 'vertical' }}
            />
          );
        }
        return (
          <Input
            value={value as string}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            placeholder={prop.placeholder || `请输入${prop.label}`}
            size="small"
          />
        );
      case 'number':
        return (
          <InputNumber
            value={value as number}
            onChange={(v) => handlePropChange(prop.name, v)}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            style={{ width: '100%' }}
            size="small"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value as boolean}
            onChange={(v) => handlePropChange(prop.name, v)}
            size="small"
          />
        );
      case 'select':
        return (
          <Select
            value={value as string}
            onChange={(v) => handlePropChange(prop.name, v)}
            style={{ width: '100%' }}
            options={prop.options}
            size="small"
          />
        );
      case 'color':
        return (
          <ColorPicker
            value={value as string}
            onChange={(color: Color) => handlePropChange(prop.name, color.toHexString())}
            size="small"
            showText
          />
        );
      case 'expression':
        return (
          <Input
            value={value as string}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            placeholder="{{data.value}}"
            addonBefore="{{"
            addonAfter="}}"
            size="small"
          />
        );
      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handlePropChange(prop.name, e.target.value)}
            size="small"
          />
        );
    }
  };

  // 处理积木变更 - 同时保存到本地状态和组件的 scripts 字段
  const handleBlocksChange = (blocks: Block[]) => {
    if (!selectedComponentId || !selectedComponent) return;

    // 更新本地状态
    setEventBlocks(prev => ({
      ...prev,
      [`${selectedComponentId}_${currentEventTrigger}`]: blocks,
    }));

    // 保存到组件的 scripts 字段
    updateComponent(selectedComponentId, {
      scripts: {
        ...selectedComponent.scripts,
        [currentEventTrigger]: blocks,
      },
    });
  };

  // 智能处理AI生成的积木 - 根据积木序列智能分配到正确的触发器
  const handleAIBlocksGenerated = (blocks: Block[]) => {
    if (!selectedComponentId || !selectedComponent) return;

    // 🔧 修复：分析整个积木序列，而不是单独分析每个积木
    // 找到序列中的第一个"触发器标识积木"来决定整个序列的归属
    let triggerKey = 'tap'; // 默认触发器

    // 遍历积木，找到第一个能决定触发器的积木
    // ⚠️ 重要：优先检测持续行为类型（追踪、每帧执行），因为 AI 可能生成 event_sceneinit + motion_followtarget 的组合
    for (const block of blocks) {
      // 🆕 【优先级1】每帧执行/定时器/追踪 - 用于敌人追踪等持续行为
      if (block.type === 'event_timer' ||
          block.type === 'game_event_update' ||
          block.type === 'motion_followtarget' ||  // 🔥 关键：追踪积木
          block.type === 'logic_forever' ||         // 🔥 永久循环也应该每帧执行
          block.name?.includes('每帧') ||
          block.name?.includes('追踪') ||
          block.name?.includes('跟随')) {
        triggerKey = 'onUpdate';  // 持续每帧执行
        break;
      }
    }

    // 如果没有找到持续行为类型，再检查其他类型
    if (triggerKey === 'tap') {
      for (const block of blocks) {
        // 【优先级2】按键相关积木
        if (block.type === 'event_keypress' ||
            block.type.startsWith('control_key') ||
            block.name?.includes('按键') ||
            block.name?.includes('键盘')) {
          triggerKey = 'onKeyDown';
          break;
        }
        // 【优先级3】点击相关积木
        else if (block.type === 'event_click' ||
                 block.name?.includes('点击')) {
          triggerKey = 'onClick';
          break;
        }
        // 【优先级4】场景切换类积木
        else if (block.type === 'state_gotoscene' ||
                 block.type === 'state_gotorandomscene' ||
                 block.type === 'action_navigate') {
          triggerKey = 'onClick';
          break;
        }
        // 【优先级5】碰撞相关积木
        else if (block.type.startsWith('collision_') ||
                 block.type === 'event_collision' ||
                 block.name?.includes('碰撞')) {
          triggerKey = 'onCollision';
          break;
        }
        // 【优先级6】场景初始化（最低优先级，避免覆盖追踪逻辑）
        else if (block.type === 'event_sceneinit' ||
                 block.type === 'game_event_start') {
          triggerKey = 'onGameStart';
          break;
        }
      }
    }

    // 根据当前选中的组件类型调整
    if (selectedComponent.type === 'button' && triggerKey !== 'onKeyDown') {
      // 按钮组件默认用点击事件（除非明确是按键控制）
      triggerKey = 'onClick';  // 修复：使用驼峰命名
    }

    console.log('[RightSidebar] AI生成积木分配到触发器:', triggerKey);
    console.log('[RightSidebar] 积木数量:', blocks.length);
    console.log('[RightSidebar] 积木详情:', blocks.map(b => b.type).join(' -> '));
    console.log('[RightSidebar] 积木参数:', blocks.map(b => `${b.type}(${JSON.stringify(b.values)})`).join('\n'));

    // 🎯 关键：整个积木序列作为一个整体添加到同一个触发器
    const newScripts = { ...selectedComponent.scripts };
    const existingBlocks = newScripts[triggerKey] || [];
    newScripts[triggerKey] = [...existingBlocks, ...blocks];

    console.log('[RightSidebar] 📝 保存到 scripts["' + triggerKey + '"]，共', newScripts[triggerKey].length, '个积木');

    // 更新组件
    updateComponent(selectedComponentId, {
      scripts: newScripts,
    });

    // 更新本地状态
    setEventBlocks(prev => ({
      ...prev,
      [`${selectedComponentId}_${triggerKey}`]: newScripts[triggerKey],
    }));

    // 自动切换到对应的触发器
    setCurrentEventTrigger(triggerKey);
  };

  // 应用行为预设 - 一键添加整套积木
  const applyBehaviorPreset = (preset: BehaviorPreset) => {
    if (!selectedComponentId || !selectedComponent) return;

    // 生成预设的积木块
    const newBlocks = preset.createBlocks();

    // 将积木按事件类型分组添加
    const blocksToAdd: Record<string, Block[]> = {};
    const scriptsToAdd: Record<string, Block[]> = {};

    newBlocks.forEach(block => {
      // 根据积木类型判断应该属于哪个事件
      let eventKey = 'onGameStart';  // 默认：游戏开始
      if (block.type.startsWith('game_event_')) {
        // 事件积木本身决定事件类型
        if (block.type === 'game_event_start') eventKey = 'onGameStart';
        else if (block.type === 'game_event_update') eventKey = 'onUpdate';  // 修复：每帧执行
        else if (block.type === 'game_event_keydown') eventKey = 'onKeyDown';  // 修复：按键按下
        else if (block.type === 'game_event_keyup') eventKey = 'onKeyUp';  // 修复：按键松开
        else if (block.type === 'game_event_collision') eventKey = 'onCollision';  // 修复：碰撞
        else if (block.type === 'game_event_message') eventKey = 'onMessage';  // 修复：消息
        else if (block.type === 'game_event_clone') eventKey = 'onClone';  // 修复：克隆
        else if (block.type === 'game_event_touch') eventKey = 'onClick';  // 修复：点击
      } else if (block.type === 'event_tap') {
        eventKey = 'onClick';  // 修复：点击
      }

      const fullKey = `${selectedComponentId}_${eventKey}`;
      if (!blocksToAdd[fullKey]) {
        blocksToAdd[fullKey] = [...(eventBlocks[fullKey] || [])];
        scriptsToAdd[eventKey] = [...(selectedComponent.scripts?.[eventKey] || [])];
      }
      blocksToAdd[fullKey].push(block);
      scriptsToAdd[eventKey].push(block);
    });

    // 更新本地状态
    setEventBlocks(prev => ({
      ...prev,
      ...blocksToAdd,
    }));

    // 保存到组件的 scripts 字段
    updateComponent(selectedComponentId, {
      scripts: {
        ...selectedComponent.scripts,
        ...scriptsToAdd,
      },
    });
  };

  // 获取当前事件的积木
  const getCurrentBlocks = (): Block[] => {
    if (!selectedComponentId) return [];
    return eventBlocks[`${selectedComponentId}_${currentEventTrigger}`] || [];
  };

  // 游戏事件触发器配置
  const GAME_EVENT_TRIGGERS = [
    { key: 'onGameStart', label: '游戏开始', icon: '🚩', color: '#FFBF00' },
    { key: 'onUpdate', label: '每帧执行', icon: '🔄', color: '#FFAB19' },
    { key: 'onClick', label: '点击', icon: '🖱️', color: '#4C97FF' },
    { key: 'onKeyDown', label: '按下按键', icon: '⌨️', color: '#4C97FF' },
    { key: 'onCollision', label: '碰撞', icon: '💥', color: '#FF6680' },
    { key: 'onMessage', label: '收到消息', icon: '📨', color: '#FF8C1A' },
    { key: 'onClone', label: '被克隆时', icon: '📋', color: '#FF8C1A' },
  ];

  // 切换组件展开状态
  const toggleComponentExpand = (componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  // 切换事件展开状态
  const toggleEventExpand = (eventKey: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventKey)) {
        newSet.delete(eventKey);
      } else {
        newSet.add(eventKey);
      }
      return newSet;
    });
  };

  // 格式化积木内容
  const formatBlockContent = (block: Block): string => {
    const values = Object.entries(block.values)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([_, v]) => String(v))
      .join(', ');
    return values ? `${block.name} (${values})` : block.name;
  };

  // 树形连接线样式
  const treeLine = {
    color: '#3a3a3a',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 13,
    lineHeight: '20px',
    letterSpacing: '-1px',
  };

  // 渲染页面流程树 - Markdown 树形风格
  const renderPageFlowTree = () => {
    if (!currentPage || currentPage.components.length === 0) {
      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#555',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.4 }}>🌳</div>
          <div style={{ fontSize: 13, color: '#666' }}>页面暂无组件</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 6 }}>添加组件后在此查看逻辑流程</div>
        </div>
      );
    }

    return (
      <div style={{
        padding: '20px 16px',
        fontFamily: "'SF Mono', Consolas, Monaco, 'Courier New', monospace",
        fontSize: 12,
        lineHeight: 1.4,
        overflow: 'auto',
        height: '100%',
        background: '#141414',
      }}>
        {/* 页面根节点 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginBottom: 4,
            background: 'linear-gradient(90deg, rgba(22,119,255,0.15) 0%, transparent 100%)',
            borderRadius: 6,
            borderLeft: '3px solid #1677ff',
          }}
        >
          <span style={{ fontSize: 16, marginRight: 10 }}>📄</span>
          <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 14 }}>{currentPage.name || '页面'}</span>
          <span style={{ color: '#555', marginLeft: 12, fontSize: 11 }}>
            {currentPage.components.length} 个精灵
          </span>
        </div>

        {/* 组件树 */}
        {currentPage.components.map((comp, compIndex) => {
          const isLastComp = compIndex === currentPage.components.length - 1;
          const isExpanded = expandedComponents.has(comp.id);
          const isSelected = selectedComponentId === comp.id;
          const compDef = getComponentDefinition(comp.type);

          const componentEvents = GAME_EVENT_TRIGGERS.map(trigger => ({
            ...trigger,
            blocks: eventBlocks[`${comp.id}_${trigger.key}`] || [],
          })).filter(e => e.blocks.length > 0);

          const totalBlocks = componentEvents.reduce((sum, e) => sum + e.blocks.length, 0);

          return (
            <div key={comp.id}>
              {/* 组件行 */}
              <div
                onClick={() => {
                  selectComponent(comp.id);
                  toggleComponentExpand(comp.id);
                }}
                onDoubleClick={() => {
                  selectComponent(comp.id);
                  setActiveRightPanel('events');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 8px',
                  marginLeft: 4,
                  cursor: 'pointer',
                  borderRadius: 4,
                  background: isSelected ? 'rgba(22,119,255,0.12)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* 树线 */}
                <span style={{ ...treeLine, marginRight: 6, userSelect: 'none' }}>
                  {isLastComp ? '└──' : '├──'}
                </span>

                {/* 展开/折叠 */}
                {componentEvents.length > 0 ? (
                  <span style={{
                    width: 16,
                    height: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 6,
                    fontSize: 8,
                    color: '#666',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>
                    ▶
                  </span>
                ) : (
                  <span style={{ width: 16, marginRight: 6, textAlign: 'center', color: '#333' }}>○</span>
                )}

                {/* 图标 */}
                <span style={{ fontSize: 14, marginRight: 8 }}>{compDef?.icon || '🎮'}</span>

                {/* 名称 */}
                <span style={{
                  color: isSelected ? '#5ba0e0' : '#c8c8c8',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 12,
                }}>
                  {comp.name}
                </span>

                {/* 积木数 */}
                {totalBlocks > 0 && (
                  <span style={{
                    marginLeft: 8,
                    color: '#52c41a',
                    fontSize: 10,
                    fontWeight: 500,
                  }}>
                    [{totalBlocks}]
                  </span>
                )}

                {/* 编辑 */}
                <EditOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    selectComponent(comp.id);
                    setActiveRightPanel('events');
                  }}
                  style={{
                    marginLeft: 'auto',
                    color: '#444',
                    fontSize: 11,
                    padding: 4,
                    opacity: isSelected ? 1 : 0,
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1677ff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#444'}
                />
              </div>

              {/* 事件列表 */}
              {isExpanded && componentEvents.map((event, eventIndex) => {
                const isLastEvent = eventIndex === componentEvents.length - 1;
                const eventKey = `${comp.id}_${event.key}`;
                const isEventExpanded = expandedEvents.has(eventKey);
                const prefix = isLastComp ? '    ' : '│   ';

                return (
                  <div key={event.key}>
                    {/* 事件行 */}
                    <div
                      onClick={() => toggleEventExpand(eventKey)}
                      onDoubleClick={() => {
                        selectComponent(comp.id);
                        setCurrentEventTrigger(event.key);
                        setActiveRightPanel('events');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '5px 8px',
                        marginLeft: 4,
                        cursor: 'pointer',
                        borderRadius: 4,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ ...treeLine, marginRight: 6, userSelect: 'none' }}>
                        {prefix}{isLastEvent ? '└──' : '├──'}
                      </span>

                      {/* 展开 */}
                      <span style={{
                        width: 14,
                        height: 14,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 6,
                        fontSize: 7,
                        color: event.color,
                        transition: 'transform 0.2s',
                        transform: isEventExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>
                        ▶
                      </span>

                      {/* 事件标签 */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        background: event.color,
                        borderRadius: 4,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 500,
                      }}>
                        {event.icon} {event.label}
                      </span>

                      <span style={{ color: '#555', marginLeft: 8, fontSize: 10 }}>
                        {event.blocks.length}
                      </span>
                    </div>

                    {/* 积木列表 */}
                    {isEventExpanded && event.blocks.map((block, blockIndex) => {
                      const isLastBlock = blockIndex === event.blocks.length - 1;
                      const eventPrefix = isLastEvent ? '    ' : '│   ';
                      const blockColor = BLOCK_COLORS[block.category] || '#666';

                      return (
                        <div
                          key={block.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            marginLeft: 4,
                            cursor: 'pointer',
                            borderRadius: 4,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ ...treeLine, marginRight: 6, userSelect: 'none' }}>
                            {prefix}{eventPrefix}{isLastBlock ? '└──' : '├──'}
                          </span>

                          {/* 颜色点 */}
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: blockColor,
                            marginRight: 8,
                            flexShrink: 0,
                          }} />

                          {/* 积木内容 */}
                          <span style={{ color: '#888', fontSize: 11 }}>
                            {formatBlockContent(block)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* 无事件时的提示 */}
              {isExpanded && componentEvents.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 8px',
                  marginLeft: 4,
                  color: '#444',
                  fontSize: 11,
                  fontStyle: 'italic',
                }}>
                  <span style={{ ...treeLine, marginRight: 6 }}>
                    {isLastComp ? '    ' : '│   '}└──
                  </span>
                  <span style={{ color: '#555' }}>暂无逻辑</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染上半部分 - 精灵属性面板（紧凑版）
  const renderCompactPropertiesPanel = () => {
    if (!selectedComponent || !componentDef) {
      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: '#555',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.4 }}>🎮</div>
          <div style={{ fontSize: 13, color: '#666' }}>未选择精灵</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 6 }}>点击画布中的精灵进行编辑</div>
        </div>
      );
    }

    const currentRoleType = selectedComponent.gameRole?.roleType as GameRoleType | undefined;
    const roleTemplate = currentRoleType ? getRoleTemplate(currentRoleType) : undefined;
    const propertyGroups = roleTemplate ? getPropertiesByGroup(roleTemplate) : {};

    // 更新角色类型
    const handleRoleTypeChange = (roleType: GameRoleType) => {
      const defaultAttrs = createDefaultRoleAttributes(roleType);
      updateComponent(selectedComponentId!, {
        gameRole: defaultAttrs,
      });
    };

    // 更新角色属性
    const handleRolePropertyChange = (key: string, value: unknown) => {
      if (!selectedComponent.gameRole) return;
      updateComponent(selectedComponentId!, {
        gameRole: {
          ...selectedComponent.gameRole,
          properties: {
            ...selectedComponent.gameRole.properties,
            [key]: value,
          },
        },
      });
    };

    return (
      <div style={{ padding: '12px 10px', background: '#1a1a1a' }}>
        {/* 组件标题和删除按钮 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          padding: '6px 10px',
          background: '#252525',
          borderRadius: 6,
          border: '1px solid #333',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{roleTemplate?.icon || componentDef.icon || '🎮'}</span>
            <div>
              <Input
                value={selectedComponent.name}
                onChange={(e) => updateComponent(selectedComponentId!, { name: e.target.value })}
                size="small"
                variant="borderless"
                style={{ fontWeight: 600, color: '#e0e0e0', padding: 0, width: 120, fontSize: 13 }}
              />
              <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{roleTemplate?.name || componentDef.name}</div>
            </div>
          </div>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => deleteComponent(selectedComponentId!)}
            style={{ opacity: 0.8 }}
          />
        </div>

        {/* 角色类型选择 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 10,
            color: '#888',
            marginBottom: 6,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>🎭</span>
            <span>角色类型</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
          }}>
            {GAME_ROLE_TEMPLATES.map(template => {
              const isActive = currentRoleType === template.type;
              return (
                <div
                  key={template.type}
                  onClick={() => handleRoleTypeChange(template.type)}
                  title={template.description}
                  style={{
                    padding: '6px 3px',
                    background: isActive ? template.color : '#2a2a2a',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'center',
                    border: `1px solid ${isActive ? template.color : '#3a3a3a'}`,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#333';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#2a2a2a';
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{template.icon}</div>
                  <div style={{
                    fontSize: 9,
                    color: isActive ? '#fff' : '#888',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {template.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 素材预览与替换 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 10,
            color: '#888',
            marginBottom: 6,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>🖼️</span>
            <span>素材/造型</span>
          </div>
          <div style={{
            background: '#252525',
            borderRadius: 6,
            border: '1px solid #333',
            overflow: 'hidden',
          }}>
            {/* 当前素材预览 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              gap: 8,
            }}>
              {selectedComponent.props?.src ? (
                <div style={{
                  width: 60,
                  height: 60,
                  background: '#1a1a1a',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid #333',
                }}>
                  <img
                    src={selectedComponent.props.src as string}
                    alt={selectedComponent.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: 60,
                  height: 60,
                  background: '#1a1a1a',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #333',
                  color: '#555',
                  fontSize: 24,
                }}>
                  <PictureOutlined />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#e0e0e0', marginBottom: 4 }}>
                  {selectedComponent.name}
                </div>
                <div style={{ fontSize: 9, color: '#666' }}>
                  {selectedComponent.props?.src ? '已设置素材' : '未设置素材'}
                </div>
              </div>
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() => openMaterialModal(selectedComponentId!)}
                style={{
                  background: '#1677ff',
                  borderColor: '#1677ff',
                  color: '#fff',
                }}
              >
                替换
              </Button>
            </div>
          </div>
        </div>

        {/* 位置和大小 - 紧凑行 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 10,
            color: '#888',
            marginBottom: 6,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span>📐</span>
            <span>位置与大小</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 4,
            background: '#252525',
            padding: 6,
            borderRadius: 6,
            border: '1px solid #333',
          }}>
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>X</div>
              <InputNumber
                value={selectedComponent.position.x}
                onChange={(v) => updateComponent(selectedComponentId!, { position: { ...selectedComponent.position, x: v || 0 } })}
                size="small"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Y</div>
              <InputNumber
                value={selectedComponent.position.y}
                onChange={(v) => updateComponent(selectedComponentId!, { position: { ...selectedComponent.position, y: v || 0 } })}
                size="small"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>宽</div>
              <InputNumber
                value={selectedComponent.size.width}
                onChange={(v) => updateComponent(selectedComponentId!, { size: { ...selectedComponent.size, width: v || 0 } })}
                size="small"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>高</div>
              <InputNumber
                value={selectedComponent.size.height}
                onChange={(v) => updateComponent(selectedComponentId!, { size: { ...selectedComponent.size, height: v || 0 } })}
                size="small"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* 角色属性面板 */}
        {roleTemplate && (
          <div style={{
            background: '#252525',
            borderRadius: 6,
            border: `1px solid ${roleTemplate.color}40`,
            overflow: 'hidden',
          }}>
            {/* 属性标题 */}
            <div style={{
              padding: '6px 10px',
              background: roleTemplate.color + '20',
              borderBottom: `1px solid ${roleTemplate.color}40`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{roleTemplate.icon}</span>
              <span style={{ color: roleTemplate.color, fontSize: 11, fontWeight: 600 }}>
                {roleTemplate.name}属性
              </span>
            </div>

            {/* 属性分组 */}
            <div style={{ padding: 8, maxHeight: 240, overflow: 'auto' }}>
              {Object.entries(propertyGroups).map(([groupName, props]) => (
                <div key={groupName} style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: 10,
                    color: '#888',
                    marginBottom: 5,
                    paddingBottom: 3,
                    borderBottom: '1px solid #3a3a3a',
                    fontWeight: 500,
                  }}>
                    {groupName}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 5,
                  }}>
                    {props.map(prop => {
                      const value = selectedComponent.gameRole?.properties?.[prop.key] ?? prop.defaultValue;
                      return (
                        <div key={prop.key}>
                          <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>{prop.label}</div>
                          {prop.type === 'number' ? (
                            <InputNumber
                              value={value as number}
                              onChange={(v) => handleRolePropertyChange(prop.key, v)}
                              min={prop.min}
                              max={prop.max}
                              step={prop.step}
                              size="small"
                              style={{ width: '100%' }}
                            />
                          ) : prop.type === 'boolean' ? (
                            <Switch
                              checked={value as boolean}
                              onChange={(v) => handleRolePropertyChange(prop.key, v)}
                              size="small"
                            />
                          ) : prop.type === 'select' ? (
                            <Select
                              value={value as string}
                              onChange={(v) => handleRolePropertyChange(prop.key, v)}
                              options={prop.options}
                              size="small"
                              style={{ width: '100%' }}
                            />
                          ) : prop.type === 'color' ? (
                            <ColorPicker
                              value={value as string}
                              onChange={(c) => handleRolePropertyChange(prop.key, c.toHexString())}
                              size="small"
                            />
                          ) : (
                            <Input
                              value={value as string}
                              onChange={(e) => handleRolePropertyChange(prop.key, e.target.value)}
                              size="small"
                              style={{ width: '100%' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染快捷行为面板 - 一键添加常用行为
  const renderQuickBehaviorPanel = () => {
    if (!selectedComponent) {
      return null;
    }

    const categoryBehaviors = BEHAVIOR_PRESETS.filter(b => b.category === selectedBehaviorCategory);

    return (
      <div style={{
        borderBottom: '1px solid #333',
        maxHeight: behaviorsCollapsed ? 32 : 180,
        overflow: 'hidden',
        transition: 'max-height 0.2s',
        flexShrink: 0,
      }}>
        {/* 标题栏 */}
        <div
          onClick={() => setBehaviorsCollapsed(!behaviorsCollapsed)}
          style={{
            padding: '6px 10px',
            background: '#252525',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12 }}>🚀</span>
            <Text strong style={{ color: '#faad14', fontSize: 11 }}>快捷行为</Text>
            <span style={{ color: '#888', fontSize: 9 }}>一键添加</span>
          </div>
          {behaviorsCollapsed ? <DownOutlined style={{ fontSize: 9, color: '#888' }} /> : <UpOutlined style={{ fontSize: 9, color: '#888' }} />}
        </div>

        {/* 内容区 */}
        {!behaviorsCollapsed && (
          <div style={{ padding: 6 }}>
            {/* 分类选择 */}
            <div style={{
              display: 'flex',
              gap: 4,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}>
              {BEHAVIOR_CATEGORIES.map(cat => {
                const isActive = selectedBehaviorCategory === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setSelectedBehaviorCategory(cat.key)}
                    style={{
                      padding: '3px 8px',
                      background: isActive ? cat.color : 'transparent',
                      border: `1px solid ${isActive ? cat.color : '#444'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 10,
                      color: isActive ? '#fff' : '#aaa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                );
              })}
            </div>

            {/* 行为列表 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
              maxHeight: 100,
              overflow: 'auto',
            }}>
              {categoryBehaviors.map(behavior => (
                <div
                  key={behavior.id}
                  onClick={() => applyBehaviorPreset(behavior)}
                  style={{
                    padding: '6px 8px',
                    background: '#2a2a2a',
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: `1px solid ${behavior.color}40`,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = behavior.color + '30';
                    e.currentTarget.style.borderColor = behavior.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2a2a2a';
                    e.currentTarget.style.borderColor = behavior.color + '40';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 2,
                  }}>
                    <span style={{ fontSize: 12 }}>{behavior.icon}</span>
                    <span style={{ color: '#e0e0e0', fontSize: 10, fontWeight: 500 }}>
                      {behavior.name}
                    </span>
                  </div>
                  <div style={{ color: '#777', fontSize: 9, lineHeight: 1.3 }}>
                    {behavior.description.length > 20
                      ? behavior.description.slice(0, 20) + '...'
                      : behavior.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染下半部分 - 积木编辑器
  const renderBlockEditorPanel = () => {
    if (!selectedComponent) {
      return (
        <div style={{ padding: 12, textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🧩</div>
          <div style={{ fontSize: 11 }}>选择精灵后可编辑逻辑</div>
        </div>
      );
    }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 事件选择器 */}
        <div style={{
          padding: '4px 6px',
          background: '#252525',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}>
          {GAME_EVENT_TRIGGERS.map(trigger => {
            const isActive = currentEventTrigger === trigger.key;
            const blocks = eventBlocks[`${selectedComponentId}_${trigger.key}`] || [];
            const hasBlocks = blocks.length > 0;

            return (
              <div
                key={trigger.key}
                onClick={() => setCurrentEventTrigger(trigger.key)}
                style={{
                  padding: '3px 6px',
                  background: isActive ? trigger.color : (hasBlocks ? '#3a3a3a' : 'transparent'),
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 10,
                  color: isActive ? '#000' : (hasBlocks ? '#fff' : '#888'),
                  fontWeight: isActive ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s',
                  border: isActive ? 'none' : (hasBlocks ? '1px solid #52c41a' : '1px solid transparent'),
                }}
              >
                <span>{trigger.icon}</span>
                <span>{trigger.label}</span>
                {hasBlocks && !isActive && (
                  <span style={{
                    background: '#52c41a',
                    color: '#fff',
                    padding: '0 3px',
                    borderRadius: 6,
                    fontSize: 8,
                    minWidth: 12,
                    textAlign: 'center',
                  }}>
                    {blocks.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 积木编辑器 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BlockEditor
            blocks={getCurrentBlocks()}
            onBlocksChange={handleBlocksChange}
            componentName={selectedComponent.name}
          />
        </div>
      </div>
    );
  };

  // 渲染样式面板
  const renderStylesPanel = () => {
    if (!selectedComponent) {
      return (
        <Empty
          description="请选择一个组件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 60 }}
        />
      );
    }

    // 获取组件的样式定义
    const componentDef = getComponentDefinition(selectedComponent.type);
    const styleDefinitions = componentDef?.styleDefinitions || [];

    return (
      <div style={{ padding: 12 }}>
        {/* 如果组件有自定义样式定义，优先显示 */}
        {styleDefinitions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#e0e0e0',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid #333',
            }}>
              ✨ {componentDef?.name}样式
            </div>
            <Form layout="vertical" size="small">
              {styleDefinitions.map((styleDef) => (
                <Form.Item key={styleDef.name} label={styleDef.label} style={{ marginBottom: 12 }}>
                  {styleDef.type === 'string' && (
                    <Input
                      value={selectedComponent.styles[styleDef.name] as string || styleDef.defaultValue || ''}
                      onChange={(e) => handleStyleChange(styleDef.name, e.target.value)}
                      placeholder={styleDef.placeholder}
                      size="small"
                    />
                  )}
                  {styleDef.type === 'number' && (
                    <InputNumber
                      value={selectedComponent.styles[styleDef.name] as number || styleDef.defaultValue || 0}
                      onChange={(v) => handleStyleChange(styleDef.name, v)}
                      min={styleDef.min}
                      max={styleDef.max}
                      step={styleDef.step}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  )}
                  {styleDef.type === 'select' && (
                    <Select
                      value={selectedComponent.styles[styleDef.name] as string || styleDef.defaultValue}
                      onChange={(v) => handleStyleChange(styleDef.name, v)}
                      options={styleDef.options}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  )}
                  {styleDef.type === 'color' && (
                    <ColorPicker
                      value={selectedComponent.styles[styleDef.name] as string || styleDef.defaultValue || '#000000'}
                      onChange={(color) => handleStyleChange(styleDef.name, color.toHexString())}
                      size="small"
                      showText
                    />
                  )}
                  {styleDef.type === 'boolean' && (
                    <Switch
                      checked={selectedComponent.styles[styleDef.name] as boolean || styleDef.defaultValue || false}
                      onChange={(v) => handleStyleChange(styleDef.name, v)}
                      size="small"
                    />
                  )}
                </Form.Item>
              ))}
            </Form>
          </div>
        )}

        {/* 通用样式 */}
        <Collapse defaultActiveKey={['layout', 'typography', 'background', 'border']} ghost>
          <Panel header="布局" key="layout">
            <Form layout="vertical" size="small">
              <Form.Item label="显示方式">
                <Select
                  value={selectedComponent.styles.display as string || 'block'}
                  onChange={(v) => handleStyleChange('display', v)}
                  options={[
                    { label: 'block', value: 'block' },
                    { label: 'flex', value: 'flex' },
                    { label: 'inline', value: 'inline' },
                    { label: 'inline-block', value: 'inline-block' },
                    { label: 'none', value: 'none' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="内边距">
                <Input
                  value={selectedComponent.styles.padding as string || ''}
                  onChange={(e) => handleStyleChange('padding', e.target.value)}
                  placeholder="10px"
                />
              </Form.Item>
              <Form.Item label="外边距">
                <Input
                  value={selectedComponent.styles.margin as string || ''}
                  onChange={(e) => handleStyleChange('margin', e.target.value)}
                  placeholder="10px"
                />
              </Form.Item>
            </Form>
          </Panel>

          {styleDefinitions.length === 0 && (
            <Panel header="文字" key="typography">
              <Form layout="vertical" size="small">
                <Form.Item label="字体大小">
                  <Input
                    value={selectedComponent.styles.fontSize as string || ''}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    placeholder="14px"
                  />
                </Form.Item>
                <Form.Item label="字体颜色">
                  <ColorPicker
                    value={selectedComponent.styles.color as string || '#333333'}
                    onChange={(color) => handleStyleChange('color', color.toHexString())}
                    showText
                  />
                </Form.Item>
                <Form.Item label="文本对齐">
                  <Select
                    value={selectedComponent.styles.textAlign as string || 'left'}
                    onChange={(v) => handleStyleChange('textAlign', v)}
                    options={[
                      { label: '左对齐', value: 'left' },
                      { label: '居中', value: 'center' },
                      { label: '右对齐', value: 'right' },
                    ]}
                  />
                </Form.Item>
              </Form>
            </Panel>
          )}

          <Panel header="背景" key="background">
            <Form layout="vertical" size="small">
              <Form.Item label="背景色">
                <ColorPicker
                  value={selectedComponent.styles.backgroundColor as string || 'transparent'}
                  onChange={(color) => handleStyleChange('backgroundColor', color.toHexString())}
                  showText
                />
              </Form.Item>
            </Form>
          </Panel>

          <Panel header="边框" key="border">
            <Form layout="vertical" size="small">
              <Form.Item label="边框">
                <Input
                  value={selectedComponent.styles.border as string || ''}
                  onChange={(e) => handleStyleChange('border', e.target.value)}
                  placeholder="1px solid #ddd"
                />
              </Form.Item>
              <Form.Item label="圆角">
                <Input
                  value={selectedComponent.styles.borderRadius as string || ''}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                  placeholder="4px"
                />
              </Form.Item>
            </Form>
          </Panel>
        </Collapse>
      </div>
    );
  };

  // 处理素材替换
  const handleMaterialSelect = (materialPath: string) => {
    const targetComponentId = materialModalComponentId || selectedComponentId;
    if (!targetComponentId) return;

    updateComponent(targetComponentId, {
      props: {
        ...getCurrentPage()?.components.find(c => c.id === targetComponentId)?.props,
        src: materialPath,
      },
    });

    closeMaterialModal();
  };

  // 获取筛选后的素材列表
  const getFilteredMaterials = () => {
    if (selectedMaterialCategory === 'all') {
      return PRESET_ASSETS;
    }
    return PRESET_ASSETS.filter(asset => asset.category === selectedMaterialCategory);
  };

  if (rightSidebarCollapsed) {
    return null;
  }

  // 素材选择模态框
  const renderMaterialModal = () => (
    <Modal
      title="选择素材"
      open={showMaterialModal}
      onCancel={() => closeMaterialModal()}
      footer={null}
      width={700}
      style={{ top: 20 }}
      styles={{
        body: {
          padding: '12px',
          maxHeight: '70vh',
          overflow: 'auto',
          background: '#1a1a1a',
        },
      }}
    >
      {/* 分类筛选 */}
      <div style={{
        marginBottom: 12,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        {[
          { key: 'all', label: '全部', icon: '🎨' },
          { key: 'player', label: '玩家', icon: '🦸' },
          { key: 'enemy', label: '敌人', icon: '👾' },
          { key: 'npc', label: 'NPC', icon: '👤' },
        ].map(cat => {
          const isActive = selectedMaterialCategory === cat.key;
          return (
            <div
              key={cat.key}
              onClick={() => setSelectedMaterialCategory(cat.key)}
              style={{
                padding: '6px 12px',
                background: isActive ? '#1677ff' : '#2a2a2a',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                color: isActive ? '#fff' : '#aaa',
                border: `1px solid ${isActive ? '#1677ff' : '#444'}`,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ marginRight: 4 }}>{cat.icon}</span>
              {cat.label}
            </div>
          );
        })}
      </div>

      {/* 素材网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {getFilteredMaterials().map(asset => (
          <div
            key={asset.id}
            onClick={() => handleMaterialSelect(asset.path)}
            style={{
              background: '#252525',
              borderRadius: 6,
              overflow: 'hidden',
              cursor: 'pointer',
              border: '2px solid #333',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1677ff';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* 素材图片 */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              background: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
            }}>
              <img
                src={asset.path}
                alt={asset.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
            {/* 素材名称 */}
            <div style={{
              padding: '6px 8px',
              fontSize: 11,
              color: '#e0e0e0',
              textAlign: 'center',
              borderTop: '1px solid #333',
            }}>
              {asset.name}
            </div>
          </div>
        ))}
      </div>

      {getFilteredMaterials().length === 0 && (
        <Empty
          description="该分类暂无素材"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 40 }}
        />
      )}
    </Modal>
  );

  // 主编辑面板 - 只包含快捷行为和积木编辑器
  const renderEditPanel = () => {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 上半部分：快捷行为面板 */}
        {renderQuickBehaviorPanel()}

        {/* 下半部分：积木编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: blocksCollapsed ? 32 : 150,
        }}>
          {/* 标题栏 */}
          <div
            onClick={() => setBlocksCollapsed(!blocksCollapsed)}
            style={{
              padding: '6px 10px',
              background: '#252525',
              borderBottom: '1px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CodeOutlined style={{ color: '#52c41a', fontSize: 11 }} />
              <Text strong style={{ color: '#e0e0e0', fontSize: 11 }}>逻辑积木</Text>
              {selectedComponent && (
                <span style={{
                  background: '#52c41a',
                  color: '#fff',
                  padding: '0 5px',
                  borderRadius: 6,
                  fontSize: 9,
                }}>
                  {getCurrentBlocks().length}
                </span>
              )}
            </div>
            {blocksCollapsed ? <DownOutlined style={{ fontSize: 9, color: '#888' }} /> : <UpOutlined style={{ fontSize: 9, color: '#888' }} />}
          </div>

          {/* 积木编辑器内容 */}
          {!blocksCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {renderBlockEditorPanel()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 素材选择模态框 */}
      {renderMaterialModal()}

      {/* 拖拽调整宽度手柄 */}
      {!rightSidebarCollapsed && (
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            right: rightSidebarWidth - 3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'col-resize',
            zIndex: 100,
            background: isResizing ? 'rgba(22, 119, 255, 0.3)' : 'transparent',
            transition: isResizing ? 'none' : 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'rgba(22, 119, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = 'transparent';
          }}
        />
      )}
      <Sider
        width={rightSidebarWidth}
        style={{
          background: '#1f1f1f',
          borderLeft: '1px solid #424242',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Tabs
          activeKey={activeRightPanel}
          onChange={(key) => setActiveRightPanel(key as 'properties' | 'sprite-attrs' | 'events' | 'styles' | 'ai-assistant')}
          centered
          size="small"
          style={{ height: '100%' }}
          items={[
            {
              key: 'properties',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <ApartmentOutlined />
                  流程
                </span>
              ),
              children: (
                <div style={{ height: 'calc(100vh - 140px)', overflow: 'auto', background: '#1a1a1a' }}>
                  {renderPageFlowTree()}
                </div>
              ),
            },
            {
              key: 'sprite-attrs',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <SettingOutlined />
                  精灵属性
                </span>
              ),
              children: (
                <div style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
                  {renderCompactPropertiesPanel()}
                </div>
              ),
            },
            {
              key: 'events',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <ThunderboltOutlined />
                  编辑
                </span>
              ),
              children: (
                <div style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
                  {renderEditPanel()}
                </div>
              ),
            },
            {
              key: 'styles',
              label: <span style={{ fontSize: 12 }}>样式</span>,
              children: (
                <div style={{ height: 'calc(100vh - 140px)', overflow: 'auto' }}>
                  {renderStylesPanel()}
                </div>
              ),
            },
            {
              key: 'ai-assistant',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <RobotOutlined />
                  AI助手
                </span>
              ),
              children: (
                <div style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
                  {selectedComponent ? (
                    <AIBlockGeneratorPanel
                      componentId={selectedComponent.id}
                      componentName={selectedComponent.name}
                      componentType={selectedComponent.gameRole?.type || 'player'}
                      onBlocksGenerated={handleAIBlocksGenerated}
                      existingBlocks={getCurrentBlocks()}
                    />
                  ) : (
                    <Empty
                      description="请先选择一个组件"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ marginTop: 60 }}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Sider>
    </>
  );
};

export default RightSidebar;
