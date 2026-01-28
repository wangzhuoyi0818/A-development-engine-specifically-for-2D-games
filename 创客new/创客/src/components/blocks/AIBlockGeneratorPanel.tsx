import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Space, Typography, message, Spin, Alert, Select } from 'antd';
import {
  SendOutlined,
  ReloadOutlined,
  ClearOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Block } from '@/types/block';
import {
  generateBlocksFromDescription,
  isAIServiceConfigured,
  configureAIService,
  getAIServiceConfig,
  testAIConnection,
  GameBehaviorDescription,
  AIGenerationResult,
} from '@/services/aiBlockGenerator';
import { useProjectStore } from '@/stores';

const { Text } = Typography;
const { TextArea } = Input;

// API 服务预设配置
const API_PRESETS = [
  {
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
  },
  {
    label: 'AIPing 中转',
    endpoint: 'https://aiping.cn/api/v1/chat/completions',
    model: 'gpt-4',
  },
  {
    label: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4',
  },
  {
    label: '智谱 AI (GLM)',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4',
  },
  {
    label: '月之暗面 (Kimi)',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
  },
  {
    label: '自定义',
    endpoint: '',
    model: '',
  },
];

interface AIBlockGeneratorPanelProps {
  componentId: string;
  componentName: string;
  componentType?: string;
  onBlocksGenerated: (blocks: Block[]) => void;
  existingBlocks: Block[];
}

export const AIBlockGeneratorPanel: React.FC<AIBlockGeneratorPanelProps> = ({
  componentId,
  componentName,
  componentType = 'player',
  onBlocksGenerated,
  existingBlocks,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<AIGenerationResult | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');  // 保存上次的提示词用于重新生成

  // 获取项目场景列表
  const { currentProject } = useProjectStore();
  const availableScenes = currentProject?.pages?.map(p => p.name) || [];

  // API 配置状态
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.deepseek.com/v1/chat/completions');
  const [model, setModel] = useState('deepseek-chat');
  const [selectedPreset, setSelectedPreset] = useState('DeepSeek');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // 检查是否已配置
  const isConfigured = isAIServiceConfigured();

  // 组件加载时从持久化存储读取配置
  useEffect(() => {
    const savedConfig = getAIServiceConfig();
    if (savedConfig) {
      setApiEndpoint(savedConfig.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions');
      setApiKey(savedConfig.apiKey || '');
      setModel(savedConfig.model || 'deepseek-chat');
      // 根据 endpoint 匹配预设
      const matchedPreset = API_PRESETS.find(p => p.endpoint === savedConfig.apiEndpoint);
      setSelectedPreset(matchedPreset?.label || '自定义');
    }
  }, []);

  // 选择预设时更新配置
  const handlePresetChange = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    const preset = API_PRESETS.find(p => p.label === presetLabel);
    if (preset && preset.endpoint) {
      setApiEndpoint(preset.endpoint);
      setModel(preset.model);
    }
    setTestResult(null);
  };

  // 测试 API 连接
  const handleTestConnection = async () => {
    if (!apiEndpoint.trim() || !apiKey.trim()) {
      message.warning('请填写 API Endpoint 和 API Key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testAIConnection({
      apiKey: apiKey.trim(),
      apiEndpoint: apiEndpoint.trim(),
      model: model.trim() || 'gpt-4',
    });

    setTestResult(result);
    setIsTesting(false);

    if (result.success) {
      message.success('连接测试成功');
    } else {
      message.error(result.error || '连接测试失败');
    }
  };

  // 保存 API 配置
  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      message.warning('请输入 API Key');
      return;
    }
    if (!apiEndpoint.trim()) {
      message.warning('请输入 API Endpoint');
      return;
    }
    configureAIService({
      apiKey: apiKey.trim(),
      apiEndpoint: apiEndpoint.trim(),
      model: model.trim() || 'gpt-4',
    });
    message.success('API 配置已保存（全局生效）');
    setShowConfig(false);
    setTestResult(null);
  };

  // 生成积木
  const doGenerate = useCallback(async (promptText: string, append: boolean = true) => {
    if (!promptText.trim()) {
      message.warning('请输入行为描述');
      return;
    }

    if (!isAIServiceConfigured()) {
      message.warning('请先配置 AI API');
      setShowConfig(true);
      return;
    }

    setIsGenerating(true);
    setLastPrompt(promptText);  // 保存提示词

    try {
      const description: GameBehaviorDescription = {
        characterName: componentName,
        characterType: componentType,
        description: promptText,
        availableScenes: availableScenes, // 传入可用场景列表
      };

      const result = await generateBlocksFromDescription(description);
      setLastResult(result);

      if (result.success && result.blocks.length > 0) {
        // 如果是追加模式，合并现有积木；否则替换
        const newBlocks = append ? [...existingBlocks, ...result.blocks] : result.blocks;
        onBlocksGenerated(newBlocks);
        message.success(`已生成 ${result.blocks.length} 个逻辑积木`);
        setPrompt('');  // 清空输入
      } else {
        message.error(result.error || '生成失败，请重试');
      }
    } catch (error) {
      message.error('生成过程出错');
      console.error('AI 生成错误:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [componentName, componentType, existingBlocks, onBlocksGenerated, availableScenes]);

  // 生成（追加模式）
  const handleGenerate = useCallback(() => {
    doGenerate(prompt, true);
  }, [prompt, doGenerate]);

  // 重新生成（替换现有积木）
  const handleRegenerate = useCallback(() => {
    const promptToUse = prompt.trim() || lastPrompt;
    if (!promptToUse) {
      message.warning('请先输入描述或生成过一次');
      return;
    }
    doGenerate(promptToUse, false);  // 替换模式
  }, [prompt, lastPrompt, doGenerate]);

  // 清空当前积木
  const handleClear = useCallback(() => {
    if (existingBlocks.length === 0) {
      message.info('当前没有积木');
      return;
    }
    onBlocksGenerated([]);
    message.success('已清空所有积木');
    setLastResult(null);
  }, [existingBlocks, onBlocksGenerated]);

  // 示例提示词
  const examplePrompts = [
    '用WASD键控制角色移动',
    '碰到金币后得分并消失',
    '敌人自动左右巡逻',
    '按空格键跳跃',
    '碰到敌人后扣血闪烁',
  ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a1a',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        {/* API 配置提示 */}
        {!isConfigured && !showConfig && (
          <div style={{
            padding: '8px 10px',
            marginBottom: 10,
            background: 'rgba(250, 173, 20, 0.1)',
            border: '1px solid #faad14',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <Text style={{ color: '#faad14', fontSize: 11, whiteSpace: 'nowrap' }}>
              需要配置 AI API
            </Text>
            <Button size="small" onClick={() => setShowConfig(true)}>
              设置
            </Button>
          </div>
        )}

        {/* API 配置面板 */}
        {showConfig && (
          <div style={{
            padding: 10,
            background: '#252525',
            borderRadius: 6,
            marginBottom: 10,
          }}>
            <Text style={{ color: '#888', fontSize: 11, display: 'block', marginBottom: 8 }}>
              <SettingOutlined style={{ marginRight: 4 }} />
              AI API 配置（全局生效，配置一次即可）
            </Text>
            {/* API 服务预设选择 */}
            <Select
              size="small"
              value={selectedPreset}
              onChange={handlePresetChange}
              style={{ width: '100%', marginBottom: 6 }}
              options={API_PRESETS.map(p => ({ label: p.label, value: p.label }))}
            />
            <Input
              size="small"
              placeholder="API Endpoint"
              value={apiEndpoint}
              onChange={(e) => { setApiEndpoint(e.target.value); setSelectedPreset('自定义'); setTestResult(null); }}
              style={{ marginBottom: 6, background: '#333', borderColor: '#404040' }}
            />
            <Input.Password
              size="small"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
              style={{ marginBottom: 6, background: '#333', borderColor: '#404040' }}
            />
            <Input
              size="small"
              placeholder="模型名称 (默认 gpt-4)"
              value={model}
              onChange={(e) => { setModel(e.target.value); setTestResult(null); }}
              style={{ marginBottom: 8, background: '#333', borderColor: '#404040' }}
            />
            {/* 测试结果显示 */}
            {testResult && (
              <div style={{
                padding: '4px 8px',
                marginBottom: 8,
                borderRadius: 4,
                background: testResult.success ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                border: `1px solid ${testResult.success ? '#52c41a' : '#ff4d4f'}`,
              }}>
                <Text style={{ color: testResult.success ? '#52c41a' : '#ff4d4f', fontSize: 10 }}>
                  {testResult.success ? '✓ 连接成功' : `✗ ${testResult.error}`}
                </Text>
              </div>
            )}
            <Space>
              <Button
                size="small"
                onClick={handleTestConnection}
                disabled={isTesting || !apiEndpoint.trim() || !apiKey.trim()}
                icon={isTesting ? <LoadingOutlined /> : <CheckCircleOutlined />}
              >
                {isTesting ? '测试中...' : '测试连接'}
              </Button>
              <Button size="small" type="primary" onClick={handleSaveConfig}>
                保存
              </Button>
              <Button size="small" onClick={() => { setShowConfig(false); setTestResult(null); }}>
                取消
              </Button>
            </Space>
          </div>
        )}

        {/* 输入区域 */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#888', fontSize: 11 }}>
              为 "{componentName}" 描述游戏行为：
            </Text>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setShowConfig(!showConfig)}
              style={{ color: '#888', fontSize: 10 }}
            />
          </div>

          {/* 场景提示 */}
          {availableScenes.length > 0 && (
            <div style={{
              padding: '4px 8px',
              marginBottom: 6,
              background: '#252525',
              borderRadius: 4,
              border: '1px solid #333',
            }}>
              <Text style={{ color: '#666', fontSize: 10 }}>
                💡 可用场景: {availableScenes.join('、')}
              </Text>
            </div>
          )}

          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：用WASD控制移动，碰到金币得分..."
            rows={2}
            style={{
              background: '#252525',
              borderColor: '#404040',
              color: '#fff',
              resize: 'none',
              fontSize: 12,
            }}
            onPressEnter={(e) => {
              if (e.ctrlKey || e.metaKey) {
                handleGenerate();
              }
            }}
          />

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={existingBlocks.length === 0}
            >
              清空
            </Button>
            <Space>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
                disabled={isGenerating || (!prompt.trim() && !lastPrompt)}
                title="重新生成（替换现有积木）"
              >
                重新生成
              </Button>
              <Button
                type="primary"
                size="small"
                icon={isGenerating ? <Spin size="small" /> : <SendOutlined />}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                生成
              </Button>
            </Space>
          </div>
        </div>

        {/* 示例提示词 */}
        <div style={{ marginBottom: 10 }}>
          <Text style={{ color: '#666', fontSize: 10, display: 'block', marginBottom: 4 }}>
            示例：
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {examplePrompts.map((example, index) => (
              <span
                key={index}
                onClick={() => setPrompt(example)}
                style={{
                  cursor: 'pointer',
                  padding: '2px 6px',
                  background: '#252525',
                  border: '1px solid #404040',
                  borderRadius: 4,
                  color: '#888',
                  fontSize: 10,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1677ff';
                  e.currentTarget.style.color = '#1677ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#404040';
                  e.currentTarget.style.color = '#888';
                }}
              >
                {example}
              </span>
            ))}
          </div>
        </div>

        {/* 生成结果提示 */}
        {lastResult && (
          <div style={{
            padding: 8,
            background: lastResult.success ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
            borderRadius: 4,
            border: `1px solid ${lastResult.success ? '#52c41a' : '#ff4d4f'}`,
          }}>
            <Text style={{ color: lastResult.success ? '#52c41a' : '#ff4d4f', fontSize: 11 }}>
              {lastResult.explanation || (lastResult.success ? '生成成功' : lastResult.error)}
            </Text>
          </div>
        )}

        {/* 当前积木数量 */}
        {existingBlocks.length > 0 && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Text style={{ color: '#666', fontSize: 10 }}>
              当前已有 {existingBlocks.length} 个积木
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIBlockGeneratorPanel;
