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
  Zap,
  Wind,
} from 'lucide-react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface VaibhavDashboardModalProps {
  machine: MachineInfo;
  onClose: () => void;
}

export const VaibhavDashboardModal: React.FC<VaibhavDashboardModalProps> = ({
  machine,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(2.5);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | '7days' | '30days' | 'lifetime' | 'mould'>('today');
  const [bottlesProduced, setBottlesProduced] = useState<number>(18650);

  // SVG Elements Refs
  const extruderScrewRef = useRef<SVGGElement>(null);
  const parisonTubeRef = useRef<SVGPathElement>(null);
  const leftMoldHalfRef = useRef<SVGGElement>(null);
  const rightMoldHalfRef = useRef<SVGGElement>(null);
  const blowPinRef = useRef<SVGGElement>(null);
  const airPulseRef = useRef<SVGPathElement>(null);
  const bottleShapeRef = useRef<SVGGElement>(null);
  const droppedBottleRef = useRef<SVGGElement>(null);
  const pelletsGroupRef = useRef<SVGGElement>(null);
  const motorTickRef = useRef<SVGCircleElement>(null);

  // Animation Constants
  const PHASE_DURATIONS = [2.5, 1.8, 3.2, 2.0]; // Extrude, Clamp, Blow, Eject
  const TOTAL_CYCLE_TIME = 9.5;

  const STATES = [
    { label: 'Parison Tube Extrusion', color: '#FF6B00', desc: 'Extruding molten tubular polymer parison down from accumulator die head' },
    { label: 'Mold Halves Clamping', color: '#3DD6E8', desc: 'Hydraulic platen clamps mold shut around parison, pinching bottom seal' },
    { label: 'High Pressure Blow & Cool', color: '#00C853', desc: 'Blow pin fires down driving 30 Bar chilled compressed air expanding hollow bottle' },
    { label: 'Mold Release & Ejection', color: '#A855F7', desc: 'Mold opens, blow pin retracts, and finished hollow bottle ejects into chute' },
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

  // Easing helper
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Simulation Loop
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
        const et = ease(pT);

        // 1. PARISON EXTENDED TUBE (Phase 0 Extrusion)
        if (parisonTubeRef.current) {
          if (pIndex === 0) {
            parisonTubeRef.current.style.opacity = '1';
            const tubeLength = lerp(10, 160, et);
            parisonTubeRef.current.setAttribute('d', `M400,140 L400,${140 + tubeLength}`);
          } else if (pIndex === 1 || pIndex === 2) {
            parisonTubeRef.current.style.opacity = '1';
            parisonTubeRef.current.setAttribute('d', 'M400,140 L400,300');
          } else {
            parisonTubeRef.current.style.opacity = '0';
          }
        }

        // 2. MOLD HALVES CLAMPING (Phase 1 Clamping, 2 Blowing)
        let moldShift = 90; // Open = 90px apart, Closed = 0px
        if (pIndex === 0) {
          moldShift = 90;
        } else if (pIndex === 1) {
          moldShift = lerp(90, 0, et);
        } else if (pIndex === 2) {
          moldShift = 0;
        } else if (pIndex === 3) {
          moldShift = lerp(0, 90, et);
        }

        if (leftMoldHalfRef.current) {
          leftMoldHalfRef.current.setAttribute('transform', `translate(${-moldShift}, 0)`);
        }
        if (rightMoldHalfRef.current) {
          rightMoldHalfRef.current.setAttribute('transform', `translate(${moldShift}, 0)`);
        }

        // 3. BLOW PIN DOWN STROKE & AIR EXPANSION (Phase 2 Blowing)
        if (blowPinRef.current) {
          if (pIndex === 2) {
            const pinY = Math.min(45, pT * 70);
            blowPinRef.current.setAttribute('transform', `translate(0, ${pinY})`);
          } else {
            blowPinRef.current.setAttribute('transform', 'translate(0, 0)');
          }
        }

        if (airPulseRef.current) {
          if (pIndex === 2) {
            airPulseRef.current.style.opacity = `${0.3 + 0.7 * Math.sin(pT * Math.PI * 4)}`;
          } else {
            airPulseRef.current.style.opacity = '0';
          }
        }

        // Bottle shape inside mold
        if (bottleShapeRef.current) {
          if (pIndex === 2) {
            bottleShapeRef.current.style.opacity = `${pT}`;
            bottleShapeRef.current.setAttribute('transform', 'scale(1, 1)');
          } else if (pIndex === 3 && pT < 0.5) {
            bottleShapeRef.current.style.opacity = '1';
          } else {
            bottleShapeRef.current.style.opacity = '0';
          }
        }

        // 4. BOTTLE EJECTION & DROP PHYSICS (Phase 3 Ejection)
        if (droppedBottleRef.current) {
          if (pIndex === 3 && pT >= 0.4) {
            droppedBottleRef.current.style.opacity = '1';
            const dropT = (pT - 0.4) / 0.6;
            const dropY = dropT * dropT * 135;
            const rot = (dropT - 0.5) * 30;
            droppedBottleRef.current.setAttribute('transform', `translate(0, ${dropY}) rotate(${rot})`);

            if (pT > 0.95 && Math.random() < 0.05) {
              setBottlesProduced((prev) => prev + 2);
            }
          } else {
            droppedBottleRef.current.style.opacity = '0';
            droppedBottleRef.current.setAttribute('transform', 'translate(0,0)');
          }
        }

        // Extruder screw rotation & pellet feed
        if (extruderScrewRef.current) {
          if (pIndex === 0 || pIndex === 2) {
            const rot = (currentTime * 0.1) % 24;
            extruderScrewRef.current.setAttribute('transform', `translate(0, ${rot})`);
          }
        }

        if (pelletsGroupRef.current) {
          pelletsGroupRef.current.style.opacity = pIndex === 0 ? '1' : '0.3';
        }

        if (motorTickRef.current) {
          const angle = (currentTime * 0.4) % 360;
          motorTickRef.current.setAttribute('transform', `rotate(${angle}, 220, 75)`);
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
                <span className="px-2 py-0.5 rounded bg-orange-600/30 text-orange-400 text-[10px] font-mono font-bold tracking-wider border border-orange-500/40">
                  VAIBHAV BLOW MOULDING
                </span>
                <h1 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-wide">
                  {machine.name} <span className="text-zinc-400 text-xs font-normal">({machine.subTitle})</span>
                </h1>
              </div>
              <p className="text-[11px] text-zinc-400 font-['IBM_Plex_Sans']">
                HIGH SPEED AUTOMATIC EXTRUSION BLOW MOULDING PRESS — VAIBHAV INSTRUMENTATION SERIES
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
              <span className="font-bold text-amber-400">#{machine.mouldNumber ?? '204'}</span>
            </div>
            <div className="bg-[#1B1F27] px-3 py-1.5 rounded-md border border-[#2A2F3A] flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500 font-medium">BLOW PRESSURE:</span>
              <span className="font-bold text-emerald-400">30 BAR</span>
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
                <BarChart3 className="w-4 h-4 text-orange-500" />
              </div>

              {/* Timeframe Selector Cards */}
              <div className="flex flex-col gap-2.5">
                {/* TODAY */}
                <button
                  onClick={() => setActiveTimeframe('today')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === 'today'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> TODAY'S PRODUCTION
                    </span>
                    <span className="text-emerald-400 font-mono text-[9px]">+16.8%</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                    {bottlesProduced.toLocaleString()} <span className="text-xs font-normal text-zinc-400">BOTTLES</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium border-t border-white/5 pt-1 flex justify-between">
                    <span>Target: 22,000 bottles</span>
                    <span>Rate: 1,840 BPH</span>
                  </div>
                </button>

                {/* 7 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('7days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === '7days'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                      : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-zinc-500 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" /> LAST 7 DAYS
                    </span>
                    <span className="text-orange-400 font-mono text-[9px]">WEEKLY</span>
                  </div>
                  <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                    128,400 <span className="text-xs font-normal text-zinc-400">BOTTLES</span>
                  </div>
                </button>

                {/* 30 DAYS */}
                <button
                  onClick={() => setActiveTimeframe('30days')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === '30days'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'
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
                    540,900 <span className="text-xs font-normal text-zinc-400">BOTTLES</span>
                  </div>
                </button>

                {/* LIFETIME PRODUCTION */}
                <button
                  onClick={() => setActiveTimeframe('lifetime')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    activeTimeframe === 'lifetime'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'
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
                    2,180,000 <span className="text-xs font-normal text-zinc-400">BOTTLES</span>
                  </div>
                </button>

                {/* SINCE MOULD CONNECTED */}
                <button
                  onClick={() => setActiveTimeframe('mould')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${
                    activeTimeframe === 'mould'
                      ? 'bg-gradient-to-br from-orange-500/25 to-amber-600/25 border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.3)]'
                      : 'bg-gradient-to-br from-[#1B1F27] to-[#14171D] border-orange-500/40 hover:border-orange-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-orange-300 font-['IBM_Plex_Mono']">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> SINCE MOULD CONNECTED
                    </span>
                    <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded text-[9px]">
                      MOULD #{machine.mouldNumber ?? '204'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-300 font-['Space_Grotesk'] tracking-tight">
                    114,800 <span className="text-xs font-normal text-zinc-300">BOTTLES</span>
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
              {/* Vaibhav Machine Vector Diagram Container */}
              <div className="flex-1 flex flex-col gap-3 relative min-h-[400px]">
                <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] relative overflow-hidden flex flex-col p-4 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]">
                  <div className="h-8 border-b border-[#2A2F3A] flex items-center justify-between text-xs pb-2 mb-2">
                    <span className="text-orange-400 font-bold font-['IBM_Plex_Mono'] flex items-center gap-2">
                      <Activity className="w-4 h-4" /> VAIBHAV BLOW MOULDING CUTAWAY // PHASE {currentPhase + 1} OF 4
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex items-center gap-1.5 bg-[#1B1F27] border border-[#2A2F3A] hover:border-orange-500 text-xs font-['IBM_Plex_Mono'] px-3 py-1 rounded text-white transition-all cursor-pointer"
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
                      aria-label="Vaibhav Blow Moulding Machine"
                    >
                      <defs>
                        {/* Vaibhav Industrial Orange & Charcoal Gradients */}
                        <linearGradient id="vaibhavOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF7A18" />
                          <stop offset="60%" stopColor="#E65100" />
                          <stop offset="100%" stopColor="#B23C00" />
                        </linearGradient>
                        <linearGradient id="vaibhavFrameGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#383E4B" />
                          <stop offset="50%" stopColor="#252A34" />
                          <stop offset="100%" stopColor="#1A1E26" />
                        </linearGradient>
                        <linearGradient id="steelGradVb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A8B4C4" />
                          <stop offset="50%" stopColor="#707C8E" />
                          <stop offset="100%" stopColor="#404958" />
                        </linearGradient>
                        <linearGradient id="hopperGradVb" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#E4E9F0" />
                          <stop offset="50%" stopColor="#FFFFFF" />
                          <stop offset="100%" stopColor="#A4AEBC" />
                        </linearGradient>

                        <filter id="orangeGlowVb" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        <filter id="airGlowVb" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* 1. Base Support Structure & Machine Chassis */}
                      <rect x="60" y="425" width="1080" height="20" rx="4" fill="#14171D" stroke="#0B0D11" strokeWidth="2" />
                      <rect x="120" y="445" width="28" height="15" rx="2" fill="#252A34" stroke="#FF7A18" strokeWidth="1.5" />
                      <rect x="580" y="445" width="28" height="15" rx="2" fill="#252A34" stroke="#FF7A18" strokeWidth="1.5" />
                      <rect x="1020" y="445" width="28" height="15" rx="2" fill="#252A34" stroke="#FF7A18" strokeWidth="1.5" />

                      {/* Machine Frame Base */}
                      <rect x="80" y="310" width="1040" height="115" rx="4" fill="url(#vaibhavFrameGrad)" stroke="#11141A" strokeWidth="2" />

                      {/* Discharge Chute for Ejected Bottles */}
                      <polygon points="320,330 480,330 500,420 300,420" fill="#0E1116" stroke="#2A2F3A" strokeWidth="1.5" />
                      <text x="400" y="380" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FF7A18" opacity="0.9">
                        BOTTLE COLLECTION CHUTE
                      </text>

                      {/* 2. TOP VERTICAL EXTRUDER & HOPPER ($x=120-280$, $y=30-310$) */}
                      {/* Hopper */}
                      <polygon points="170,30 270,30 240,110 200,110" fill="url(#hopperGradVb)" stroke="#252A34" strokeWidth="2" />
                      <ellipse cx="220" cy="30" rx="50" ry="10" fill="#E4E9F0" stroke="#252A34" strokeWidth="2" />
                      <ellipse cx="220" cy="30" rx="25" ry="5" fill="#FF7A18" opacity="0.8" />
                      <text x="220" y="70" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1A1E26">PET RESIN</text>

                      {/* Pellets */}
                      <g id="pelletsGroup" ref={pelletsGroupRef} opacity="0.3">
                        <circle cx="210" cy="85" r="3" fill="#FF7A18" />
                        <circle cx="225" cy="92" r="3" fill="#FF7A18" />
                        <circle cx="218" cy="100" r="3" fill="#FF7A18" />
                      </g>

                      {/* Vertical Screw Extruder Barrel */}
                      <rect x="200" y="110" width="40" height="170" rx="3" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="2" />
                      <rect x="195" y="125" width="50" height="25" rx="2" fill="url(#vaibhavOrangeGrad)" />
                      <rect x="195" y="165" width="50" height="25" rx="2" fill="url(#vaibhavOrangeGrad)" />
                      <rect x="195" y="205" width="50" height="25" rx="2" fill="url(#vaibhavOrangeGrad)" />

                      {/* Extruder Motor Drive Top */}
                      <circle cx="220" cy="75" r="14" fill="#1B1F27" stroke="#FF7A18" strokeWidth="2" />
                      <circle ref={motorTickRef} cx="220" cy="75" r="10" fill="none" stroke="#FF7A18" strokeWidth="3" strokeDasharray="6,6" />

                      {/* 3. CENTER ACCUMULATOR DIE HEAD & BLOW PIN ($x=330-470$, $y=70-320$) */}
                      {/* Top Cross Carriage Bridge */}
                      <rect x="235" y="130" width="165" height="25" rx="3" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="2" />

                      {/* Vertical Accumulation Die Head */}
                      <rect x="365" y="70" width="70" height="70" rx="4" fill="url(#vaibhavOrangeGrad)" stroke="#11141A" strokeWidth="2" />
                      <text x="400" y="110" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF" fontStyle="italic">DIE HEAD</text>

                      {/* Pneumatic Blow Pin Cylinder Top */}
                      <rect x="385" y="20" width="30" height="50" rx="3" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="1.5" />
                      <line x1="400" y1="20" x2="400" y2="70" stroke="#3B82F6" strokeWidth="4" />

                      {/* Pneumatic Blow Pin Assembly (Moves Down in Phase 2) */}
                      <g id="blowPin" ref={blowPinRef} transform="translate(0, 0)">
                        <rect x="393" y="135" width="14" height="60" rx="2" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="1" />
                        <polygon points="393,195 407,195 402,210 398,210" fill="#F59E0B" />
                      </g>

                      {/* Molten Tube Parison Extrusion */}
                      <path
                        ref={parisonTubeRef}
                        d="M400,140 L400,300"
                        fill="none"
                        stroke="#FF7A18"
                        strokeWidth="16"
                        strokeLinecap="round"
                        opacity="0"
                        filter="url(#orangeGlowVb)"
                      />

                      {/* 4. BLOW MOULD HALVES (LEFT & RIGHT CLAMPING UNITS) ($x=260-540$) */}
                      {/* Left Mold Half Assembly (Slides in Phase 1) */}
                      <g id="leftMoldHalf" ref={leftMoldHalfRef} transform="translate(-90, 0)">
                        <rect x="250" y="170" width="130" height="140" rx="4" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="2" />
                        {/* Inner Bottle Cavity Cutout */}
                        <path d="M380,180 C360,180 340,195 340,240 C340,285 360,300 380,300 Z" fill="#1C212B" stroke="#FF7A18" strokeWidth="1.5" />
                        {/* Cooling Water Line Pipes */}
                        <line x1="260" y1="190" x2="330" y2="190" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4,3" />
                        <line x1="260" y1="240" x2="330" y2="240" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4,3" />
                        <line x1="260" y1="290" x2="330" y2="290" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4,3" />
                      </g>

                      {/* Right Mold Half Assembly (Slides in Phase 1) */}
                      <g id="rightMoldHalf" ref={rightMoldHalfRef} transform="translate(90, 0)">
                        <rect x="420" y="170" width="130" height="140" rx="4" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="2" />
                        {/* Inner Bottle Cavity Cutout */}
                        <path d="M420,180 C440,180 460,195 460,240 C460,285 440,300 420,300 Z" fill="#1C212B" stroke="#FF7A18" strokeWidth="1.5" />
                        {/* Cooling Water Line Pipes */}
                        <line x1="470" y1="190" x2="540" y2="190" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="4,3" />
                        <line x1="470" y1="240" x2="540" y2="240" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="4,3" />
                        <line x1="470" y1="290" x2="540" y2="290" stroke="#EF4444" strokeWidth="2.5" strokeDasharray="4,3" />
                      </g>

                      {/* Air Expansion Pulse Wave (Phase 2) */}
                      <path
                        ref={airPulseRef}
                        d="M400,200 C370,200 350,220 350,240 C350,260 370,280 400,280 C430,280 450,260 450,240 C450,220 430,200 400,200 Z"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="5"
                        opacity="0"
                        filter="url(#airGlowVb)"
                      />

                      {/* Formed Hollow Bottle inside Cavity */}
                      <g id="bottleShape" ref={bottleShapeRef} opacity="0">
                        <path
                          d="M392,185 L408,185 L412,205 C425,215 430,230 430,260 C430,285 422,295 415,295 L385,295 C378,295 370,285 370,260 C370,230 375,215 388,205 Z"
                          fill="#38BDF8"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          opacity="0.9"
                        />
                      </g>

                      {/* Ejected Dropped Bottle Physics */}
                      <g id="droppedBottle" ref={droppedBottleRef} opacity="0" transform="translate(0, 0)">
                        <g transform="translate(400, 260)">
                          <path
                            d="M-8,-40 L8,-40 L12,-20 C25,-10 30,5 30,35 C30,60 22,70 15,70 L-15,70 C-22,70 -30,60 -30,35 C-30,5 -25,-10 -12,-20 Z"
                            fill="#38BDF8"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        </g>
                      </g>

                      {/* 5. RIGHT SECTION: CONTROL PANEL & PNEUMATIC MANIFOLD ($x=600-1120$) */}
                      {/* Hydraulic Clamping Cylinder Rails */}
                      <rect x="570" y="210" width="220" height="20" rx="3" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="1.5" />
                      <rect x="570" y="250" width="220" height="20" rx="3" fill="url(#steelGradVb)" stroke="#11141A" strokeWidth="1.5" />

                      {/* Main Hydraulic Actuator Cylinder */}
                      <rect x="760" y="190" width="120" height="100" rx="5" fill="url(#vaibhavFrameGrad)" stroke="#11141A" strokeWidth="2" />
                      <rect x="770" y="200" width="100" height="20" rx="2" fill="url(#vaibhavOrangeGrad)" />
                      <text x="820" y="214" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFFFFF">CLAMP ACTUATOR</text>

                      {/* Vaibhav Industrial HMI Control Station */}
                      <rect x="900" y="150" width="200" height="150" rx="6" fill="#252A34" stroke="#11141A" strokeWidth="2" />
                      <rect x="910" y="160" width="180" height="50" rx="4" fill="#0E1116" stroke="#FF7A18" strokeWidth="1.5" />
                      <text x="1000" y="190" textAnchor="middle" fontFamily="Space Grotesk" fontWeight="800" fontSize="14" fill="#FF7A18">
                        VAIBHAV BM TOUCH
                      </text>

                      {/* Control Panel Buttons */}
                      <circle cx="930" cy="235" r="7" fill="#EF4444" />
                      <circle cx="955" cy="235" r="7" fill="#F59E0B" />
                      <circle cx="980" cy="235" r="7" fill="#10B981" />
                      <circle cx="1005" cy="235" r="7" fill="#3B82F6" />
                      <rect x="1025" cy="227" width="55" height="16" rx="3" fill="#383E4B" />

                      <circle cx="930" cy="260" r="6" fill="#D1D5DB" />
                      <circle cx="955" cy="260" r="6" fill="#D1D5DB" />
                      <circle cx="980" cy="260" r="6" fill="#D1D5DB" />
                      <circle cx="1005" cy="260" r="6" fill="#D1D5DB" />
                      <rect x="1025" cy="254" width="55" height="12" rx="2" fill="#1A1E26" />
                    </svg>

                    {/* Timer HUD Overlay */}
                    <div className="absolute bottom-3 left-3 p-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg z-20 font-['IBM_Plex_Mono']">
                      <div className="text-xl font-bold text-orange-400">T- {phaseTimeLeft.toFixed(1)}s</div>
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
                    <span className="text-orange-400 tracking-wider">
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
                              ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)] scale-[1.02]'
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
                          MOULD #{machine.mouldNumber ?? '204'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-orange-400 tracking-tight font-['Space_Grotesk']">
                          114,800
                          <span className="text-xs text-zinc-400 font-normal ml-1.5">BOTTLES</span>
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
                        {machine.cavity ?? 2} <span className="text-xs text-zinc-400 font-normal">CAVITIES</span>
                      </span>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-medium bg-black/40 p-2 rounded border border-white/5 mt-0.5 font-['IBM_Plex_Mono']">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>CAVITY COUNT: {machine.cavity ?? 2} OPERATIONAL BLOW CAVITIES</span>
                      </div>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Cycle Time */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">CYCLE TIME</span>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        9.5 <span className="text-xs text-zinc-400">SEC</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Blow Pressure */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>BLOW AIR PRESSURE</span>
                        <Wind className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        30 <span className="text-xs text-zinc-400">BAR</span>
                      </span>
                    </div>

                    <hr className="border-[#2A2F3A]" />

                    {/* Extruder Speed */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                        <span>EXTRUDER SCREW SPEED</span>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                        45 <span className="text-xs text-zinc-400">RPM</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 shrink-0 text-xs font-bold font-['IBM_Plex_Mono']">
                  <button className="bg-[#14171D] hover:bg-[#1B1F27] border-l-2 border-orange-500 border-t border-[#2A2F3A] p-3 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <RotateCcw className="w-4 h-4 text-orange-400" /> CALIBRATE
                  </button>
                  <button className="bg-[#14171D] hover:bg-[#1B1F27] border-l-2 border-orange-500 border-t border-[#2A2F3A] p-3 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer">
                    <Flame className="w-4 h-4 text-orange-400" /> PURGE MAT.
                  </button>
                </div>
              </aside>
            </div>
          </main>
        </div>
    </div>
  );
};
