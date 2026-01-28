/**
 * JavaScript生成器使用示例
 *
 * 演示如何使用JavaScript生成器生成微信小程序代码
 */

import { createJSGenerator, generatePage, generateComponent } from './index';
import type { Page, Component } from '../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 示例1: 生成简单页面
// ============================================================================

console.log('=== 示例1: 生成简单页面 ===\n');

const simplePage: Page = {
  id: 'page-1',
  name: '首页',
  path: 'pages/index/index',
  config: {
    navigationBarTitleText: '首页',
  },
  components: [],
  data: {},
  variables: [
    {
      id: 'var-1',
      name: 'title',
      type: 'string',
      initialValue: '欢迎使用',
    },
    {
      id: 'var-2',
      name: 'count',
      type: 'number',
      initialValue: 0,
    },
  ],
  lifecycleEvents: [
    {
      name: 'onLoad',
      actions: [
        {
          id: 'action-1',
          type: 'setData',
          parameters: [
            { value: 'loaded', type: 'literal' },
            { value: 'true', type: 'literal' },
          ],
        } as any,
      ],
    },
  ],
  customEvents: [
    {
      id: 'event-1',
      name: 'handleIncrement',
      params: [],
      actions: [
        {
          id: 'action-2',
          type: 'setData',
          parameters: [
            { value: 'count', type: 'literal' },
            { value: 'this.data.count + 1', type: 'expression' },
          ],
        } as any,
      ],
    },
  ],
};

const pageCode = generatePage(simplePage);
console.log('生成的页面代码:\n');
console.log(pageCode);
console.log('\n');

// ============================================================================
// 示例2: 生成带生命周期的页面
// ============================================================================

console.log('=== 示例2: 生成带生命周期的页面 ===\n');

const lifecyclePage: Page = {
  id: 'page-2',
  name: '列表页',
  path: 'pages/list/list',
  config: {},
  components: [],
  data: {},
  variables: [
    {
      id: 'var-1',
      name: 'list',
      type: 'array',
      initialValue: [],
    },
    {
      id: 'var-2',
      name: 'loading',
      type: 'boolean',
      initialValue: false,
    },
  ],
  lifecycleEvents: [
    {
      name: 'onLoad',
      actions: [
        {
          id: 'action-1',
          type: 'setData',
          parameters: [
            { value: 'loading', type: 'literal' },
            { value: 'true', type: 'literal' },
          ],
        } as any,
        {
          id: 'action-2',
          type: 'request',
          parameters: [
            { value: '/api/list', type: 'literal' },
            { value: 'GET', type: 'literal' },
          ],
        } as any,
      ],
    },
    {
      name: 'onPullDownRefresh',
      actions: [
        {
          id: 'action-3',
          type: 'custom',
          parameters: [
            { value: 'loadData', type: 'literal' },
          ],
        } as any,
      ],
    },
  ],
  customEvents: [],
};

const generator = createJSGenerator({
  indentSize: 2,
  useSingleQuotes: true,
  includeComments: true,
});

const result = generator.generatePageCode(lifecyclePage);

if (result.success) {
  console.log('生成成功!');
  console.log('统计信息:', result.stats);
  console.log('\n生成的代码:\n');
  console.log(result.code);
} else {
  console.error('生成失败:', result.errors);
}

console.log('\n');

// ============================================================================
// 示例3: 生成组件
// ============================================================================

console.log('=== 示例3: 生成自定义组件 ===\n');

const customComponent: Component = {
  id: 'comp-1',
  type: 'custom-button',
  name: 'CustomButton',
  properties: [
    {
      name: 'text',
      value: '按钮',
      type: 'string',
    },
    {
      name: 'type',
      value: 'primary',
      type: 'string',
    },
    {
      name: 'disabled',
      value: false,
      type: 'boolean',
    },
  ],
  style: {},
  events: [
    {
      name: 'tap',
      handler: 'handleTap',
      actions: [
        {
          id: 'action-1',
          type: 'custom',
          parameters: [
            { value: 'triggerEvent', type: 'literal' },
            { value: "'click'", type: 'literal' },
          ],
        } as any,
      ],
    },
  ],
  children: [],
  dataBindings: [],
};

const componentCode = generateComponent(customComponent);
console.log('生成的组件代码:\n');
console.log(componentCode);
console.log('\n');

// ============================================================================
// 示例4: 配置化生成
// ============================================================================

console.log('=== 示例4: 使用不同配置生成 ===\n');

// 配置1: 使用双引号,4空格缩进
const config1 = {
  indentSize: 4,
  useSingleQuotes: false,
  includeComments: false,
};

const gen1 = createJSGenerator(config1);
const result1 = gen1.generatePageCode(simplePage);

console.log('配置1 (双引号, 4空格):');
console.log(result1.code?.substring(0, 200) + '...\n');

// 配置2: 使用单引号,2空格缩进,包含注释
const config2 = {
  indentSize: 2,
  useSingleQuotes: true,
  includeComments: true,
};

const gen2 = createJSGenerator(config2);
const result2 = gen2.generatePageCode(simplePage);

console.log('配置2 (单引号, 2空格, 含注释):');
console.log(result2.code?.substring(0, 200) + '...\n');

// ============================================================================
// 示例5: 使用子生成器
// ============================================================================

console.log('=== 示例5: 独立使用子生成器 ===\n');

import { generateData, generateSetData } from './data-manager-generator';
import { createLifecycleGenerator } from './lifecycle-generator';
import type { GenerationContext } from './types';

// 生成data对象
const variables = [
  { id: '1', name: 'username', type: 'string' as const, initialValue: '' },
  { id: '2', name: 'age', type: 'number' as const, initialValue: 18 },
];

const dataCode = generateData(variables);
console.log('独立生成的data对象:');
console.log(dataCode);
console.log('\n');

// 生成setData调用
const updates = {
  username: 'Alice',
  age: 20,
};

const setDataCode = generateSetData(updates);
console.log('独立生成的setData调用:');
console.log(setDataCode);
console.log('\n');

// 生成生命周期函数
const lifecycleGen = createLifecycleGenerator();
const context: GenerationContext = {
  type: 'page',
  name: 'test',
  variables: [],
  imports: new Set(),
  methods: new Map(),
  helpers: new Map(),
  indentLevel: 0,
  inAsyncContext: false,
  requiredAPIs: new Set(),
  config: { target: 'page', includeComments: true },
};

const lifecycleEvent = {
  name: 'onLoad' as const,
  actions: [
    {
      id: 'action-1',
      type: 'showToast' as const,
      parameters: [
        { value: '页面加载完成', type: 'literal' as const },
      ],
    } as any,
  ],
};

const lifecycleCode = lifecycleGen.generatePageLifecycle(lifecycleEvent, context);
console.log('独立生成的生命周期函数:');
console.log(lifecycleCode);
console.log('\n');

// ============================================================================
// 总结
// ============================================================================

console.log('=== 示例总结 ===\n');
console.log('JavaScript生成器提供了灵活的代码生成能力:');
console.log('1. 支持完整的Page和Component代码生成');
console.log('2. 支持配置化生成,适应不同代码风格');
console.log('3. 提供子生成器,可以独立使用');
console.log('4. 生成的代码格式规范,可读性强');
console.log('5. 提供详细的统计信息和错误处理');
