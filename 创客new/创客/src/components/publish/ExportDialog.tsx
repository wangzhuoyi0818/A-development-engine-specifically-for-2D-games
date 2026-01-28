import React, { useState, useCallback } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Progress,
  Steps,
  Card,
  Switch,
  Input,
  Alert,
  Collapse,
  Divider,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  ExportOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  FileZipOutlined,
  CodeOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  DownloadOutlined,
  FolderOutlined,
  FileTextOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '@/stores';
import MiniProgramExporter from '@/services/exporter';
import type { MiniProgramProject } from '@/types/miniprogram';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
}

type ExportStep = 'config' | 'analyze' | 'export' | 'complete';

interface AnalysisResult {
  totalFiles: number;
  totalSize: number;
  pageCount: number;
  componentCount: number;
  warnings: string[];
  suggestions: string[];
}

interface ExportConfig {
  projectName: string;
  appId: string;
  minify: boolean;
  includeComments: boolean;
  includeSourceMap: boolean;
  optimizeImages: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  visible,
  onClose,
}) => {
  const { currentProject } = useProjectStore();
  const [currentStep, setCurrentStep] = useState<ExportStep>('config');
  const [exportProgress, setExportProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewCode, setPreviewCode] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    projectName: currentProject?.name || '',
    appId: currentProject?.appId || '',
    minify: true,
    includeComments: false,
    includeSourceMap: false,
    optimizeImages: true,
  });

  // 分析项目
  const analyzeProject = useCallback(() => {
    if (!currentProject) return;

    setCurrentStep('analyze');
    setExportProgress(0);

    // 模拟分析过程
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 200);

    // 生成分析结果
    setTimeout(() => {
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // 检查项目配置
      if (!currentProject.appId) {
        warnings.push('未设置 AppID，导出后需要在微信开发者工具中配置');
      }

      // 检查页面
      if (currentProject.pages.length === 0) {
        warnings.push('项目中没有页面');
      }

      // 性能建议
      let totalComponents = 0;
      currentProject.pages.forEach(page => {
        totalComponents += page.components?.length || 0;
      });

      if (totalComponents > 50) {
        suggestions.push('组件数量较多，建议优化页面结构以提升性能');
      }

      if (currentProject.pages.length > 10) {
        suggestions.push('页面数量较多，建议使用分包加载');
      }

      suggestions.push('建议在微信开发者工具中开启代码压缩');
      suggestions.push('建议使用小程序性能分析工具检查运行时性能');

      // 预览代码
      const preview = MiniProgramExporter.previewCode(currentProject);
      setPreviewCode(preview);
      if (Object.keys(preview).length > 0) {
        setSelectedFile(Object.keys(preview)[0]);
      }

      setAnalysisResult({
        totalFiles: Object.keys(preview).length + 3, // 加上 config 文件
        totalSize: JSON.stringify(preview).length,
        pageCount: currentProject.pages.length,
        componentCount: totalComponents,
        warnings,
        suggestions,
      });

      setCurrentStep('analyze');
    }, 1200);
  }, [currentProject]);

  // 执行导出
  const handleExport = useCallback(async () => {
    if (!currentProject) return;

    setCurrentStep('export');
    setIsExporting(true);
    setExportProgress(0);

    try {
      // 模拟导出进度
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // 更新项目配置
      const projectToExport: MiniProgramProject = {
        ...currentProject,
        name: exportConfig.projectName,
        appId: exportConfig.appId,
      };

      await MiniProgramExporter.downloadProject(projectToExport, {
        minify: exportConfig.minify,
        includeComments: exportConfig.includeComments,
      });

      clearInterval(progressInterval);
      setExportProgress(100);
      setCurrentStep('complete');
      message.success('项目导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [currentProject, exportConfig]);

  // 复制代码
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('代码已复制到剪贴板');
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 渲染配置步骤
  const renderConfigStep = () => (
    <div style={{ padding: '20px 0' }}>
      <Card title="项目信息" size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">项目名称</Text>
            <Input
              value={exportConfig.projectName}
              onChange={(e) => setExportConfig(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="输入项目名称"
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text type="secondary">AppID（可选）</Text>
            <Input
              value={exportConfig.appId}
              onChange={(e) => setExportConfig(prev => ({ ...prev, appId: e.target.value }))}
              placeholder="输入微信小程序 AppID"
              style={{ marginTop: 4 }}
            />
          </div>
        </Space>
      </Card>

      <Card title="导出选项" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text>代码压缩</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>压缩 JS/WXSS 代码以减小体积</Text>
            </div>
            <Switch
              checked={exportConfig.minify}
              onChange={(checked) => setExportConfig(prev => ({ ...prev, minify: checked }))}
            />
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text>保留注释</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>在生成的代码中保留注释</Text>
            </div>
            <Switch
              checked={exportConfig.includeComments}
              onChange={(checked) => setExportConfig(prev => ({ ...prev, includeComments: checked }))}
            />
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text>图片优化</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>自动压缩图片资源</Text>
            </div>
            <Switch
              checked={exportConfig.optimizeImages}
              onChange={(checked) => setExportConfig(prev => ({ ...prev, optimizeImages: checked }))}
            />
          </div>
        </Space>
      </Card>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={analyzeProject}
        >
          分析项目
        </Button>
      </div>
    </div>
  );

  // 渲染分析步骤
  const renderAnalyzeStep = () => (
    <div style={{ padding: '20px 0' }}>
      {exportProgress < 100 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <Title level={4}>正在分析项目...</Title>
          <Progress percent={exportProgress} style={{ maxWidth: 300, margin: '0 auto' }} />
        </div>
      ) : analysisResult && (
        <>
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="文件数量"
                  value={analysisResult.totalFiles}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="预估大小"
                  value={formatSize(analysisResult.totalSize)}
                  prefix={<FolderOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="页面数"
                  value={analysisResult.pageCount}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="组件数"
                  value={analysisResult.componentCount}
                  prefix={<CodeOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 警告和建议 */}
          {analysisResult.warnings.length > 0 && (
            <Alert
              type="warning"
              message="注意事项"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {analysisResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {analysisResult.suggestions.length > 0 && (
            <Collapse defaultActiveKey={['suggestions']} style={{ marginBottom: 16 }}>
              <Panel header="优化建议" key="suggestions">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {analysisResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </Panel>
            </Collapse>
          )}

          {/* 代码预览 */}
          <Card
            title="代码预览"
            size="small"
            extra={
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => selectedFile && copyCode(previewCode[selectedFile])}
              >
                复制
              </Button>
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {/* 文件列表 */}
              <div style={{
                width: 180,
                maxHeight: 200,
                overflow: 'auto',
                borderRight: '1px solid #f0f0f0',
                paddingRight: 8,
              }}>
                {Object.keys(previewCode).map(file => (
                  <div
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    style={{
                      padding: '6px 8px',
                      cursor: 'pointer',
                      borderRadius: 4,
                      background: selectedFile === file ? '#e6f4ff' : 'transparent',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    {file.split('/').pop()}
                  </div>
                ))}
              </div>
              {/* 代码内容 */}
              <pre style={{
                flex: 1,
                margin: 0,
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4,
                fontSize: 11,
                maxHeight: 200,
                overflow: 'auto',
              }}>
                {previewCode[selectedFile] || '选择一个文件查看代码'}
              </pre>
            </div>
          </Card>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep('config')}>
              返回配置
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出项目
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // 渲染导出步骤
  const renderExportStep = () => (
    <div style={{ textAlign: 'center', padding: 40 }}>
      {exportProgress < 100 ? (
        <>
          <LoadingOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <Title level={4}>正在导出项目...</Title>
          <Progress percent={exportProgress} style={{ maxWidth: 300, margin: '0 auto' }} />
          <Paragraph type="secondary" style={{ marginTop: 16 }}>
            正在生成小程序代码包，请稍候...
          </Paragraph>
        </>
      ) : (
        <>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4}>导出完成！</Title>
        </>
      )}
    </div>
  );

  // 渲染完成步骤
  const renderCompleteStep = () => (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
      <Title level={4}>导出成功！</Title>
      <Paragraph>
        项目已成功导出为 ZIP 文件，请使用微信开发者工具打开。
      </Paragraph>

      <Card style={{ maxWidth: 400, margin: '24px auto', textAlign: 'left' }}>
        <Title level={5}>下一步</Title>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li>解压下载的 ZIP 文件</li>
          <li>打开微信开发者工具</li>
          <li>选择"导入项目"</li>
          <li>选择解压后的文件夹</li>
          <li>点击"导入"完成</li>
        </ol>
      </Card>

      <Space>
        <Button onClick={() => {
          setCurrentStep('config');
          setExportProgress(0);
        }}>
          再次导出
        </Button>
        <Button type="primary" onClick={onClose}>
          完成
        </Button>
      </Space>
    </div>
  );

  const stepComponents = {
    config: renderConfigStep,
    analyze: renderAnalyzeStep,
    export: renderExportStep,
    complete: renderCompleteStep,
  };

  const stepIndex = ['config', 'analyze', 'export', 'complete'].indexOf(currentStep);

  return (
    <Modal
      title={
        <Space>
          <ExportOutlined />
          导出小程序
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      destroyOnClose
    >
      {/* 步骤指示器 */}
      <Steps
        current={stepIndex}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: '配置', icon: <SettingOutlined /> },
          { title: '分析', icon: <ThunderboltOutlined /> },
          { title: '导出', icon: <FileZipOutlined /> },
          { title: '完成', icon: <CheckOutlined /> },
        ]}
      />

      {/* 步骤内容 */}
      {stepComponents[currentStep]()}
    </Modal>
  );
};

export default ExportDialog;
