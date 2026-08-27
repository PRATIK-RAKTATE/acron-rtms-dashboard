import React from 'react';
import type { MachineInfo } from '../types/machineVisualization.types';
import type { MachineStatus } from '../../rtms/types';
import { useRtmsContext } from '../../rtms/RtmsContext';

interface MachineUnitProps {
  machine: MachineInfo;
  isActive: boolean;
  onClick: (machine: MachineInfo, e: React.MouseEvent) => void;
  onMouseEnter: (machine: MachineInfo) => void;
  onMouseLeave: () => void;
}

const STATUS_CONFIG: Record<
  MachineStatus,
  { dotFill: string; tagBg: string; textFill: string; label: string }
> = {
  Running: {
    dotFill: '#22c55e',
    tagBg: 'rgba(34, 197, 94, 0.18)',
    textFill: '#4ade80',
    label: 'RUNNING',
  },
  Idle: {
    dotFill: '#f59e0b',
    tagBg: 'rgba(245, 158, 11, 0.18)',
    textFill: '#fbbf24',
    label: 'IDLE',
  },
  Trial: {
    dotFill: '#06b6d4',
    tagBg: 'rgba(6, 182, 212, 0.18)',
    textFill: '#38bdf8',
    label: 'TRIAL',
  },
  Stopped: {
    dotFill: '#ef4444',
    tagBg: 'rgba(239, 68, 68, 0.18)',
    textFill: '#f87171',
    label: 'STOPPED',
  },
  Changeover: {
    dotFill: '#a855f7',
    tagBg: 'rgba(168, 85, 247, 0.18)',
    textFill: '#c084fc',
    label: 'CHANGEOVER',
  },
};

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export const MachineUnit: React.FC<MachineUnitProps> = ({
  machine,
  isActive,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const {
    name,
    subTitle,
    x,
    y,
    width,
    height,
    labelX,
    imageHref,
    imageProps,
    isGlowingGreen,
  } = machine;

  let status: MachineStatus = isGlowingGreen ? 'Running' : 'Idle';
  let moldId = machine.mouldNumber ? `MD-${machine.mouldNumber}` : 'MD-001';
  let sku = 'SKU-100';
  let actualQty = 36448;
  let targetQty = 45472;
  let alertCount = 0;

  try {
    const ctx = useRtmsContext();
    const rtmsId = machine.rtmsId || 'M-001';
    const m = ctx?.snapshot?.machines?.find((item) => item.id === rtmsId);
    const kpi = ctx?.kpiIndex?.[rtmsId];
    if (m) {
      status = m.status;
      moldId = m.moldId || moldId;
      sku = m.sku || sku;
      actualQty = kpi?.actualQty ?? (m.shots * (m.cavity?.active || 16));
      targetQty = m.targetQty > 0 ? m.targetQty : 45472;
    }
    if (ctx?.alerts) {
      alertCount = ctx.alerts.filter((a) => a.machineId === rtmsId && !a.read).length;
    }
  } catch (e) {
    // optional fallback if rendered outside RtmsProvider
  }

  const st = STATUS_CONFIG[status] || STATUS_CONFIG['Running'];
  const isCompact = height < 150;
  const shortName = subTitle && subTitle.length < 14 ? subTitle : name.split(' ')[0];

  return (
    <g
      className={`machine-unit group cursor-pointer transition-all duration-200 ${
        isGlowingGreen ? 'glowing-green-machine' : ''
      } ${isActive ? 'active-machine' : ''}`}
      onClick={(e) => onClick(machine, e)}
      onMouseEnter={() => onMouseEnter(machine)}
      onMouseLeave={onMouseLeave}
    >
      {/* Semi-transparent backdrop frame for readability */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={9}
        fill="rgba(15, 19, 26, 0.55)"
        stroke={isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}
        strokeWidth={isActive ? 2 : 1}
        className="group-hover:stroke-white/30 transition-colors"
      />

      {/* Row 1: Status Dot + Status Tag & Machine Name */}
      <g transform={`translate(${x + 6}, ${y + 6})`}>
        {/* Status circle dot */}
        <circle cx={7} cy={9} r={5} fill={st.dotFill} className="animate-pulse" />
        
        {/* Status Label Tag */}
        <text
          x={16}
          y={13}
          fontSize={isCompact ? 8 : 10}
          fontWeight={800}
          fill={st.textFill}
          stroke="none"
          letterSpacing="0.5px"
        >
          {st.label}
        </text>

        {/* Machine Tag/Name */}
        <text
          x={width - 12}
          y={13}
          fontSize={isCompact ? 8 : 10}
          fontWeight={600}
          fill="#e4e8db"
          stroke="none"
          textAnchor="end"
          className="group-hover:fill-white"
        >
          {shortName}
        </text>
      </g>

      {/* Row 2: Mould ID & SKU */}
      <text
        x={labelX}
        y={y + (isCompact ? 33 : 38)}
        fontSize={isCompact ? 8.5 : 10}
        fill="#a0aec0"
        stroke="none"
        textAnchor="middle"
      >
        {moldId} • {sku}
      </text>

      {/* Row 3: Total Production & Actual Target */}
      <text
        x={labelX}
        y={y + (isCompact ? 46 : 54)}
        fontSize={isCompact ? 9 : 11}
        fontWeight={700}
        fill="#38bdf8"
        stroke="none"
        textAnchor="middle"
      >
        P:{fmtNum(actualQty)} / T:{fmtNum(targetQty)}
      </text>

      {/* Alert Badge (if alertCount > 0) */}
      {alertCount > 0 && (
        <g transform={`translate(${x + width - 27}, ${y + height - 24})`}>
          <rect
            width={21}
            height={18}
            rx={4}
            fill="#ef4444"
            className="animate-pulse"
          />
          <text
            x={10.5}
            y={14}
            fontSize={10}
            fontWeight={900}
            fill="#ffffff"
            textAnchor="middle"
          >
            !{alertCount}
          </text>
        </g>
      )}

      {/* Machine SVG / PNG image */}
      {imageHref && imageProps && (
        <image
          href={imageHref}
          x={imageProps.x}
          y={imageProps.y}
          width={imageProps.width}
          height={imageProps.height}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.95}
          transform={imageProps.transform}
          filter={isGlowingGreen ? 'url(#green-glow-filter)' : undefined}
          className={`transition-all duration-300 ${
            isGlowingGreen
              ? 'animate-pulse'
              : 'group-hover:opacity-100 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]'
          } ${isActive ? 'opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,1)]' : ''}`}
        />
      )}
    </g>
  );
};
