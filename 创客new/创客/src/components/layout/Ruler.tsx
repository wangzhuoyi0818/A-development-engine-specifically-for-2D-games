import React, { useMemo } from 'react';

interface RulerProps {
  type: 'horizontal' | 'vertical';
  length?: number;
  zoom: number;
  offset?: number;
  thickness?: number;
}

const RULER_BG = '#252525';
const RULER_TEXT = '#888';
const RULER_LINE = '#555';
const MAJOR_TICK = 50; // 主刻度间隔
const MINOR_TICK = 10; // 次刻度间隔

export const Ruler: React.FC<RulerProps> = ({
  type,
  length,
  zoom,
  offset = 0,
  thickness = 20,
}) => {
  // 计算刻度 - 生成足够多的刻度覆盖常见画布尺寸
  const ticks = useMemo(() => {
    const result: { pos: number; label?: string; isMajor: boolean }[] = [];
    const maxLength = length ? length / zoom : 2000; // 默认2000px足够覆盖大部分场景
    const step = MINOR_TICK;

    for (let i = 0; i <= maxLength; i += step) {
      const isMajor = i % MAJOR_TICK === 0;
      result.push({
        pos: (i + offset) * zoom,
        label: isMajor ? String(i) : undefined,
        isMajor,
      });
    }

    return result;
  }, [length, zoom, offset]);

  if (type === 'horizontal') {
    return (
      <div
        style={{
          flex: 1,
          height: thickness,
          background: RULER_BG,
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `1px solid ${RULER_LINE}`,
          flexShrink: 0,
        }}
      >
        {ticks.map((tick, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: tick.pos,
              bottom: 0,
              width: 1,
              height: tick.isMajor ? 10 : 5,
              background: RULER_LINE,
            }}
          >
            {tick.label && (
              <span
                style={{
                  position: 'absolute',
                  left: 3,
                  top: -12,
                  fontSize: 9,
                  color: RULER_TEXT,
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 垂直标尺
  return (
    <div
      style={{
        width: thickness,
        height: length || '100%',
        background: RULER_BG,
        position: 'relative',
        overflow: 'hidden',
        borderRight: `1px solid ${RULER_LINE}`,
        flexShrink: 0,
      }}
    >
      {ticks.map((tick, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: tick.pos,
            right: 0,
            height: 1,
            width: tick.isMajor ? 10 : 5,
            background: RULER_LINE,
          }}
        >
          {tick.label && (
            <span
              style={{
                position: 'absolute',
                left: 2,
                top: 3,
                fontSize: 9,
                color: RULER_TEXT,
                whiteSpace: 'nowrap',
              }}
            >
              {tick.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// 标尺角落（左上角的小方块）
export const RulerCorner: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div
    style={{
      width: size,
      height: size,
      background: RULER_BG,
      borderRight: `1px solid ${RULER_LINE}`,
      borderBottom: `1px solid ${RULER_LINE}`,
      flexShrink: 0,
    }}
  />
);

export default Ruler;
