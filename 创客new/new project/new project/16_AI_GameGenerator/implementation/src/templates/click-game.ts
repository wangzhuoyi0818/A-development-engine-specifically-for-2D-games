/**
 * 点击游戏模板
 */
import type { GameTemplate } from '../types';

export const clickGameTemplate: GameTemplate = {
  id: 'click-game-basic',
  name: '基础点击游戏',
  gameType: 'click',
  description: '点击收集物品，计分和计时',
  tags: ['简单', '休闲', '单人'],
  difficulty: 'simple',

  structure: {
    name: '点击游戏',
    description: 'AI生成的点击游戏',
    pageCount: 2,
    componentCount: 5,
    resources: [
      {
        type: 'image',
        name: 'star',
        url: '/images/star.png',
      },
      {
        type: 'audio',
        name: 'collect-sound',
        url: '/sounds/collect.mp3',
      },
    ],
    config: {
      projectName: '点击游戏',
    },
  },

  components: [
    {
      type: 'view',
      name: 'game-container',
      properties: {
        class: 'game-container',
        style: 'width: 100%; height: 100vh; position: relative; background: #f0f0f0;',
      },
      children: [
        {
          type: 'view',
          name: 'score-board',
          properties: {
            class: 'score-board',
            style: 'position: absolute; top: 20px; left: 20px; z-index: 10;',
          },
          children: [
            {
              type: 'text',
              name: 'score-text',
              properties: {
                class: 'score-text',
                style: 'font-size: 24px; font-weight: bold;',
              },
            },
            {
              type: 'text',
              name: 'time-text',
              properties: {
                class: 'time-text',
                style: 'font-size: 18px; margin-top: 10px;',
              },
            },
          ],
        },
        {
          type: 'image',
          name: 'collectible',
          properties: {
            class: 'collectible',
            src: '/images/star.png',
            mode: 'aspectFit',
            style: 'position: absolute; width: 60px; height: 60px;',
          },
          eventBindings: [
            {
              eventName: 'tap',
              handler: 'onCollectibleTap',
            },
          ],
        },
        {
          type: 'button',
          name: 'start-button',
          properties: {
            class: 'start-button',
            type: 'primary',
            style: 'position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);',
          },
          eventBindings: [
            {
              eventName: 'tap',
              handler: 'onGameStart',
            },
          ],
        },
      ],
    },
  ],

  events: [
    {
      name: 'onGameStart',
      type: 'tap',
      conditions: [],
      actions: [
        {
          type: 'variable-set',
          parameters: ['isPlaying', true],
        },
        {
          type: 'variable-set',
          parameters: ['score', 0],
        },
        {
          type: 'variable-set',
          parameters: ['timeLeft', 60],
        },
        {
          type: 'function-call',
          parameters: ['startTimer'],
        },
        {
          type: 'function-call',
          parameters: ['spawnCollectible'],
        },
      ],
    },
    {
      name: 'onCollectibleTap',
      type: 'tap',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['isPlaying', '==', true],
        },
      ],
      actions: [
        {
          type: 'variable-increment',
          parameters: ['score', 1],
        },
        {
          type: 'function-call',
          parameters: ['spawnCollectible'],
        },
        {
          type: 'play-sound',
          parameters: ['collect-sound'],
        },
      ],
    },
    {
      name: 'onTimerTick',
      type: 'timer',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['timeLeft', '>', 0],
        },
      ],
      actions: [
        {
          type: 'variable-decrement',
          parameters: ['timeLeft', 1],
        },
      ],
    },
    {
      name: 'onGameEnd',
      type: 'condition-met',
      conditions: [
        {
          type: 'variable-compare',
          parameters: ['timeLeft', '<=', 0],
        },
      ],
      actions: [
        {
          type: 'variable-set',
          parameters: ['isPlaying', false],
        },
        {
          type: 'function-call',
          parameters: ['stopTimer'],
        },
        {
          type: 'show-modal',
          parameters: [{ title: '游戏结束', content: '你的得分：{{score}}' }],
        },
      ],
    },
  ],

  variables: [
    {
      name: 'score',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
    {
      name: 'timeLeft',
      type: 'number',
      initialValue: 60,
      scope: 'page',
    },
    {
      name: 'isPlaying',
      type: 'boolean',
      initialValue: false,
      scope: 'page',
    },
    {
      name: 'collectibleX',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
    {
      name: 'collectibleY',
      type: 'number',
      initialValue: 0,
      scope: 'page',
    },
  ],

  customizableParams: [
    {
      name: 'gameDuration',
      type: 'number',
      defaultValue: 60,
      description: '游戏时长（秒）',
      required: false,
      validation: {
        min: 10,
        max: 300,
      },
    },
    {
      name: 'collectibleImage',
      type: 'image',
      defaultValue: '/images/star.png',
      description: '收集物图片',
      required: true,
    },
    {
      name: 'backgroundColor',
      type: 'color',
      defaultValue: '#f0f0f0',
      description: '背景颜色',
    },
  ],
};
