import { useState } from 'react';
import { Grid3x3, TrendingDown, Activity } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt } from '../kpis';
import { Card, CardHeader, Donut, StatusBadge, Pill } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

export function CavityPage() {
  const { snapshot, kpiIndex, goMachine } = useRtmsContext();
  const [expanded, setExpanded] = useState<string | null>(null);
  const machines = snapshot.machines.filter((m) => m.cavity.mapped && m.cavity.active > 0);

  const totalCavities = machines.reduce((s, m) => s + m.cavity.total, 0);
  const activeCavities = machines.reduce((s, m) => s + m.cavity.active, 0);
  const blockedCavities = machines.reduce((s, m) => s + (m.cavity.total - m.cavity.active), 0);
  const totalActual = machines.reduce((s, m) => s + kpiIndex[m.id].actualQty, 0);
  const totalExpected = machines.reduce((s, m) => s + kpiIndex[m.id].expectedQty, 0);
  const totalLoss = Math.max(0, totalExpected - totalActual);
  const avgCavityEff = machines.length
    ? machines.reduce((s, m) => s + kpiIndex[m.id].cavityEfficiency, 0) / machines.length
    : 0;
  const affectedCycles = machines
    .filter((m) => m.cavity.active < m.cavity.total)
    .reduce((s, m) => s + m.successfulCycles, 0);

  return (
    <div>
      <PageHeader title="Cavity Monitoring" subtitle="Level 3 — where are we losing production due to cavity blockage?" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Total cavities</p><p className="text-2xl font-bold">{totalCavities}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Active cavities</p><p className="text-2xl font-bold text-emerald-400">{activeCavities}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Blocked cavities</p><p className="text-2xl font-bold text-red-400">{blockedCavities}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Cavity loss</p><p className="text-2xl font-bold text-amber-400">{fmt(totalLoss)}</p></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader title="Cavity Efficiency" subtitle="Factory aggregate" icon={<Grid3x3 className="w-4 h-4" />} />
          <div className="px-5 pb-5 flex flex-col items-center">
            <Donut
              value={avgCavityEff}
              label={<div className="text-center"><p className="text-2xl font-bold">{avgCavityEff.toFixed(1)}%</p><p className="text-[9px] text-zinc-400">Avg efficiency</p></div>}
            />
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Cavity Performance" subtitle="Expected vs actual parts by monitored mold" icon={<Activity className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-3">
            {machines.slice(0, 8).map((m) => {
              const k = kpiIndex[m.id];
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <button onClick={() => goMachine(m.id)} className="w-24 shrink-0 text-left font-semibold text-[12px] hover:text-sky-300 cursor-pointer">{m.id}</button>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full ${k.cavityEfficiency >= 90 ? 'bg-emerald-400' : k.cavityEfficiency >= 75 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${k.cavityEfficiency}%` }} />
                  </div>
                  <span className="w-10 text-right text-[12px]">{k.cavityEfficiency.toFixed(0)}%</span>
                  <span className="w-28 text-right text-[11px] text-zinc-400">{fmt(k.actualQty)} / {fmt(k.expectedQty)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Live Cavity Status"
          subtitle="Click a machine to expand its cavity grid — identify the exact blocked cavity"
          icon={<Grid3x3 className="w-4 h-4" />}
        />
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map((m) => {
            const k = kpiIndex[m.id];
            const open = expanded === m.id;
            const shown = open ? m.cavity.total : Math.min(16, m.cavity.total);
            return (
              <button
                key={m.id}
                onClick={() => setExpanded(open ? null : m.id)}
                className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-sky-500/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-['Space_Grotesk'] font-bold">{m.id}</span>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">{m.moldId} · {m.cavity.active}/{m.cavity.total} cavities</p>
                <div className="grid grid-cols-8 gap-1.5 mt-3">
                  {Array.from({ length: shown }, (_, i) => {
                    const blocked = m.cavity.blocked.includes(i);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-bold border ${
                          blocked
                            ? 'bg-red-500/25 border-red-500/60 text-red-300'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        C{i + 1}
                      </div>
                    );
                  })}
                </div>
                {!open && m.cavity.total > 16 && (
                  <p className="text-[10px] text-zinc-500 mt-1.5">+{m.cavity.total - 16} more · click to expand</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-3">
                  <span>Cavity eff. {k.cavityEfficiency.toFixed(0)}%</span>
                  {m.cavity.blocked.length > 0 && <Pill className="border-red-500/40 text-red-300">{m.cavity.blocked.length} blocked</Pill>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Trends */}
      <Card className="mt-4">
        <CardHeader title="Cavity Trend Intelligence" subtitle="Repeated failures & affected cycles" icon={<TrendingDown className="w-4 h-4" />} />
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Trend label="Cavity performance today" value="Stable across shifts A & B" note="6 molds above 95% efficiency" tone="emerald" />
          <Trend label="Cavity performance by shift" value="Shift C shows 3 blocked cavities" note="Recommend inspection on C-startup" tone="amber" />
          <Trend label="Repeated cavity failure" value={`${blockedCavities} cavities flagged`} note={`~${fmt(affectedCycles)} cycles affected today`} tone="red" />
        </div>
      </Card>
    </div>
  );
}

function Trend({ label, value, note, tone }: { label: string; value: string; note: string; tone: 'emerald' | 'amber' | 'red' }) {
  const border = { emerald: 'border-emerald-500/30', amber: 'border-amber-500/30', red: 'border-red-500/30' }[tone];
  const text = { emerald: 'text-emerald-300', amber: 'text-amber-300', red: 'text-red-300' }[tone];
  return (
    <div className={`rounded-xl border ${border} bg-white/[0.02] p-4`}>
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className={`font-semibold ${text} mt-1`}>{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{note}</p>
    </div>
  );
}

