import React from 'react';
import type { MachineInfo, SelectedItem, ThemeMode, ZoneInfo } from '../types/machineVisualization.types';
import { X, Activity, CheckCircle2 } from 'lucide-react';

interface ZoneInspectorProps {
  theme: ThemeMode;
  selectedItem: SelectedItem | null;
  onClose: () => void;
}

export const ZoneInspector: React.FC<ZoneInspectorProps> = ({ theme, selectedItem, onClose }) => {
  const isMachine = selectedItem?.type === 'machine';
  const isZone = selectedItem?.type === 'zone';

  const machineData = isMachine ? (selectedItem.data as MachineInfo) : null;
  const zoneData = isZone ? (selectedItem.data as ZoneInfo) : null;

  return (
    <aside
      className={`w-full lg:w-80 rounded-xl flex flex-col p-4 shadow-2xl transition-all duration-300 font-['Outfit'] border ${
        theme === 'olive'
          ? 'bg-[#3a4530] border-[#e4e8db]/15 text-[#e8ecd9]'
          : 'bg-[#191b20] border-white/10 text-zinc-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
        <span
          className={`text-[10px] font-['Space_Grotesk'] font-bold tracking-widest px-2 py-0.5 rounded ${
            theme === 'olive'
              ? 'text-[#cad4b8] bg-[#cad4b8]/12 border border-[#cad4b8]/20'
              : 'text-sky-400 bg-sky-500/12 border border-sky-500/20'
          }`}
        >
          {machineData
            ? `EQUIPMENT SPEC — ${machineData.side.toUpperCase()} SIDE`
            : zoneData
            ? zoneData.code
            : 'ARCHITECTURAL SPEC'}
        </span>
        <button
          onClick={onClose}
          className="text-current opacity-70 hover:opacity-100 p-1 transition-opacity"
          title="Close Inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="pt-4 flex flex-col gap-4 overflow-y-auto">
        {/* Machine Image Preview (if machine selected) */}
        {machineData && machineData.imageHref && (
          <div
            className={`w-full h-36 rounded-xl border flex items-center justify-center p-3 overflow-hidden shadow-inner transition-all ${
              theme === 'olive'
                ? 'bg-[#1e2419]/40 border-[#e4e8db]/15'
                : 'bg-[#0c0d10]/60 border-white/10'
            }`}
          >
            <img
              src={machineData.imageHref}
              alt={machineData.name}
              className={`max-w-full max-h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105 ${
                machineData.isGlowingGreen
                  ? 'drop-shadow-[0_0_14px_#22c55e]'
                  : ''
              }`}
            />
          </div>
        )}

        {/* Mould Telemetry Badge (if machine selected) */}
        {machineData && (
          <div
            className={`flex items-center justify-between rounded-lg px-3.5 py-2 text-xs font-['Space_Grotesk'] border transition-all ${
              theme === 'olive'
                ? 'bg-[#cad4b8]/12 border-[#cad4b8]/25 text-[#cad4b8]'
                : 'bg-sky-500/12 border-sky-500/25 text-sky-400'
            }`}
          >
            <span className="text-[11px] font-bold tracking-wider opacity-90 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> MOULD CONNECTED
            </span>
            <span className="font-bold text-xs bg-white/15 px-2 py-0.5 rounded text-white">
              235
            </span>
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h3 className="font-['Space_Grotesk'] text-xl font-semibold tracking-tight">
            {machineData ? machineData.name : zoneData ? zoneData.title : 'Select Any Bay'}
          </h3>
          <p className="text-xs opacity-80 leading-relaxed mt-1">
            {machineData
              ? `Industrial machinery unit located on the ${machineData.side} side of ${machineData.zone}. Standard operating telemetry connected with active hydraulic press monitoring.`
              : zoneData
              ? zoneData.desc
              : 'Click on any section of the architectural floor plan to view structural specs, ceiling heights, door clearances, and equipment layouts.'}
          </p>
        </div>

        {/* Metrics Grid */}
        {selectedItem && (
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/[0.04] border border-white/10 p-2.5 rounded-lg flex flex-col gap-0.5">
              <span className="text-[11px] opacity-70">Zone Floor Area</span>
              <span className="font-['Space_Grotesk'] text-xs font-semibold">
                {machineData ? `${machineData.side} Wall Bay` : zoneData?.area}
              </span>
            </div>
            <div className="bg-white/[0.04] border border-white/10 p-2.5 rounded-lg flex flex-col gap-0.5">
              <span className="text-[11px] opacity-70">Clear Height</span>
              <span className="font-['Space_Grotesk'] text-xs font-semibold">
                {machineData ? '7.5 Meters Clearance' : zoneData?.height}
              </span>
            </div>
            <div className="bg-white/[0.04] border border-white/10 p-2.5 rounded-lg flex flex-col gap-0.5">
              <span className="text-[11px] opacity-70">Flooring Type</span>
              <span className="font-['Space_Grotesk'] text-xs font-semibold">
                {machineData ? 'Vibration Damped Slab' : zoneData?.flooring}
              </span>
            </div>
            <div className="bg-white/[0.04] border border-white/10 p-2.5 rounded-lg flex flex-col gap-0.5">
              <span className="text-[11px] opacity-70">Door Access</span>
              <span className="font-['Space_Grotesk'] text-xs font-semibold">
                {machineData ? `${machineData.zone} Corridor` : zoneData?.access}
              </span>
            </div>
          </div>
        )}

        {/* Architectural Compliance */}
        {selectedItem && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3.5 flex flex-col gap-1.5">
            <h4 className="text-xs opacity-70 font-medium">Architectural Compliance</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {machineData
                  ? `Active Status: ${machineData.name} Operational`
                  : zoneData?.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
