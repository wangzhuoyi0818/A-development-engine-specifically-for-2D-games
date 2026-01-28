/**
 * WXML生成器测试套件
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WXMLGenerator,
  AttributeGenerator,
  BindingGenerator,
  Formatter,
  Validator
} from '../index';
import type { Component, Page } from '../../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 测试数据
// ============================================================================

const createComponent = (overrides?: Partial<Component>): Component => ({
  id: 'test-component',
  type: 'view',
  properties: [],
  style: {},
  events: [],
  children: [],
  dataBindings: [],
  ...overrides
});

const createPage = (overrides?: Partial<Page>): Page => ({
  id: 'page-1',
  name: '测试页面',
  path: 'pages/test/index',
  config: {
    window: {}
  },
  components: [],
  data: {},
  variables: [],
  lifecycleEvents: [],
  customEvents: [],
  ...overrides
});

// ============================================================================
// WXMLGenerator 测试
// ============================================================================

describe('WXMLGenerator', () => {
  it('应该生成简单的view组件', () => {
    const component = createComponent({
      id: 'view-1',
      type: 'view',
      properties: [{ name: 'class', value: 'container', type: 'string' }]
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('<view');
    expect(result.code).toContain('id="view-1"');
    expect(result.code).toContain('class="container"');
    expect(result.code).toContain('</view>');
  });

  it('应该生成text组件与内容', () => {
    const component = createComponent({
      id: 'text-1',
      type: 'text',
      properties: [{ name: 'content', value: 'Hello World', type: 'string' }]
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('<text');
    expect(result.code).toContain('Hello World');
    expect(result.code).toContain('</text>');
  });

  it('应该生成嵌套组件', () => {
    const child = createComponent({
      id: 'text-child',
      type: 'text',
      properties: [{ name: 'content', value: 'Child', type: 'string' }]
    });

    const parent = createComponent({
      id: 'view-parent',
      type: 'view',
      children: [child]
    });

    const page = createPage({
      components: [parent]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('<view');
    expect(result.code).toContain('<text');
    expect(result.code).toContain('Child');
    expect(result.code).toContain('</text>');
    expect(result.code).toContain('</view>');
  });

  it('应该生成事件绑定', () => {
    const component = createComponent({
      id: 'button-1',
      type: 'button',
      events: [{ name: 'tap', handler: 'onTap', params: {} }]
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('bindtap');
    expect(result.code).toContain('onTap');
  });

  it('应该生成数据绑定', () => {
    const component = createComponent({
      id: 'input-1',
      type: 'input',
      dataBindings: [
        { property: 'value', dataPath: 'username', mode: 'oneWay' }
      ]
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('value="{{username}}"');
  });

  it('应该生成条件渲染', () => {
    const component = createComponent({
      id: 'view-1',
      type: 'view',
      condition: 'isVisible'
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('wx:if="{{isVisible}}"');
  });

  it('应该生成列表渲染', () => {
    const component = createComponent({
      id: 'view-1',
      type: 'view',
      listRendering: {
        dataSource: 'items',
        itemName: 'item',
        indexName: 'index',
        key: 'id'
      }
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('wx:for="{{items}}"');
    expect(result.code).toContain('wx:for-item="item"');
    expect(result.code).toContain('wx:for-index="index"');
    expect(result.code).toContain('wx:key="id"');
  });

  it('应该处理自闭合标签', () => {
    const component = createComponent({
      id: 'image-1',
      type: 'image',
      properties: [{ name: 'src', value: '/images/pic.jpg', type: 'string' }]
    });

    const page = createPage({
      components: [component]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('<image');
    expect(result.code).toContain('/>');
    expect(result.code).not.toContain('</image>');
  });

  it('应该生成多个顶级组件', () => {
    const comp1 = createComponent({ id: 'view-1', type: 'view' });
    const comp2 = createComponent({ id: 'view-2', type: 'view' });

    const page = createPage({
      components: [comp1, comp2]
    });

    const result = WXMLGenerator.generate(page, { format: false });
    expect(result.success).toBe(true);
    expect(result.code).toContain('id="view-1"');
    expect(result.code).toContain('id="view-2"');
    expect(result.componentCount).toBe(2);
  });

  it('应该返回生成结果信息', () => {
    const component = createComponent();
    const page = createPage({ components: [component] });

    const result = WXMLGenerator.generate(page);
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('componentCount');
    expect(result).toHaveProperty('duration');
    expect(result.componentCount).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('应该生成注释', () => {
    const component = createComponent();
    const page = createPage({ name: '登录页', components: [component] });

    const result = WXMLGenerator.generate(page, { addComments: true });
    expect(result.code).toContain('<!--');
    expect(result.code).toContain('登录页');
  });

  it('应该生成WXML片段', () => {
    const component = createComponent({
      id: 'button-1',
      type: 'button'
    });

    const fragment = WXMLGenerator.generateFragment(component);
    expect(fragment).toContain('<button');
    expect(fragment).toContain('id="button-1"');
    expect(fragment).toContain('</button>');
  });

  it('应该批量生成多个页面', () => {
    const page1 = createPage({ id: 'page-1', name: 'Home', components: [createComponent()] });
    const page2 = createPage({ id: 'page-2', name: 'About', components: [createComponent()] });

    const results = WXMLGenerator.generateMultiple([page1, page2]);
    expect(results.size).toBe(2);
    expect(results.has('pages/test/index')).toBe(true);
  });
});

// ============================================================================
// AttributeGenerator 测试
// ============================================================================

describe('AttributeGenerator', () => {
  it('应该生成ID属性', () => {
    const component = createComponent({ id: 'myid' });
    const attrs = AttributeGenerator.generateAttributes(component);
    expect(attrs).toContain('id="myid"');
  });

  it('应该生成普通属性', () => {
    const component = createComponent({
      properties: [
        { name: 'class', value: 'container', type: 'string' },
        { name: 'style', value: 'color: red', type: 'string' }
      ]
    });

    const attrs = AttributeGenerator.generateAttributes(component);
    expect(attrs).toContain('class="container"');
    expect(attrs).toContain('style="color: red"');
  });

  it('应该转义属性值', () => {
    const value = 'Test & <"dangerous">';
    const escaped = AttributeGenerator.escapeAttributeValue(value);
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&lt;');
    expect(escaped).toContain('&quot;');
  });

  it('应该生成数据绑定属性', () => {
    const component = createComponent({
      dataBindings: [
        { property: 'value', dataPath: 'username', mode: 'oneWay' }
      ]
    });

    const attrs = AttributeGenerator.generateAttributes(component);
    expect(attrs).toContain('value="{{username}}"');
  });

  it('应该生成双向绑定属性', () => {
    const component = createComponent({
      dataBindings: [
        { property: 'value', dataPath: 'username', mode: 'twoWay' }
      ]
    });

    const attrs = AttributeGenerator.generateAttributes(component);
    expect(attrs).toContain('model:value="{{username}}"');
  });

  it('应该生成事件属性', () => {
    const component = createComponent({
      id: 'button-1',
      events: [
        { name: 'tap', handler: 'onClick', params: {} }
      ]
    });

    const attrs = AttributeGenerator.generateAttributes(component);
    expect(attrs).toContain('bindtap');
    expect(attrs).toContain('onClick');
  });

  it('应该识别自闭合标签', () => {
    expect(AttributeGenerator.isSelfClosing('input')).toBe(true);
    expect(AttributeGenerator.isSelfClosing('image')).toBe(true);
    expect(AttributeGenerator.isSelfClosing('view')).toBe(false);
    expect(AttributeGenerator.isSelfClosing('text')).toBe(false);
  });
});

// ============================================================================
// BindingGenerator 测试
// ============================================================================

describe('BindingGenerator', () => {
  it('应该将数据路径转换为绑定表达式', () => {
    const expr = BindingGenerator.toBindingExpression('username');
    expect(expr).toBe('{{username}}');
  });

  it('应该处理嵌套的数据路径', () => {
    const expr = BindingGenerator.toBindingExpression('user.name');
    expect(expr).toBe('{{user.name}}');
  });

  it('应该处理已有双花括号的表达式', () => {
    const expr = BindingGenerator.toBindingExpression('{{username}}');
    expect(expr).toBe('{{username}}');
  });

  it('应该生成事件绑定属性', () => {
    const event = { name: 'tap', handler: 'onTap', params: {} };
    const attr = BindingGenerator.generateEventBinding(event, 'button-1');
    expect(attr).toContain('bindtap');
    expect(attr).toContain('onTap');
  });

  it('应该验证绑定表达式', () => {
    expect(BindingGenerator.isValidBinding('{{username}}')).toBe(true);
    expect(BindingGenerator.isValidBinding('username')).toBe(true);
    expect(BindingGenerator.isValidBinding('')).toBe(false);
    expect(BindingGenerator.isValidBinding('{{}')).toBe(false);
  });

  it('应该提取绑定表达式中的变量', () => {
    const vars = BindingGenerator.extractVariables('{{user.name}} and {{age}}');
    expect(vars).toContain('user');
    expect(vars).toContain('name');
    expect(vars).toContain('age');
  });

  it('应该判断是否是表达式', () => {
    expect(BindingGenerator.isExpression('count + 1')).toBe(true);
    expect(BindingGenerator.isExpression('user.name')).toBe(false);
    expect(BindingGenerator.isExpression('count > 5')).toBe(true);
  });

  it('应该生成列表渲染属性', () => {
    const attrs = BindingGenerator.generateListAttributes({
      dataSource: 'items',
      itemName: 'item',
      indexName: 'index',
      key: 'id'
    });

    expect(attrs).toContain('wx:for="{{items}}"');
    expect(attrs).toContain('wx:for-item="item"');
    expect(attrs).toContain('wx:for-index="index"');
    expect(attrs).toContain('wx:key="id"');
  });
});

// ============================================================================
// Formatter 测试
// ============================================================================

describe('Formatter', () => {
  it('应该生成缩进', () => {
    expect(Formatter.indent(0)).toBe('');
    expect(Formatter.indent(1)).toBe('  ');
    expect(Formatter.indent(2)).toBe('    ');
    expect(Formatter.indent(3)).toBe('      ');
  });

  it('应该使用自定义缩进字符', () => {
    expect(Formatter.indent(2, '\t')).toBe('\t\t');
    expect(Formatter.indent(2, '    ')).toBe('        ');
  });

  it('应该添加注释', () => {
    const comment = Formatter.addComment('这是注释');
    expect(comment).toContain('<!--');
    expect(comment).toContain('这是注释');
    expect(comment).toContain('-->');
  });

  it('应该识别自闭合标签', () => {
    expect(Formatter.isSelfClosingTag('input')).toBe(true);
    expect(Formatter.isSelfClosingTag('image')).toBe(true);
    expect(Formatter.isSelfClosingTag('view')).toBe(false);
  });

  it('应该最小化WXML', () => {
    const wxml = `
      <view class="container">
        <text>Hello</text>
      </view>
    `;
    const minified = Formatter.minify(wxml);
    expect(minified).not.toContain('\n');
    expect(minified).toContain('<view');
    expect(minified).toContain('</view>');
  });

  it('应该计算行数', () => {
    const wxml = '<view>\n<text>Test</text>\n</view>';
    expect(Formatter.getLineCount(wxml)).toBe(3);
  });

  it('应该获取指定行', () => {
    const wxml = '<view>\n<text>Test</text>\n</view>';
    expect(Formatter.getLine(wxml, 1)).toBe('<view>');
    expect(Formatter.getLine(wxml, 2)).toBe('<text>Test</text>');
    expect(Formatter.getLine(wxml, 3)).toBe('</view>');
  });

  it('应该生成文件头', () => {
    const header = Formatter.generateFileHeader('test.wxml');
    expect(header).toContain('<!--');
    expect(header).toContain('test.wxml');
    expect(header).toContain('-->');
  });
});

// ============================================================================
// Validator 测试
// ============================================================================

describe('Validator', () => {
  it('应该验证有效的组件树', () => {
    const components = [createComponent({ id: 'view-1' })];
    const result = Validator.validateComponentTree(components);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('应该检测重复的ID', () => {
    const comp1 = createComponent({ id: 'same-id' });
    const comp2 = createComponent({ id: 'same-id' });
    const result = Validator.validateComponentTree([comp1, comp2]);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'DUPLICATE_ID')).toBe(true);
  });

  it('应该检测无效的数据绑定', () => {
    const component = createComponent({
      dataBindings: [
        { property: 'value', dataPath: '', mode: 'oneWay' }
      ]
    });
    const result = Validator.validateComponentTree([component]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('应该验证WXML代码', () => {
    const wxml = '<view><text>Test</text></view>';
    const result = Validator.validateWXML(wxml);
    expect(result.valid).toBe(true);
  });

  it('应该检测不匹配的标签', () => {
    const wxml = '<view><text>Test</view></text>';
    const result = Validator.validateWXML(wxml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNMATCHED_TAG')).toBe(true);
  });

  it('应该检测未关闭的标签', () => {
    const wxml = '<view><text>Test';
    const result = Validator.validateWXML(wxml);
    expect(result.valid).toBe(false);
  });

  it('应该警告空的text组件', () => {
    const component = createComponent({
      id: 'text-1',
      type: 'text',
      properties: []
    });
    const result = Validator.validateComponentTree([component]);
    expect(result.warnings.some(w => w.code === 'EMPTY_TEXT')).toBe(true);
  });

  it('应该警告子组件过多', () => {
    const children = Array.from({ length: 15 }, (_, i) =>
      createComponent({ id: `child-${i}`, type: 'view' })
    );
    const parent = createComponent({ children });
    const result = Validator.validateComponentTree([parent]);
    expect(result.warnings.some(w => w.code === 'TOO_MANY_CHILDREN')).toBe(true);
  });
});

// ============================================================================
// 集成测试
// ============================================================================

describe('集成测试', () => {
  it('应该生成完整的登录页面', () => {
    const form = createComponent({
      id: 'form-1',
      type: 'form',
      children: [
        createComponent({
          id: 'username-input',
          type: 'input',
          properties: [{ name: 'placeholder', value: '请输入用户名', type: 'string' }],
          dataBindings: [
            { property: 'value', dataPath: 'username', mode: 'twoWay' }
          ]
        }),
        createComponent({
          id: 'password-input',
          type: 'input',
          properties: [
            { name: 'placeholder', value: '请输入密码', type: 'string' },
            { name: 'type', value: 'password', type: 'string' }
          ],
          dataBindings: [
            { property: 'value', dataPath: 'password', mode: 'twoWay' }
          ]
        }),
        createComponent({
          id: 'submit-btn',
          type: 'button',
          properties: [{ name: 'type', value: 'primary', type: 'string' }],
          events: [{ name: 'tap', handler: 'onSubmit', params: {} }],
          children: [
            createComponent({
              id: 'btn-text',
              type: 'text',
              properties: [{ name: 'content', value: '登录', type: 'string' }]
            })
          ]
        })
      ]
    });

    const page = createPage({ components: [form] });
    const result = WXMLGenerator.generate(page);

    expect(result.success).toBe(true);
    expect(result.code).toContain('<form');
    expect(result.code).toContain('<input');
    expect(result.code).toContain('model:value="{{username}}"');
    expect(result.code).toContain('<button');
    expect(result.code).toContain('bindtap="onSubmit"');
    expect(result.code).toContain('登录');
  });

  it('应该生成带有列表的页面', () => {
    const listItem = createComponent({
      id: 'list-item',
      type: 'view',
      listRendering: {
        dataSource: 'items',
        itemName: 'item',
        key: 'id'
      },
      children: [
        createComponent({
          id: 'item-text',
          type: 'text',
          dataBindings: [
            { property: 'content', dataPath: 'item.name', mode: 'oneWay' }
          ]
        })
      ]
    });

    const page = createPage({ components: [listItem] });
    const result = WXMLGenerator.generate(page);

    expect(result.success).toBe(true);
    expect(result.code).toContain('wx:for="{{items}}"');
    expect(result.code).toContain('wx:for-item="item"');
    expect(result.code).toContain('wx:key="id"');
    expect(result.code).toContain('{{item.name}}');
  });

  it('应该生成带条件的页面', () => {
    const page = createPage({
      components: [
        createComponent({
          id: 'loading',
          type: 'view',
          condition: 'isLoading',
          children: [
            createComponent({
              id: 'loading-text',
              type: 'text',
              properties: [{ name: 'content', value: '加载中...', type: 'string' }]
            })
          ]
        }),
        createComponent({
          id: 'content',
          type: 'view',
          condition: '!isLoading',
          children: [
            createComponent({
              id: 'title',
              type: 'text',
              dataBindings: [
                { property: 'content', dataPath: 'title', mode: 'oneWay' }
              ]
            })
          ]
        })
      ]
    });

    const result = WXMLGenerator.generate(page);
    expect(result.success).toBe(true);
    expect(result.code).toContain('wx:if="{{isLoading}}"');
    expect(result.code).toContain('wx:if="{{!isLoading}}"');
  });

  it('应该处理复杂的嵌套结构', () => {
    const deeplyNested = createComponent({
      id: 'level-0',
      type: 'view',
      children: [
        createComponent({
          id: 'level-1',
          type: 'view',
          children: [
            createComponent({
              id: 'level-2',
              type: 'view',
              children: [
                createComponent({
                  id: 'level-3',
                  type: 'text',
                  properties: [{ name: 'content', value: 'Deep', type: 'string' }]
                })
              ]
            })
          ]
        })
      ]
    });

    const page = createPage({ components: [deeplyNested] });
    const result = WXMLGenerator.generate(page);

    expect(result.success).toBe(true);
    expect(result.componentCount).toBe(4);
    expect(result.code).toContain('id="level-0"');
    expect(result.code).toContain('id="level-3"');
  });
});
