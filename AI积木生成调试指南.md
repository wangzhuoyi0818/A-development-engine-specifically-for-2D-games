# AI 积木生成调试指南

## 问题：AI 生成的积木无法解析

### 快速诊断

1. **打开浏览器开发者工具**
   - 按 F12 或右键点击"检查"
   - 切换到 Console 标签

2. **重现问题**
   - 在 AI 助手中输入描述，点击"生成"
   - 查看 Console 中的输出

3. **查找关键信息**
   - 搜索 "解析 AI 响应失败" 或 "未知的积木类型"
   - 查看 AI 返回的原始 JSON 内容
   - 查看哪些积木类型被识别为"未知"

### 常见原因

#### 原因1：AI 返回了错误的积木类型名称
**症状**：Console 显示 `未知的积木类型: xxx`

**解决方案**：
- 检查 AI 返回的类型名是否在提示词中
- 可能是 AI 模型"创造"了不存在的类型
- 尝试更换 AI 模型或调整提示词

#### 原因2：参数名不匹配
**症状**：积木创建成功，但参数值丢失

**解决方案**：
- 检查 `aiBlockGenerator.ts` 第407-413行的参数映射表
- 确保 AI 返回的参数名与积木定义一致

#### 原因3：JSON 格式错误
**症状**：Console 显示 JSON 解析错误

**解决方案**：
- AI 可能返回了 markdown 代码块
- 检查解析逻辑是否正确提取 JSON

### 调试代码（临时添加）

在 `aiBlockGenerator.ts` 第389行的 `parseAIResponse` 函数开头添加：

```typescript
private parseAIResponse(content: string): AIGenerationResult {
  // 🔍 调试：输出 AI 原始响应
  console.log('🤖 AI 原始响应:', content);

  try {
    // ... 现有代码
```

在第415-451行的循环中添加：

```typescript
for (const blockConfig of parsed.blocks || []) {
  // 🔍 调试：输出每个积木的配置
  console.log('🔍 尝试创建积木:', blockConfig.type, blockConfig.values);

  const block = createBlock(blockConfig.type as BlockType);
  if (block) {
    console.log('✅ 积木创建成功:', blockConfig.type);
    // ... 现有代码
  } else {
    console.warn(`❌ 未知的积木类型: ${blockConfig.type}`);
  }
}
```

### 测试用例

#### 测试1：简单移动
```
描述：按W键向上移动
期望生成：
- event_keypress (key: 'KeyW')
- motion_move (direction: 'up', distance: 10)
```

#### 测试2：碰撞得分
```
描述：碰到金币增加10分
期望生成：
- event_collision (target: '金币')
- state_addscore (amount: 10)
```

### 已知问题

1. **场景跳转参数名**
   - 正确：`sceneId`
   - 错误：`scene`, `sceneName`

2. **按键参数值**
   - 正确：`KeyW`, `KeyA`, `KeyS`, `KeyD`, `Space`
   - 错误：`W`, `A`, `S`, `D`, `w`, `a`

3. **时间参数名**
   - event_timer 使用 `seconds`（不是 `interval`）

### 解决流程

1. 确认 AI 返回的积木类型名称
2. 对比 `src/types/block.ts` 中的 `BlockType` 定义
3. 检查参数名和值是否正确
4. 如果类型错误，调整提示词或添加映射
5. 如果参数错误，更新参数映射表

### 联系开发者

如果以上方法都无法解决，请提供：
- 浏览器 Console 的完整输出
- 你的输入描述
- AI 返回的原始 JSON
