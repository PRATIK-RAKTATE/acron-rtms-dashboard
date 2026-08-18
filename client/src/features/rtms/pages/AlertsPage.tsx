import { useState } from 'react';
import { BellRing, Filter } from 'lucide-react';
import type { AlertPriority } from '../types';
import { useRtmsContext } from '../RtmsContext';
import { PRIORITY_STYLE } from '../components/ui';
import { PageHeader } from '../components/PageHeader';

const PRIORITIES: Array<'All' | AlertPriority> = ['All', 'Critical', 'Warning', 'Information'];

export function AlertsPage() {
  const { alerts, goMachine, goMold } = useRtmsContext();
  const [priority, setPriority] = useState<'All' | AlertPriority>('All');

  const filtered = alerts.filter((a) => (priority === 'All' ? true : a.priority === priority));
  const counts = {
    Critical: alerts.filter((a) => a.priority === 'Critical').length,
    Warning: alerts.filter((a) => a.priority === 'Warning').length,
    Information: alerts.filter((a) => a.priority === 'Information').length,
  };
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div>
      <PageHeader
        title="Alerts & Events"
        subtitle="Prioritized real-time notifications from the factory floor"
        right={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[12px]">
            <BellRing className="w-4 h-4 text-red-400" /> {unread} unread
          </span>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <CountCard label="Total" value={alerts.length} accent="text-zinc-100" />
        <CountCard label="Critical" value={counts.Critical} accent="text-red-400" />
        <CountCard label="Warning" value={counts.Warning} accent="text-amber-400" />
        <CountCard label="Information" value={counts.Information} accent="text-sky-400" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-zinc-400" />
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border cursor-pointer transition-colors ${
              priority === p ? 'bg-sky-500/20 text-sky-200 border-sky-500/40' : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((a) => {
          const st = PRIORITY_STYLE[a.priority];
          return (
            <div
              key={a.id}
              className={`rounded-xl border bg-white/[0.02] p-4 flex items-start gap-3 ${st.badge} ${
                a.read ? 'opacity-60' : ''
              }`}
            >
              <span className="mt-0.5 shrink-0">{st.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-wide">{a.type}</span>
                  <span className="text-[11px] font-semibold">{a.priority}</span>
                  {!a.read && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                <p className="text-sm mt-0.5">{a.message}</p>
                <p className="text-[12px] text-zinc-400 mt-0.5">{a.detail}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                  <span>• {a.time}</span>
                  <button onClick={() => goMachine(a.machineId)} className="hover:text-sky-300 cursor-pointer">{a.machineId}</button>
                  {a.moldId && (
                    <button onClick={() => { if (a.moldId) goMold(a.moldId); }} className="hover:text-sky-300 cursor-pointer">{a.moldId}</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-zinc-500 text-sm py-8">No alerts in this category.</p>}
      </div>
    </div>
  );
}

function CountCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">{label} alerts</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
