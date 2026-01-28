# 模块 09: WXML 生成器 (WXML Generator)

## 📋 模块概述

**功能**: 将组件树转换为微信小程序的 WXML 模板代码。

**来源**: GDevelop GDJS - `GDJS/GDJS/Events/CodeGeneration/`

**迁移优先级**: 🔴 **高** - 核心输出，决定最终代码质量

**预估工作量**: 2-3 周

**复用度**: 20% (代码生成思想可复用，具体实现需重写)

---

## 🎯 核心功能

### 1. 组件树遍历
- 递归遍历组件树
- 生成嵌套的 XML 结构
- 保持组件层级关系

### 2. 属性转换
- 组件属性 → WXML 属性
- 数据绑定 ({{variable}})
- 事件绑定 (bindtap="handler")
- 条件渲染 (wx:if, wx:elif, wx:else)
- 列表渲染 (wx:for, wx:for-item)

### 3. 代码格式化
- 正确缩进
- 可读性优化
- 注释生成

---

## 📂 GDevelop 源码位置

```
GDJS/GDJS/Events/CodeGeneration/
├── CodeGenerator.h / .cpp       # 代码生成器基类
├── EventCodeGenerator.h / .cpp  # 事件代码生成
└── EventsCodeGenerationContext.h

newIDE/app/src/ExportAndShare/
└── GenericExporters/              # 导出器实现

参考思想:
- 遍历事件树
- 生成代码字符串
- 处理嵌套和缩进
- 变量引用处理
```

---

## 🔧 核心接口

```typescript
// WXML 生成器主类
export class WXMLGenerator {
  // 生成整个页面的 WXML
  static generate(page: Page): string;

  // 生成组件树的 WXML
  static generateComponents(components: Component[], indent: number): string;

  // 生成单个组件的 WXML
  static generateComponent(component: Component, indent: number): string;

  // 生成组件属性
  static generateAttributes(component: Component): string;

  // 生成事件绑定
  static generateEventBindings(component: Component): string;

  // 生成数据绑定
  static generateDataBindings(component: Component): string;

  // 生成条件渲染
  static generateConditionalRendering(component: Component): string;

  // 生成列表渲染
  static generateListRendering(component: Component): string;
}

// 代码格式化工具
export class CodeFormatter {
  static indent(level: number): string;
  static formatXML(xml: string): string;
}
```

---

## 💡 实现示例

### 输入: 组件树

```typescript
const page: Page = {
  id: 'page_1',
  name: '登录页',
  path: 'pages/login/login',
  components: [
    {
      id: 'view_1',
      type: 'view',
      properties: [
        { name: 'class', value: 'container' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'input_username',
          type: 'input',
          properties: [
            { name: 'placeholder', value: '请输入用户名' },
            { name: 'model:value', value: 'username' } // 双向绑定
          ],
          events: [],
          children: [],
          dataBindings: [
            { type: 'model', property: 'value', variable: 'username' }
          ]
        },
        {
          id: 'button_submit',
          type: 'button',
          properties: [
            { name: 'type', value: 'primary' }
          ],
          events: [
            {
              id: 'event_1',
              type: 'bindtap',
              actions: [/* ... */]
            }
          ],
          children: [
            {
              id: 'text_1',
              type: 'text',
              properties: [
                { name: 'content', value: '登录' }
              ],
              children: []
            }
          ]
        }
      ]
    }
  ]
};
```

### 输出: WXML 代码

```xml
<!-- pages/login/login.wxml -->
<view class="container">
  <input
    id="input_username"
    placeholder="请输入用户名"
    model:value="{{username}}"
    class="input_username-style"
  />
  <button
    id="button_submit"
    type="primary"
    bindtap="onbutton_submittap"
    class="button_submit-style"
  >
    <text>登录</text>
  </button>
</view>
```

---

## 🔄 代码生成流程

```
Page
  ↓
[1] 遍历组件树
  ↓
[2] 对每个组件:
    - 生成开始标签 <view>
    - 生成属性 class="..."
    - 生成事件绑定 bindtap="..."
    - 生成数据绑定 model:value="{{...}}"
    - 递归生成子组件
    - 生成结束标签 </view>
  ↓
[3] 格式化代码
  ↓
[4] 输出 .wxml 文件
```

---

## 📝 核心实现

```typescript
// implementation/wxml-generator.ts

export class WXMLGenerator {
  static generate(page: Page): string {
    const components = page.components;
    const wxml = `<!-- pages/${page.path}.wxml -->\n<view class="page-container">\n${this.generateComponents(components, 1)}</view>`;
    return CodeFormatter.formatXML(wxml);
  }

  static generateComponents(components: Component[], indent: number): string {
    return components
      .map(comp => this.generateComponent(comp, indent))
      .join('\n');
  }

  static generateComponent(component: Component, indent: number): string {
    const indentStr = CodeFormatter.indent(indent);
    const tag = component.type; // 'view', 'text', 'button', etc.

    // 生成属性
    const attrs = this.generateAttributes(component);

    // 生成子组件或内容
    let content = '';
    if (component.children.length > 0) {
      content = '\n' + this.generateComponents(component.children, indent + 1) + '\n' + indentStr;
    } else if (component.type === 'text') {
      // 文本组件的内容
      const textContent = component.properties.find(p => p.name === 'content')?.value || '';
      content = textContent;
    }

    // 生成完整标签
    if (content || component.children.length > 0) {
      return `${indentStr}<${tag}${attrs}>${content}</${tag}>`;
    } else {
      // 自闭合标签
      return `${indentStr}<${tag}${attrs} />`;
    }
  }

  static generateAttributes(component: Component): string {
    let attrs = '';

    // ID
    if (component.id) {
      attrs += ` id="${component.id}"`;
    }

    // 普通属性
    for (const prop of component.properties) {
      if (prop.name === 'content') continue; // 文本内容单独处理

      let value = prop.value;

      // 检查是否是数据绑定
      if (this.isDataBinding(prop.name)) {
        value = `{{${value}}}`;
      }

      attrs += ` ${prop.name}="${value}"`;
    }

    // 数据绑定
    for (const binding of component.dataBindings || []) {
      if (binding.type === 'model') {
        attrs += ` model:${binding.property}="{{${binding.variable}}}"`;
      } else if (binding.type === 'one-way') {
        attrs += ` ${binding.property}="{{${binding.variable}}}"`;
      }
    }

    // 事件绑定
    for (const event of component.events) {
      const handlerName = this.getEventHandlerName(component, event);
      attrs += ` ${event.type}="${handlerName}"`;
    }

    // 条件渲染
    if (component.conditionalRendering) {
      attrs += ` wx:if="{{${component.conditionalRendering.condition}}}"`;
    }

    // 列表渲染
    if (component.listRendering) {
      attrs += ` wx:for="{{${component.listRendering.list}}}"`;
      attrs += ` wx:for-item="${component.listRendering.item || 'item'}"`;
      attrs += ` wx:for-index="${component.listRendering.index || 'index'}"`;
      attrs += ` wx:key="${component.listRendering.key || 'index'}"`;
    }

    // 样式类
    if (component.style && Object.keys(component.style).length > 0) {
      attrs += ` class="${component.id}-style"`;
    }

    return attrs;
  }

  static getEventHandlerName(component: Component, event: any): string {
    // 生成事件处理函数名: on{componentId}{eventType}
    // 例如: onbutton_1tap
    return `on${component.id}${event.type.replace('bind', '')}`;
  }

  static isDataBinding(propertyName: string): boolean {
    // 某些属性需要数据绑定
    const bindingProperties = ['value', 'checked', 'disabled', 'loading', 'hidden'];
    return bindingProperties.includes(propertyName);
  }
}

// 代码格式化工具
export class CodeFormatter {
  static indent(level: number): string {
    return '  '.repeat(level);
  }

  static formatXML(xml: string): string {
    // 简单的 XML 格式化
    // 实际项目中可使用 prettier 或 xml-formatter
    return xml;
  }
}
```

---

## 🧪 测试用例

```typescript
// implementation/tests/wxml-generator.test.ts

import { describe, it, expect } from 'vitest';
import { WXMLGenerator } from '../wxml-generator';

describe('WXMLGenerator', () => {
  it('should generate simple view component', () => {
    const component: Component = {
      id: 'view_1',
      type: 'view',
      properties: [],
      children: [],
      events: [],
      style: {}
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('<view id="view_1"');
  });

  it('should generate text component with content', () => {
    const component: Component = {
      id: 'text_1',
      type: 'text',
      properties: [
        { name: 'content', value: 'Hello World' }
      ],
      children: [],
      events: [],
      style: {}
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('<text id="text_1">Hello World</text>');
  });

  it('should generate event bindings', () => {
    const component: Component = {
      id: 'button_1',
      type: 'button',
      properties: [],
      children: [],
      events: [
        { id: 'e1', type: 'bindtap', actions: [] }
      ],
      style: {}
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('bindtap="onbutton_1tap"');
  });

  it('should generate data bindings', () => {
    const component: Component = {
      id: 'input_1',
      type: 'input',
      properties: [],
      children: [],
      events: [],
      style: {},
      dataBindings: [
        { type: 'model', property: 'value', variable: 'username' }
      ]
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('model:value="{{username}}"');
  });

  it('should generate nested components', () => {
    const component: Component = {
      id: 'view_1',
      type: 'view',
      properties: [],
      children: [
        {
          id: 'text_1',
          type: 'text',
          properties: [{ name: 'content', value: 'Child' }],
          children: [],
          events: [],
          style: {}
        }
      ],
      events: [],
      style: {}
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('<view');
    expect(wxml).toContain('<text');
    expect(wxml).toContain('</text>');
    expect(wxml).toContain('</view>');
  });

  it('should generate conditional rendering', () => {
    const component: Component = {
      id: 'view_1',
      type: 'view',
      properties: [],
      children: [],
      events: [],
      style: {},
      conditionalRendering: {
        condition: 'isVisible'
      }
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('wx:if="{{isVisible}}"');
  });

  it('should generate list rendering', () => {
    const component: Component = {
      id: 'view_1',
      type: 'view',
      properties: [],
      children: [],
      events: [],
      style: {},
      listRendering: {
        list: 'items',
        item: 'item',
        index: 'idx',
        key: 'id'
      }
    };

    const wxml = WXMLGenerator.generateComponent(component, 0);
    expect(wxml).toContain('wx:for="{{items}}"');
    expect(wxml).toContain('wx:for-item="item"');
    expect(wxml).toContain('wx:for-index="idx"');
    expect(wxml).toContain('wx:key="id"');
  });
});
```

---

## ⚠️ 注意事项

### 必须处理的情况
- ✅ 自闭合标签 (`<input />`)
- ✅ 转义特殊字符 (`<`, `>`, `&`)
- ✅ 保留组件层级关系
- ✅ 正确缩进
- ✅ 数据绑定语法 `{{}}`

### 微信小程序限制
- ⚠️ 不支持 `<script>` 标签
- ⚠️ 不支持 `style` 属性 (需用 class)
- ⚠️ 组件名称不能冲突
- ⚠️ 事件名称必须符合规范

---

## 📊 与 GDevelop 的对比

| GDevelop | 微信小程序平台 | 变化 |
|---------|--------------|------|
| 生成 JavaScript 代码 | 生成 WXML 模板 | 完全不同 |
| 事件驱动 | 声明式模板 | 范式不同 |
| 代码可执行 | 模板需编译 | 运行方式不同 |

**GDevelop 代码生成器思想可复用**:
- ✓ 遍历结构树
- ✓ 递归生成代码
- ✓ 处理嵌套和缩进
- ✓ 变量引用解析

---

## 🚀 实现步骤

1. [ ] 实现基础组件树遍历
2. [ ] 实现属性转换
3. [ ] 实现事件绑定生成
4. [ ] 实现数据绑定生成
5. [ ] 实现条件渲染生成
6. [ ] 实现列表渲染生成
7. [ ] 实现代码格式化
8. [ ] 编写完整测试

---

## 📦 相关模块

**依赖**:
- 01_Core_ProjectStructure

**被依赖**:
- 14_Export_MiniProgramExporter

**配合**:
- 10_CodeGenerator_WXSSGenerator
- 11_CodeGenerator_JSGenerator

---

最后更新: 2026-01-23
