import { createContext, useContext } from 'react';
import type { FactorySnapshot, Machine, MachineKpi, Mold } from './types';
import type { AlertItem, TimelineEvent } from './types';

export type PageId =
  | 'dashboard'
  | 'floor'
  | 'machines'
  | 'machine-detail'
  | 'molds'
  | 'mold-detail'
  | 'production'
  | 'cavity'
  | 'trial'
  | 'alerts'
  | 'reports';

export interface RtmsContextValue {
  snapshot: FactorySnapshot;
  kpiIndex: Record<string, MachineKpi>;
  now: Date;
  alerts: AlertItem[];
  page: PageId;
  selectedMachineId: string | null;
  selectedMoldId: string | null;
  go: (page: PageId) => void;
  goMachine: (id: string) => void;
  goMold: (id: string) => void;
  machineOf: (id: string | null) => Machine | undefined;
  moldOf: (id: string | null) => Mold | undefined;
  timelineOf: (machineId: string) => TimelineEvent[];
}

const RtmsContext = createContext<RtmsContextValue | null>(null);

export function useRtmsContext(): RtmsContextValue {
  const v = useContext(RtmsContext);
  if (!v) throw new Error('useRtmsContext must be used within RtmsProvider');
  return v;
}

export const RtmsProvider = RtmsContext.Provider;
