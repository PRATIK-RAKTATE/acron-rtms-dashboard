import type { Machine, Mold, OperatingMode, Sku } from './types';

// Deterministic pseudo-random helpers for stable demo data
let seedState = 42;
export function rand(): number {
  seedState = (seedState * 9301 + 49297) % 233280;
  return seedState / 233280;
}
export function int(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

const MATERIALS = ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'Nylon', 'LDPE', 'POM'];
const SKU_NAMES = [
  'Bottle Cap',
  'Container Lid',
  'Handle Grip',
  'Housing Shell',
  'Tray Base',
  'Fitting Body',
  'Crate Panel',
  'Closure Ring',
  'Bracket Mount',
  'Cap Insert',
  'Spool Core',
  'Plug Body',
];

export const SKU_LIST: Sku[] = SKU_NAMES.map((name, i) => ({
  id: `SKU-${String(100 + i)}`,
  name,
  material: MATERIALS[i % MATERIALS.length],
  cavities: [4, 8, 12, 16, 24, 32][i % 6],
  targetPerHour: 90 + Math.floor(((i * 37) % 251)),
}));

interface FleetRow {
  id: string;
  name: string;
  brand: string;
  tonnage: number;
  zone: string;
  status: Machine['status'];
  mode: OperatingMode;
  moldId: string | null;
  sku: string | null;
  cavities: number;
  active: number;
  blockIdx: number[];
  refCycle: number;
  shift: Machine['shift'];
  shots: number;
  cycles: number;
  avgCycle: number;
  prodMin: number;
  idleMin: number;
  trialMin: number;
  changeMin: number;
  availMin: number;
  target: number;
  loss: Machine['lossReason'];
}

const ROWS: FleetRow[] = [
  // ---- IM1 (Injection Moulding 1) ----
  { id: 'M-001', name: 'Milicron 200 ton', brand: 'Milicron', tonnage: 200, zone: 'IM1', status: 'Running', mode: 'Production', moldId: 'MD-001', sku: 'SKU-100', cavities: 16, active: 15, blockIdx: [4], refCycle: 12.4, shift: 'A', shots: 2900, cycles: 2842, avgCycle: 12.9, prodMin: 522, idleMin: 34, trialMin: 0, changeMin: 0, availMin: 560, target: 45472, loss: 'Cavity' },
  { id: 'M-002', name: 'Milicron 320 ton', brand: 'Milicron', tonnage: 320, zone: 'IM1', status: 'Running', mode: 'Production', moldId: 'MD-002', sku: 'SKU-101', cavities: 24, active: 24, blockIdx: [], refCycle: 18.2, shift: 'A', shots: 1875, cycles: 1840, avgCycle: 19.1, prodMin: 586, idleMin: 0, trialMin: 0, changeMin: 0, availMin: 588, target: 44160, loss: 'Idle' },
  { id: 'M-003', name: 'Milicron 110 ton', brand: 'Milicron', tonnage: 110, zone: 'IM1', status: 'Trial', mode: 'Trial', moldId: 'MD-003', sku: 'SKU-102', cavities: 8, active: 8, blockIdx: [], refCycle: 24.0, shift: 'A', shots: 214, cycles: 187, avgCycle: 25.3, prodMin: 0, idleMin: 0, trialMin: 79, changeMin: 0, availMin: 80, target: 1496, loss: 'Trial' },
  { id: 'M-004', name: 'Milicron 250 ton', brand: 'Milicron', tonnage: 250, zone: 'IM1', status: 'Running', mode: 'Production', moldId: 'MD-004', sku: 'SKU-103', cavities: 16, active: 16, blockIdx: [], refCycle: 14.0, shift: 'B', shots: 2310, cycles: 2278, avgCycle: 14.6, prodMin: 540, idleMin: 21, trialMin: 0, changeMin: 16, availMin: 574, target: 36448, loss: 'Breakdown' },
  { id: 'M-005', name: 'Victor 160 ton', brand: 'Victor', tonnage: 160, zone: 'IM1', status: 'Stopped', mode: 'None', moldId: null, sku: null, cavities: 8, active: 0, blockIdx: [], refCycle: 16.0, shift: 'A', shots: 0, cycles: 0, avgCycle: 16, prodMin: 0, idleMin: 0, trialMin: 0, changeMin: 96, availMin: 300, target: 0, loss: 'Breakdown' },
  { id: 'M-006', name: 'L&T 180 ton', brand: 'L&T', tonnage: 180, zone: 'IM1', status: 'Changeover', mode: 'None', moldId: 'MD-006', sku: 'SKU-105', cavities: 12, active: 12, blockIdx: [], refCycle: 13.5, shift: 'B', shots: 840, cycles: 820, avgCycle: 15.4, prodMin: 210, idleMin: 15, trialMin: 0, changeMin: 122, availMin: 218, target: 9840, loss: 'Changeover' },
  { id: 'M-007', name: 'Milicron 160 ton', brand: 'Milicron', tonnage: 160, zone: 'IM1', status: 'Running', mode: 'Production', moldId: 'MD-007', sku: 'SKU-106', cavities: 16, active: 15, blockIdx: [9], refCycle: 11.2, shift: 'A', shots: 3180, cycles: 3124, avgCycle: 11.8, prodMin: 610, idleMin: 0, trialMin: 0, changeMin: 12, availMin: 612, target: 49984, loss: 'Cavity' },
  { id: 'M-008', name: 'Victor 90 ton', brand: 'Victor', tonnage: 90, zone: 'IM1', status: 'Running', mode: 'Production', moldId: 'MD-008', sku: 'SKU-107', cavities: 4, active: 4, blockIdx: [], refCycle: 21.0, shift: 'C', shots: 1640, cycles: 1612, avgCycle: 20.4, prodMin: 548, idleMin: 40, trialMin: 0, changeMin: 0, availMin: 560, target: 6448, loss: 'Other' },
  // ---- IM2 (Injection Moulding 2) ----
  { id: 'M-009', name: 'Milicron 150 ton', brand: 'Milicron', tonnage: 150, zone: 'IM2', status: 'Running', mode: 'Production', moldId: 'MD-009', sku: 'SKU-108', cavities: 12, active: 12, blockIdx: [], refCycle: 15.6, shift: 'A', shots: 2210, cycles: 2188, avgCycle: 16.2, prodMin: 590, idleMin: 0, trialMin: 0, changeMin: 0, availMin: 590, target: 26256, loss: 'Idle' },
  { id: 'M-010', name: 'Milicron 260 ton', brand: 'Milicron', tonnage: 260, zone: 'IM2', status: 'Trial', mode: 'Trial', moldId: 'MD-010', sku: 'SKU-109', cavities: 24, active: 22, blockIdx: [3, 17], refCycle: 20.0, shift: 'B', shots: 310, cycles: 276, avgCycle: 22.6, prodMin: 0, idleMin: 0, trialMin: 104, changeMin: 0, availMin: 105, target: 6624, loss: 'Trial' },
  { id: 'M-011', name: 'L&T 120 ton', brand: 'L&T', tonnage: 120, zone: 'IM2', status: 'Running', mode: 'Production', moldId: 'MD-011', sku: 'SKU-110', cavities: 8, active: 8, blockIdx: [], refCycle: 17.4, shift: 'B', shots: 1990, cycles: 1952, avgCycle: 18.1, prodMin: 588, idleMin: 12, trialMin: 0, changeMin: 0, availMin: 600, target: 15616, loss: 'Idle' },
  { id: 'M-012', name: 'Victor 130 ton', brand: 'Victor', tonnage: 130, zone: 'IM2', status: 'Running', mode: 'Production', moldId: 'MD-012', sku: 'SKU-111', cavities: 16, active: 16, blockIdx: [], refCycle: 12.0, shift: 'A', shots: 3010, cycles: 2968, avgCycle: 12.5, prodMin: 616, idleMin: 0, trialMin: 0, changeMin: 18, availMin: 616, target: 47488, loss: 'Other' },
  { id: 'M-013', name: 'CMP 200 ton', brand: 'CMP', tonnage: 200, zone: 'IM2', status: 'Stopped', mode: 'None', moldId: 'MD-013', sku: 'SKU-112', cavities: 12, active: 0, blockIdx: [], refCycle: 14.0, shift: 'C', shots: 780, cycles: 744, avgCycle: 18.0, prodMin: 190, idleMin: 96, trialMin: 40, changeMin: 0, availMin: 286, target: 0, loss: 'Breakdown' },
  { id: 'M-014', name: 'Vaibhav 80 ton', brand: 'Vaibhav', tonnage: 80, zone: 'IM2', status: 'Idle', mode: 'None', moldId: 'MD-014', sku: null, cavities: 8, active: 8, blockIdx: [], refCycle: 22.0, shift: 'B', shots: 0, cycles: 0, avgCycle: 22, prodMin: 0, idleMin: 402, trialMin: 0, changeMin: 0, availMin: 402, target: 0, loss: 'Idle' },
  { id: 'M-015', name: 'Milicron 450 ton', brand: 'Milicron', tonnage: 450, zone: 'IM2', status: 'Running', mode: 'Production', moldId: 'MD-015', sku: 'SKU-113', cavities: 32, active: 30, blockIdx: [14, 27], refCycle: 22.0, shift: 'A', shots: 1740, cycles: 1708, avgCycle: 23.4, prodMin: 660, idleMin: 0, trialMin: 0, changeMin: 14, availMin: 674, target: 54656, loss: 'Cavity' },
  // ---- BM1 (Blow Moulding 1) ----
  { id: 'M-016', name: 'Vaibhav BM 1', brand: 'Vaibhav', tonnage: 60, zone: 'BM1', status: 'Running', mode: 'Production', moldId: 'MD-016', sku: 'SKU-114', cavities: 8, active: 8, blockIdx: [], refCycle: 9.5, shift: 'A', shots: 3980, cycles: 3922, avgCycle: 10.0, prodMin: 645, idleMin: 0, trialMin: 0, changeMin: 0, availMin: 645, target: 31376, loss: 'Other' },
  { id: 'M-017', name: 'Vaibhav BM 2', brand: 'Vaibhav', tonnage: 60, zone: 'BM1', status: 'Running', mode: 'Production', moldId: 'MD-017', sku: 'SKU-115', cavities: 8, active: 7, blockIdx: [5], refCycle: 9.8, shift: 'B', shots: 3520, cycles: 3466, avgCycle: 10.6, prodMin: 608, idleMin: 30, trialMin: 0, changeMin: 0, availMin: 638, target: 27728, loss: 'Cavity' },
  { id: 'M-018', name: 'Vaibhav BM 3', brand: 'Vaibhav', tonnage: 60, zone: 'BM1', status: 'Idle', mode: 'None', moldId: null, sku: null, cavities: 8, active: 8, blockIdx: [], refCycle: 10.0, shift: 'C', shots: 0, cycles: 0, avgCycle: 10, prodMin: 0, idleMin: 430, trialMin: 0, changeMin: 0, availMin: 430, target: 0, loss: 'Idle' },
  // ---- BM2 (Blow Moulding 2) ----
  { id: 'M-019', name: 'CMP Blow 1', brand: 'CMP', tonnage: 90, zone: 'BM2', status: 'Running', mode: 'Production', moldId: 'MD-019', sku: 'SKU-116', cavities: 8, active: 8, blockIdx: [], refCycle: 11.0, shift: 'A', shots: 2890, cycles: 2846, avgCycle: 11.6, prodMin: 548, idleMin: 20, trialMin: 0, changeMin: 0, availMin: 568, target: 22768, loss: 'Idle' },
  { id: 'M-020', name: 'Milicron 200 im15', brand: 'Milicron', tonnage: 200, zone: 'BM2', status: 'Running', mode: 'Production', moldId: 'MD-020', sku: 'SKU-117', cavities: 16, active: 15, blockIdx: [11], refCycle: 13.2, shift: 'B', shots: 2560, cycles: 2510, avgCycle: 13.9, prodMin: 578, idleMin: 14, trialMin: 0, changeMin: 0, availMin: 592, target: 40160, loss: 'Cavity' },
  { id: 'M-021', name: 'Milicron 200 im14', brand: 'Milicron', tonnage: 200, zone: 'BM2', status: 'Trial', mode: 'Trial', moldId: 'MD-021', sku: 'SKU-118', cavities: 12, active: 12, blockIdx: [], refCycle: 16.5, shift: 'C', shots: 244, cycles: 218, avgCycle: 17.2, prodMin: 0, idleMin: 0, trialMin: 63, changeMin: 0, availMin: 64, target: 2616, loss: 'Trial' },
  { id: 'M-022', name: 'Victor BM 1', brand: 'Victor', tonnage: 140, zone: 'BM2', status: 'Running', mode: 'Production', moldId: 'MD-022', sku: 'SKU-119', cavities: 16, active: 16, blockIdx: [], refCycle: 15.0, shift: 'A', shots: 2410, cycles: 2374, avgCycle: 15.7, prodMin: 616, idleMin: 0, trialMin: 0, changeMin: 22, availMin: 640, target: 37984, loss: 'Changeover' },
  { id: 'M-023', name: 'Victor BM 2', brand: 'Victor', tonnage: 140, zone: 'BM2', status: 'Idle', mode: 'None', moldId: 'MD-023', sku: null, cavities: 12, active: 12, blockIdx: [], refCycle: 15.0, shift: 'B', shots: 0, cycles: 0, avgCycle: 15, prodMin: 0, idleMin: 388, trialMin: 0, changeMin: 0, availMin: 388, target: 0, loss: 'Idle' },
  { id: 'M-024', name: 'Milicron 200 im16', brand: 'Milicron', tonnage: 200, zone: 'BM2', status: 'Changeover', mode: 'None', moldId: 'MD-024', sku: 'SKU-120', cavities: 16, active: 16, blockIdx: [], refCycle: 13.0, shift: 'C', shots: 1220, cycles: 1204, avgCycle: 14.1, prodMin: 260, idleMin: 12, trialMin: 0, changeMin: 148, availMin: 272, target: 19264, loss: 'Changeover' },
];



export const MACHINES: Machine[] = ROWS.map(
  (r): Machine => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    tonnage: r.tonnage,
    zone: r.zone,
    status: r.status,
    mode: r.mode,
    moldId: r.moldId,
    sku: r.sku,
    referenceCycleTime: r.refCycle,
    cavity: {
      total: r.cavities,
      active: r.active,
      minThreshold: 12,
      maxThreshold: 88,
      mapped: r.active > 0,
      blocked: r.blockIdx,
    },
    shift: r.shift,
    shots: r.shots,
    successfulCycles: r.cycles,
    avgCycleTime: r.avgCycle,
    productionTime: r.prodMin,
    idleTime: r.idleMin,
    trialTime: r.trialMin,
    changeoverTime: r.changeMin,
    availableTime: r.availMin,
    targetQty: r.target,
    lossReason: r.loss,
    lastCycleAt: `${String(int(9, 17)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`,
  })
);


function buildHistory(
  cavities: number,
  config: Array<[machineId: string, machineName: string, installed: string, removed: string | null, sku: string, mode: OperatingMode, cycles: number, durationMin: number]>
): Mold['history'] {
  return config.map((c) => {
    const qtyMult = c[5] === 'Trial' ? cavities * 0.75 : cavities;
    return {
      machineId: c[0],
      machineName: c[1],
      installedAt: c[2],
      removedAt: c[3],
      sku: c[4],
      mode: c[5],
      cycles: c[6],
      qty: Math.round(c[6] * qtyMult),
      durationMin: c[7],
    };
  });
}


export const MOLD_LIST: Mold[] = MACHINES.filter((m) => m.moldId).map((m) => {
  const cavities = m.cavity.total;
  const status: Mold['status'] =
    m.status === 'Running' || m.status === 'Changeover'
      ? 'Running'
      : m.status === 'Trial'
        ? 'Trial'
        : m.status === 'Stopped'
          ? 'Maintenance'
          : 'Idle';
  const id = m.moldId as string;
  return {
    id,
    rfid: `RFID-${id.slice(3)}-${String(Math.floor(rand() * 9999)).padStart(4, '0')}`,
    material: MATERIALS[int(0, MATERIALS.length - 1)],
    cavities,
    status,
    machineId: m.id,
    sku: m.sku,
    mode: m.mode,
    installedAt: `${String(int(6, 11)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`,
    createdAt: `10-${String(int(1, 12)).padStart(2, '0')}-2025`,
    cycles: m.shots,
    totalQty: Math.round(m.shots * cavities),
    history: buildHistory(cavities, [
      ['M-0' + int(0, 4), 'Milacron 110x', '08-Aug-2026 06:20', '08-Aug-2026 16:40', m.sku as string, 'Production', Math.round(m.shots * 0.7), 620],
      ['M-0' + int(5, 9), 'Second Press', '09-Aug-2026 08:05', '09-Aug-2026 12:10', m.sku as string, 'Trial', Math.round(m.shots * 0.15), 245],
      [m.id, m.name, '09-Aug-2026 10:42', null, m.sku as string, m.mode, Math.round(m.shots * 0.9), 480],
    ]),
  };
});

/** Extra molds sitting in the mould store (no machine assigned). */
export const STORE_MOLDS: Mold[] = Array.from({ length: 24 }, (_, i) => {
  const id = `MD-${String(300 + i)}`;
  return {
    id,
    rfid: `RFID-${id.slice(3)}-${String(Math.floor(rand() * 9999)).padStart(4, '0')}`,
    material: MATERIALS[int(0, MATERIALS.length - 1)],
    cavities: [4, 8, 12, 16, 24, 32][i % 6],
    status: 'Available' as const,
    machineId: null,
    sku: null,
    mode: 'None' as const,
    installedAt: null,
    createdAt: `12-${String(int(1, 12)).padStart(2, '0')}-2024`,
    cycles: int(0, 4000),
    totalQty: int(0, 60000),
    history: [],
  };
});

export const ALL_MOLDS: Mold[] = [...MOLD_LIST, ...STORE_MOLDS];

