import { useState } from 'react';
import {
  Cpu,
  Activity,
  Clock,
  FlaskConical,
  OctagonX,
  Package,
  Timer,
  Pause,
  Gauge,
  TrendingDown,
  AlarmClock,
} from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt, fmtDuration, factoryLossBreakdown } from '../kpis';
import {
  KpiCard,
  ProgressBar,
} from '../components/ui';
import { PageHeader, LiveClock } from '../components/PageHeader';

import { FloorPlanViewport } from '../../machine-visualization/components/FloorPlanViewport';
import { MilicronDashboardModal } from '../../machine-visualization/components/MilicronDashboardModal';
import { VictorDashboardModal } from '../../machine-visualization/components/VictorDashboardModal';
import { LtDashboardModal } from '../../machine-visualization/components/LtDashboardModal';
import { VaibhavDashboardModal } from '../../machine-visualization/components/VaibhavDashboardModal';
import { CmpDashboardModal } from '../../machine-visualization/components/CmpDashboardModal';
import type { CadGuideData, MachineInfo, SelectedItem, ZoneInfo } from '../../machine-visualization/types/machineVisualization.types';

export function DashboardPage() {
  const { snapshot, kpiIndex, now } = useRtmsContext();
  const machines = snapshot.machines;

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [cadGuide, setCadGuide] = useState<CadGuideData | null>(null);
  const [dashboardMachine, setDashboardMachine] = useState<MachineInfo | null>(null);

  const running = machines.filter((m) => m.status === 'Running').length;
  const idle = machines.filter((m) => m.status === 'Idle').length;
  const trial = machines.filter((m) => m.status === 'Trial').length;
  const stopped = machines.filter((m) => m.status === 'Stopped').length;

  const totalActual = machines.reduce((s, m) => s + kpiIndex[m.id].actualQty, 0);
  const totalExpected = machines.reduce((s, m) => s + kpiIndex[m.id].expectedQty, 0);
  const shiftTarget = Math.round(totalActual / 0.564);
  const prodProgressPct = shiftTarget ? (totalActual / shiftTarget) * 100 : 56.4;
  const totalTrial = machines
    .filter((m) => m.mode === 'Trial')
    .reduce((s, m) => s + m.successfulCycles * m.cavity.total, 0);
  const totalCycles = machines.reduce((s, m) => s + m.successfulCycles, 0);
  
  const fLoss = factoryLossBreakdown(snapshot);
  const cavityLoss = fLoss.cavity;
  const otherLoss = fLoss.idle + fLoss.changeover + fLoss.trial + fLoss.breakdown + fLoss.slowCycle + fLoss.other;
  const totalLoss = cavityLoss + otherLoss;

  const utilization = machines.length
    ? machines.reduce((s, m) => s + kpiIndex[m.id].utilization, 0) / machines.length
    : 0;

  const prodTime = machines.reduce((s, m) => s + m.productionTime, 0);
  const idleTime = machines.reduce((s, m) => s + m.idleTime, 0);
  const trialTime = machines.reduce((s, m) => s + m.trialTime, 0);
  const changeTime = machines.reduce((s, m) => s + m.changeoverTime, 0);

  const handleSelectZone = (zone: ZoneInfo) => {
    setSelectedItem({
      type: 'zone',
      id: zone.id,
      data: zone,
    });
  };

  const handleSelectMachine = (machine: MachineInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setDashboardMachine(machine);
  };

  const handleCloseDashboard = () => {
    setDashboardMachine(null);
  };

  return (
    <div>
      <PageHeader
        title="Factory Overview"

        right={<LiveClock now={now} />}
      />

      {/* Factory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
        <KpiCard label="Total Machines" value={machines.length} icon={<Cpu className="w-4 h-4" />} sub="installed fleet" />
        <KpiCard
          label="Production"
          value={fmt(totalActual)}
          accent="text-emerald-400"
          icon={<Package className="w-4 h-4" />}
          sub={`Target: ${fmt(shiftTarget)} (${prodProgressPct.toFixed(1)}%)`}
        >
          <div className="mt-2">
            <ProgressBar value={totalActual} max={shiftTarget} color="emerald" height="h-1.5" />
          </div>
        </KpiCard>
        <KpiCard label="Idle" value={idle} accent="text-amber-400" icon={<Pause className="w-4 h-4" />} sub="machines" />
        <KpiCard label="Trial" value={trial} accent="text-sky-400" icon={<FlaskConical className="w-4 h-4" />} sub="machines" />
        <KpiCard label="Stopped" value={stopped} accent="text-red-400" icon={<OctagonX className="w-4 h-4" />} sub="machines" />
        <KpiCard label="Running Fleet" value={running} accent="text-emerald-400" icon={<Activity className="w-4 h-4" />} sub="active machines" />
        <KpiCard label="Trial Quantity" value={fmt(totalTrial)} accent="text-sky-400" icon={<FlaskConical className="w-4 h-4" />} sub="trial parts" />
        <KpiCard
          label="Machine Utilization"
          value={`${utilization.toFixed(1)}%`}
          accent="text-sky-400"
          icon={<Gauge className="w-4 h-4" />}
          delta={utilization - 75}
          deltaLabel="vs 75% target"
        />
        <KpiCard label="Successful Cycles" value={fmt(totalCycles)} icon={<Timer className="w-4 h-4" />} sub="today" />
        <KpiCard
          label="Production Loss"
          value={fmt(totalLoss)}
          accent="text-red-400"
          icon={<TrendingDown className="w-4 h-4" />}
          sub={`Cavity: ${fmt(cavityLoss)} + Other: ${fmt(otherLoss)}`}
        >
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
              <span className="text-red-400">Cavity: {fmt(cavityLoss)}</span>
              <span className="text-amber-400">Other: {fmt(otherLoss)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden flex">
              <div
                className="h-full bg-red-400 transition-all duration-700"
                style={{ width: `${totalLoss > 0 ? (cavityLoss / totalLoss) * 100 : 0}%` }}
                title={`Cavity Loss: ${fmt(cavityLoss)}`}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-700"
                style={{ width: `${totalLoss > 0 ? (otherLoss / totalLoss) * 100 : 0}%` }}
                title={`Other Losses: ${fmt(otherLoss)}`}
              />
            </div>
          </div>
        </KpiCard>
        <KpiCard label="Production Time" value={fmtDuration(prodTime)} icon={<Clock className="w-4 h-4" />} sub="across factory" />
        <KpiCard label="Idle Time" value={fmtDuration(idleTime)} accent="text-amber-400" icon={<AlarmClock className="w-4 h-4" />} sub="across factory" />
        <KpiCard label="Trial Time" value={fmtDuration(trialTime)} accent="text-sky-400" icon={<FlaskConical className="w-4 h-4" />} sub="across factory" />
        <KpiCard label="Changeover Time" value={fmtDuration(changeTime)} accent="text-fuchsia-400" icon={<Timer className="w-4 h-4" />} sub="across factory" />
      </div>



      {/* Machine Area / Floor Plan Viewport */}
      <div className="mt-5 flex flex-col lg:flex-row gap-3 overflow-hidden">
        <FloorPlanViewport
          theme="blueprint"
          selectedItem={selectedItem}
          onSelectZone={handleSelectZone}
          onSelectMachine={handleSelectMachine}
          cadGuide={cadGuide}
          setCadGuide={setCadGuide}
        />
      </div>

      {/* Live Machine Dashboard Modal */}
      {dashboardMachine && (
        dashboardMachine.name.toLowerCase().includes('victor') ? (
          <VictorDashboardModal
            machine={dashboardMachine}
            onClose={handleCloseDashboard}
          />
        ) : dashboardMachine.name.toLowerCase().includes('vaibhav') ? (
          <VaibhavDashboardModal
            machine={dashboardMachine}
            onClose={handleCloseDashboard}
          />
        ) : dashboardMachine.name.toLowerCase().includes('cmp') ? (
          <CmpDashboardModal
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
}
