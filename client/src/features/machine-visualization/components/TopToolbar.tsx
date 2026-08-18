import React from 'react';
import type { ThemeMode } from '../types/machineVisualization.types';
import { Maximize2, Minimize2, Download, Building2, Anchor, Layers, Gauge, Bell } from 'lucide-react';

interface TopToolbarProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExport: () => void;
  onOpenMouldChange?: () => void;
  onOpenMouldDashboard?: () => void;
  onOpenRtms?: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  theme,
  onThemeChange,
  isFullscreen,
  onToggleFullscreen,
  onExport,
  onOpenMouldChange,
  onOpenMouldDashboard,
  onOpenRtms,
}) => {
  return (
    <header
      className={`flex flex-wrap items-center justify-between px-5 py-3 border-b transition-colors duration-300 z-50 backdrop-blur-md ${
        theme === 'olive'
          ? 'bg-[#353f2c]/90 border-[#e4e8db]/15 text-[#e8ecd9]'
          : 'bg-[#191b20]/90 border-white/10 text-zinc-100'
      }`}
    >
      {/* Brand & Title */}
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-300 ${
            theme === 'olive'
              ? 'bg-[#323b28] border-[#e4e8db]/20 text-[#cad4b8]'
              : 'bg-[#191b20] border-white/10 text-sky-400'
          }`}
        >
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-['Space_Grotesk'] text-lg md:text-xl font-bold tracking-tight flex items-center gap-2.5">
            ACRON FLOORS{' '}
            <span
              className={`text-[10px] font-['Cinzel'] font-semibold tracking-widest px-2 py-0.5 rounded border ${
                theme === 'olive'
                  ? 'bg-[#cad4b8]/15 text-[#cad4b8] border-[#cad4b8]/30'
                  : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
              }`}
            >
              ARCHITECTURAL DESIGN LAB
            </span>
          </h1>
          <span className="text-xs opacity-75 font-['Outfit'] font-normal">
            Industrial Floor Plan — Ground Floor Level (13,420 SQ.FT)
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 mt-2 sm:mt-0">
        {/* Theme Switcher */}
        <div className="flex bg-black/20 p-1 rounded-lg border border-white/10 shadow-inner">
          <button
            onClick={() => onThemeChange('olive')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              theme === 'olive'
                ? 'bg-white/15 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Olive Architectural Theme"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#6b7a58]" />
            Olive Theme
          </button>
          <button
            onClick={() => onThemeChange('blueprint')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              theme === 'blueprint'
                ? 'bg-white/15 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Dark Blueprint Theme"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            Dark Blueprint
          </button>
        </div>

        {/* Alert Bell Button */}
        {onOpenRtms && (
          <button
            onClick={onOpenRtms}
            className="relative inline-flex items-center justify-center p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-amber-400 transition-all cursor-pointer shadow-sm active:scale-95"
            title="View Active RTMS Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold font-mono text-white bg-gradient-to-r from-red-600 to-rose-500 rounded-full border border-red-400/50 shadow-md shadow-red-500/50 animate-pulse">
              5
            </span>
          </button>
        )}

        {/* RTMS Intelligence Platform Button */}
        {onOpenRtms && (
          <button
            onClick={onOpenRtms}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer shadow-sm active:scale-95 font-['IBM_Plex_Mono']"
            title="Open RTMS Manufacturing Intelligence Platform"
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">RTMS Dashboard</span>
          </button>
        )}

        {/* Mould Tracking Dashboard Button */}
        {onOpenMouldDashboard && (
          <button
            onClick={onOpenMouldDashboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500/20 to-cyan-500/20 hover:from-sky-500/30 hover:to-cyan-500/30 text-sky-300 border border-sky-500/40 transition-all cursor-pointer shadow-sm active:scale-95 font-['IBM_Plex_Mono']"
            title="RTMS Mould Tracking Dashboard"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Mould Dashboard</span>
          </button>
        )}

        {/* Crane Mould Change Button */}
        {onOpenMouldChange && (
          <button
            onClick={onOpenMouldChange}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm active:scale-95 font-['IBM_Plex_Mono']"
            title="Overhead 3-Ton Crane Mould Change Animation"
          >
            <Anchor className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="hidden md:inline">Crane Mould Change</span>
          </button>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-current"
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          </span>
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shadow-md ${
            theme === 'olive'
              ? 'bg-[#d8dcd2] text-[#2b3322] hover:bg-white hover:shadow-[#d8dcd2]/30 border-transparent'
              : 'bg-zinc-100 text-zinc-900 hover:bg-white border-transparent'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Blueprint</span>
        </button>
      </div>
    </header>
  );
};
