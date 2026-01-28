# 模块 03: 变量系统 (Variable System)

## 📋 模块概述

**功能**: 管理全局、页面、组件级别的变量和状态，支持数据绑定和双向更新。

**来源**: GDevelop Core 中的 `gd::Variable`, `gd::VariablesContainer`

**迁移优先级**: 🟡 **中** - 数据管理必需

**预估工作量**: 2 周

**复用度**: 90% (逻辑可直接复用，只需适配微信小程序)

---

## 🎯 核心功能

- 变量创建/删除/查询
- 全局变量、页面变量、组件变量
- 支持基本类型 (string, number, boolean)
- 支持复杂类型 (对象、数组)
- 变量初值设置
- 变量监听和双向绑定

---

## 🔧 核心接口

```typescript
export interface Variable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  initialValue: any;
  description?: string;
}

export class VariableContainer {
  addVariable(variable: Variable): void;
  removeVariable(variableId: string): void;
  getVariable(variableId: string): Variable | undefined;
  getVariableByName(name: string): Variable | undefined;
  getAllVariables(): Variable[];
  updateVariable(variableId: string, value: any): void;
}

export interface VariableScope {
  scope: 'global' | 'page' | 'component';
  entityId?: string; // page id or component id
}
```

---

## 📝 GDevelop 源码

```
Core/GDCore/Project/
├── Variable.h / Variable.cpp
└── VariablesContainer.h / VariablesContainer.cpp
```

---

## 🔄 迁移要点

1. **直接复用**: 变量逻辑基本不变
2. **适配微信**: 变量初值对应 Page.data
3. **三层结构**: 全局 → 页面 → 组件变量
4. **数据绑定**: 与组件属性关联

---

## 📚 参考资源

- GDevelop Variable API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_variable.html
- 微信小程序 data: https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page.html

---

最后更新: 2026-01-23
