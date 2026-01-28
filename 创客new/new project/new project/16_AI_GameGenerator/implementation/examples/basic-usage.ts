/**
 * AI游戏生成器 - 使用示例
 */
import { AIGameGenerator } from '../src';

// 示例 1: 基础使用
async function example1() {
  console.log('=== 示例 1: 基础使用 ===\n');

  // 创建生成器（需要OpenAI API密钥）
  const apiKey = process.env.OPENAI_API_KEY || 'your-api-key-here';
  const generator = new AIGameGenerator(apiKey);

  // 描述你想要的游戏
  const prompt = `
创建一个点击收集星星的小游戏：
- 屏幕上随机出现星星
- 点击星星得1分
- 60秒倒计时
- 显示当前分数和剩余时间
  `.trim();

  try {
    // 生成项目
    const project = await generator.generateFromPrompt(prompt);

    console.log('\n生成结果:');
    console.log('项目名称:', project.name);
    console.log('页面数量:', project.pages.length);
    console.log('第一个页面:', project.pages[0].name);
    console.log('组件数量:', project.pages[0].components.length);

    return project;
  } catch (error: any) {
    console.error('生成失败:', error.message);
    throw error;
  }
}

// 示例 2: 获取优化建议
async function example2() {
  console.log('\n=== 示例 2: 获取优化建议 ===\n');

  const apiKey = process.env.OPENAI_API_KEY || 'your-api-key-here';
  const generator = new AIGameGenerator(apiKey);

  const prompt = '简单的点击游戏';
  const project = await generator.generateFromPrompt(prompt);

  // 获取优化建议
  const suggestions = await generator.optimizeProject(project);

  console.log('\n优化建议:');
  suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. [${suggestion.type}] ${suggestion.description}`);
  });

  return suggestions;
}

// 示例 3: 查看Token使用情况
async function example3() {
  console.log('\n=== 示例 3: 查看Token使用情况 ===\n');

  const apiKey = process.env.OPENAI_API_KEY || 'your-api-key-here';
  const generator = new AIGameGenerator(apiKey);

  await generator.generateFromPrompt('点击游戏');

  const usage = await generator.getUsage();

  console.log('\nToken使用情况:');
  console.log('总Token数:', usage.totalTokens);
  console.log('会话Token数:', usage.sessionTokens);
  console.log('预估成本: $', usage.estimatedCost.toFixed(4));
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await example1();
      // await example2();
      // await example3();
    } catch (error: any) {
      console.error('示例运行失败:', error.message);
      process.exit(1);
    }
  })();
}

export { example1, example2, example3 };
