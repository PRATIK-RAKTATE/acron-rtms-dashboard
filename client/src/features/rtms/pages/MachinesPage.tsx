import { useMemo, useState } from 'react';
import { Cpu, Search, ArrowRight } from 'lucide-react';
import type { MachineStatus } from '../types';
import { useRtmsContext } from '../RtmsContext';
import { fmt } from '../kpis';
import { STATUS_STYLE, StatusBadge, ModeBadge } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

const ZONES = ['All', 'IM1', 'IM2', 'BM1', 'BM2'];

export function MachinesPage() {
  const { snapshot, kpiIndex, goMachine } = useRtmsContext();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('All');
  const [status, setStatus] = useState<'All' | MachineStatus>('All');

  const filtered = useMemo(() => {
    return snapshot.machines
      .filter((m) => (zone === 'All' ? true : m.zone === zone))
      .filter((m) => (status === 'All' ? true : m.status === status))
      .filter((m) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          (m.moldId ?? '').toLowerCase().includes(q) ||
          (m.sku ?? '').toLowerCase().includes(q)
        );
      });
  }, [snapshot, query, zone, status]);

  return (
    <div>
      <PageHeader
        title="Machine List"
        subtitle="Level 2 — production performance of each machine in the fleet"
        right={
          <div className="flex items-center gap-2 bg-black/20 rounded-lg border border-white/10 px-3 py-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search machine / mold / SKU…"
              className="bg-transparent text-sm w-56 outline-none placeholder:text-zinc-500"
            />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {ZONES.map((z) => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors ${
              zone === z ? 'bg-sky-500/20 text-sky-200 border-sky-500/40' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {z}
          </button>
        ))}
        <span className="mx-1 w-px h-5 bg-white/10" />
        {(['All', 'Running', 'Idle', 'Trial', 'Stopped', 'Changeover'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s as 'All' | MachineStatus)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors ${
              status === s ? 'bg-white/10 text-zinc-100 border-white/30' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((m) => {
          const k = kpiIndex[m.id];
          const s = STATUS_STYLE[m.status];
          return (
            <button
              key={m.id}
              onClick={() => goMachine(m.id)}
              className="w-full text-left rounded-xl border border-white/10 bg-white/[0.03] p-3.5 hover:border-sky-500/40 hover:bg-sky-500/[0.05] transition-all cursor-pointer grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <Cpu className={`w-4 h-4 ${s.text}`} />
                <div>
                  <p className="font-['Space_Grotesk'] font-bold">{m.id}</p>
                  <p className="text-[10px] text-zinc-500">{m.zone}</p>
                </div>
              </div>
              <div><StatusBadge status={m.status} /></div>
              <div className="text-[12px]"><span className="text-zinc-500">Mold </span><b>{m.moldId ?? '—'}</b></div>
              <div className="text-[12px]"><span className="text-zinc-500">SKU </span><b>{m.sku ?? '—'}</b></div>
              <div className="text-[12px]"><ModeBadge mode={m.mode} /></div>
              <div className="text-[12px]"><span className="text-zinc-500">Cycles </span><b>{fmt(m.successfulCycles)}</b></div>
              <div className="text-[12px]"><span className="text-zinc-500">Act. Qty </span><b className="text-emerald-400">{fmt(k.actualQty)}</b></div>
              <div className="text-right text-[12px] text-zinc-400">Util. <b className="text-sky-300">{k.utilization.toFixed(0)}%</b></div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm">No machines match the current filter.</div>
        )}
      </div>

      <button
        onClick={() => goMachine(snapshot.machines[0]?.id ?? '')}
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
      >
        Open first machine detail <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
