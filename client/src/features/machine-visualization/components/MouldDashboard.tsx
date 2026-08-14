import React, { useState } from 'react';
import {
  X,
  Layers,
  Package,
  Radio,
  CheckCircle2,
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

function getStoreMouldNumber(seed: number): string {
  // Generate numbers from 200 to 999 range (non-starting with 1)
  const firstDigit = Math.floor(seededRandom(seed) * 8) + 2; // 2 to 9
  const secondDigit = Math.floor(seededRandom(seed + 5) * 10);
  const thirdDigit = Math.floor(seededRandom(seed + 10) * 10);
  return `${firstDigit}${secondDigit}${thirdDigit}`;
}

// Enrich machine list with demo data - all machine moulds must start with 1 (100 to 199 range)
const MACHINES_WITH_MOULDS = MACHINE_LIST.map((m, i) => {
  const numVal = 100 + (i * 7 + 13) % 100;
  return {
    ...m,
    mouldNumber: String(numVal),
    cavity: m.cavity ?? getCavities(i * 3 + 7),
    status: (m.isGlowingGreen ? 'Running' : getStatus(i * 11 + 5)) as MachineStatus,
    mouldMaterial: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][Math.floor(seededRandom(i * 4 + 2) * 6)],
    cycleTime: Math.floor(seededRandom(i * 6 + 9) * 45 + 15),
  };
});

// Mould store: all unique mould numbers in storage start with 2-9 (200-999 range)
const MOULD_STORE_LIST = Array.from({ length: 40 }, (_, i) => {
  const num = getStoreMouldNumber(i * 13 + 1001);
  return {
    id: `store-mould-${i}`,
    mouldNumber: num,
    cavities: getCavities(i * 5 + 200),
    material: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][Math.floor(seededRandom(i * 8 + 400) * 6)],
    weight: Math.floor(seededRandom(i * 9 + 500) * 800 + 200),
    lastUsed: Math.floor(seededRandom(i * 12 + 600) * 30 + 1),
    location: `RACK-${String.fromCharCode(65 + Math.floor(seededRandom(i * 3 + 700) * 6))}-${Math.floor(seededRandom(i * 7 + 800) * 12 + 1)}`,
    inMachine: false,
    assignedTo: null,
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

  const TOTAL_MOULDS_DISPLAY = 562;

  const getSearchMouldLocation = (searchVal: string) => {
    const clean = searchVal.replace(/^#/, '').trim();
    if (/^\d{3}$/.test(clean)) {
      const found = ALL_STORE.find(s => s.mouldNumber === clean);
      if (found) {
        return found;
      }
      const numVal = parseInt(clean);
      if (numVal >= 200 && numVal <= 999) {
        const seed = numVal;
        return {
          id: `dynamic-store-mould-${clean}`,
          mouldNumber: clean,
          cavities: getCavities(seed),
          material: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][seed % 6],
          weight: 200 + (seed * 17) % 800,
          location: `RACK-${String.fromCharCode(65 + (seed % 6))}-${(seed % 12) + 1}`,
          inMachine: false,
          assignedTo: null
        };
      }
      if (numVal >= 100 && numVal <= 199) {
        const seed = numVal;
        const targetMachine = MACHINES_WITH_MOULDS[seed % MACHINES_WITH_MOULDS.length];
        return {
          id: `dynamic-machine-mould-${clean}`,
          mouldNumber: clean,
          cavities: getCavities(seed),
          material: ['PP', 'HDPE', 'ABS', 'PC', 'PET', 'LDPE'][seed % 6],
          weight: 200 + (seed * 17) % 800,
          location: `${targetMachine.zone.toUpperCase()} / ${targetMachine.side.toUpperCase()}`,
          inMachine: true,
          assignedTo: targetMachine.name
        };
      }
    }
    return null;
  };

  const zones = ['ALL', 'IM1', 'IM2', 'BM2', 'BM1'];

  const filteredMachines = MACHINES_WITH_MOULDS.filter(m => {
    const query = searchMachines.toLowerCase().trim();
    const cleanQuery = query.replace(/^#/, '');
    const matchSearch =
      query === '' ||
      m.name.toLowerCase().includes(query) ||
      m.mouldNumber!.toLowerCase().includes(cleanQuery) ||
      (m.subTitle ?? '').toLowerCase().includes(query) ||
      m.zone.toLowerCase().includes(query) ||
      m.status.toLowerCase().includes(query) ||
      m.mouldMaterial.toLowerCase().includes(query) ||
      String(m.cavity).includes(query);
    const matchZone = filterZone === 'ALL' || getZoneLabel(m.zone) === filterZone;
    const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchSearch && matchZone && matchStatus;
  });

  const filteredStore = ALL_STORE.filter(s => {
    const query = searchStore.toLowerCase().trim();
    const cleanQuery = query.replace(/^#/, '');
    const matchSearch =
      query === '' ||
      s.mouldNumber.toLowerCase().includes(cleanQuery) ||
      (s.assignedTo ?? '').toLowerCase().includes(query) ||
      s.location.toLowerCase().includes(query) ||
      s.material.toLowerCase().includes(query) ||
      String(s.cavities).includes(query);
    const matchStatus =
      filterStoreStatus === 'ALL' ||
      (filterStoreStatus === 'IN_MACHINE' && s.inMachine) ||
      (filterStoreStatus === 'AVAILABLE' && !s.inMachine);
    return matchSearch && matchStatus;
  });

  const totalRunning = MACHINES_WITH_MOULDS.filter(m => m.status === 'Running').length;
  const totalInMachine = ALL_STORE.filter(s => s.inMachine).length;

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
              REAL-TIME MOULD TRACKING SYSTEM · {MACHINES_WITH_MOULDS.length} MACHINES · {TOTAL_MOULDS_DISPLAY} MOULDS REGISTERED
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
          { label: 'Mould Connected', value: totalInMachine, color: 'text-amber-400', icon: <ArrowRightLeft className="w-4 h-4" /> },
          { label: 'Total Moulds', value: TOTAL_MOULDS_DISPLAY, color: 'text-violet-400', icon: <Layers className="w-4 h-4" /> },
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
            {TOTAL_MOULDS_DISPLAY}
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

                    {/* Machine Diagram / Animation for IM1, IM2, BM1, BM2 zones */}
                    {['IM1', 'IM2', 'BM1', 'BM2'].includes(getZoneLabel(m.zone)) && (
                      <div className="w-full h-32 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 select-none overflow-hidden relative">
                        {m.name.toLowerCase().includes('milicron') ? (
                          <svg viewBox="0 0 1200 480" className="w-full h-full object-contain">
                            <defs>
                              <linearGradient id={`machineBodyGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ECEEF0" />
                                <stop offset="100%" stopColor="#C8CCD0" />
                              </linearGradient>
                              <linearGradient id={`darkBaseGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2F3642" />
                                <stop offset="100%" stopColor="#1A1E26" />
                              </linearGradient>
                              <linearGradient id={`steelGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6B7480" />
                                <stop offset="55%" stopColor="#4A5260" />
                                <stop offset="100%" stopColor="#2B313C" />
                              </linearGradient>
                              <linearGradient id={`redAccentGradMini-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#E61C24" />
                                <stop offset="100%" stopColor="#B30E14" />
                              </linearGradient>
                              <style>{`
                                @keyframes mcPlatenMove-${m.id} {
                                  0%, 10% { transform: translateX(-90px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(-90px); }
                                }
                                @keyframes mcFlowGlow-${m.id} {
                                  0%, 35% { opacity: 0; }
                                  40%, 60% { opacity: 1; }
                                  65%, 100% { opacity: 0; }
                                }
                                @keyframes mcPartEject-${m.id} {
                                  0%, 65% { opacity: 0; transform: translate(0, 0) scale(1); }
                                  70% { opacity: 1; transform: translate(0, 0) scale(1); }
                                  85% { opacity: 1; transform: translate(0, 60px) scale(0.8); }
                                  90%, 100% { opacity: 0; transform: translate(0, 60px) scale(0.8); }
                                }
                                .mc-moving-platen-${m.id} {
                                  animation: mcPlatenMove-${m.id} 6s infinite ease-in-out;
                                }
                                .mc-flow-path-${m.id} {
                                  animation: mcFlowGlow-${m.id} 6s infinite ease-in-out;
                                }
                                .mc-ejected-part-${m.id} {
                                  animation: mcPartEject-${m.id} 6s infinite ease-in-out;
                                }
                              `}</style>
                            </defs>

                            {/* Stand Base */}
                            <rect x="110" y="420" width="980" height="25" rx="3" fill={`url(#darkBaseGradMini-${m.id})`} stroke="#14171D" strokeWidth="1.5" />
                            <rect x="120" y="290" width="370" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />
                            <rect x="520" y="290" width="560" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />

                            {/* Safety Door window */}
                            <rect x="270" y="112" width="230" height="170" rx="6" fill="#1E222A" stroke="#3A4048" strokeWidth="2" />
                            <rect x="285" y="125" width="200" height="144" rx="4" fill="#0B0D11" stroke="#2D333F" strokeWidth="2" />

                            {/* Tie Bars */}
                            <line x1="285" y1="150" x2="475" y2="150" stroke="#7A8290" strokeWidth="5" strokeLinecap="round" />
                            <line x1="285" y1="240" x2="475" y2="240" stroke="#7A8290" strokeWidth="5" strokeLinecap="round" />

                            {/* Fixed Platen */}
                            <rect x="425" y="135" width="45" height="125" rx="3" fill={`url(#steelGradMini-${m.id})`} stroke="#1A1F27" strokeWidth="1" />
                            {/* Stationary Mold Half */}
                            <rect x="395" y="145" width="30" height="100" rx="4" fill="#D97706" stroke="#78350F" strokeWidth="2" />

                            {/* Moving Platen Group (Animated) */}
                            <g className={`mc-moving-platen-${m.id}`}>
                              <rect x="380" y="135" width="45" height="125" rx="3" fill={`url(#steelGradMini-${m.id})`} stroke="#1A1F27" strokeWidth="1" />
                              {/* Movable Mold Half */}
                              <rect x="350" y="145" width="30" height="100" rx="4" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
                              <text x="365" y="200" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="Space Grotesk">#{m.mouldNumber}</text>
                            </g>

                            {/* Molten Polymer Nozzle Path (Animated) */}
                            <path className={`mc-flow-path-${m.id}`} d="M470,195 L435,195" fill="none" stroke="#FF8A3D" strokeWidth="8" strokeLinecap="round" />

                            {/* Ejected product parts (Animated) */}
                            <g className={`mc-ejected-part-${m.id}`}>
                              <rect x="385" y="150" width="20" height="80" rx="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1" />
                            </g>

                            {/* Top Red Accents */}
                            <rect x="120" y="270" width="370" height="20" rx="2" fill={`url(#redAccentGradMini-${m.id})`} />
                            <rect x="520" y="270" width="560" height="20" rx="2" fill={`url(#redAccentGradMini-${m.id})`} />

                            {/* Extruder & Hopper */}
                            <polygon points="690,40 760,40 735,160 705,160" fill={`url(#machineBodyGradMini-${m.id})`} stroke="#1A1F27" strokeWidth="1.5" />
                            <rect x="630" y="165" width="260" height="60" rx="8" fill={`url(#steelGradMini-${m.id})`} stroke="#1A1F27" strokeWidth="1.5" />

                            {/* Milicron branding on body */}
                            <rect x="230" y="320" width="160" height="40" rx="4" fill="#1A1E26" stroke="#E61C24" strokeWidth="1" />
                            <text x="310" y="345" textAnchor="middle" fill="#FFFFFF" fontWeight="bold" fontSize="15" fontFamily="Space Grotesk">MILACRON</text>
                          </svg>
                        ) : m.name.toLowerCase().includes('cmp') ? (
                          <svg viewBox="0 0 1200 480" className="w-full h-full object-contain">
                            <defs>
                              <linearGradient id={`cmpCyanGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00E5FF" />
                                <stop offset="60%" stopColor="#00A3FF" />
                                <stop offset="100%" stopColor="#0066CC" />
                              </linearGradient>
                              <linearGradient id={`cmpFrameGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2A3447" />
                                <stop offset="50%" stopColor="#1C2433" />
                                <stop offset="100%" stopColor="#121824" />
                              </linearGradient>
                              <linearGradient id={`steelGradCmpMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#BAC5D6" />
                                <stop offset="50%" stopColor="#8290A6" />
                                <stop offset="100%" stopColor="#4A566A" />
                              </linearGradient>
                              <linearGradient id={`hopperGradCmpMini-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#E6ECF5" />
                                <stop offset="50%" stopColor="#FFFFFF" />
                                <stop offset="100%" stopColor="#B0BAC9" />
                              </linearGradient>
                              <style>{`
                                @keyframes cmpMoldCloseLeft-${m.id} {
                                  0%, 10% { transform: translateX(-90px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(-90px); }
                                }
                                @keyframes cmpMoldCloseRight-${m.id} {
                                  0%, 10% { transform: translateX(90px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(90px); }
                                }
                                @keyframes cmpParisonExtrude-${m.id} {
                                  0% { opacity: 0; transform: scaleY(0.1); transform-origin: top; }
                                  25% { opacity: 1; transform: scaleY(1); transform-origin: top; }
                                  35%, 100% { opacity: 0; }
                                }
                                @keyframes cmpBottleDrop-${m.id} {
                                  0%, 65% { opacity: 0; transform: translate(0, 0); }
                                  70% { opacity: 1; transform: translate(0, 0); }
                                  85% { opacity: 1; transform: translate(0, 80px) rotate(5deg); }
                                  90%, 100% { opacity: 0; transform: translate(0, 80px); }
                                }
                                .cmp-left-mold-${m.id} {
                                  animation: cmpMoldCloseLeft-${m.id} 6s infinite ease-in-out;
                                }
                                .cmp-right-mold-${m.id} {
                                  animation: cmpMoldCloseRight-${m.id} 6s infinite ease-in-out;
                                }
                                .cmp-parison-${m.id} {
                                  animation: cmpParisonExtrude-${m.id} 6s infinite ease-in-out;
                                }
                                .cmp-ejected-bottle-${m.id} {
                                  animation: cmpBottleDrop-${m.id} 6s infinite ease-in-out;
                                }
                              `}</style>
                            </defs>

                            {/* Base stand & frame */}
                            <rect x="60" y="425" width="1080" height="20" rx="4" fill="#0C1017" stroke="#06080C" strokeWidth="2" />
                            <rect x="80" y="310" width="1040" height="115" rx="4" fill={`url(#cmpFrameGradMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />

                            {/* Conveyor chute */}
                            <polygon points="320,330 480,330 500,420 300,420" fill="#0A0D12" stroke="#1E2638" strokeWidth="1.5" />

                            {/* Extruder & Hopper */}
                            <polygon points="170,30 270,30 240,110 200,110" fill={`url(#hopperGradCmpMini-${m.id})`} stroke="#1C2433" strokeWidth="2" />
                            <rect x="200" y="110" width="40" height="170" rx="3" fill={`url(#steelGradCmpMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />

                            {/* Die Head */}
                            <rect x="365" y="70" width="70" height="70" rx="4" fill={`url(#cmpCyanGradMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />
                            <text x="400" y="110" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF" fontStyle="italic">CMP DIE</text>

                            {/* Parison Extrusion (Animated) */}
                            <path className={`cmp-parison-${m.id}`} d="M400,140 L400,300" fill="none" stroke="#00E5FF" strokeWidth="16" strokeLinecap="round" />

                            {/* Left Mold Half (Animated) */}
                            <g className={`cmp-left-mold-${m.id}`}>
                              <rect x="250" y="170" width="130" height="140" rx="4" fill={`url(#steelGradCmpMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />
                              <path d="M380,180 C360,180 340,195 340,240 C340,285 360,300 380,300 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              <text x="300" y="245" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="Space Grotesk">#{m.mouldNumber}</text>
                            </g>

                            {/* Right Mold Half (Animated) */}
                            <g className={`cmp-right-mold-${m.id}`}>
                              <rect x="420" y="170" width="130" height="140" rx="4" fill={`url(#steelGradCmpMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />
                              <path d="M420,180 C440,180 460,195 460,240 C460,285 440,300 420,300 Z" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
                            </g>

                            {/* Falling Bottle (Animated) */}
                            <g className={`cmp-ejected-bottle-${m.id}`}>
                              <path
                                d="M390,220 L410,220 L415,240 C428,250 432,265 432,295 C432,320 424,330 415,330 L385,330 C376,330 368,320 368,295 C368,265 372,250 385,240 Z"
                                fill="#00E5FF"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                              />
                            </g>

                            {/* Clamp cylinders & HMI */}
                            <rect x="760" y="190" width="120" height="100" rx="5" fill={`url(#cmpFrameGradMini-${m.id})`} stroke="#0E121B" strokeWidth="2" />
                            <rect x="900" y="150" width="200" height="150" rx="6" fill="#1C2433" stroke="#0E121B" strokeWidth="2" />
                          </svg>
                        ) : m.name.toLowerCase().includes('victor') ? (
                          <svg viewBox="0 0 1200 480" className="w-full h-full object-contain">
                            <defs>
                              <linearGradient id={`blueEnclosureGradMini-${m.id}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1C64B4" />
                                <stop offset="100%" stopColor="#003B7A" />
                              </linearGradient>
                              <linearGradient id={`steelGradVictorMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#788496" />
                                <stop offset="50%" stopColor="#4D5666" />
                                <stop offset="100%" stopColor="#2D333F" />
                              </linearGradient>
                              <linearGradient id={`whiteCoverGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FFFFFF" />
                                <stop offset="100%" stopColor="#D9E0E8" />
                              </linearGradient>
                              <style>{`
                                @keyframes victorRotateMini-${m.id} {
                                  0%, 15% { transform: rotate(0deg); }
                                  20%, 35% { transform: rotate(60deg); }
                                  40%, 55% { transform: rotate(120deg); }
                                  60%, 75% { transform: rotate(180deg); }
                                  80%, 95% { transform: rotate(240deg); }
                                  100% { transform: rotate(300deg); }
                                }
                                .victor-carousel-${m.id} {
                                  animation: victorRotateMini-${m.id} 12s infinite ease-in-out;
                                  transform-origin: 380px 240px;
                                }
                              `}</style>
                            </defs>

                            {/* Base Stand */}
                            <rect x="80" y="420" width="1040" height="20" rx="4" fill="#1C212B" stroke="#101319" strokeWidth="1.5" />
                            <rect x="100" y="290" width="560" height="130" rx="5" fill="#252C38" stroke="#161B24" strokeWidth="2" />
                            <rect x="680" y="290" width="420" height="130" rx="5" fill={`url(#whiteCoverGradMini-${m.id})`} stroke="#161B24" strokeWidth="2" />
                            <text x="960" y="340" fontFamily="Space Grotesk" fontWeight="900" fontSize="22" fill="#E61C24" fontStyle="italic">
                              VICTOR <tspan fill="#161B24">MSZ30</tspan>
                            </text>

                            {/* Safety enclosure */}
                            <polygon points="260,80 500,80 580,160 580,320 500,400 260,400 180,320 180,160" fill={`url(#blueEnclosureGradMini-${m.id})`} stroke="#002D5E" strokeWidth="3" />
                            <polygon points="270,92 490,92 568,170 568,310 490,388 270,388 192,310 192,170" fill="#0B0E14" stroke="#2E7ED6" strokeWidth="2" opacity="0.92" />

                            {/* Carousel mechanism (Animated) */}
                            <g className={`victor-carousel-${m.id}`}>
                              <circle cx="380" cy="240" r="130" fill="none" stroke="#252F40" strokeWidth="3" strokeDasharray="8,6" />
                              <circle cx="380" cy="240" r="50" fill={`url(#steelGradVictorMini-${m.id})`} stroke="#161B24" strokeWidth="2" />

                              {/* Tubing lines */}
                              <path d="M380,240 L380,120 M380,240 L484,180 M380,240 L484,300 M380,240 L380,360 M380,240 L276,300 M380,240 L276,180" stroke="#E61C24" strokeWidth="2.5" />

                              {/* 6 Clamping Stations - HIGHLIGHTED AS MOULDS */}
                              <g transform="translate(380, 120)">
                                <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                              <g transform="translate(484, 180)">
                                <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                              <g transform="translate(484, 300)">
                                <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                              <g transform="translate(380, 360)">
                                <rect x="-28" y="-18" width="24" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                                <rect x="4" y="-18" width="24" height="36" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                              <g transform="translate(276, 300)">
                                <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                              <g transform="translate(276, 180)">
                                <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              </g>
                            </g>

                            {/* Mould Number Labeled on Carousel Center */}
                            <circle cx="380" cy="240" r="30" fill="#10131A" stroke="#3DD6E8" strokeWidth="2" />
                            <text x="380" y="246" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold" fontFamily="Space Grotesk">#{m.mouldNumber}</text>

                            {/* Extruder unit */}
                            <rect x="680" y="220" width="260" height="55" rx="6" fill={`url(#steelGradVictorMini-${m.id})`} stroke="#161B24" strokeWidth="2" />
                            <polygon points="860,90 940,90 920,220 880,220" fill={`url(#whiteCoverGradMini-${m.id})`} stroke="#3A4048" strokeWidth="2" />
                          </svg>
                        ) : m.name.toLowerCase().includes('vaibhav') ? (
                          <svg viewBox="0 0 1200 480" className="w-full h-full object-contain">
                            <defs>
                              <linearGradient id={`vaibhavOrangeGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#FF7A18" />
                                <stop offset="60%" stopColor="#E65100" />
                                <stop offset="100%" stopColor="#B23C00" />
                              </linearGradient>
                              <linearGradient id={`vaibhavFrameGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#383E4B" />
                                <stop offset="50%" stopColor="#252A34" />
                                <stop offset="100%" stopColor="#1A1E26" />
                              </linearGradient>
                              <linearGradient id={`steelGradVbMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#A8B4C4" />
                                <stop offset="50%" stopColor="#707C8E" />
                                <stop offset="100%" stopColor="#404958" />
                              </linearGradient>
                              <linearGradient id={`hopperGradVbMini-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#E4E9F0" />
                                <stop offset="50%" stopColor="#FFFFFF" />
                                <stop offset="100%" stopColor="#A4AEBC" />
                              </linearGradient>
                              <style>{`
                                @keyframes vbMoldCloseLeft-${m.id} {
                                  0%, 10% { transform: translateX(-90px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(-90px); }
                                }
                                @keyframes vbMoldCloseRight-${m.id} {
                                  0%, 10% { transform: translateX(90px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(90px); }
                                }
                                @keyframes vbParisonExtrude-${m.id} {
                                  0% { opacity: 0; transform: scaleY(0.1); transform-origin: top; }
                                  25% { opacity: 1; transform: scaleY(1); transform-origin: top; }
                                  35%, 100% { opacity: 0; }
                                }
                                @keyframes vbBottleDrop-${m.id} {
                                  0%, 65% { opacity: 0; transform: translate(0, 0); }
                                  70% { opacity: 1; transform: translate(0, 0); }
                                  85% { opacity: 1; transform: translate(0, 80px) rotate(5deg); }
                                  90%, 100% { opacity: 0; transform: translate(0, 80px); }
                                }
                                .vb-left-mold-${m.id} {
                                  animation: vbMoldCloseLeft-${m.id} 6s infinite ease-in-out;
                                }
                                .vb-right-mold-${m.id} {
                                  animation: vbMoldCloseRight-${m.id} 6s infinite ease-in-out;
                                }
                                .vb-parison-${m.id} {
                                  animation: vbParisonExtrude-${m.id} 6s infinite ease-in-out;
                                }
                                .vb-ejected-bottle-${m.id} {
                                  animation: vbBottleDrop-${m.id} 6s infinite ease-in-out;
                                }
                              `}</style>
                            </defs>

                            {/* Base stand & frame */}
                            <rect x="60" y="425" width="1080" height="20" rx="4" fill="#14171D" stroke="#0B0D11" strokeWidth="2" />
                            <rect x="80" y="310" width="1040" height="115" rx="4" fill={`url(#vaibhavFrameGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />

                            {/* Conveyor chute */}
                            <polygon points="320,330 480,330 500,420 300,420" fill="#0E1116" stroke="#2A2F3A" strokeWidth="1.5" />

                            {/* Extruder & Hopper */}
                            <polygon points="170,30 270,30 240,110 200,110" fill={`url(#hopperGradVbMini-${m.id})`} stroke="#252A34" strokeWidth="2" />
                            <rect x="200" y="110" width="40" height="170" rx="3" fill={`url(#steelGradVbMini-${m.id})`} stroke="#11141A" strokeWidth="2" />

                            {/* Die Head */}
                            <rect x="365" y="70" width="70" height="70" rx="4" fill={`url(#vaibhavOrangeGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                            <text x="400" y="110" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF" fontStyle="italic">DIE HEAD</text>

                            {/* Parison Extrusion (Animated) */}
                            <path className={`vb-parison-${m.id}`} d="M400,140 L400,300" fill="none" stroke="#FF7A18" strokeWidth="16" strokeLinecap="round" />

                            {/* Left Mold Half (Animated) */}
                            <g className={`vb-left-mold-${m.id}`}>
                              <rect x="250" y="170" width="130" height="140" rx="4" fill={`url(#steelGradVbMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                              <path d="M380,180 C360,180 340,195 340,240 C340,285 360,300 380,300 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
                              <text x="300" y="245" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="Space Grotesk">#{m.mouldNumber}</text>
                            </g>

                            {/* Right Mold Half (Animated) */}
                            <g className={`vb-right-mold-${m.id}`}>
                              <rect x="420" y="170" width="130" height="140" rx="4" fill={`url(#steelGradVbMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                              <path d="M420,180 C440,180 460,195 460,240 C460,285 440,300 420,300 Z" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
                            </g>

                            {/* Falling Bottle (Animated) */}
                            <g className={`vb-ejected-bottle-${m.id}`}>
                              <path
                                d="M392,220 L408,220 L412,240 C425,250 430,265 430,295 C430,320 422,330 415,330 L385,330 C378,330 370,320 370,295 C370,265 375,250 388,240 Z"
                                fill="#38BDF8"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                              />
                            </g>

                            {/* Actuator & HMI */}
                            <rect x="760" y="190" width="120" height="100" rx="5" fill={`url(#vaibhavFrameGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                            <rect x="900" y="150" width="200" height="150" rx="6" fill="#252A34" stroke="#11141A" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 1200 480" className="w-full h-full object-contain">
                            <defs>
                              <linearGradient id={`ltBlueGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4499EE" />
                                <stop offset="60%" stopColor="#2B80DD" />
                                <stop offset="100%" stopColor="#1C6BBF" />
                              </linearGradient>
                              <linearGradient id={`ltFrameGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#353B47" />
                                <stop offset="50%" stopColor="#242832" />
                                <stop offset="100%" stopColor="#191C23" />
                              </linearGradient>
                              <linearGradient id={`steelGradLtMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#A4B0C2" />
                                <stop offset="50%" stopColor="#6C788A" />
                                <stop offset="100%" stopColor="#3D4554" />
                              </linearGradient>
                              <linearGradient id={`silverHopperGradMini-${m.id}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#E2E7EE" />
                                <stop offset="50%" stopColor="#FFFFFF" />
                                <stop offset="100%" stopColor="#A0AAB8" />
                              </linearGradient>
                              <linearGradient id={`heaterBandGradMini-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" />
                                <stop offset="50%" stopColor="#D97706" />
                                <stop offset="100%" stopColor="#78350F" />
                              </linearGradient>
                              <style>{`
                                @keyframes ltPlatenMove-${m.id} {
                                  0%, 10% { transform: translateX(-100px); }
                                  35%, 65% { transform: translateX(0); }
                                  90%, 100% { transform: translateX(-100px); }
                                }
                                @keyframes ltFlowGlow-${m.id} {
                                  0%, 35% { opacity: 0; }
                                  40%, 60% { opacity: 1; }
                                  65%, 100% { opacity: 0; }
                                }
                                @keyframes ltPartEject-${m.id} {
                                  0%, 65% { opacity: 0; transform: translate(0, 0) scale(1); }
                                  70% { opacity: 1; transform: translate(0, 0) scale(1); }
                                  85% { opacity: 1; transform: translate(0, 60px) scale(0.8); }
                                  90%, 100% { opacity: 0; transform: translate(0, 60px) scale(0.8); }
                                }
                                .lt-moving-platen-${m.id} {
                                  animation: ltPlatenMove-${m.id} 6s infinite ease-in-out;
                                }
                                .lt-flow-path-${m.id} {
                                  animation: ltFlowGlow-${m.id} 6s infinite ease-in-out;
                                }
                                .lt-ejected-part-${m.id} {
                                  animation: ltPartEject-${m.id} 6s infinite ease-in-out;
                                }
                              `}</style>
                            </defs>

                            {/* 1. Base Ground Plate & Support Feet */}
                            <rect x="60" y="425" width="1080" height="20" rx="4" fill="#14171D" stroke="#0B0D11" strokeWidth="2" />

                            {/* Heavy Charcoal Machine Base Chassis */}
                            <rect x="80" y="280" width="460" height="145" rx="4" fill={`url(#ltFrameGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                            <rect x="540" y="280" width="580" height="145" rx="4" fill={`url(#ltFrameGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                            <rect x="550" y="300" width="560" height="110" rx="2" fill="#151820" opacity="0.6" />

                            {/* 4 Heavy Steel Tie Bars */}
                            <rect x="100" y="145" width="420" height="14" rx="3" fill={`url(#steelGradLtMini-${m.id})`} stroke="#1A1E26" strokeWidth="1" />
                            <rect x="100" y="175" width="420" height="14" rx="3" fill={`url(#steelGradLtMini-${m.id})`} stroke="#1A1E26" strokeWidth="1" />
                            <rect x="100" y="240" width="420" height="14" rx="3" fill={`url(#steelGradLtMini-${m.id})`} stroke="#1A1E26" strokeWidth="1" />
                            <rect x="100" y="270" width="420" height="14" rx="3" fill={`url(#steelGradLtMini-${m.id})`} stroke="#1A1E26" strokeWidth="1" />

                            {/* Rear Stationary Die Platen */}
                            <rect x="100" y="130" width="35" height="165" rx="4" fill={`url(#steelGradLtMini-${m.id})`} stroke="#161920" strokeWidth="2" />

                            {/* MOVABLE PLATEN GROUP (Animated) */}
                            <g className={`lt-moving-platen-${m.id}`}>
                              {/* Movable Die Platen Body */}
                              <rect x="270" y="130" width="45" height="165" rx="4" fill={`url(#steelGradLtMini-${m.id})`} stroke="#161920" strokeWidth="2" />

                              {/* Mold Half A (Movable Core Half) */}
                              <rect x="315" y="150" width="55" height="125" rx="3" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
                              <text x="342.5" y="220" textAnchor="middle" fill="#FFFFFF" fontSize="20" fontWeight="bold" fontFamily="Space Grotesk">#{m.mouldNumber}</text>
                            </g>

                            {/* Stationary Front Platen & Mold Half B */}
                            <rect x="420" y="130" width="45" height="165" rx="4" fill={`url(#steelGradLtMini-${m.id})`} stroke="#161920" strokeWidth="2" />
                            <rect x="370" y="150" width="50" height="125" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="2" />

                            {/* Molten Polymer Injection Nozzle Flow Path (Animated) */}
                            <path className={`lt-flow-path-${m.id}`} d="M470,217 L420,217" fill="none" stroke="#FF8A3D" strokeWidth="12" strokeLinecap="round" />

                            {/* Falling Part (Animated) */}
                            <g className={`lt-ejected-part-${m.id}`}>
                              <rect x="365" y="210" width="30" height="85" rx="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                            </g>

                            {/* BLUE L&T ENCLOSURE FRAME */}
                            <g id="ltEnclosureFrame">
                              <path d="M135,110 L455,110 L455,148 L135,148 Z" fill={`url(#ltBlueGradMini-${m.id})`} stroke="#124A8A" strokeWidth="2" />
                              <rect x="150" y="116" width="290" height="26" rx="3" fill="#1C6BBF" stroke="#0F437B" strokeWidth="1" />
                              <text x="295" y="134" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="20" fill="#FFFFFF" fontStyle="italic" letterSpacing="2">
                                L&amp;T
                              </text>
                              <rect x="155" y="148" width="280" height="127" rx="3" fill="none" stroke="#2B80DD" strokeWidth="2" />
                            </g>

                            {/* Hopper */}
                            <polygon points="650,55 750,55 720,185 680,185" fill={`url(#silverHopperGradMini-${m.id})`} stroke="#2B3240" strokeWidth="2" />

                            {/* Heated Extrusion Barrel */}
                            <rect x="470" y="195" width="280" height="45" rx="4" fill={`url(#steelGradLtMini-${m.id})`} stroke="#161920" strokeWidth="2" />
                            <rect x="480" y="190" width="35" height="55" rx="3" fill={`url(#heaterBandGradMini-${m.id})`} stroke="#451A03" strokeWidth="1.5" />
                            <rect x="530" y="190" width="55" height="55" rx="3" fill={`url(#heaterBandGradMini-${m.id})`} stroke="#451A03" strokeWidth="1.5" />
                            <rect x="580" y="190" width="55" height="55" rx="3" fill={`url(#heaterBandGradMini-${m.id})`} stroke="#451A03" strokeWidth="1.5" />

                            {/* Right Carriage Frame */}
                            <rect x="750" y="170" width="350" height="110" rx="5" fill={`url(#ltFrameGradMini-${m.id})`} stroke="#11141A" strokeWidth="2" />
                            <rect x="770" y="160" width="310" height="40" rx="4" fill={`url(#ltBlueGradMini-${m.id})`} stroke="#124A8A" strokeWidth="2" />

                            {/* Operator panel */}
                            <rect x="800" y="300" width="220" height="105" rx="5" fill="#242934" stroke="#11141A" strokeWidth="2" />
                          </svg>
                        )}
                        
                        {/* Overlay text for visual clarity */}
                        <div className="absolute bottom-1 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono text-zinc-400 border border-white/5">
                          {m.name.toLowerCase().includes('milicron')
                            ? 'MILACRON'
                            : m.name.toLowerCase().includes('cmp')
                            ? 'CMP'
                            : m.name.toLowerCase().includes('victor')
                            ? 'VICTOR'
                            : m.name.toLowerCase().includes('vaibhav')
                            ? 'VAIBHAV'
                            : 'L&T'}{' '}
                          DIAGRAM
                        </div>
                      </div>
                    )}

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
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                  {(() => {
                    const mould = getSearchMouldLocation(searchMachines);
                    if (mould) {
                      return (
                        <div className="p-6 bg-[#0E121B] border border-violet-500/30 rounded-2xl flex flex-col items-center gap-6 w-full max-w-md text-center shadow-lg">
                          {/* Description details */}
                          <div className="flex flex-col items-center gap-1.5 w-full">
                            <span className="text-[9px] font-mono text-violet-400 font-bold uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                              MOULD IN THE STORE
                            </span>
                            <h4 className="text-xl font-bold text-amber-300 font-['Space_Grotesk'] leading-tight">
                              MOULD #{mould.mouldNumber}
                            </h4>
                            <div className="w-full border-t border-white/5 my-2" />
                            <p className="text-sm text-zinc-300">
                              Status: <strong className="text-violet-300">In the Mould Store</strong>
                            </p>
                            <p className="text-xs text-zinc-400">
                              Location: <strong className="text-white font-mono">{mould.location}</strong>
                            </p>
                            <p className="text-xs text-zinc-400">
                              Specs: <strong className="text-white">{mould.cavities} Cavities ({mould.material})</strong>
                            </p>
                            <p className="text-xs text-zinc-400">
                              Weight: <strong className="text-white">{mould.weight} kg</strong>
                            </p>
                          </div>

                          {/* Big Mould Image / SVG (Below details) */}
                          <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-[#141A26] border border-violet-500/30 flex items-center justify-center p-4 relative shadow-[0_0_25px_rgba(139,92,246,0.15)] transition-transform hover:scale-105 duration-300">
                            <svg viewBox="0 0 120 120" className="w-full h-full">
                              {/* Mould Base A & B Plates */}
                              <rect x="15" y="20" width="40" height="80" rx="4" fill="#5B6575" stroke="#F59E0B" strokeWidth="2.5" />
                              <rect x="65" y="20" width="40" height="80" rx="4" fill="#5B6575" stroke="#F59E0B" strokeWidth="2.5" />
                              <line x1="60" y1="20" x2="60" y2="100" stroke="#0E121B" strokeWidth="3" />
                              {/* Cooling ports */}
                              <circle cx="30" cy="32" r="5" fill="#3DD6E8" />
                              <circle cx="30" cy="88" r="5" fill="#E61C24" />
                              <circle cx="90" cy="32" r="5" fill="#3DD6E8" />
                              <circle cx="90" cy="88" r="5" fill="#E61C24" />
                              
                              {/* RFID Tag Badge */}
                              <rect x="25" y="48" width="70" height="24" rx="4" fill="#0E121B" stroke="#A78BFA" strokeWidth="2" />
                              <text x="32" y="64" fontSize="10" fontWeight="bold" fill="#A78BFA" fontFamily="monospace">RFID TAG</text>
                              <circle cx="85" cy="60" r="2.5" fill="#A78BFA" className="animate-pulse" />
                            </svg>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <>
                        <Grid3x3 className="w-12 h-12 mb-3 opacity-40 text-sky-400" />
                        <p className="font-mono font-bold text-sm">No machines match your filter</p>
                      </>
                    );
                  })()}
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
                    ({s === 'ALL' ? TOTAL_MOULDS_DISPLAY : s === 'IN_MACHINE' ? totalInMachine : (TOTAL_MOULDS_DISPLAY - totalInMachine)})
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
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Package className="w-10 h-10 mb-3 opacity-40 text-violet-400" />
                    <p className="font-mono font-bold text-sm">No moulds found</p>
                    
                    {(() => {
                      const mould = getSearchMouldLocation(searchStore);
                      if (mould) {
                        return (
                          <div className="mt-6 p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl flex flex-col items-center gap-2 max-w-md text-center">
                            <span className="text-[10px] font-mono text-sky-300 font-bold uppercase tracking-wider">MOULD RFID TRACKER</span>
                            <span className="text-base font-bold text-white font-['Space_Grotesk']">Mould #{mould.mouldNumber} Mounted on Machine</span>
                            <p className="text-xs text-zinc-400">
                              This mould is currently active on:
                              <strong className="block text-sky-300 font-['Space_Grotesk'] mt-1 text-sm">{mould.assignedTo}</strong>
                              Location: <strong className="text-sky-300 font-mono">{mould.location}</strong>
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab('machines');
                                setSearchMachines(`#${mould.mouldNumber}`);
                              }}
                              className="mt-3 px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 hover:border-sky-400 text-sky-300 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer"
                            >
                              SWITCH TO ALL MACHINES
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
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
