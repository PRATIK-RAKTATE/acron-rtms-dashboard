import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Factory,
  Cpu,
  Layers,
  Package,
  Grid3x3,
  FlaskConical,
  BellRing,
  FileText,
  ArrowLeftRight,
  Map,
} from 'lucide-react';
import type { Machine, Mold } from './types';
import { useRtms } from './useRtms';
import { generateAlerts, generateTimeline } from './events';
import { MACHINES, ALL_MOLDS } from './data';
import { RtmsProvider, type PageId } from './RtmsContext';
import { DashboardPage } from './pages/DashboardPage';
import { FactoryFloorPage } from './pages/FactoryFloorPage';
import { MachinesPage } from './pages/MachinesPage';
import { MachineDetailPage } from './pages/MachineDetailPage';
import { MoldsPage } from './pages/MoldsPage';
import { MoldDetailPage } from './pages/MoldDetailPage';
import { ProductionPage } from './pages/ProductionPage';
import { CavityPage } from './pages/CavityPage';
import { TrialPage } from './pages/TrialPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';

const NAV: Array<{ id: PageId; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'floor', label: 'Factory Floor', icon: <Map className="w-4 h-4" /> },
  { id: 'machines', label: 'Machines', icon: <Cpu className="w-4 h-4" /> },
  { id: 'molds', label: 'Molds', icon: <Layers className="w-4 h-4" /> },
  { id: 'production', label: 'Production', icon: <Package className="w-4 h-4" /> },
  { id: 'cavity', label: 'Cavity Monitoring', icon: <Grid3x3 className="w-4 h-4" /> },
  { id: 'trial', label: 'Trial Monitoring', icon: <FlaskConical className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts & Events', icon: <BellRing className="w-4 h-4" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
];

interface RtmsAppProps {
  onBackToFloor: () => void;
}

export function RtmsApp({ onBackToFloor }: RtmsAppProps) {
  const { snapshot, kpiIndex, now } = useRtms();
  const [page, setPage] = useState<PageId>('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedMoldId, setSelectedMoldId] = useState<string | null>(null);

  const alerts = useMemo(() => generateAlerts(snapshot), [snapshot]);

  const machineOf = useMemo(() => {
    const map: Record<string, Machine> = {};
    MACHINES.forEach((m) => {
      map[m.id] = m;
    });
    return (id: string | null) => (id ? map[id] : undefined);
  }, []);

  const moldOf = useMemo(() => {
    const map: Record<string, Mold> = {};
    ALL_MOLDS.forEach((m) => {
      map[m.id] = m;
    });
    return (id: string | null) => (id ? map[id] : undefined);
  }, []);

  const timelineOf = useMemo(
    () => (machineId: string) => {
      const m = machineOf(machineId);
      return m ? generateTimeline(m) : [];
    },
    [machineOf]
  );

  const go = (p: PageId) => setPage(p);
  const goMachine = (id: string) => {
    setSelectedMachineId(id);
    setPage('machine-detail');
  };
  const goMold = (id: string) => {
    setSelectedMoldId(id);
    setPage('mold-detail');
  };

  const criticalCount = alerts.filter((a) => a.priority === 'Critical').length;

  return (
    <RtmsProvider
      value={{
        snapshot,
        kpiIndex,
        now,
        alerts,
        page,
        selectedMachineId,
        selectedMoldId,
        go,
        goMachine,
        goMold,
        machineOf,
        moldOf,
        timelineOf,
      }}
    >

      <div className="min-h-screen w-screen flex bg-[#0c0e12] text-zinc-100 font-['Outfit']">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-white/10 bg-[#101318] flex flex-col">
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-['Space_Grotesk'] font-bold leading-tight">RTMS</h1>
                <p className="text-[10px] text-zinc-500 tracking-wide">Acron Floors · IM</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV.map((n) => {
              const active =
                page === n.id ||
                (n.id === 'machines' && page === 'machine-detail') ||
                (n.id === 'molds' && page === 'mold-detail');
              return (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30 shadow-sm'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  {n.icon}
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.id === 'alerts' && criticalCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={onBackToFloor}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-white/15 text-[12px] font-semibold hover:bg-white/5 transition-all cursor-pointer"
            >
              <Factory className="w-4 h-4" /> Back to Floor Plan
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-5">
            {page === 'dashboard' && <DashboardPage />}
            {page === 'floor' && <FactoryFloorPage />}
            {page === 'machines' && <MachinesPage />}
            {page === 'machine-detail' && <MachineDetailPage />}
            {page === 'molds' && <MoldsPage />}
            {page === 'mold-detail' && <MoldDetailPage />}
            {page === 'production' && <ProductionPage />}
            {page === 'cavity' && <CavityPage />}
            {page === 'trial' && <TrialPage />}
            {page === 'alerts' && <AlertsPage />}
            {page === 'reports' && <ReportsPage />}
          </div>
          <footer className="text-center text-[11px] text-zinc-600 pb-6">
            Acron Floors RTMS — Real-Time Manufacturing Intelligence Platform · Live simulation feed
          </footer>
        </main>
      </div>
    </RtmsProvider>
  );
}

