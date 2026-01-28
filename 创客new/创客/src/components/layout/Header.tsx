import React, { useEffect, useState } from 'react';
import { Layout, Button, Space, Dropdown, Select, Tooltip, Typography, Divider, Badge, Avatar, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ExportOutlined,
  UndoOutlined,
  RedoOutlined,
  MobileOutlined,
  HomeOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  PauseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined,
  BugOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  CloudOutlined,
  ShareAltOutlined,
  UserOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useUIStore, usePageStore, useProjectStore, useAuthStore } from '@/stores';
import { DEVICE_PRESETS, ZOOM_OPTIONS } from '@/constants/defaults';
import { useHotkeys } from '@/hooks/useHotkeys';
import { TutorialGuide, ShortcutsPanel } from '@/components/guide';
import {
  LoginDialog,
  ShareDialog,
  UserPresence,
  CloudSyncStatus,
  VersionHistory,
} from '@/components/collaboration';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  onExport?: () => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onBack }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // 认证状态
  const { user, profile, isAuthenticated, signOut, initialize } = useAuthStore();

  // 初始化认证
  useEffect(() => {
    initialize();
  }, [initialize]);

  const {
    leftSidebarCollapsed,
    rightSidebarCollapsed,
    toggleLeftSidebar,
    toggleRightSidebar,
    zoom,
    setZoom,
    device,
    setDeviceByName,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnapToGrid,
    isPlaying,
    togglePlay,
    showDebugPanel,
    toggleDebugPanel,
  } = useUIStore();

  const { canUndo, canRedo, undo, redo, selectedComponentId, deleteComponent, duplicateComponent } = usePageStore();
  const {
    currentProject,
    syncToCloud,
    cloudProjectId,
    isSyncing,
  } = useProjectStore();

  // 快捷键支持
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    handleSave();
  });
  useHotkeys('ctrl+z', (e) => {
    e.preventDefault();
    if (canUndo()) undo();
  });
  useHotkeys('ctrl+y', (e) => {
    e.preventDefault();
    if (canRedo()) redo();
  });
  useHotkeys('ctrl+d', (e) => {
    e.preventDefault();
    if (selectedComponentId) duplicateComponent(selectedComponentId);
  });
  useHotkeys('delete,backspace', (e) => {
    if (selectedComponentId) {
      e.preventDefault();
      deleteComponent(selectedComponentId);
    }
  });
  useHotkeys('f5', (e) => {
    e.preventDefault();
    togglePlay();
  });
  useHotkeys('f12', (e) => {
    e.preventDefault();
    toggleDebugPanel();
  });
  useHotkeys('ctrl++', (e) => {
    e.preventDefault();
    handleZoomIn();
  });
  useHotkeys('ctrl+-', (e) => {
    e.preventDefault();
    handleZoomOut();
  });
  useHotkeys('ctrl+0', (e) => {
    e.preventDefault();
    setZoom(1);
  });

  const deviceItems = DEVICE_PRESETS.map((d) => ({
    key: d.name,
    label: `${d.name} (${d.width}×${d.height})`,
    onClick: () => setDeviceByName(d.name),
  }));

  const handleSave = async () => {
    if (!isAuthenticated) {
      message.warning('请先登录后再保存到云端');
      setShowLoginDialog(true);
      return;
    }

    try {
      await syncToCloud();
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    message.success('已退出登录');
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: profile?.username || user?.email || '用户',
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '版本历史',
      onClick: () => setShowVersionHistory(true),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleSignOut,
      danger: true,
    },
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    setZoom(Math.round(newZoom * 10) / 10);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.25);
    setZoom(Math.round(newZoom * 10) / 10);
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid #303030',
        height: 44,
        background: '#1a1a1a',
      }}
    >
      {/* 左侧 */}
      <Space size="small">
        {onBack && (
          <Tooltip title="返回项目列表">
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={onBack}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
        )}

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        <Tooltip title={leftSidebarCollapsed ? '显示左侧面板 (Ctrl+1)' : '隐藏左侧面板 (Ctrl+1)'}>
          <Button
            type="text"
            icon={leftSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleLeftSidebar}
            style={{ color: '#a0a0a0' }}
          />
        </Tooltip>

        {currentProject && (
          <Space size={4}>
            <Text strong style={{ fontSize: 13, color: '#e0e0e0' }}>
              {currentProject.name}
            </Text>
            <Badge count={currentProject.pages.length} style={{ backgroundColor: '#1677ff' }} />
          </Space>
        )}
      </Space>

      {/* 中间工具栏 */}
      <Space size="small">
        {/* 撤销/重做 */}
        <Space.Compact>
          <Tooltip title="撤销 (Ctrl+Z)">
            <Button
              type="text"
              icon={<UndoOutlined />}
              disabled={!canUndo()}
              onClick={undo}
              style={{ color: canUndo() ? '#a0a0a0' : '#404040' }}
            />
          </Tooltip>
          <Tooltip title="重做 (Ctrl+Y)">
            <Button
              type="text"
              icon={<RedoOutlined />}
              disabled={!canRedo()}
              onClick={redo}
              style={{ color: canRedo() ? '#a0a0a0' : '#404040' }}
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        {/* 播放控制 */}
        <Tooltip title={isPlaying ? '暂停 (F5)' : '预览运行 (F5)'}>
          <Button
            type={isPlaying ? 'primary' : 'text'}
            icon={isPlaying ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlay}
            style={{ color: isPlaying ? undefined : '#a0a0a0' }}
          >
            {isPlaying ? '暂停' : '预览'}
          </Button>
        </Tooltip>

        {/* 调试面板 */}
        <Tooltip title={showDebugPanel ? '隐藏调试面板 (F12)' : '显示调试面板 (F12)'}>
          <Button
            type={showDebugPanel ? 'primary' : 'text'}
            icon={<BugOutlined />}
            onClick={toggleDebugPanel}
            style={{ color: showDebugPanel ? undefined : '#a0a0a0' }}
          />
        </Tooltip>

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        {/* 设备选择 */}
        <Dropdown menu={{ items: deviceItems }} trigger={['click']}>
          <Button type="text" icon={<MobileOutlined />} style={{ color: '#a0a0a0' }}>
            {device.name}
          </Button>
        </Dropdown>

        {/* 缩放控制 */}
        <Space.Compact>
          <Tooltip title="缩小 (Ctrl+-)">
            <Button
              type="text"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
          <Select
            value={zoom}
            onChange={setZoom}
            style={{ width: 70 }}
            size="small"
            options={ZOOM_OPTIONS}
          />
          <Tooltip title="放大 (Ctrl++)">
            <Button
              type="text"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
          <Tooltip title="重置 (Ctrl+0)">
            <Button
              type="text"
              icon={<CompressOutlined />}
              onClick={handleResetZoom}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
        </Space.Compact>

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        {/* 视图选项 */}
        <Tooltip title={showGrid ? '隐藏网格' : '显示网格'}>
          <Button
            type={showGrid ? 'primary' : 'text'}
            size="small"
            onClick={toggleGrid}
            style={{ color: showGrid ? undefined : '#a0a0a0' }}
          >
            网格
          </Button>
        </Tooltip>
        <Tooltip title={snapToGrid ? '关闭吸附' : '开启吸附'}>
          <Button
            type={snapToGrid ? 'primary' : 'text'}
            size="small"
            onClick={toggleSnapToGrid}
            style={{ color: snapToGrid ? undefined : '#a0a0a0' }}
          >
            吸附
          </Button>
        </Tooltip>
      </Space>

      {/* 右侧 */}
      <Space size="small">
        {/* 云同步状态 */}
        <CloudSyncStatus showText size="small" />

        <Tooltip title="保存到云端 (Ctrl+S)">
          <Button
            type="text"
            icon={<CloudOutlined />}
            onClick={handleSave}
            loading={isSyncing}
            style={{ color: '#a0a0a0' }}
          >
            保存
          </Button>
        </Tooltip>

        <Tooltip title="导出小程序">
          <Button type="primary" size="small" icon={<ExportOutlined />} onClick={onExport}>
            导出
          </Button>
        </Tooltip>

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        {/* 在线用户 */}
        {isAuthenticated && cloudProjectId && <UserPresence maxDisplay={3} />}

        {/* 分享按钮 */}
        {isAuthenticated && currentProject && (
          <Tooltip title="分享项目">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={() => setShowShareDialog(true)}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
        )}

        {/* 版本历史 */}
        {isAuthenticated && cloudProjectId && (
          <Tooltip title="版本历史">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => setShowVersionHistory(true)}
              style={{ color: '#a0a0a0' }}
            />
          </Tooltip>
        )}

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        <Tooltip title="快捷键参考 (?)">
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={() => setShowShortcuts(true)}
            style={{ color: '#a0a0a0' }}
          />
        </Tooltip>

        <Tooltip title="新手教程">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => setShowTutorial(true)}
            style={{ color: '#a0a0a0' }}
          />
        </Tooltip>

        <Tooltip title="设置">
          <Button type="text" icon={<SettingOutlined />} style={{ color: '#a0a0a0' }} />
        </Tooltip>

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        {/* 用户头像/登录按钮 */}
        {isAuthenticated ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
            <Avatar
              src={profile?.avatar_url}
              icon={<UserOutlined />}
              size="small"
              style={{ cursor: 'pointer', backgroundColor: '#1677ff' }}
            />
          </Dropdown>
        ) : (
          <Button
            type="text"
            icon={<UserOutlined />}
            onClick={() => setShowLoginDialog(true)}
            style={{ color: '#a0a0a0' }}
          >
            登录
          </Button>
        )}

        <Divider type="vertical" style={{ margin: '0 4px', borderColor: '#303030' }} />

        <Tooltip title={rightSidebarCollapsed ? '显示右侧面板 (Ctrl+2)' : '隐藏右侧面板 (Ctrl+2)'}>
          <Button
            type="text"
            icon={rightSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleRightSidebar}
            style={{ color: '#a0a0a0' }}
          />
        </Tooltip>
      </Space>

      {/* 新手教程 */}
      <TutorialGuide
        visible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {/* 快捷键面板 */}
      <ShortcutsPanel
        visible={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* 登录对话框 */}
      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
      />

      {/* 分享对话框 */}
      {currentProject && cloudProjectId && (
        <ShareDialog
          open={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          projectId={cloudProjectId}
          projectName={currentProject.name}
        />
      )}

      {/* 版本历史 */}
      <VersionHistory
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        projectId={cloudProjectId}
        projectData={currentProject}
        onRestore={(data) => {
          // 恢复版本后更新当前项目
          if (data) {
            message.success('版本已恢复');
          }
        }}
      />
    </AntHeader>
  );
};

export default Header;
