import React from 'react';
import type { CadGuideData, ThemeMode } from '../types/machineVisualization.types';

interface CadHoverGuidesProps {
  cadGuide: CadGuideData | null;
  theme: ThemeMode;
}

export const CadHoverGuides: React.FC<CadHoverGuidesProps> = ({ cadGuide, theme }) => {
  if (!cadGuide || !cadGuide.isCursorCrosshair) return null;

  const strokeColor = theme === 'blueprint' ? '#38bdf8' : '#e8ecd9';
  const accentBg = theme === 'blueprint' ? '#0284c7' : '#3c4731';

  if (cadGuide.isCursorCrosshair) {
    return (
      <g className="pointer-events-none transition-opacity duration-150">
        <line
          x1={30}
          y1={cadGuide.y}
          x2={1890}
          y2={cadGuide.y}
          stroke={theme === 'blueprint' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(232, 236, 217, 0.4)'}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <line
          x1={cadGuide.x}
          y1={135}
          x2={cadGuide.x}
          y2={975}
          stroke={theme === 'blueprint' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(232, 236, 217, 0.4)'}
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <circle
          cx={cadGuide.x}
          cy={cadGuide.y}
          r={4}
          fill="none"
          stroke={theme === 'blueprint' ? 'rgba(56, 189, 248, 0.6)' : 'rgba(232, 236, 217, 0.6)'}
          strokeWidth={1.5}
        />
        <text
          x={cadGuide.x + 8}
          y={cadGuide.y - 8}
          fill={strokeColor}
          fontFamily="'Space Grotesk', sans-serif"
          fontSize={9}
          fontWeight={600}
        >
          X:{cadGuide.x} Y:{cadGuide.y}
        </text>
      </g>
    );
  }

  const { x, y, w, h, labelText } = cadGuide;
  const cx = Math.round(x + w / 2);
  const cy = Math.round(y + h / 2);
  const rightX = Math.round(x + w);
  const bottomY = Math.round(y + h);

  const displayTagY = cy - (h > 80 ? 0 : h / 2 + 25);

  return (
    <g className="pointer-events-none transition-opacity duration-150">
      {/* Laser Projection Crosshairs */}
      <line
        x1={20}
        y1={cy}
        x2={1260}
        y2={cy}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.6}
      />
      <line
        x1={cx}
        y1={90}
        x2={cx}
        y2={650}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.6}
      />

      {/* Corner Crosshair Markers */}
      <line x1={x - 10} y1={y - 4} x2={x + 2} y2={y - 4} stroke={strokeColor} strokeWidth={2} />
      <line x1={x - 4} y1={y - 10} x2={x - 4} y2={y + 2} stroke={strokeColor} strokeWidth={2} />

      <line x1={rightX + 4} y1={y - 10} x2={rightX + 4} y2={y + 2} stroke={strokeColor} strokeWidth={2} />
      <line x1={rightX - 2} y1={y - 4} x2={rightX + 10} y2={y - 4} stroke={strokeColor} strokeWidth={2} />

      <line x1={x - 10} y1={bottomY + 4} x2={x + 2} y2={bottomY + 4} stroke={strokeColor} strokeWidth={2} />
      <line x1={x - 4} y1={bottomY - 2} x2={x - 4} y2={bottomY + 10} stroke={strokeColor} strokeWidth={2} />

      <line x1={rightX - 2} y1={bottomY + 4} x2={rightX + 10} y2={bottomY + 4} stroke={strokeColor} strokeWidth={2} />
      <line x1={rightX + 4} y1={bottomY - 2} x2={rightX + 4} y2={bottomY + 10} stroke={strokeColor} strokeWidth={2} />

      {/* Vertical Dimension Extension Callout Line (Left) */}
      <line x1={x - 16} y1={y} x2={x - 16} y2={bottomY} stroke={strokeColor} strokeWidth={1.2} />
      <line x1={x - 20} y1={y} x2={x - 12} y2={y} stroke={strokeColor} strokeWidth={1.2} />
      <line x1={x - 20} y1={bottomY} x2={x - 12} y2={bottomY} stroke={strokeColor} strokeWidth={1.2} />

      {/* Left Height Dimension Badge */}
      <g transform={`translate(${x - 22}, ${cy}) rotate(-90)`}>
        <rect x={-35} y={-12} width={70} height={15} rx={3} fill={accentBg} stroke={strokeColor} strokeWidth={1} />
        <text
          x={0}
          y={-1}
          textAnchor="middle"
          fill={strokeColor}
          fontFamily="'Space Grotesk', sans-serif"
          fontSize={9}
          fontWeight={700}
        >
          H: {h}px
        </text>
      </g>

      {/* Center Intersection Coordinate Tag */}
      <g transform={`translate(${cx}, ${displayTagY})`}>
        <rect
          x={-65}
          y={-14}
          width={130}
          height={18}
          rx={4}
          fill={accentBg}
          stroke={strokeColor}
          strokeWidth={1.2}
          filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
        />
        <text
          x={0}
          y={-1}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Space Grotesk', sans-serif"
          fontSize={9}
          fontWeight={700}
          letterSpacing="0.5"
        >
          {labelText || `X:${cx} Y:${cy}`}
        </text>
      </g>
    </g>
  );
};
