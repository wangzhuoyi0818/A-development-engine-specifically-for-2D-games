/**
 * AI 逻辑积木生成服务
 * 根据用户描述的游戏设计，调用 AI API 自动生成逻辑积木序列
 */

import { Block, BlockType, createBlock } from '@/types/block';

// AI 服务配置
export interface AIServiceConfig {
  apiKey: string;
  apiEndpoint: string;
  model?: string;
}

// localStorage 存储键名
const AI_CONFIG_STORAGE_KEY = 'ai-service-config';

// 游戏角色行为描述
export interface GameBehaviorDescription {
  characterName: string;      // 角色名称
  characterType: string;      // 角色类型：player/enemy/npc/item 等
  description: string;        // 用户的自然语言描述
  availableScenes?: string[]; // 可用的场景名称列表
}

// AI 生成结果
export interface AIGenerationResult {
  success: boolean;
  blocks: Block[];
  explanation?: string;       // AI 对生成结果的解释
  error?: string;
}

// 可用的积木类型列表（用于 AI 提示词）
const AVAILABLE_BLOCK_TYPES = `
【状态管理模块】
- state_setscore: 设置得分 (参数: score - 分数)
- state_addscore: 增加得分 (参数: amount - 增加量)
- state_getscore: 获取得分
- state_setlives: 设置生命值 (参数: lives - 生命值)
- state_addlives: 增加生命值 (参数: amount - 增加量)
- state_getlives: 获取生命值
- state_gotoscene: 跳转到指定场景 (参数: sceneId - 场景名称)
- state_gotorandomscene: 随机跳转场景 (参数: excludeCurrent - 是否排除当前场景，默认true)
- state_setcharstate: 设置角色状态 (参数: charId - 角色ID, key - 状态名, value - 值)
- state_getcharstate: 获取角色状态 (参数: charId - 角色ID, key - 状态名)

【事件系统模块】
- event_click: 当点击时
- event_keypress: 当按键时 (参数: key - 按键名称，如'KeyW'/'KeyA'/'KeyS'/'KeyD'/'Space'/'ArrowUp'等)
- event_sceneinit: 场景初始化时（游戏开始）
- event_timer: 定时触发 (参数: seconds - 间隔秒数)
- event_collision: 碰撞触发 (参数: target - 碰撞目标)
- event_message: 收到消息时 (参数: message - 消息名称)

【运动控制模块】
- motion_move: 定向移动 (参数: direction - 方向如'up'/'down'/'left'/'right', distance - 距离)
- motion_rotate: 旋转 (参数: angle - 角度)
- motion_moveto: 瞬移到坐标 (参数: x, y - 目标坐标)
- motion_easeto: 缓动移动 (参数: x, y, duration - 目标坐标和时长, easing - 缓动类型)
- motion_setvelocity: 设置速度 (参数: vx, vy - 水平和垂直速度)
- motion_setgravity: 设置重力 (参数: gravity - 重力值)
- motion_followtarget: 跟随目标 (参数: target - 目标类型如'mouse'/'character', targetId - 角色ID, speed - 速度)

【外观与声音模块】
- looks_showbubble: 显示对话气泡 (参数: text - 文字内容, duration - 显示时长)
- looks_setcostume: 切换造型 (参数: costume - 造型名称)
- looks_playsound: 播放音效 (参数: sound - 音效名称)
- looks_setvolume: 设置音量 (参数: volume - 音量0-100)

【侦测与物理模块】
- sensing_touching: 碰到角色 (参数: target - 目标角色)
- sensing_touchingcolor: 碰到颜色 (参数: color - 颜色值)
- sensing_distanceto: 距离计算 (参数: target - 目标)
- sensing_inzone: 在区域内 (参数: zone - 区域名称)

【特效系统模块】
- effects_setopacity: 设置透明度 (参数: opacity - 0-1)
- effects_setsize: 设置大小 (参数: scale - 缩放百分比)
- effects_shake: 屏幕震动 (参数: intensity - 强度, duration - 时长)
- effects_fadein: 淡入 (参数: duration - 时长)
- effects_fadeout: 淡出 (参数: duration - 时长)

【逻辑运算模块】
- logic_if: 如果条件 (参数: condition - 条件表达式)
- logic_ifelse: 如果否则 (参数: condition - 条件表达式)
- logic_repeat: 重复循环 (参数: times - 重复次数)
- logic_forever: 永远循环
- logic_waituntil: 等待条件 (参数: condition - 条件)
- logic_compare: 比较运算 (参数: operator - 运算符, left - 左值, right - 右值)

【数据运算模块】
- data_random: 随机数 (参数: min - 最小值, max - 最大值)
- data_arithmetic: 四则运算 (参数: operator - 运算符, left - 左操作数, right - 右操作数)
`;

/**
 * AI 积木生成服务类
 */
export class AIBlockGeneratorService {
  private config: AIServiceConfig | null = null;

  constructor() {
    // 从 localStorage 加载已保存的配置
    this.loadFromStorage();
  }

  /**
   * 从 localStorage 加载配置
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.apiEndpoint) {
          this.config = parsed;
        }
      }
    } catch (error) {
      console.warn('加载 AI 配置失败:', error);
    }
  }

  /**
   * 保存配置到 localStorage
   */
  private saveToStorage() {
    try {
      if (this.config) {
        localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
      } else {
        localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('保存 AI 配置失败:', error);
    }
  }

  /**
   * 配置 AI 服务（同时持久化到 localStorage）
   */
  configure(config: AIServiceConfig) {
    this.config = config;
    this.saveToStorage();
  }

  /**
   * 清除配置
   */
  clearConfig() {
    this.config = null;
    localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
  }

  /**
   * 获取当前配置（用于 UI 回显）
   */
  getConfig(): AIServiceConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.apiEndpoint);
  }

  /**
   * 获取配置状态
   */
  getConfigStatus(): { configured: boolean; endpoint?: string; model?: string } {
    return {
      configured: this.isConfigured(),
      endpoint: this.config?.apiEndpoint,
      model: this.config?.model,
    };
  }

  /**
   * 通过本地代理发送 API 请求（解决 CORS 问题）
   */
  private async fetchViaProxy(endpoint: string, apiKey: string, payload: unknown): Promise<Response> {
    // 判断是否是外部 URL（需要通过代理）
    const isExternalUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');

    if (isExternalUrl) {
      // 开发模式：直接调用（某些AI服务支持CORS）
      // 生产模式：应该通过后端代理
      try {
        return await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        // 如果直接调用失败，尝试通过代理
        return fetch('/api/ai-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUrl: endpoint,
            apiKey: apiKey,
            payload: payload,
          }),
        });
      }
    } else {
      // 本地地址直接请求
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
    }
  }

  /**
   * 测试 API 连接是否有效
   */
  async testConnection(config?: AIServiceConfig): Promise<{ success: boolean; error?: string }> {
    const testConfig = config || this.config;

    if (!testConfig?.apiKey || !testConfig?.apiEndpoint) {
      return { success: false, error: '请填写 API Endpoint 和 API Key' };
    }

    try {
      // 发送一个简单的测试请求
      const response = await this.fetchViaProxy(
        testConfig.apiEndpoint,
        testConfig.apiKey,
        {
          model: testConfig.model || 'gpt-4',
          messages: [{ role: 'user', content: '你好' }],
          max_tokens: 5,
        }
      );

      if (response.ok) {
        return { success: true };
      }

      // 解析错误信息
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `请求失败: ${response.status}`;

      // 常见错误提示
      if (response.status === 401) {
        return { success: false, error: 'API Key 无效或已过期' };
      }
      if (response.status === 404) {
        return { success: false, error: 'API Endpoint 地址错误或模型不存在' };
      }
      if (response.status === 429) {
        // 429 说明连接是通的，只是频率限制
        return { success: true };
      }

      return { success: false, error: errorMessage };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '连接测试失败'
      };
    }
  }

  /**
   * 根据用户描述生成逻辑积木
   */
  async generateBlocks(description: GameBehaviorDescription): Promise<AIGenerationResult> {
    if (!this.config?.apiKey || !this.config?.apiEndpoint) {
      return {
        success: false,
        blocks: [],
        error: '未配置 AI API。请在设置中配置 API Key 和 Endpoint。',
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(description.availableScenes);
      const userPrompt = this.buildUserPrompt(description);

      const response = await this.fetchViaProxy(
        this.config.apiEndpoint,
        this.config.apiKey,
        {
          model: this.config.model || 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('AI 返回内容为空');
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('AI 生成错误:', error);
      return {
        success: false,
        blocks: [],
        error: error instanceof Error ? error.message : '生成失败，请检查网络连接和 API 配置',
      };
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(availableScenes?: string[]): string {
    const scenesInfo = availableScenes && availableScenes.length > 0
      ? `\n当前项目的可用场景：${availableScenes.join('、')}\n注意：使用 state_gotoscene 积木时，sceneId 参数必须是上述场景名称之一，不要使用占位符！`
      : '';

    return `你是一个游戏逻辑积木生成助手。用户会描述他们想要的游戏行为，你需要生成相应的逻辑积木序列。
${scenesInfo}

⚠️ 【关键】积木类型命名规范：
- 必须使用正确的模块前缀：state_/event_/motion_/looks_/sensing_/effects_/logic_/data_
- ❌ 禁止使用 game_* 前缀（旧版本，已废弃）
- ❌ 禁止使用 condition_* 或 control_* 前缀（错误命名）
- ✅ 示例：使用 event_sceneinit 而不是 game_event_start
- ✅ 示例：使用 motion_setvelocity 而不是 game_setvelocity
- ✅ 示例：使用 logic_if 而不是 condition_if

重要规则：
1. 每次生成的积木序列应该是一种可能的实现方式，可以有创意和变化
2. 积木序列应该逻辑正确，能够实现用户描述的功能
3. 适当使用事件积木作为触发条件
4. 考虑游戏的流畅性和用户体验
5. 【重要】生成场景跳转积木(state_gotoscene)时，必须使用上面列出的实际场景名称，参数名是sceneId，不要使用"next_scene"等占位符
6. 【关键】如果用户需要"随机"跳转场景，使用 state_gotorandomscene 积木，不要生成多个 state_gotoscene！
7. 【注意】多个连续的相同类型积木会依次执行，不会产生"随机选择一个"的效果
8. 【重要】event_keypress 积木只用于判断按键，必须在其后面添加实际的动作积木！参数key的值必须使用完整的按键名称如'KeyW'/'KeyS'/'KeyA'/'KeyD'/'Space'/'ArrowUp'等
9. 【关键】键盘控制移动的标准模式：
   event_keypress(key: "KeyW") + motion_move(direction: "up", distance: 10)
   event_keypress(key: "KeyS") + motion_move(direction: "down", distance: 10)
   event_keypress(key: "KeyA") + motion_move(direction: "left", distance: 10)
   event_keypress(key: "KeyD") + motion_move(direction: "right", distance: 10)

${AVAILABLE_BLOCK_TYPES}

请以 JSON 格式返回积木序列，格式如下：
{
  "blocks": [
    { "type": "积木类型", "values": { "参数名": "参数值" } }
  ],
  "explanation": "简短解释这个逻辑的工作原理（中文）"
}

注意：
- type 必须是上面列出的有效积木类型，严格遵守命名规范（使用 state_/event_/motion_ 等前缀）
- values 中的参数名和值要符合积木定义
- 返回纯 JSON，不要包含 markdown 代码块标记`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(description: GameBehaviorDescription): string {
    return `为游戏角色生成逻辑积木：

角色名称：${description.characterName}
角色类型：${description.characterType}（可能的值：player=玩家, enemy=敌人, npc=NPC, item=道具, projectile=子弹, obstacle=障碍物, platform=平台）
行为描述：${description.description}

请生成一个合理的逻辑积木序列来实现这个行为。`;
  }

  /**
   * 解析 AI 返回的内容
   */
  private parseAIResponse(content: string): AIGenerationResult {
    // 🔍 调试日志：输出 AI 原始响应
    console.group('🤖 AI 积木生成解析');
    console.log('📥 AI 原始响应:', content);

    try {
      // 尝试提取 JSON（处理可能的 markdown 代码块）
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
        console.log('📦 从 Markdown 代码块提取 JSON');
      } else {
        const pureJsonMatch = content.match(/\{[\s\S]*\}/);
        if (pureJsonMatch) {
          jsonStr = pureJsonMatch[0];
          console.log('📦 从纯文本提取 JSON');
        }
      }

      console.log('📝 提取的 JSON:', jsonStr);
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON 解析成功:', parsed);

      const blocks: Block[] = [];

      // 【容错映射】旧积木类型 -> 新积木类型（兼容旧版本AI响应）
      const blockTypeMapping: Record<string, string> = {
        // 旧的 game_* 前缀系列
        'game_event_start': 'event_sceneinit',
        'game_event_click': 'event_click',
        'game_event_keypress': 'event_keypress',
        'game_event_update': 'event_timer',  // 游戏更新 -> 定时触发
        'game_event_collision': 'event_collision',
        'game_move': 'motion_move',
        'game_setvelocity': 'motion_setvelocity',
        'game_moveto': 'motion_moveto',
        'game_rotate': 'motion_rotate',
        'game_setopacity': 'effects_setopacity',
        'game_setsize': 'effects_setsize',
        'game_setscore': 'state_setscore',
        'game_addscore': 'state_addscore',
        'game_setlives': 'state_setlives',
        'game_addlives': 'state_addlives',
        'game_gotoscene': 'state_gotoscene',
        'game_playsound': 'looks_playsound',

        // 其他常见错误命名
        'condition_if': 'logic_if',
        'condition_ifelse': 'logic_ifelse',
        'condition_repeat': 'logic_repeat',
        'condition_forever': 'logic_forever',
        'control_if': 'logic_if',
        'control_repeat': 'logic_repeat',
        'operator_random': 'data_random',
        'operator_add': 'data_arithmetic',
        'sensing_collision': 'event_collision',
        'event_update': 'event_timer',
        'motion_setspeed': 'motion_setvelocity',
      };

      // 参数名映射表（旧名称 -> 新名称）
      const parameterMapping: Record<string, Record<string, string>> = {
        'state_gotoscene': { 'scene': 'sceneId' },
        'event_timer': { 'interval': 'seconds', 'delay': 'seconds' },
        'event_keypress': { 'key': 'key' }, // key值需要转换，见下文
        'motion_followtarget': { 'target': 'target' },
        'effects_setsize': { 'size': 'scale' },
        'motion_setvelocity': { 'speedX': 'vx', 'speedY': 'vy', 'speed': 'vx' },
      };

      console.log(`🎯 准备创建 ${parsed.blocks?.length || 0} 个积木`);

      for (const blockConfig of parsed.blocks || []) {
        // 应用类型映射（容错处理）
        const originalType = blockConfig.type;
        const mappedType = blockTypeMapping[originalType] || originalType;

        if (mappedType !== originalType) {
          console.group(`🔄 积木类型映射: ${originalType} → ${mappedType}`);
          blockConfig.type = mappedType;
        } else {
          console.group(`🔍 处理积木: ${blockConfig.type}`);
        }

        console.log('📋 积木配置:', blockConfig);

        const block = createBlock(blockConfig.type as BlockType);
        if (block) {
          console.log('✅ 积木创建成功');

          // 应用参数映射
          const mappedValues: Record<string, unknown> = {};
          const mapping = parameterMapping[blockConfig.type] || {};

          for (const [key, value] of Object.entries(blockConfig.values || {})) {
            const mappedKey = mapping[key] || key;
            console.log(`  📌 参数映射: ${key} -> ${mappedKey} = ${value}`);

            // 特殊处理：event_keypress 的 key 参数
            if (blockConfig.type === 'event_keypress' && mappedKey === 'key' && value) {
              const keyStr = String(value).toUpperCase();
              // 转换简写按键名到完整名称
              const keyMapping: Record<string, string> = {
                'W': 'KeyW',
                'A': 'KeyA',
                'S': 'KeyS',
                'D': 'KeyD',
                'SPACE': 'Space',
                'UP': 'ArrowUp',
                'DOWN': 'ArrowDown',
                'LEFT': 'ArrowLeft',
                'RIGHT': 'ArrowRight',
              };
              const mappedValue = keyMapping[keyStr] || value;
              console.log(`  ⌨️  按键转换: ${value} -> ${mappedValue}`);
              mappedValues[mappedKey] = mappedValue;
            } else {
              mappedValues[mappedKey] = value;
            }
          }

          // 合并 AI 返回的参数值
          block.values = { ...block.values, ...mappedValues };
          console.log('  💾 最终积木值:', block.values);
          blocks.push(block);
        } else {
          console.error(`❌ 积木类型无法识别: "${blockConfig.type}"`);
          console.error(`   可能的原因：`);
          console.error(`   1. 类型名称拼写错误`);
          console.error(`   2. 该类型不在系统支持列表中`);
          console.error(`   3. AI 返回了错误的类型名`);
        }
        console.groupEnd();
      }

      console.log(`\n📊 解析结果统计:`);
      console.log(`  ✅ 成功创建: ${blocks.length} 个积木`);
      console.log(`  ❌ 失败: ${(parsed.blocks?.length || 0) - blocks.length} 个积木`);
      console.groupEnd();

      if (blocks.length === 0) {
        console.error('⚠️  没有成功创建任何积木！');
        console.error('请检查上面的日志，查看哪些积木类型无法识别');
        return {
          success: false,
          blocks: [],
          error: 'AI 生成的积木无法解析，请重试。请查看浏览器控制台（F12）了解详情。',
        };
      }

      return {
        success: true,
        blocks,
        explanation: parsed.explanation || `已生成 ${blocks.length} 个逻辑积木`,
      };
    } catch (error) {
      console.error('❌ 解析 AI 响应失败:', error);
      console.error('📄 原始内容:', content);
      console.groupEnd();
      return {
        success: false,
        blocks: [],
        error: '解析 AI 返回内容失败，请重试。详情请查看浏览器控制台（F12）。',
      };
    }
  }
}

// 导出单例
export const aiBlockGenerator = new AIBlockGeneratorService();

// 便捷函数
export const configureAIService = (config: AIServiceConfig) => {
  aiBlockGenerator.configure(config);
};

export const generateBlocksFromDescription = async (
  description: GameBehaviorDescription
): Promise<AIGenerationResult> => {
  return aiBlockGenerator.generateBlocks(description);
};

export const isAIServiceConfigured = (): boolean => {
  return aiBlockGenerator.isConfigured();
};

export const getAIServiceStatus = () => {
  return aiBlockGenerator.getConfigStatus();
};

export const getAIServiceConfig = (): AIServiceConfig | null => {
  return aiBlockGenerator.getConfig();
};

export const testAIConnection = async (config?: AIServiceConfig) => {
  return aiBlockGenerator.testConnection(config);
};

export const clearAIServiceConfig = () => {
  aiBlockGenerator.clearConfig();
};

