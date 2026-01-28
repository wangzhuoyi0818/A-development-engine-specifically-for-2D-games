import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Card,
  Steps,
  Tag,
  Divider,
  Progress,
  Tooltip,
} from 'antd';
import {
  RightOutlined,
  LeftOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  AppstoreOutlined,
  BlockOutlined,
  ControlOutlined,
  BookOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export interface TutorialStep {
  key: string;
  title: string;
  description: string;
  content?: React.ReactNode;
  target?: string;
  action?: string;
  image?: string;
}

// 教程步骤定义
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    key: 'welcome',
    title: '欢迎使用小程序可视化构建器',
    description: '通过这个教程，您将学习如何使用可视化工具快速创建小程序应用。',
    content: (
      <div style={{ padding: '20px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 20,
        }}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <AppstoreOutlined style={{ fontSize: 32, color: '#1677ff' }} />
            <div style={{ marginTop: 8 }}>
              <Text strong>拖拽组件</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>从左侧面板拖拽组件到画布</Text>
            </div>
          </Card>
          <Card size="small" style={{ textAlign: 'center' }}>
            <BlockOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            <div style={{ marginTop: 8 }}>
              <Text strong>可视化编程</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>使用积木块构建交互逻辑</Text>
            </div>
          </Card>
          <Card size="small" style={{ textAlign: 'center' }}>
            <PlayCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
            <div style={{ marginTop: 8 }}>
              <Text strong>实时预览</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>一键预览和调试您的应用</Text>
            </div>
          </Card>
        </div>
      </div>
    ),
  },
  {
    key: 'components',
    title: '组件面板',
    description: '左侧边栏提供了所有可用的组件，可以拖拽到画布中使用。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          左侧面板包含多个标签页：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li><Text strong>组件</Text> - 可拖拽的基础组件（按钮、文本、图片等）</li>
          <li><Text strong>页面</Text> - 管理项目的所有页面</li>
          <li><Text strong>图层</Text> - 查看和调整组件层级关系</li>
          <li><Text strong>素材库</Text> - 浏览和使用官方素材资源</li>
        </ul>
      </div>
    ),
    target: 'left-sidebar',
    action: '尝试从组件面板拖拽一个按钮到画布中',
  },
  {
    key: 'canvas',
    title: '画布区域',
    description: '中间的画布区域是您设计和布局页面的主要工作区。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          画布功能介绍：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li>拖拽组件到画布上进行布局</li>
          <li>点击选中组件后可以拖动位置</li>
          <li>使用网格和对齐线辅助精确布局</li>
          <li>支持缩放视图查看整体效果</li>
        </ul>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          提示：使用快捷键 Ctrl++ 和 Ctrl+- 可以缩放画布
        </Paragraph>
      </div>
    ),
    target: 'canvas',
    action: '在画布上点击选中一个组件，然后拖动它改变位置',
  },
  {
    key: 'properties',
    title: '属性面板',
    description: '右侧边栏可以编辑选中组件的属性、样式和事件。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          右侧面板包含三个标签：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li><Text strong>属性</Text> - 修改组件的基本属性（位置、尺寸等）</li>
          <li><Text strong>样式</Text> - 调整组件的 CSS 样式</li>
          <li><Text strong>事件</Text> - 为组件添加交互逻辑</li>
        </ul>
      </div>
    ),
    target: 'right-sidebar',
    action: '选中一个组件，在右侧面板修改它的属性',
  },
  {
    key: 'blocks',
    title: '可视化编程',
    description: '使用积木块式编程为组件添加交互逻辑，无需编写代码。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          在右侧面板的「事件」标签中：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li>选择一个事件触发器（如点击、长按等）</li>
          <li>点击打开积木编辑器</li>
          <li>从左侧拖拽积木块到工作区</li>
          <li>连接积木块构建逻辑流程</li>
        </ul>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          类似 Scratch 的编程方式，让编程变得简单有趣！
        </Paragraph>
      </div>
    ),
    target: 'block-editor',
    action: '为按钮组件添加一个点击事件',
  },
  {
    key: 'preview',
    title: '预览和调试',
    description: '使用顶部的预览按钮实时查看应用运行效果，并使用调试面板排查问题。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          预览和调试功能：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li>点击顶部工具栏的「预览」按钮开始预览</li>
          <li>按 F5 快速切换预览状态</li>
          <li>使用调试面板查看日志和组件信息</li>
          <li>按 F12 打开/关闭调试面板</li>
        </ul>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          调试面板包含控制台、组件检查器、网络监控和性能分析
        </Paragraph>
      </div>
    ),
    target: 'preview-button',
    action: '按 F5 启动预览模式',
  },
  {
    key: 'shortcuts',
    title: '常用快捷键',
    description: '掌握快捷键可以大大提高您的工作效率。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}>
          {[
            { key: 'Ctrl+S', desc: '保存项目' },
            { key: 'Ctrl+Z', desc: '撤销操作' },
            { key: 'Ctrl+Y', desc: '重做操作' },
            { key: 'Ctrl+D', desc: '复制组件' },
            { key: 'F5', desc: '预览/暂停' },
            { key: 'F12', desc: '调试面板' },
            { key: 'Ctrl+1', desc: '切换左侧面板' },
            { key: 'Ctrl+2', desc: '切换右侧面板' },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: '#1a1a1a',
                borderRadius: 4,
              }}
            >
              <Tag color="blue">{item.key}</Tag>
              <Text>{item.desc}</Text>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    key: 'resources',
    title: '素材资源',
    description: '使用内置的素材库快速为您的应用添加图片、音效和其他资源。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          素材库功能：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li>浏览按分类和风格组织的官方素材</li>
          <li>搜索和筛选素材</li>
          <li>预览素材效果</li>
          <li>收藏常用素材</li>
          <li>直接拖拽素材到画布使用</li>
        </ul>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          您也可以上传自己的资源文件到项目中
        </Paragraph>
      </div>
    ),
    target: 'materials',
    action: '打开素材库浏览可用的资源',
  },
  {
    key: 'export',
    title: '导出项目',
    description: '完成开发后，可以导出为微信小程序代码包。',
    content: (
      <div style={{ padding: '10px 0' }}>
        <Paragraph>
          导出功能：
        </Paragraph>
        <ul style={{ paddingLeft: 20 }}>
          <li>点击顶部「导出」按钮</li>
          <li>自动生成小程序代码</li>
          <li>下载压缩包文件</li>
          <li>使用微信开发者工具打开</li>
        </ul>
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          导出的代码包含所有页面、组件和逻辑
        </Paragraph>
      </div>
    ),
    target: 'export-button',
    action: '尝试导出一个测试项目',
  },
  {
    key: 'complete',
    title: '教程完成！',
    description: '恭喜您完成了基础教程。现在可以开始创建您的小程序应用了！',
    content: (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <RocketOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
        <Title level={4}>您已准备好开始创作！</Title>
        <Paragraph>
          记住，随时可以点击顶部帮助按钮重新查看本教程。
        </Paragraph>
        <Divider orientation="left">更多资源</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="link" icon={<BookOutlined />} style={{ paddingLeft: 0 }}>
            查看完整文档
          </Button>
          <Button type="link" icon={<ControlOutlined />} style={{ paddingLeft: 0 }}>
            查看所有快捷键
          </Button>
          <Button type="link" icon={<AppstoreOutlined />} style={{ paddingLeft: 0 }}>
            浏览示例项目
          </Button>
        </Space>
      </div>
    ),
  },
];

interface TutorialGuideProps {
  visible?: boolean;
  onClose?: () => void;
  initialStep?: number;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({
  visible = false,
  onClose,
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose?.();
  };

  // 快捷键支持
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, currentStep]);

  if (!visible) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      closable={false}
      footer={null}
      width={600}
      centered
      style={{ top: 20 }}
      bodyStyle={{ padding: 0 }}
    >
      {/* 进度条 */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Space>
            <RocketOutlined style={{ color: '#1677ff' }} />
            <Text strong>新手教程</Text>
            <Tag color="blue">{currentStep + 1}/{TUTORIAL_STEPS.length}</Tag>
          </Space>
          <Tooltip title="按 ESC 退出">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Tooltip>
        </div>
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor="#1677ff"
          size="small"
        />
      </div>

      {/* 步骤指示器 */}
      <div style={{ padding: '12px 24px' }}>
        <Steps
          current={currentStep}
          size="small"
          items={TUTORIAL_STEPS.map((step, index) => ({
            title: step.title,
            status: completedSteps.has(index) ? 'finish' : undefined,
            icon: completedSteps.has(index) ? <CheckOutlined /> : undefined,
          }))}
        />
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '24px', minHeight: 300 }}>
        <Title level={4}>{currentStepData.title}</Title>
        <Paragraph type="secondary">{currentStepData.description}</Paragraph>
        {currentStepData.content}
        {currentStepData.action && (
          <div style={{
            marginTop: 16,
            padding: 12,
            background: '#f0f5ff',
            borderRadius: 6,
            borderLeft: '3px solid #1677ff'
          }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
              <Text>
                <Text strong>试试看：</Text> {currentStepData.action}
              </Text>
            </Space>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <Button onClick={handleSkip}>
          跳过教程
        </Button>
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          <Button
            type="primary"
            icon={currentStep === TUTORIAL_STEPS.length - 1 ? <CheckOutlined /> : <RightOutlined />}
            onClick={handleNext}
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? '完成' : '下一步'}
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default TutorialGuide;
