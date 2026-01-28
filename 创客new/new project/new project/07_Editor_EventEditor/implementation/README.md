# 事件编辑器模块 (07_Editor_EventEditor)

## 概述

事件编辑器是微信小程序可视化开发平台的核心编辑功能模块,提供可视化的事件-条件-动作编程界面。

## 功能特性

### 核心功能
- ✅ 事件树管理(增删改查)
- ✅ 拖拽排序
- ✅ 条件编辑器(类型选择、参数编辑、条件组合)
- ✅ 动作编辑器(类型选择、参数编辑)
- ✅ 参数值来源切换(常量/变量/表达式)
- ✅ 历史记录(撤销/重做)
- ✅ 完整验证系统
- ✅ 自动补全支持

### 设计文档
- `design/architecture.md` - UI架构设计
- `design/dataflow.md` - 数据流设计

## 实现状态

### 已完成
- ✅ 类型定义 (`types.ts`)
- ✅ 事件编辑器核心 (`event-editor.ts`)
- ✅ 条件编辑器 (`condition-editor.ts`)
- ✅ 动作编辑器 (`action-editor.ts`)
- ✅ 参数字段组件 (`parameter-fields.ts`)
- ✅ 完整测试套件 (覆盖率 > 90%)

### 待实现
- ⏳ React组件 (EventEditor.tsx, EventsTree.tsx, ConditionEditor.tsx等)
- ⏳ AutoComplete组件
- ⏳ 表达式编辑器UI组件

## 快速开始

### 安装依赖

```bash
cd implementation
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage

# UI模式
npm run test:ui
```

### 基本使用

```typescript
import { EventEditor } from './event-editor';
import { ConditionEditor, DEFAULT_CONDITION_TYPES } from './condition-editor';
import { ActionEditor, DEFAULT_ACTION_TYPES } from './action-editor';

// 创建事件编辑器
const editor = new EventEditor();

// 添加事件
const eventResult = editor.addEvent(null, { type: 'standard' });
const eventId = eventResult.data!.id;

// 添加条件
const conditionEditor = new ConditionEditor(DEFAULT_CONDITION_TYPES);
const conditionResult = conditionEditor.createCondition('comparison');
editor.addCondition(eventId, conditionResult.data);

// 添加动作
const actionEditor = new ActionEditor(DEFAULT_ACTION_TYPES);
const actionResult = actionEditor.createAction('setData');
editor.addAction(eventId, actionResult.data);

// 获取所有事件
const events = editor.getEvents();

// 验证
const validation = editor.validateEvent(eventId);
if (!validation.valid) {
  console.error('验证失败:', validation.errors);
}

// 撤销/重做
editor.undo();
editor.redo();
```

## 架构说明

### 核心类

#### EventEditor
管理事件树的核心操作:
- 事件的增删改查
- 拖拽排序
- 条件和动作管理
- 历史记录
- 验证

#### ConditionEditor
条件编辑器:
- 条件类型注册
- 条件创建和验证
- 复合条件(AND/OR)

#### ActionEditor
动作编辑器:
- 动作类型注册
- 动作创建和验证

#### ParameterFieldManager
参数字段管理器:
- 参数值来源切换
- 参数验证
- 显示值格式化

### 数据流

```
用户交互 → EventEditor → 状态管理 → 验证 → UI更新
```

详见: `design/dataflow.md`

## 测试

### 测试覆盖

```bash
npm run test:coverage
```

测试覆盖率目标: > 90%

### 测试文件
- `tests/event-editor.test.ts` - 事件编辑器测试
- `tests/condition-editor.test.ts` - 条件编辑器测试
- `tests/action-editor.test.ts` - 动作编辑器测试
- `tests/parameter-fields.test.ts` - 参数字段测试

## 与其他模块的集成

### 与 02_Core_EventSystem 的集成
- 使用事件系统的类型定义
- 使用验证器
- 提供编辑后的事件数据

### 与 03_Core_VariableSystem 的集成
- 获取可用变量列表
- 验证变量引用
- 支持变量路径访问

### 与 01_Core_ProjectStructure 的集成
- 加载和保存页面事件
- 提供编辑的事件给项目结构

## API文档

详见类型定义文件: `types.ts`

## 技术栈

- TypeScript 4.9+
- Vitest (测试框架)
- UUID (ID生成)

## 贡献指南

1. 遵循现有代码风格
2. 编写完整的单元测试
3. 确保测试覆盖率 > 90%
4. 更新相关文档

## 许可证

MIT

---

**版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
