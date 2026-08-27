import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Info,
  CircleCheck,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import type {
  AlertPriority,
  MachineStatus,
  MoldStatus,
  OperatingMode,
} from '../types';

/* ------------------------------ Status maps ------------------------------ */

export const STATUS_STYLE: Record<
  MachineStatus,
  { text: string; dot: string; badge: string; label: string }
> = {
  Running: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
    label: 'Running',
  },
  Idle: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    badge: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
    label: 'Idle',
  },
  Trial: {
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    badge: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
    label: 'Trial',
  },
  Stopped: {
    text: 'text-red-400',
    dot: 'bg-red-500',
    badge: 'text-red-300 bg-red-500/15 border-red-500/40',
    label: 'Stopped',
  },
  Changeover: {
    text: 'text-fuchsia-400',
    dot: 'bg-fuchsia-400',
    badge: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/40',
    label: 'Changeover',
  },
};

export const MOLD_STATUS_STYLE: Record<MoldStatus, string> = {
  Running: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
  Trial: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
  Idle: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
  Available: 'text-zinc-300 bg-white/5 border-white/15',
  Maintenance: 'text-red-300 bg-red-500/15 border-red-500/40',
};

export const MODE_STYLE: Record<OperatingMode, string> = {
  Production: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/40',
  Trial: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
  None: 'text-zinc-400 bg-white/5 border-white/10',
};

export const PRIORITY_STYLE: Record<AlertPriority, { badge: string; icon: ReactNode }> = {
  Critical: {
    badge: 'text-red-300 bg-red-500/20 border-red-500/50',
    icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
  },
  Warning: {
    badge: 'text-amber-300 bg-amber-500/20 border-amber-500/50',
    icon: <Info className="w-4 h-4 text-amber-400" />,
  },
  Information: {
    badge: 'text-sky-300 bg-sky-500/20 border-sky-500/40',
    icon: <CircleCheck className="w-4 h-4 text-sky-400" />,
  },
};

/* ------------------------------ Primitives ------------------------------- */

export function StatusDot({ status, pulse }: { status: MachineStatus; pulse?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${s.dot} ${
        pulse && (status === 'Running' || status === 'Trial') ? 'animate-pulse' : ''
      }`}
    />
  );
}

export function StatusBadge({ status }: { status: MachineStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border tracking-wide ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: OperatingMode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${MODE_STYLE[mode]}`}
    >
      {mode === 'None' ? '—' : mode}
    </span>
  );
}

export function MoldStatusBadge({ status }: { status: MoldStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${MOLD_STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Cards ---------------------------------- */

export function Card({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-sky-400/90">{icon}</span>}
        <div>
          <h3 className="font-['Space_Grotesk'] text-sm font-semibold tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  accent = 'text-zinc-100',
  icon,
  delta,
  deltaLabel = 'vs target',
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  icon?: ReactNode;
  delta?: number;
  deltaLabel?: string;
  children?: ReactNode;
}) {
  const DeltaIcon = delta === undefined ? null : delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <Card className="p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">{label}</p>
          {icon && <span className="text-zinc-500">{icon}</span>}
        </div>
        <div className={`mt-2 font-['Space_Grotesk'] text-2xl font-bold ${accent}`}>{value}</div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          {delta !== undefined && DeltaIcon && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                delta >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              <DeltaIcon className="w-3.5 h-3.5" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <span className="text-zinc-500">{sub ?? deltaLabel}</span>
        </div>
      </div>
      {children}
    </Card>
  );
}

export function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-zinc-400">
        <Minus className="w-3.5 h-3.5" /> 0%
      </span>
    );
  }
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold ${
        value > 0 ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}


/* -------------------------------- Charts --------------------------------- */

export function ProgressBar({
  value,
  max = 100,
  color = 'emerald',
  height = 'h-2',
}: {
  value: number;
  max?: number;
  color?: 'emerald' | 'amber' | 'red' | 'sky' | 'indigo' | 'fuchsia' | 'orange' | 'zinc';
  height?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    sky: 'bg-sky-400',
    indigo: 'bg-indigo-400',
    fuchsia: 'bg-fuchsia-400',
    orange: 'bg-orange-400',
    zinc: 'bg-zinc-400',
  };
  return (
    <div className={`w-full ${height} rounded-full bg-white/10 overflow-hidden`}>
      <div
        className={`${height} ${colors[color]} rounded-full transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Donut({
  value,
  size = 120,
  stroke = 12,
  color = 'rgb(52 211 153)',
  track = 'rgba(255,255,255,0.1)',
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {label ?? <span className="text-lg font-bold">{Math.round(pct)}%</span>}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 160,
  color = 'bg-sky-400',
  valueFmt,
}: {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  valueFmt?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(3, (d.value / max) * height);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {valueFmt ? valueFmt(d.value) : d.value.toLocaleString('en-IN')}
              </span>
              <div className="w-full rounded-t bg-white/5 overflow-hidden" style={{ height }}>
                <div
                  className={`w-full rounded-t ${color} transition-all duration-700`}
                  style={{ height: h }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-zinc-500 truncate">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function HBar({
  label,
  value,
  total,
  color = 'bg-sky-400',
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const m = color.match(/bg-([a-z]+)-400/);
  const tone = (m ? m[1] : 'emerald') as 'emerald' | 'amber' | 'red' | 'sky' | 'indigo' | 'fuchsia' | 'orange' | 'zinc';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-300">{label}</span>
        <span className="text-zinc-400">
          {value.toLocaleString('en-IN')} · {pct.toFixed(1)}%
        </span>
      </div>
      <ProgressBar value={pct} color={tone} />
    </div>
  );
}

export function TimeRangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = ['shift', 'today', 'yesterday', '7days', '30days', 'custom'];
  const labels: Record<string, string> = {
    shift: 'Shift',
    today: 'Today',
    yesterday: 'Yesterday',
    '7days': '7 Days',
    '30days': '30 Days',
    custom: 'Custom',
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-black/20 rounded-lg border border-white/10">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
            value === o ? 'bg-sky-500/25 text-sky-200 shadow' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center text-zinc-500">
      <AlertTriangle className="w-8 h-8 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

