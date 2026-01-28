# WXML 生成器 - 快速开始

## 5分钟快速上手

### 1. 安装依赖

```bash
cd implementation
npm install
```

### 2. 运行示例

```bash
# 运行TypeScript示例（需要ts-node）
npx ts-node example.ts

# 或者编译后运行
npx tsc
node dist/example.js
```

### 3. 运行测试

```bash
# 运行所有测试
npm test

# 查看测试覆盖率
npm run test:coverage

# 监视模式
npm run test:watch

# UI模式
npm run test:ui
```

### 4. 基础使用

```typescript
import { WXMLGenerator } from './index';

// 创建页面对象
const page = {
  id: 'page-1',
  name: '我的页面',
  path: 'pages/index/index',
  config: {},
  components: [
    {
      id: 'view-1',
      type: 'view',
      properties: [
        { name: 'class', value: 'container', type: 'string' }
      ],
      children: [
        {
          id: 'text-1',
          type: 'text',
          properties: [
            { name: 'content', value: 'Hello World', type: 'string' }
          ],
          children: []
        }
      ]
    }
  ],
  data: {},
  variables: [],
  lifecycleEvents: [],
  customEvents: []
};

// 生成WXML
const result = WXMLGenerator.generate(page);

if (result.success) {
  console.log(result.code);
  // 输出:
  // <view id="view-1" class="container">
  //   <text id="text-1">Hello World</text>
  // </view>
}
```

### 5. 常见场景

#### 数据绑定

```typescript
const component = {
  id: 'input-1',
  type: 'input',
  dataBindings: [
    { property: 'value', dataPath: 'username', mode: 'twoWay' }
  ]
};

// 生成: <input id="input-1" model:value="{{username}}" />
```

#### 列表渲染

```typescript
const component = {
  id: 'item',
  type: 'view',
  listRendering: {
    dataSource: 'items',
    itemName: 'item',
    key: 'id'
  }
};

// 生成: <view id="item" wx:for="{{items}}" wx:for-item="item" wx:key="id"></view>
```

#### 条件渲染

```typescript
const component = {
  id: 'view-1',
  type: 'view',
  condition: 'isVisible'
};

// 生成: <view id="view-1" wx:if="{{isVisible}}"></view>
```

#### 事件绑定

```typescript
const component = {
  id: 'button-1',
  type: 'button',
  events: [
    { name: 'tap', handler: 'onClick' }
  ]
};

// 生成: <button id="button-1" bindtap="onClick"></button>
```

## 完整示例

查看 `example.ts` 文件，包含：
- 登录页面示例
- 商品列表页示例（列表渲染）
- 仪表盘页示例（条件渲染）
- 工具函数使用示例
- 批量生成示例

## API参考

### WXMLGenerator

```typescript
// 生成页面
WXMLGenerator.generate(page, options?)

// 生成片段
WXMLGenerator.generateFragment(component, options?)

// 批量生成
WXMLGenerator.generateMultiple(pages, options?)

// 转为字符串（失败会抛出异常）
WXMLGenerator.generateToString(page, options?)
```

### 生成选项

```typescript
{
  indent: '  ',           // 缩进字符
  addComments: true,      // 是否添加注释
  format: true,           // 是否格式化
  validate: true,         // 是否验证
  useShortSyntax: false   // 是否使用短语法
}
```

### 生成结果

```typescript
{
  code: string,           // 生成的WXML代码
  success: boolean,       // 是否成功
  errors: ValidationError[],    // 错误列表
  warnings: ValidationWarning[], // 警告列表
  componentCount: number,  // 组件数量
  duration: number        // 耗时（毫秒）
}
```

## 目录结构

```
implementation/
├── index.ts              # 主入口
├── wxml-generator.ts     # 核心生成器
├── attribute-generator.ts # 属性生成
├── binding-generator.ts  # 绑定生成
├── formatter.ts          # 代码格式化
├── validator.ts          # 验证器
├── example.ts            # 使用示例
└── tests/                # 测试文件
```

## 常见问题

### Q: 如何自定义缩进？

```typescript
const result = WXMLGenerator.generate(page, {
  indent: '    ' // 使用4个空格
});
```

### Q: 如何关闭验证？

```typescript
const result = WXMLGenerator.generate(page, {
  validate: false
});
```

### Q: 如何处理错误？

```typescript
const result = WXMLGenerator.generate(page);
if (!result.success) {
  result.errors.forEach(error => {
    console.error(`[${error.code}] ${error.message}`);
    if (error.path) {
      console.error(`  at ${error.path}`);
    }
  });
}
```

### Q: 如何生成最小化代码？

```typescript
import { Formatter } from './formatter';

const result = WXMLGenerator.generate(page);
const minified = Formatter.minify(result.code);
```

### Q: 如何只验证不生成？

```typescript
import { Validator } from './validator';

const validationResult = Validator.validateComponentTree(page.components);
if (validationResult.valid) {
  console.log('验证通过');
} else {
  console.error('验证失败', validationResult.errors);
}
```

## 下一步

1. 查看 [README.md](./README.md) 了解详细文档
2. 查看 [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) 了解实现细节
3. 查看 [架构设计](../design/architecture.md) 了解模块设计
4. 查看 [数据流](../design/dataflow.md) 了解数据处理流程

## 需要帮助？

- 查看测试文件了解更多用法: `tests/wxml-generator.test.ts`
- 查看示例文件: `example.ts`
- 阅读API文档: `README.md`

---

祝您使用愉快！🎉
