# AI 积木生成器类型映射修复说明

**修复时间**: 2026-01-27
**问题**: AI 生成的积木无法解析（AI 返回了错误的积木类型名称）

## 问题现象

控制台报错：
```
❌ 未知的积木类型: game_event_start
❌ 未知的积木类型: game_setvelocity
❌ 未知的积木类型: game_event_update
❌ 未知的积木类型: condition_if
```

**根本原因**：AI 模型返回了旧版本或错误的积木类型命名，导致系统无法识别。

## 修复方案

### 方案1：自动容错映射（已实现）

在 `aiBlockGenerator.ts` 中添加了自动类型映射机制，将常见的错误类型自动转换为正确类型：

```typescript
const blockTypeMapping: Record<string, string> = {
  // 旧的 game_* 前缀系列
  'game_event_start': 'event_sceneinit',
  'game_setvelocity': 'motion_setvelocity',
  'game_event_update': 'event_timer',
  'game_setscore': 'state_setscore',
  // ...更多映射

  // 其他常见错误命名
  'condition_if': 'logic_if',
  'control_if': 'logic_if',
  'event_update': 'event_timer',
  // ...
};
```

**优点**：
- ✅ 即使 AI 返回错误类型，也能自动纠正
- ✅ 提升用户体验，减少失败率
- ✅ 兼容不同 AI 模型的"习惯"

### 方案2：优化 AI 提示词（已实现）

在系统提示词中明确说明命名规范：

```
⚠️ 【关键】积木类型命名规范：
- 必须使用正确的模块前缀：state_/event_/motion_/looks_/sensing_/effects_/logic_/data_
- ❌ 禁止使用 game_* 前缀（旧版本，已废弃）
- ❌ 禁止使用 condition_* 或 control_* 前缀（错误命名）
- ✅ 示例：使用 event_sceneinit 而不是 game_event_start
- ✅ 示例：使用 motion_setvelocity 而不是 game_setvelocity
```

**优点**：
- ✅ 从源头减少错误
- ✅ 提高生成质量

### 方案3：增强调试日志（已实现）

添加详细的调试信息，帮助快速定位问题：

```
🔄 积木类型映射: game_event_start → event_sceneinit
  📋 积木配置: { type: "event_sceneinit", values: {...} }
  ✅ 积木创建成功
```

## 支持的类型映射

### 旧版 game_* 系列
| 错误类型 | 正确类型 | 说明 |
|---------|---------|------|
| `game_event_start` | `event_sceneinit` | 场景初始化 |
| `game_event_click` | `event_click` | 点击事件 |
| `game_event_keypress` | `event_keypress` | 按键事件 |
| `game_event_update` | `event_timer` | 定时更新 |
| `game_move` | `motion_move` | 移动 |
| `game_setvelocity` | `motion_setvelocity` | 设置速度 |
| `game_setscore` | `state_setscore` | 设置得分 |
| `game_setopacity` | `effects_setopacity` | 设置透明度 |

### 其他常见错误
| 错误类型 | 正确类型 | 说明 |
|---------|---------|------|
| `condition_if` | `logic_if` | 条件判断 |
| `condition_repeat` | `logic_repeat` | 循环重复 |
| `control_if` | `logic_if` | 控制逻辑 |
| `operator_random` | `data_random` | 随机数 |
| `motion_setspeed` | `motion_setvelocity` | 速度设置 |

## 测试验证

### 测试用例 1：使用错误类型（自动纠正）

**输入描述**：游戏开始时设置得分为0

**AI 返回（错误）**：
```json
{
  "blocks": [
    { "type": "game_event_start", "values": {} },
    { "type": "game_setscore", "values": { "score": 0 } }
  ]
}
```

**系统处理（自动映射）**：
```
🔄 积木类型映射: game_event_start → event_sceneinit
🔄 积木类型映射: game_setscore → state_setscore
✅ 成功创建 2 个积木
```

**结果**：✅ 成功生成积木

### 测试用例 2：使用正确类型

**输入描述**：按W键向上移动

**AI 返回（正确）**：
```json
{
  "blocks": [
    { "type": "event_keypress", "values": { "key": "KeyW" } },
    { "type": "motion_move", "values": { "direction": "up", "distance": 10 } }
  ]
}
```

**系统处理**：
```
🔍 处理积木: event_keypress
✅ 积木创建成功

🔍 处理积木: motion_move
✅ 积木创建成功
```

**结果**：✅ 成功生成积木

## 如何使用

### 用户无需任何操作

修复已自动生效，用户在使用 AI 助手时：

1. **刷新页面**（Ctrl + Shift + R）
2. 正常使用 AI 助手生成积木
3. 即使 AI 返回错误类型，系统也会自动纠正

### 开发者调试

如需查看映射过程，打开浏览器控制台（F12），可以看到：
- `🔄 积木类型映射: 旧类型 → 新类型`（表示发生了自动纠正）
- `🔍 处理积木: 类型名`（表示使用了正确类型）

## 常见问题

### Q1: 为什么 AI 还会返回错误类型？

**A**: AI 模型基于训练数据，可能学习到了旧版本的代码或类似项目的命名方式。通过提示词优化可以降低错误率，但无法完全避免。因此我们添加了自动映射机制作为兜底方案。

### Q2: 如果遇到未映射的新类型怎么办？

**A**:
1. 查看控制台日志中的"❌ 积木类型无法识别"
2. 将该类型添加到 `blockTypeMapping` 映射表中
3. 如果是合理的类型，也可以添加到 `BlockType` 定义中

### Q3: 映射会不会导致误判？

**A**: 不会。映射表中的规则都是明确的1对1映射，只有完全匹配时才会转换。不会影响正确的类型名称。

## 技术细节

### 修改的文件
```
src/services/aiBlockGenerator.ts
```

### 关键代码位置

#### 1. 类型映射表（第407-440行）
```typescript
const blockTypeMapping: Record<string, string> = {
  'game_event_start': 'event_sceneinit',
  // ...
};
```

#### 2. 应用映射（第463-469行）
```typescript
const originalType = blockConfig.type;
const mappedType = blockTypeMapping[originalType] || originalType;
if (mappedType !== originalType) {
  blockConfig.type = mappedType;
}
```

#### 3. 提示词优化（第360-368行）
```typescript
⚠️ 【关键】积木类型命名规范：
- 必须使用正确的模块前缀...
```

## 影响范围

### ✅ 兼容性
- 旧版 AI 响应：自动纠正，正常工作
- 新版 AI 响应：直接使用，正常工作
- 手动添加积木：不受影响

### ✅ 性能影响
- 映射查找是 O(1) 时间复杂度
- 几乎无性能损耗

### ✅ 用户体验
- 大幅降低"无法解析"错误
- 提升 AI 生成成功率
- 支持更多 AI 模型

## 后续优化建议

1. **收集错误类型统计**
   - 记录最常见的错误映射
   - 定期更新映射表

2. **自适应学习**
   - 根据用户反馈自动添加映射
   - AI 模型微调

3. **多语言支持**
   - 支持中文类型名（如"事件_点击" → "event_click"）
   - 更友好的本地化

---

**修复完成！现在 AI 助手可以正确处理各种积木类型命名了。** 🎉
