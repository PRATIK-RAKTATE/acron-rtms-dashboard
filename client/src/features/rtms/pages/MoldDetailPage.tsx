import React from 'react';
import { ArrowLeft, Layers, History, GitBranch, Cpu, Radio } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt, fmtDuration } from '../kpis';
import { Card, CardHeader, MoldStatusBadge, ModeBadge, Pill } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

export function MoldDetailPage() {
  const { selectedMoldId, moldOf, go } = useRtmsContext();
  const mold = moldOf(selectedMoldId);

  if (!mold) {
    return (
      <div>
        <button onClick={() => go('molds')} className="inline-flex items-center gap-1.5 text-sky-300 text-[12px] font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to molds
        </button>
        <p className="mt-6 text-zinc-500 text-sm">Select a mold to open its detail & history.</p>
      </div>
    );
  }

  const todayShots = mold.cycles;
  const todayQty = Math.round(mold.cycles * mold.cavities);
  const cavityEff = mold.cavities ? 100 : 0;
  const productionLoss = Math.max(0, Math.round(mold.cycles * mold.cavities * 0.03));

  return (
    <div>
      <PageHeader
        title={`${mold.id} — Mold Detail`}
        subtitle={`RFID ${mold.rfid} · ${mold.material} · ${mold.cavities} cavities · Created ${mold.createdAt}`}
        right={
          <button
            onClick={() => go('molds')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-[12px] font-semibold hover:bg-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Current information */}
      <Card className="p-4 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Current Information</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <p className="text-[10px] text-zinc-500">Mold ID</p>
            <p className="font-bold">{mold.id}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Status</p>
            <div className="mt-0.5"><MoldStatusBadge status={mold.status} /></div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Machine</p>
            <p className="font-semibold">{mold.machineId ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">SKU</p>
            <p className="font-semibold">{mold.sku ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Mode</p>
            <div className="mt-0.5"><ModeBadge mode={mold.mode} /></div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Installed At</p>
            <p className="font-semibold">{mold.installedAt ?? '—'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production statistics */}
        <Card>
          <CardHeader title="Production Statistics" subtitle="Today / current run" icon={<Cpu className="w-4 h-4" />} />
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <Stat label="Today's shots" value={fmt(todayShots)} />
            <Stat label="Today's production" value={fmt(todayQty)} accent="text-emerald-400" />
            <Stat label="Total cycles" value={fmt(mold.cycles)} />
            <Stat label="Total production" value={fmt(mold.totalQty)} />
            <Stat label="Cavity efficiency" value={`${cavityEff.toFixed(0)}%`} />
            <Stat label="Production loss" value={fmt(productionLoss)} accent="text-red-400" />
          </div>
        </Card>

        {/* Lifecycle view */}
        <Card>
          <CardHeader title="Mold Lifecycle" subtitle="Complete digital journey" icon={<GitBranch className="w-4 h-4" />} />
          <div className="px-5 pb-5">
            <div className="relative pl-6 border-l-2 border-white/15 space-y-5">
              <LifeStep done label="Mold Created" date={mold.createdAt} icon={<Layers className="w-4 h-4" />} />
              <LifeStep done label="Installed on Machine" date={mold.installedAt ? `Today ${mold.installedAt}` : undefined} icon={<Cpu className="w-4 h-4" />} />
              <LifeStep done label={mold.mode === 'Trial' ? 'Trial (in progress)' : 'Trial'} active={mold.mode === 'Trial'} />
              <LifeStep active={mold.mode === 'Production'} done label="Production" />
              <LifeStep label={mold.status === 'Available' ? 'Changeover / Removal (current)' : 'Changeover / Removal'} pending={mold.status !== 'Available'} />
              <LifeStep label="Installed on Another Machine" pending />
            </div>
          </div>
        </Card>

        {/* RFID / traceability */}
        <Card>
          <CardHeader title="Traceability" subtitle="Mold as a traceable production asset" icon={<Radio className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">RFID tag</p>
              <p className="font-mono text-sm">{mold.rfid}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Configured cavities</p>
              <p className="text-lg font-bold">{mold.cavities}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Material</p>
              <p className="text-lg font-bold">{mold.material}</p>
            </div>
          </div>
        </Card>
      </div>


      {/* History */}
      <Card className="mt-4">
        <CardHeader title="Mold History" subtitle="Installation, removal & changeover record" icon={<History className="w-4 h-4" />} />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/10">
                <th className="px-5 py-2">Machine</th>
                <th className="px-3 py-2">Installed</th>
                <th className="px-3 py-2">Removed</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2">Cycles</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2 text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {mold.history.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-6 text-center text-zinc-500 text-sm">No installation history — mould is new / in store.</td></tr>
              )}
              {mold.history.map((h, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{h.machineId}</span>
                      <span className="text-[10px] text-zinc-500">{h.machineName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12px]">{h.installedAt}</td>
                  <td className="px-3 py-3 text-[12px]">
                    {h.removedAt ?? (
                      <span className="text-emerald-400 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Present
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12px]">{h.sku}</td>
                  <td className="px-3 py-3"><ModeBadge mode={h.mode} /></td>
                  <td className="px-3 py-3 text-[12px] font-semibold">{fmt(h.cycles)}</td>
                  <td className="px-3 py-3 text-[12px]">{fmt(h.qty)}</td>
                  <td className="px-3 py-3 text-right text-[12px] text-zinc-300">{fmtDuration(h.durationMin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent = 'text-zinc-100' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className={`text-lg font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function LifeStep({
  label,
  date,
  icon,
  done,
  active,
  pending,
}: {
  label: string;
  date?: string;
  icon?: React.ReactNode;
  done?: boolean;
  active?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3">
      <span
        className={`absolute -left-[30px] top-0 w-3 h-3 rounded-full ${
          active ? 'bg-emerald-400 animate-pulse' : done ? 'bg-sky-400' : 'bg-zinc-600'
        }`}
      />
      <div className={`flex items-center gap-2 ${pending ? 'opacity-50' : ''}`}>
        {icon && <span className="text-zinc-400">{icon}</span>}
        <div>
          <p className="text-[13px] font-semibold">
            {label}
            {active && <Pill className="ml-2 border-emerald-500/40 text-emerald-300">now</Pill>}
          </p>
          {date && <p className="text-[10px] text-zinc-500">{date}</p>}
        </div>
      </div>
    </div>
  );
}

