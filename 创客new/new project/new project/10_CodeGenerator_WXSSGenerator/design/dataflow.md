# WXSS生成器 - 数据流设计

## 1. 总体数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         输入数据                                  │
│  - Component[] (组件树)                                          │
│  - Theme (主题配置)                                              │
│  - WXSSGenerateOptions (生成选项)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      WXSSGenerator                               │
│  1. 验证输入数据                                                 │
│  2. 提取组件样式                                                 │
│  3. 收集CSS变量                                                  │
│  4. 调用StyleCompiler编译                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      StyleCompiler                               │
│  1. 遍历每个组件样式                                            │
│  2. 生成CSS选择器                                               │
│  3. 编译样式属性                                                │
│  4. 转换单位 (rpx处理)                                          │
│  5. 处理嵌套规则                                                │
│  6. 展开混合                                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CSSRule[] (中间表示)                        │
│  {                                                               │
│    selector: string,                                             │
│    properties: { [key: string]: string },                       │
│    media?: string,                                               │
│    nested?: CSSRule[]                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      ┌───────┴───────┐
                      ↓               ↓
        ┌─────────────────┐   ┌──────────────┐
        │  ThemeManager   │   │ CSSValidator │
        │  (主题变量处理) │   │  (验证检查)  │
        └─────────────────┘   └──────────────┘
                      ↓               ↓
                      └───────┬───────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CSSFormatter                                │
│  1. 合并相同选择器                                              │
│  2. 优化属性值                                                  │
│  3. 格式化/压缩输出                                             │
│  4. 生成源映射(可选)                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        输出数据                                  │
│  - WXSS字符串                                                   │
│  - SourceMap (可选)                                             │
│  - ValidationResult                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 详细数据流

### 2.1 组件样式提取流程

```typescript
输入: Component[]

步骤1: 遍历组件树
Component {
  id: 'comp-123',
  type: 'view',
  style: {
    width: '100%',
    padding: '20rpx',
    backgroundColor: '#ffffff'
  },
  children: [...]
}

步骤2: 生成选择器
selector = `.${component.type}-${component.id}`
// 结果: '.view-comp-123'

步骤3: 提取样式对象
styleObj = {
  width: '100%',
  padding: '20rpx',
  backgroundColor: '#ffffff'
}

步骤4: 构建中间表示
CSSRule {
  selector: '.view-comp-123',
  properties: {
    width: '100%',
    padding: '20rpx',
    'background-color': '#ffffff'
  }
}

输出: CSSRule[]
```

### 2.2 样式编译流程

```typescript
输入: ComponentStyle

{
  width: '200rpx',
  fontSize: '14px',
  padding: '10',
  margin: '5rpx 10rpx',
  backgroundColor: 'var(--primary-color)',
  nested: {
    '.header': {
      fontSize: '16px'
    }
  }
}

步骤1: 属性名转换 (camelCase → kebab-case)
width → width
fontSize → font-size
backgroundColor → background-color

步骤2: 单位处理
'200rpx' → '200rpx' (保留)
'14px' → '14px' (保留)
'10' → '10rpx' (添加默认单位)

步骤3: 值处理
'var(--primary-color)' → 保留CSS变量
'#ffffff' → '#fff' (可选优化)

步骤4: 嵌套展开
'.parent' {
  width: 200rpx;

  '.header' {
    font-size: 16px;
  }
}

展开为:
[
  {
    selector: '.parent',
    properties: { width: '200rpx' }
  },
  {
    selector: '.parent .header',
    properties: { 'font-size': '16px' }
  }
]

输出: CSSRule[]
```

### 2.3 rpx单位转换流程

```typescript
输入: 样式值

示例值:
- '200rpx'
- '14px'
- '10'
- '50%'
- 'calc(100% - 20rpx)'

处理逻辑:
function processUnit(value: string, property: string): string {
  // 1. 已有单位 → 保留
  if (hasUnit(value)) {
    return value;
  }

  // 2. 纯数字 → 添加默认单位
  if (isNumeric(value)) {
    const defaultUnit = getDefaultUnit(property);
    return `${value}${defaultUnit}`;
  }

  // 3. 特殊值 → 保留
  if (isKeyword(value)) {  // auto, inherit, initial
    return value;
  }

  // 4. 函数值 → 递归处理
  if (isFunction(value)) {  // calc(), var()
    return value;
  }

  return value;
}

默认单位规则:
- fontSize, lineHeight → px
- 其他尺寸属性 → rpx

输出: 带单位的字符串
```

### 2.4 主题变量注入流程

```typescript
输入: Theme + CSSRule[]

Theme {
  name: 'light',
  colors: {
    primary: '#007aff',
    secondary: '#5856d6',
    text: '#000000'
  },
  spacing: {
    sm: '10rpx',
    md: '20rpx',
    lg: '30rpx'
  }
}

步骤1: 生成CSS变量声明
:root {
  --color-primary: #007aff;
  --color-secondary: #5856d6;
  --color-text: #000000;
  --spacing-sm: 10rpx;
  --spacing-md: 20rpx;
  --spacing-lg: 30rpx;
}

步骤2: 替换样式中的主题引用
原始:
{
  color: 'theme(colors.primary)',
  padding: 'theme(spacing.md)'
}

替换后:
{
  color: 'var(--color-primary)',
  padding: 'var(--spacing-md)'
}

步骤3: 合并到CSSRule[]
[
  {
    selector: ':root',
    properties: {
      '--color-primary': '#007aff',
      '--color-secondary': '#5856d6',
      ...
    }
  },
  ...其他规则
]

输出: 包含主题变量的CSSRule[]
```

### 2.5 响应式处理流程

```typescript
输入: 响应式样式配置

{
  base: {
    fontSize: '14px',
    padding: '10rpx'
  },
  breakpoints: {
    sm: {
      fontSize: '16px'
    },
    md: {
      fontSize: '18px',
      padding: '20rpx'
    }
  }
}

步骤1: 生成基础规则
.component {
  font-size: 14px;
  padding: 10rpx;
}

步骤2: 为每个断点生成媒体查询
@media (min-width: 375px) {
  .component {
    font-size: 16px;
  }
}

@media (min-width: 667px) {
  .component {
    font-size: 18px;
    padding: 20rpx;
  }
}

数据结构:
[
  {
    selector: '.component',
    properties: {
      'font-size': '14px',
      'padding': '10rpx'
    }
  },
  {
    selector: '.component',
    properties: {
      'font-size': '16px'
    },
    media: '(min-width: 375px)'
  },
  {
    selector: '.component',
    properties: {
      'font-size': '18px',
      'padding': '20rpx'
    },
    media: '(min-width: 667px)'
  }
]

输出: 包含媒体查询的CSSRule[]
```

### 2.6 格式化输出流程

```typescript
输入: CSSRule[]

[
  {
    selector: '.container',
    properties: {
      'display': 'flex',
      'padding': '20rpx',
      'background-color': '#ffffff'
    }
  },
  {
    selector: '.header',
    properties: {
      'font-size': '18px',
      'font-weight': 'bold'
    }
  }
]

美化模式 (beautify):
.container {
  display: flex;
  padding: 20rpx;
  background-color: #ffffff;
}

.header {
  font-size: 18px;
  font-weight: bold;
}

压缩模式 (minify):
.container{display:flex;padding:20rpx;background-color:#fff}.header{font-size:18px;font-weight:bold}

输出: WXSS字符串
```

## 3. 缓存策略数据流

```typescript
首次生成:
Component → StyleCompiler → CSSRule[] → Cache
                ↓
            输出WXSS

后续生成(无修改):
Component → 检查缓存 → 命中 → 返回缓存结果

后续生成(有修改):
Component → 检查缓存 → 未命中 → StyleCompiler → 更新缓存 → 输出WXSS

缓存键生成:
cacheKey = hash(component.id + component.style + theme)

缓存数据结构:
{
  [cacheKey: string]: {
    cssRules: CSSRule[],
    wxss: string,
    timestamp: number
  }
}
```

## 4. 错误处理数据流

```typescript
输入阶段:
Component[] → validateInput() → ValidationResult
                                    ↓
                              errors.length > 0?
                                    ↓
                        Yes → 抛出ValidationError
                         No → 继续处理

编译阶段:
CSSRule → validateRule() → ValidationResult
                              ↓
                         errors.length > 0?
                              ↓
                     Yes → 收集错误，继续
                      No → 继续处理

输出阶段:
WXSS → validateOutput() → ValidationResult
                             ↓
                        返回结果和警告

错误累积:
{
  errors: [
    {
      code: 'INVALID_SELECTOR',
      message: '选择器包含不支持的通配符',
      path: 'component-123.selector'
    }
  ],
  warnings: [
    {
      code: 'DEPRECATED_PROPERTY',
      message: 'box-flex属性已废弃',
      path: 'component-456.style.boxFlex'
    }
  ]
}
```

## 5. 增量更新数据流

```typescript
场景: 用户修改了单个组件的样式

初始状态:
components = [comp1, comp2, comp3]
cache = {
  'comp1-hash': { wxss: '...', ... },
  'comp2-hash': { wxss: '...', ... },
  'comp3-hash': { wxss: '...', ... }
}

用户修改:
comp2.style.padding = '30rpx' (原来是'20rpx')

增量更新流程:
1. 检测变化
   diffComponents(oldComponents, newComponents)
   → [comp2] (只有comp2变化)

2. 使缓存失效
   invalidateCache('comp2-hash')

3. 重新编译变化的组件
   compileComponent(comp2) → newCSSRules

4. 更新缓存
   cache['comp2-new-hash'] = { ... }

5. 合并结果
   finalWXSS = cache['comp1-hash'].wxss +
               newCSSRules.formatted +
               cache['comp3-hash'].wxss

性能提升:
- 完整生成: 编译3个组件 → 100ms
- 增量更新: 编译1个组件 → 35ms
```

## 6. 并发处理数据流

```typescript
大型项目场景: 100+ 组件

串行处理:
components.forEach(comp => {
  compile(comp)  // 每个10ms
})
总时间: 100 * 10ms = 1000ms

并行处理:
Promise.all(
  components.map(comp =>
    compileAsync(comp)
  )
)
总时间: ~200ms (取决于CPU核心数)

数据流:
components
    ↓
  分片 (chunk)
    ↓
[chunk1, chunk2, chunk3, ...]
    ↓
Promise.all([
  processChunk(chunk1),
  processChunk(chunk2),
  processChunk(chunk3),
  ...
])
    ↓
  合并结果
    ↓
  最终WXSS
```

## 7. 插件系统数据流

```typescript
注册插件:
generator.use(autoprefixerPlugin);
generator.use(optimizerPlugin);

处理流程:
CSSRule[]
    ↓
plugin1.transform(rules)
    ↓
CSSRule[] (transformed)
    ↓
plugin2.transform(rules)
    ↓
CSSRule[] (transformed)
    ↓
继续后续处理

插件接口:
interface WXSSPlugin {
  name: string;
  transform(rules: CSSRule[]): CSSRule[];
  validate?(css: string): ValidationResult;
}

示例 - Autoprefixer插件:
输入:
{
  selector: '.box',
  properties: {
    'display': 'flex'
  }
}

输出:
{
  selector: '.box',
  properties: {
    'display': '-webkit-box',
    'display': '-webkit-flex',
    'display': 'flex'
  }
}
```

## 8. 源映射生成数据流

```typescript
编译过程中记录映射:
Component → 行号1
  ↓
CSSRule → 行号5-8
  ↓
WXSS → 行号10-15

映射数据结构:
SourceMap {
  version: 3,
  sources: ['component-123.style', 'component-456.style'],
  mappings: 'AAAA,CAAC,CAAC;EACA,OAAO...',
  names: []
}

使用场景:
开发工具中点击WXSS代码
  ↓
查找源映射
  ↓
定位到原始Component定义
  ↓
跳转到可视化编辑器
```

## 9. 总结

WXSS生成器的数据流设计特点:

1. **清晰的层次**: 输入验证 → 编译 → 格式化 → 输出
2. **模块化处理**: 每个阶段职责明确，易于维护
3. **性能优化**: 缓存、增量更新、并行处理
4. **错误处理**: 多层验证，友好的错误信息
5. **可扩展性**: 插件系统，自定义转换器
6. **调试支持**: 源映射，详细的中间表示

通过这种数据流设计，系统能够高效、可靠地将可视化设计转换为WXSS代码。
