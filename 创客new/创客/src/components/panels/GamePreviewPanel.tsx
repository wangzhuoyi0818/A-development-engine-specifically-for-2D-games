// 游戏预览面板 - 集成游戏引擎的预览组件

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Button,
  Space,
  Typography,
  Tooltip,
  Tag,
  Divider,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseOutlined,
  ReloadOutlined,
  ExpandOutlined,
  CompressOutlined,
  BugOutlined,
  SoundOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { usePageStore, useUIStore } from '@/stores';
import { GameEngine } from '@/engine';
import type { GameObject, GameState } from '@/types/engine';

const { Text } = Typography;

interface GamePreviewPanelProps {
  width?: number;
  height?: number;
}

export const GamePreviewPanel: React.FC<GamePreviewPanelProps> = ({
  width = 375,
  height = 667,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const animationRef = useRef<number | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [fps, setFps] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [showColliders, setShowColliders] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);

  const { getCurrentPage } = usePageStore();
  const { device } = useUIStore();

  const currentPage = getCurrentPage();

  // 初始化游戏引擎
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine({
        targetFPS: 60,
        gravity: { x: 0, y: 0 },
        debug: showDebug,
        showFPS: true,
        showColliders: showColliders,
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // 加载当前页面到引擎
  useEffect(() => {
    if (engineRef.current && currentPage) {
      engineRef.current.loadScene(currentPage);
    }
  }, [currentPage]);

  // 游戏循环：更新状态
  const updateGameState = useCallback(() => {
    if (engineRef.current && isRunning && !isPaused) {
      const state = engineRef.current.getGameState();
      setGameState(state);
      setFps(engineRef.current.getFPS());
      setGameObjects(engineRef.current.getGameObjects());

      animationRef.current = requestAnimationFrame(updateGameState);
    }
  }, [isRunning, isPaused]);

  // 启动游戏状态更新
  useEffect(() => {
    if (isRunning && !isPaused) {
      animationRef.current = requestAnimationFrame(updateGameState);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isPaused, updateGameState]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (engineRef.current && isRunning && !isPaused) {
        engineRef.current.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current && isRunning && !isPaused) {
        engineRef.current.handleKeyUp(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRunning, isPaused]);

  // 点击事件处理
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !engineRef.current || !isRunning || isPaused) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    engineRef.current.handleTap(x, y);
  }, [isRunning, isPaused]);

  // 长按事件处理
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !engineRef.current || !isRunning || isPaused) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    longPressTimerRef.current = setTimeout(() => {
      engineRef.current?.handleLongPress(x, y);
    }, 500);
  }, [isRunning, isPaused]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // 启动游戏
  const startGame = () => {
    if (engineRef.current && currentPage) {
      // 重新加载最新的页面数据，确保获取最新的积木块脚本
      engineRef.current.loadScene(currentPage);
      engineRef.current.start();
      setIsRunning(true);
      setIsPaused(false);
      console.log('[GamePreviewPanel] Game started with scripts:',
        currentPage.components.map(c => ({
          name: c.name,
          scripts: c.scripts,
        }))
      );
    }
  };

  // 暂停游戏
  const pauseGame = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPaused(true);
    }
  };

  // 恢复游戏
  const resumeGame = () => {
    if (engineRef.current) {
      engineRef.current.resume();
      setIsPaused(false);
    }
  };

  // 停止游戏
  const stopGame = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
      setIsPaused(false);
      setGameState(null);
      setGameObjects([]);
    }
  };

  // 重新开始
  const restartGame = () => {
    stopGame();
    setTimeout(startGame, 100);
  };

  // 渲染游戏对象
  const renderGameObject = (obj: GameObject) => {
    if (!obj.isVisible) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: obj.position.x,
      top: obj.position.y,
      width: obj.size.width * obj.scale.x,
      height: obj.size.height * obj.scale.y,
      transform: `rotate(${obj.rotation}deg)`,
      transformOrigin: `${obj.anchor.x * 100}% ${obj.anchor.y * 100}%`,
      zIndex: obj.layer,
    };

    // 根据组件实例渲染
    const component = obj.componentInstance;
    if (!component) {
      return (
        <div
          key={obj.id}
          style={{
            ...style,
            background: '#ddd',
            border: showColliders ? '2px solid #ff0' : 'none',
          }}
        />
      );
    }

    const renderContent = () => {
      switch (component.type) {
        case 'image':
          return component.props.src ? (
            <img
              src={component.props.src as string}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              draggable={false}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#666',
            }}>
              图片
            </div>
          );

        case 'text':
          return (
            <span style={{
              color: component.styles?.color as string || '#333',
              fontSize: component.styles?.fontSize as number || 14,
            }}>
              {component.props.content as string || '文本'}
            </span>
          );

        case 'button':
          return (
            <button
              style={{
                width: '100%',
                height: '100%',
                background: component.props.type === 'primary' ? '#1677ff' : '#fff',
                color: component.props.type === 'primary' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {component.props.content as string || '按钮'}
            </button>
          );

        case 'view':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: component.styles?.backgroundColor as string || 'transparent',
            }} />
          );

        default:
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#999',
            }}>
              {component.type}
            </div>
          );
      }
    };

    return (
      <div
        key={obj.id}
        style={{
          ...style,
          outline: showColliders ? '2px solid rgba(255, 255, 0, 0.5)' : 'none',
        }}
      >
        {renderContent()}
      </div>
    );
  };

  // 渲染游戏状态显示
  const renderGameStateOverlay = () => {
    if (!gameState || !showDebug) return null;

    return (
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 4,
        fontSize: 11,
        color: '#fff',
        zIndex: 9999,
      }}>
        <div>FPS: {fps}</div>
        <div>得分: {gameState.score}</div>
        <div>生命: {gameState.lives}</div>
        <div>时间: {gameState.time.toFixed(1)}s</div>
        <div>帧数: {gameState.frameCount}</div>
        <div>对象: {gameObjects.length}</div>
      </div>
    );
  };

  // 渲染开始提示
  const renderStartPrompt = () => {
    if (isRunning) return null;

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}>
        <PlayCircleOutlined style={{ fontSize: 64, color: '#fff', marginBottom: 16 }} />
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 16 }}>
          点击开始游戏预览
        </Text>
        <Button type="primary" size="large" onClick={startGame}>
          开始游戏
        </Button>
      </div>
    );
  };

  // 渲染暂停提示
  const renderPauseOverlay = () => {
    if (!isPaused) return null;

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}>
        <PauseOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 16 }} />
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16 }}>游戏已暂停</Text>
        <Space>
          <Button type="primary" onClick={resumeGame}>继续</Button>
          <Button onClick={restartGame}>重新开始</Button>
        </Space>
      </div>
    );
  };

  const containerStyle: React.CSSProperties = isFullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
  } : {
    width: width + 2,
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#252525',
        borderBottom: '1px solid #333',
      }}>
        <Space size={4}>
          <Text strong style={{ fontSize: 12 }}>游戏预览</Text>
          {isRunning && (
            <Tag color={isPaused ? 'orange' : 'green'}>
              {isPaused ? '已暂停' : '运行中'}
            </Tag>
          )}
        </Space>
        <Space size={4}>
          {!isRunning ? (
            <Tooltip title="开始">
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={startGame}
              />
            </Tooltip>
          ) : (
            <>
              <Tooltip title={isPaused ? '继续' : '暂停'}>
                <Button
                  type="text"
                  size="small"
                  icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
                  onClick={isPaused ? resumeGame : pauseGame}
                />
              </Tooltip>
              <Tooltip title="重新开始">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={restartGame}
                />
              </Tooltip>
            </>
          )}
          <Divider type="vertical" style={{ margin: 0 }} />
          <Tooltip title={showDebug ? '隐藏调试信息' : '显示调试信息'}>
            <Button
              type={showDebug ? 'primary' : 'text'}
              size="small"
              icon={<BugOutlined />}
              onClick={() => setShowDebug(!showDebug)}
            />
          </Tooltip>
          <Tooltip title={showColliders ? '隐藏碰撞框' : '显示碰撞框'}>
            <Button
              type={showColliders ? 'primary' : 'text'}
              size="small"
              icon={showColliders ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              onClick={() => setShowColliders(!showColliders)}
            />
          </Tooltip>
          <Tooltip title={muted ? '取消静音' : '静音'}>
            <Button
              type={muted ? 'primary' : 'text'}
              size="small"
              icon={<SoundOutlined />}
              onClick={() => setMuted(!muted)}
            />
          </Tooltip>
          <Divider type="vertical" style={{ margin: 0 }} />
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              type="text"
              size="small"
              icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 游戏画布 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 20 : 0,
        background: '#0f0f0f',
      }}>
        <div
          ref={canvasRef}
          style={{
            width: isFullscreen ? device.width : width,
            height: isFullscreen ? device.height : height,
            background: currentPage?.config?.backgroundColor || '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          tabIndex={0}
        >
          {/* 渲染游戏对象 */}
          {gameObjects.map(renderGameObject)}

          {/* 状态覆盖层 */}
          {renderGameStateOverlay()}
          {renderStartPrompt()}
          {renderPauseOverlay()}
        </div>
      </div>

      {/* 底部状态栏 */}
      {isRunning && (
        <div style={{
          padding: '4px 12px',
          background: '#252525',
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
        }}>
          <Space size={12}>
            <Text type="secondary">得分: <Text strong>{gameState?.score || 0}</Text></Text>
            <Text type="secondary">生命: <Text strong>{gameState?.lives || 0}</Text></Text>
          </Space>
          <Space size={12}>
            <Text type="secondary">FPS: <Text strong>{fps}</Text></Text>
            <Text type="secondary">
              时间: <Text strong>{(gameState?.time || 0).toFixed(1)}s</Text>
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default GamePreviewPanel;
