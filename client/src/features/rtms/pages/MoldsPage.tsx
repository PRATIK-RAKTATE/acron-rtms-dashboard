import { useMemo, useState } from 'react';
import { Layers, Search, ArrowRight } from 'lucide-react';
import type { MoldStatus } from '../types';
import { useRtmsContext } from '../RtmsContext';
import { fmt } from '../kpis';
import { ALL_MOLDS } from '../data';
import { Card, CardHeader, MoldStatusBadge, ModeBadge, Pill } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

const STATUS_FILTERS: Array<'All' | MoldStatus> = ['All', 'Running', 'Trial', 'Idle', 'Available', 'Maintenance'];

export function MoldsPage() {
  const { machineOf, goMold } = useRtmsContext();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | MoldStatus>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_MOLDS
      .filter((m) => (status === 'All' ? true : m.status === status))
      .filter((m) => {
        if (!q) return true;
        return (
          m.id.toLowerCase().includes(q) ||
          m.rfid.toLowerCase().includes(q) ||
          (m.machineId ?? '').toLowerCase().includes(q) ||
          (m.sku ?? '').toLowerCase().includes(q)
        );
      });
  }, [query, status]);

  const running = ALL_MOLDS.filter((m) => m.status === 'Running' || m.status === 'Trial').length;

  return (
    <div>
      <PageHeader
        title="Mold Dashboard"
        subtitle="Level 4 — asset & mold intelligence · which mold is on which machine, right now"
        right={
          <div className="flex items-center gap-2 bg-black/20 rounded-lg border border-white/10 px-3 py-2">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mold / machine / SKU / RFID…"
              className="bg-transparent text-sm w-60 outline-none placeholder:text-zinc-500"
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Total molds</p><p className="text-2xl font-bold">{ALL_MOLDS.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Installed (running/trial)</p><p className="text-2xl font-bold text-emerald-400">{running}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Available in store</p><p className="text-2xl font-bold text-zinc-300">{ALL_MOLDS.filter((m) => m.status === 'Available').length}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Maintenance</p><p className="text-2xl font-bold text-red-400">{ALL_MOLDS.filter((m) => m.status === 'Maintenance').length}</p></Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors ${
              status === s ? 'bg-sky-500/20 text-sky-200 border-sky-500/40' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="text-[11px] text-zinc-500 ml-auto">{filtered.length} molds</span>
      </div>

      <Card>
        <CardHeader title="Live Mold Tracking" subtitle="RFID-identified mould asset ledger" icon={<Layers className="w-4 h-4" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                <th className="px-5 py-2">Mold ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Current Machine</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Cavities</th>
                <th className="px-3 py-2">Installed Since</th>
                <th className="px-3 py-2 text-right">Cycles</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mold) => {
                const machine = machineOf(mold.machineId);
                return (
                  <tr
                    key={mold.id}
                    onClick={() => goMold(mold.id)}
                    className="border-b border-white/5 hover:bg-sky-500/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-['Space_Grotesk'] font-bold">{mold.id}</span>
                        <span className="text-[10px] text-zinc-500">{mold.rfid}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><MoldStatusBadge status={mold.status} /></td>
                    <td className="px-3 py-3 text-[12px] font-semibold">
                      {machine?.id ?? '—'}
                      <span className="text-zinc-500 font-normal"> {machine ? `· ${machine.zone}` : '(store)'}</span>
                    </td>
                    <td className="px-3 py-3 text-[12px]">{mold.sku ?? '—'}</td>
                    <td className="px-3 py-3"><ModeBadge mode={mold.mode} /></td>
                    <td className="px-3 py-3 text-[12px]">{mold.cavities}</td>
                    <td className="px-3 py-3 text-[12px] text-zinc-300">{mold.installedAt ?? '—'}</td>
                    <td className="px-3 py-3 text-right text-[12px] font-semibold">{fmt(mold.cycles)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">Click any mould to open its complete history & lifecycle.</span>
          {filtered.length > 0 && (
            <button onClick={() => goMold(filtered[0].id)} className="inline-flex items-center gap-1 text-[12px] text-sky-300 cursor-pointer">
              Open {filtered[0].id} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill className="border-white/15 text-zinc-300">Tip: search like</Pill>
        <Pill className="border-sky-500/40 text-sky-300">MD-001</Pill>
        <Pill className="border-sky-500/40 text-sky-300">M-032</Pill>
        <Pill className="border-sky-500/40 text-sky-300">SKU-104</Pill>
        <Pill className="border-sky-500/40 text-sky-300">Available</Pill>
      </div>
    </div>
  );
}

