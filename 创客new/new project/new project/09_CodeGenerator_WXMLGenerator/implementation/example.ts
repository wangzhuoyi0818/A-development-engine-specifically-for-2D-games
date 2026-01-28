/**
 * WXML 生成器使用示例
 *
 * 展示如何使用WXML生成器生成微信小程序模板代码
 */

import {
  WXMLGenerator,
  AttributeGenerator,
  BindingGenerator,
  Formatter,
  Validator
} from './index';
import type { Page, Component } from '../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 示例1: 生成简单的登录页面
// ============================================================================

const loginPage: Page = {
  id: 'login-page',
  name: '登录页',
  path: 'pages/login/index',
  config: {
    navigationBarTitleText: '用户登录',
    navigationBarBackgroundColor: '#1890ff',
    navigationBarTextStyle: 'white'
  },
  components: [
    {
      id: 'container',
      type: 'view',
      properties: [
        { name: 'class', value: 'login-container', type: 'string' }
      ],
      style: {
        padding: '20px',
        backgroundColor: '#f5f5f5'
      },
      events: [],
      children: [
        {
          id: 'logo',
          type: 'image',
          properties: [
            { name: 'src', value: '/images/logo.png', type: 'image' },
            { name: 'mode', value: 'aspectFit', type: 'string' }
          ],
          style: {
            width: '100px',
            height: '100px',
            margin: '0 auto 20px'
          },
          events: [],
          children: [],
          dataBindings: []
        },
        {
          id: 'form',
          type: 'form',
          properties: [],
          style: {},
          events: [
            { name: 'submit', handler: 'onFormSubmit', params: {} }
          ],
          children: [
            {
              id: 'username-input',
              type: 'input',
              properties: [
                { name: 'placeholder', value: '请输入用户名', type: 'string' },
                { name: 'type', value: 'text', type: 'string' }
              ],
              style: {},
              events: [],
              children: [],
              dataBindings: [
                { property: 'value', dataPath: 'username', mode: 'twoWay' }
              ]
            },
            {
              id: 'password-input',
              type: 'input',
              properties: [
                { name: 'placeholder', value: '请输入密码', type: 'string' },
                { name: 'type', value: 'password', type: 'string' }
              ],
              style: {},
              events: [],
              children: [],
              dataBindings: [
                { property: 'value', dataPath: 'password', mode: 'twoWay' }
              ]
            },
            {
              id: 'submit-btn',
              type: 'button',
              properties: [
                { name: 'type', value: 'primary', type: 'string' },
                { name: 'form-type', value: 'submit', type: 'string' }
              ],
              style: {},
              events: [],
              children: [
                {
                  id: 'btn-text',
                  type: 'text',
                  properties: [
                    { name: 'content', value: '登录', type: 'string' }
                  ],
                  style: {},
                  events: [],
                  children: [],
                  dataBindings: []
                }
              ],
              dataBindings: []
            }
          ],
          dataBindings: []
        }
      ],
      dataBindings: []
    }
  ],
  data: {
    username: '',
    password: ''
  },
  variables: [],
  lifecycleEvents: [],
  customEvents: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('='.repeat(60));
console.log('示例1: 登录页面');
console.log('='.repeat(60));

const loginResult = WXMLGenerator.generate(loginPage);
if (loginResult.success) {
  console.log(loginResult.code);
  console.log('\n生成信息:');
  console.log(`- 组件数量: ${loginResult.componentCount}`);
  console.log(`- 耗时: ${loginResult.duration}ms`);
} else {
  console.error('生成失败:', loginResult.errors);
}

// ============================================================================
// 示例2: 生成带列表的商品列表页
// ============================================================================

const productListPage: Page = {
  id: 'product-list-page',
  name: '商品列表',
  path: 'pages/products/index',
  config: {
    navigationBarTitleText: '商品列表',
    enablePullDownRefresh: true
  },
  components: [
    {
      id: 'search-bar',
      type: 'view',
      properties: [
        { name: 'class', value: 'search-bar', type: 'string' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'search-input',
          type: 'input',
          properties: [
            { name: 'placeholder', value: '搜索商品', type: 'string' }
          ],
          style: {},
          events: [
            { name: 'input', handler: 'onSearch', params: {} }
          ],
          children: [],
          dataBindings: [
            { property: 'value', dataPath: 'searchKeyword', mode: 'twoWay' }
          ]
        }
      ],
      dataBindings: []
    },
    {
      id: 'product-list',
      type: 'view',
      properties: [
        { name: 'class', value: 'product-list', type: 'string' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'product-item',
          type: 'view',
          properties: [
            { name: 'class', value: 'product-item', type: 'string' }
          ],
          style: {},
          events: [
            { name: 'tap', handler: 'onProductTap', params: {} }
          ],
          children: [
            {
              id: 'product-image',
              type: 'image',
              properties: [
                { name: 'mode', value: 'aspectFill', type: 'string' }
              ],
              style: {},
              events: [],
              children: [],
              dataBindings: [
                { property: 'src', dataPath: 'item.image', mode: 'oneWay' }
              ]
            },
            {
              id: 'product-name',
              type: 'text',
              properties: [],
              style: {},
              events: [],
              children: [],
              dataBindings: [
                { property: 'content', dataPath: 'item.name', mode: 'oneWay' }
              ]
            },
            {
              id: 'product-price',
              type: 'text',
              properties: [],
              style: {},
              events: [],
              children: [],
              dataBindings: [
                { property: 'content', dataPath: 'item.price', mode: 'oneWay' }
              ]
            }
          ],
          dataBindings: [],
          listRendering: {
            dataSource: 'products',
            itemName: 'item',
            indexName: 'index',
            key: 'id'
          }
        }
      ],
      dataBindings: []
    }
  ],
  data: {
    searchKeyword: '',
    products: []
  },
  variables: [],
  lifecycleEvents: [],
  customEvents: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('\n' + '='.repeat(60));
console.log('示例2: 商品列表页（带列表渲染）');
console.log('='.repeat(60));

const productListResult = WXMLGenerator.generate(productListPage);
if (productListResult.success) {
  console.log(productListResult.code);
  console.log('\n生成信息:');
  console.log(`- 组件数量: ${productListResult.componentCount}`);
  console.log(`- 耗时: ${productListResult.duration}ms`);
}

// ============================================================================
// 示例3: 生成带条件渲染的页面
// ============================================================================

const dashboardPage: Page = {
  id: 'dashboard-page',
  name: '仪表盘',
  path: 'pages/dashboard/index',
  config: {
    navigationBarTitleText: '仪表盘'
  },
  components: [
    {
      id: 'loading',
      type: 'view',
      properties: [
        { name: 'class', value: 'loading', type: 'string' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'loading-text',
          type: 'text',
          properties: [
            { name: 'content', value: '加载中...', type: 'string' }
          ],
          style: {},
          events: [],
          children: [],
          dataBindings: []
        }
      ],
      dataBindings: [],
      condition: 'isLoading'
    },
    {
      id: 'error',
      type: 'view',
      properties: [
        { name: 'class', value: 'error', type: 'string' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'error-text',
          type: 'text',
          properties: [],
          style: {},
          events: [],
          children: [],
          dataBindings: [
            { property: 'content', dataPath: 'errorMessage', mode: 'oneWay' }
          ]
        }
      ],
      dataBindings: [],
      condition: '!isLoading && hasError'
    },
    {
      id: 'content',
      type: 'view',
      properties: [
        { name: 'class', value: 'content', type: 'string' }
      ],
      style: {},
      events: [],
      children: [
        {
          id: 'title',
          type: 'text',
          properties: [
            { name: 'content', value: '欢迎回来', type: 'string' }
          ],
          style: {},
          events: [],
          children: [],
          dataBindings: []
        }
      ],
      dataBindings: [],
      condition: '!isLoading && !hasError'
    }
  ],
  data: {
    isLoading: true,
    hasError: false,
    errorMessage: ''
  },
  variables: [],
  lifecycleEvents: [],
  customEvents: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('\n' + '='.repeat(60));
console.log('示例3: 仪表盘页（带条件渲染）');
console.log('='.repeat(60));

const dashboardResult = WXMLGenerator.generate(dashboardPage);
if (dashboardResult.success) {
  console.log(dashboardResult.code);
  console.log('\n生成信息:');
  console.log(`- 组件数量: ${dashboardResult.componentCount}`);
  console.log(`- 耗时: ${dashboardResult.duration}ms`);
}

// ============================================================================
// 示例4: 使用工具函数
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('示例4: 使用工具函数');
console.log('='.repeat(60));

// 使用AttributeGenerator
console.log('\n1. 属性生成:');
const component: Component = {
  id: 'test-btn',
  type: 'button',
  properties: [
    { name: 'type', value: 'primary', type: 'string' }
  ],
  style: {},
  events: [
    { name: 'tap', handler: 'onClick', params: {} }
  ],
  children: [],
  dataBindings: []
};
const attrs = AttributeGenerator.generateAttributes(component);
console.log(`生成的属性: ${attrs}`);

// 使用BindingGenerator
console.log('\n2. 绑定生成:');
const binding = BindingGenerator.toBindingExpression('user.name');
console.log(`数据绑定: ${binding}`);

// 使用Formatter
console.log('\n3. 格式化:');
const rawWxml = '<view><text>Hello</text></view>';
const formatted = Formatter.format(rawWxml);
console.log('格式化后:');
console.log(formatted);

// 使用Validator
console.log('\n4. 验证:');
const validationResult = Validator.validateComponentTree([component]);
console.log(`验证结果: ${validationResult.valid ? '通过' : '失败'}`);
console.log(`错误数: ${validationResult.errors.length}`);
console.log(`警告数: ${validationResult.warnings.length}`);

// ============================================================================
// 示例5: 批量生成
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('示例5: 批量生成多个页面');
console.log('='.repeat(60));

const pages = [loginPage, productListPage, dashboardPage];
const results = WXMLGenerator.generateMultiple(pages);

console.log(`\n共生成 ${results.size} 个页面:`);
for (const [path, result] of results) {
  console.log(`- ${path}: ${result.success ? '成功' : '失败'} (${result.componentCount}个组件, ${result.duration}ms)`);
}

console.log('\n' + '='.repeat(60));
console.log('示例运行完成');
console.log('='.repeat(60));
