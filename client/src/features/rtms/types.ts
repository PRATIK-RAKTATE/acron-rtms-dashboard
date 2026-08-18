export type MachineStatus = 'Running' | 'Idle' | 'Trial' | 'Stopped' | 'Changeover';
export type OperatingMode = 'Production' | 'Trial' | 'None';
export type ShiftId = 'A' | 'B' | 'C';
export type TimeRange = 'shift' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';
export type AlertPriority = 'Critical' | 'Warning' | 'Information';
export type AlertType =
  | 'Cavity'
  | 'Trial'
  | 'MoldChange'
  | 'MoldInstall'
  | 'Breakdown'
  | 'Stoppage'
  | 'Utilization'
  | 'Achievement';

export interface CavityConfig {
  total: number;
  active: number;
  minThreshold: number;
  maxThreshold: number;
  mapped: boolean;
  blocked: number[];
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  tonnage: number;
  zone: string;
  status: MachineStatus;
  mode: OperatingMode;
  moldId: string | null;
  sku: string | null;
  referenceCycleTime: number;
  cavity: CavityConfig;
  shift: ShiftId;
  shots: number;
  successfulCycles: number;
  avgCycleTime: number;
  productionTime: number; // minutes today
  idleTime: number;
  trialTime: number;
  changeoverTime: number;
  availableTime: number;
  targetQty: number;
  lossReason: LossCategory;
  lastCycleAt: string;
}

export type LossCategory =
  | 'Idle'
  | 'Changeover'
  | 'Trial'
  | 'Cavity'
  | 'Breakdown'
  | 'SlowCycle'
  | 'Other';

export type MoldStatus = 'Running' | 'Idle' | 'Trial' | 'Available' | 'Maintenance';

export interface MoldInstallment {
  machineId: string;
  machineName: string;
  installedAt: string;
  removedAt: string | null;
  sku: string;
  mode: OperatingMode;
  cycles: number;
  qty: number;
  durationMin: number;
}

export interface Mold {
  id: string;
  rfid: string;
  material: string;
  cavities: number;
  status: MoldStatus;
  machineId: string | null;
  sku: string | null;
  mode: OperatingMode;
  installedAt: string | null;
  createdAt: string;
  cycles: number;
  totalQty: number;
  history: MoldInstallment[];
}

export interface TimelineEvent {
  id: string;
  machineId: string;
  start: string;
  end: string | null;
  type: MachineStatus | 'Production';
  moldId: string | null;
  mode: OperatingMode;
  durationMin: number;
}

export interface AlertItem {
  id: string;
  priority: AlertPriority;
  type: AlertType;
  machineId: string;
  moldId: string | null;
  message: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface Sku {
  id: string;
  name: string;
  material: string;
  cavities: number;
  targetPerHour: number;
}

export interface LossBreakdown {
  idle: number;
  changeover: number;
  trial: number;
  cavity: number;
  breakdown: number;
  slowCycle: number;
  other: number;
  total: number;
}

export interface MachineKpi {
  machineId: string;
  expectedQty: number;
  actualQty: number;
  productionLoss: number;
  utilization: number;
  productionEfficiency: number;
  cavityEfficiency: number;
  achievement: number;
  cycleDeviation: number;
}

export interface FactorySnapshot {
  machines: Machine[];
  kpis: MachineKpi[];
}
