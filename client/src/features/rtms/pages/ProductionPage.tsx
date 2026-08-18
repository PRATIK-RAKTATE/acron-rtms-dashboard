import { useMemo, useState } from 'react';
import { Package, TrendingDown, Timer, Gauge } from 'lucide-react';
import type { ShiftId } from '../types';
import { useRtmsContext } from '../RtmsContext';
import { factoryLossBreakdown, fmt, machineKpi } from '../kpis';
import {
  Card,
  CardHeader,
  KpiCard,
  BarChart,
  HBar,
  ProgressBar,
  TimeRangeSelector,
  Donut,
} from '../components/ui';
import { PageHeader } from '../components/PageHeader';

type View = 'overview' | 'machine' | 'mold' | 'sku' | 'shift';

export function ProductionPage() {
  const { snapshot, kpiIndex, goMachine } = useRtmsContext();
  const [view, setView] = useState<View>('overview');
  const [range, setRange] = useState('today');
  const machines = snapshot.machines;

  const totalActual = machines.reduce((s, m) => s + kpiIndex[m.id].actualQty, 0);
  const totalExpected = machines.reduce((s, m) => s + kpiIndex[m.id].expectedQty, 0);
  const totalTarget = machines.reduce((s, m) => s + m.targetQty, 0);
  const totalCycles = machines.reduce((s, m) => s + m.successfulCycles, 0);
  const loss = useMemo(() => factoryLossBreakdown(snapshot), [snapshot]);
  const lossTotal = loss.total || 1;

  // Hourly expected-vs-actual across the day (simulated distribution)
  const hours = Array.from({ length: 10 }, (_, i) => {
    const factor = 0.62 + i * 0.045;
    return {
      label: `${8 + i}h`,
      expected: Math.round(totalExpected * factor * 0.14),
      actual: Math.round(totalActual * factor * 0.14),
    };
  });

  // SKU-wise aggregation
  const skuMap = new Map<string, number>();
  machines.forEach((m) => {
    if (!m.sku) return;
    skuMap.set(m.sku, (skuMap.get(m.sku) ?? 0) + kpiIndex[m.id].actualQty);
  });
  const skuRows = Array.from(skuMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Mold-wise
  const moldMap = new Map<string, number>();
  machines.forEach((m) => {
    if (!m.moldId) return;
    moldMap.set(m.moldId, (moldMap.get(m.moldId) ?? 0) + kpiIndex[m.id].actualQty);
  });
  const moldRows = Array.from(moldMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Shift-wise
  const shiftRows = (['A', 'B', 'C'] as ShiftId[]).map((s) => ({
    shift: s,
    qty: machines.filter((m) => m.shift === s).reduce((sum, m) => sum + kpiIndex[m.id].actualQty, 0),
  }));

  const topMachines = machines
    .map((m) => ({ m, k: machineKpi(m) }))
    .sort((a, b) => b.k.actualQty - a.k.actualQty)
    .slice(0, 6);

  const totalLoss = Math.max(0, totalExpected - totalActual);

  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Level 2 — how much did we produce, and how efficiently?"
        right={<TimeRangeSelector value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Actual Production" value={fmt(totalActual)} accent="text-emerald-400" icon={<Package className="w-4 h-4" />} sub={`${range} view`} />
        <KpiCard label="Expected Production" value={fmt(totalExpected)} accent="text-sky-400" icon={<Timer className="w-4 h-4" />} sub="cavities × cycles" />
        <KpiCard label="Production Loss" value={fmt(totalLoss)} accent="text-red-400" icon={<TrendingDown className="w-4 h-4" />} sub={`${totalExpected ? ((totalLoss / totalExpected) * 100).toFixed(1) : 0}% of expected`} />
        <KpiCard label="Cycle Count" value={fmt(totalCycles)} icon={<Timer className="w-4 h-4" />} sub="successful cycles" />
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4 p-1 bg-black/20 rounded-lg border border-white/10 w-fit">
        {(['overview', 'machine', 'mold', 'sku', 'shift'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize cursor-pointer transition-colors ${
              view === v ? 'bg-sky-500/25 text-sky-200 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {v === 'overview' ? 'Overview' : v === 'machine' ? 'Machine-wise' : v === 'mold' ? 'Mold-wise' : v === 'sku' ? 'SKU-wise' : 'Shift-wise'}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Expected vs actual chart */}
          <Card className="xl:col-span-2">
            <CardHeader title="Target / Expected vs Actual" subtitle="Hourly production across the day" icon={<Gauge className="w-4 h-4" />} />
            <div className="px-5 pb-5">
              <div className="flex items-end gap-2" style={{ height: 200 }}>
                {hours.map((h, i) => {
                  const max = Math.max(...hours.map((x) => x.expected));
                  return (
                    <div key={i} className="flex-1 flex items-end gap-1">
                      <div className="flex-1 rounded-t bg-emerald-400/70" style={{ height: `${(h.actual / max) * 200}px`, minHeight: 2 }} title={`Actual ${fmt(h.actual)}`} />
                      <div className="flex-1 rounded-t bg-white/20" style={{ height: `${(h.expected / max) * 200}px`, minHeight: 2 }} title={`Expected ${fmt(h.expected)}`} />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/70" />Actual</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-white/20" />Expected</span>
              </div>
            </div>
          </Card>

          {/* Achievement donut */}
          <Card>
            <CardHeader title="Production Achievement" subtitle="Actual vs target" icon={<Package className="w-4 h-4" />} />
            <div className="px-5 pb-5 flex flex-col items-center">
              <Donut
                value={totalTarget ? (totalActual / totalTarget) * 100 : 0}
                label={<div className="text-center"><p className="text-2xl font-bold">{totalTarget ? ((totalActual / totalTarget) * 100).toFixed(1) : 0}%</p><p className="text-[9px] text-zinc-400">Achieved</p></div>}
              />
              <div className="w-full space-y-1.5 mt-4">
                <div className="flex justify-between text-[12px]"><span className="text-zinc-400">Target</span><b>{fmt(totalTarget)}</b></div>
                <div className="flex justify-between text-[12px]"><span className="text-zinc-400">Actual</span><b className="text-emerald-400">{fmt(totalActual)}</b></div>
                <div className="flex justify-between text-[12px]"><span className="text-zinc-400">Gap</span><b className="text-red-400">{fmt(Math.max(0, totalTarget - totalActual))}</b></div>
              </div>
            </div>
          </Card>
        </div>
      )}


      {view === 'machine' && (
        <Card>
          <CardHeader title="Production by Machine" subtitle="Sorted by actual quantity" icon={<Package className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-3">
            {topMachines.map(({ m, k }) => (
              <button key={m.id} onClick={() => goMachine(m.id)} className="w-full text-left cursor-pointer group">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold group-hover:text-sky-300">{m.id} <span className="text-zinc-500 font-normal">· {m.sku ?? '—'}</span></span>
                  <span className="text-zinc-400">{fmt(k.actualQty)} <span className="text-emerald-300">/ {fmt(k.expectedQty)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={k.productionEfficiency} color={k.productionEfficiency >= 90 ? 'emerald' : 'amber'} />
                  <span className="text-[11px] text-zinc-400 w-12 text-right">{k.productionEfficiency.toFixed(0)}%</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {view === 'mold' && <RackTable title="Production by Mold" rows={moldRows.map(([k, v]) => ({ id: k, value: v }))} />}
      {view === 'sku' && <RackTable title="Production by SKU" rows={skuRows.map(([k, v]) => ({ id: k, value: v }))} />}

      {view === 'shift' && (
        <Card>
          <CardHeader title="Production by Shift" subtitle="A / B / C shift totals" icon={<Timer className="w-4 h-4" />} />
          <div className="px-5 pb-5">
            <BarChart data={shiftRows.map((s) => ({ label: `Shift ${s.shift}`, value: s.qty }))} height={200} valueFmt={(v) => fmt(v)} />
          </div>
        </Card>
      )}

      {/* Loss breakdown section */}
      <Card className="mt-4">
        <CardHeader title="Production Loss Breakdown" subtitle="Categorized factory loss" icon={<TrendingDown className="w-4 h-4" />} />
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <HBar label="Idle loss" value={loss.idle} total={lossTotal} color="bg-amber-400" />
            <HBar label="Changeover loss" value={loss.changeover} total={lossTotal} color="bg-fuchsia-400" />
            <HBar label="Trial loss" value={loss.trial} total={lossTotal} color="bg-sky-400" />
            <HBar label="Cavity loss" value={loss.cavity} total={lossTotal} color="bg-red-400" />
          </div>
          <div className="space-y-3">
            <HBar label="Breakdown / stoppage" value={loss.breakdown} total={lossTotal} color="bg-orange-400" />
            <HBar label="Slow cycle" value={loss.slowCycle} total={lossTotal} color="bg-indigo-400" />
            <HBar label="Other losses" value={loss.other} total={lossTotal} color="bg-zinc-400" />
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 flex justify-between text-[12px]">
              <span className="text-zinc-400">Total categorized loss</span>
              <b className="text-red-400">{fmt(loss.total)}</b>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RackTable({ title, rows }: { title: string; rows: Array<{ id: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader title={title} subtitle="Ranked by quantity" icon={<Package className="w-4 h-4" />} />
      <div className="px-5 pb-5 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[12px] font-semibold">{r.id}</span>
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="w-24 text-right text-[12px] text-emerald-300">{fmt(r.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

