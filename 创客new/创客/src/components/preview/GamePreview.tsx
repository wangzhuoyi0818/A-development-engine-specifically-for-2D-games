import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePageStore } from '@/stores';
import type { ComponentInstance } from '@/types/miniprogram';
import { GameEngine } from '@/engine/GameEngine';
import { GameEvents } from '@/engine/EventSystem';
import type { GameObject } from '@/types/engine';

interface GamePreviewProps {
  onClose: () => void;
}

interface GameState {
  playerPosition: { x: number; y: number };
  keysPressed: Set<string>;
  enemyPositions: Map<string, { x: number; y: number }>;
  cameraPosition: { x: number; y: number };
}

export const GamePreview: React.FC<GamePreviewProps> = ({ onClose }) => {
  console.log('[GamePreview] Component rendering...');

  const canvasRef = useRef<HTMLDivElement>(null);
  const { getCurrentPage, setCurrentPage } = usePageStore();
  const currentPage = getCurrentPage();

  console.log('[GamePreview] Current page:', currentPage?.name, currentPage?.id);

  const [gameState, setGameState] = useState<GameState>({
    playerPosition: { x: 0, y: 0 },
    keysPressed: new Set(),
    enemyPositions: new Map(),
    cameraPosition: { x: 0, y: 0 },
  });

  const gameStateRef = useRef(gameState);
  const playerComponentRef = useRef<ComponentInstance | null>(null);
  const animationFrameRef = useRef<number>();

  // 游戏引擎实例
  const engineRef = useRef<GameEngine | null>(null);
  const gameObjectsRef = useRef<GameObject[]>([]);

  // 找到玩家角色组件和敌人组件
  useEffect(() => {
    console.log('[GamePreview] useEffect triggered, currentPage:', currentPage?.name);

    if (currentPage) {
      // 初始化游戏引擎（只在首次加载时执行）
      if (!engineRef.current) {
        try {
          console.log('[GamePreview] Creating GameEngine...');
          engineRef.current = new GameEngine({
            targetFPS: 60,
            gravity: { x: 0, y: 0 },
            debug: false,
            showFPS: false,
            showColliders: false,
          });
          console.log('[GamePreview] GameEngine created successfully');

          // 监听场景切换事件（只注册一次）
          engineRef.current.getEventSystem().on(GameEvents.SCENE_CHANGE, (data: any) => {
            console.log('[GamePreview] 场景切换事件触发:', data);
            const { sceneId } = data;

            // 切换到指定场景
            if (sceneId) {
              console.log('[GamePreview] 正在切换到场景:', sceneId);
              setCurrentPage(sceneId);
            }
          });

          console.log('[GamePreview] Event listener registered');
        } catch (error) {
          console.error('[GamePreview] Failed to create GameEngine:', error);
          return;
        }
      }

      // 每次场景变化都重新加载场景
      try {
        console.log('[GamePreview] Loading scene:', currentPage.name, currentPage.id);
        engineRef.current.loadScene(currentPage);
        console.log('[GamePreview] loadScene completed');

        engineRef.current.setCurrentScene(currentPage.id);
        console.log('[GamePreview] setCurrentScene completed');

        // 启动引擎（如果还没启动）
        if (!engineRef.current.isRunning()) {
          console.log('[GamePreview] Starting engine...');
          engineRef.current.start();
          console.log('[GamePreview] Engine started successfully');
        }
      } catch (error) {
        console.error('[GamePreview] Failed to load/start scene:', error);
        return;
      }

      const playerComponent = currentPage.components.find(
        comp => comp.gameRole?.roleType === 'player'
      );

      // 初始化敌人位置
      const enemyPositions = new Map<string, { x: number; y: number }>();
      currentPage.components.forEach(comp => {
        if (comp.gameRole?.roleType === 'enemy') {
          enemyPositions.set(comp.id, { ...comp.position });
        }
      });

      if (playerComponent) {
        playerComponentRef.current = playerComponent;
        const initialPlayerPos = { ...playerComponent.position };
        const initialState = {
          playerPosition: initialPlayerPos,
          keysPressed: new Set<string>(),
          enemyPositions,
          cameraPosition: {
            x: initialPlayerPos.x - 375 / 2 + playerComponent.size.width / 2,
            y: initialPlayerPos.y - 667 / 2 + playerComponent.size.height / 2,
          },
        };

        // 同时更新state和ref
        setGameState(initialState);
        gameStateRef.current = initialState;
      } else {
        // 即使没有玩家，也要初始化敌人位置
        setGameState(prev => ({
          ...prev,
          enemyPositions,
        }));
        gameStateRef.current.enemyPositions = enemyPositions;
      }
    }
  }, [currentPage]);

  // 组件卸载时清理引擎
  useEffect(() => {
    return () => {
      console.log('[GamePreview] Component unmounting, stopping engine');
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        gameStateRef.current.keysPressed.add(key);

        // 将按键转换为 KeyW/KeyA/KeyS/KeyD 格式（匹配积木定义）
        const keyCode = 'Key' + key.toUpperCase();
        // 通知引擎按键按下（会触发 onKeyDown 积木）
        if (engineRef.current) {
          engineRef.current.handleKeyDown(keyCode);
        }
      }
      // 处理空格键
      else if (e.key === ' ') {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.handleKeyDown('Space');
        }
      }
      // 处理方向键
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.handleKeyDown(e.key); // ArrowUp, ArrowDown, etc.
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        gameStateRef.current.keysPressed.delete(key);

        // 将按键转换为 KeyW/KeyA/KeyS/KeyD 格式
        const keyCode = 'Key' + key.toUpperCase();
        // 通知引擎按键松开（会触发 onKeyUp 积木）
        if (engineRef.current) {
          engineRef.current.handleKeyUp(keyCode);
        }
      }
      // 处理空格键
      else if (e.key === ' ') {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.handleKeyUp('Space');
        }
      }
      // 处理方向键
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        if (engineRef.current) {
          engineRef.current.handleKeyUp(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!currentPage) return;

    // 从引擎获取游戏对象（积木可能已经修改了它们的状态）
    if (engineRef.current) {
      gameObjectsRef.current = engineRef.current.getGameObjects();
    }

    // 如果有玩家角色，处理玩家相关逻辑
    if (playerComponentRef.current) {
      const moveSpeed = 5; // 每帧移动速度
      let newX = gameStateRef.current.playerPosition.x;
      let newY = gameStateRef.current.playerPosition.y;

    // 根据按键更新玩家位置
    if (gameStateRef.current.keysPressed.has('w')) {
      newY -= moveSpeed;
    }
    if (gameStateRef.current.keysPressed.has('s')) {
      newY += moveSpeed;
    }
    if (gameStateRef.current.keysPressed.has('a')) {
      newX -= moveSpeed;
    }
    if (gameStateRef.current.keysPressed.has('d')) {
      newX += moveSpeed;
    }

    // 无边界循环逻辑
    const canvasWidth = 375;
    const canvasHeight = 667;
    const worldWidth = canvasWidth; // 使用画布宽度作为循环边界
    const worldHeight = canvasHeight; // 使用画布高度作为循环边界
    const playerWidth = playerComponentRef.current.size.width;
    const playerHeight = playerComponentRef.current.size.height;

    // 循环边界：超出边界后从另一边出现
    if (newX > worldWidth) {
      newX = 0;
    } else if (newX + playerWidth < 0) {
      newX = worldWidth - playerWidth;
    }

    if (newY > worldHeight) {
      newY = 0;
    } else if (newY + playerHeight < 0) {
      newY = worldHeight - playerHeight;
    }

    // 更新玩家状态
    const playerMoved = newX !== gameStateRef.current.playerPosition.x || newY !== gameStateRef.current.playerPosition.y;
    if (playerMoved) {
      gameStateRef.current.playerPosition = { x: newX, y: newY };

      // 同时更新引擎中的玩家GameObject位置
      const playerGameObject = gameObjectsRef.current.find(obj => obj.id === playerComponentRef.current?.id);
      if (playerGameObject) {
        playerGameObject.position.x = newX;
        playerGameObject.position.y = newY;
      }

      // 更新摄像机位置，使玩家始终在画面中央
      const cameraX = newX - canvasWidth / 2 + playerWidth / 2;
      const cameraY = newY - canvasHeight / 2 + playerHeight / 2;
      gameStateRef.current.cameraPosition = { x: cameraX, y: cameraY };
    }

    // 从引擎同步敌人位置（积木可能修改了敌人位置）
    const newEnemyPositions = new Map(gameStateRef.current.enemyPositions);
    let enemiesUpdated = false;

    gameObjectsRef.current.forEach(obj => {
      const comp = currentPage.components.find(c => c.id === obj.id);
      if (comp?.gameRole?.roleType === 'enemy') {
        // 从 GameObject 同步位置
        const currentPos = newEnemyPositions.get(obj.id);
        if (!currentPos || currentPos.x !== obj.position.x || currentPos.y !== obj.position.y) {
          newEnemyPositions.set(obj.id, { x: obj.position.x, y: obj.position.y });
          enemiesUpdated = true;
        }
      }
    });

    // 如果没有积木控制，使用默认追踪逻辑
    currentPage.components.forEach(comp => {
      if (comp.gameRole?.roleType === 'enemy') {
        const chasePlayer = comp.gameRole.properties?.chasePlayer as boolean;
        const chaseSpeed = (comp.gameRole.properties?.chaseSpeed as number) || 1.5;
        const attackRange = (comp.gameRole.properties?.attackRange as number) || 50;

        if (chasePlayer) {
          const enemyPos = newEnemyPositions.get(comp.id);
          if (enemyPos) {
            // 计算玩家和敌人之间的距离（使用真实世界坐标）
            const dx = newX - enemyPos.x;
            const dy = newY - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果玩家在攻击范围内，追踪玩家
            if (distance < attackRange && distance > 5) {
              // 归一化方向向量
              const dirX = dx / distance;
              const dirY = dy / distance;

              // 计算新位置
              let newEnemyX = enemyPos.x + dirX * chaseSpeed;
              let newEnemyY = enemyPos.y + dirY * chaseSpeed;

              // 敌人循环边界
              const enemyWidth = comp.size.width;
              const enemyHeight = comp.size.height;

              if (newEnemyX > worldWidth) {
                newEnemyX = 0;
              } else if (newEnemyX + enemyWidth < 0) {
                newEnemyX = worldWidth - enemyWidth;
              }

              if (newEnemyY > worldHeight) {
                newEnemyY = 0;
              } else if (newEnemyY + enemyHeight < 0) {
                newEnemyY = worldHeight - enemyHeight;
              }

              newEnemyPositions.set(comp.id, { x: newEnemyX, y: newEnemyY });

              // 同步到引擎的 GameObject
              const enemyGameObject = gameObjectsRef.current.find(obj => obj.id === comp.id);
              if (enemyGameObject) {
                enemyGameObject.position.x = newEnemyX;
                enemyGameObject.position.y = newEnemyY;
              }

              enemiesUpdated = true;
            }
          }
        }
      }
    });

    // 如果有任何更新，更新状态
    if (playerMoved || enemiesUpdated) {
      gameStateRef.current.enemyPositions = newEnemyPositions;
      setGameState({ ...gameStateRef.current });
    }
    } else {
      // 没有玩家角色时，只更新敌人位置（如果有积木控制）
      const newEnemyPositions = new Map(gameStateRef.current.enemyPositions);
      let enemiesUpdated = false;

      gameObjectsRef.current.forEach(obj => {
        const comp = currentPage.components.find(c => c.id === obj.id);
        if (comp?.gameRole?.roleType === 'enemy') {
          const currentPos = newEnemyPositions.get(obj.id);
          if (!currentPos || currentPos.x !== obj.position.x || currentPos.y !== obj.position.y) {
            newEnemyPositions.set(obj.id, { x: obj.position.x, y: obj.position.y });
            enemiesUpdated = true;
          }
        }
      });

      if (enemiesUpdated) {
        gameStateRef.current.enemyPositions = newEnemyPositions;
        setGameState({ ...gameStateRef.current });
      }
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [currentPage]);

  // 启动游戏循环
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // 渲染背景图层（支持视差滚动和无限循环平铺）
  const renderBackgroundLayers = () => {
    if (!currentPage.backgroundLayers || currentPage.backgroundLayers.length === 0) {
      return null;
    }

    console.log('[GamePreview] Rendering', currentPage.backgroundLayers.length, 'background layers');

    // 按 order 排序，越小越靠后
    const sortedLayers = [...currentPage.backgroundLayers]
      .filter(layer => layer.visible)
      .sort((a, b) => a.order - b.order);

    const canvasWidth = 375;
    const canvasHeight = 667;

    return sortedLayers.map(layer => {
      // 获取背景图的平铺尺寸，默认使用画布尺寸
      // 可以通过 layer.tileWidth/tileHeight 自定义平铺单元尺寸实现无限循环
      const tileWidth = layer.tileWidth || canvasWidth;
      const tileHeight = layer.tileHeight || canvasHeight;

      // 根据视差速度计算背景偏移
      const rawOffsetX = -gameState.cameraPosition.x * layer.parallaxSpeed;
      const rawOffsetY = -gameState.cameraPosition.y * layer.parallaxSpeed;

      // 使用取模实现真正的无限循环
      // 确保偏移值始终在 [0, tileSize) 范围内，实现无缝重复
      const offsetX = ((rawOffsetX % tileWidth) + tileWidth) % tileWidth;
      const offsetY = ((rawOffsetY % tileHeight) + tileHeight) % tileHeight;

      console.log('[GamePreview] Background layer:', layer.name, 'order:', layer.order, 'url:', layer.imageUrl?.substring(0, 50) + '...');

      return (
        <div
          key={layer.id}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: layer.order,
            overflow: 'hidden',
            pointerEvents: 'none',
            // 使用背景图片并设置为平铺，实现无限循环效果
            backgroundImage: `url(${layer.imageUrl})`,
            // 使用实际平铺尺寸，让背景能够无限重复
            backgroundSize: `${tileWidth}px ${tileHeight}px`,
            backgroundPosition: `${offsetX}px ${offsetY}px`,
            // repeat 是关键：让背景图无限平铺
            backgroundRepeat: 'repeat',
            imageRendering: 'auto',
            willChange: 'background-position',
          }}
        />
      );
    });
  };

  // 渲染组件
  const renderComponent = (component: ComponentInstance) => {
    const isPlayer = component.gameRole?.roleType === 'player';
    const isEnemy = component.gameRole?.roleType === 'enemy';

    // 获取显示位置
    let displayX = component.position.x;
    let displayY = component.position.y;

    if (isPlayer) {
      // 玩家始终显示在画面中央
      displayX = 375 / 2 - component.size.width / 2;
      displayY = 667 / 2 - component.size.height / 2;
    } else {
      // 其他组件根据摄像机位置偏移
      if (isEnemy) {
        const enemyPos = gameState.enemyPositions.get(component.id);
        if (enemyPos) {
          displayX = enemyPos.x - gameState.cameraPosition.x;
          displayY = enemyPos.y - gameState.cameraPosition.y;
        } else {
          displayX = component.position.x - gameState.cameraPosition.x;
          displayY = component.position.y - gameState.cameraPosition.y;
        }
      } else {
        displayX = component.position.x - gameState.cameraPosition.x;
        displayY = component.position.y - gameState.cameraPosition.y;
      }
    }

    // 点击事件处理
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log('[GamePreview] 组件被点击:', component.name, component.id);

      // 通知游戏引擎触发点击事件
      if (engineRef.current && engineRef.current.handleClick) {
        engineRef.current.handleClick(component.id);
      }
    };

    const style: React.CSSProperties = {
      position: 'absolute',
      left: displayX,
      top: displayY,
      width: component.size.width,
      height: component.size.height,
      zIndex: component.zIndex,
      opacity: component.visible ? 1 : 0.3,
      ...component.styles,
      transition: isPlayer ? 'none' : undefined,
    };

    // 根据组件类型渲染
    const renderContent = () => {
      switch (component.type) {
        case 'view':
          return (
            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', border: '1px dashed #ddd' }}>
              {component.children?.map(renderComponent)}
            </div>
          );
        case 'text':
          return (
            <span style={{ color: component.styles.color as string || '#333' }}>
              {component.props.content as string || '文本内容'}
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
              }}
            >
              {component.props.content as string || '按钮'}
            </button>
          );
        case 'image':
          return component.props.src ? (
            <img
              src={component.props.src as string}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: component.props.mode as string || 'cover',
                imageRendering: 'pixelated', // 像素风格渲染
              } as React.CSSProperties}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              图片占位
            </div>
          );
        default:
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#f5f5f5',
                border: '1px dashed #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 12,
              }}
            >
              {component.type}
            </div>
          );
      }
    };

    return (
      <div key={component.id} style={style} onClick={handleClick}>
        {renderContent()}
      </div>
    );
  };

  if (!currentPage) {
    console.log('[GamePreview] No current page found!');
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}>
        <div style={{ color: '#fff' }}>没有找到页面</div>
      </div>
    );
  }

  console.log('[GamePreview] Rendering preview with', currentPage.components.length, 'components');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      {/* 顶部提示栏 */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 8,
        fontSize: 14,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}>
        <span>🎮 游戏预览模式</span>
        {playerComponentRef.current && (
          <span style={{ color: '#4ade80' }}>✓ 使用 WASD 控制角色</span>
        )}
        {!playerComponentRef.current && (
          <span style={{ color: '#94a3b8' }}>ℹ️ 此场景无玩家角色</span>
        )}
        <button
          onClick={() => {
            console.log('[GamePreview] Exit button clicked');
            onClose();
          }}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          退出预览
        </button>
      </div>

      {/* 游戏画布 */}
      <div
        ref={canvasRef}
        style={{
          width: 375,
          height: 667,
          background: currentPage.config?.backgroundColor || '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
          borderRadius: 8,
        }}
      >
        {/* 渲染背景图层（视差滚动） */}
        {renderBackgroundLayers()}

        {/* 渲染游戏对象 */}
        {currentPage.components.map(renderComponent)}
      </div>

      {/* 按键提示 */}
      {playerComponentRef.current && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '16px 20px',
          borderRadius: 8,
        }}>
          <KeyIndicator keyName="W" isPressed={gameState.keysPressed.has('w')} label="↑" />
          <KeyIndicator keyName="A" isPressed={gameState.keysPressed.has('a')} label="←" />
          <KeyIndicator keyName="S" isPressed={gameState.keysPressed.has('s')} label="↓" />
          <KeyIndicator keyName="D" isPressed={gameState.keysPressed.has('d')} label="→" />
        </div>
      )}
    </div>
  );
};

// 按键指示器组件
const KeyIndicator: React.FC<{ keyName: string; isPressed: boolean; label: string }> = ({ keyName, isPressed, label }) => (
  <div style={{
    width: 48,
    height: 48,
    background: isPressed ? '#4ade80' : '#374151',
    color: isPressed ? '#000' : '#fff',
    border: `2px solid ${isPressed ? '#22c55e' : '#4b5563'}`,
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    transition: 'all 0.1s',
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
  }}>
    <div style={{ fontSize: 16 }}>{keyName}</div>
    <div style={{ fontSize: 10, opacity: 0.7 }}>{label}</div>
  </div>
);

export default GamePreview;
