# Block Debug Skill

**用途**: 诊断和修复游戏积木系统中的执行问题，包括 AI 生成的积木无法工作、状态同步错误、触发器分配错误等。

**使用场景**:
- AI 生成的积木在预览模式下不执行
- 积木执行了但没有预期效果
- 组件状态更新后位置/属性没有变化
- 追踪、移动等持续行为只执行一次

---

## 诊断流程

### 阶段1: 确认积木生成和保存

**检查项**:
1. 查看浏览器控制台，确认 AI 生成日志：
   ```
   [RightSidebar] AI生成积木分配到触发器: <触发器名称>
   [RightSidebar] 积木数量: <数量>
   ```

2. 检查触发器分配是否正确：
   - 追踪/持续行为 → 应该是 `onUpdate`
   - 按键控制 → 应该是 `onKeyDown`
   - 点击交互 → 应该是 `onClick`
   - 场景初始化 → 应该是 `onGameStart`

3. 如果触发器错误，检查 `RightSidebar.tsx` 的 `handleAIBlocksGenerated` 函数

**常见问题**:
- ❌ 追踪积木被分配到 `onGameStart`（只执行1次）
- ❌ 持续行为积木没有被识别为 `onUpdate`

**修复方法**: 调整 `RightSidebar.tsx` 中的触发器检测优先级，确保先检测功能类型（如 `motion_followtarget`），再检查事件类型（如 `event_sceneinit`）

---

### 阶段2: 确认预览模式架构

**检查项**:
1. 查看控制台日志，判断使用的预览模式：
   - 如果看到 `[GameEngine]` 日志 → 使用 GamePreview（完整版）
   - 如果看到 `[GamePreviewTest]` 日志 → 使用 GamePreviewTest（简化版）

2. 检查是否有脚本执行日志：
   ```
   [GamePreviewTest] 🎬 执行 <组件名> 的 onGameStart
   [GamePreviewTest] 🔄 执行 <组件名> 的 onUpdate
   ```

**常见问题**:
- ❌ GamePreviewTest 不自动执行 `onGameStart` 脚本
- ❌ GamePreviewTest 不自动执行 `onUpdate` 脚本
- ❌ 游戏循环只在有输入时运行

**修复方法**:
1. 在 `GamePreviewTest.tsx` 中添加 `onGameStart` 脚本自动执行（useEffect）
2. 改造游戏循环为持续运行，添加 `onUpdate` 脚本每帧执行
3. 确保游戏循环不依赖输入状态

---

### 阶段3: 确认积木逻辑实现

**检查项**:
1. 查看控制台，确认积木类型被识别：
   ```
   [GamePreviewTest] 🔧 执行积木 [0]: motion_followtarget
   ```

2. 检查 `executeBlocks` 函数是否处理了该积木类型

3. 查看是否有错误日志或警告

**常见问题**:
- ❌ `motion_followtarget` 积木没有实现逻辑
- ❌ 积木参数解析错误
- ❌ 目标查找失败

**修复方法**:
1. 在 `GamePreviewTest.tsx` 的 `executeBlocks` 函数中添加该积木类型的处理
2. 实现智能目标查找（ID → 名称 → 模糊匹配 → 角色类型 → 关键词）
3. 添加详细的调试日志

---

### 阶段4: 诊断状态同步问题（最关键！）

**症状识别**:
查看追踪日志，如果看到位置完全相同：
```
- 追踪者: 僵尸 @ (221.15, 290.95)  // 第1次
- 追踪者: 僵尸 @ (221.15, 290.95)  // 第2次 - 完全相同！
- 追踪者: 僵尸 @ (221.15, 290.95)  // 第3次 - 还是相同！
```

**根本原因**: 使用了函数参数或闭包中的组件快照，而不是实时从 store 获取

**修复模式**:

❌ **错误代码**:
```typescript
const executeBlocks = (blocks, component) => {
  for (const block of blocks) {
    if (block.type === 'motion_followtarget') {
      // ❌ component 是快照，永远不会更新
      const dx = target.position.x - component.position.x;

      updateComponent(component.id, { position: newPos });
      // 下次循环仍然使用旧的 component
    }
  }
}
```

✅ **正确代码**:
```typescript
const executeBlocks = (blocks, component) => {
  for (const block of blocks) {
    if (block.type === 'motion_followtarget') {
      // ✅ 实时从 store 获取最新状态
      const freshPage = getCurrentPage();
      const latestComponent = freshPage.components.find(c => c.id === component.id);

      const dx = target.position.x - latestComponent.position.x;

      updateComponent(latestComponent.id, { position: newPos });
      // 下次循环会再次获取最新状态
    }
  }
}
```

**验证方法**: 位置应该逐次变化
```
- 追踪者: 僵尸 @ (221.15, 290.95)  // 第1次
- 追踪者: 僵尸 @ (211.51, 273.43)  // ✅ 位置变了！
- 追踪者: 僵尸 @ (203.50, 266.79)  // ✅ 继续变化！
```

---

### 阶段5: 验证持续执行

**检查项**:
1. 打开预览模式
2. 使用摇杆或键盘移动玩家
3. 观察敌人是否持续追踪（而非只移动一次）

**预期行为**:
- 玩家移动时，敌人应该实时跟随
- 控制台应该持续输出追踪日志（每60帧一次）

**常见问题**:
- ❌ 积木只在场景加载时执行1次
- ❌ 追踪逻辑正确但不持续

**修复方法**: 确认积木被分配到 `onUpdate` 而非 `onGameStart`

---

## 调试清单

使用此清单系统化排查问题：

### ✅ 积木生成
- [ ] AI 成功生成了积木
- [ ] 积木被保存到 `component.scripts`
- [ ] 触发器分配正确（追踪 → `onUpdate`）

### ✅ 预览架构
- [ ] 预览模式已启动（控制台有日志）
- [ ] `onGameStart` 脚本被自动执行
- [ ] `onUpdate` 脚本每帧执行
- [ ] 游戏循环持续运行

### ✅ 积木实现
- [ ] `executeBlocks` 函数处理了该积木类型
- [ ] 积木参数解析正确
- [ ] 目标查找成功
- [ ] 移动逻辑执行

### ✅ 状态同步
- [ ] 使用 `getCurrentPage()` 实时获取状态
- [ ] 组件位置每次循环都更新
- [ ] 控制台显示位置在变化

### ✅ 持续执行
- [ ] 积木在 `onUpdate` 中而非 `onGameStart`
- [ ] 追踪持续进行，不是只执行一次
- [ ] 玩家移动时敌人跟随

---

## 常见错误模式

### 错误1: 触发器分配优先级错误

**症状**: AI 生成了追踪积木，但分配到了 `onGameStart`

**原因**: 检测逻辑按出现顺序，第一个 `event_sceneinit` 就 break 了

**修复**: 重构检测逻辑，优先检测功能类型

```typescript
// 第1轮：优先检测持续行为
for (const block of blocks) {
  if (block.type === 'motion_followtarget' ||
      block.type === 'logic_forever') {
    triggerKey = 'onUpdate';
    break;
  }
}

// 第2轮：如果没找到，检查事件类型
if (triggerKey === defaultValue) {
  for (const block of blocks) {
    if (block.type === 'event_sceneinit') {
      triggerKey = 'onGameStart';
      break;
    }
  }
}
```

---

### 错误2: 使用快照而非实时状态

**症状**: 移动逻辑执行但位置不变，或者位置始终相同

**原因**: React 闭包问题，使用的是旧的引用

**修复**: 在循环中实时查询

```typescript
// ❌ 错误
const position = component.position;  // 快照
for (...) {
  updateComponent(...);  // 更新了 store
  // 但 position 变量没变
}

// ✅ 正确
for (...) {
  const fresh = getCurrentPage().components.find(...);  // 实时查询
  const position = fresh.position;  // 最新值
  updateComponent(...);
}
```

---

### 错误3: onGameStart vs onUpdate 混淆

**症状**: 追踪只执行1次就停止

**原因**: 积木在 `onGameStart` 中

| 触发器 | 执行次数 | 适用场景 |
|--------|---------|---------|
| onGameStart | 1次 | 初始化 |
| onUpdate | 60次/秒 | 追踪、AI |
| onClick | 按需 | 交互 |

**修复**: 将持续行为放在 `onUpdate` 中

---

### 错误4: GamePreviewTest 缺少自动执行

**症状**: 预览模式启动但没有任何脚本执行日志

**原因**: GamePreviewTest 默认不执行 onGameStart/onUpdate

**修复**: 添加 useEffect 自动执行

```typescript
// 执行 onGameStart
useEffect(() => {
  currentPage.components.forEach(component => {
    const blocks = component.scripts?.onGameStart;
    if (blocks) executeBlocks(blocks, component);
  });
}, [currentPage?.id]);

// 执行 onUpdate
useEffect(() => {
  const loop = () => {
    currentPage.components.forEach(component => {
      const blocks = component.scripts?.onUpdate;
      if (blocks) executeBlocks(blocks, component);
    });
    requestAnimationFrame(loop);
  };
  loop();
}, [currentPage]);
```

---

## 快速诊断命令

运行这些代码片段快速检查状态：

### 检查1: 查看组件脚本
```typescript
const page = getCurrentPage();
console.log('=== 组件脚本检查 ===');
page.components.forEach(comp => {
  console.log(`\n${comp.name}:`);
  if (comp.scripts) {
    Object.entries(comp.scripts).forEach(([trigger, blocks]) => {
      console.log(`  ${trigger}: ${blocks.length} 个积木`);
      console.log(`    类型: ${blocks.map(b => b.type).join(' → ')}`);
    });
  } else {
    console.log('  无脚本');
  }
});
```

### 检查2: 验证状态同步
```typescript
const comp = getCurrentPage().components.find(c => c.name === '僵尸');
console.log('初始位置:', comp.position);

// 更新位置
updateComponent(comp.id, { position: { x: 100, y: 100 } });

// 立即查询（应该是新位置）
const updated = getCurrentPage().components.find(c => c.id === comp.id);
console.log('更新后位置:', updated.position);
// 应该输出: { x: 100, y: 100 }
```

### 检查3: 测试目标查找
```typescript
const page = getCurrentPage();
const players = page.components.filter(c => c.gameRole?.roleType === 'player');
console.log('玩家角色:', players.map(p => p.name));

const enemies = page.components.filter(c => c.gameRole?.roleType === 'enemy');
console.log('敌人角色:', enemies.map(e => e.name));
```

---

## 最佳实践

### DO（应该做的）✅

1. **调试时添加分层日志**
   ```typescript
   console.log('[Layer1] 场景加载:', page.name);
   console.log('[Layer2] 执行脚本:', component.name, trigger);
   console.log('[Layer3] 积木序列:', blocks.map(b => b.type));
   console.log('[Layer4] 执行积木:', block.type, block.values);
   ```

2. **循环中实时查询状态**
   ```typescript
   for (const block of blocks) {
     const fresh = getCurrentPage().components.find(...);
     // 使用 fresh 而非闭包中的变量
   }
   ```

3. **优先检测功能类型**
   ```typescript
   if (hasTrackingBlock) return 'onUpdate';
   else if (hasKeyBlock) return 'onKeyDown';
   else if (hasInitBlock) return 'onGameStart';
   ```

4. **添加条件日志避免刷屏**
   ```typescript
   if (frameCount % 60 === 0) {
     console.log('...');  // 每秒输出一次
   }
   ```

5. **验证修复效果**
   - 查看位置是否逐次变化
   - 观察敌人是否持续追踪
   - 检查性能是否正常

### DON'T（不应该做的）❌

1. **不要依赖函数参数**
   ```typescript
   const executeBlocks = (blocks, component) => {
     // ❌ component 是快照
   }
   ```

2. **不要按出现顺序检测触发器**
   ```typescript
   if (blocks[0].type === 'event_sceneinit') {
     return 'onGameStart';  // ❌ 可能错过后面的追踪积木
   }
   ```

3. **不要在 onGameStart 中做持续行为**
   ```typescript
   scripts['onGameStart'] = [followTarget];  // ❌ 只执行1次
   ```

4. **不要在 onUpdate 中做一次性操作**
   ```typescript
   scripts['onUpdate'] = [initScene];  // ❌ 每帧都初始化
   ```

5. **不要忽略状态同步问题**
   - 如果位置不变，一定是状态同步问题

---

## 工具函数

### 添加到代码中的辅助函数

```typescript
/**
 * 检查积木是否需要持续执行
 */
function isContinuousBehavior(block: Block): boolean {
  const continuousTypes = [
    'motion_followtarget',
    'logic_forever',
    'event_timer',
    'game_event_update',
  ];

  const continuousKeywords = ['追踪', '跟随', '每帧'];

  return continuousTypes.includes(block.type) ||
         continuousKeywords.some(kw => block.name?.includes(kw));
}

/**
 * 智能查找目标组件
 */
function findTarget(
  components: ComponentInstance[],
  targetId?: string,
  targetName?: string
): ComponentInstance | undefined {
  // 1. 按 ID
  if (targetId) {
    const comp = components.find(c => c.id === targetId);
    if (comp) return comp;
  }

  // 2. 按名称精确匹配
  if (targetName) {
    const comp = components.find(c => c.name === targetName);
    if (comp) return comp;
  }

  // 3. 按名称模糊匹配
  if (targetName) {
    const lower = targetName.toLowerCase();
    const comp = components.find(c =>
      c.name.toLowerCase().includes(lower) ||
      lower.includes(c.name.toLowerCase())
    );
    if (comp) return comp;
  }

  // 4. 按角色类型
  const comp = components.find(c => c.gameRole?.roleType === 'player');
  if (comp) return comp;

  // 5. 按关键词
  return components.find(c => {
    const name = c.name.toLowerCase();
    return name.includes('玩家') || name.includes('player') ||
           name.includes('角色') || name.includes('character');
  });
}

/**
 * 实时获取组件（避免快照问题）
 */
function getLatestComponent(
  componentId: string,
  getCurrentPage: () => Page
): ComponentInstance | undefined {
  const page = getCurrentPage();
  return page.components.find(c => c.id === componentId);
}
```

---

## 总结

**核心原则**:
1. 功能优先于事件（检测追踪比检测初始化更重要）
2. 实时优先于快照（永远从 store 重新查询）
3. 持续优先于一次性（追踪放 onUpdate，初始化放 onGameStart）

**关键技巧**:
- 分层日志定位问题
- 对比验证修复效果
- 条件输出避免刷屏

**必查项**:
- 触发器分配是否正确
- 预览模式是否自动执行脚本
- 是否实时获取最新状态
- 持续行为是否在 onUpdate 中

遇到积木不工作的问题，按照这个 skill 的诊断流程逐项检查，通常能快速定位并修复问题！
