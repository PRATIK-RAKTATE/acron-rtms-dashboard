import {
  ArrowLeft,
  Activity,
  TrendingDown,
  Gauge,
  History,
  CalendarClock,
  Layers,
} from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { fmt, fmtDuration, lossBreakdown } from '../kpis';
import { generateTimelineFor } from '../events';
import {
  Card,
  CardHeader,
  StatusBadge,
  ModeBadge,
  Pill,
  Donut,
  ProgressBar,
} from '../components/ui';
import { PageHeader } from '../components/PageHeader';

const EVENT_COLOR: Record<string, string> = {
  Running: 'bg-emerald-400',
  Trial: 'bg-sky-400',
  Idle: 'bg-amber-400',
  Changeover: 'bg-fuchsia-400',
  Stopped: 'bg-red-500',
};

export function MachineDetailPage() {
  const { selectedMachineId, machineOf, kpiIndex, go, timelineOf } = useRtmsContext();
  const machine = machineOf(selectedMachineId);

  if (!machine) {
    return (
      <div>
        <button onClick={() => go('machines')} className="inline-flex items-center gap-1.5 text-sky-300 text-[12px] font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to machines
        </button>
        <p className="mt-6 text-zinc-500 text-sm">Select a machine to view its detail dashboard.</p>
      </div>
    );
  }

  const k = kpiIndex[machine.id];
  const loss = lossBreakdown(machine, k);
  const timeline = timelineOf(machine.id) ?? generateTimelineFor(machine);

  return (
    <div>
      <PageHeader
        title={`${machine.id} · ${machine.name}`}
        subtitle={`${machine.brand} ${machine.tonnage}T · ${machine.zone} · Shift ${machine.shift}`}
        right={
          <button
            onClick={() => go('machines')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-[12px] font-semibold hover:bg-white/5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      {/* Current machine info strip */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Machine ID</p>
            <p className="font-['Space_Grotesk'] font-bold">{machine.id}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Status</p>
            <div className="mt-0.5"><StatusBadge status={machine.status} /></div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Mold</p>
            <p className="font-semibold">{machine.moldId ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">SKU</p>
            <p className="font-semibold">{machine.sku ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Mode</p>
            <div className="mt-0.5"><ModeBadge mode={machine.mode} /></div>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Cycle Time</p>
            <p className="font-semibold">{machine.avgCycleTime.toFixed(1)}s</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Last Cycle</p>
            <p className="font-semibold">{machine.lastCycleAt}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Today's production */}
        <Card>
          <CardHeader title="Today's Production" subtitle="Trial and production kept separate" icon={<Activity className="w-4 h-4" />} />
          <div className="px-5 pb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Total shots</p>
              <p className="text-lg font-bold">{fmt(machine.shots)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Successful cycles</p>
              <p className="text-lg font-bold">{fmt(machine.successfulCycles)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Expected qty</p>
              <p className="text-lg font-bold text-emerald-400">{fmt(k.expectedQty)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Actual qty</p>
              <p className="text-lg font-bold">{fmt(k.actualQty)}</p>
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3">
              <p className="text-[10px] text-red-300">Production loss</p>
              <p className="text-lg font-bold text-red-400">{fmt(k.productionLoss)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Trial qty</p>
              <p className="text-lg font-bold">{machine.mode === 'Trial' ? fmt(machine.successfulCycles * machine.cavity.total) : '0'}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Production time</p>
              <p className="text-lg font-bold">{fmtDuration(machine.productionTime)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Idle time</p>
              <p className="text-lg font-bold">{fmtDuration(machine.idleTime)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <p className="text-[10px] text-zinc-500">Changeover time</p>
              <p className="text-lg font-bold">{fmtDuration(machine.changeoverTime)}</p>
            </div>
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/25 p-3">
              <p className="text-[10px] text-sky-300">Trial time</p>
              <p className="text-lg font-bold text-sky-300">{fmtDuration(machine.trialTime)}</p>
            </div>
          </div>
        </Card>


        {/* Performance */}
        <Card>
          <CardHeader title="Performance" subtitle="Cycle · efficiency · utilization" icon={<Gauge className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 text-[12px]">
                <p className="text-zinc-400">Avg cycle <b className="text-zinc-100">{machine.avgCycleTime.toFixed(1)}s</b></p>
                <p className="text-zinc-400">Reference cycle <b className="text-zinc-100">{machine.referenceCycleTime.toFixed(1)}s</b></p>
                <p className="text-zinc-400">
                  Cycle deviation{' '}
                  <b className={k.cycleDeviation > 0 ? 'text-red-400' : 'text-emerald-400'}>
                    {k.cycleDeviation > 0 ? '+' : ''}{k.cycleDeviation.toFixed(1)}%
                  </b>
                </p>
              </div>
              <Donut
                value={k.productionEfficiency}
                color={k.productionEfficiency >= 90 ? 'rgb(52 211 153)' : k.productionEfficiency >= 75 ? 'rgb(251 191 36)' : 'rgb(248 113 113)'}
                label={<div className="text-center"><p className="text-lg font-bold">{k.productionEfficiency.toFixed(0)}%</p><p className="text-[9px] text-zinc-400">Prod Eff.</p></div>}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">Machine utilization</span>
                <b className="text-sky-300">{k.utilization.toFixed(1)}%</b>
              </div>
              <ProgressBar value={k.utilization} color="sky" />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">Cavity efficiency</span>
                <b className="text-emerald-300">{k.cavityEfficiency.toFixed(1)}%</b>
              </div>
              <ProgressBar value={k.cavityEfficiency} />
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-zinc-400">Production achievement</span>
                <b className="text-indigo-300">{k.achievement.toFixed(1)}%</b>
              </div>
              <ProgressBar value={k.achievement} color="indigo" />
            </div>
          </div>
        </Card>

        {/* Machine loss */}
        <Card>
          <CardHeader title="Loss Analysis" subtitle="Where is this machine losing production?" icon={<TrendingDown className="w-4 h-4" />} />
          <div className="px-5 pb-5 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 p-3">
              <span className="text-[12px] text-zinc-400">Total loss</span>
              <b className="text-red-400">{fmt(k.productionLoss)}</b>
            </div>
            <Pill className="border-amber-500/40 text-amber-300 bg-amber-500/10">Idle {fmt(loss.idle)}</Pill>
            <Pill className="border-fuchsia-500/40 text-fuchsia-300 bg-fuchsia-500/10">Changeover {fmt(loss.changeover)}</Pill>
            <Pill className="border-sky-500/40 text-sky-300 bg-sky-500/10">Trial {fmt(loss.trial)}</Pill>
            <Pill className="border-red-500/40 text-red-300 bg-red-500/10">Cavity {fmt(loss.cavity)}</Pill>
            <Pill className="border-orange-500/40 text-orange-300 bg-orange-500/10">Breakdown {fmt(loss.breakdown)}</Pill>
            <Pill className="border-indigo-500/40 text-indigo-300 bg-indigo-500/10">Slow cycle {fmt(loss.slowCycle)}</Pill>
            <Pill className="border-white/20 text-zinc-300">Other {fmt(loss.other)}</Pill>
          </div>
        </Card>
      </div>


      {/* Timeline */}
      <Card className="mt-4">
        <CardHeader
          title="Machine Timeline"
          subtitle="Operating history generated from real-time events"
          icon={<History className="w-4 h-4" />}
        />
        <div className="px-5 pb-5">
          <div className="relative pl-6 border-l-2 border-white/15">
            {timeline.map((ev, i) => (
              <div key={ev.id} className="relative pb-5 last:pb-0">
                <span
                  className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full ${EVENT_COLOR[ev.type] ?? 'bg-zinc-400'}`}
                  style={{ boxShadow: `0 0 0 4px rgba(255,255,255,0.05)` }}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[12px] text-sky-200 w-12">{ev.start}</span>
                  <span className="text-[12px] font-semibold uppercase tracking-wide">
                    {ev.type}
                    {ev.end && <span className="text-zinc-500 font-normal normal-case"> → {ev.end}</span>}
                  </span>
                  <Pill className="border-white/15 text-zinc-300">{ev.durationMin} min</Pill>
                  {ev.moldId && <Pill className="border-white/15 text-zinc-300"><Layers className="w-3 h-3 mr-1" />{ev.moldId}</Pill>}
                  {ev.mode !== 'None' && <ModeBadge mode={ev.mode} />}
                </div>
                {i === timeline.length - 1 && (
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live now
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* History note */}
      <Card className="mt-4 p-4 flex items-start gap-3">
        <CalendarClock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Machine operating history</p>
          <p className="text-[12px] text-zinc-400 mt-1">
            The full shift/day history for {machine.id} is captured in the timeline above. Each event records start time, end
            time, duration, event type, mold and operating mode — giving a complete picture of what happened on the machine.
          </p>
        </div>
      </Card>
    </div>
  );
}

