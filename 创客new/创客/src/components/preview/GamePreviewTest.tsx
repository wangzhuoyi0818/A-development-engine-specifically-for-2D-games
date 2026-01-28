import React, { useState, useEffect } from 'react';
import { usePageStore, useProjectStore } from '@/stores';
import type { ComponentInstance } from '@/types/miniprogram';
import type { Block } from '@/types/block';

interface GamePreviewProps {
  onClose: () => void;
}

// 测试版本 - 不使用GameEngine，手动处理点击和键盘事件
export const GamePreviewTest: React.FC<GamePreviewProps> = ({ onClose }) => {
  const { getCurrentPage, setCurrentPage, updateComponent } = usePageStore();
  const { currentProject } = useProjectStore();
  const currentPage = getCurrentPage();
  const pages = currentProject?.pages || [];

  const [clickLog, setClickLog] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null); // 正在编辑的文本组件ID
  const [textValue, setTextValue] = useState<string>(''); // 临时编辑的文本值
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set()); // 当前按下的按键

  // 虚拟摇杆状态
  const [joystickStates, setJoystickStates] = useState<Record<string, {
    active: boolean;
    knobX: number;
    knobY: number;
    angle: number;
    distance: number;
  }>>({});

  // 监听键盘按下和松开
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止重复触发
      if (e.repeat) return;

      const key = e.key.toUpperCase();

      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 执行 onGameStart 脚本（场景初始化时执行一次）
  useEffect(() => {
    if (!currentPage?.components) return;

    console.log('[GamePreviewTest] 🚩 执行 onGameStart 脚本');

    // 🔍 调试：打印场景中所有组件信息
    console.log('[GamePreviewTest] 📋 场景中的组件列表:');
    currentPage.components.forEach((comp, index) => {
      console.log(`  ${index + 1}. "${comp.name}" (类型: ${comp.type}, 角色: ${comp.gameRole?.roleType || '无'})`);
    });

    currentPage.components.forEach(component => {
      const startBlocks = component.scripts?.onGameStart || component.scripts?.game_start;
      if (startBlocks && startBlocks.length > 0) {
        console.log(`[GamePreviewTest] 🎬 执行 ${component.name} 的 onGameStart，${startBlocks.length} 个积木`);
        executeBlocks(startBlocks, component);
      }
    });
  }, [currentPage?.id]); // 当场景切换时重新执行

  // 游戏主循环 - 持续运行以支持 onUpdate 和输入处理
  useEffect(() => {
    if (!currentPage) return;

    let animationFrameId: number;
    let frameCount = 0;

    const gameLoop = () => {
      frameCount++;

      // 1. 执行所有组件的 onUpdate 脚本（每帧执行）
      if (currentPage?.components) {
        currentPage.components.forEach(component => {
          const updateBlocks = component.scripts?.onUpdate || component.scripts?.game_update;
          if (updateBlocks && updateBlocks.length > 0) {
            // 每60帧（约1秒）打印一次日志
            if (frameCount % 60 === 0) {
              console.log(`[GamePreviewTest] 🔄 执行 ${component.name} 的 onUpdate，${updateBlocks.length} 个积木`);
            }
            executeBlocks(updateBlocks, component);
          }
        });
      }

      // 2. 处理键盘控制
      if (pressedKeys.size > 0 && currentPage?.components) {
        currentPage.components.forEach(component => {
          // 修复：支持多种键名格式（向后兼容）
          const blocks = component.scripts?.onKeyDown || component.scripts?.keydown || component.scripts?.['on-keydown'];
          if (!blocks || blocks.length === 0) return;

          // 调试日志（只在第一次找到积木时输出）
          if (blocks.length > 0 && !component['_keydownLogged']) {
            console.log(`[GamePreviewTest] 🎮 组件 "${component.name}" 有 ${blocks.length} 个 onKeyDown 积木`);
            console.log('[GamePreviewTest] 积木类型:', blocks.map(b => b.type).join(' → '));
            component['_keydownLogged'] = true;
          }

          pressedKeys.forEach(key => {
            executeBlocks(blocks, component, key);
          });
        });
      }

      // 3. 处理摇杆控制
      if (currentPage?.components) {
        Object.entries(joystickStates).forEach(([joystickId, state]) => {
          // 减少日志输出
          if (frameCount % 60 === 0 && state.active) {
            console.log('[GamePreviewTest] 🕹️ 摇杆状态:', joystickId, state);
          }

          if (!state.active || state.distance === 0) {
            return;
          }

          const joystick = currentPage.components.find(c => c.id === joystickId);
          if (!joystick || joystick.type !== 'joystick') {
            return;
          }

          const speed = (joystick.props.speed as number) || 3;
          const targetId = joystick.props.targetId as string;

          let targets: ComponentInstance[] = [];
          if (targetId) {
            const target = currentPage.components.find(c => c.id === targetId);
            if (target) targets = [target];
          } else {
            targets = currentPage.components.filter(c =>
              c.gameRole?.roleType === 'player'
            );
          }

          if (targets.length === 0) {
            if (frameCount % 120 === 0) {
              console.log('[GamePreviewTest] ⚠️ 没有找到可控制的角色！');
            }
            return;
          }

          const moveX = Math.cos(state.angle) * speed * (state.distance / 50);
          const moveY = Math.sin(state.angle) * speed * (state.distance / 50);

          targets.forEach(target => {
            let newX = target.position.x + moveX;
            let newY = target.position.y + moveY;
            newX = Math.max(0, Math.min(375 - target.size.width, newX));
            newY = Math.max(0, Math.min(667 - target.size.height, newY));

            updateComponent(target.id, {
              position: { x: newX, y: newY }
            });
          });
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pressedKeys, currentPage, joystickStates, updateComponent]);

  // 执行积木块序列
  const executeBlocks = (blocks: Block[], component: ComponentInstance, pressedKey?: string) => {
    let skipUntilNextKeypress = false;

    // 🔍 调试：打印要执行的积木列表
    if (!component['_blocksLogged']) {
      console.log(`[GamePreviewTest] 📦 ${component.name} 的积木序列:`, blocks.map(b => b.type).join(' → '));
      component['_blocksLogged'] = true;
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // 🔍 调试：打印每个积木的执行
      console.log(`[GamePreviewTest] 🔧 执行积木 [${i}]: ${block.type}`, block.values);

      // 处理按键判断积木 - 作为分支点
      if (block.type === 'event_keypress') {
        const targetKey = block.values?.key?.toString() || '';  // 'KeyW' 或 'W'

        // 标准化按键格式进行比较
        const normalizedTarget = targetKey.toUpperCase();
        const normalizedPressed = pressedKey?.toUpperCase() || '';

        // 支持多种格式匹配：
        // 1. 完全匹配：'W' === 'W' 或 'KeyW' === 'KeyW'
        // 2. 去掉 'Key' 前缀：'KeyW' 匹配 'W'
        const targetLetter = normalizedTarget.replace('KEY', '');  // 'KEYW' → 'W'

        const isMatch = normalizedTarget === normalizedPressed ||
                       targetLetter === normalizedPressed ||
                       normalizedTarget === 'KEY' + normalizedPressed;  // 'KEYW' === 'KEY' + 'W'

        // 调试日志
        console.log(`[GamePreviewTest] 🔍 按键匹配检查: 期望=${targetKey}, 实际=${pressedKey}, 匹配=${isMatch}`);

        if (isMatch) {
          // 按键匹配，执行后续积木直到下一个event_keypress
          skipUntilNextKeypress = false;
          console.log('[GamePreviewTest] ✅ 按键匹配，执行后续积木');
        } else {
          // 按键不匹配，跳过后续积木直到下一个event_keypress
          skipUntilNextKeypress = true;
          console.log('[GamePreviewTest] ❌ 按键不匹配，跳过后续积木');
        }
        continue;
      }

      // 如果当前在跳过模式，不执行这个积木
      if (skipUntilNextKeypress) {
        continue;
      }

      // 处理移动积木
      if (block.type === 'motion_move') {
        const direction = block.values?.direction as string;
        const distance = (block.values?.distance as number) || 10;

        console.log(`[GamePreviewTest] 🏃 执行移动: ${direction}, 距离=${distance}`);

        // 🔥 关键修复：实时从 store 获取最新位置
        const freshPage = getCurrentPage();
        const freshComponent = freshPage?.components.find(c => c.id === component.id);
        if (!freshComponent) continue;

        // 计算新位置
        let newX = freshComponent.position.x;
        let newY = freshComponent.position.y;

        switch (direction) {
          case 'up':
            newY -= distance;
            break;
          case 'down':
            newY += distance;
            break;
          case 'left':
            newX -= distance;
            break;
          case 'right':
            newX += distance;
            break;
        }

        // 边界限制（假设画布是375x667）
        newX = Math.max(0, Math.min(375 - freshComponent.size.width, newX));
        newY = Math.max(0, Math.min(667 - freshComponent.size.height, newY));

        // 更新组件位置
        updateComponent(freshComponent.id, {
          position: { x: newX, y: newY }
        });
      }

      // 处理跟随/追踪积木
      if (block.type === 'motion_followtarget') {
        const targetName = block.values?.target as string;
        const targetId = block.values?.targetId as string;
        const speed = (block.values?.speed as number) || 5;

        // 🔥 关键修复：实时从 store 获取最新的 currentPage 和组件位置
        const freshPage = getCurrentPage();
        if (!freshPage) {
          console.log(`[GamePreviewTest] ⚠️ 无法获取最新页面状态`);
          continue;
        }

        const latestComponent = freshPage.components.find(c => c.id === component.id);
        if (!latestComponent) {
          console.log(`[GamePreviewTest] ⚠️ 无法找到追踪者组件: ${component.name}`);
          continue;
        }

        // 查找目标对象（多层回退机制）
        let targetComponent: ComponentInstance | undefined;

        // 1. 优先按 ID 查找
        if (targetId) {
          targetComponent = freshPage.components.find(c => c.id === targetId);
        }

        // 2. 按名称精确匹配
        if (!targetComponent && targetName) {
          targetComponent = freshPage.components.find(c => c.name === targetName);
        }

        // 3. 按名称模糊匹配（忽略大小写）
        if (!targetComponent && targetName) {
          const lowerTargetName = targetName.toLowerCase();
          targetComponent = freshPage.components.find(c =>
            c.name.toLowerCase().includes(lowerTargetName) ||
            lowerTargetName.includes(c.name.toLowerCase())
          );
        }

        // 4. 查找角色类型为"玩家"的组件
        if (!targetComponent) {
          targetComponent = freshPage.components.find(c => c.gameRole?.roleType === 'player');
          if (targetComponent) {
            console.log(`[GamePreviewTest] 💡 未找到 "${targetName || targetId}"，自动追踪玩家角色: ${targetComponent.name}`);
          }
        }

        // 5. 查找任何包含"玩家"、"player"、"角色"、"character"关键词的组件
        if (!targetComponent) {
          targetComponent = freshPage.components.find(c => {
            const name = c.name.toLowerCase();
            return name.includes('玩家') || name.includes('player') ||
                   name.includes('角色') || name.includes('character') ||
                   name.includes('主角') || name.includes('hero');
          });
          if (targetComponent) {
            console.log(`[GamePreviewTest] 💡 未找到 "${targetName || targetId}"，根据关键词追踪: ${targetComponent.name}`);
          }
        }

        if (!targetComponent) {
          // 只在第一次失败时打印，避免刷屏
          if (!component['_trackTargetNotFoundLogged']) {
            console.log(`[GamePreviewTest] ❌ 未找到追踪目标: ${targetName || targetId || 'player'}`);
            console.log(`[GamePreviewTest] 💡 提示：确保场景中有角色类型为"玩家"的组件，或名称包含"玩家"/"player"关键词`);
            component['_trackTargetNotFoundLogged'] = true;
          }
          continue;
        }

        // 🔍 调试：打印追踪详情（使用最新位置）
        console.log(`[GamePreviewTest] 🎯 开始追踪计算:`);
        console.log(`  - 追踪者: ${latestComponent.name} @ (${latestComponent.position.x}, ${latestComponent.position.y})`);
        console.log(`  - 目标: ${targetComponent.name} @ (${targetComponent.position.x}, ${targetComponent.position.y})`);

        // 计算追踪移动（使用最新位置）
        const dx = targetComponent.position.x - latestComponent.position.x;
        const dy = targetComponent.position.y - latestComponent.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        console.log(`  - 距离: ${distance.toFixed(2)}, 速度: ${speed}`);

        if (distance > 5) { // 避免抖动
          const dirX = dx / distance;
          const dirY = dy / distance;

          let newX = latestComponent.position.x + dirX * speed;
          let newY = latestComponent.position.y + dirY * speed;

          console.log(`  - 移动向量: (${dirX.toFixed(2)}, ${dirY.toFixed(2)})`);
          console.log(`  - 新位置（移动前）: (${newX.toFixed(2)}, ${newY.toFixed(2)})`);

          // 边界限制
          newX = Math.max(0, Math.min(375 - latestComponent.size.width, newX));
          newY = Math.max(0, Math.min(667 - latestComponent.size.height, newY));

          console.log(`  - 新位置（边界限制后）: (${newX.toFixed(2)}, ${newY.toFixed(2)})`);

          updateComponent(latestComponent.id, {
            position: { x: newX, y: newY }
          });

          console.log(`[GamePreviewTest] ✅ ${latestComponent.name} 移动完成，追踪 ${targetComponent.name}`);
        } else {
          console.log(`  - ⏸️ 距离太近 (${distance.toFixed(2)} <= 5)，停止移动`);
        }
      }

      // 处理场景跳转积木
      if (block.type === 'state_gotoscene') {
        const targetSceneId = block.values?.scene || block.values?.sceneId;
        console.log('[GamePreviewTest] 🎯 场景跳转积木');
        console.log('[GamePreviewTest] 目标场景ID:', targetSceneId);
        setClickLog(prev => [...prev, `🎯 切换到: ${targetSceneId}`]);

        if (targetSceneId) {
          // 先通过ID查找，如果找不到再通过名称查找
          let targetPage = pages.find(p => p.id === targetSceneId);

          if (!targetPage) {
            targetPage = pages.find(p => p.name === targetSceneId);
            console.log('[GamePreviewTest] 通过名称查找');
          }

          if (targetPage) {
            console.log('[GamePreviewTest] ✅ 切换到场景:', targetPage.name);
            setClickLog(prev => [...prev, `✅ 切换成功: ${targetPage.name}`]);
            setCurrentPage(targetPage.id);
          } else {
            console.error('[GamePreviewTest] ❌ 场景未找到');
            setClickLog(prev => [...prev, `❌ 场景未找到: ${targetSceneId}`]);
          }
        }
      }

      // 处理随机场景跳转积木
      if (block.type === 'state_gotorandomscene') {
        console.log('[GamePreviewTest] 🎲 随机场景跳转积木');
        const excludeCurrent = block.values?.excludeCurrent !== false;

        let availableScenes = [...pages];
        if (excludeCurrent && currentPage) {
          availableScenes = pages.filter(p => p.id !== currentPage.id);
        }

        console.log('[GamePreviewTest] 可选场景:', availableScenes.map(p => p.name));
        setClickLog(prev => [...prev, `🎲 可选: ${availableScenes.map(p => p.name).join('、')}`]);

        if (availableScenes.length === 0) {
          console.error('[GamePreviewTest] ❌ 没有可切换的场景');
          setClickLog(prev => [...prev, `❌ 没有可切换的场景`]);
          return;
        }

        const randomIndex = Math.floor(Math.random() * availableScenes.length);
        const targetPage = availableScenes[randomIndex];

        console.log('[GamePreviewTest] ✅ 随机选中:', targetPage.name);
        setClickLog(prev => [...prev, `✅ 随机: ${targetPage.name}`]);
        setCurrentPage(targetPage.id);
      }
    }
  };

  // 手动处理组件点击
  const handleComponentClick = (component: ComponentInstance) => {
    console.log('[GamePreviewTest] ========== Component Clicked ==========');
    console.log('[GamePreviewTest] Component name:', component.name);
    console.log('[GamePreviewTest] Component.scripts:', component.scripts);

    setClickLog(prev => [...prev, `🖱️ 点击: ${component.name}`]);

    // 检查组件是否有scripts
    if (!component.scripts) {
      console.log('[GamePreviewTest] ❌ Component has no scripts');
      setClickLog(prev => [...prev, `❌ 组件无scripts字段`]);
      return;
    }

    // 检查是否有onClick触发器
    const onClickBlocks = component.scripts['onClick'] || component.scripts['click'] || component.scripts['tap'];

    if (!onClickBlocks || onClickBlocks.length === 0) {
      console.log('[GamePreviewTest] ❌ No onClick blocks found');
      setClickLog(prev => [...prev, `❌ 无onClick积木`]);
      return;
    }

    console.log('[GamePreviewTest] ✅ Found', onClickBlocks.length, 'onClick blocks');
    setClickLog(prev => [...prev, `✅ 找到${onClickBlocks.length}个onClick积木`]);

    // 执行点击事件的积木
    executeBlocks(onClickBlocks, component);
  };

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
      {/* 提示栏 */}
      <div style={{
        position: 'absolute',
        top: 20,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <span>🎮 测试版预览模式 - 当前: {currentPage?.name}</span>
        <button
          onClick={() => {
            console.log('[GamePreviewTest] Exit clicked');
            onClose();
          }}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          退出
        </button>
      </div>

      {/* 点击日志（调试用） */}
      <div style={{
        position: 'absolute',
        top: 80,
        right: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        padding: 12,
        borderRadius: 4,
        maxWidth: 300,
        maxHeight: 200,
        overflow: 'auto',
        fontSize: 12,
        fontFamily: 'monospace',
      }}>
        <div style={{ marginBottom: 8, fontWeight: 'bold' }}>点击日志:</div>
        {clickLog.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {/* 游戏画布 */}
      <div style={{
        width: 375,
        height: 667,
        background: currentPage?.config?.backgroundColor || '#fff',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* 渲染背景图层 */}
        {currentPage?.backgroundLayers && currentPage.backgroundLayers.length > 0 && (
          <>
            {currentPage.backgroundLayers
              .filter(layer => layer.visible)
              .sort((a, b) => a.order - b.order)
              .map(layer => (
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
                    backgroundImage: `url(${layer.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              ))}
          </>
        )}

        {/* 渲染实际组件 */}
        {currentPage?.components?.map((component) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: component.position.x,
            top: component.position.y,
            width: component.size.width,
            height: component.size.height,
            zIndex: component.zIndex,
            opacity: component.visible ? 1 : 0.3,
            cursor: 'pointer',
            ...component.styles,
          };

          // 根据组件类型渲染
          let content = null;
          switch (component.type) {
            case 'image':
              content = component.props.src ? (
                <img
                  src={component.props.src as string}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: (component.props.mode as string) || 'cover',
                    imageRendering: 'auto',
                    display: 'block',
                  }}
                  onError={(e) => {
                    console.error('[GamePreviewTest] Image failed to load:', component.props.src);
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                }}>
                  无图片
                </div>
              );
              break;
            case 'text':
              const isEditingThis = editingTextId === component.id;
              content = isEditingThis ? (
                // 编辑模式：显示输入框
                <textarea
                  autoFocus
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onBlur={() => {
                    // 失去焦点时保存
                    updateComponent(component.id, {
                      props: { ...component.props, content: textValue }
                    });
                    setEditingTextId(null);
                    setClickLog(prev => [...prev, `💾 保存文本: ${textValue}`]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      updateComponent(component.id, {
                        props: { ...component.props, content: textValue }
                      });
                      setEditingTextId(null);
                      setClickLog(prev => [...prev, `💾 保存文本: ${textValue}`]);
                    } else if (e.key === 'Escape') {
                      setEditingTextId(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: component.styles.fontSize as string || '14px',
                    color: component.styles.color as string || '#333',
                    fontWeight: component.styles.fontWeight as string || 'normal',
                    fontStyle: component.styles.fontStyle as string || 'normal',
                    textAlign: component.styles.textAlign as any || 'left',
                    lineHeight: component.styles.lineHeight as string || '1.5',
                    textDecoration: component.styles.textDecoration as string || 'none',
                    letterSpacing: component.styles.letterSpacing as string || 'normal',
                    textShadow: component.styles.textShadow as string || 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    border: '2px solid #1677ff',
                    background: '#fff',
                    padding: '4px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              ) : (
                // 显示模式：可双击编辑
                <div
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingTextId(component.id);
                    setTextValue((component.props.content as string) || '文本');
                    setClickLog(prev => [...prev, `✏️ 编辑文本: ${component.name}`]);
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: component.styles.textAlign === 'center' ? 'center' :
                               component.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    fontSize: component.styles.fontSize as string || '14px',
                    color: component.styles.color as string || '#333',
                    fontWeight: component.styles.fontWeight as string || 'normal',
                    fontStyle: component.styles.fontStyle as string || 'normal',
                    textAlign: component.styles.textAlign as any || 'left',
                    lineHeight: component.styles.lineHeight as string || '1.5',
                    textDecoration: component.styles.textDecoration as string || 'none',
                    letterSpacing: component.styles.letterSpacing as string || 'normal',
                    textShadow: component.styles.textShadow as string || 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    cursor: 'text',
                  }}
                >
                  {(component.props.content as string) || '文本'}
                </div>
              );
              break;
            case 'button':
              content = (
                <button style={{
                  width: '100%',
                  height: '100%',
                  background: component.props.type === 'primary' ? '#1677ff' : '#fff',
                  color: component.props.type === 'primary' ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}>
                  {(component.props.content as string) || '按钮'}
                </button>
              );
              break;
            case 'input':
              content = (
                <input
                  type={(component.props.type as string) || 'text'}
                  placeholder={(component.props.placeholder as string) || '请输入'}
                  value={(component.props.value as string) || ''}
                  onChange={(e) => {
                    updateComponent(component.id, {
                      props: { ...component.props, value: e.target.value }
                    });
                    setClickLog(prev => [...prev, `📝 输入: ${e.target.value}`]);
                  }}
                  disabled={(component.props.disabled as boolean) || false}
                  maxLength={(component.props.maxlength as number) || undefined}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '0 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#fff',
                    color: '#333',
                    ...component.styles,
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              );
              break;
            case 'joystick':
              // 虚拟摇杆组件
              const joystickSize = (component.props.size as number) || 120;
              const knobSize = joystickSize * 0.4;
              const opacity = (component.props.opacity as number) || 0.6;
              const state = joystickStates[component.id] || { active: false, knobX: 0, knobY: 0, angle: 0, distance: 0 };

              // 摇杆事件处理
              const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
                e.stopPropagation();
                e.preventDefault();

                console.log('[GamePreviewTest] 🕹️ 摇杆开始拖动:', component.name, component.id);

                const baseEl = e.currentTarget as HTMLElement;
                const baseRect = baseEl.getBoundingClientRect();
                const centerX = baseRect.left + baseRect.width / 2;
                const centerY = baseRect.top + baseRect.height / 2;

                const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
                  const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
                  const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

                  let deltaX = clientX - centerX;
                  let deltaY = clientY - centerY;

                  // 计算距离和角度
                  const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), joystickSize / 2);
                  const angle = Math.atan2(deltaY, deltaX);

                  // 限制操纵杆在底座范围内
                  const maxDist = (joystickSize / 2) - (knobSize / 2);
                  if (distance > maxDist) {
                    deltaX = Math.cos(angle) * maxDist;
                    deltaY = Math.sin(angle) * maxDist;
                  }

                  setJoystickStates(prev => ({
                    ...prev,
                    [component.id]: {
                      active: true,
                      knobX: deltaX,
                      knobY: deltaY,
                      angle,
                      distance,
                    }
                  }));

                  // 每隔一段时间输出一次摇杆状态（避免日志过多）
                  if (Math.random() < 0.1) {
                    console.log('[GamePreviewTest] 🎯 摇杆状态 - 角度:', (angle * 180 / Math.PI).toFixed(0), '°, 距离:', distance.toFixed(0));
                  }
                };

                const handleEnd = () => {
                  console.log('[GamePreviewTest] 🕹️ 摇杆停止拖动');

                  setJoystickStates(prev => ({
                    ...prev,
                    [component.id]: {
                      active: false,
                      knobX: 0,
                      knobY: 0,
                      angle: 0,
                      distance: 0,
                    }
                  }));

                  document.removeEventListener('mousemove', handleMove as any);
                  document.removeEventListener('mouseup', handleEnd);
                  document.removeEventListener('touchmove', handleMove as any);
                  document.removeEventListener('touchend', handleEnd);
                };

                document.addEventListener('mousemove', handleMove as any);
                document.addEventListener('mouseup', handleEnd);
                document.addEventListener('touchmove', handleMove as any);
                document.addEventListener('touchend', handleEnd);

                // 触发第一次移动
                handleMove(e.nativeEvent);
              };

              content = (
                <div
                  onMouseDown={handleJoystickStart}
                  onTouchStart={handleJoystickStart}
                  style={{
                    width: joystickSize,
                    height: joystickSize,
                    borderRadius: '50%',
                    background: `rgba(0, 0, 0, ${opacity * 0.3})`,
                    border: `3px solid rgba(0, 0, 0, ${opacity * 0.5})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                >
                  {/* 操纵杆 */}
                  <div style={{
                    width: knobSize,
                    height: knobSize,
                    borderRadius: '50%',
                    background: `rgba(0, 0, 0, ${opacity})`,
                    border: `2px solid rgba(255, 255, 255, ${opacity})`,
                    position: 'absolute',
                    transform: `translate(${state.knobX}px, ${state.knobY}px)`,
                    transition: state.active ? 'none' : 'transform 0.2s',
                    pointerEvents: 'none',
                  }} />
                </div>
              );
              break;
            default:
              content = (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#f5f5f5',
                  border: '1px dashed #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 12,
                }}>
                  {component.type}
                </div>
              );
          }

          return (
            <div
              key={component.id}
              style={style}
              onClick={(e) => {
                e.stopPropagation();
                handleComponentClick(component);
              }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamePreviewTest;
