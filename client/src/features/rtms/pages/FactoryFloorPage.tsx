import { Map, Radio, ArrowRight } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';
import { STATUS_STYLE, Card, CardHeader, StatusDot } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

export function FactoryFloorPage() {
  const { snapshot, goMachine, go } = useRtmsContext();
  const machines = snapshot.machines;

  const zones = Array.from(new Set(machines.map((m) => m.zone))).sort();

  return (
    <div>
      <PageHeader
        title="Real-Time Factory Floor View"
        subtitle="Level 1 — every machine as a live status indicator. A 5-second understanding of the plant."
        right={
          <button
            onClick={() => go('floor')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-[12px] font-semibold hover:bg-white/5 cursor-pointer"
          >
            <Radio className="w-4 h-4" /> Live
          </button>
        }
      />
      <div className="flex flex-wrap items-center gap-4 mb-5 text-[11px] text-zinc-400">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <StatusDot status={k as keyof typeof STATUS_STYLE} />
            {v.label}
          </span>
        ))}
      </div>

      {zones.map((zone) => {
        const zoneM = machines.filter((m) => m.zone === zone);
        return (
          <Card key={zone} className="mb-4 overflow-hidden">
            <CardHeader title={zone} subtitle={`${zoneM.length} machines`} icon={<Map className="w-4 h-4" />} />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {zoneM.map((m) => {
                  const s = STATUS_STYLE[m.status];
                  return (
                    <button
                      key={m.id}
                      onClick={() => goMachine(m.id)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center hover:border-sky-500/40 hover:bg-sky-500/[0.05] transition-all cursor-pointer"
                      title={`${m.id} · ${m.name} · ${m.status}`}
                    >
                      <div className="flex items-center justify-center">
                        <span
                          className={`w-4 h-4 rounded-full ${s.dot} ${
                            m.status === 'Running' || m.status === 'Trial' ? 'animate-pulse' : ''
                          }`}
                        />
                      </div>
                      <p className="mt-2 font-['Space_Grotesk'] font-bold">{m.id}</p>
                      <p className={`text-[10px] ${s.text} font-medium`}>{s.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{m.moldId ?? '—'}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">Need full machine detail?</p>
          <p className="text-[12px] text-zinc-400">Browse the complete machine list and open individual dashboards.</p>
        </div>
        <button
          onClick={() => go('machines')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-200 text-[12px] font-semibold hover:bg-sky-500/25 cursor-pointer"
        >
          Machines <ArrowRight className="w-4 h-4" />
        </button>
      </Card>
    </div>
  );
}
