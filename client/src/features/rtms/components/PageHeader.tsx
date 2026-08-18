import type { ReactNode } from 'react';
import { Calendar } from 'lucide-react';
import { AlertBell } from './AlertBell';
import { useRtmsContext } from '../RtmsContext';

export { AlertBell };

export function PageHeader({
  title,
  subtitle,
  right,
  hideAlertBell = false,
  now,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  hideAlertBell?: boolean;
  now?: Date;
}) {
  const context = useRtmsContext();
  const currentDate = now || context?.now || new Date();

  const formattedDate = currentDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      {/* Left: Title & Subtitle */}
      <div className="z-10">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Center: Day and Date (2x of previous size) */}
      <div className="w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center justify-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/15 backdrop-blur-md shadow-lg shadow-black/20 text-zinc-100">
          <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="text-lg md:text-xl font-bold font-['Space_Grotesk'] tracking-wide bg-gradient-to-r from-sky-200 via-white to-sky-300 bg-clip-text text-transparent">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Right: Alert Bell + Time */}
      <div className="flex items-center gap-2.5 z-10 self-end md:self-center">
        {!hideAlertBell && <AlertBell />}
        {right}
      </div>
    </div>
  );
}

export function LiveClock({ now }: { now: Date }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[12px]">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-mono text-zinc-300">
        {now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}
      </span>
    </div>
  );
}
