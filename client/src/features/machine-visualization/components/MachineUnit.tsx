import React from 'react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface MachineUnitProps {
  machine: MachineInfo;
  isActive: boolean;
  onClick: (machine: MachineInfo, e: React.MouseEvent) => void;
  onMouseEnter: (machine: MachineInfo) => void;
  onMouseLeave: () => void;
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
    labelY1,
    labelY2,
    imageHref,
    imageProps,
    isGlowingGreen,
  } = machine;

  return (
    <g
      className={`machine-unit group cursor-pointer transition-all duration-200 ${isGlowingGreen ? 'glowing-green-machine' : ''
        } ${isActive ? 'active-machine' : ''}`}
      onClick={(e) => onClick(machine, e)}
      onMouseEnter={() => onMouseEnter(machine)}
      onMouseLeave={onMouseLeave}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="transparent"
        stroke="none"
      />
      <text
        x={labelX}
        y={labelY1}
        fontSize={9}
        fontWeight={700}
        fill="#e4e8db"
        stroke="none"
        textAnchor="middle"
        className="group-hover:fill-white group-hover:drop-shadow"
      >
        {name.length > 15 && name.includes('Vaibhav') ? subTitle : name.split(' ')[0] + ' ' + (name.split(' ')[1] || '')}
      </text>
      <text
        x={labelX}
        y={labelY2}
        fontSize={8}
        fill="#a8b49a"
        stroke="none"
        textAnchor="middle"
        className="group-hover:fill-white group-hover:drop-shadow"
      >
        {subTitle}
      </text>

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
          className={`transition-all duration-300 ${isGlowingGreen
              ? 'animate-pulse'
              : 'group-hover:opacity-100 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
            } ${isActive ? 'opacity-100 drop-shadow-[0_0_14px_rgba(255,255,255,1)]' : ''}`}
        />
      )}
    </g>
  );
};
