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
  Gauge,
  Zap,
} from 'lucide-react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface LtDashboardModalProps {
  machine: MachineInfo;
  onClose: () => void;
}

export const LtDashboardModal: React.FC<LtDashboardModalProps> = ({
  machine,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(3.0);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | '7days' | '30days' | 'lifetime' | 'mould'>('today');
  const [partsProduced, setPartsProduced] = useState<number>(28640);

  // SVG Elements Refs
  const screwGroupRef = useRef<SVGGElement>(null);
  const screwFlightsRef = useRef<SVGGElement>(null);
  const movingPlatenGroupRef = useRef<SVGGElement>(null);
  const ejectorPinsRef = useRef<SVGGElement>(null);
  const partShapeRef = useRef<SVGGElement>(null);
  const droppedProductsRef = useRef<SVGGElement>(null);
  const flowPathRef = useRef<SVGPathElement>(null);
  const cavityWindowRef = useRef<SVGRectElement>(null);
  const pelletsGroupRef = useRef<SVGGElement>(null);

  // Animation Constants
  const PHASE_DURATIONS = [3.0, 2.5, 4.5, 2.4]; // Close, Inject, Cool, Open/Eject
  const TOTAL_CYCLE_TIME = 12.4;

  const STATES = [
    { label: 'Mold Closing & Clamping', color: '#3DD6E8', desc: 'Moving platen advances & toggle linkage locks under 200 Ton force' },
    { label: 'Injection & Packing', color: '#FF8A3D', desc: 'Injection screw advances pushing molten polymer into cavity under 1400 Bar' },
    { label: 'Cooling & Plastifying', color: '#00C853', desc: 'Screw rotates feeding resin pellets while component solidifies inside water channels' },
    { label: 'Mold Opening & Ejection', color: '#A855F7', desc: 'Platen retracts, ejector pins forward & finished plastic part drops to chute' },
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

        // 1. Mold Movement (Movable Platen & Toggle Linkage)
        let platenShift = 0;
        if (pIndex === 0) {
          // Closing: 150px to 0px
          platenShift = (1 - pT) * 140;
        } else if (pIndex === 1 || pIndex === 2) {
          // Fully Closed
          platenShift = 0;
        } else if (pIndex === 3) {
          // Opening: 0px to 140px
          platenShift = pT * 140;
        }

        if (movingPlatenGroupRef.current) {
          movingPlatenGroupRef.current.setAttribute('transform', `translate(${-platenShift}, 0)`);
        }

        // 2. Screw Movement & Rotation
        let screwShift = 0;
        if (pIndex === 1) {
          // Injection forward: 0px to 45px
          screwShift = pT * 45;
        } else if (pIndex === 2) {
          // Plastifying retract: 45px to 0px
          screwShift = (1 - pT) * 45;
        }

        if (screwGroupRef.current) {
          screwGroupRef.current.setAttribute('transform', `translate(${-screwShift}, 0)`);
        }

        // Screw Rotation during Plastifying (Phase 2)
        if (screwFlightsRef.current) {
          if (pIndex === 2) {
            const rotShift = (currentTime * 0.1) % 24;
            screwFlightsRef.current.setAttribute('transform', `translate(${-rotShift}, 0)`);
          }
        }

        // Falling Pellets inside Hopper
        if (pelletsGroupRef.current) {
          pelletsGroupRef.current.style.opacity = pIndex === 2 ? '1' : '0.2';
        }

        // 3. Molten Polymer Flow Path (Phase 1 Injection)
        if (flowPathRef.current && cavityWindowRef.current) {
          if (pIndex === 1) {
            flowPathRef.current.style.opacity = '1';
            cavityWindowRef.current.style.opacity = `${pT}`;
          } else if (pIndex === 2) {
            flowPathRef.current.style.opacity = '0';
            cavityWindowRef.current.style.opacity = '1';
          } else {
            flowPathRef.current.style.opacity = '0';
            cavityWindowRef.current.style.opacity = '0';
          }
        }

        // 4. Molded Part Ejection & Drop (Phase 3)
        if (ejectorPinsRef.current && partShapeRef.current && droppedProductsRef.current) {
          if (pIndex === 3) {
            const pinTravel = Math.min(22, pT * 35);
            ejectorPinsRef.current.setAttribute('transform', `translate(${pinTravel}, 0)`);

            if (pT > 0.4) {
              partShapeRef.current.style.opacity = '0';
              droppedProductsRef.current.style.opacity = '1';
              const dropY = Math.min(130, (pT - 0.4) * 220);
              droppedProductsRef.current.setAttribute('transform', `translate(0, ${dropY})`);

              if (pT > 0.95 && Math.random() < 0.05) {
                setPartsProduced((prev) => prev + 4);
              }
            } else {
              partShapeRef.current.style.opacity = '1';
              droppedProductsRef.current.style.opacity = '0';
            }
          } else if (pIndex === 0 || pIndex === 1 || pIndex === 2) {
            ejectorPinsRef.current.setAttribute('transform', `translate(0, 0)`);
            partShapeRef.current.style.opacity = '0';
            droppedProductsRef.current.style.opacity = '0';
          }
        }
      }

      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, isEmergencyStopped]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0E1116] w-screen h-screen overflow-hidden text-zinc-100 font-['Outfit'] animate-in fade-in duration-200">
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
                <span className="px-2 py-0.5 rounded bg-[#1C6BBF]/30 text-[#3B82F6] text-[10px] font-mono font-bold tracking-wider border border-[#2B80DD]">
                  L&T INJECTION MOULDING
                </span>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-wide">
                  {machine.name} <span className="text-zinc-400 text-xs font-normal">({machine.subTitle})</span>
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-['IBM_Plex_Sans']">
                HIGH TONNAGE HYDRAULIC INJECTION MOULDING PRESS — L&T INDUSTRIAL SERIES
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
              <span className="font-bold text-amber-400">#{machine.mouldNumber ?? '108'}</span>
            </div>
            <div className="bg-[#1B1F27] px-3 py-1.5 rounded-md border border-[#2A2F3A] flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500 font-medium">CLAMP FORCE:</span>
              <span className="font-bold text-emerald-400">200 TONS</span>
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
                <BarChart3 className="w-4 h-4 text-[#3B82F6]" />
              </div>

              {/* Timeframe Selector Cards */}
              <div className="flex flex-col gap-2.5">
                {/* TODAY */}
                <button
                  onClick={() => setActiveTimeframe('today')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${activeTimeframe === 'today'
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                    }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> TODAY'S PRODUCTION
                    </span>
                    <span className="text-emerald-400 font-mono text-[9px]">+14.2%</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                    {partsProduced.toLocaleString()} <span className="text-xs font-normal text-zinc-400">PARTS</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium border-t border-white/5 pt-1 flex justify-between">
                    <span>Target: 32,000 parts</span>
                    <span>Rate: 2,320 PPH</span>
                  </div>
                </button>

                {/* 7 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('7days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${activeTimeframe === '7days'
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                    }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" /> LAST 7 DAYS
                    </span>
                    <span className="text-[#3B82F6] font-mono text-[9px]">WEEKLY</span>
                  </div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    200,480 <span className="text-xs font-normal text-zinc-400">PARTS</span>
                  </div>
                </button>

                {/* 30 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('30days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${activeTimeframe === '30days'
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
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
                    859,200 <span className="text-xs font-normal text-zinc-400">PARTS</span>
                  </div>
                </button>

                {/* LIFETIME PRODUCTION */}
                <button
                  onClick={() => setActiveTimeframe('lifetime')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${activeTimeframe === 'lifetime'
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
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
                    3,420,000 <span className="text-xs font-normal text-zinc-400">PARTS</span>
                  </div>
                </button>

                {/* SINCE MOULD CONNECTED */}
                <button
                  onClick={() => setActiveTimeframe('mould')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${activeTimeframe === 'mould'
                      ? 'bg-gradient-to-br from-amber-500/25 to-orange-600/25 border-[#ffb77d] shadow-[0_0_18px_rgba(255,183,125,0.3)]'
                      : 'bg-gradient-to-br from-[#1B1F27] to-[#14171D] border-amber-500/40 hover:border-amber-400'
                    }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#ffb77d] font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> SINCE MOULD CONNECTED
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px]">
                      MOULD #{machine.mouldNumber ?? '108'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#ffb77d] font-['Space_Grotesk'] tracking-tight">
                    184,320 <span className="text-xs font-normal text-zinc-300">PARTS</span>
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
                className={`w-full py-3 rounded text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border cursor-pointer font-['IBM_Plex_Mono'] ${isEmergencyStopped
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
              {/* L&T Machine Vector Diagram Container */}
              <div className="flex-1 flex flex-col gap-3 relative min-h-[400px]">
                <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] relative overflow-hidden flex flex-col p-4 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]">
                  <div className="h-8 border-b border-[#2A2F3A] flex items-center justify-between text-xs pb-2 mb-2">
                    <span className="text-[#3B82F6] font-bold font-['IBM_Plex_Mono'] flex items-center gap-2">
                      <Activity className="w-4 h-4" /> L&T INJECTION MOULDING CUTAWAY // PHASE {currentPhase + 1} OF 4
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-1.5 bg-[#1B1F27] border border-[#2A2F3A] hover:border-[#3B82F6] text-xs font-['IBM_Plex_Mono'] px-3 py-1 rounded text-white transition-all cursor-pointer"
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
                      aria-label="L&T Injection Moulding Machine"
                    >
                      <defs>
                        {/* L&T Signature Blue Gradients */}
                        <linearGradient id="ltBlueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4499EE" />
                          <stop offset="60%" stopColor="#2B80DD" />
                          <stop offset="100%" stopColor="#1C6BBF" />
                        </linearGradient>
                        <linearGradient id="ltFrameGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#353B47" />
                          <stop offset="50%" stopColor="#242832" />
                          <stop offset="100%" stopColor="#191C23" />
                        </linearGradient>
                        <linearGradient id="steelGradLt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A4B0C2" />
                          <stop offset="50%" stopColor="#6C788A" />
                          <stop offset="100%" stopColor="#3D4554" />
                        </linearGradient>
                        <linearGradient id="silverHopperGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#E2E7EE" />
                          <stop offset="50%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#A0AAB8" />
                        </linearGradient>
                        <linearGradient id="heaterBandGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="50%" stopColor="#D97706" />
                          <stop offset="100%" stopColor="#78350F" />
                        </linearGradient>

                        <filter id="cyanGlowLt" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* 1. Base Ground Plate & Support Feet */}
                      <rect x="60" y="425" width="1080" height="20" rx="4" fill="#14171D" stroke="#0B0D11" strokeWidth="2" />
                      <rect x="110" y="445" width="28" height="15" rx="2" fill="#242832" stroke="#4499EE" strokeWidth="1.5" />
                      <rect x="360" y="445" width="28" height="15" rx="2" fill="#242832" stroke="#4499EE" strokeWidth="1.5" />
                      <rect x="740" y="445" width="28" height="15" rx="2" fill="#242832" stroke="#4499EE" strokeWidth="1.5" />
                      <rect x="1020" y="445" width="28" height="15" rx="2" fill="#242832" stroke="#4499EE" strokeWidth="1.5" />

                      {/* Heavy Charcoal Machine Base Chassis */}
                      <rect x="80" y="280" width="460" height="145" rx="4" fill="url(#ltFrameGrad)" stroke="#11141A" strokeWidth="2" />
                      <rect x="540" y="280" width="580" height="145" rx="4" fill="url(#ltFrameGrad)" stroke="#11141A" strokeWidth="2" />
                      <rect x="550" y="300" width="560" height="110" rx="2" fill="#151820" opacity="0.6" />

                      {/* Collection Chute / Product Bin */}
                      <polygon points="310,340 450,340 470,425 290,425" fill="#0E1116" stroke="#2A2F3A" strokeWidth="1.5" />
                      <text x="380" y="395" textAnchor="middle" fontSize="10" fontWeight="700" fill="#3B82F6" opacity="0.8">
                        PARTS OUTLET CHUTE
                      </text>

                      {/* 2. LEFT SECTION: CLAMPING UNIT & TIE BARS ($x=80$ to $x=520$) */}
                      {/* 4 Heavy Steel Tie Bars */}
                      <rect x="100" y="145" width="420" height="14" rx="3" fill="url(#steelGradLt)" stroke="#1A1E26" strokeWidth="1" />
                      <rect x="100" y="175" width="420" height="14" rx="3" fill="url(#steelGradLt)" stroke="#1A1E26" strokeWidth="1" />
                      <rect x="100" y="240" width="420" height="14" rx="3" fill="url(#steelGradLt)" stroke="#1A1E26" strokeWidth="1" />
                      <rect x="100" y="270" width="420" height="14" rx="3" fill="url(#steelGradLt)" stroke="#1A1E26" strokeWidth="1" />

                      {/* Rear Stationary Die Platen ($x=100-140$) */}
                      <rect x="100" y="130" width="35" height="165" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="2" />
                      <rect x="105" y="140" width="25" height="145" fill="#242832" opacity="0.5" />

                      {/* MOVABLE PLATEN GROUP */}
                      <g id="movingPlatenGroup" ref={movingPlatenGroupRef} transform="translate(0, 0)">
                        {/* Movable Die Platen Body ($x=260-310$) */}
                        <rect x="270" y="130" width="45" height="165" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="2" />

                        {/* Mold Half A (Movable Core Half) */}
                        <rect x="315" y="150" width="55" height="125" rx="3" fill="#2F3644" stroke="#11141A" strokeWidth="2" />

                        {/* Water Cooling Channels inside Mold Core */}
                        <path d="M325,160 L355,160 M325,185 L355,185 M325,210 L355,210 M325,235 L355,235 M325,260 L355,260" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3,3" />

                        {/* Hydraulic Ejector Pin Assembly */}
                        <g id="ejectorPins" ref={ejectorPinsRef} transform="translate(0, 0)">
                          <line x1="280" y1="180" x2="372" y2="180" stroke="#E2E7EE" strokeWidth="3" />
                          <line x1="280" y1="245" x2="372" y2="245" stroke="#E2E7EE" strokeWidth="3" />
                        </g>

                        {/* Molded Plastic Container Shape inside Cavity */}
                        <g id="partShape" ref={partShapeRef} opacity="0">
                          <rect x="370" y="170" width="30" height="85" rx="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      </g>

                      {/* Stationary Front Platen & Mold Half B ($x=400-470$) */}
                      <rect x="420" y="130" width="45" height="165" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="2" />
                      <rect x="370" y="150" width="50" height="125" rx="3" fill="#2F3644" stroke="#11141A" strokeWidth="2" />
                      <path d="M380,160 L410,160 M380,185 L410,185 M380,210 L410,210 M380,235 L410,235 M380,260 L410,260" stroke="#EF4444" strokeWidth="2" strokeDasharray="3,3" />

                      {/* Glowing Cavity Fill Indicator */}
                      <rect ref={cavityWindowRef} x="368" y="168" width="34" height="89" rx="3" fill="#FF8A3D" opacity="0" filter="url(#cyanGlowLt)" />

                      {/* BLUE L&T ENCLOSURE FRAME WITH EXTRA-LARGE OPEN VIEWING WINDOW */}
                      <g id="ltEnclosureFrame">
                        {/* Top Heavy Blue Bezel */}
                        <path d="M135,110 L455,110 L455,148 L135,148 Z" fill="url(#ltBlueGrad)" stroke="#124A8A" strokeWidth="2" />
                        {/* L&T Logo Badge Header */}
                        <rect x="150" y="116" width="290" height="26" rx="3" fill="#1C6BBF" stroke="#0F437B" strokeWidth="1" />
                        <text x="295" y="134" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="900" fontSize="20" fill="#FFFFFF" fontStyle="italic" letterSpacing="2">
                          L&amp;T
                        </text>

                        {/* Left Blue Bezel Margin */}
                        <path d="M135,148 L155,148 L155,275 L135,275 Z" fill="url(#ltBlueGrad)" stroke="#124A8A" strokeWidth="1.5" />
                        {/* Right Blue Bezel Margin */}
                        <path d="M435,148 L455,148 L455,275 L435,275 Z" fill="url(#ltBlueGrad)" stroke="#124A8A" strokeWidth="1.5" />
                        {/* Bottom Blue Bezel Margin */}
                        <path d="M135,275 L455,275 L455,295 L135,295 Z" fill="url(#ltBlueGrad)" stroke="#124A8A" strokeWidth="2" />

                        {/* Large Clear Glass Frame Outline (Exposing internal moulds, water lines & clamping mechanics) */}
                        <rect x="155" y="148" width="280" height="127" rx="3" fill="none" stroke="#2B80DD" strokeWidth="2" />

                        {/* Subtle Glass Sheen Reflection Lines */}
                        <line x1="165" y1="265" x2="425" y2="155" stroke="#FFFFFF" strokeWidth="1" opacity="0.1" />
                        <line x1="180" y1="265" x2="430" y2="160" stroke="#FFFFFF" strokeWidth="1" opacity="0.06" />
                      </g>

                      {/* Dropped Product Physics Shape */}
                      <g id="droppedProducts" ref={droppedProductsRef} opacity="0" transform="translate(0, 0)">
                        <g transform="translate(370, 240)">
                          <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      </g>

                      {/* 3. CENTER SECTION: HOPPER & HEATED BARREL ($x=480-820$) */}
                      {/* Stainless Steel Conical Resin Hopper */}
                      <polygon points="650,55 750,55 720,185 680,185" fill="url(#silverHopperGrad)" stroke="#2B3240" strokeWidth="2" />
                      <ellipse cx="700" cy="55" rx="50" ry="12" fill="#E2E7EE" stroke="#2B3240" strokeWidth="2" />
                      <ellipse cx="700" cy="55" rx="25" ry="6" fill="#3B82F6" opacity="0.8" />
                      <text x="700" y="110" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1C212B">RAW RESIN</text>

                      {/* Resin Pellets inside Hopper Throat */}
                      <g id="pelletsGroup" ref={pelletsGroupRef} opacity="0.2">
                        <circle cx="690" cy="140" r="3" fill="#3B82F6" />
                        <circle cx="705" cy="148" r="3" fill="#3B82F6" />
                        <circle cx="698" cy="162" r="3" fill="#3B82F6" />
                        <circle cx="712" cy="170" r="3" fill="#3B82F6" />
                        <circle cx="688" cy="178" r="3" fill="#3B82F6" />
                      </g>

                      {/* Heated Extrusion Barrel */}
                      <rect x="470" y="195" width="280" height="45" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="2" />

                      {/* 5 Ceramic Heater Bands */}
                      <rect x="480" y="190" width="35" height="55" rx="3" fill="url(#heaterBandGrad)" stroke="#451A03" strokeWidth="1.5" />
                      <rect x="530" y="190" width="35" height="55" rx="3" fill="url(#heaterBandGrad)" stroke="#451A03" strokeWidth="1.5" />
                      <rect x="580" y="190" width="35" height="55" rx="3" fill="url(#heaterBandGrad)" stroke="#451A03" strokeWidth="1.5" />
                      <rect x="630" y="190" width="35" height="55" rx="3" fill="url(#heaterBandGrad)" stroke="#451A03" strokeWidth="1.5" />
                      <rect x="680" y="190" width="35" height="55" rx="3" fill="url(#heaterBandGrad)" stroke="#451A03" strokeWidth="1.5" />

                      {/* Reciprocating Screw Assembly inside Barrel */}
                      <g id="screwGroup" ref={screwGroupRef} transform="translate(0, 0)">
                        <rect x="490" y="208" width="280" height="18" rx="2" fill="#202632" />
                        <g id="screwFlights" ref={screwFlightsRef}>
                          <path
                            d="M490,208 L505,226 M515,208 L530,226 M540,208 L555,226 M565,208 L580,226 M590,208 L605,226 M615,208 L630,226 M640,208 L655,226 M665,208 L680,226 M690,208 L705,226 M715,208 L730,226 M740,208 L755,226"
                            stroke="#8B96A8"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </g>
                      </g>

                      {/* Molten Polymer Injection Nozzle Flow Path */}
                      <path ref={flowPathRef} d="M470,217 L420,217" fill="none" stroke="#FF8A3D" strokeWidth="8" strokeLinecap="round" opacity="0" filter="url(#cyanGlowLt)" />

                      {/* 4. RIGHT SECTION: INJECTION UNIT & HYDRAULIC FEEDER ($x=750-1120$) */}
                      {/* Injection Carriage Unit Base */}
                      <rect x="750" y="170" width="350" height="110" rx="5" fill="url(#ltFrameGrad)" stroke="#11141A" strokeWidth="2" />
                      {/* Top Blue Accent Cover Plate (Matching L&T Image) */}
                      <rect x="770" y="160" width="310" height="40" rx="4" fill="url(#ltBlueGrad)" stroke="#124A8A" strokeWidth="2" />
                      <rect x="800" y="170" width="120" height="20" rx="3" fill="#1C6BBF" />
                      <circle cx="810" cy="180" r="4" fill="#3B82F6" />

                      {/* Rear Dual Hydraulic Cylinders */}
                      <rect x="1000" y="185" width="110" height="28" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="1.5" />
                      <rect x="1000" y="227" width="110" height="28" rx="4" fill="url(#steelGradLt)" stroke="#161920" strokeWidth="1.5" />

                      {/* Curved Black Hydraulic Hoses */}
                      <path d="M1110,199 C1160,190 1160,260 1100,270" fill="none" stroke="#12161E" strokeWidth="7" />
                      <path d="M1110,199 C1160,190 1160,260 1100,270" fill="none" stroke="#2B3240" strokeWidth="2.5" />
                      <path d="M1110,241 C1170,230 1170,300 1080,310" fill="none" stroke="#12161E" strokeWidth="7" />
                      <path d="M1110,241 C1170,230 1170,300 1080,310" fill="none" stroke="#2B3240" strokeWidth="2.5" />

                      {/* Brass Hose Fittings */}
                      <rect x="1105" y="193" width="10" height="12" rx="1" fill="#F59E0B" />
                      <rect x="1105" y="235" width="10" height="12" rx="1" fill="#F59E0B" />

                      {/* FRONT ELECTRICAL & OPERATOR CONTROL PANEL BOX (Matching reference photo layout) */}
                      <rect x="800" y="300" width="220" height="105" rx="5" fill="#242934" stroke="#11141A" strokeWidth="2" />
                      <rect x="810" y="310" width="200" height="35" rx="3" fill="#0B0E14" stroke="#3B82F6" strokeWidth="1" />
                      <text x="910" y="332" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="700" fontSize="13" fill="#3B82F6">
                        L&amp;T INTELLISENSE HMI
                      </text>

                      {/* Pushbutton Console Matrix */}
                      <circle cx="830" cy="365" r="6" fill="#EF4444" />
                      <circle cx="850" cy="365" r="6" fill="#F59E0B" />
                      <circle cx="870" cy="365" r="6" fill="#10B981" />
                      <circle cx="890" cy="365" r="6" fill="#3B82F6" />
                      <rect x="910" y="357" width="80" height="16" rx="3" fill="#353C4A" />
                      <circle cx="975" cy="365" r="5" fill="#EF4444" />

                      <circle cx="830" cy="385" r="5" fill="#D1D5DB" />
                      <circle cx="850" cy="385" r="5" fill="#D1D5DB" />
                      <circle cx="870" cy="385" r="5" fill="#D1D5DB" />
                      <circle cx="890" cy="385" r="5" fill="#D1D5DB" />
                      <rect x="910" y="380" width="80" height="12" rx="2" fill="#1F242D" />
                    </svg>

                    {/* Timer HUD Overlay */}
                    <div className="absolute bottom-3 left-3 p-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg z-20 font-['IBM_Plex_Mono']">
                      <div className="text-xl font-bold text-[#3B82F6]">T- {phaseTimeLeft.toFixed(1)}s</div>
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
                    <span className="text-[#3B82F6] tracking-wider">
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
                          className={`flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer ${isActive
                              ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.3)] scale-[1.02]'
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
                          MOULD #{machine.mouldNumber ?? '108'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-[#ffb77d] tracking-tight font-['Space_Grotesk']">
                          184,320
                          <span className="text-xs text-zinc-400 font-normal ml-1.5">PARTS</span>
                        </span>
                      </div>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Cavity Count */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>MOULD CAVITIES</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                      <span className="text-3xl font-bold text-white font-['Space_Grotesk']">
                        {machine.cavity ?? 4} <span className="text-xs text-zinc-400 font-normal">CAVITIES</span>
                      </span>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-medium bg-black/40 p-2 rounded border border-white/5 mt-0.5 font-['IBM_Plex_Mono']">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>CAVITY COUNT: {machine.cavity ?? 4} OPERATIONAL MOULD CAVITIES</span>
                      </div>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Cycle Time */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">CYCLE TIME</span>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        12.4 <span className="text-xs text-zinc-400">SEC</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Clamping Force */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>CLAMPING FORCE</span>
                        <Gauge className="w-3.5 h-3.5 text-[#3B82F6]" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        200 <span className="text-xs text-zinc-400">TONS</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Injection Pressure */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>INJECTION PRESSURE</span>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        1,400 <span className="text-xs text-zinc-400">BAR</span>
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
  );
};
