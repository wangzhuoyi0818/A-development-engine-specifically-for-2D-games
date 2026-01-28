import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Space,
  Typography,
  Progress,
  Tag,
  Button,
  Tooltip,
  Row,
  Col,
} from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import { usePageStore, useProjectStore } from '@/stores';

const { Text } = Typography;

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  componentCount: number;
  pageCount: number;
}

interface PerformanceMonitorProps {
  visible?: boolean;
  compact?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = true,
  compact = true,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderTime: 0,
    componentCount: 0,
    pageCount: 0,
  });
  const [isExpanded, setIsExpanded] = useState(!compact);
  const lastTimeRef = useRef<number>(performance.now());
  const framesRef = useRef<number>(0);

  const { getCurrentPage } = usePageStore();
  const { currentProject } = useProjectStore();
  const currentPage = getCurrentPage();

  // 计算 FPS
  useEffect(() => {
    if (!visible) return;

    let animationId: number;

    const measureFPS = () => {
      framesRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const fps = Math.round((framesRef.current * 1000) / delta);
        framesRef.current = 0;
        lastTimeRef.current = now;

        // 获取内存使用（如果可用）
        let memory = 0;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
        }

        // 计算组件数量
        const componentCount = currentPage?.components?.length || 0;
        const pageCount = currentProject?.pages?.length || 0;

        setMetrics(prev => ({
          ...prev,
          fps,
          memory,
          componentCount,
          pageCount,
        }));
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [visible, currentPage, currentProject]);

  // FPS 状态颜色
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#52c41a';
    if (fps >= 30) return '#faad14';
    return '#ff4d4f';
  };

  // FPS 状态标签
  const getFPSStatus = (fps: number) => {
    if (fps >= 55) return '流畅';
    if (fps >= 30) return '一般';
    return '卡顿';
  };

  if (!visible) return null;

  // 紧凑模式
  if (compact && !isExpanded) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'rgba(0, 0, 0, 0.75)',
          borderRadius: 8,
          padding: '8px 12px',
          zIndex: 1000,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(true)}
      >
        <Space size={12}>
          <Tooltip title="FPS">
            <Space size={4}>
              <DashboardOutlined style={{ color: getFPSColor(metrics.fps) }} />
              <Text style={{ color: getFPSColor(metrics.fps), fontFamily: 'monospace' }}>
                {metrics.fps}
              </Text>
            </Space>
          </Tooltip>
          {metrics.memory > 0 && (
            <Tooltip title="内存">
              <Space size={4}>
                <DatabaseOutlined style={{ color: '#1677ff' }} />
                <Text style={{ color: '#fff', fontFamily: 'monospace' }}>
                  {metrics.memory}MB
                </Text>
              </Space>
            </Tooltip>
          )}
          <Tooltip title="组件数">
            <Space size={4}>
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              <Text style={{ color: '#fff', fontFamily: 'monospace' }}>
                {metrics.componentCount}
              </Text>
            </Space>
          </Tooltip>
        </Space>
      </div>
    );
  }

  // 展开模式
  return (
    <Card
      title={
        <Space>
          <DashboardOutlined />
          性能监控
        </Space>
      }
      size="small"
      extra={
        <Space>
          <Tooltip title="刷新">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                framesRef.current = 0;
                lastTimeRef.current = performance.now();
              }}
            />
          </Tooltip>
          <Tooltip title={isExpanded ? '收起' : '展开'}>
            <Button
              type="text"
              size="small"
              icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setIsExpanded(!isExpanded)}
            />
          </Tooltip>
        </Space>
      }
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 320,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Row gutter={[16, 16]}>
        {/* FPS */}
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="dashboard"
              percent={Math.min(100, (metrics.fps / 60) * 100)}
              size={80}
              strokeColor={getFPSColor(metrics.fps)}
              format={() => (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: getFPSColor(metrics.fps) }}>
                    {metrics.fps}
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>FPS</div>
                </div>
              )}
            />
            <Tag color={getFPSColor(metrics.fps)} style={{ marginTop: 8 }}>
              {getFPSStatus(metrics.fps)}
            </Tag>
          </div>
        </Col>

        {/* 统计信息 */}
        <Col span={12}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {metrics.memory > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <DatabaseOutlined /> 内存使用
                </Text>
                <div style={{ fontWeight: 'bold' }}>{metrics.memory} MB</div>
              </div>
            )}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ThunderboltOutlined /> 组件数量
              </Text>
              <div style={{ fontWeight: 'bold' }}>{metrics.componentCount}</div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> 页面数量
              </Text>
              <div style={{ fontWeight: 'bold' }}>{metrics.pageCount}</div>
            </div>
          </Space>
        </Col>
      </Row>

      {/* 性能建议 */}
      <div style={{ marginTop: 12, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
        <Text style={{ fontSize: 11 }}>
          {metrics.fps >= 55 ? (
            <span style={{ color: '#52c41a' }}>✓ 性能良好，运行流畅</span>
          ) : metrics.fps >= 30 ? (
            <span style={{ color: '#faad14' }}>⚠ 性能一般，建议优化组件数量</span>
          ) : (
            <span style={{ color: '#ff4d4f' }}>✗ 性能较差，请检查复杂计算或减少组件</span>
          )}
        </Text>
      </div>
    </Card>
  );
};

export default PerformanceMonitor;
