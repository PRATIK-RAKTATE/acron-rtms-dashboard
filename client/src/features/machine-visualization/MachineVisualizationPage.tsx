import React, { useState, useEffect } from 'react';
import type { CadGuideData, MachineInfo, SelectedItem, ThemeMode, ZoneInfo } from './types/machineVisualization.types';
import { TopToolbar } from './components/TopToolbar';
import { FloorPlanViewport } from './components/FloorPlanViewport';
import { ZoneInspector } from './components/ZoneInspector';
import { MilicronDashboardModal } from './components/MilicronDashboardModal';
import { VictorDashboardModal } from './components/VictorDashboardModal';
import { LtDashboardModal } from './components/LtDashboardModal';

export const MachineVisualizationPage: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('olive');
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [cadGuide, setCadGuide] = useState<CadGuideData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [dashboardMachine, setDashboardMachine] = useState<MachineInfo | null>(null);

  // Sync fullscreen change state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleExport = () => {
    window.print();
  };

  const handleSelectZone = (zone: ZoneInfo) => {
    setSelectedItem({
      type: 'zone',
      id: zone.id,
      data: zone,
    });
  };

  const handleSelectMachine = (machine: MachineInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem({
      type: 'machine',
      id: machine.id,
      data: machine,
    });
  };

  const handleCloseInspector = () => {
    setSelectedItem(null);
  };

  const handleOpenDashboard = (machine: MachineInfo) => {
    setDashboardMachine(machine);
  };

  const handleCloseDashboard = () => {
    setDashboardMachine(null);
  };

  return (
    <div
      className={`min-h-screen w-screen flex flex-col transition-colors duration-400 font-['Outfit'] ${
        theme === 'olive'
          ? 'bg-[#404c35] text-[#e8ecd9]'
          : 'bg-[#121316] text-zinc-100'
      }`}
      style={{
        backgroundImage:
          theme === 'olive'
            ? 'radial-gradient(circle at 50% 0%, rgba(202, 212, 184, 0.08) 0%, transparent 60%), radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
            : 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.05) 0%, transparent 60%), radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 28px 28px',
      }}
    >
      {/* Header Toolbar */}
      <TopToolbar
        theme={theme}
        onThemeChange={setTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onExport={handleExport}
      />

      {/* Main Interactive Floor Area & Inspector Drawer */}
      <main className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden">
        <FloorPlanViewport
          theme={theme}
          selectedItem={selectedItem}
          onSelectZone={handleSelectZone}
          onSelectMachine={handleSelectMachine}
          cadGuide={cadGuide}
          setCadGuide={setCadGuide}
        />

        <ZoneInspector
          theme={theme}
          selectedItem={selectedItem}
          onClose={handleCloseInspector}
          onOpenDashboard={handleOpenDashboard}
        />
      </main>

      {/* Live Machine Dashboard Simulator Modal */}
      {dashboardMachine && (
        dashboardMachine.name.toLowerCase().includes('victor') ? (
          <VictorDashboardModal
            machine={dashboardMachine}
            onClose={handleCloseDashboard}
          />
        ) : dashboardMachine.name.toLowerCase().includes('lt') || dashboardMachine.name.toLowerCase().includes('l&t') ? (
          <LtDashboardModal
            machine={dashboardMachine}
            onClose={handleCloseDashboard}
          />
        ) : (
          <MilicronDashboardModal
            machine={dashboardMachine}
            onClose={handleCloseDashboard}
          />
        )
      )}
    </div>
  );
};
