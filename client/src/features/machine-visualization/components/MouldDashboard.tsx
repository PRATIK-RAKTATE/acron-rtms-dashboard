import React, { useState } from 'react';
import {
  X,
  Layers,
  Package,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Grid3x3,
  Box,
  Search,
  Warehouse,
  Activity,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import { MACHINE_LIST } from '../data/zoneData';

interface MouldDashboardProps {
  onClose: () => void;
}

// Seeded deterministic random for stable fake mould numbers
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getMouldNumber(seed: number): string {
  const n = Math.floor(seededRandom(seed) * (999 - 103 + 1)) + 103;
  return String(n);
}

function getCavities(seed: number): number {
  const opts = [4, 8, 12, 16, 24, 32];
  return opts[Math.floor(seededRandom(seed + 99) * opts.length)];
}

type MachineStatus = 'Running' | 'Idle' | 'Maintenance';

function getStatus(seed: number): MachineStatus {
  const v = seededRandom(seed + 55);
  if (v < 0.6) return 'Running';
  if (v < 0.85) return 'Idle';
  return 'Maintenance';
}

// Enrich machine list with demo data
const MACHINES_WITH_MOULDS = MACHINE_LIST.map((m, i) => ({
  ...m,
  mouldNumber: m.mouldNumber ?? getMouldNumber(i * 7 + 13),
  cavity: m.cavity ?? getCavities(i * 3 + 7),
  status: (m.isGlowingGreen ? 'Running' : getStatus(i * 11 + 5)) as MachineStatus,
  mouldMaterial: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][Math.floor(seededRandom(i * 4 + 2) * 6)],
  cycleTime: Math.floor(seededRandom(i * 6 + 9) * 45 + 15),
}));

// Mould store: all unique mould numbers (103–999 range), with some marked "in machine"
const IN_MACHINE_MOULD_NUMBERS = new Set(MACHINES_WITH_MOULDS.map(m => m.mouldNumber));

const MOULD_STORE_LIST = Array.from({ length: 40 }, (_, i) => {
  const num = String(getMouldNumber(i * 13 + 1001) ? Math.floor(seededRandom(i * 17 + 300) * (999 - 103 + 1)) + 103 : 103);
  const inMachine = IN_MACHINE_MOULD_NUMBERS.has(num);
  return {
    id: `store-mould-${i}`,
    mouldNumber: num,
    cavities: getCavities(i * 5 + 200),
    material: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][Math.floor(seededRandom(i * 8 + 400) * 6)],
    weight: Math.floor(seededRandom(i * 9 + 500) * 800 + 200),
    lastUsed: Math.floor(seededRandom(i * 12 + 600) * 30 + 1),
    location: `RACK-${String.fromCharCode(65 + Math.floor(seededRandom(i * 3 + 700) * 6))}-${Math.floor(seededRandom(i * 7 + 800) * 12 + 1)}`,
    inMachine,
    assignedTo: inMachine ? MACHINES_WITH_MOULDS.find(m => m.mouldNumber === num)?.name ?? null : null,
  };
});

// Also add currently in-machine moulds to store so store is comprehensive
const ALL_STORE = [
  ...MOULD_STORE_LIST,
  ...MACHINES_WITH_MOULDS.map((m, i) => ({
    id: `machine-mould-${i}`,
    mouldNumber: m.mouldNumber!,
    cavities: m.cavity!,
    material: m.mouldMaterial,
    weight: Math.floor(seededRandom(i * 19 + 900) * 800 + 200),
    lastUsed: 0,
    location: `${m.zone.toUpperCase()} / ${m.side.toUpperCase()}`,
    inMachine: true,
    assignedTo: m.name,
  })),
].sort((a, b) => parseInt(a.mouldNumber) - parseInt(b.mouldNumber));

const STATUS_COLOR: Record<MachineStatus, string> = {
  Running: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
  Idle: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  Maintenance: 'text-red-400 bg-red-500/15 border-red-500/40',
};

const STATUS_DOT: Record<MachineStatus, string> = {
  Running: 'bg-emerald-400 animate-pulse',
  Idle: 'bg-amber-400',
  Maintenance: 'bg-red-400',
};

function getZoneLabel(zone: string): string {
  if (zone.toLowerCase().includes('im1')) return 'IM1';
  if (zone.toLowerCase().includes('im2')) return 'IM2';
  if (zone.toLowerCase().includes('blow moulding 2')) return 'BM2';
  if (zone.toLowerCase().includes('blow moulding 1')) return 'BM1';
  return zone.slice(0, 4).toUpperCase();
}

export const MouldDashboard: React.FC<MouldDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'machines' | 'store'>('machines');
  const [searchMachines, setSearchMachines] = useState('');
  const [searchStore, setSearchStore] = useState('');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterStoreStatus, setFilterStoreStatus] = useState<string>('ALL');

  const zones = ['ALL', 'IM1', 'IM2', 'BM2', 'BM1'];

  const filteredMachines = MACHINES_WITH_MOULDS.filter(m => {
    const matchSearch =
      searchMachines === '' ||
      m.name.toLowerCase().includes(searchMachines.toLowerCase()) ||
      m.mouldNumber!.includes(searchMachines);
    const matchZone = filterZone === 'ALL' || getZoneLabel(m.zone) === filterZone;
    const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchSearch && matchZone && matchStatus;
  });

  const filteredStore = ALL_STORE.filter(s => {
    const matchSearch =
      searchStore === '' ||
      s.mouldNumber.includes(searchStore) ||
      (s.assignedTo ?? '').toLowerCase().includes(searchStore.toLowerCase()) ||
      s.location.toLowerCase().includes(searchStore.toLowerCase());
    const matchStatus =
      filterStoreStatus === 'ALL' ||
      (filterStoreStatus === 'IN_MACHINE' && s.inMachine) ||
      (filterStoreStatus === 'AVAILABLE' && !s.inMachine);
    return matchSearch && matchStatus;
  });

  const totalRunning = MACHINES_WITH_MOULDS.filter(m => m.status === 'Running').length;
  const totalIdle = MACHINES_WITH_MOULDS.filter(m => m.status === 'Idle').length;
  const totalMaint = MACHINES_WITH_MOULDS.filter(m => m.status === 'Maintenance').length;
  const totalInMachine = ALL_STORE.filter(s => s.inMachine).length;
  const totalAvailable = ALL_STORE.filter(s => !s.inMachine).length;

  return (
    <div className="fixed inset-0 z-[60] bg-[#080B10] text-[#E8ECF1] font-['IBM_Plex_Sans'] flex flex-col overflow-hidden select-none">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0C0F18]/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <Layers className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Space_Grotesk'] text-white tracking-tight">
              RTMS — MOULD TRACKING DASHBOARD
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              REAL-TIME MOULD TRACKING SYSTEM · {MACHINES_WITH_MOULDS.length} MACHINES · {ALL_STORE.length} MOULDS REGISTERED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>RFID LIVE</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Strip */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-[#0A0D14] shrink-0 overflow-x-auto">
        {[
          { label: 'Total Machines', value: MACHINES_WITH_MOULDS.length, color: 'text-sky-400', icon: <Cpu className="w-4 h-4" /> },
          { label: 'Running', value: totalRunning, color: 'text-emerald-400', icon: <Activity className="w-4 h-4" /> },
          { label: 'Idle', value: totalIdle, color: 'text-amber-400', icon: <Clock className="w-4 h-4" /> },
          { label: 'Maintenance', value: totalMaint, color: 'text-red-400', icon: <AlertTriangle className="w-4 h-4" /> },
          { label: 'Moulds in Machine', value: totalInMachine, color: 'text-teal-400', icon: <ArrowRightLeft className="w-4 h-4" /> },
          { label: 'Available in Store', value: totalAvailable, color: 'text-violet-400', icon: <Warehouse className="w-4 h-4" /> },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 bg-white/3 border border-white/5 rounded-xl px-4 py-2.5 shrink-0"
          >
            <div className={`${s.color} opacity-80`}>{s.icon}</div>
            <div>
              <div className={`text-xl font-bold font-['Space_Grotesk'] ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-0 px-6 pt-4 pb-0 shrink-0">
        <button
          onClick={() => setActiveTab('machines')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-['Space_Grotesk'] font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'machines'
              ? 'bg-sky-500/15 border-sky-400 text-sky-300'
              : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          ALL MACHINES
          <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
            {MACHINES_WITH_MOULDS.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-['Space_Grotesk'] font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'store'
              ? 'bg-violet-500/15 border-violet-400 text-violet-300'
              : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          MOULD STORE
          <span className="bg-violet-500/20 text-violet-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
            {ALL_STORE.length}
          </span>
        </button>
        <div className="flex-1 border-b-2 border-white/5" />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ─── ALL MACHINES TAB ─────────────────────────────────────────── */}
        {activeTab === 'machines' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0D14] border-b border-white/5 shrink-0 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={searchMachines}
                  onChange={e => setSearchMachines(e.target.value)}
                  placeholder="Search machine or mould #..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-sky-500/50 focus:bg-sky-500/5 transition-all font-mono"
                />
              </div>
              <div className="flex items-center gap-2">
                {zones.map(z => (
                  <button
                    key={z}
                    onClick={() => setFilterZone(z)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                      filterZone === z
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-white/3 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {(['ALL', 'Running', 'Idle', 'Maintenance'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                      filterStatus === s
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/3 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Machine Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredMachines.map((m) => (
                  <div
                    key={m.id}
                    className="group bg-[#10141D] border border-white/8 rounded-2xl p-4 flex flex-col gap-3 hover:border-sky-500/40 hover:bg-sky-500/5 transition-all relative overflow-hidden"
                  >
                    {/* Zone badge */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded">
                        {getZoneLabel(m.zone)} · {m.side.toUpperCase()}
                      </span>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[m.status]}`} />
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${STATUS_COLOR[m.status]}`}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Machine name */}
                    <div>
                      <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white leading-tight pr-16">
                        {m.name}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{m.subTitle}</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/5" />

                    {/* Mould Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-300 font-['Space_Grotesk']">
                          MOULD #{m.mouldNumber}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {m.cavity} CAV · {m.mouldMaterial} · {m.cycleTime}s CYCLE
                        </div>
                      </div>
                    </div>

                    {/* RFID Detected chip */}
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1">
                      <Radio className="w-3 h-3 shrink-0 animate-pulse" />
                      <span>RFID DETECTED · RTMS SYNCED</span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMachines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
                  <Grid3x3 className="w-12 h-12 mb-3 opacity-40" />
                  <p className="font-mono font-bold text-sm">No machines match your filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── MOULD STORE TAB ──────────────────────────────────────────── */}
        {activeTab === 'store' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0D14] border-b border-white/5 shrink-0 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  value={searchStore}
                  onChange={e => setSearchStore(e.target.value)}
                  placeholder="Search mould # or machine..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all font-mono"
                />
              </div>
              {(['ALL', 'IN_MACHINE', 'AVAILABLE'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStoreStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                    filterStoreStatus === s
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'bg-white/3 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'ALL' : s === 'IN_MACHINE' ? 'IN MACHINE' : 'AVAILABLE'}
                  <span className="ml-1.5 opacity-70">
                    ({s === 'ALL' ? ALL_STORE.length : s === 'IN_MACHINE' ? totalInMachine : totalAvailable})
                  </span>
                </button>
              ))}
            </div>

            {/* Store table */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[#0C0F18] border border-white/8 rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_80px_60px_70px_90px_80px_1fr_110px] gap-0 border-b border-white/8 px-4 py-2.5 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Mould #</span>
                  <span>Cavities</span>
                  <span>Material</span>
                  <span>Weight</span>
                  <span>Location</span>
                  <span>Last Used</span>
                  <span>Assigned To</span>
                  <span className="text-right">Status</span>
                </div>

                {/* Rows */}
                {filteredStore.map((s, i) => (
                  <div
                    key={s.id}
                    className={`grid grid-cols-[1fr_80px_60px_70px_90px_80px_1fr_110px] gap-0 px-4 py-3 border-b border-white/5 items-center transition-colors hover:bg-white/3 ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'
                    }`}
                  >
                    {/* Mould # */}
                    <div className="flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-bold text-sm text-amber-300 font-['Space_Grotesk']">
                        #{s.mouldNumber}
                      </span>
                    </div>

                    {/* Cavities */}
                    <div className="flex items-center gap-1 text-xs font-mono text-zinc-300">
                      <Grid3x3 className="w-3 h-3 text-zinc-500" />
                      {s.cavities}
                    </div>

                    {/* Material */}
                    <span className="text-xs font-mono text-teal-300">{s.material}</span>

                    {/* Weight */}
                    <span className="text-xs font-mono text-zinc-300">{s.weight}kg</span>

                    {/* Location */}
                    <span className="text-xs font-mono text-sky-300">{s.location}</span>

                    {/* Last Used */}
                    <span className="text-xs font-mono text-zinc-400">
                      {s.inMachine ? '— Active —' : `${s.lastUsed}d ago`}
                    </span>

                    {/* Assigned To */}
                    <div className="text-xs font-mono text-zinc-300 truncate pr-4">
                      {s.assignedTo ? (
                        <span className="flex items-center gap-1 text-emerald-300">
                          <ChevronRight className="w-3 h-3 shrink-0" />
                          {s.assignedTo}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex justify-end">
                      {s.inMachine ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          IN MACHINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-violet-500/15 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filteredStore.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <Package className="w-10 h-10 mb-3 opacity-40" />
                    <p className="font-mono font-bold text-sm">No moulds found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
