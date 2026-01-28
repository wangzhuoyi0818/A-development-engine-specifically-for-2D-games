# AI游戏生成器 - 快速开始指南

## 📦 安装步骤

### 1. 进入项目目录

```bash
cd "C:\Users\wzy16\Desktop\new project\16_AI_GameGenerator\implementation"
```

### 2. 安装依赖

```bash
npm install
```

这会安装以下依赖：
- `openai` - OpenAI API客户端
- `handlebars` - 模板引擎（预留）
- `zod` - 数据验证（预留）
- `typescript` - TypeScript编译器
- `vitest` - 测试框架
- `vite` - 构建工具

### 3. 配置API密钥

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的OpenAI API密钥：

```env
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
OPENAI_MODEL=gpt-4
AI_PROVIDER=openai
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
```

**获取API密钥**:
- 访问 https://platform.openai.com/api-keys
- 登录并创建新的API密钥
- 复制密钥并粘贴到 `.env` 文件

## 🚀 使用方法

### 方法 1: 命令行工具（推荐）

```bash
npm run cli "创建一个点击收集星星的游戏，60秒倒计时"
```

生成的项目会保存到 `output/` 目录。

### 方法 2: 运行示例代码

```bash
npm run example
```

### 方法 3: 编程方式

创建一个新文件 `my-game.ts`:

```typescript
import { AIGameGenerator } from './src';

async function createMyGame() {
  const generator = new AIGameGenerator(process.env.OPENAI_API_KEY!);

  const project = await generator.generateFromPrompt(`
    创建一个点击游戏：
    - 点击星星得分
    - 60秒倒计时
    - 显示最高分
  `);

  console.log('生成成功！', project);
}

createMyGame();
```

运行：

```bash
npx tsx my-game.ts
```

## 🧪 运行测试

```bash
# 运行所有测试
npm test

# 查看测试UI
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

**注意**: 测试需要真实的API密钥才能运行。

## 📝 示例提示词

### 点击类游戏

```
创建一个点击收集星星的游戏：
- 屏幕上随机出现星星
- 点击星星得1分
- 60秒倒计时
- 显示当前分数和剩余时间
- 游戏结束显示最终得分
```

### 跑酷类游戏（计划中）

```
创建一个简单的跑酷游戏：
- 角色自动向前跑
- 点击屏幕跳跃
- 躲避障碍物
- 碰到障碍游戏结束
```

### 答题类游戏（计划中）

```
创建一个答题游戏：
- 10道选择题
- 每题4个选项
- 答对得10分
- 显示最终成绩
```

## 🔧 开发构建

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build
```

构建输出在 `dist/` 目录。

## 📊 输出格式

生成的项目是一个JSON对象，包含：

```typescript
{
  name: "游戏名称",
  description: "游戏描述",
  pages: [
    {
      id: "page-xxx",
      name: "game",
      components: [...],  // 组件树
      events: [...],       // 事件定义
      variables: {...}     // 变量
    }
  ],
  resources: [...],      // 资源配置
  config: {...}          // 项目配置
}
```

## ⚠️ 常见问题

### Q: API密钥错误

```
Error: AI服务错误: Incorrect API key provided
```

**解决**: 检查 `.env` 文件中的API密钥是否正确。

### Q: 网络连接失败

```
Error: AI服务错误: Network error
```

**解决**: 检查网络连接，确保可以访问OpenAI服务。可能需要代理。

### Q: 生成质量不理想

**解决**:
1. 提供更详细的游戏描述
2. 明确说明游戏玩法和目标
3. 描述UI布局和交互方式

### Q: Token消耗过多

**解决**:
1. 使用更简洁的提示词
2. 考虑使用GPT-3.5降低成本
3. 设置环境变量 `OPENAI_MODEL=gpt-3.5-turbo`

## 💰 成本估算

- **GPT-4**: 约 $0.03-0.06 每次生成
- **GPT-3.5**: 约 $0.002-0.005 每次生成

建议测试时使用GPT-3.5，正式使用时选择GPT-4。

## 🎯 下一步

1. ✅ 尝试生成你的第一个游戏
2. 📖 阅读 [API文档](../INTERFACES.md)
3. 🔧 自定义模板 - 参考 `src/templates/click-game.ts`
4. 🚀 集成到主应用 - 参考 `../../17_Integration_MainApp/design/integration-guide.md`

## 📞 需要帮助？

- 查看 [README.md](./README.md)
- 查看 [实现指南](../MIGRATION_GUIDE.md)
- 查看 [示例代码](./examples/basic-usage.ts)

祝你使用愉快！🎉
