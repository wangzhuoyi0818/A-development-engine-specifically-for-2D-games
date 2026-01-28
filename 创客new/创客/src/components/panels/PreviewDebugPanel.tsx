import React, { useState, useRef, useEffect } from 'react';
import {
  Tabs,
  Button,
  Space,
  Typography,
  Input,
  Tag,
  Empty,
  Tooltip,
  Switch,
  Divider,
  Badge,
  Card,
  Tree,
} from 'antd';
import type { TreeDataNode } from 'antd';
import {
  PlayCircleOutlined,
  PauseOutlined,
  ReloadOutlined,
  ClearOutlined,
  BugOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ExpandOutlined,
  EyeOutlined,
  DesktopOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { useUIStore, usePageStore, useProjectStore } from '@/stores';

const { Text, Title } = Typography;

// 日志类型
type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  source?: string;
  details?: any;
}


const LOG_COLORS: Record<LogLevel, string> = {
  log: '#888',
  info: '#1677ff',
  warn: '#faad14',
  error: '#ff4d4f',
};

const LOG_ICONS: Record<LogLevel, React.ReactNode> = {
  log: <CodeOutlined />,
  info: <InfoCircleOutlined />,
  warn: <WarningOutlined />,
  error: <CloseCircleOutlined />,
};

export const PreviewDebugPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('console');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { isPlaying, togglePlay, device, setShowDebugPanel } = useUIStore();
  const { getCurrentPage, selectedComponentId, selectComponent } = usePageStore();
  const { currentProject } = useProjectStore();

  const currentPage = getCurrentPage();

  // 模拟日志
  useEffect(() => {
    if (isPlaying) {
      // 添加初始日志
      addLog('info', '小程序预览已启动');
      addLog('log', `当前页面: ${currentPage?.name || '未选择'}`);
      addLog('log', `设备: ${device.name} (${device.width}×${device.height})`);

      // 模拟组件渲染日志
      if (currentPage?.components) {
        currentPage.components.forEach((comp) => {
          addLog('log', `渲染组件: ${comp.name} (${comp.type})`, comp.id);
        });
      }
    }
  }, [isPlaying]);

  // 添加日志
  const addLog = (level: LogLevel, message: string, source?: string, details?: any) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date(),
      source,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    const matchLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchSearch = !searchText ||
      log.message.toLowerCase().includes(searchText.toLowerCase());
    return matchLevel && matchSearch;
  });

  // 日志统计
  const logCounts = {
    log: logs.filter((l) => l.level === 'log').length,
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    } as Intl.DateTimeFormatOptions);
  };

  // 构建组件树数据
  const buildComponentTree = (): TreeDataNode[] => {
    if (!currentPage?.components) return [];

    return currentPage.components.map((comp) => ({
      key: comp.id,
      title: (
        <Space size={4}>
          <Text style={{
            color: selectedComponentId === comp.id ? '#1677ff' : '#e0e0e0',
            fontWeight: selectedComponentId === comp.id ? 600 : 400,
          }}>
            {comp.name}
          </Text>
          <Tag style={{ fontSize: 10, padding: '0 4px' }}>{comp.type}</Tag>
        </Space>
      ),
      children: comp.children?.map((child) => ({
        key: child.id,
        title: (
          <Space size={4}>
            <Text style={{ color: '#e0e0e0' }}>{child.name}</Text>
            <Tag style={{ fontSize: 10, padding: '0 4px' }}>{child.type}</Tag>
          </Space>
        ),
      })),
    }));
  };

  // 渲染控制台面板
  const renderConsolePanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 控制台工具栏 */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Space size={4}>
          <Tooltip title="清空控制台">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={clearLogs}
            />
          </Tooltip>
          <Divider type="vertical" style={{ margin: '0 4px' }} />
          {(['all', 'log', 'info', 'warn', 'error'] as const).map((level) => (
            <Badge
              key={level}
              count={level === 'all' ? logs.length : logCounts[level as LogLevel]}
              size="small"
              style={{
                backgroundColor: level === 'all' ? '#666' : LOG_COLORS[level as LogLevel],
              }}
            >
              <Button
                type={filterLevel === level ? 'primary' : 'text'}
                size="small"
                style={{
                  fontSize: 11,
                  padding: '0 8px',
                  color: filterLevel === level ? undefined : LOG_COLORS[level as LogLevel] || '#888',
                }}
                onClick={() => setFilterLevel(level)}
              >
                {level === 'all' ? '全部' : level}
              </Button>
            </Badge>
          ))}
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 11, color: '#666' }}>时间戳</Text>
          <Switch
            size="small"
            checked={showTimestamp}
            onChange={setShowTimestamp}
          />
          <Text style={{ fontSize: 11, color: '#666' }}>自动滚动</Text>
          <Switch
            size="small"
            checked={autoScroll}
            onChange={setAutoScroll}
          />
        </Space>
      </div>

      {/* 搜索栏 */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
        <Input
          placeholder="搜索日志..."
          prefix={<SearchOutlined style={{ color: '#666' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
          style={{ background: '#1a1a1a' }}
        />
      </div>

      {/* 日志列表 */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '4px 0',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 12,
        }}
      >
        {filteredLogs.length === 0 ? (
          <Empty
            description="暂无日志"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: '4px 12px',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: log.level === 'error' ? 'rgba(255, 77, 79, 0.1)' :
                           log.level === 'warn' ? 'rgba(250, 173, 20, 0.05)' : 'transparent',
              }}
            >
              <span style={{ color: LOG_COLORS[log.level], flexShrink: 0 }}>
                {LOG_ICONS[log.level]}
              </span>
              {showTimestamp && (
                <Text style={{ color: '#555', flexShrink: 0, fontSize: 11 }}>
                  [{formatTime(log.timestamp)}]
                </Text>
              )}
              <Text style={{ color: LOG_COLORS[log.level], flex: 1, wordBreak: 'break-word' }}>
                {log.message}
              </Text>
              {log.source && (
                <Tag style={{ fontSize: 10, margin: 0 }}>{log.source}</Tag>
              )}
            </div>
          ))
        )}
      </div>

      {/* 命令输入 */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #333' }}>
        <Input
          placeholder="> 输入命令..."
          prefix={<span style={{ color: '#1677ff' }}>&gt;</span>}
          size="small"
          style={{ background: '#1a1a1a', fontFamily: 'Consolas, Monaco, monospace' }}
          onPressEnter={(e) => {
            const value = e.currentTarget.value.trim();
            if (value) {
              addLog('log', `> ${value}`);
              // 模拟执行命令
              try {
                // 简单的表达式求值
                if (value.startsWith('console.')) {
                  addLog('log', '命令已执行');
                } else {
                  const result = eval(value);
                  addLog('info', `结果: ${JSON.stringify(result)}`);
                }
              } catch (err: any) {
                addLog('error', `错误: ${err.message}`);
              }
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );

  // 渲染组件检查器
  const renderInspectorPanel = () => {
    const selectedComponent = currentPage?.components.find(
      (c) => c.id === selectedComponentId
    );

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 组件树 */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          borderBottom: '1px solid #333',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
            <Text strong style={{ fontSize: 12 }}>组件树</Text>
          </div>
          <div style={{ padding: 8 }}>
            {buildComponentTree().length > 0 ? (
              <Tree
                treeData={buildComponentTree()}
                selectedKeys={selectedComponentId ? [selectedComponentId] : []}
                onSelect={(keys) => {
                  if (keys.length > 0) {
                    selectComponent(keys[0] as string);
                  }
                }}
                showLine={{ showLeafIcon: false }}
                defaultExpandAll
                style={{ background: 'transparent' }}
              />
            ) : (
              <Empty
                description="暂无组件"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>

        {/* 组件详情 */}
        <div style={{ height: 200, overflow: 'auto' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
            <Text strong style={{ fontSize: 12 }}>
              {selectedComponent ? `${selectedComponent.name} 属性` : '组件属性'}
            </Text>
          </div>
          {selectedComponent ? (
            <div style={{ padding: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>ID:</Text>
                <Text style={{ fontSize: 11, marginLeft: 4 }}>{selectedComponent.id}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>类型:</Text>
                <Tag style={{ marginLeft: 4, fontSize: 10 }}>{selectedComponent.type}</Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>位置:</Text>
                <Text style={{ fontSize: 11, marginLeft: 4 }}>
                  ({selectedComponent.position.x}, {selectedComponent.position.y})
                </Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>尺寸:</Text>
                <Text style={{ fontSize: 11, marginLeft: 4 }}>
                  {selectedComponent.size.width} × {selectedComponent.size.height}
                </Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Props:</Text>
                <pre style={{
                  fontSize: 10,
                  background: '#1a1a1a',
                  padding: 8,
                  borderRadius: 4,
                  margin: '4px 0',
                  overflow: 'auto',
                  maxHeight: 100,
                }}>
                  {JSON.stringify(selectedComponent.props, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <Empty
              description="请选择一个组件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: 20 }}
            />
          )}
        </div>
      </div>
    );
  };

  // 渲染网络面板
  const renderNetworkPanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
        <Space>
          <Button type="text" size="small" icon={<ClearOutlined />}>
            清空
          </Button>
          <Divider type="vertical" />
          <Text style={{ fontSize: 11, color: '#666' }}>
            0 个请求
          </Text>
        </Space>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty
          description="暂无网络请求"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    </div>
  );

  // 渲染性能面板
  const renderPerformancePanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
        <Space>
          <Button type="text" size="small" icon={<PlayCircleOutlined />}>
            开始记录
          </Button>
          <Button type="text" size="small" icon={<ClearOutlined />}>
            清空
          </Button>
        </Space>
      </div>
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}>
          <Card size="small" style={{ background: '#252525' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>组件数量</Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {currentPage?.components.length || 0}
            </Title>
          </Card>
          <Card size="small" style={{ background: '#252525' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>页面数量</Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {currentProject?.pages.length || 0}
            </Title>
          </Card>
          <Card size="small" style={{ background: '#252525' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>内存使用</Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              --
            </Title>
          </Card>
          <Card size="small" style={{ background: '#252525' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>渲染时间</Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              --
            </Title>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        height: isFullscreen ? '100vh' : 300,
        background: '#1f1f1f',
        borderTop: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 1000 : undefined,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 12px',
          background: '#1a1a1a',
          borderBottom: '1px solid #333',
        }}
      >
        <Space size={4}>
          <BugOutlined style={{ color: '#1677ff' }} />
          <Text strong style={{ fontSize: 12 }}>调试控制台</Text>
          <Badge
            status={isPlaying ? 'processing' : 'default'}
            text={
              <Text style={{ fontSize: 11, color: isPlaying ? '#52c41a' : '#666' }}>
                {isPlaying ? '运行中' : '已停止'}
              </Text>
            }
          />
        </Space>
        <Space size={4}>
          <Tooltip title={isPlaying ? '暂停预览' : '开始预览'}>
            <Button
              type={isPlaying ? 'primary' : 'text'}
              size="small"
              icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
            />
          </Tooltip>
          <Tooltip title="重新加载">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                clearLogs();
                if (isPlaying) {
                  addLog('info', '重新加载...');
                }
              }}
            />
          </Tooltip>
          <Divider type="vertical" style={{ margin: 0 }} />
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              size="small"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Tooltip>
          <Tooltip title="关闭调试面板 (F12)">
            <Button
              type="text"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => setShowDebugPanel(false)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        tabBarStyle={{
          margin: 0,
          padding: '0 12px',
          background: '#1a1a1a',
          borderBottom: '1px solid #333',
        }}
        items={[
          {
            key: 'console',
            label: (
              <Space size={4}>
                <CodeOutlined />
                控制台
                {logCounts.error > 0 && (
                  <Badge count={logCounts.error} size="small" />
                )}
              </Space>
            ),
            children: renderConsolePanel(),
          },
          {
            key: 'inspector',
            label: (
              <Space size={4}>
                <EyeOutlined />
                检查器
              </Space>
            ),
            children: renderInspectorPanel(),
          },
          {
            key: 'network',
            label: (
              <Space size={4}>
                <ExpandOutlined />
                网络
              </Space>
            ),
            children: renderNetworkPanel(),
          },
          {
            key: 'performance',
            label: (
              <Space size={4}>
                <DesktopOutlined />
                性能
              </Space>
            ),
            children: renderPerformancePanel(),
          },
        ]}
      />
    </div>
  );
};

export default PreviewDebugPanel;
