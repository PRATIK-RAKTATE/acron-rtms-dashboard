import React from 'react';
import { ArchitecturalSvgBoard } from './ArchitecturalSvgBoard';
import type { CadGuideData, MachineInfo, SelectedItem, ThemeMode, ZoneInfo } from '../types/machineVisualization.types';

interface FloorPlanViewportProps {
  theme: ThemeMode;
  selectedItem: SelectedItem | null;
  onSelectZone: (zone: ZoneInfo) => void;
  onSelectMachine: (machine: MachineInfo, e: React.MouseEvent) => void;
  cadGuide: CadGuideData | null;
  setCadGuide: (guide: CadGuideData | null) => void;
}

export const FloorPlanViewport: React.FC<FloorPlanViewportProps> = ({
  theme,
  selectedItem,
  onSelectZone,
  onSelectMachine,
  cadGuide,
  setCadGuide,
}) => {
  return (
    <div
      className={`flex-1 flex justify-center items-center rounded-xl p-1 relative overflow-auto transition-colors duration-400 border min-h-[500px] ${
        theme === 'olive'
          ? 'bg-[#2d3625]/50 border-[#e4e8db]/10'
          : 'bg-[#0a0a0c]/60 border-white/5'
      }`}
    >
      <div className="w-full h-full relative flex items-center justify-center">
        <ArchitecturalSvgBoard
          theme={theme}
          selectedItem={selectedItem}
          onSelectZone={onSelectZone}
          onSelectMachine={onSelectMachine}
          cadGuide={cadGuide}
          setCadGuide={setCadGuide}
        />
      </div>
    </div>
  );
};
