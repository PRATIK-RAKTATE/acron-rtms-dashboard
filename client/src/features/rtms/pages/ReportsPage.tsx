import React, { useMemo, useState } from 'react';
import { FileText, Download, CalendarDays, Clock, Cpu, Layers, Package } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt, fmtDuration, machineKpi } from '../kpis';
import { ALL_MOLDS } from '../data';
import { Card, CardHeader, KpiCard, TimeRangeSelector, StatusBadge } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

type ReportTab = 'daily' | 'shift' | 'machine' | 'mold' | 'production';

const TABS: Array<{ id: ReportTab; label: string; icon: React.ReactNode }> = [
  { id: 'daily', label: 'Daily', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'shift', label: 'Shift', icon: <Clock className="w-4 h-4" /> },
  { id: 'machine', label: 'Machine', icon: <Cpu className="w-4 h-4" /> },
  { id: 'mold', label: 'Mold', icon: <Layers className="w-4 h-4" /> },
  { id: 'production', label: 'Production', icon: <Package className="w-4 h-4" /> },
];

export function ReportsPage() {
  const { snapshot, kpiIndex, now } = useRtmsContext();
  const [tab, setTab] = useState<ReportTab>('daily');
  const [range, setRange] = useState('today');
  const machines = snapshot.machines;

  const totals = useMemo(() => {
    const actual = machines.reduce((s, m) => s + kpiIndex[m.id].actualQty, 0);
    const expected = machines.reduce((s, m) => s + kpiIndex[m.id].expectedQty, 0);
    const cycles = machines.reduce((s, m) => s + m.successfulCycles, 0);
    const prodTime = machines.reduce((s, m) => s + m.productionTime, 0);
    const idleTime = machines.reduce((s, m) => s + m.idleTime, 0);
    const trialTime = machines.reduce((s, m) => s + m.trialTime, 0);
    const changeTime = machines.reduce((s, m) => s + m.changeoverTime, 0);
    return { actual, expected, cycles, prodTime, idleTime, trialTime, changeTime, loss: Math.max(0, expected - actual) };
  }, [machines, kpiIndex]);

  const rows = machines
    .map((m) => ({ m, k: machineKpi(m) }))
    .sort((a, b) => b.k.actualQty - a.k.actualQty);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`Generated ${now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
        right={
          <div className="flex items-center gap-2">
            <TimeRangeSelector value={range} onChange={setRange} />
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-200 text-[12px] font-semibold hover:bg-sky-500/25 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5 mb-4 p-1 bg-black/20 rounded-lg border border-white/10 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium cursor-pointer transition-colors ${
              tab === t.id ? 'bg-sky-500/25 text-sky-200 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Actual" value={fmt(totals.actual)} accent="text-emerald-400" icon={<Package className="w-4 h-4" />} sub={range} />
        <KpiCard label="Expected" value={fmt(totals.expected)} accent="text-sky-400" icon={<FileText className="w-4 h-4" />} sub="theoretical" />
        <KpiCard label="Production Loss" value={fmt(totals.loss)} accent="text-red-400" icon={<FileText className="w-4 h-4" />} sub={`${totals.expected ? ((totals.loss / totals.expected) * 100).toFixed(1) : 0}%`} />
        <KpiCard label="Cycles" value={fmt(totals.cycles)} icon={<Cpu className="w-4 h-4" />} sub="successful" />
      </div>

      {tab === 'daily' && (
        <Card>
          <CardHeader title="Daily Production Report" subtitle="Factory aggregate summary" icon={<CalendarDays className="w-4 h-4" />} />
          <Table>
            <TableHead labels={['Machines producing', 'Actual qty', 'Expected qty', 'Loss', 'Prod time', 'Idle time', 'Trial time', 'Changeover']} />
            <tbody>
              <Row cells={[
                `${machines.filter((m) => m.status === 'Running').length} of ${machines.length}`,
                fmt(totals.actual),
                fmt(totals.expected),
                <span className="text-red-400">{fmt(totals.loss)}</span>,
                fmtDuration(totals.prodTime),
                fmtDuration(totals.idleTime),
                fmtDuration(totals.trialTime),
                fmtDuration(totals.changeTime),
              ]} />
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'shift' && (
        <Card>
          <CardHeader title="Shift Report" subtitle="Shift-wise production totals" icon={<Clock className="w-4 h-4" />} />
          <Table>
            <TableHead labels={['Shift', 'Machines', 'Cycles', 'Actual qty', 'Expected qty', 'Utilization']} />
            <tbody>
              {(['A', 'B', 'C'] as const).map((s) => {
                const ms = machines.filter((m) => m.shift === s);
                const act = ms.reduce((sum, m) => sum + kpiIndex[m.id].actualQty, 0);
                const exp = ms.reduce((sum, m) => sum + kpiIndex[m.id].expectedQty, 0);
                const cyc = ms.reduce((sum, m) => sum + m.successfulCycles, 0);
                const util = ms.length ? ms.reduce((sum, m) => sum + kpiIndex[m.id].utilization, 0) / ms.length : 0;
                return <Row key={s} cells={[`Shift ${s}`, ms.length, fmt(cyc), fmt(act), fmt(exp), `${util.toFixed(0)}%`]} />;
              })}
            </tbody>
          </Table>
        </Card>
      )}


      {tab === 'machine' && (
        <Card>
          <CardHeader title="Machine Report" subtitle="Per-machine performance" icon={<Cpu className="w-4 h-4" />} />
          <Table>
            <TableHead labels={['Machine', 'Status', 'Mold', 'SKU', 'Mode', 'Cycles', 'Actual', 'Expected', 'Util.']} />
            <tbody>
              {rows.map(({ m, k }) => (
                <Row key={m.id} cells={[
                  <span className="font-semibold">{m.id}</span>,
                  <StatusBadge status={m.status} />,
                  m.moldId ?? '—',
                  m.sku ?? '—',
                  m.mode === 'None' ? '—' : m.mode,
                  fmt(m.successfulCycles),
                  fmt(k.actualQty),
                  fmt(k.expectedQty),
                  `${k.utilization.toFixed(0)}%`,
                ]} />
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'mold' && (
        <Card>
          <CardHeader title="Mold Report" subtitle="Mould asset production summary" icon={<Layers className="w-4 h-4" />} />
          <Table>
            <TableHead labels={['Mold', 'Material', 'Cavities', 'Machine', 'Status', 'Cycles', 'Total qty']} />
            <tbody>
              {ALL_MOLDS.filter((mold) => mold.machineId).slice(0, 20).map((mold) => (
                <Row key={mold.id} cells={[
                  <span className="font-semibold">{mold.id}</span>,
                  mold.material,
                  mold.cavities,
                  mold.machineId ?? '—',
                  mold.status,
                  fmt(mold.cycles),
                  fmt(mold.totalQty),
                ]} />
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === 'production' && (
        <Card>
          <CardHeader title="Production Report" subtitle="Expected vs actual and loss by machine" icon={<Package className="w-4 h-4" />} />
          <Table>
            <TableHead labels={['Machine', 'Actual', 'Expected', 'Loss', 'Achievement', 'Cavity eff.']} />
            <tbody>
              {rows.map(({ m, k }) => (
                <Row key={m.id} cells={[
                  <span className="font-semibold">{m.id}</span>,
                  fmt(k.actualQty),
                  fmt(k.expectedQty),
                  <span className="text-red-400">{fmt(Math.max(0, k.expectedQty - k.actualQty))}</span>,
                  `${k.achievement.toFixed(0)}%`,
                  `${k.cavityEfficiency.toFixed(0)}%`,
                ]} />
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">{children}</table>
    </div>
  );
}

function TableHead({ labels }: { labels: string[] }) {
  return (
    <thead>
      <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
        {labels.map((l, i) => (
          <th key={i} className={`${i === 0 ? 'px-5' : 'px-3'} py-2`}>{l}</th>
        ))}
      </tr>
    </thead>
  );
}

function Row({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      {cells.map((c, i) => (
        <td key={i} className={`py-3 ${i === 0 ? 'px-5' : 'px-3'} text-[12px]`}>{c}</td>
      ))}
    </tr>
  );
}

