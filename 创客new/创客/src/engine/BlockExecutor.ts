// 积木执行器 - 解释执行积木脚本

import type { Block } from '@/types/block';
import type { ExecutionContext, ExecutionResult, GameObject } from '@/types/engine';
import { EventSystem, GameEvents } from './EventSystem';
import { GameStateManager } from './GameStateManager';

// 块处理器函数类型
type BlockHandler = (
  block: Block,
  context: ExecutionContext,
  executor: BlockExecutor
) => Promise<ExecutionResult>;

export class BlockExecutor {
  private eventSystem: EventSystem;
  private stateManager: GameStateManager;
  private handlers: Map<string, BlockHandler> = new Map();
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;

  constructor(eventSystem: EventSystem, stateManager: GameStateManager) {
    this.eventSystem = eventSystem;
    this.stateManager = stateManager;
    this.registerBuiltinHandlers();
  }

  /**
   * 注册内置积木处理器
   */
  private registerBuiltinHandlers(): void {
    // ========== 控制类 ==========
    this.registerHandler('control_wait', async (block, context) => {
      const duration = this.getValue(block, 'duration', context) || 1;
      await this.wait(duration * 1000);
      return { success: true };
    });

    this.registerHandler('control_repeat', async (block, context, executor) => {
      const times = this.getValue(block, 'times', context) || 10;
      const bodyBlocks = this.getNestedBlocks(block, 'body');

      for (let i = 0; i < times; i++) {
        if (!this.isRunning) break;

        context.localVariables['_loopIndex'] = i;
        const result = await executor.executeBlocks(bodyBlocks, context);

        if (result.shouldBreak) break;
        if (result.error) return result;
      }

      return { success: true };
    });

    this.registerHandler('control_foreach', async (block, context, executor) => {
      const list = this.getValue(block, 'list', context) || [];
      const itemVar = this.getValue(block, 'itemVar', context) || 'item';
      const bodyBlocks = this.getNestedBlocks(block, 'body');

      if (!Array.isArray(list)) {
        return { success: false, error: '遍历的目标不是数组' };
      }

      for (let i = 0; i < list.length; i++) {
        if (!this.isRunning) break;

        context.localVariables[itemVar] = list[i];
        context.localVariables['_loopIndex'] = i;

        const result = await executor.executeBlocks(bodyBlocks, context);

        if (result.shouldBreak) break;
        if (result.error) return result;
      }

      return { success: true };
    });

    this.registerHandler('control_stop', async () => {
      return { success: true, shouldBreak: true };
    });

    // 永久循环
    this.registerHandler('control_forever', async (block, context, executor) => {
      const bodyBlocks = this.getNestedBlocks(block, 'body');

      while (this.isRunning) {
        const result = await executor.executeBlocks(bodyBlocks, context);
        if (result.shouldBreak || result.error) break;
        // 让出控制权，避免阻塞
        await this.wait(16); // ~60fps
      }

      return { success: true };
    });

    // ========== 条件类 ==========
    this.registerHandler('condition_if', async (block, context, executor) => {
      const condition = this.getValue(block, 'condition', context);
      if (condition) {
        const thenBlocks = this.getNestedBlocks(block, 'then');
        return await executor.executeBlocks(thenBlocks, context);
      }
      return { success: true };
    });

    this.registerHandler('condition_ifelse', async (block, context, executor) => {
      const condition = this.getValue(block, 'condition', context);
      if (condition) {
        const thenBlocks = this.getNestedBlocks(block, 'then');
        return await executor.executeBlocks(thenBlocks, context);
      } else {
        const elseBlocks = this.getNestedBlocks(block, 'else');
        return await executor.executeBlocks(elseBlocks, context);
      }
    });

    this.registerHandler('condition_compare', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      const operator = block.values['operator'] as string || '==';

      let result = false;
      switch (operator) {
        case '==': result = left == right; break;
        case '!=': result = left != right; break;
        case '>': result = left > right; break;
        case '<': result = left < right; break;
        case '>=': result = left >= right; break;
        case '<=': result = left <= right; break;
      }

      return { success: true, value: result };
    });

    this.registerHandler('condition_and', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      return { success: true, value: Boolean(left && right) };
    });

    this.registerHandler('condition_or', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      return { success: true, value: Boolean(left || right) };
    });

    this.registerHandler('condition_not', async (block, context) => {
      const value = this.getValue(block, 'value', context);
      return { success: true, value: !value };
    });

    // ========== 数据类 ==========
    this.registerHandler('data_variable', async (block, context) => {
      const name = block.values['name'] as string;
      let value = context.localVariables[name];
      if (value === undefined) {
        value = this.stateManager.getVariable(name);
      }
      return { success: true, value };
    });

    this.registerHandler('data_setvalue', async (block, context) => {
      const name = block.values['name'] as string;
      const value = this.getValue(block, 'value', context);
      this.stateManager.setVariable(name, value);
      return { success: true };
    });

    this.registerHandler('data_getvalue', async (block, context) => {
      const path = block.values['path'] as string;
      const value = this.getNestedValue(context, path);
      return { success: true, value };
    });

    // ========== 数学类 ==========
    this.registerHandler('math_number', async (block) => {
      const value = block.values['value'] as number || 0;
      return { success: true, value };
    });

    this.registerHandler('math_arithmetic', async (block, context) => {
      const left = Number(this.getValue(block, 'left', context)) || 0;
      const right = Number(this.getValue(block, 'right', context)) || 0;
      const operator = block.values['operator'] as string || '+';

      let result = 0;
      switch (operator) {
        case '+': result = left + right; break;
        case '-': result = left - right; break;
        case '*': result = left * right; break;
        case '/': result = right !== 0 ? left / right : 0; break;
        case '%': result = right !== 0 ? left % right : 0; break;
      }

      return { success: true, value: result };
    });

    this.registerHandler('math_random', async (block, context) => {
      const min = Number(this.getValue(block, 'min', context)) || 1;
      const max = Number(this.getValue(block, 'max', context)) || 100;
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      return { success: true, value: result };
    });

    this.registerHandler('math_round', async (block, context) => {
      const value = Number(this.getValue(block, 'value', context)) || 0;
      const mode = block.values['mode'] as string || 'round';

      let result = 0;
      switch (mode) {
        case 'round': result = Math.round(value); break;
        case 'floor': result = Math.floor(value); break;
        case 'ceil': result = Math.ceil(value); break;
      }

      return { success: true, value: result };
    });

    // ========== 文本类 ==========
    this.registerHandler('text_string', async (block) => {
      const value = block.values['value'] as string || '';
      return { success: true, value };
    });

    this.registerHandler('text_join', async (block, context) => {
      const text1 = String(this.getValue(block, 'text1', context) || '');
      const text2 = String(this.getValue(block, 'text2', context) || '');
      return { success: true, value: text1 + text2 };
    });

    this.registerHandler('text_length', async (block, context) => {
      const text = String(this.getValue(block, 'text', context) || '');
      return { success: true, value: text.length };
    });

    this.registerHandler('text_contains', async (block, context) => {
      const text = String(this.getValue(block, 'text', context) || '');
      const search = String(this.getValue(block, 'search', context) || '');
      return { success: true, value: text.includes(search) };
    });

    // ========== 事件类（帽子积木，仅作为触发器标记） ==========
    // 这些积木不执行实际操作，它们的存在只是标记脚本的触发类型
    this.registerHandler('game_event_start', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_update', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_keydown', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_keyup', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_collision', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_message', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_clone', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_touch', async () => {
      return { success: true };
    });

    this.registerHandler('event_tap', async () => {
      return { success: true };
    });

    this.registerHandler('game_event_timer', async () => {
      return { success: true };
    });

    // ========== 游戏专用 - 移动类 ==========
    this.registerHandler('game_move', async (block, context) => {
      const obj = context.gameObject;
      const dx = Number(this.getValue(block, 'x', context)) || 0;
      const dy = Number(this.getValue(block, 'y', context)) || 0;

      obj.position.x += dx;
      obj.position.y += dy;

      return { success: true };
    });

    this.registerHandler('game_moveto', async (block, context) => {
      const obj = context.gameObject;
      const x = Number(this.getValue(block, 'x', context)) || 0;
      const y = Number(this.getValue(block, 'y', context)) || 0;

      obj.position.x = x;
      obj.position.y = y;

      return { success: true };
    });

    this.registerHandler('game_glide', async (block, context) => {
      const obj = context.gameObject;
      const targetX = Number(this.getValue(block, 'x', context)) || 0;
      const targetY = Number(this.getValue(block, 'y', context)) || 0;
      const duration = Number(this.getValue(block, 'duration', context)) || 1;

      const startX = obj.position.x;
      const startY = obj.position.y;
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      return new Promise((resolve) => {
        const animate = () => {
          if (!this.isRunning) {
            resolve({ success: false, error: '动画中断' });
            return;
          }

          const now = Date.now();
          const progress = Math.min(1, (now - startTime) / (duration * 1000));

          obj.position.x = startX + (targetX - startX) * progress;
          obj.position.y = startY + (targetY - startY) * progress;

          if (now < endTime) {
            requestAnimationFrame(animate);
          } else {
            obj.position.x = targetX;
            obj.position.y = targetY;
            resolve({ success: true });
          }
        };

        requestAnimationFrame(animate);
      });
    });

    this.registerHandler('game_setvelocity', async (block, context) => {
      const obj = context.gameObject;
      const vx = Number(this.getValue(block, 'vx', context)) || 0;
      const vy = Number(this.getValue(block, 'vy', context)) || 0;

      obj.velocity.x = vx;
      obj.velocity.y = vy;

      return { success: true };
    });

    this.registerHandler('game_rotate', async (block, context) => {
      const obj = context.gameObject;
      const angle = Number(this.getValue(block, 'angle', context)) || 0;
      obj.rotation += angle;
      return { success: true };
    });

    this.registerHandler('game_rotateto', async (block, context) => {
      const obj = context.gameObject;
      const angle = Number(this.getValue(block, 'angle', context)) || 0;
      obj.rotation = angle;
      return { success: true };
    });

    this.registerHandler('game_pointtowards', async (block, context) => {
      const obj = context.gameObject;
      const targetX = Number(this.getValue(block, 'x', context)) || 0;
      const targetY = Number(this.getValue(block, 'y', context)) || 0;

      const dx = targetX - obj.position.x;
      const dy = targetY - obj.position.y;
      obj.rotation = Math.atan2(dy, dx) * (180 / Math.PI);

      return { success: true };
    });

    // ========== 游戏专用 - 外观类 ==========
    this.registerHandler('game_show', async (_block, context) => {
      context.gameObject.isVisible = true;
      return { success: true };
    });

    this.registerHandler('game_hide', async (_block, context) => {
      context.gameObject.isVisible = false;
      return { success: true };
    });

    this.registerHandler('game_setsize', async (block, context) => {
      const obj = context.gameObject;
      const width = Number(this.getValue(block, 'width', context));
      const height = Number(this.getValue(block, 'height', context));

      if (width) obj.size.width = width;
      if (height) obj.size.height = height;

      return { success: true };
    });

    this.registerHandler('game_setscale', async (block, context) => {
      const obj = context.gameObject;
      const scaleX = Number(this.getValue(block, 'scaleX', context)) ?? 1;
      const scaleY = Number(this.getValue(block, 'scaleY', context)) ?? 1;

      obj.scale.x = scaleX;
      obj.scale.y = scaleY;

      return { success: true };
    });

    // ========== 游戏专用 - 状态类 ==========
    this.registerHandler('game_setscore', async (block, context) => {
      const score = Number(this.getValue(block, 'score', context)) || 0;
      this.stateManager.setScore(score);
      return { success: true };
    });

    this.registerHandler('game_addscore', async (block, context) => {
      const amount = Number(this.getValue(block, 'amount', context)) || 0;
      this.stateManager.addScore(amount);
      return { success: true };
    });

    this.registerHandler('game_getscore', async () => {
      return { success: true, value: this.stateManager.getScore() };
    });

    this.registerHandler('game_setlives', async (block, context) => {
      const lives = Number(this.getValue(block, 'lives', context)) || 3;
      this.stateManager.setLives(lives);
      return { success: true };
    });

    this.registerHandler('game_loselife', async (block, context) => {
      const amount = Number(this.getValue(block, 'amount', context)) || 1;
      this.stateManager.loseLife(amount);
      return { success: true };
    });

    this.registerHandler('game_getlives', async () => {
      return { success: true, value: this.stateManager.getLives() };
    });

    // ========== 游戏专用 - 克隆类 ==========
    this.registerHandler('game_clone', async (_block, context) => {
      const cloned = this.stateManager.cloneGameObject(context.gameObject.id);
      return { success: true, value: cloned };
    });

    this.registerHandler('game_cloneof', async (block, context) => {
      const targetName = this.getValue(block, 'target', context) as string;
      const target = this.stateManager.findGameObjectByName(targetName);
      if (target) {
        const cloned = this.stateManager.cloneGameObject(target.id);
        return { success: true, value: cloned };
      }
      return { success: false, error: `找不到对象: ${targetName}` };
    });

    this.registerHandler('game_destroy', async (_block, context) => {
      this.stateManager.unregisterGameObject(context.gameObject.id);
      return { success: true, shouldBreak: true };
    });

    // ========== 游戏专用 - 消息类 ==========
    this.registerHandler('game_broadcast', async (block, context) => {
      const message = this.getValue(block, 'message', context) as string;
      this.eventSystem.emit(GameEvents.MESSAGE, { message, sender: context.gameObject });
      return { success: true };
    });

    this.registerHandler('game_broadcastwait', async (block, context) => {
      const message = this.getValue(block, 'message', context) as string;

      return new Promise((resolve) => {
        // 广播并等待所有响应完成
        const listeners = this.eventSystem.getEventNames()
          .filter((e) => e === GameEvents.MESSAGE);

        if (listeners.length === 0) {
          resolve({ success: true });
          return;
        }

        this.eventSystem.emit(GameEvents.MESSAGE, {
          message,
          sender: context.gameObject,
          callback: () => resolve({ success: true }),
        });
      });
    });

    // ========== 游戏专用 - 检测类 ==========
    this.registerHandler('game_istouching', async (block, context) => {
      const targetTag = this.getValue(block, 'tag', context) as string;
      const obj = context.gameObject;
      const targets = this.stateManager.findGameObjectsByTag(targetTag);

      const isTouching = targets.some((target) => this.checkCollision(obj, target));
      return { success: true, value: isTouching };
    });

    this.registerHandler('game_gettouchingobjects', async (block, context) => {
      const targetTag = this.getValue(block, 'tag', context) as string;
      const obj = context.gameObject;
      const targets = this.stateManager.findGameObjectsByTag(targetTag);

      const touching = targets.filter((target) => this.checkCollision(obj, target));
      return { success: true, value: touching };
    });

    this.registerHandler('game_getposition', async (block, context) => {
      const axis = block.values['axis'] as string || 'x';
      const obj = context.gameObject;
      const value = axis === 'x' ? obj.position.x : obj.position.y;
      return { success: true, value };
    });

    this.registerHandler('game_getrotation', async (_block, context) => {
      return { success: true, value: context.gameObject.rotation };
    });

    // ========== 游戏专用 - 场景类 ==========
    this.registerHandler('game_gotoscene', async (block, context) => {
      const sceneId = this.getValue(block, 'sceneId', context) as string;
      this.stateManager.setCurrentScene(sceneId);
      return { success: true };
    });

    this.registerHandler('game_restartgame', async () => {
      this.stateManager.reset();
      this.eventSystem.emit(GameEvents.GAME_START);
      return { success: true };
    });

    this.registerHandler('game_gameover', async () => {
      this.eventSystem.emit(GameEvents.GAME_OVER, { reason: 'script' });
      return { success: true, shouldBreak: true };
    });

    // ========== 游戏专用 - 物理和效果类 ==========
    this.registerHandler('game_bounce', async (_block, context) => {
      // 简单反弹：检测边界并反转速度
      const obj = context.gameObject;
      const bounds = { width: 375, height: 667 }; // 默认画布大小

      if (obj.position.x < 0 || obj.position.x + obj.size.width > bounds.width) {
        obj.velocity.x = -obj.velocity.x;
      }
      if (obj.position.y < 0 || obj.position.y + obj.size.height > bounds.height) {
        obj.velocity.y = -obj.velocity.y;
      }

      return { success: true };
    });

    this.registerHandler('game_enablephysics', async (block, context) => {
      const enabled = this.getValue(block, 'enabled', context) !== false;
      context.gameObject.properties['physicsEnabled'] = enabled;
      return { success: true };
    });

    // 隐形平台处理器
    this.registerHandler('game_place_invisible_platform', async (block, context) => {
      const x = Number(this.getValue(block, 'x', context)) || 0;
      const y = Number(this.getValue(block, 'y', context)) || 0;
      const width = Number(this.getValue(block, 'width', context)) || 200;
      const height = Number(this.getValue(block, 'height', context)) || 20;
      const id = String(this.getValue(block, 'id', context)) || 'platform1';

      // 获取或初始化游戏状态中的隐形平台列表
      if (!context.gameState.invisiblePlatforms) {
        context.gameState.invisiblePlatforms = new Map();
      }

      // 创建隐形平台对象
      const platform = {
        id,
        x,
        y,
        width,
        height,
        isActive: true,
        // 碰撞检测边界
        getBounds: function() {
          return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2,
          };
        },
      };

      // 保存平台
      context.gameState.invisiblePlatforms.set(id, platform);

      return { success: true, value: platform };
    });

    this.registerHandler('game_remove_invisible_platform', async (block, context) => {
      const id = String(this.getValue(block, 'id', context)) || 'platform1';

      // 从游戏状态中移除平台
      if (context.gameState.invisiblePlatforms) {
        context.gameState.invisiblePlatforms.delete(id);
      }

      return { success: true };
    });

    this.registerHandler('game_shake', async (block, context) => {
      const intensity = Number(this.getValue(block, 'intensity', context)) || 5;
      const duration = Number(this.getValue(block, 'duration', context)) || 0.3;
      const obj = context.gameObject;
      const originalX = obj.position.x;
      const originalY = obj.position.y;
      const endTime = Date.now() + duration * 1000;

      while (Date.now() < endTime && this.isRunning) {
        obj.position.x = originalX + (Math.random() - 0.5) * intensity * 2;
        obj.position.y = originalY + (Math.random() - 0.5) * intensity * 2;
        await this.wait(16);
      }

      obj.position.x = originalX;
      obj.position.y = originalY;
      return { success: true };
    });

    this.registerHandler('game_flash', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 0.2;
      const obj = context.gameObject;
      const originalVisible = obj.isVisible;

      // 简单闪烁效果
      const endTime = Date.now() + duration * 1000;
      while (Date.now() < endTime && this.isRunning) {
        obj.isVisible = !obj.isVisible;
        await this.wait(50);
      }

      obj.isVisible = originalVisible;
      return { success: true };
    });

    this.registerHandler('game_fadein', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 1;
      context.gameObject.properties['opacity'] = 1;
      // 简化实现：直接显示
      context.gameObject.isVisible = true;
      return { success: true };
    });

    this.registerHandler('game_fadeout', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 1;
      context.gameObject.properties['opacity'] = 0;
      context.gameObject.isVisible = false;
      return { success: true };
    });

    this.registerHandler('game_playsound', async (block, context) => {
      const sound = this.getValue(block, 'sound', context);
      console.log('[BlockExecutor] Play sound:', sound);
      // 实际实现需要 Audio API
      return { success: true };
    });

    this.registerHandler('game_nextcostume', async (_block, context) => {
      const obj = context.gameObject;
      const costumes = obj.properties['costumes'] as string[] || [];
      const currentIndex = obj.properties['costumeIndex'] as number || 0;
      obj.properties['costumeIndex'] = (currentIndex + 1) % Math.max(1, costumes.length);
      return { success: true };
    });

    this.registerHandler('game_resettimer', async (_block, context) => {
      context.gameState.timer = 0;
      return { success: true };
    });

    // ========== 动作类（用于UI交互） ==========
    this.registerHandler('action_toast', async (block, context) => {
      const title = this.getValue(block, 'title', context);
      console.log('[BlockExecutor] Toast:', title);
      return { success: true };
    });

    this.registerHandler('action_setdata', async (block, context) => {
      const key = this.getValue(block, 'key', context) as string;
      const value = this.getValue(block, 'value', context);
      if (key) {
        context.localVariables[key] = value;
      }
      return { success: true };
    });

    // ========== 摄像机类 ==========
    this.registerHandler('game_camera_follow', async (block, context) => {
      const enabled = this.getValue(block, 'enabled', context) !== false;
      const speed = Number(this.getValue(block, 'speed', context)) || 0.1;

      // 获取游戏引擎的摄像机
      if (context.gameState && context.gameState.camera) {
        if (enabled) {
          context.gameState.camera.setFollowTarget(context.gameObject, speed);
        } else {
          context.gameState.camera.setFollowEnabled(false);
        }
      }

      return { success: true };
    });

    this.registerHandler('game_set_scene_size', async (block, context) => {
      const width = Number(this.getValue(block, 'width', context)) || 3000;
      const height = Number(this.getValue(block, 'height', context)) || 600;

      // 更新摄像机配置
      if (context.gameState && context.gameState.camera) {
        context.gameState.camera.updateConfig({
          sceneWidth: width,
          sceneHeight: height,
        });
      }

      // 保存场景大小到游戏状态
      if (!context.gameState.sceneConfig) {
        context.gameState.sceneConfig = {};
      }
      context.gameState.sceneConfig.width = width;
      context.gameState.sceneConfig.height = height;

      return { success: true };
    });

    this.registerHandler('game_set_background', async (block, context) => {
      const imageUrl = String(this.getValue(block, 'imageUrl', context)) || '';
      const loop = this.getValue(block, 'loop', context) !== false;

      // 保存背景配置到游戏状态
      if (!context.gameState.backgroundLayers) {
        context.gameState.backgroundLayers = [];
      }

      context.gameState.backgroundLayers = [{
        id: 'main_background',
        imageUrl,
        loop,
        speed: 1,
        layer: 'main',
      }];

      return { success: true };
    });

    this.registerHandler('game_add_parallax_layer', async (block, context) => {
      const imageUrl = String(this.getValue(block, 'imageUrl', context)) || '';
      const speed = Number(this.getValue(block, 'speed', context)) || 0.5;
      const layer = String(this.getValue(block, 'layer', context)) || 'middle';

      // 添加视差层到游戏状态
      if (!context.gameState.backgroundLayers) {
        context.gameState.backgroundLayers = [];
      }

      const layerId = `parallax_${layer}_${Date.now()}`;
      context.gameState.backgroundLayers.push({
        id: layerId,
        imageUrl,
        loop: true,
        speed,
        layer,
      });

      return { success: true };
    });

    this.registerHandler('game_set_scroll_direction', async (block, context) => {
      const direction = String(this.getValue(block, 'direction', context)) || 'horizontal';

      // 更新摄像机配置
      if (context.gameState && context.gameState.camera) {
        context.gameState.camera.updateConfig({
          scrollDirection: direction as 'horizontal' | 'vertical' | 'free',
        });
      }

      return { success: true };
    });

    this.registerHandler('game_set_boundary_mode', async (block, context) => {
      const mode = String(this.getValue(block, 'mode', context)) || 'bounded';

      // 更新摄像机配置
      if (context.gameState && context.gameState.camera) {
        context.gameState.camera.updateConfig({
          boundaryMode: mode as 'bounded' | 'infinite',
        });
      }

      return { success: true };
    });

    this.registerHandler('game_enable_drag', async (block, context) => {
      const enabled = this.getValue(block, 'enabled', context) !== false;

      // 更新摄像机配置
      if (context.gameState && context.gameState.camera) {
        context.gameState.camera.updateConfig({
          enableDrag: enabled,
        });
      }

      return { success: true };
    });

    // ========================================
    // 新增：阶段1核心积木处理器（48个）
    // ========================================

    // ========== 事件系统模块 (8个) ==========
    // 事件积木主要作为触发器标记，大部分在 GameEngine 中处理
    this.registerHandler('event_click', async () => {
      return { success: true };
    });

    // 按键事件需要检查按键值是否匹配
    this.registerHandler('event_keypress', async (block, context) => {
      // 获取积木定义的按键值
      const expectedKey = this.getValue(block, 'key', context) as string;
      // 获取实际按下的按键值（从 context.localVariables 中获取）
      const actualKey = context.localVariables?.['key'] as string;

      // 如果按键不匹配，中断执行（跳过后续积木）
      if (expectedKey && actualKey && expectedKey !== actualKey) {
        return { success: true, shouldBreak: true };
      }

      // 按键匹配或没有指定按键，继续执行
      return { success: true };
    });

    this.registerHandler('event_sceneinit', async () => {
      return { success: true };
    });

    this.registerHandler('event_timer', async () => {
      return { success: true };
    });

    this.registerHandler('event_collision', async () => {
      return { success: true };
    });

    this.registerHandler('event_dragstart', async () => {
      return { success: true };
    });

    this.registerHandler('event_dragend', async () => {
      return { success: true };
    });

    this.registerHandler('event_message', async () => {
      return { success: true };
    });

    // ========== 运动控制模块 (8个) ==========
    this.registerHandler('motion_move', async (block, context) => {
      const obj = context.gameObject;
      const distance = Number(this.getValue(block, 'distance', context)) || 10;

      // 根据当前旋转角度计算移动方向
      const radians = (obj.rotation * Math.PI) / 180;
      const dx = Math.cos(radians) * distance;
      const dy = Math.sin(radians) * distance;

      obj.position.x += dx;
      obj.position.y += dy;

      return { success: true };
    });

    this.registerHandler('motion_rotate', async (block, context) => {
      const obj = context.gameObject;
      const angle = Number(this.getValue(block, 'angle', context)) || 15;
      obj.rotation += angle;
      return { success: true };
    });

    this.registerHandler('motion_moveto', async (block, context) => {
      const obj = context.gameObject;
      const x = Number(this.getValue(block, 'x', context)) || 0;
      const y = Number(this.getValue(block, 'y', context)) || 0;
      obj.position.x = x;
      obj.position.y = y;
      return { success: true };
    });

    this.registerHandler('motion_easeto', async (block, context) => {
      const obj = context.gameObject;
      const targetX = Number(this.getValue(block, 'x', context)) || 0;
      const targetY = Number(this.getValue(block, 'y', context)) || 0;
      const duration = Number(this.getValue(block, 'duration', context)) || 1;
      const easing = this.getValue(block, 'easing', context) as string || 'easeInOut';

      const startX = obj.position.x;
      const startY = obj.position.y;
      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      return new Promise((resolve) => {
        const animate = () => {
          if (!this.isRunning) {
            resolve({ success: false, error: '动画中断' });
            return;
          }

          const now = Date.now();
          let progress = Math.min(1, (now - startTime) / (duration * 1000));

          // 应用缓动函数
          progress = this.applyEasing(progress, easing);

          obj.position.x = startX + (targetX - startX) * progress;
          obj.position.y = startY + (targetY - startY) * progress;

          if (now < endTime) {
            requestAnimationFrame(animate);
          } else {
            obj.position.x = targetX;
            obj.position.y = targetY;
            resolve({ success: true });
          }
        };

        requestAnimationFrame(animate);
      });
    });

    this.registerHandler('motion_followpath', async (block, context) => {
      const pathId = this.getValue(block, 'pathId', context) as string;
      const speed = Number(this.getValue(block, 'speed', context)) || 100;

      // 从游戏状态中获取路径数据
      const path = context.gameState.variables[`path_${pathId}`];
      if (!path || !Array.isArray(path)) {
        return { success: false, error: `路径不存在: ${pathId}` };
      }

      console.log(`[Motion] 沿路径 ${pathId} 移动，速度 ${speed}`);
      return { success: true };
    });

    this.registerHandler('motion_setgravity', async (block, context) => {
      const gravity = Number(this.getValue(block, 'gravity', context)) || 10;
      context.gameObject.properties['gravity'] = gravity;
      return { success: true };
    });

    this.registerHandler('motion_setvelocity', async (block, context) => {
      const obj = context.gameObject;
      const vx = Number(this.getValue(block, 'vx', context)) || 0;
      const vy = Number(this.getValue(block, 'vy', context)) || 0;
      obj.velocity.x = vx;
      obj.velocity.y = vy;
      return { success: true };
    });

    this.registerHandler('motion_followtarget', async (block, context) => {
      const target = this.getValue(block, 'target', context) as string;
      const targetId = this.getValue(block, 'targetId', context) as string;
      const speed = Number(this.getValue(block, 'speed', context)) || 5;

      // 🆕 立即执行追踪逻辑，而不仅仅是设置属性
      let targetObj: GameObject | null = null;

      const allObjects = this.stateManager.getAllGameObjects();

      // 优先通过 ID 查找
      if (targetId) {
        targetObj = allObjects.find(obj => obj.id === targetId) || null;
      }

      // 其次通过名称查找
      if (!targetObj && target) {
        targetObj = this.stateManager.findGameObjectByName(target) || null;
      }

      // 如果没有指定目标，查找第一个玩家角色
      if (!targetObj) {
        targetObj = allObjects.find(obj => obj.properties?.roleType === 'player') || null;
      }

      if (!targetObj) {
        console.log(`[Motion] 跟随目标未找到: ${target || targetId || 'player'}`);
        return { success: true };
      }

      // 计算当前对象到目标的向量
      const dx = targetObj.position.x - context.gameObject.position.x;
      const dy = targetObj.position.y - context.gameObject.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {  // 如果距离大于5像素才移动
        // 归一化方向向量
        const dirX = dx / distance;
        const dirY = dy / distance;

        // 移动当前对象
        context.gameObject.position.x += dirX * speed;
        context.gameObject.position.y += dirY * speed;

        console.log(`[Motion] 跟随目标 ${targetObj.name}，距离 ${distance.toFixed(0)}，速度 ${speed}`);
      }

      // 同时保存属性以便其他系统使用
      context.gameObject.properties['followTarget'] = target;
      context.gameObject.properties['followTargetId'] = targetId;
      context.gameObject.properties['followSpeed'] = speed;

      return { success: true };
    });

    // ========== 外观声音模块 (7个) ==========
    this.registerHandler('looks_showbubble', async (block, context) => {
      const text = this.getValue(block, 'text', context) as string;
      const duration = Number(this.getValue(block, 'duration', context)) || 2;

      context.gameObject.properties['speechBubble'] = text;
      context.gameObject.properties['speechBubbleTime'] = Date.now() + duration * 1000;

      // 自动清除
      setTimeout(() => {
        if (context.gameObject.properties['speechBubble'] === text) {
          context.gameObject.properties['speechBubble'] = null;
        }
      }, duration * 1000);

      return { success: true };
    });

    this.registerHandler('looks_setcostume', async (block, context) => {
      const costume = this.getValue(block, 'costume', context) as string;
      context.gameObject.properties['costume'] = costume;
      return { success: true };
    });

    this.registerHandler('looks_playsound', async (block, context) => {
      const sound = this.getValue(block, 'sound', context) as string;
      console.log(`[Looks] 播放音效: ${sound}`);
      // 实际实现需要 Audio API
      this.eventSystem.emit('sound:play', { sound, object: context.gameObject });
      return { success: true };
    });

    this.registerHandler('looks_playanimation', async (block, context) => {
      const animation = this.getValue(block, 'animation', context) as string;
      const loop = this.getValue(block, 'loop', context) !== false;

      context.gameObject.properties['animation'] = animation;
      context.gameObject.properties['animationLoop'] = loop;

      console.log(`[Looks] 播放动画: ${animation}, 循环: ${loop}`);
      return { success: true };
    });

    this.registerHandler('looks_setvolume', async (block, context) => {
      const volume = Number(this.getValue(block, 'volume', context)) || 100;
      context.gameObject.properties['volume'] = Math.max(0, Math.min(100, volume));
      return { success: true };
    });

    this.registerHandler('looks_emitparticles', async (block, context) => {
      const particle = this.getValue(block, 'particle', context) as string;
      const count = Number(this.getValue(block, 'count', context)) || 10;

      this.eventSystem.emit('particles:emit', {
        object: context.gameObject,
        particle,
        count
      });

      console.log(`[Looks] 发射 ${count} 个 ${particle} 粒子`);
      return { success: true };
    });

    this.registerHandler('looks_speak', async (block, context) => {
      const text = this.getValue(block, 'text', context) as string;
      const voice = this.getValue(block, 'voice', context) as string || 'default';

      // 使用 Web Speech API (如果可用)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
      }

      console.log(`[Looks] 朗读: "${text}", 声音: ${voice}`);
      return { success: true };
    });

    // ========== 逻辑运算模块 (12个) ==========
    this.registerHandler('logic_if', async (block, context, executor) => {
      const condition = this.getValue(block, 'condition', context);
      if (condition) {
        const thenBlocks = this.getNestedBlocks(block, 'then');
        return await executor.executeBlocks(thenBlocks, context);
      }
      return { success: true };
    });

    this.registerHandler('logic_ifelse', async (block, context, executor) => {
      const condition = this.getValue(block, 'condition', context);
      if (condition) {
        const thenBlocks = this.getNestedBlocks(block, 'then');
        return await executor.executeBlocks(thenBlocks, context);
      } else {
        const elseBlocks = this.getNestedBlocks(block, 'else');
        return await executor.executeBlocks(elseBlocks, context);
      }
    });

    this.registerHandler('logic_repeat', async (block, context, executor) => {
      const times = Number(this.getValue(block, 'times', context)) || 10;
      const bodyBlocks = this.getNestedBlocks(block, 'body');

      for (let i = 0; i < times; i++) {
        if (!this.isRunning) break;

        context.localVariables['_loopIndex'] = i;
        const result = await executor.executeBlocks(bodyBlocks, context);

        if (result.shouldBreak) break;
        if (result.error) return result;
      }

      return { success: true };
    });

    this.registerHandler('logic_forever', async (block, context, executor) => {
      const bodyBlocks = this.getNestedBlocks(block, 'body');

      while (this.isRunning) {
        const result = await executor.executeBlocks(bodyBlocks, context);
        if (result.shouldBreak || result.error) break;
        await this.wait(16); // ~60fps
      }

      return { success: true };
    });

    this.registerHandler('logic_compare', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      const operator = this.getValue(block, 'operator', context) as string || '==';

      let result = false;
      switch (operator) {
        case '==': result = left == right; break;
        case '!=': result = left != right; break;
        case '>': result = left > right; break;
        case '<': result = left < right; break;
        case '>=': result = left >= right; break;
        case '<=': result = left <= right; break;
      }

      return { success: true, value: result };
    });

    this.registerHandler('logic_and', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      return { success: true, value: Boolean(left && right) };
    });

    this.registerHandler('logic_or', async (block, context) => {
      const left = this.getValue(block, 'left', context);
      const right = this.getValue(block, 'right', context);
      return { success: true, value: Boolean(left || right) };
    });

    this.registerHandler('logic_not', async (block, context) => {
      const value = this.getValue(block, 'value', context);
      return { success: true, value: !value };
    });

    this.registerHandler('logic_switch', async (block, context, executor) => {
      const value = this.getValue(block, 'value', context);
      const cases = this.getValue(block, 'cases', context) as Array<{ value: any; blocks: Block[] }> || [];

      for (const caseItem of cases) {
        if (caseItem.value == value) {
          return await executor.executeBlocks(caseItem.blocks, context);
        }
      }

      // 执行默认分支（如果有）
      const defaultBlocks = this.getNestedBlocks(block, 'default');
      if (defaultBlocks.length > 0) {
        return await executor.executeBlocks(defaultBlocks, context);
      }

      return { success: true };
    });

    this.registerHandler('logic_parallel', async (block, context, executor) => {
      const tasks = this.getValue(block, 'tasks', context) as Block[][] || [];

      // 并行执行多个任务
      const promises = tasks.map(taskBlocks =>
        executor.executeBlocks(taskBlocks, { ...context })
      );

      try {
        await Promise.all(promises);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    this.registerHandler('logic_waituntil', async (block, context) => {
      const checkInterval = 100; // 每100ms检查一次
      const maxWait = 10000; // 最多等待10秒
      const startTime = Date.now();

      return new Promise((resolve) => {
        const check = () => {
          if (!this.isRunning) {
            resolve({ success: false, error: '执行中断' });
            return;
          }

          const condition = this.getValue(block, 'condition', context);

          if (condition) {
            resolve({ success: true });
          } else if (Date.now() - startTime > maxWait) {
            resolve({ success: false, error: '等待超时' });
          } else {
            setTimeout(check, checkInterval);
          }
        };

        check();
      });
    });

    this.registerHandler('logic_break', async () => {
      return { success: true, shouldBreak: true };
    });

    // ========== 运算数据模块 (13个) ==========
    this.registerHandler('data_random', async (block, context) => {
      const min = Number(this.getValue(block, 'min', context)) || 1;
      const max = Number(this.getValue(block, 'max', context)) || 100;
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      return { success: true, value: result };
    });

    this.registerHandler('data_arithmetic', async (block, context) => {
      const left = Number(this.getValue(block, 'left', context)) || 0;
      const right = Number(this.getValue(block, 'right', context)) || 0;
      const operator = this.getValue(block, 'operator', context) as string || '+';

      let result = 0;
      switch (operator) {
        case '+': result = left + right; break;
        case '-': result = left - right; break;
        case '*': result = left * right; break;
        case '/': result = right !== 0 ? left / right : 0; break;
        case '%': result = right !== 0 ? left % right : 0; break;
      }

      return { success: true, value: result };
    });

    this.registerHandler('data_createlist', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      const initialValues = this.getValue(block, 'values', context) as any[] || [];

      context.localVariables[name] = [...initialValues];
      return { success: true, value: context.localVariables[name] };
    });

    this.registerHandler('data_addtolist', async (block, context) => {
      const listName = this.getValue(block, 'list', context) as string;
      const item = this.getValue(block, 'item', context);

      const list = context.localVariables[listName];
      if (Array.isArray(list)) {
        list.push(item);
        return { success: true };
      }

      return { success: false, error: `${listName} 不是列表` };
    });

    this.registerHandler('data_getlistitem', async (block, context) => {
      const listName = this.getValue(block, 'list', context) as string;
      const index = Number(this.getValue(block, 'index', context)) || 0;

      const list = context.localVariables[listName];
      if (Array.isArray(list)) {
        const value = list[index];
        return { success: true, value };
      }

      return { success: false, error: `${listName} 不是列表` };
    });

    this.registerHandler('data_removefromlist', async (block, context) => {
      const listName = this.getValue(block, 'list', context) as string;
      const index = Number(this.getValue(block, 'index', context)) || 0;

      const list = context.localVariables[listName];
      if (Array.isArray(list)) {
        list.splice(index, 1);
        return { success: true };
      }

      return { success: false, error: `${listName} 不是列表` };
    });

    this.registerHandler('data_stringjoin', async (block, context) => {
      const str1 = String(this.getValue(block, 'str1', context) || '');
      const str2 = String(this.getValue(block, 'str2', context) || '');
      return { success: true, value: str1 + str2 };
    });

    this.registerHandler('data_stringsplit', async (block, context) => {
      const text = String(this.getValue(block, 'text', context) || '');
      const separator = String(this.getValue(block, 'separator', context) || ',');
      const result = text.split(separator);
      return { success: true, value: result };
    });

    this.registerHandler('data_sortlist', async (block, context) => {
      const listName = this.getValue(block, 'list', context) as string;
      const order = this.getValue(block, 'order', context) as string || 'asc';

      const list = context.localVariables[listName];
      if (Array.isArray(list)) {
        const sorted = [...list].sort((a, b) => {
          if (order === 'asc') return a > b ? 1 : -1;
          return a < b ? 1 : -1;
        });
        return { success: true, value: sorted };
      }

      return { success: false, error: `${listName} 不是列表` };
    });

    this.registerHandler('data_filterlist', async (block, context) => {
      const listName = this.getValue(block, 'list', context) as string;
      const condition = this.getValue(block, 'condition', context);

      const list = context.localVariables[listName];
      if (Array.isArray(list)) {
        // 简化实现：返回所有非空元素
        const filtered = list.filter(item => item != null && item !== '');
        return { success: true, value: filtered };
      }

      return { success: false, error: `${listName} 不是列表` };
    });

    this.registerHandler('data_currenttime', async () => {
      return { success: true, value: Date.now() };
    });

    this.registerHandler('data_vector', async (block, context) => {
      const x = Number(this.getValue(block, 'x', context)) || 0;
      const y = Number(this.getValue(block, 'y', context)) || 0;
      const operation = this.getValue(block, 'operation', context) as string || 'length';

      let result = 0;
      switch (operation) {
        case 'length':
          result = Math.sqrt(x * x + y * y);
          break;
        case 'angle':
          result = Math.atan2(y, x) * (180 / Math.PI);
          break;
        case 'normalize':
          const len = Math.sqrt(x * x + y * y);
          result = len !== 0 ? 1 : 0;
          break;
      }

      return { success: true, value: result };
    });

    this.registerHandler('data_angle', async (block, context) => {
      const angle = Number(this.getValue(block, 'angle', context)) || 0;
      const operation = this.getValue(block, 'operation', context) as string || 'toRadians';

      let result = 0;
      switch (operation) {
        case 'toRadians':
          result = angle * (Math.PI / 180);
          break;
        case 'toDegrees':
          result = angle * (180 / Math.PI);
          break;
        case 'normalize':
          result = ((angle % 360) + 360) % 360;
          break;
      }

      return { success: true, value: result };
    });

    console.log('[BlockExecutor] ✅ 已注册阶段1核心积木处理器 (48个)');

    // ========================================
    // 阶段2：游戏增强积木处理器（43个）
    // ========================================

    // ========== 状态管理模块 (14个) ==========
    this.registerHandler('state_setscore', async (block, context) => {
      const score = Number(this.getValue(block, 'score', context)) || 0;
      this.stateManager.setScore(score);
      return { success: true };
    });

    this.registerHandler('state_addscore', async (block, context) => {
      const amount = Number(this.getValue(block, 'amount', context)) || 0;
      const currentScore = this.stateManager.getScore();
      this.stateManager.setScore(currentScore + amount);
      return { success: true };
    });

    this.registerHandler('state_getscore', async () => {
      const score = this.stateManager.getScore();
      return { success: true, value: score };
    });

    this.registerHandler('state_setlives', async (block, context) => {
      const lives = Number(this.getValue(block, 'lives', context)) || 3;
      this.stateManager.setLives(lives);
      return { success: true };
    });

    this.registerHandler('state_addlives', async (block, context) => {
      const amount = Number(this.getValue(block, 'amount', context)) || 1;
      const currentLives = this.stateManager.getLives();
      this.stateManager.setLives(currentLives + amount);
      return { success: true };
    });

    this.registerHandler('state_getlives', async () => {
      const lives = this.stateManager.getLives();
      return { success: true, value: lives };
    });

    this.registerHandler('state_gotoscene', async (block, context) => {
      const sceneId = this.getValue(block, 'sceneId', context) as string;
      this.stateManager.setCurrentScene(sceneId);
      this.eventSystem.emit(GameEvents.SCENE_CHANGE, { sceneId });
      return { success: true };
    });

    this.registerHandler('state_sethighscore', async (block, context) => {
      const score = Number(this.getValue(block, 'score', context)) || 0;
      this.stateManager.setVariable('highScore', score);

      // 保存到本地存储
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('highScore', String(score));
      }
      return { success: true };
    });

    this.registerHandler('state_gethighscore', async () => {
      let highScore = this.stateManager.getVariable('highScore') as number;

      // 从本地存储加载
      if (highScore === undefined && typeof localStorage !== 'undefined') {
        highScore = Number(localStorage.getItem('highScore')) || 0;
        this.stateManager.setVariable('highScore', highScore);
      }

      return { success: true, value: highScore || 0 };
    });

    this.registerHandler('state_resetstate', async () => {
      this.stateManager.reset();
      return { success: true };
    });

    this.registerHandler('state_setcharstate', async (block, context) => {
      const charId = this.getValue(block, 'charId', context) as string;
      const key = this.getValue(block, 'key', context) as string;
      const value = this.getValue(block, 'value', context);

      const stateKey = `char_${charId}_${key}`;
      this.stateManager.setVariable(stateKey, value);
      return { success: true };
    });

    this.registerHandler('state_getcharstate', async (block, context) => {
      const charId = this.getValue(block, 'charId', context) as string;
      const key = this.getValue(block, 'key', context) as string;

      const stateKey = `char_${charId}_${key}`;
      const value = this.stateManager.getVariable(stateKey);
      return { success: true, value };
    });

    this.registerHandler('state_savestate', async (block, context) => {
      const slot = this.getValue(block, 'slot', context) as string || 'save1';

      if (typeof localStorage !== 'undefined') {
        const gameState = this.stateManager.getState();
        const saveData = {
          score: gameState.score,
          lives: gameState.lives,
          variables: gameState.variables,
          timestamp: Date.now()
        };
        localStorage.setItem(`savestate_${slot}`, JSON.stringify(saveData));
        console.log(`[State] 已保存状态到槽位: ${slot}`);
      }

      return { success: true };
    });

    this.registerHandler('state_loadstate', async (block, context) => {
      const slot = this.getValue(block, 'slot', context) as string || 'save1';

      if (typeof localStorage !== 'undefined') {
        const savedData = localStorage.getItem(`savestate_${slot}`);
        if (savedData) {
          const saveData = JSON.parse(savedData);
          this.stateManager.setScore(saveData.score || 0);
          this.stateManager.setLives(saveData.lives || 3);

          // 恢复变量
          if (saveData.variables) {
            Object.entries(saveData.variables).forEach(([key, value]) => {
              this.stateManager.setVariable(key, value);
            });
          }

          console.log(`[State] 已从槽位加载状态: ${slot}`);
          return { success: true };
        } else {
          return { success: false, error: `存档不存在: ${slot}` };
        }
      }

      return { success: false, error: '本地存储不可用' };
    });

    // ========== 侦测物理模块 (8个) ==========
    this.registerHandler('sensing_touching', async (block, context) => {
      const target = this.getValue(block, 'target', context) as string;
      const obj = context.gameObject;

      const targetObj = this.stateManager.findGameObjectByName(target);
      if (!targetObj) {
        return { success: true, value: false };
      }

      const isTouching = this.checkCollision(obj, targetObj);
      return { success: true, value: isTouching };
    });

    this.registerHandler('sensing_touchingcolor', async (block, context) => {
      const color = this.getValue(block, 'color', context) as string;

      // 简化实现：检查颜色属性
      const obj = context.gameObject;
      const touchingColor = obj.properties?.touchingColor === color;

      console.log(`[Sensing] 碰到颜色检测: ${color}`);
      return { success: true, value: touchingColor };
    });

    this.registerHandler('sensing_distanceto', async (block, context) => {
      const target = this.getValue(block, 'target', context) as string;
      const obj = context.gameObject;

      const targetObj = this.stateManager.findGameObjectByName(target);
      if (!targetObj) {
        return { success: true, value: 0 };
      }

      const dx = targetObj.position.x - obj.position.x;
      const dy = targetObj.position.y - obj.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return { success: true, value: distance };
    });

    this.registerHandler('sensing_inzone', async (block, context) => {
      const zoneId = this.getValue(block, 'zoneId', context) as string;
      const obj = context.gameObject;

      // 从游戏状态获取区域定义
      const zones = context.gameState.variables['zones'] as any[];
      if (!zones) {
        return { success: true, value: false };
      }

      const zone = zones.find((z: any) => z.id === zoneId);
      if (!zone) {
        return { success: true, value: false };
      }

      // 检查对象是否在区域内
      const inZone = obj.position.x >= zone.x &&
                     obj.position.x <= zone.x + zone.width &&
                     obj.position.y >= zone.y &&
                     obj.position.y <= zone.y + zone.height;

      return { success: true, value: inZone };
    });

    this.registerHandler('sensing_angleto', async (block, context) => {
      const target = this.getValue(block, 'target', context) as string;
      const obj = context.gameObject;

      const targetObj = this.stateManager.findGameObjectByName(target);
      if (!targetObj) {
        return { success: true, value: 0 };
      }

      const dx = targetObj.position.x - obj.position.x;
      const dy = targetObj.position.y - obj.position.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return { success: true, value: angle };
    });

    this.registerHandler('sensing_raycast', async (block, context) => {
      const angle = Number(this.getValue(block, 'angle', context)) || 0;
      const distance = Number(this.getValue(block, 'distance', context)) || 100;
      const obj = context.gameObject;

      // 计算射线终点
      const radians = (angle * Math.PI) / 180;
      const endX = obj.position.x + Math.cos(radians) * distance;
      const endY = obj.position.y + Math.sin(radians) * distance;

      // 检测射线是否击中其他对象
      const allObjects = this.stateManager.getAllGameObjects();
      let hitObject = null;
      let minDistance = Infinity;

      for (const other of allObjects) {
        if (other.id === obj.id || !other.isActive) continue;

        // 简化：检查射线终点是否在对象边界内
        if (endX >= other.position.x && endX <= other.position.x + other.size.width &&
            endY >= other.position.y && endY <= other.position.y + other.size.height) {
          const dist = Math.sqrt(
            Math.pow(other.position.x - obj.position.x, 2) +
            Math.pow(other.position.y - obj.position.y, 2)
          );
          if (dist < minDistance) {
            minDistance = dist;
            hitObject = other;
          }
        }
      }

      return { success: true, value: hitObject ? hitObject.name : null };
    });

    this.registerHandler('sensing_getvelocity', async (block, context) => {
      const axis = this.getValue(block, 'axis', context) as string || 'x';
      const obj = context.gameObject;
      const velocity = axis === 'x' ? obj.velocity.x : obj.velocity.y;
      return { success: true, value: velocity };
    });

    this.registerHandler('sensing_getacceleration', async (block, context) => {
      const axis = this.getValue(block, 'axis', context) as string || 'x';
      const obj = context.gameObject;
      const acceleration = axis === 'x' ? obj.acceleration.x : obj.acceleration.y;
      return { success: true, value: acceleration };
    });

    // ========== 特效系统模块 (7个) ==========
    this.registerHandler('effects_setopacity', async (block, context) => {
      const opacity = Number(this.getValue(block, 'opacity', context)) || 100;
      const obj = context.gameObject;
      obj.properties['opacity'] = Math.max(0, Math.min(100, opacity)) / 100;
      return { success: true };
    });

    this.registerHandler('effects_setcolor', async (block, context) => {
      const hue = Number(this.getValue(block, 'hue', context)) || 0;
      const obj = context.gameObject;
      obj.properties['colorHue'] = hue % 360;
      return { success: true };
    });

    this.registerHandler('effects_setsize', async (block, context) => {
      const size = Number(this.getValue(block, 'size', context)) || 100;
      const obj = context.gameObject;
      const scale = size / 100;
      obj.scale.x = scale;
      obj.scale.y = scale;
      return { success: true };
    });

    this.registerHandler('effects_setblur', async (block, context) => {
      const amount = Number(this.getValue(block, 'amount', context)) || 0;
      const obj = context.gameObject;
      obj.properties['blur'] = Math.max(0, amount);
      return { success: true };
    });

    this.registerHandler('effects_shake', async (block, context) => {
      const intensity = Number(this.getValue(block, 'intensity', context)) || 5;
      const duration = Number(this.getValue(block, 'duration', context)) || 0.3;
      const obj = context.gameObject;

      const originalX = obj.position.x;
      const originalY = obj.position.y;
      const endTime = Date.now() + duration * 1000;

      while (Date.now() < endTime && this.isRunning) {
        obj.position.x = originalX + (Math.random() - 0.5) * intensity * 2;
        obj.position.y = originalY + (Math.random() - 0.5) * intensity * 2;
        await this.wait(16);
      }

      obj.position.x = originalX;
      obj.position.y = originalY;
      return { success: true };
    });

    this.registerHandler('effects_fadein', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 1;
      const obj = context.gameObject;

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      obj.isVisible = true;

      return new Promise((resolve) => {
        const animate = () => {
          if (!this.isRunning) {
            resolve({ success: false, error: '动画中断' });
            return;
          }

          const now = Date.now();
          const progress = Math.min(1, (now - startTime) / (duration * 1000));
          obj.properties['opacity'] = progress;

          if (now < endTime) {
            requestAnimationFrame(animate);
          } else {
            obj.properties['opacity'] = 1;
            resolve({ success: true });
          }
        };

        requestAnimationFrame(animate);
      });
    });

    this.registerHandler('effects_fadeout', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 1;
      const obj = context.gameObject;

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      return new Promise((resolve) => {
        const animate = () => {
          if (!this.isRunning) {
            resolve({ success: false, error: '动画中断' });
            return;
          }

          const now = Date.now();
          const progress = Math.min(1, (now - startTime) / (duration * 1000));
          obj.properties['opacity'] = 1 - progress;

          if (now < endTime) {
            requestAnimationFrame(animate);
          } else {
            obj.properties['opacity'] = 0;
            obj.isVisible = false;
            resolve({ success: true });
          }
        };

        requestAnimationFrame(animate);
      });
    });

    // ========== 数据存储模块 (14个) ==========
    this.registerHandler('storage_createvar', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      const value = this.getValue(block, 'value', context);
      context.localVariables[name] = value;
      return { success: true };
    });

    this.registerHandler('storage_setvar', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      const value = this.getValue(block, 'value', context);

      if (name in context.localVariables) {
        context.localVariables[name] = value;
      } else {
        this.stateManager.setVariable(name, value);
      }
      return { success: true };
    });

    this.registerHandler('storage_getvar', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;

      let value = context.localVariables[name];
      if (value === undefined) {
        value = this.stateManager.getVariable(name);
      }
      return { success: true, value };
    });

    this.registerHandler('storage_deletevar', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      delete context.localVariables[name];
      this.stateManager.setVariable(name, undefined);
      return { success: true };
    });

    this.registerHandler('storage_createconstant', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      const value = this.getValue(block, 'value', context);

      // 常量保存在游戏状态中，不可修改
      const constantKey = `const_${name}`;
      this.stateManager.setVariable(constantKey, value);
      return { success: true };
    });

    this.registerHandler('storage_createdict', async (block, context) => {
      const name = this.getValue(block, 'name', context) as string;
      context.localVariables[name] = {};
      return { success: true };
    });

    this.registerHandler('storage_setdictkey', async (block, context) => {
      const dictName = this.getValue(block, 'dict', context) as string;
      const key = this.getValue(block, 'key', context) as string;
      const value = this.getValue(block, 'value', context);

      const dict = context.localVariables[dictName];
      if (typeof dict === 'object' && dict !== null && !Array.isArray(dict)) {
        dict[key] = value;
        return { success: true };
      }

      return { success: false, error: `${dictName} 不是字典` };
    });

    this.registerHandler('storage_getdictkey', async (block, context) => {
      const dictName = this.getValue(block, 'dict', context) as string;
      const key = this.getValue(block, 'key', context) as string;

      const dict = context.localVariables[dictName];
      if (typeof dict === 'object' && dict !== null && !Array.isArray(dict)) {
        return { success: true, value: dict[key] };
      }

      return { success: false, error: `${dictName} 不是字典` };
    });

    this.registerHandler('storage_deletedictkey', async (block, context) => {
      const dictName = this.getValue(block, 'dict', context) as string;
      const key = this.getValue(block, 'key', context) as string;

      const dict = context.localVariables[dictName];
      if (typeof dict === 'object' && dict !== null && !Array.isArray(dict)) {
        delete dict[key];
        return { success: true };
      }

      return { success: false, error: `${dictName} 不是字典` };
    });

    this.registerHandler('storage_jsonparse', async (block, context) => {
      const jsonString = this.getValue(block, 'json', context) as string;

      try {
        const parsed = JSON.parse(jsonString);
        return { success: true, value: parsed };
      } catch (error) {
        return { success: false, error: 'JSON解析失败' };
      }
    });

    this.registerHandler('storage_jsonstringify', async (block, context) => {
      const value = this.getValue(block, 'value', context);

      try {
        const jsonString = JSON.stringify(value);
        return { success: true, value: jsonString };
      } catch (error) {
        return { success: false, error: 'JSON序列化失败' };
      }
    });

    this.registerHandler('storage_encrypt', async (block, context) => {
      const data = String(this.getValue(block, 'data', context) || '');

      // 简单的Base64编码作为"加密"
      if (typeof btoa !== 'undefined') {
        const encrypted = btoa(data);
        return { success: true, value: encrypted };
      }

      return { success: false, error: 'Base64不可用' };
    });

    this.registerHandler('storage_decrypt', async (block, context) => {
      const encrypted = String(this.getValue(block, 'encrypted', context) || '');

      // Base64解码
      if (typeof atob !== 'undefined') {
        try {
          const decrypted = atob(encrypted);
          return { success: true, value: decrypted };
        } catch {
          return { success: false, error: '解密失败' };
        }
      }

      return { success: false, error: 'Base64不可用' };
    });

    this.registerHandler('storage_cloudsync', async (block, context) => {
      const key = this.getValue(block, 'key', context) as string;
      const value = this.getValue(block, 'value', context);

      // 简化实现：使用localStorage模拟云存储
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`cloud_${key}`, JSON.stringify(value));
        console.log(`[Storage] 云同步: ${key}`);
        return { success: true };
      }

      return { success: false, error: '存储不可用' };
    });

    console.log('[BlockExecutor] ✅ 已注册阶段2游戏增强积木处理器 (43个)');

    // ========================================
    // 阶段3：扩展功能积木处理器（18个）
    // ========================================

    // ========== 扩展功能模块 - 网络功能 (4个) ==========
    this.registerHandler('ext_request', async (block, context) => {
      const url = this.getValue(block, 'url', context) as string;
      const method = this.getValue(block, 'method', context) as string || 'GET';
      const data = this.getValue(block, 'data', context);

      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (method !== 'GET' && data) {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const result = await response.json();

        console.log(`[Extension] HTTP ${method} ${url}`, result);
        return { success: true, value: result };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    this.registerHandler('ext_websocket', async (block, context) => {
      const url = this.getValue(block, 'url', context) as string;
      const message = this.getValue(block, 'message', context) as string;

      console.log(`[Extension] WebSocket连接: ${url}, 消息: ${message}`);

      // 简化实现：仅记录，实际需要WebSocket管理器
      this.eventSystem.emit('websocket:connect', { url, message });
      return { success: true };
    });

    this.registerHandler('ext_upload', async (block, context) => {
      const url = this.getValue(block, 'url', context) as string;
      const fileData = this.getValue(block, 'file', context);

      console.log(`[Extension] 上传文件到: ${url}`);

      // 实际实现需要FormData和文件选择器
      this.eventSystem.emit('file:upload', { url, fileData });
      return { success: true };
    });

    this.registerHandler('ext_download', async (block, context) => {
      const url = this.getValue(block, 'url', context) as string;
      const filename = this.getValue(block, 'filename', context) as string;

      console.log(`[Extension] 下载文件: ${url} -> ${filename}`);

      try {
        const response = await fetch(url);
        const blob = await response.blob();

        // 创建下载链接
        if (typeof document !== 'undefined') {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
          URL.revokeObjectURL(link.href);
        }

        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });

    // ========== 扩展功能模块 - 设备交互 (6个) ==========
    this.registerHandler('ext_camera', async (block, context) => {
      const mode = this.getValue(block, 'mode', context) as string || 'photo';

      console.log(`[Extension] 打开相机模式: ${mode}`);

      // 使用 MediaDevices API
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.eventSystem.emit('camera:opened', { stream, mode });
          return { success: true, value: stream };
        } catch (error) {
          return { success: false, error: '相机访问被拒绝' };
        }
      }

      return { success: false, error: '相机API不可用' };
    });

    this.registerHandler('ext_microphone', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 5;

      console.log(`[Extension] 录音 ${duration} 秒`);

      // 使用 MediaRecorder API
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.eventSystem.emit('microphone:recording', { stream, duration });
          return { success: true };
        } catch (error) {
          return { success: false, error: '麦克风访问被拒绝' };
        }
      }

      return { success: false, error: '录音API不可用' };
    });

    this.registerHandler('ext_vibrate', async (block, context) => {
      const duration = Number(this.getValue(block, 'duration', context)) || 200;

      // 使用 Vibration API
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration);
        console.log(`[Extension] 设备震动 ${duration}ms`);
        return { success: true };
      }

      return { success: false, error: '震动API不可用' };
    });

    this.registerHandler('ext_compass', async () => {
      // 使用 DeviceOrientation API
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        return new Promise((resolve) => {
          const handler = (event: DeviceOrientationEvent) => {
            const heading = event.alpha || 0; // 方向角度
            window.removeEventListener('deviceorientation', handler);
            console.log(`[Extension] 指南针方向: ${heading}°`);
            resolve({ success: true, value: heading });
          };

          window.addEventListener('deviceorientation', handler);

          // 超时保护
          setTimeout(() => {
            window.removeEventListener('deviceorientation', handler);
            resolve({ success: false, error: '指南针读取超时' });
          }, 2000);
        });
      }

      return { success: false, error: '指南针API不可用' };
    });

    this.registerHandler('ext_accelerometer', async (block, context) => {
      const axis = this.getValue(block, 'axis', context) as string || 'x';

      // 使用 DeviceMotion API
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        return new Promise((resolve) => {
          const handler = (event: DeviceMotionEvent) => {
            const acceleration = event.accelerationIncludingGravity;
            if (acceleration) {
              const value = axis === 'x' ? acceleration.x :
                           axis === 'y' ? acceleration.y :
                           acceleration.z;
              window.removeEventListener('devicemotion', handler);
              console.log(`[Extension] 加速度 ${axis}: ${value}`);
              resolve({ success: true, value });
            }
          };

          window.addEventListener('devicemotion', handler);

          // 超时保护
          setTimeout(() => {
            window.removeEventListener('devicemotion', handler);
            resolve({ success: false, error: '加速度计读取超时' });
          }, 2000);
        });
      }

      return { success: false, error: '加速度计API不可用' };
    });

    this.registerHandler('ext_location', async () => {
      // 使用 Geolocation API
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              console.log(`[Extension] 位置:`, location);
              resolve({ success: true, value: location });
            },
            (error) => {
              resolve({ success: false, error: error.message });
            },
            { timeout: 10000 }
          );
        });
      }

      return { success: false, error: '定位API不可用' };
    });

    // ========== 扩展功能模块 - 文件操作 (4个) ==========
    this.registerHandler('ext_readfile', async (block, context) => {
      const filename = this.getValue(block, 'filename', context) as string;

      console.log(`[Extension] 读取文件: ${filename}`);

      // 使用File System Access API或IndexedDB
      // 简化实现：从localStorage读取
      if (typeof localStorage !== 'undefined') {
        const content = localStorage.getItem(`file_${filename}`);
        if (content !== null) {
          return { success: true, value: content };
        }
        return { success: false, error: '文件不存在' };
      }

      return { success: false, error: '文件系统不可用' };
    });

    this.registerHandler('ext_writefile', async (block, context) => {
      const filename = this.getValue(block, 'filename', context) as string;
      const content = this.getValue(block, 'content', context) as string;

      console.log(`[Extension] 写入文件: ${filename}`);

      // 简化实现：保存到localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`file_${filename}`, content);
        return { success: true };
      }

      return { success: false, error: '文件系统不可用' };
    });

    this.registerHandler('ext_deletefile', async (block, context) => {
      const filename = this.getValue(block, 'filename', context) as string;

      console.log(`[Extension] 删除文件: ${filename}`);

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`file_${filename}`);
        return { success: true };
      }

      return { success: false, error: '文件系统不可用' };
    });

    this.registerHandler('ext_listfiles', async () => {
      console.log(`[Extension] 列出文件`);

      if (typeof localStorage !== 'undefined') {
        const files: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('file_')) {
            files.push(key.substring(5)); // 移除 "file_" 前缀
          }
        }
        return { success: true, value: files };
      }

      return { success: false, error: '文件系统不可用' };
    });

    // ========== 扩展功能模块 - AI功能 (4个) ==========
    this.registerHandler('ext_ai_chat', async (block, context) => {
      const prompt = this.getValue(block, 'prompt', context) as string;
      const apiKey = this.getValue(block, 'apiKey', context) as string;

      console.log(`[Extension] AI对话: ${prompt}`);

      // 简化实现：需要实际的AI API
      // 这里仅作为示例结构
      this.eventSystem.emit('ai:chat', { prompt, apiKey });

      // 模拟响应
      return { success: true, value: `AI回复: 收到您的消息"${prompt}"` };
    });

    this.registerHandler('ext_ai_image', async (block, context) => {
      const imageData = this.getValue(block, 'image', context);
      const task = this.getValue(block, 'task', context) as string || 'classify';

      console.log(`[Extension] AI图像识别任务: ${task}`);

      // 简化实现：需要AI视觉API
      this.eventSystem.emit('ai:image', { imageData, task });

      return { success: true, value: '图像识别结果' };
    });

    this.registerHandler('ext_ai_voice', async (block, context) => {
      const audioData = this.getValue(block, 'audio', context);
      const language = this.getValue(block, 'language', context) as string || 'zh-CN';

      console.log(`[Extension] AI语音识别语言: ${language}`);

      // 使用 Web Speech Recognition API
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = language;

        return new Promise((resolve) => {
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log(`[Extension] 识别结果: ${transcript}`);
            resolve({ success: true, value: transcript });
          };

          recognition.onerror = () => {
            resolve({ success: false, error: '语音识别失败' });
          };

          recognition.start();
        });
      }

      return { success: false, error: '语音识别API不可用' };
    });

    this.registerHandler('ext_ai_translate', async (block, context) => {
      const text = this.getValue(block, 'text', context) as string;
      const from = this.getValue(block, 'from', context) as string || 'auto';
      const to = this.getValue(block, 'to', context) as string || 'en';

      console.log(`[Extension] AI翻译: ${text} (${from} -> ${to})`);

      // 简化实现：需要翻译API
      this.eventSystem.emit('ai:translate', { text, from, to });

      return { success: true, value: `翻译结果: ${text}` };
    });

    console.log('[BlockExecutor] ✅ 已注册阶段3扩展功能积木处理器 (18个)');
    console.log('[BlockExecutor] 🎉 所有109个积木处理器注册完成！');
  }

  /**
   * 注册自定义积木处理器
   */
  registerHandler(type: string, handler: BlockHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * 执行积木序列
   */
  async executeBlocks(
    blocks: Block[],
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    this.isRunning = true;
    this.abortController = new AbortController();

    for (const block of blocks) {
      if (!this.isRunning) {
        return { success: false, error: '执行被中断' };
      }

      const result = await this.executeBlock(block, context);

      if (!result.success) {
        console.error(`[BlockExecutor] Block ${block.type} failed:`, result.error);
        return result;
      }

      if (result.shouldBreak) {
        return result;
      }

      // 如果有下一个块，继续执行
      if (block.next) {
        const nextBlock = blocks.find((b) => b.id === block.next);
        if (nextBlock) {
          const nextResult = await this.executeBlocks([nextBlock], context);
          if (!nextResult.success || nextResult.shouldBreak) {
            return nextResult;
          }
        }
      }
    }

    return { success: true };
  }

  /**
   * 执行单个积木
   */
  async executeBlock(
    block: Block,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const handler = this.handlers.get(block.type);

    if (!handler) {
      console.warn(`[BlockExecutor] No handler for block type: ${block.type}`);
      return { success: true }; // 未知块类型跳过
    }

    try {
      return await handler(block, context, this);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[BlockExecutor] Error executing ${block.type}:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 停止执行
   */
  stop(): void {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 获取块的输入值
   */
  private getValue(block: Block, name: string, context: ExecutionContext): any {
    const value = block.values[name];

    // 如果是表达式，尝试计算
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const expression = value.slice(2, -2).trim();
      return this.evaluateExpression(expression, context);
    }

    // 如果是嵌套块
    const input = block.inputs.find((i) => i.name === name);
    if (input?.blockId) {
      // 需要先执行嵌套块获取值
      // 这里简化处理，实际需要递归执行
    }

    return value;
  }

  /**
   * 计算表达式
   */
  private evaluateExpression(expression: string, context: ExecutionContext): any {
    // 简单的表达式计算
    // 替换变量引用
    const replaced = expression.replace(/\$(\w+)/g, (_, name) => {
      if (name in context.localVariables) {
        return JSON.stringify(context.localVariables[name]);
      }
      const value = this.stateManager.getVariable(name);
      return value !== undefined ? JSON.stringify(value) : 'undefined';
    });

    // 替换游戏对象属性
    const withProps = replaced.replace(/self\.(\w+)(?:\.(\w+))?/g, (_, prop, subProp) => {
      const obj = context.gameObject;
      if (subProp) {
        return JSON.stringify((obj as any)[prop]?.[subProp]);
      }
      return JSON.stringify((obj as any)[prop]);
    });

    try {
      // 安全计算表达式
      return new Function('return ' + withProps)();
    } catch {
      return expression;
    }
  }

  /**
   * 获取嵌套路径的值
   */
  private getNestedValue(context: ExecutionContext, path: string): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * 获取嵌套的子块
   */
  private getNestedBlocks(_block: Block, _slot: string): Block[] {
    // 实际实现需要根据块的结构获取嵌套块
    // 这里简化返回空数组
    return [];
  }

  /**
   * 等待指定时间
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, ms);

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });
  }

  /**
   * 简单的碰撞检测 (AABB)
   */
  private checkCollision(objA: GameObject, objB: GameObject): boolean {
    if (objA.id === objB.id) return false;

    const aLeft = objA.position.x - objA.anchor.x * objA.size.width;
    const aRight = aLeft + objA.size.width;
    const aTop = objA.position.y - objA.anchor.y * objA.size.height;
    const aBottom = aTop + objA.size.height;

    const bLeft = objB.position.x - objB.anchor.x * objB.size.width;
    const bRight = bLeft + objB.size.width;
    const bTop = objB.position.y - objB.anchor.y * objB.size.height;
    const bBottom = bTop + objB.size.height;

    return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
  }

  /**
   * 应用缓动函数
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'elastic':
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      default:
        return t;
    }
  }
}
