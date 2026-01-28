# WXML 生成器实现

本模块实现了微信小程序WXML模板代码生成器。

## 目录结构

```
implementation/
├── types.ts                    # 类型定义
├── wxml-generator.ts          # 主生成器
├── attribute-generator.ts     # 属性生成器
├── binding-generator.ts       # 绑定生成器
├── formatter.ts               # 代码格式化器
├── validator.ts               # 验证器
├── index.ts                   # 导出入口
├── tests/
│   └── wxml-generator.test.ts # 完整测试套件
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 核心功能

### 1. WXMLGenerator - 主生成器
- 从Page对象生成完整WXML代码
- 递归遍历组件树
- 协调各子模块工作

### 2. AttributeGenerator - 属性生成器
- 生成组件属性字符串
- 处理特殊属性（data-*等）
- 转义属性值
- 验证必填属性

### 3. BindingGenerator - 绑定生成器
- 数据绑定转换 `{{variable}}`
- 双向绑定 `model:value`
- 事件绑定 `bindtap`
- 条件和列表渲染属性

### 4. Formatter - 代码格式化器
- 生成缩进
- 美化XML结构
- 添加注释
- 最小化代码

### 5. Validator - 验证器
- 验证组件树结构
- 检查必填属性
- 验证嵌套规则
- 检查WXML有效性

## 使用示例

### 基础使用

```typescript
import { WXMLGenerator } from './wxml-generator';
import type { Page } from './types';

const page: Page = {
  id: 'page-1',
  name: '登录页',
  path: 'pages/login/index',
  components: [
    {
      id: 'form-1',
      type: 'form',
      properties: [{ name: 'class', value: 'login-form', type: 'string' }],
      children: [
        {
          id: 'input-username',
          type: 'input',
          properties: [
            { name: 'placeholder', value: '请输入用户名', type: 'string' }
          ],
          dataBindings: [
            { property: 'value', dataPath: 'username', mode: 'twoWay' }
          ],
          events: [],
          children: []
        },
        {
          id: 'btn-submit',
          type: 'button',
          properties: [{ name: 'type', value: 'primary', type: 'string' }],
          events: [{ name: 'tap', handler: 'onSubmit', params: {} }],
          children: [
            {
              id: 'text-1',
              type: 'text',
              properties: [{ name: 'content', value: '登录', type: 'string' }],
              children: []
            }
          ]
        }
      ]
    }
  ]
};

// 生成WXML
const result = WXMLGenerator.generate(page);

if (result.success) {
  console.log(result.code);
  // 输出:
  // <!-- 页面: 登录页 -->
  // <!-- 路径: pages/pages/login/index.wxml -->
  // <form id="form-1" class="login-form">
  //   <input id="input-username" placeholder="请输入用户名" model:value="{{username}}" />
  //   <button id="btn-submit" type="primary" bindtap="onSubmit">
  //     <text id="text-1">登录</text>
  //   </button>
  // </form>
} else {
  console.error('生成失败:', result.errors);
}
```

### 生成选项

```typescript
const result = WXMLGenerator.generate(page, {
  indent: '    ',           // 使用4个空格缩进
  addComments: true,        // 添加注释
  format: true,             // 格式化代码
  validate: true,           // 验证组件树
  useShortSyntax: false     // 不使用短属性语法
});
```

### 生成片段

```typescript
const component = {
  id: 'view-1',
  type: 'view',
  children: []
};

const fragment = WXMLGenerator.generateFragment(component);
// 输出: <view id="view-1"></view>
```

### 批量生成

```typescript
const pages = [page1, page2, page3];
const results = WXMLGenerator.generateMultiple(pages);

for (const [path, result] of results) {
  if (result.success) {
    console.log(`${path}: 生成成功`);
  }
}
```

## 运行测试

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 查看覆盖率
npm run test:coverage

# 监视模式
npm run test:watch

# UI模式
npm run test:ui
```

## 测试覆盖率

当前测试覆盖率：
- 语句覆盖率: >90%
- 分支覆盖率: >90%
- 函数覆盖率: >90%
- 行覆盖率: >90%

## 支持的组件

### 视图容器
- view
- scroll-view
- swiper / swiper-item
- movable-area / movable-view
- cover-view / cover-image

### 基础内容
- text
- icon
- progress

### 表单组件
- button
- checkbox / checkbox-group
- form
- input
- label
- picker
- radio / radio-group
- slider
- switch
- textarea

### 媒体组件
- image
- video
- audio
- camera

### 地图
- map

### 画布
- canvas

## 特性支持

### 数据绑定
```xml
<text>{{message}}</text>
<input value="{{username}}" />
<input model:value="{{password}}" />
```

### 条件渲染
```xml
<view wx:if="{{isVisible}}">显示</view>
<view wx:else>隐藏</view>
```

### 列表渲染
```xml
<view wx:for="{{items}}" wx:key="id">
  <text>{{item.name}}</text>
</view>
```

### 事件绑定
```xml
<button bindtap="onTap">点击</button>
<input bindinput="onInput" />
```

## API 文档

### WXMLGenerator

#### generate(page: Page, options?: WXMLGeneratorOptions): WXMLGenerationResult
生成完整的WXML代码。

#### generateFragment(component: Component, options?: WXMLGeneratorOptions): string
生成组件片段。

#### generateMultiple(pages: Page[], options?: WXMLGeneratorOptions): Map<string, WXMLGenerationResult>
批量生成多个页面。

### AttributeGenerator

#### generateAttributes(component: Component): string
生成组件的所有属性字符串。

#### escapeAttributeValue(value: string): string
转义属性值中的特殊字符。

#### isSelfClosing(componentType: string): boolean
判断组件是否是自闭合标签。

### BindingGenerator

#### toBindingExpression(dataPath: string): string
将数据路径转换为绑定表达式。

#### generateEventBinding(event: ComponentEvent, componentId: string): string
生成事件绑定属性。

#### isValidBinding(expression: string): boolean
验证绑定表达式是否有效。

### Formatter

#### indent(level: number, indent?: string): string
生成缩进字符串。

#### format(wxml: string, options?: FormatterOptions): string
格式化WXML代码。

#### minify(wxml: string): string
最小化WXML代码。

### Validator

#### validateComponentTree(components: Component[]): ValidationResult
验证组件树。

#### validateWXML(wxml: string): ValidationResult
验证生成的WXML代码。

## 错误处理

生成器会检测以下错误：
- 重复的组件ID
- 缺少必填属性
- 无效的嵌套关系
- 无效的数据绑定
- 不匹配的标签
- 未关闭的标签

## 警告信息

生成器会发出以下警告：
- 空的text组件
- 空的button组件
- 子组件过多（>10个）
- 未使用的属性

## 注意事项

1. 组件ID必须唯一
2. 必填属性必须提供
3. 遵循微信小程序嵌套规则
4. 数据路径格式要正确
5. 事件处理函数名要符合规范

## 贡献指南

1. 确保所有测试通过
2. 保持测试覆盖率>90%
3. 遵循TypeScript最佳实践
4. 添加必要的注释和文档

## 版本历史

### 1.0.0 (2026-01-23)
- 初始版本
- 支持所有微信小程序基础组件
- 完整的测试套件
- 高测试覆盖率
