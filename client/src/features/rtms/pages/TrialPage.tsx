import { FlaskConical, Timer, Layers, CheckCircle2, History } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt, fmtDuration } from '../kpis';
import { Card, CardHeader, Pill, StatusBadge, ModeBadge } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

export function TrialPage() {
  const { snapshot, kpiIndex, goMold, goMachine } = useRtmsContext();
  const trials = snapshot.machines.filter((m) => m.status === 'Trial');

  const totalTrialQty = trials.reduce((s, m) => s + m.successfulCycles * m.cavity.total, 0);
  const totalTrialMin = trials.reduce((s, m) => s + m.trialTime, 0);

  return (
    <div>
      <PageHeader title="Trial Monitoring" subtitle="Trial and production data are kept completely separate" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Machines in trial</p><p className="text-2xl font-bold text-sky-400">{trials.length}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Trial quantity</p><p className="text-2xl font-bold">{fmt(totalTrialQty)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-zinc-400">Total trial duration</p><p className="text-2xl font-bold">{fmtDuration(totalTrialMin)}</p></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Machine trial cards */}
        <Card>
          <CardHeader title="Machines Currently in Trial" subtitle="Live trial run status" icon={<FlaskConical className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-3">
            {trials.length === 0 && <p className="text-sm text-zinc-500">No machines currently in trial.</p>}
            {trials.map((m) => {
              const k = kpiIndex[m.id];
              const qty = m.successfulCycles * m.cavity.total;
              return (
                <button
                  key={m.id}
                  onClick={() => goMachine(m.id)}
                  className="w-full text-left rounded-xl border border-sky-500/25 bg-sky-500/[0.04] p-4 hover:border-sky-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-['Space_Grotesk'] font-bold text-lg">{m.id}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); goMold(m.moldId ?? ''); }}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-300 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" /> {m.moldId} mold detail
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[12px]">
                    <div><p className="text-[10px] text-zinc-500">Trial start</p><p className="font-semibold">{m.lastCycleAt}</p></div>
                    <div><p className="text-[10px] text-zinc-500">Duration</p><p className="font-semibold">{fmtDuration(m.trialTime)}</p></div>
                    <div><p className="text-[10px] text-zinc-500">Trial cycles</p><p className="font-semibold">{fmt(m.successfulCycles)}</p></div>
                    <div><p className="text-[10px] text-zinc-500">Trial qty</p><p className="font-semibold">{fmt(qty)}</p></div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-sky-500/40 text-sky-300 bg-sky-500/10">
                      Cavity eff: {k.cavityEfficiency.toFixed(0)}%
                    </span>
                    <Pill className="border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for production
                    </Pill>
                    <ModeBadge mode={m.mode} />
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Trial history by mold */}
        <Card>
          <CardHeader title="Trial History by Mold" subtitle="Recent trial runs per mould" icon={<History className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-2">
            {snapshot.machines.filter((m) => m.moldId).slice(0, 12).map((m) => (
              <button
                key={m.id}
                onClick={() => goMold(m.moldId ?? '')}
                className="w-full flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 cursor-pointer hover:border-sky-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-zinc-500" />
                  <div>
                    <p className="text-[12px] font-semibold">{m.moldId}</p>
                    <p className="text-[10px] text-zinc-500">{m.id} · last trial {m.mode === 'Trial' ? 'now' : `${m.trialTime} min`}</p>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-400">{fmt(Math.round(m.successfulCycles * 0.15))} cycles</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-4">
        <p className="text-[12px] text-zinc-400">
          <span className="font-semibold text-sky-300">Trial-to-production transition:</span> trial cycles, quantity and duration are
          tracked separately from production so the system can measure the exact time and validation overhead of moving a mould from
          trial into mass production.
        </p>
      </Card>
    </div>
  );
}

