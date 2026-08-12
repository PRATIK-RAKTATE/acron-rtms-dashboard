import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Flame,
  RotateCcw,
  Layers,
  BarChart3,
  TrendingUp,
  Calendar,
  Award,
  Play,
  Pause,
  Activity,
  Wind,
} from 'lucide-react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface VictorDashboardModalProps {
  machine: MachineInfo;
  onClose: () => void;
}

export const VictorDashboardModal: React.FC<VictorDashboardModalProps> = ({
  machine,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(2.5);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | '7days' | '30days' | 'lifetime' | 'mould'>('today');
  const [bottlesProduced, setBottlesProduced] = useState<number>(14280);

  // SVG Elements Refs
  const carouselGroupRef = useRef<SVGGElement>(null);
  const extruderScrewRef = useRef<SVGGElement>(null);
  const parisonRef = useRef<SVGPathElement>(null);
  const bottleLeftRef = useRef<SVGGElement>(null);
  const bottleRightRef = useRef<SVGGElement>(null);
  const moldStationLeftRef = useRef<SVGGElement>(null);
  const moldStationRightRef = useRef<SVGGElement>(null);
  const airPulseRef = useRef<SVGPathElement>(null);
  const motorTickRef = useRef<SVGLineElement>(null);

  // Animation Constants
  const PHASE_DURATIONS = [2.5, 1.5, 3.0, 2.0]; // Extrude, Index, Blow, Eject
  const TOTAL_CYCLE_TIME = 9.0;

  const STATES = [
    { label: 'Parison Extrusion', color: '#FF8A3D', desc: 'Extruding molten thermoplastic preform into station mold' },
    { label: 'Carousel Indexing', color: '#3DD6E8', desc: 'Rotary table indexing 60° to high-pressure blow station' },
    { label: 'Air Blow & Cooling', color: '#00C853', desc: '35 Bar air expansion forming hollow PET bottle shape' },
    { label: 'Ejection & Drop', color: '#A855F7', desc: 'Mold halves open & finished bottles drop to discharge chute' },
  ];

  const totalTimeRef = useRef<number>(0);

  // Manual Phase Jump Handler
  const handleJumpToPhase = (phaseIndex: number) => {
    let acc = 0;
    for (let i = 0; i < phaseIndex; i++) {
      acc += PHASE_DURATIONS[i];
    }
    const cycleCount = Math.floor(totalTimeRef.current / TOTAL_CYCLE_TIME);
    totalTimeRef.current = cycleCount * TOTAL_CYCLE_TIME + acc;
    setCurrentPhase(phaseIndex);
    setPhaseTimeLeft(PHASE_DURATIONS[phaseIndex]);
  };

  // Simulation RequestAnimationFrame Loop
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying && !isEmergencyStopped) {
        totalTimeRef.current += delta;
        const totalTime = totalTimeRef.current;
        const cycleCount = Math.floor(totalTime / TOTAL_CYCLE_TIME);
        const cycleTime = totalTime % TOTAL_CYCLE_TIME;

        // Determine current phase based on cycle time
        let accumulated = 0;
        let pIndex = 0;
        for (let i = 0; i < PHASE_DURATIONS.length; i++) {
          if (cycleTime >= accumulated && cycleTime < accumulated + PHASE_DURATIONS[i]) {
            pIndex = i;
            break;
          }
          accumulated += PHASE_DURATIONS[i];
        }

        setCurrentPhase(pIndex);
        const currentPhaseDuration = PHASE_DURATIONS[pIndex];
        const currentPhaseElapsed = cycleTime - accumulated;
        setPhaseTimeLeft(Math.max(0, currentPhaseDuration - currentPhaseElapsed));
        const pT = Math.min(1, Math.max(0, currentPhaseElapsed / currentPhaseDuration));

        // 1. Extruder Screw Continuous Rotation
        if (extruderScrewRef.current) {
          const shift = (currentTime * 0.08) % 18;
          extruderScrewRef.current.setAttribute('transform', `translate(${-shift}, 0)`);
        }

        // 2. Motor Tick Rotation
        if (motorTickRef.current) {
          const angle = (currentTime * 0.4) % 360;
          motorTickRef.current.setAttribute('transform', `rotate(${angle})`);
        }

        // 3. Carousel Rotation & Indexing Mechanics
        if (carouselGroupRef.current) {
          let baseAngle = cycleCount * 60;
          if (pIndex === 1) {
            const easePt = pT < 0.5 ? 2 * pT * pT : 1 - Math.pow(-2 * pT + 2, 2) / 2;
            baseAngle += easePt * 60;
          } else if (pIndex > 1) {
            baseAngle += 60;
          }
          carouselGroupRef.current.setAttribute('transform', `rotate(${baseAngle}, 380, 240)`);
        }

        // 4. Phase 0: Parison Extrusion Animation
        if (parisonRef.current) {
          if (pIndex === 0) {
            parisonRef.current.style.opacity = '1';
            parisonRef.current.setAttribute('d', `M710,215 L710,${215 + pT * 55}`);
          } else {
            parisonRef.current.style.opacity = '0';
          }
        }

        // 5. Phase 2: Air Blow Inflation Pulse
        if (airPulseRef.current) {
          if (pIndex === 2) {
            airPulseRef.current.style.opacity = `${0.4 + 0.6 * Math.sin(pT * Math.PI * 4)}`;
          } else {
            airPulseRef.current.style.opacity = '0';
          }
        }

        // 6. Phase 3: Mold Opening & Ejection
        const clampOffset = pIndex === 3 ? pT * 22 : 0;
        if (moldStationLeftRef.current) {
          moldStationLeftRef.current.setAttribute('transform', `translate(${-clampOffset}, 0)`);
        }
        if (moldStationRightRef.current) {
          moldStationRightRef.current.setAttribute('transform', `translate(${clampOffset}, 0)`);
        }

        // Ejected Bottle Drop Physics
        if (bottleLeftRef.current && bottleRightRef.current) {
          if (pIndex === 3) {
            const fallY = pT * pT * 120;
            bottleLeftRef.current.style.opacity = '1';
            bottleRightRef.current.style.opacity = '1';
            bottleLeftRef.current.setAttribute('transform', `translate(0, ${fallY})`);
            bottleRightRef.current.setAttribute('transform', `translate(0, ${fallY})`);

            if (pT > 0.95 && Math.random() < 0.05) {
              setBottlesProduced((prev) => prev + 2);
            }
          } else {
            bottleLeftRef.current.style.opacity = '0';
            bottleRightRef.current.style.opacity = '0';
          }
        }
      }

      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, isEmergencyStopped]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0E1116] border border-[#2A2F3A] w-full max-w-[1550px] h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-['Outfit']">
        {/* Top Header Bar */}
        <header className="bg-[#14171D] border-b border-[#2A2F3A] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1B1F27] hover:bg-[#2A2F3A] text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold font-['IBM_Plex_Mono']"
            >
              <ArrowLeft className="w-4 h-4" /> BACK TO FLOOR PLAN
            </button>

            <div className="h-6 w-[1px] bg-[#2A2F3A]" />

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#00458C]/40 text-[#3DD6E8] text-[10px] font-mono font-bold tracking-wider border border-[#00458C]">
                  VICTOR ROTARY BM
                </span>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-wide">
                  {machine.name} <span className="text-zinc-400 text-xs font-normal">({machine.subTitle})</span>
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-['IBM_Plex_Sans']">
                ROTARY INJECTION STRETCH BLOW MOULDING MACHINE — MODEL MSZ30
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-['IBM_Plex_Mono']">
            <div className="bg-[#1B1F27] px-3 py-1.5 rounded-md border border-[#2A2F3A] flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500 font-medium">SIDE:</span>
              <span className="font-bold text-white uppercase">{machine.side} SIDE</span>
            </div>
            <div className="bg-[#1B1F27] px-3 py-1.5 rounded-md border border-[#2A2F3A] flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500 font-medium">MOULD NO:</span>
              <span className="font-bold text-amber-400">#{machine.mouldNumber ?? '235'}</span>
            </div>
            <div className="bg-[#1B1F27] px-3 py-1.5 rounded-md border border-[#2A2F3A] flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500 font-medium">STATIONS:</span>
              <span className="font-bold text-emerald-400">6 ROTARY</span>
            </div>
          </div>
        </header>

        {/* 3-Column Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR: Timeframe Selectors & Emergency Stop */}
          <aside className="w-full lg:w-80 border-r border-[#2A2F3A] flex flex-col justify-between shrink-0 font-['IBM_Plex_Sans'] bg-[#0E1116]">
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              <div className="text-xs font-bold text-zinc-400 border-b border-[#2A2F3A] pb-2 tracking-wider uppercase font-['IBM_Plex_Mono'] flex items-center justify-between">
                <span>PRODUCTION DASHBOARD</span>
                <BarChart3 className="w-4 h-4 text-[#3DD6E8]" />
              </div>

              {/* Timeframe Selector Cards */}
              <div className="flex flex-col gap-2.5">
                {/* TODAY */}
                <button
                  onClick={() => setActiveTimeframe('today')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === 'today'
                      ? 'bg-[#3DD6E8]/10 border-[#3DD6E8] text-white shadow-[0_0_15px_rgba(61,214,232,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> TODAY'S PRODUCTION
                    </span>
                    <span className="text-emerald-400 font-mono text-[9px]">+12.4%</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                    {bottlesProduced.toLocaleString()} <span className="text-xs font-normal text-zinc-400">PCS</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium border-t border-white/5 pt-1 flex justify-between">
                    <span>Target: 16,000 pcs</span>
                    <span>Rate: 3,600 BPH</span>
                  </div>
                </button>

                {/* 7 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('7days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === '7days'
                      ? 'bg-[#3DD6E8]/10 border-[#3DD6E8] text-white shadow-[0_0_15px_rgba(61,214,232,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#3DD6E8]" /> LAST 7 DAYS
                    </span>
                    <span className="text-[#3DD6E8] font-mono text-[9px]">WEEKLY</span>
                  </div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    99,960 <span className="text-xs font-normal text-zinc-400">PCS</span>
                  </div>
                </button>

                {/* 30 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('30days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === '30days'
                      ? 'bg-[#3DD6E8]/10 border-[#3DD6E8] text-white shadow-[0_0_15px_rgba(61,214,232,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" /> LAST 30 DAYS
                    </span>
                    <span className="text-purple-400 font-mono text-[9px]">MONTHLY</span>
                  </div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    428,400 <span className="text-xs font-normal text-zinc-400">PCS</span>
                  </div>
                </button>

                {/* LIFETIME PRODUCTION */}
                <button
                  onClick={() => setActiveTimeframe('lifetime')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === 'lifetime'
                      ? 'bg-[#3DD6E8]/10 border-[#3DD6E8] text-white shadow-[0_0_15px_rgba(61,214,232,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> LIFETIME PRODUCTION
                    </span>
                    <span className="text-amber-400 font-mono text-[9px]">TOTAL</span>
                  </div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    1,248,000 <span className="text-xs font-normal text-zinc-400">PCS</span>
                  </div>
                </button>

                {/* SINCE MOULD CONNECTED */}
                <button
                  onClick={() => setActiveTimeframe('mould')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${
                    activeTimeframe === 'mould'
                      ? 'bg-gradient-to-br from-amber-500/25 to-orange-600/25 border-[#ffb77d] shadow-[0_0_18px_rgba(255,183,125,0.3)]'
                      : 'bg-gradient-to-br from-[#1B1F27] to-[#14171D] border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#ffb77d] font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> SINCE MOULD CONNECTED
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px]">
                      MOULD #{machine.mouldNumber ?? '235'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#ffb77d] font-['Space_Grotesk'] tracking-tight">
                    149,127 <span className="text-xs font-normal text-zinc-300">PCS</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium border-t border-white/10 pt-1.5 flex items-center justify-between">
                    <span>Current Mould Lifetime</span>
                    <span className="text-emerald-400 font-bold">100% Active</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Emergency Stop Button */}
            <div className="p-4 border-t border-[#2A2F3A]">
              <button
                onClick={() => setIsEmergencyStopped(!isEmergencyStopped)}
                className={`w-full py-3 rounded text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border cursor-pointer font-['IBM_Plex_Mono'] ${
                  isEmergencyStopped
                    ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400'
                    : 'bg-red-900/90 hover:bg-red-800 text-red-200 border-red-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                {isEmergencyStopped ? 'RESUME SYSTEM' : 'EMERGENCY STOP'}
              </button>
            </div>
          </aside>

          {/* CENTER VIEWPORT & CYCLE CONTROLS */}
          <main className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-3 flex-1">
              {/* Victor MSZ30 Machine Vector Diagram Container */}
              <div className="flex-1 flex flex-col gap-3 relative min-h-[400px]">
                <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] relative overflow-hidden flex flex-col p-4 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]">
                  <div className="h-8 border-b border-[#2A2F3A] flex items-center justify-between text-xs pb-2 mb-2">
                    <span className="text-[#3DD6E8] font-bold font-['IBM_Plex_Mono'] flex items-center gap-2">
                      <Activity className="w-4 h-4" /> VICTOR MSZ30 ROTARY BM // PHASE {currentPhase + 1} OF 4
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-1.5 bg-[#1B1F27] border border-[#2A2F3A] hover:border-[#3DD6E8] text-xs font-['IBM_Plex_Mono'] px-3 py-1 rounded text-white transition-all cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{isPlaying ? 'PAUSE SIMULATION' : 'RUN SIMULATION'}</span>
                      </button>
                      <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded border border-white/10 text-emerald-400 font-mono text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{STATES[currentPhase].label.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Machine Diagram */}
                  <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[360px]">
                    <svg
                      viewBox="0 0 1200 480"
                      className="w-full h-full max-h-[460px] object-contain drop-shadow-2xl"
                      role="img"
                      aria-label="Victor MSZ30 Rotary Blow Moulding Machine"
                    >
                      <defs>
                        <linearGradient id="blueEnclosureGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1C64B4" />
                          <stop offset="100%" stopColor="#003B7A" />
                        </linearGradient>
                        <linearGradient id="steelGradVictor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#788496" />
                          <stop offset="50%" stopColor="#4D5666" />
                          <stop offset="100%" stopColor="#2D333F" />
                        </linearGradient>
                        <linearGradient id="whiteCoverGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#D9E0E8" />
                        </linearGradient>

                        <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* 1. Heavy Floor Base Stand & Feet */}
                      <rect x="80" y="420" width="1040" height="20" rx="4" fill="#1C212B" stroke="#101319" strokeWidth="1.5" />
                      <rect x="120" y="440" width="26" height="14" rx="2" fill="#F2B705" />
                      <rect x="420" y="440" width="26" height="14" rx="2" fill="#F2B705" />
                      <rect x="760" y="440" width="26" height="14" rx="2" fill="#F2B705" />
                      <rect x="1040" y="440" width="26" height="14" rx="2" fill="#F2B705" />

                      {/* Lower Machine Base Enclosure */}
                      <rect x="100" y="290" width="560" height="130" rx="5" fill="#252C38" stroke="#161B24" strokeWidth="2" />
                      <rect x="680" y="290" width="420" height="130" rx="5" fill="url(#whiteCoverGrad)" stroke="#161B24" strokeWidth="2" />
                      <text x="960" y="340" fontFamily="Space Grotesk" fontWeight="900" fontSize="22" fill="#E61C24" fontStyle="italic">
                        VICTOR <tspan fill="#161B24">MSZ30</tspan>
                      </text>
                      <text x="960" y="360" fontFamily="Space Grotesk" fontWeight="700" fontSize="11" fill="#5A6472" letterSpacing="1">
                        ROTARY BLOW MOULDING
                      </text>

                      {/* Discharge Ejection Chute */}
                      <polygon points="340,340 420,340 450,420 310,420" fill="#141822" stroke="#2B3242" strokeWidth="1.5" />
                      <text x="380" y="390" textAnchor="middle" fontSize="10" fontWeight="700" fill="#3DD6E8" opacity="0.8">
                        BOTTLE DISCHARGE CHUTE
                      </text>

                      {/* 2. OCTAGONAL BLUE SAFETY HOUSING ENCLOSURE */}
                      <polygon
                        points="260,80 500,80 580,160 580,320 500,400 260,400 180,320 180,160"
                        fill="url(#blueEnclosureGrad)"
                        stroke="#002D5E"
                        strokeWidth="3"
                      />
                      <polygon
                        points="270,92 490,92 568,170 568,310 490,388 270,388 192,310 192,170"
                        fill="#0B0E14"
                        stroke="#2E7ED6"
                        strokeWidth="2"
                        opacity="0.92"
                      />

                      {/* Top Signal Stack Light */}
                      <rect x="475" y="45" width="10" height="35" fill="#3A4048" />
                      <circle cx="480" cy="38" r="6" fill="#00C853" className="animate-pulse" />
                      <circle cx="480" cy="24" r="6" fill="#F2B705" />
                      <circle cx="480" cy="10" r="6" fill="#E61C24" />

                      {/* 3. ROTARY CAROUSEL INDEXING MECHANISM (Center x=380, y=240) */}
                      <g id="rotaryCarouselGroup" ref={carouselGroupRef} transform="rotate(0, 380, 240)">
                        <circle cx="380" cy="240" r="130" fill="none" stroke="#252F40" strokeWidth="3" strokeDasharray="8,6" />
                        <circle cx="380" cy="240" r="50" fill="url(#steelGradVictor)" stroke="#161B24" strokeWidth="2" />
                        <circle cx="380" cy="240" r="20" fill="#10131A" stroke="#3DD6E8" strokeWidth="1.5" />

                        {/* Tubing lines */}
                        <path d="M380,240 L380,120 M380,240 L484,180 M380,240 L484,300 M380,240 L380,360 M380,240 L276,300 M380,240 L276,180" stroke="#E61C24" strokeWidth="2.5" />
                        <path d="M380,240 L380,115 M380,240 L488,177 M380,240 L488,303 M380,240 L380,365 M380,240 L272,303 M380,240 L272,177" stroke="#00458C" strokeWidth="2.5" />

                        {/* 6 Rotary Stations */}
                        <g transform="translate(380, 120)">
                          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#3D4656" stroke="#1A202C" strokeWidth="1.5" />
                          <rect x="-14" y="-12" width="28" height="24" rx="2" fill="#E61C24" opacity="0.8" />
                        </g>

                        <g transform="translate(484, 180)">
                          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#3D4656" stroke="#1A202C" strokeWidth="1.5" />
                          <rect x="-14" y="-12" width="28" height="24" rx="2" fill="#3DD6E8" opacity="0.8" />
                        </g>

                        <g transform="translate(484, 300)">
                          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#3D4656" stroke="#1A202C" strokeWidth="1.5" />
                          <rect x="-14" y="-12" width="28" height="24" rx="2" fill="#3DD6E8" opacity="0.8" />
                        </g>

                        <g transform="translate(380, 360)">
                          <g id="moldStationLeft" ref={moldStationLeftRef} transform="translate(0, 0)">
                            <rect x="-28" y="-18" width="24" height="36" rx="3" fill="#4B5565" stroke="#1A202C" strokeWidth="1.5" />
                          </g>
                          <g id="moldStationRight" ref={moldStationRightRef} transform="translate(0, 0)">
                            <rect x="4" y="-18" width="24" height="36" rx="3" fill="#4B5565" stroke="#1A202C" strokeWidth="1.5" />
                          </g>
                        </g>

                        <g transform="translate(276, 300)">
                          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#3D4656" stroke="#1A202C" strokeWidth="1.5" />
                          <rect x="-14" y="-12" width="28" height="24" rx="2" fill="#00C853" opacity="0.8" />
                        </g>

                        <g transform="translate(276, 180)">
                          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#3D4656" stroke="#1A202C" strokeWidth="1.5" />
                          <rect x="-14" y="-12" width="28" height="24" rx="2" fill="#00C853" opacity="0.8" />
                        </g>
                      </g>

                      {/* Parison Extrusion Line */}
                      <path
                        ref={parisonRef}
                        d="M710,195 L710,250"
                        fill="none"
                        stroke="#FF8A3D"
                        strokeWidth="10"
                        strokeLinecap="round"
                        opacity="0"
                        filter="url(#cyanGlow)"
                      />

                      {/* High Pressure Air Lines */}
                      <path
                        ref={airPulseRef}
                        d="M380,80 L380,110 M370,95 L390,95"
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0"
                        filter="url(#cyanGlow)"
                      />

                      {/* Ejected Bottles Gravity Drop */}
                      <g id="bottleLeft" ref={bottleLeftRef} opacity="0" transform="translate(0, 0)">
                        <g transform="translate(365, 360)">
                          <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#3DD6E8" stroke="#FFFFFF" strokeWidth="1.5" fillOpacity="0.85" />
                          <rect x="-4" y="-20" width="8" height="5" rx="1" fill="#FFFFFF" />
                        </g>
                      </g>

                      <g id="bottleRight" ref={bottleRightRef} opacity="0" transform="translate(0, 0)">
                        <g transform="translate(395, 360)">
                          <rect x="-8" y="-15" width="16" height="30" rx="4" fill="#3DD6E8" stroke="#FFFFFF" strokeWidth="1.5" fillOpacity="0.85" />
                          <rect x="-4" y="-20" width="8" height="5" rx="1" fill="#FFFFFF" />
                        </g>
                      </g>

                      {/* 5. EXTRUDER UNIT & BARREL */}
                      <rect x="680" y="220" width="260" height="55" rx="6" fill="url(#steelGradVictor)" stroke="#161B24" strokeWidth="2" />
                      <g transform="translate(700, 235)">
                        <rect x="0" y="0" width="210" height="25" rx="3" fill="#202632" />
                        <g id="extruderScrew" ref={extruderScrewRef}>
                          <path
                            d="M0,0 L15,25 M25,0 L40,25 M50,0 L65,25 M75,0 L90,25 M100,0 L115,25 M125,0 L140,25 M150,0 L165,25 M175,0 L190,25 M200,0 L215,25"
                            stroke="#8B96A8"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </g>
                      </g>

                      {/* Stainless Conical Resin Hopper */}
                      <polygon points="860,90 940,90 920,220 880,220" fill="url(#whiteCoverGrad)" stroke="#3A4048" strokeWidth="2" />
                      <circle cx="900" cy="90" r="40" fill="#E2E7EE" stroke="#3A4048" strokeWidth="2" />
                      <circle cx="900" cy="90" r="18" fill="#3DD6E8" opacity="0.85" />
                      <text x="900" y="94" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0E1117">PET</text>

                      {/* Motor Fan Tick */}
                      <g transform="translate(970, 245)">
                        <circle r="18" fill="#181C25" stroke="#3A4048" strokeWidth="2" />
                        <line id="motorTick" ref={motorTickRef} x1="0" y1="0" x2="0" y2="-12" stroke="#00C853" strokeWidth="2.5" strokeLinecap="round" />
                      </g>

                      {/* 6. HMI CONTROL CONSOLE */}
                      <rect x="590" y="300" width="10" height="120" rx="2" fill="url(#steelGradVictor)" stroke="#101319" strokeWidth="1" />
                      <g transform="translate(630, 200)">
                        <rect x="0" y="0" width="80" height="60" rx="4" fill="url(#whiteCoverGrad)" stroke="#252C38" strokeWidth="2" />
                        <rect x="6" y="6" width="68" height="42" rx="2" fill="#0B0E14" />
                        <path d="M10,28 Q25,10 40,32 T70,20" fill="none" stroke="#3DD6E8" strokeWidth="1.5" />
                        <path d="M10,38 Q30,42 50,28 T70,36" fill="none" stroke="#FF8A3D" strokeWidth="1.5" />
                      </g>
                    </svg>

                    {/* Timer HUD Overlay */}
                    <div className="absolute bottom-3 left-3 p-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg z-20 font-['IBM_Plex_Mono']">
                      <div className="text-xl font-bold text-[#3DD6E8]">T- {phaseTimeLeft.toFixed(1)}s</div>
                      <div className="text-[10px] text-zinc-400 font-medium tracking-wider">PHASE TIME REMAINING</div>
                    </div>
                  </div>

                  {/* State Banner */}
                  <div
                    className="mt-3 bg-[#1B1F27] border border-[#2A2F3A] rounded-r-lg p-3 flex flex-col gap-1 transition-all"
                    style={{ borderLeft: `4px solid ${STATES[currentPhase].color}` }}
                  >
                    <div className="flex items-center justify-between text-[11px] font-['IBM_Plex_Mono'] text-zinc-400 uppercase">
                      <span>Phase {currentPhase + 1} of 4</span>
                      <span style={{ color: STATES[currentPhase].color }} className="font-bold">
                        {STATES[currentPhase].label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-['IBM_Plex_Sans']">
                      {STATES[currentPhase].desc}
                    </p>
                  </div>
                </div>

                {/* Cycle Status Phase Track Selector */}
                <div className="bg-[#14171D] rounded-xl border border-[#2A2F3A] p-3 shrink-0">
                  <div className="text-xs text-zinc-400 mb-2 flex items-center justify-between font-bold font-['IBM_Plex_Mono']">
                    <span>SELECT / JUMP TO CYCLE PHASE</span>
                    <span className="text-[#3DD6E8] tracking-wider">
                      {isEmergencyStopped ? 'EMERGENCY STOPPED' : isPlaying ? 'AUTO LOOP ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 h-14">
                    {STATES.map((p, idx) => {
                      const isActive = currentPhase === idx && !isEmergencyStopped;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleJumpToPhase(idx)}
                          className={`flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#3DD6E8]/15 border-[#3DD6E8] text-[#3DD6E8] shadow-[0_0_12px_rgba(61,214,232,0.3)] scale-[1.02]'
                              : 'bg-[#1B1F27] border-[#2A2F3A] text-zinc-400 hover:border-zinc-500'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-zinc-500">0{idx + 1}</span>
                          <span className="text-[11px] font-bold tracking-wider font-['Space_Grotesk'] uppercase">
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR: Live Diagnostics & Machine Metrics */}
              <aside className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
                <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] flex flex-col">
                  <div className="h-8 bg-[#1B1F27] border-b border-[#2A2F3A] flex items-center px-4 text-xs font-bold text-zinc-300 font-['IBM_Plex_Mono']">
                    LIVE DIAGNOSTICS
                  </div>

                  <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1 text-xs font-['IBM_Plex_Sans']">
                    {/* Production Till Mould Connected */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>PRODUCTION TILL MOULD CONNECTED</span>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                          MOULD #{machine.mouldNumber ?? '235'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-[#ffb77d] tracking-tight font-['Space_Grotesk']">
                          149,127
                          <span className="text-xs text-zinc-400 font-normal ml-1.5">PCS</span>
                        </span>
                      </div>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Cavity / Station Count */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>ROTARY STATIONS</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                      <span className="text-3xl font-bold text-white font-['Space_Grotesk']">
                        6 <span className="text-xs text-zinc-400 font-normal">STATIONS</span>
                      </span>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-medium bg-black/40 p-2 rounded border border-white/5 mt-0.5 font-['IBM_Plex_Mono']">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>6 ROTARY CAROUSEL BLOW STATIONS</span>
                      </div>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Cycle Time */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">CYCLE TIME</span>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        9.0 <span className="text-xs text-zinc-400">SEC</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Air Blow Pressure */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>BLOW AIR PRESSURE</span>
                        <Wind className="w-3.5 h-3.5 text-[#3DD6E8]" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        35.0 <span className="text-xs text-zinc-400">BAR</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Parison Extruder Temperature */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>EXTRUDER PARISON TEMP</span>
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        215.0 <span className="text-xs text-zinc-400">°C</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 shrink-0 text-xs font-bold font-['IBM_Plex_Mono']">
                  <button className="bg-[#14171D] hover:bg-[#1B1F27] border-l-2 border-[#ffb77d] border-t border-[#2A2F3A] p-3 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-[#ffb77d]" /> CALIBRATE
                  </button>
                  <button className="bg-[#14171D] hover:bg-[#1B1F27] border-l-2 border-[#ffb77d] border-t border-[#2A2F3A] p-3 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <Flame className="w-4 h-4 text-[#ffb77d]" /> PURGE MAT.
                  </button>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
