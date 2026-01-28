# 积木执行引擎实现方案

## 日期
2026-01-26

## 背景

项目已经具备完整的游戏引擎架构：
- ✅ GameEngine - 主引擎
- ✅ BlockExecutor - 积木执行器
- ✅ EventSystem - 事件系统
- ✅ GameStateManager - 状态管理器
- ✅ GameLoop - 游戏循环

当前问题：
- ❌ BlockExecutor 中只有旧的积木处理器
- ❌ 新的109个积木（10模块）还没有对应的执行处理器
- ❌ 用户无法让拖拽到工作区的积木真正执行

## 目标

为新的109个积木添加完整的执行处理器，让积木能够：
1. 控制素材的位置、大小、旋转等属性
2. 响应用户交互事件（点击、按键等）
3. 执行游戏逻辑（条件判断、循环、变量等）
4. 实现视觉效果（动画、特效、声音等）
5. 处理数据存储和网络请求

---

## 10大模块积木映射表

### 1. 状态管理模块 (state) - 14个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| state_setscore | 设置得分 | 更新游戏分数 |
| state_addscore | 增加得分 | 增加游戏分数 |
| state_getscore | 获取得分 | 返回当前分数 |
| state_setlives | 设置生命值 | 更新生命值 |
| state_loselife | 失去生命 | 减少生命值 |
| state_getlives | 获取生命值 | 返回生命值 |
| state_setlevel | 设置关卡 | 更新当前关卡 |
| state_getlevel | 获取关卡 | 返回当前关卡 |
| state_settime | 设置时间 | 更新游戏时间 |
| state_gettime | 获取时间 | 返回游戏时间 |
| state_setvariable | 创建变量 | 创建全局变量 |
| state_getvariable | 获取变量 | 读取变量值 |
| state_savestate | 保存状态到本地 | 保存到LocalStorage |
| state_loadstate | 从本地加载状态 | 从LocalStorage加载 |

### 2. 事件系统模块 (event) - 8个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| event_gamestart | 当游戏开始 | 标记脚本触发器 |
| event_click | 当点击时 | 响应点击事件 |
| event_keydown | 当按键按下 | 响应键盘按下 |
| event_keyup | 当按键松开 | 响应键盘松开 |
| event_collision | 当碰撞时 | 响应碰撞事件 |
| event_message | 当收到消息 | 响应消息事件 |
| event_timer | 定时触发 | 定时执行脚本 |
| event_custom | 自定义事件 | 自定义事件触发 |

### 3. 运动控制模块 (motion) - 8个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| motion_moveto | 移动到坐标 | 瞬间移动 |
| motion_easeto | 平滑移动到 | 缓动动画移动 |
| motion_moveforward | 定向移动 | 沿当前方向移动 |
| motion_setvelocity | 设置速度 | 设置移动速度 |
| motion_rotate | 旋转角度 | 相对旋转 |
| motion_rotateto | 旋转到角度 | 绝对旋转 |
| motion_pointto | 指向位置 | 转向目标点 |
| motion_bounce | 边界反弹 | 碰到边界反弹 |

### 4. 外观声音模块 (looks) - 7个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| looks_show | 显示 | 显示对象 |
| looks_hide | 隐藏 | 隐藏对象 |
| looks_setsize | 设置大小 | 改变尺寸 |
| looks_setcostume | 切换外观 | 切换图片/外观 |
| looks_saybubble | 显示对话气泡 | 显示文本气泡 |
| looks_emitparticles | 发射粒子特效 | 粒子效果 |
| looks_playsound | 播放声音 | 播放音频 |

### 5. 侦测物理模块 (sensing) - 8个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| sensing_touchingobject | 碰到角色 | 碰撞检测 |
| sensing_touchingcolor | 碰到颜色 | 颜色碰撞检测 |
| sensing_distanceto | 距离检测 | 计算距离 |
| sensing_angleto | 计算角度 | 计算方向角 |
| sensing_getposition | 获取位置 | 返回坐标 |
| sensing_raycast | 射线检测 | 发射射线 |
| sensing_applyforce | 施加力 | 施加物理力 |
| sensing_setgravity | 设置重力 | 设置重力参数 |

### 6. 特效系统模块 (effects) - 7个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| effects_settransparency | 设置透明度 | 设置alpha值 |
| effects_setblur | 设置模糊效果 | 模糊滤镜 |
| effects_setbrightness | 设置亮度 | 亮度调整 |
| effects_shake | 震动效果 | 抖动动画 |
| effects_flash | 闪烁效果 | 闪烁动画 |
| effects_fadein | 淡入效果 | 渐显动画 |
| effects_fadeout | 淡出效果 | 渐隐动画 |

### 7. 逻辑运算模块 (logic) - 12个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| logic_if | 如果条件 | 条件分支 |
| logic_ifelse | 如果否则 | 双分支 |
| logic_switch | 根据值选择 | 多条件分支 |
| logic_repeat | 重复执行 | 循环N次 |
| logic_forever | 无限循环 | 永久循环 |
| logic_while | 当条件成立 | while循环 |
| logic_foreach | 遍历列表 | for-each循环 |
| logic_parallel | 同时执行 | 并行执行 |
| logic_waituntil | 等待直到 | 等待条件 |
| logic_wait | 等待时间 | 延迟执行 |
| logic_stop | 停止脚本 | 中断执行 |
| logic_stopall | 停止所有 | 停止所有脚本 |

### 8. 运算数据模块 (data) - 13个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| data_number | 数字 | 返回数字值 |
| data_string | 文本 | 返回字符串 |
| data_boolean | 布尔值 | 返回true/false |
| data_add | 加法 | a + b |
| data_subtract | 减法 | a - b |
| data_multiply | 乘法 | a * b |
| data_divide | 除法 | a / b |
| data_random | 随机数 | 生成随机数 |
| data_compare | 比较运算 | ==, !=, >, < |
| data_and | 逻辑与 | a && b |
| data_or | 逻辑或 | a \|\| b |
| data_not | 逻辑非 | !a |
| data_join | 文本拼接 | 字符串连接 |

### 9. 数据存储模块 (storage) - 14个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| storage_createvar | 创建变量 | 创建局部变量 |
| storage_setvar | 修改变量 | 更新变量值 |
| storage_getvar | 读取变量 | 获取变量值 |
| storage_createlist | 创建列表 | 创建数组 |
| storage_addtolist | 添加到列表 | push元素 |
| storage_removefromlist | 从列表删除 | 删除元素 |
| storage_getfromlist | 获取列表元素 | 读取元素 |
| storage_listlength | 列表长度 | array.length |
| storage_createobject | 创建对象 | 创建对象 |
| storage_setproperty | 设置属性 | 设置对象属性 |
| storage_getproperty | 获取属性 | 读取对象属性 |
| storage_savetostorage | 保存到本地存储 | localStorage |
| storage_loadfromstorage | 从本地存储加载 | localStorage |
| storage_clearstorage | 清空本地存储 | 清空数据 |

### 10. 扩展功能模块 (extension) - 18个积木

| BlockType | 积木名称 | 需要实现的功能 |
|-----------|---------|--------------|
| ext_request | 网络请求 | HTTP请求 |
| ext_websocket | WebSocket连接 | WebSocket |
| ext_upload | 上传文件 | 文件上传 |
| ext_download | 下载文件 | 文件下载 |
| ext_camera | 打开相机 | 调用相机 |
| ext_location | 获取位置 | GPS定位 |
| ext_vibrate | 设备震动 | 触感反馈 |
| ext_microphone | 录制音频 | 麦克风录音 |
| ext_compass | 获取方向 | 指南针 |
| ext_accelerometer | 获取加速度 | 加速度计 |
| ext_scan | 扫描二维码 | 二维码扫描 |
| ext_share | 分享内容 | 分享功能 |
| ext_payment | 发起支付 | 支付功能 |
| ext_ad | 显示广告 | 广告SDK |
| ext_analytics | 数据统计 | 埋点统计 |
| ext_ai_chat | AI对话 | AI聊天 |
| ext_ai_image | AI生成图片 | AI图像 |
| ext_ai_speech | AI语音识别 | 语音识别 |

---

## 实现策略

### 阶段1：核心功能积木（高优先级）

**优先实现以下模块，让基础游戏逻辑可以运行：**

1. **事件系统** (8个) - 让积木能响应事件
2. **运动控制** (8个) - 让素材能移动
3. **外观声音** (7个) - 让素材能显示/隐藏
4. **逻辑运算** (12个) - 让游戏有逻辑
5. **运算数据** (13个) - 基础数据运算

**预计工作量：48个积木，约2-3小时**

### 阶段2：游戏增强积木（中优先级）

6. **状态管理** (14个) - 游戏状态持久化
7. **侦测物理** (8个) - 碰撞和物理
8. **特效系统** (7个) - 视觉效果
9. **数据存储** (14个) - 数据持久化

**预计工作量：43个积木，约2-3小时**

### 阶段3：扩展功能积木（低优先级）

10. **扩展功能** (18个) - 网络、设备、AI等高级功能

**预计工作量：18个积木，约2-3小时**

---

## 实现方式

### 方式1：扩展现有的 BlockExecutor.ts（推荐）

**优点**：
- 保持代码集中
- 复用现有基础设施
- 容易维护

**实现步骤**：
1. 在 BlockExecutor.registerBuiltinHandlers() 中添加新的处理器
2. 按照现有格式注册每个积木的handler
3. 实现每个积木的具体逻辑

**示例代码**：
```typescript
// 在 registerBuiltinHandlers() 中添加

// ========== 状态管理模块 ==========
this.registerHandler('state_setscore', async (block, context) => {
  const score = Number(this.getValue(block, 'score', context)) || 0;
  this.stateManager.setScore(score);
  return { success: true };
});

this.registerHandler('state_addscore', async (block, context) => {
  const amount = Number(this.getValue(block, 'amount', context)) || 0;
  this.stateManager.addScore(amount);
  return { success: true };
});

// ========== 运动控制模块 ==========
this.registerHandler('motion_moveto', async (block, context) => {
  const obj = context.gameObject;
  const x = Number(this.getValue(block, 'x', context)) || 0;
  const y = Number(this.getValue(block, 'y', context)) || 0;
  obj.position.x = x;
  obj.position.y = y;
  return { success: true };
});

// ... 继续添加其他处理器
```

### 方式2：模块化设计（适用于大型项目）

创建独立的 handler 模块文件：
- `handlers/StateHandlers.ts`
- `handlers/EventHandlers.ts`
- `handlers/MotionHandlers.ts`
- 等等...

然后在 BlockExecutor 中导入和注册。

---

## 测试方案

### 单元测试
```typescript
// 测试示例
describe('BlockExecutor - State Handlers', () => {
  it('should set score correctly', async () => {
    const executor = new BlockExecutor(eventSystem, stateManager);
    const block = { type: 'state_setscore', values: { score: 100 } };
    await executor.executeBlock(block, context);
    expect(stateManager.getScore()).toBe(100);
  });
});
```

### 集成测试
1. 在编辑器中拖拽积木
2. 保存到组件的 scripts 属性
3. 运行游戏引擎
4. 验证积木是否正确执行

---

## 相关文件

### 需要修改的文件
- ✅ `src/engine/BlockExecutor.ts` - 添加109个积木的处理器

### 可能需要扩展的文件
- `src/engine/GameStateManager.ts` - 可能需要添加新的状态管理方法
- `src/engine/EventSystem.ts` - 可能需要添加新的事件类型
- `src/types/engine.ts` - 可能需要扩展类型定义

### 相关文档
- `BLOCK_NAMING_UPDATE_REPORT.md` - 积木命名报告
- `BLOCK_LIBRARY_EXPANSION_REPORT.md` - 积木库扩展报告

---

## 下一步行动

**用户需要决定**：
1. ⭐ **立即开始实现**？
   - 我可以立即开始为109个积木添加执行处理器
   - 建议按阶段实现（核心功能 → 游戏增强 → 扩展功能）

2. 📋 **先实现核心功能**？
   - 先实现阶段1的48个积木，让基础游戏能运行
   - 然后根据需求逐步添加其他功能

3. 🎯 **针对特定场景实现**？
   - 如果你有特定的游戏场景或需求
   - 可以优先实现你需要的积木

**推荐方案**：从阶段1开始，先让基础游戏逻辑能够运行起来。

---

**制定日期**: 2026-01-26
**制定人**: Claude AI Assistant
**版本**: v1.0
