import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Layout, Empty, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SwapOutlined, DeleteOutlined, CopyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useUIStore, usePageStore, useProjectStore, useCollaborationStore } from '@/stores';
import type { ComponentInstance, Position } from '@/types/miniprogram';
import { CursorOverlay, CommentMarkers } from '@/components/collaboration';
import { useRealtime, useCursorSync, useSelectionSync } from '@/hooks';
import { Ruler, RulerCorner } from './Ruler';
import { GamePreview } from '@/components/preview/GamePreview';
import { GamePreviewTest } from '@/components/preview/GamePreviewTest';

const { Content } = Layout;

// 对齐线状态
interface AlignmentLine {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

// 拖拽状态
interface DragState {
  isDragging: boolean;
  componentId: string | null;
  startPos: Position;
  currentPos: Position;
  offset: Position;
}

const ALIGNMENT_THRESHOLD = 5; // 对齐阈值（像素）

export const Workspace: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    componentId: null,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });

  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const [dragPreviewPos, setDragPreviewPos] = useState<Position | null>(null);

  const {
    zoom,
    showGrid,
    device,
    snapToGrid,
    isPlaying,
    setIsPlaying,
    openMaterialModal,
  } = useUIStore();

  const {
    currentPageId,
    selectedComponentId,
    hoveredComponentId,
    selectComponent,
    hoverComponent,
    addComponent,
    moveComponent,
    updateComponent,
    deleteComponent,
    saveHistory,
    getCurrentPage,
  } = usePageStore();

  const { currentProject, cloudProjectId } = useProjectStore();
  const currentPage = getCurrentPage();

  // 协作功能
  const { isCollaborating } = useCollaborationStore();
  const { updateCursor } = useCursorSync(cloudProjectId);
  const { broadcastSelection } = useSelectionSync(cloudProjectId);

  // 启用实时协作
  useRealtime(cloudProjectId, !!cloudProjectId);

  // 全局监听拖拽结束和取消，确保清除预览
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDragPreviewPos(null);
      setAlignmentLines([]);
    };

    const handleGlobalDrop = () => {
      // 延迟清除，确保 handleDrop 完成后再清除
      setTimeout(() => {
        setDragPreviewPos(null);
        setAlignmentLines([]);
      }, 50);
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // 当选中组件变化时广播
  useEffect(() => {
    if (cloudProjectId && isCollaborating) {
      broadcastSelection(selectedComponentId);
    }
  }, [selectedComponentId, cloudProjectId, isCollaborating, broadcastSelection]);

  // 处理鼠标移动以更新光标位置
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cloudProjectId || !isCollaborating || !canvasRef.current || !currentPageId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    updateCursor({
      pageId: currentPageId,
      x,
      y,
    });
  }, [cloudProjectId, isCollaborating, zoom, currentPageId, updateCursor]);

  // 计算对齐提示线
  const calculateAlignmentLines = useCallback((
    targetPos: Position,
    targetSize: { width: number; height: number },
    excludeId?: string
  ): AlignmentLine[] => {
    if (!currentPage) return [];

    const lines: AlignmentLine[] = [];
    const targetLeft = targetPos.x;
    const targetRight = targetPos.x + targetSize.width;
    const targetCenterX = targetPos.x + targetSize.width / 2;
    const targetTop = targetPos.y;
    const targetBottom = targetPos.y + targetSize.height;
    const targetCenterY = targetPos.y + targetSize.height / 2;

    currentPage.components.forEach((comp) => {
      if (comp.id === excludeId) return;

      const compLeft = comp.position.x;
      const compRight = comp.position.x + comp.size.width;
      const compCenterX = comp.position.x + comp.size.width / 2;
      const compTop = comp.position.y;
      const compBottom = comp.position.y + comp.size.height;
      const compCenterY = comp.position.y + comp.size.height / 2;

      // 水平对齐检测
      // 左边对齐
      if (Math.abs(targetLeft - compLeft) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'vertical', position: compLeft, start: Math.min(targetTop, compTop), end: Math.max(targetBottom, compBottom) });
      }
      // 右边对齐
      if (Math.abs(targetRight - compRight) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'vertical', position: compRight, start: Math.min(targetTop, compTop), end: Math.max(targetBottom, compBottom) });
      }
      // 中心对齐
      if (Math.abs(targetCenterX - compCenterX) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'vertical', position: compCenterX, start: Math.min(targetTop, compTop), end: Math.max(targetBottom, compBottom) });
      }

      // 垂直对齐检测
      // 顶部对齐
      if (Math.abs(targetTop - compTop) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'horizontal', position: compTop, start: Math.min(targetLeft, compLeft), end: Math.max(targetRight, compRight) });
      }
      // 底部对齐
      if (Math.abs(targetBottom - compBottom) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'horizontal', position: compBottom, start: Math.min(targetLeft, compLeft), end: Math.max(targetRight, compRight) });
      }
      // 中心对齐
      if (Math.abs(targetCenterY - compCenterY) < ALIGNMENT_THRESHOLD) {
        lines.push({ type: 'horizontal', position: compCenterY, start: Math.min(targetLeft, compLeft), end: Math.max(targetRight, compRight) });
      }
    });

    return lines;
  }, [currentPage]);

  // 处理拖放
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    if (!componentType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;

    // 网格吸附
    if (snapToGrid) {
      x = Math.round(x / 10) * 10;
      y = Math.round(y / 10) * 10;
    }

    // 检查是否有 MaterialLibrary 的素材数据
    const materialData = e.dataTransfer.getData('material');
    if (materialData) {
      try {
        const material = JSON.parse(materialData);
        // 如果是素材拖拽，创建图片组件并设置素材的图片URL
        addComponent(componentType, {
          position: { x, y },
          props: { src: material.url || material.thumbnail }
        });
      } catch (err) {
        console.error('解析素材数据失败:', err);
        addComponent(componentType, { position: { x, y } });
      }
    } else {
      // 检查是否有 LeftSidebar 的预置素材数据
      const imageSrc = e.dataTransfer.getData('imageSrc');
      const imageName = e.dataTransfer.getData('imageName');

      if (imageSrc) {
        // 预置素材或资源拖拽
        addComponent(componentType, {
          position: { x, y },
          props: { src: imageSrc },
          name: imageName || undefined
        });
      } else {
        // 普通组件拖拽
        addComponent(componentType, { position: { x, y } });
      }
    }

    setDragPreviewPos(null);
    setAlignmentLines([]);
  }, [addComponent, zoom, snapToGrid]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / zoom;
    let y = (e.clientY - rect.top) / zoom;

    if (snapToGrid) {
      x = Math.round(x / 10) * 10;
      y = Math.round(y / 10) * 10;
    }

    setDragPreviewPos({ x, y });

    // 计算对齐线
    const lines = calculateAlignmentLines({ x, y }, { width: 100, height: 100 });
    setAlignmentLines(lines);

    e.dataTransfer.dropEffect = 'copy';
  }, [zoom, snapToGrid, calculateAlignmentLines]);

  // 处理拖拽离开画布区域
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 检查是否真的离开了画布容器
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !canvasRef.current?.contains(relatedTarget)) {
      setDragPreviewPos(null);
      setAlignmentLines([]);
    }
  }, []);

  // 处理组件大小调整
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    component: ComponentInstance,
    handle: string
  ) => {
    e.stopPropagation();
    if (component.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...component.size };
    const startPos = { ...component.position };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;

      // 根据不同的控制点计算新的大小和位置
      switch (handle) {
        case 'top-left':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height - deltaY;
          newX = startPos.x + deltaX;
          newY = startPos.y + deltaY;
          break;
        case 'top-right':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height - deltaY;
          newY = startPos.y + deltaY;
          break;
        case 'bottom-left':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height + deltaY;
          newX = startPos.x + deltaX;
          break;
        case 'bottom-right':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height + deltaY;
          break;
        case 'top':
          newHeight = startSize.height - deltaY;
          newY = startPos.y + deltaY;
          break;
        case 'bottom':
          newHeight = startSize.height + deltaY;
          break;
        case 'left':
          newWidth = startSize.width - deltaX;
          newX = startPos.x + deltaX;
          break;
        case 'right':
          newWidth = startSize.width + deltaX;
          break;
      }

      // 限制最小尺寸
      const minSize = 20;
      if (newWidth < minSize) {
        newWidth = minSize;
        newX = startPos.x;
      }
      if (newHeight < minSize) {
        newHeight = minSize;
        newY = startPos.y;
      }

      // 网格吸附
      if (snapToGrid) {
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }

      // 更新组件大小和位置
      updateComponent(component.id, {
        size: { width: newWidth, height: newHeight },
        position: { x: newX, y: newY },
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      saveHistory();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [zoom, snapToGrid, updateComponent, saveHistory]);

  // 处理组件拖拽开始
  const handleComponentMouseDown = useCallback((e: React.MouseEvent, component: ComponentInstance) => {
    if (component.locked) return;

    e.stopPropagation();
    selectComponent(component.id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    dragStateRef.current = {
      isDragging: true,
      componentId: component.id,
      startPos: { ...component.position },
      currentPos: { ...component.position },
      offset: { x: offsetX, y: offsetY },
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      let newX = (e.clientX - canvasRect.left - dragStateRef.current.offset.x) / zoom;
      let newY = (e.clientY - canvasRect.top - dragStateRef.current.offset.y) / zoom;

      // 网格吸附
      if (snapToGrid) {
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }

      // 对齐吸附：如果对齐线存在，自动调整位置
      const lines = calculateAlignmentLines(
        { x: newX, y: newY },
        component.size,
        component.id
      );

      // 应用对齐吸附
      if (lines.length > 0) {
        lines.forEach(line => {
          if (line.type === 'vertical') {
            const componentLeft = newX;
            const componentRight = newX + component.size.width;
            const componentCenterX = newX + component.size.width / 2;

            if (Math.abs(componentLeft - line.position) < ALIGNMENT_THRESHOLD) {
              newX = line.position;
            } else if (Math.abs(componentRight - line.position) < ALIGNMENT_THRESHOLD) {
              newX = line.position - component.size.width;
            } else if (Math.abs(componentCenterX - line.position) < ALIGNMENT_THRESHOLD) {
              newX = line.position - component.size.width / 2;
            }
          } else {
            const componentTop = newY;
            const componentBottom = newY + component.size.height;
            const componentCenterY = newY + component.size.height / 2;

            if (Math.abs(componentTop - line.position) < ALIGNMENT_THRESHOLD) {
              newY = line.position;
            } else if (Math.abs(componentBottom - line.position) < ALIGNMENT_THRESHOLD) {
              newY = line.position - component.size.height;
            } else if (Math.abs(componentCenterY - line.position) < ALIGNMENT_THRESHOLD) {
              newY = line.position - component.size.height / 2;
            }
          }
        });
      }

      dragStateRef.current.currentPos = { x: newX, y: newY };
      setAlignmentLines(lines);

      // 强制重新渲染以更新拖拽位置
      moveComponent(dragStateRef.current.componentId!, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        moveComponent(dragStateRef.current.componentId!, dragStateRef.current.currentPos);
        dragStateRef.current.isDragging = false;
        dragStateRef.current.componentId = null;
        setAlignmentLines([]);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [selectComponent, zoom, snapToGrid, moveComponent, calculateAlignmentLines]);

  // 点击画布空白处取消选择
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-container')) {
      selectComponent(null);
    }
  }, [selectComponent]);

  // 构建组件右键菜单
  const getComponentContextMenu = useCallback((component: ComponentInstance): MenuProps => {
    return {
      items: [
        {
          key: 'replace-material',
          icon: <SwapOutlined />,
          label: '替换素材',
          onClick: () => {
            selectComponent(component.id);
            openMaterialModal(component.id);
          },
        },
        {
          type: 'divider',
        },
        {
          key: 'copy',
          icon: <CopyOutlined />,
          label: '复制',
          disabled: component.locked,
        },
        {
          key: 'lock',
          icon: component.locked ? <UnlockOutlined /> : <LockOutlined />,
          label: component.locked ? '解锁' : '锁定',
          onClick: () => {
            updateComponent(component.id, { locked: !component.locked });
          },
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true,
          disabled: component.locked,
          onClick: () => {
            deleteComponent(component.id);
          },
        },
      ],
    };
  }, [selectComponent, openMaterialModal, updateComponent, deleteComponent]);

  // 渲染组件
  const renderComponent = (component: ComponentInstance) => {
    const isSelected = selectedComponentId === component.id;
    const isHovered = hoveredComponentId === component.id;
    const isDragging = dragStateRef.current.isDragging && dragStateRef.current.componentId === component.id;

    // 如果正在拖拽这个组件，使用预览位置
    const displayX = isDragging ? dragStateRef.current.currentPos.x : component.position.x;
    const displayY = isDragging ? dragStateRef.current.currentPos.y : component.position.y;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: displayX,
      top: displayY,
      width: component.size.width,
      height: component.size.height,
      zIndex: component.zIndex,
      opacity: component.visible ? (isDragging ? 0.8 : 1) : 0.3,
      cursor: component.locked ? 'not-allowed' : 'move',
      ...component.styles,
      outline: isSelected
        ? '2px solid #1677ff'
        : isHovered
        ? '1px dashed rgba(22, 119, 255, 0.5)'
        : 'none',
      outlineOffset: '1px',
      transition: isDragging ? 'none' : 'outline 0.15s',
    };

    // 根据组件类型渲染不同的预览
    const renderContent = () => {
      switch (component.type) {
        case 'view':
          return (
            <div style={{ width: '100%', height: '100%', background: '#f5f5f5', border: '1px dashed #ddd' }}>
              {component.children?.map(renderComponent)}
            </div>
          );
        case 'text':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: component.styles.textAlign === 'center' ? 'center' :
                         component.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
              fontSize: component.styles.fontSize as string || '14px',
              color: component.styles.color as string || '#333',
              fontWeight: component.styles.fontWeight as string || 'normal',
              fontStyle: component.styles.fontStyle as string || 'normal',
              textAlign: component.styles.textAlign as any || 'left',
              lineHeight: component.styles.lineHeight as string || '1.5',
              textDecoration: component.styles.textDecoration as string || 'none',
              letterSpacing: component.styles.letterSpacing as string || 'normal',
              textShadow: component.styles.textShadow as string || 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {component.props.content as string || '文本内容'}
            </div>
          );
        case 'button':
          return (
            <button
              style={{
                width: '100%',
                height: '100%',
                background: component.props.type === 'primary' ? '#1677ff' : '#fff',
                color: component.props.type === 'primary' ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {component.props.content as string || '按钮'}
            </button>
          );
        case 'input':
          return (
            <input
              type={(component.props.type as string) || 'text'}
              placeholder={(component.props.placeholder as string) || '请输入'}
              value={(component.props.value as string) || ''}
              readOnly
              style={{
                width: '100%',
                height: '100%',
                padding: '0 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                background: '#fff',
                color: '#333',
                pointerEvents: 'none', // 编辑模式下不可交互
                ...component.styles,
              }}
            />
          );
        case 'image':
          return component.props.src ? (
            <img
              src={component.props.src as string}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: component.props.mode as string || 'cover' } as React.CSSProperties}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              图片占位
            </div>
          );
        case 'joystick':
          // 虚拟摇杆在编辑模式的预览
          const joystickSize = (component.props.size as number) || 120;
          const knobSize = joystickSize * 0.4;
          return (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.05)',
              border: '2px dashed #999',
              borderRadius: '50%',
            }}>
              {/* 摇杆底座 */}
              <div style={{
                width: joystickSize,
                height: joystickSize,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '3px solid rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                {/* 操纵杆 */}
                <div style={{
                  width: knobSize,
                  height: knobSize,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#666',
                    fontSize: 10,
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                  }}>
                    🕹️
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#f5f5f5',
                border: '1px dashed #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 12,
              }}
            >
              {component.type}
            </div>
          );
      }
    };

    // 渲染选中控制点
    const renderResizeHandles = () => {
      if (!isSelected) return null;

      const handleStyle: React.CSSProperties = {
        position: 'absolute',
        width: 8,
        height: 8,
        background: '#fff',
        border: '2px solid #1677ff',
        borderRadius: 1,
      };

      const handles = [
        { pos: 'top-left', x: -4, y: -4 },
        { pos: 'top-right', x: 'calc(100% - 4px)', y: -4 },
        { pos: 'bottom-left', x: -4, y: 'calc(100% - 4px)' },
        { pos: 'bottom-right', x: 'calc(100% - 4px)', y: 'calc(100% - 4px)' },
        { pos: 'top', x: 'calc(50% - 4px)', y: -4 },
        { pos: 'bottom', x: 'calc(50% - 4px)', y: 'calc(100% - 4px)' },
        { pos: 'left', x: -4, y: 'calc(50% - 4px)' },
        { pos: 'right', x: 'calc(100% - 4px)', y: 'calc(50% - 4px)' },
      ];

      return handles.map((h) => (
        <div
          key={h.pos}
          style={{
            ...handleStyle,
            left: h.x,
            top: h.y,
            cursor: `${h.pos.includes('left') || h.pos.includes('right') ? 'ew' : ''}${
              h.pos.includes('top') || h.pos.includes('bottom') ? 'ns' : ''
            }-resize`,
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, component, h.pos)}
        />
      ));
    };

    return (
      <Dropdown
        menu={getComponentContextMenu(component)}
        trigger={['contextMenu']}
        key={component.id}
      >
        <div
          style={style}
          onMouseDown={(e) => handleComponentMouseDown(e, component)}
          onMouseEnter={() => hoverComponent(component.id)}
          onMouseLeave={() => hoverComponent(null)}
        >
          {renderContent()}
          {renderResizeHandles()}
        </div>
      </Dropdown>
    );
  };

  // 渲染对齐提示线
  const renderAlignmentLines = () => {
    return alignmentLines.map((line, index) => {
      const lineStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: '#1677ff',
        pointerEvents: 'none',
        zIndex: 9999,
      };

      if (line.type === 'horizontal') {
        return (
          <div
            key={index}
            style={{
              ...lineStyle,
              left: line.start,
              top: line.position,
              width: line.end - line.start,
              height: 1,
            }}
          />
        );
      } else {
        return (
          <div
            key={index}
            style={{
              ...lineStyle,
              left: line.position,
              top: line.start,
              width: 1,
              height: line.end - line.start,
            }}
          />
        );
      }
    });
  };

  // 渲染拖拽预览
  const renderDragPreview = () => {
    if (!dragPreviewPos) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: dragPreviewPos.x,
          top: dragPreviewPos.y,
          width: 100,
          height: 100,
          border: '2px dashed #1677ff',
          background: 'rgba(22, 119, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
    );
  };

  if (!currentProject) {
    return (
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
        }}
      >
        <Empty description="请先选择或创建一个项目" />
      </Content>
    );
  }

  if (!currentPageId || !currentPage) {
    return (
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
        }}
      >
        <Empty description="请选择一个页面开始编辑" />
      </Content>
    );
  }

  return (
    <>
      {/* 游戏预览模式 - 测试版本 */}
      {isPlaying && (
        <GamePreviewTest onClose={() => setIsPlaying(false)} />
      )}

      <Content
        className="canvas-container"
        onClick={handleCanvasClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#0f0f0f',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
      {/* 标尺区域 */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        <RulerCorner />
        <Ruler
          type="horizontal"
          zoom={zoom}
        />
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Ruler
          type="vertical"
          zoom={zoom}
        />

        {/* 画布滚动区域 */}
        <div
          onDragLeave={(e) => {
            // 如果离开滚动区域，清除预览
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
              setDragPreviewPos(null);
              setAlignmentLines([]);
            }
          }}
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {/* 设备框架 */}
          <div
            style={{
              width: device.width * zoom,
              height: device.height * zoom,
              background: '#fff',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid #333',
              flexShrink: 0,
            }}
          >
            {/* 画布 */}
            <div
              ref={canvasRef}
              data-canvas-container
              className={showGrid ? 'canvas-grid' : ''}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onMouseMove={handleCanvasMouseMove}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                backgroundColor: currentPage.config?.backgroundColor || '#fff',
              }}
            >
              {/* 背景图层 - 按order排序渲染 */}
              {currentPage.backgroundLayers
                ?.sort((a, b) => a.order - b.order)
                .map((layer) => (
                  layer.visible && (
                    <div
                      key={layer.id}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: layer.order,
                        pointerEvents: 'none',
                      }}
                    >
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  )
                ))}

              {currentPage.components.map(renderComponent)}
              {renderAlignmentLines()}
              {renderDragPreview()}

              {/* 协作光标覆盖层 */}
              {cloudProjectId && isCollaborating && currentPageId && (
                <CursorOverlay
                  currentPageId={currentPageId}
                  zoom={zoom}
                />
              )}

              {/* 评论标记 */}
              {cloudProjectId && (
                <CommentMarkers
                  projectId={cloudProjectId}
                  currentPageId={currentPageId || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 缩放显示 */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(30, 30, 30, 0.9)',
          padding: '8px 12px',
          borderRadius: 6,
          color: '#a0a0a0',
          fontSize: 12,
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </Content>
    </>
  );
};

export default Workspace;
