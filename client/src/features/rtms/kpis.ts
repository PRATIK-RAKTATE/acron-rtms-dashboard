import type {
  FactorySnapshot,
  LossBreakdown,
  Machine,
  MachineKpi,
} from './types';

export function clamp100(v: number): number {
  return Math.min(100, Math.max(0, v));
}

export function pct(dividend: number, divisor: number): number {
  if (!divisor) return 0;
  return (dividend / divisor) * 100;
}

export function round(v: number, digits = 1): number {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

export function fmt(n: number): string {
  return n.toLocaleString('en-IN');
}

export function fmtDuration(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function nowStride(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function timeHM(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Derive all KPI values for a machine snapshot. */
export function machineKpi(m: Machine): MachineKpi {
  const expectedQty = m.successfulCycles * m.cavity.total;
  const actualQty = m.successfulCycles * m.cavity.active;
  const productionLoss = Math.max(0, expectedQty - actualQty);
  const utilization = clamp100(pct(m.productionTime, m.availableTime));
  const productionEfficiency = clamp100(pct(actualQty, expectedQty));
  const cavityEfficiency = clamp100(pct(m.cavity.active, m.cavity.total));
  const achievement = clamp100(pct(actualQty, m.targetQty));
  const cycleDeviation = m.referenceCycleTime
    ? ((m.avgCycleTime - m.referenceCycleTime) / m.referenceCycleTime) * 100
    : 0;

  return {
    machineId: m.id,
    expectedQty,
    actualQty,
    productionLoss,
    utilization,
    productionEfficiency,
    cavityEfficiency,
    achievement,
    cycleDeviation,
  };
}

export function buildSnapshot(machines: Machine[]): FactorySnapshot {
  const kpis = machines.map(machineKpi);
  return { machines, kpis };
}

export function lossBreakdown(m: Machine, k: MachineKpi): LossBreakdown {
  const lossBy = m.lossReason;
  const total = k.productionLoss;
  // Distribute expected theoretical loss across categories proportional to
  // non-production time + cavity loss when data supports it.
  const nonProdMin = m.idleTime + m.changeoverTime + m.trialTime;
  const lostShotsFromTime = Math.round((nonProdMin / Math.max(1, m.avgCycleTime / 60) / 60) * m.cavity.total);

  const cavityLoss = Math.max(0, m.successfulCycles * (m.cavity.total - m.cavity.active));
  const idle = Math.round((m.idleTime / Math.max(1, nonProdMin)) * lostShotsFromTime);
  const changeover = Math.round((m.changeoverTime / Math.max(1, nonProdMin)) * lostShotsFromTime);
  const trial = Math.round((m.trialTime / Math.max(1, nonProdMin)) * lostShotsFromTime);
  let breakdown = Math.round(lostShotsFromTime * 0.12 * (lossBy === 'Breakdown' ? 1 : 0.2));
  let slowCycle = Math.max(0, Math.round((m.avgCycleTime - m.referenceCycleTime) / Math.max(1, m.referenceCycleTime) * 0.4 * lostShotsFromTime));
  let other = Math.max(0, lostShotsFromTime - idle - changeover - trial - breakdown - slowCycle);
  const listed = idle + changeover + trial + breakdown + slowCycle + other;

  return {
    idle,
    changeover,
    trial,
    cavity: cavityLoss,
    breakdown,
    slowCycle,
    other: Math.max(0, other + (lostShotsFromTime - listed)),
    total,
  };
}

export function factoryLossBreakdown(snapshot: FactorySnapshot): LossBreakdown {
  const acc: LossBreakdown = {
    idle: 0,
    changeover: 0,
    trial: 0,
    cavity: 0,
    breakdown: 0,
    slowCycle: 0,
    other: 0,
    total: 0,
  };
  snapshot.machines.forEach((m, i) => {
    const lb = lossBreakdown(m, snapshot.kpis[i]);
    acc.idle += lb.idle;
    acc.changeover += lb.changeover;
    acc.trial += lb.trial;
    acc.cavity += lb.cavity;
    acc.breakdown += lb.breakdown;
    acc.slowCycle += lb.slowCycle;
    acc.other += lb.other;
    acc.total += lb.total;
  });
  return acc;
}
