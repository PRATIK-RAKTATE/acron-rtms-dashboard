import { useEffect, useMemo, useState } from 'react';
import type { FactorySnapshot, MachineKpi } from './types';
import { MACHINES } from './data';
import { buildSnapshot, machineKpi } from './kpis';

/**
 * Simulates the real-time database feed. Every interval tick the run-state of
 * each active machine advances (cycles, quantity, production time), matching
 * how a live RTMS feed would keep updating KPI values.
 */
export function advanceMachines(elapsedMin: number): typeof MACHINES {
  return MACHINES.map((m) => {
    if (m.status !== 'Running' && m.status !== 'Trial') {
      return { ...m };
    }
    const isProd = m.status === 'Running';
    const liveMin = isProd ? elapsedMin : m.trialTime;
    const cpm = m.avgCycleTime ? 60 / m.avgCycleTime : 0;
    // Live cycles increment at machine pace (scaled for visual feedback).
    const liveCycles = m.successfulCycles + Math.floor(elapsedMin * cpm * 1.6);
    const liveShots = m.shots + Math.floor(elapsedMin * cpm * 1.8);
    return {
      ...m,
      successfulCycles: liveCycles,
      shots: Math.max(liveShots, liveCycles),
      productionTime: isProd ? m.productionTime + elapsedMin : m.productionTime,
      trialTime: isProd ? m.trialTime : Math.max(m.trialTime, liveMin),
      lastCycleAt: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
    };
  });
}

export interface RtmsState {
  snapshot: FactorySnapshot;
  kpiIndex: Record<string, MachineKpi>;
  elapsedMin: number;
  now: Date;
}

export function useRtms(intervalMs = 2500): RtmsState {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const elapsedMin = 12 + tick * 0.22;

  const snapshot = useMemo<FactorySnapshot>(() => {
    const machines = advanceMachines(elapsedMin);
    return buildSnapshot(machines);
  }, [elapsedMin]);

  const kpiIndex = useMemo(() => {
    const map: Record<string, ReturnType<typeof machineKpi>> = {};
    snapshot.machines.forEach((m) => {
      map[m.id] = machineKpi(m);
    });
    return map;
  }, [snapshot]);

  return { snapshot, kpiIndex, elapsedMin, now };
}
