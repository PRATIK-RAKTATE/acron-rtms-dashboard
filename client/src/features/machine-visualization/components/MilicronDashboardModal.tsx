import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Flame,
  RotateCcw,
  Sparkles,
  Layers,
  Settings,
  BarChart3,
  TrendingUp,
  Calendar,
  Award,
  Play,
  Pause,
  Activity,
} from 'lucide-react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface MilicronDashboardModalProps {
  machine: MachineInfo;
  onClose: () => void;
}

export const MilicronDashboardModal: React.FC<MilicronDashboardModalProps> = ({
  machine,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(3.0);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeTimeframe, setActiveTimeframe] = useState<'today' | '7days' | '30days' | 'lifetime' | 'mould'>('today');

  // SVG Elements Refs
  const screwGroupRef = useRef<SVGGElement>(null);
  const screwFlightsRef = useRef<SVGGElement>(null);
  const movingPlatenGroupRef = useRef<SVGGElement>(null);
  const ejectorPinsRef = useRef<SVGGElement>(null);
  const partShapeRef = useRef<SVGGElement>(null);
  const product1Ref = useRef<SVGGElement>(null);
  const product2Ref = useRef<SVGGElement>(null);
  const product3Ref = useRef<SVGGElement>(null);
  const product4Ref = useRef<SVGGElement>(null);
  const product5Ref = useRef<SVGGElement>(null);
  const product6Ref = useRef<SVGGElement>(null);
  const product7Ref = useRef<SVGGElement>(null);
  const product8Ref = useRef<SVGGElement>(null);
  const flowPathRef = useRef<SVGPathElement>(null);
  const cavityWindowRef = useRef<SVGRectElement>(null);
  const pelletsGroupRef = useRef<SVGGElement>(null);
  const motorTickRef = useRef<SVGLineElement>(null);

  // States timing definitions
  const STATES = [
    {
      key: 'clampClose',
      label: 'Clamp close',
      duration: 2500,
      color: '#3DD6E8',
      desc: 'The moving platen advances along the tie bars inside the ELEKTRON 110 clamp unit, locking the mold under full tonnage.',
    },
    {
      key: 'injection',
      label: 'Injection feed',
      duration: 2800,
      color: '#FF6B35',
      desc: 'The electric servo drive forces the reciprocating screw forward, driving molten polymer through the nozzle into the sealed mold cavity.',
    },
    {
      key: 'refilling',
      label: 'Refilling',
      duration: 3500,
      color: '#F2B705',
      desc: 'Fresh resin pellets drop from the hopper while the screw rotates and retracts, preparing plasticized melt for the next shot.',
    },
    {
      key: 'clampOpen',
      label: 'Clamp open',
      duration: 2600,
      color: '#3DD6E8',
      desc: 'The safety door viewport reveals the moving platen retracting as ejector pins strip the finished component from the core.',
    },
  ];

  // Populate screw flights SVG paths once mounted
  useEffect(() => {
    if (screwFlightsRef.current && screwFlightsRef.current.children.length === 0) {
      const fragment = document.createDocumentFragment();
      for (let x = 650; x <= 880; x += 18) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x));
        line.setAttribute('y1', '182');
        line.setAttribute('x2', String(x + 18));
        line.setAttribute('y2', '208');
        line.setAttribute('stroke', '#7A8290');
        line.setAttribute('stroke-width', '3');
        fragment.appendChild(line);
      }
      screwFlightsRef.current.appendChild(fragment);
    }
  }, []);

  // Main animation loop
  useEffect(() => {
    let animationFrameId: number;
    let stateIndex = currentPhase;
    let simTime = 0;
    let lastFrame = performance.now();
    let stateStart = 0;

    const CLOSED_OFFSET = 0;
    const OPEN_OFFSET = 110;
    const SCREW_FORWARD = 45;
    const EJECT_OFFSET = -20;
    const FALL_DISTANCE = 150;

    const MOLTEN = [255, 107, 53];
    const COOLED = [107, 140, 174];

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const lerpColor = (c1: number[], c2: number[], t: number) =>
      `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(
        lerp(c1[2], c2[2], t)
      )})`;

    const loop = (now: number) => {
      const dt = Math.min(now - lastFrame, 50);
      lastFrame = now;

      if (isPlaying && !isEmergencyStopped) {
        simTime += dt;
      }

      const currentState = STATES[stateIndex];
      const elapsed = simTime - stateStart;
      const t = clamp01(elapsed / currentState.duration);
      const remainingSec = Math.max(0, (currentState.duration - elapsed) / 1000);
      setPhaseTimeLeft(remainingSec);

      const et = ease(t);
      let platenOffset = CLOSED_OFFSET;

      // Render Visual Elements based on state
        const resetProducts = () => {
          [product1Ref, product2Ref, product3Ref, product4Ref, product5Ref, product6Ref, product7Ref, product8Ref].forEach(ref => {
            if (ref.current) ref.current.setAttribute('transform', 'translate(0,0) rotate(0)');
          });
        };

        if (currentState.key === 'clampClose') {
          platenOffset = lerp(OPEN_OFFSET, CLOSED_OFFSET, et);
          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('opacity', '0');
            partShapeRef.current.setAttribute('transform', 'translate(0,0)');
            partShapeRef.current.setAttribute('fill', `rgb(${MOLTEN.join(',')})`);
            partShapeRef.current.classList.remove('molten-glow');
          }
          if (screwGroupRef.current) screwGroupRef.current.setAttribute('transform', 'translate(0,0)');
          if (flowPathRef.current) flowPathRef.current.setAttribute('stroke-dashoffset', '200');
          if (ejectorPinsRef.current) ejectorPinsRef.current.setAttribute('transform', 'translate(0,0)');
          resetProducts();

          if (screwFlightsRef.current) screwFlightsRef.current.classList.remove('rotating');
          if (pelletsGroupRef.current) pelletsGroupRef.current.classList.remove('falling');
          if (motorTickRef.current) motorTickRef.current.classList.remove('spinning');

        } else if (currentState.key === 'injection') {
          platenOffset = CLOSED_OFFSET;
          const screwX = lerp(0, -SCREW_FORWARD, et);
          if (screwGroupRef.current) screwGroupRef.current.setAttribute('transform', `translate(${screwX},0)`);

          const flowT = clamp01((t - 0.05) / 0.45);
          if (flowPathRef.current) {
            flowPathRef.current.setAttribute('stroke-dashoffset', String(lerp(200, 0, ease(flowT))));
          }

          const fillT = clamp01((t - 0.35) / 0.6);
          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('transform', 'translate(0,0)');
            partShapeRef.current.setAttribute('opacity', String(ease(fillT)));
            partShapeRef.current.setAttribute('fill', `rgb(${MOLTEN.join(',')})`);
            partShapeRef.current.classList.add('molten-glow');
          }
          if (ejectorPinsRef.current) ejectorPinsRef.current.setAttribute('transform', 'translate(0,0)');
          resetProducts();

          if (screwFlightsRef.current) screwFlightsRef.current.classList.remove('rotating');
          if (pelletsGroupRef.current) pelletsGroupRef.current.classList.remove('falling');
          if (motorTickRef.current) motorTickRef.current.classList.remove('spinning');

        } else if (currentState.key === 'refilling') {
          platenOffset = CLOSED_OFFSET;
          const screwXr = lerp(-SCREW_FORWARD, 0, et);
          if (screwGroupRef.current) screwGroupRef.current.setAttribute('transform', `translate(${screwXr},0)`);
          if (flowPathRef.current) flowPathRef.current.setAttribute('stroke-dashoffset', '200');

          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('transform', 'translate(0,0)');
            partShapeRef.current.setAttribute('opacity', '1');
            partShapeRef.current.setAttribute('fill', lerpColor(MOLTEN, COOLED, et));
            if (t >= 0.4) partShapeRef.current.classList.remove('molten-glow');
          }
          if (ejectorPinsRef.current) ejectorPinsRef.current.setAttribute('transform', 'translate(0,0)');
          resetProducts();

        // Enable rotating flights & dropping pellets
        if (screwFlightsRef.current) screwFlightsRef.current.classList.add('rotating');
        if (pelletsGroupRef.current) pelletsGroupRef.current.classList.add('falling');
        if (motorTickRef.current) motorTickRef.current.classList.add('spinning');

      } else if (currentState.key === 'clampOpen') {
        if (flowPathRef.current) flowPathRef.current.setAttribute('stroke-dashoffset', '200');
        if (screwGroupRef.current) screwGroupRef.current.setAttribute('transform', 'translate(0,0)');

        if (screwFlightsRef.current) screwFlightsRef.current.classList.remove('rotating');
        if (pelletsGroupRef.current) pelletsGroupRef.current.classList.remove('falling');
        if (motorTickRef.current) motorTickRef.current.classList.remove('spinning');

        if (partShapeRef.current) partShapeRef.current.classList.remove('molten-glow');

        if (t < 0.5) {
          const openT = ease(t / 0.5);
          platenOffset = lerp(CLOSED_OFFSET, OPEN_OFFSET, openT);
          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('transform', `translate(${-platenOffset},0)`);
            partShapeRef.current.setAttribute('opacity', '1');
            partShapeRef.current.setAttribute('fill', `rgb(${COOLED.join(',')})`);
          }
          if (ejectorPinsRef.current) ejectorPinsRef.current.setAttribute('transform', 'translate(0,0)');
          resetProducts();
        } else if (t < 0.68) {
          platenOffset = OPEN_OFFSET;
          const fireT = ease(clamp01((t - 0.5) / 0.18));
          if (ejectorPinsRef.current) {
            ejectorPinsRef.current.setAttribute('transform', `translate(${EJECT_OFFSET * fireT},0)`);
          }
          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('transform', `translate(${-OPEN_OFFSET},0)`);
            partShapeRef.current.setAttribute('opacity', '1');
          }
          resetProducts();
        } else {
          platenOffset = OPEN_OFFSET;
          const retractT = clamp01((t - 0.68) / 0.12);
          if (ejectorPinsRef.current) {
            ejectorPinsRef.current.setAttribute('transform', `translate(${EJECT_OFFSET * (1 - ease(retractT))},0)`);
          }

          // Overall part group opacity fade out at end of chute drop
          const fadeT = clamp01((t - 0.92) / 0.08);
          if (partShapeRef.current) {
            partShapeRef.current.setAttribute('transform', `translate(${-OPEN_OFFSET},0)`);
            partShapeRef.current.setAttribute('opacity', String(1 - ease(fadeT)));
          }

          // Staggered downward gravity drop into machine base chute for each of the 8 items (straight down only)
          const products = [
            { ref: product4Ref, startT: 0.68 },
            { ref: product8Ref, startT: 0.69 },
            { ref: product3Ref, startT: 0.70 },
            { ref: product7Ref, startT: 0.71 },
            { ref: product2Ref, startT: 0.72 },
            { ref: product6Ref, startT: 0.73 },
            { ref: product1Ref, startT: 0.74 },
            { ref: product5Ref, startT: 0.75 },
          ];

          products.forEach(({ ref, startT }) => {
            if (ref.current) {
              const pT = clamp01((t - startT) / 0.22);
              // Pure vertical downward gravity acceleration curve (t^2)
              const fy = pT * pT * FALL_DISTANCE;
              ref.current.setAttribute('transform', `translate(0, ${fy})`);
            }
          });
        }
      }

      if (movingPlatenGroupRef.current) {
        movingPlatenGroupRef.current.setAttribute('transform', `translate(${-platenOffset},0)`);
      }
      if (cavityWindowRef.current) {
        cavityWindowRef.current.setAttribute('opacity', String(1 - platenOffset / OPEN_OFFSET));
      }

      // Handle phase transition
      if (isPlaying && !isEmergencyStopped && elapsed >= currentState.duration) {
        stateIndex = (stateIndex + 1) % STATES.length;
        stateStart = simTime;
        setCurrentPhase(stateIndex);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isEmergencyStopped, currentPhase]);

  const handleJumpToPhase = (idx: number) => {
    setCurrentPhase(idx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0E1116] text-[#E8ECF1] font-['IBM_Plex_Sans'] flex flex-col overflow-hidden">
      {/* Dynamic Keyframe Style Overrides for SVG animations */}
      <style>{`
        .pellet { animation: pelletDrop 1.4s linear infinite; animation-play-state: paused; opacity: 0.9; }
        #pelletsGroup.falling .pellet { animation-play-state: running; }
        @keyframes pelletDrop { 0% { transform: translateY(0); opacity: 0.9; } 85% { opacity: 0.6; } 100% { transform: translateY(110px); opacity: 0; } }

        #screwFlights { animation: flightScroll 0.5s linear infinite; animation-play-state: paused; }
        #screwFlights.rotating { animation-play-state: running; }
        @keyframes flightScroll { to { transform: translateX(18px); } }

        #motorTick { transform-origin: 945px 195px; animation: motorSpin 0.6s linear infinite; animation-play-state: paused; }
        #motorTick.spinning { animation-play-state: running; }
        @keyframes motorSpin { to { transform: rotate(360deg); } }

        .heater-band { animation: heaterPulse 3s ease-in-out infinite; }
        @keyframes heaterPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.75; } }

        .molten-glow { filter: url(#moltenGlow); }
      `}</style>

      {/* Top Header App Bar */}
      <header className="h-16 px-6 bg-[#14171D] border-b border-[#2A2F3A] flex items-center justify-between shadow-[0_0_15px_rgba(61,214,232,0.1)] shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-[#1B1F27] hover:bg-[#3DD6E8]/20 text-[#3DD6E8] border border-[#3DD6E8]/30 px-3 py-1.5 rounded transition-all text-xs font-bold active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> FLOOR PLAN
          </button>

          <div className="h-6 w-px bg-white/10" />

          <div>
            <h1 className="font-['Space_Grotesk'] text-lg font-bold text-[#ffb77d] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              FERROMATIK MILACRON ELEKTRON 110 — {machine.name.toUpperCase()}
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium font-['IBM_Plex_Mono']">
              ELECTRIC INJECTION MOULDING SYSTEM // {machine.zone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-['IBM_Plex_Mono']">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold tracking-wider">LIVE TELEMETRY</span>
          </div>
          <button className="text-[#3DD6E8] hover:bg-[#1B1F27] p-2 rounded transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side Production Analytics Dashboard */}
        <aside className="hidden md:flex flex-col bg-[#14171D] border-r border-[#2A2F3A] w-72 shrink-0 justify-between">
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="border-b border-[#2A2F3A] pb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#ffb77d]" />
              <div>
                <h2 className="font-['Space_Grotesk'] text-xs font-bold text-white tracking-wider uppercase">
                  MACHINE DASHBOARD
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium">REAL-TIME PRODUCTION METRICS</p>
              </div>
            </div>

            {/* Timeframe Production Metric Cards */}
            <div className="flex flex-col gap-2.5">
              {/* Today's Production */}
              <button
                onClick={() => setActiveTimeframe('today')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeTimeframe === 'today'
                    ? 'bg-[#ffb77d]/15 border-[#ffb77d] text-white shadow-[0_0_12px_rgba(255,183,125,0.15)]'
                    : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-white/20 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> TODAY'S PRODUCTION
                  </span>
                  <span className="text-emerald-400 font-mono text-[9px]">+4.2%</span>
                </div>
                <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                  2,450 <span className="text-xs font-normal text-zinc-400">UNITS</span>
                </div>
              </button>

              {/* 7 Days Production */}
              <button
                onClick={() => setActiveTimeframe('7days')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeTimeframe === '7days'
                    ? 'bg-[#ffb77d]/15 border-[#ffb77d] text-white shadow-[0_0_12px_rgba(255,183,125,0.15)]'
                    : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-white/20 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> 7 DAYS PRODUCTION
                  </span>
                  <span className="text-zinc-400 font-mono text-[9px]">AVG 2.4k/d</span>
                </div>
                <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                  16,800 <span className="text-xs font-normal text-zinc-400">UNITS</span>
                </div>
              </button>

              {/* 30 Days Production */}
              <button
                onClick={() => setActiveTimeframe('30days')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeTimeframe === '30days'
                    ? 'bg-[#ffb77d]/15 border-[#ffb77d] text-white shadow-[0_0_12px_rgba(255,183,125,0.15)]'
                    : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-white/20 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> 30 DAYS PRODUCTION
                  </span>
                  <span className="text-zinc-400 font-mono text-[9px]">TARGET 92%</span>
                </div>
                <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                  68,400 <span className="text-xs font-normal text-zinc-400">UNITS</span>
                </div>
              </button>

              {/* Lifetime Production */}
              <button
                onClick={() => setActiveTimeframe('lifetime')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  activeTimeframe === 'lifetime'
                    ? 'bg-[#ffb77d]/15 border-[#ffb77d] text-white shadow-[0_0_12px_rgba(255,183,125,0.15)]'
                    : 'bg-[#1B1F27] border-[#2A2F3A] hover:border-white/20 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold font-['IBM_Plex_Mono']">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> LIFETIME PRODUCTION
                  </span>
                  <span className="text-amber-400 font-mono text-[9px]">TOTAL</span>
                </div>
                <div className="text-xl font-bold text-white font-['Space_Grotesk']">
                  482,000 <span className="text-xs font-normal text-zinc-400">UNITS</span>
                </div>
              </button>

              {/* SINCE THIS MOULD CONNECTED (Dedicated Highlight Button) */}
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
                  149,127 <span className="text-xs font-normal text-zinc-300">UNITS</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium border-t border-white/10 pt-1.5 flex items-center justify-between">
                  <span>Current Mould Lifetime</span>
                  <span className="text-emerald-400 font-bold">100% Active</span>
                </div>
              </button>
            </div>
          </div>

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

        {/* Center Viewport & Cycle Status */}
        <main className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
          <div className="flex flex-col lg:flex-row gap-3 flex-1">
            {/* FERROMATIK MILACRON ELEKTRON 110 SVG Container */}
            <div className="flex-1 flex flex-col gap-3 relative min-h-[400px]">
              <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] relative overflow-hidden flex flex-col p-4 shadow-[inset_0_0_90px_rgba(0,0,0,0.5)]">
                <div className="h-8 border-b border-[#2A2F3A] flex items-center justify-between text-xs pb-2 mb-2">
                  <span className="text-[#3DD6E8] font-bold font-['IBM_Plex_Mono'] flex items-center gap-2">
                    <Activity className="w-4 h-4" /> ELEKTRON 110 CUTAWAY // PHASE {currentPhase + 1} OF 4
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

                {/* Real-World Styled Ferromatik Milacron ELEKTRON 110 Diagram */}
                <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[360px]">
                  <svg
                    viewBox="0 0 1200 480"
                    className="w-full h-full max-h-[460px] object-contain drop-shadow-2xl"
                    role="img"
                    aria-label="Ferromatik Milacron Elektron 110 injection molding machine"
                  >
                    <defs>
                      {/* Gradients */}
                      <linearGradient id="machineBodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ECEEF0" />
                        <stop offset="100%" stopColor="#C8CCD0" />
                      </linearGradient>
                      <linearGradient id="darkBaseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2F3642" />
                        <stop offset="100%" stopColor="#1A1E26" />
                      </linearGradient>
                      <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6B7480" />
                        <stop offset="55%" stopColor="#4A5260" />
                        <stop offset="100%" stopColor="#2B313C" />
                      </linearGradient>
                      <linearGradient id="redAccentGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#E61C24" />
                        <stop offset="100%" stopColor="#B30E14" />
                      </linearGradient>
                      <filter id="moltenGlow" x="-60%" y="-60%" width="220%" height="220%">
                        <feGaussianBlur stdDeviation="5" result="b" />
                        <feMerge>
                          <feMergeNode in="b" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <clipPath id="screwClip">
                        <rect x="650" y="182" width="230" height="26" rx="4" />
                      </clipPath>
                    </defs>

                    {/* 1. Heavy Industrial Bottom Stand & Support Legs */}
                    <rect x="110" y="420" width="980" height="25" rx="3" fill="url(#darkBaseGrad)" stroke="#14171D" strokeWidth="1.5" />
                    {/* Support Feet */}
                    <rect x="140" y="445" width="22" height="12" rx="2" fill="#F2B705" />
                    <rect x="360" y="445" width="22" height="12" rx="2" fill="#F2B705" />
                    <rect x="740" y="445" width="22" height="12" rx="2" fill="#F2B705" />
                    <rect x="1040" y="445" width="22" height="12" rx="2" fill="#F2B705" />

                    {/* Lower Base Cabinets */}
                    <rect x="120" y="290" width="370" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />
                    <rect x="520" y="290" width="560" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />
                    <rect x="700" y="320" width="350" height="85" rx="3" fill="#1B2028" stroke="#353D4B" strokeWidth="1" />
                    {/* Handle slots */}
                    <rect x="780" y="335" width="12" height="6" fill="#0E1116" />
                    <rect x="960" y="335" width="12" height="6" fill="#0E1116" />

                    {/* 2. Left Clamping Enclosure (MILACRON M-SERIES White Body with Slanted Red Stripe) */}
                    <rect x="50" y="105" width="460" height="185" rx="6" fill="#F8F9FA" stroke="#3A4048" strokeWidth="2" />

                    {/* Signature Slanted Red Brand Stripe */}
                    <polygon points="220,105 260,105 195,290 155,290" fill="#E61C24" />

                    {/* Milacron Logo Icon Block */}
                    <g transform="translate(68, 118)">
                      <rect x="0" y="0" width="5" height="5" fill="#E61C24" />
                      <rect x="7" y="0" width="5" height="5" fill="#14171D" />
                      <rect x="3" y="7" width="5" height="5" fill="#14171D" />
                      <rect x="10" y="7" width="5" height="5" fill="#E61C24" />
                      <text x="20" y="10" fontFamily="Space Grotesk" fontWeight="800" fontSize="10" letterSpacing="1" fill="#E61C24">
                        MILACRON
                      </text>
                    </g>

                    {/* M-Series Badge */}
                    <text x="68" y="275" fontFamily="Space Grotesk" fontWeight="900" fontSize="15" fontStyle="italic" fill="#E61C24" letterSpacing="0.5">
                      M-Series
                    </text>

                    {/* Side Air Ventilation Louvers */}
                    <g fill="#20242C" opacity="0.75">
                      <rect x="70" y="215" width="28" height="2.5" rx="1" />
                      <rect x="70" y="222" width="28" height="2.5" rx="1" />
                      <rect x="70" y="229" width="28" height="2.5" rx="1" />
                      <rect x="70" y="236" width="28" height="2.5" rx="1" />
                      <rect x="70" y="243" width="28" height="2.5" rx="1" />
                    </g>

                    {/* Top Signal Stack Light */}
                    <rect x="90" y="80" width="8" height="25" fill="#3A4048" />
                    <circle cx="94" cy="74" r="5" fill="#E61C24" className="animate-pulse" />
                    <circle cx="94" cy="63" r="5" fill="#F2B705" />

                    {/* 3. Safety Door Window Frame & Transparent Cutaway Viewport */}
                    <rect x="270" y="112" width="230" height="170" rx="6" fill="#1E222A" stroke="#3A4048" strokeWidth="2" />
                    <rect x="285" y="125" width="200" height="144" rx="4" fill="#0B0D11" stroke="#2D333F" strokeWidth="2" />
                    {/* Sliding Window Division Line */}
                    <line x1="385" y1="125" x2="385" y2="269" stroke="#3A4048" strokeWidth="2" />
                    {/* Door Handle */}
                    <rect x="488" y="170" width="6" height="50" rx="3" fill="#EBECEE" stroke="#3A4048" strokeWidth="1" />

                    {/* GLASS INTERIOR CUTAWAY VISIBILITY (PLATENS & CLAMP) */}
                    {/* Tie Bars inside window */}
                    <line x1="285" y1="150" x2="475" y2="150" stroke="#7A8290" strokeWidth="5" strokeLinecap="round" />
                    <line x1="285" y1="240" x2="475" y2="240" stroke="#7A8290" strokeWidth="5" strokeLinecap="round" />

                    {/* Fixed Platen (Right inside window, x=425 to 470) */}
                    <rect x="425" y="135" width="45" height="125" rx="3" fill="url(#steelGrad)" stroke="#1A1F27" strokeWidth="1" />

                    {/* Moving Platen Group (Animates left/right inside window; x=380 to 425, directly touches Fixed Platen when closed) */}
                    <g ref={movingPlatenGroupRef} transform="translate(0,0)">
                      <rect x="380" y="135" width="45" height="125" rx="3" fill="url(#steelGrad)" stroke="#1A1F27" strokeWidth="1" />
                      <g ref={ejectorPinsRef} transform="translate(0,0)">
                        <line x1="425" y1="154" x2="445" y2="154" stroke="#B8BEC8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="425" y1="181" x2="445" y2="181" stroke="#B8BEC8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="425" y1="209" x2="445" y2="209" stroke="#B8BEC8" strokeWidth="2" strokeLinecap="round" />
                        <line x1="425" y1="236" x2="445" y2="236" stroke="#B8BEC8" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </g>

                    {/* Mold Cavity & Multi-Cavity Flow Manifold (8 Micro Products - 2x4 Grid) */}
                    <rect ref={cavityWindowRef} x="395" y="145" width="30" height="100" rx="4" fill="#0E1116" stroke="#3A4048" strokeWidth="1" opacity="0" />
                    <path
                      ref={flowPathRef}
                      d="M470,195 L435,195 M435,154 L435,236 M435,154 L415,154 M435,181 L415,181 M435,209 L415,209 M435,236 L415,236"
                      fill="none"
                      stroke="#FF8A3D"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="200"
                      strokeDashoffset="200"
                      filter="url(#moltenGlow)"
                    />
                    
                    {/* 8 Small Molded Product Items (Half size, 2 columns of 4) */}
                    <g ref={partShapeRef} opacity="0" transform="translate(0,0)">
                      {/* Left Column (x=398) */}
                      {/* Product 1 (Top Left) */}
                      <g ref={product1Ref} transform="translate(0,0)">
                        <rect x="398" y="150" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="400" y="152" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 2 (Mid-Top Left) */}
                      <g ref={product2Ref} transform="translate(0,0)">
                        <rect x="398" y="177" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="400" y="179" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 3 (Mid-Bottom Left) */}
                      <g ref={product3Ref} transform="translate(0,0)">
                        <rect x="398" y="205" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="400" y="207" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 4 (Bottom Left) */}
                      <g ref={product4Ref} transform="translate(0,0)">
                        <rect x="398" y="232" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="400" y="234" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Right Column (x=413) */}
                      {/* Product 5 (Top Right) */}
                      <g ref={product5Ref} transform="translate(0,0)">
                        <rect x="413" y="150" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="415" y="152" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 6 (Mid-Top Right) */}
                      <g ref={product6Ref} transform="translate(0,0)">
                        <rect x="413" y="177" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="415" y="179" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 7 (Mid-Bottom Right) */}
                      <g ref={product7Ref} transform="translate(0,0)">
                        <rect x="413" y="205" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="415" y="207" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>

                      {/* Product 8 (Bottom Right) */}
                      <g ref={product8Ref} transform="translate(0,0)">
                        <rect x="413" y="232" width="11" height="9" rx="2" stroke="#20242C" strokeWidth="0.75" />
                        <rect x="415" y="234" width="7" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.35" />
                      </g>
                    </g>

                    {/* 4. Right Injection Unit & Electric Drive Enclosure (Rendered Behind HMI Panel) */}
                    {/* Nozzle connecting mold sprue to barrel */}
                    <polygon points="630,180 630,210 470,195" fill="url(#steelGrad)" stroke="#1A1F27" strokeWidth="1" />

                    {/* Barrel aligned with injection center y=195 */}
                    <rect x="630" y="165" width="260" height="60" rx="8" fill="url(#steelGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                    {/* Heater Bands */}
                    <rect className="heater-band" x="650" y="154" width="45" height="11" rx="2" fill="#8A5226" stroke="#5C3818" strokeWidth="1" />
                    <rect className="heater-band" x="710" y="154" width="45" height="11" rx="2" fill="#8A5226" stroke="#5C3818" strokeWidth="1" />
                    <rect className="heater-band" x="770" y="154" width="45" height="11" rx="2" fill="#8A5226" stroke="#5C3818" strokeWidth="1" />

                    {/* Screw Group aligned with injection axis y=195 */}
                    <g ref={screwGroupRef} transform="translate(0,0)">
                      <rect x="650" y="182" width="230" height="26" rx="4" fill="#5A6472" />
                      <g clipPath="url(#screwClip)">
                        <g id="screwFlights" ref={screwFlightsRef}></g>
                      </g>
                    </g>

                    {/* Right Electric Drive Cover (White Enclosure with Green Lightning Badge) */}
                    <rect x="800" y="145" width="280" height="145" rx="6" fill="url(#machineBodyGrad)" stroke="#3A4048" strokeWidth="2" />
                    {/* Signature Green Lightning Bolt Logo */}
                    <path
                      d="M980,170 L960,210 L972,210 L952,255 L995,200 L980,200 Z"
                      fill="#00C853"
                      stroke="#00E676"
                      strokeWidth="1"
                      className="filter drop-shadow-[0_0_8px_rgba(0,200,83,0.5)]"
                    />

                    {/* Motor Tick indicator */}
                    <g transform="translate(945, 195)">
                      <circle r="14" fill="#1B1F27" stroke="#3A4048" strokeWidth="1.5" />
                      <line id="motorTick" ref={motorTickRef} x1="0" y1="0" x2="0" y2="-10" stroke="#00C853" strokeWidth="2" strokeLinecap="round" />
                    </g>

                    {/* Curved Black Hydraulic Lines behind Hopper (as in Milacron M-Series photo) */}
                    <path d="M760,105 C790,30 860,30 890,145" fill="none" stroke="#1A1E26" strokeWidth="6" strokeLinecap="round" />
                    <path d="M770,110 C800,45 850,45 880,145" fill="none" stroke="#2D333F" strokeWidth="4" strokeLinecap="round" />

                    {/* Resin Hopper (Elevated Conical Body on top of barrel) */}
                    <polygon points="710,20 780,20 760,165 730,165" fill="#F5F5F7" stroke="#3A4048" strokeWidth="1.5" />
                    <rect x="742" y="50" width="6" height="35" rx="3" fill="#1A1F27" opacity="0.6" />
                    {/* Falling Resin Pellets inside elevated hopper */}
                    <g id="pelletsGroup" ref={pelletsGroupRef}>
                      <circle className="pellet" cx="735" cy="40" r="3" fill="#3DD6E8" style={{ animationDelay: '0s' }} />
                      <circle className="pellet" cx="750" cy="32" r="3" fill="#3DD6E8" style={{ animationDelay: '0.25s' }} />
                      <circle className="pellet" cx="760" cy="46" r="3" fill="#3DD6E8" style={{ animationDelay: '0.5s' }} />
                      <circle className="pellet" cx="740" cy="58" r="3" fill="#3DD6E8" style={{ animationDelay: '0.75s' }} />
                      <circle className="pellet" cx="755" cy="68" r="3" fill="#3DD6E8" style={{ animationDelay: '1s' }} />
                    </g>

                    {/* 5. Center HMI Control Console (Rendered IN FRONT of Injection Unit, shifted 30px right) */}
                    <g transform="translate(30, 0)">
                      {/* Floor-mounted vertical support pipe extending down to ground feet level y=445 */}
                      <rect x="548" y="210" width="12" height="235" rx="3" fill="url(#steelGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                      <rect x="542" y="440" width="24" height="10" rx="2" fill="#353D4B" stroke="#1A1F27" strokeWidth="1" />
                      
                      {/* HMI Main Control Panel Frame */}
                      <rect x="510" y="105" width="85" height="115" rx="5" fill="#EBECEE" stroke="#3A4048" strokeWidth="2" />
                      {/* HMI Display Screen */}
                      <rect x="520" y="115" width="65" height="48" rx="3" fill="#0E1116" stroke="#252B35" strokeWidth="1.5" />
                      {/* Screen waveform telemetry graphics */}
                      <path d="M525,140 Q535,125 545,145 T565,130 T580,140" fill="none" stroke="#3DD6E8" strokeWidth="1.5" />
                      <path d="M525,150 Q540,155 555,140 T575,150" fill="none" stroke="#F2B705" strokeWidth="1.5" />
                      {/* HMI Keypad Buttons */}
                      <circle cx="530" cy="173" r="3" fill="#E61C24" />
                      <circle cx="542" cy="173" r="3" fill="#F2B705" />
                      <circle cx="554" cy="173" r="3" fill="#00C853" />
                      <circle cx="566" cy="173" r="3" fill="#3DD6E8" />
                      <rect x="525" y="181" width="55" height="30" rx="2" fill="#D5D8DC" />
                      <circle cx="552" cy="196" r="5" fill="#E61C24" />
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

            {/* Live Diagnostics Right Panel */}
            <aside className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
              <div className="flex-1 bg-[#14171D] rounded-xl border border-[#2A2F3A] flex flex-col">
                <div className="h-8 bg-[#1B1F27] border-b border-[#2A2F3A] flex items-center px-4 text-xs font-bold text-zinc-300 font-['IBM_Plex_Mono']">
                  LIVE DIAGNOSTICS
                </div>

                <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1 text-xs">
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
                        <span className="text-xs text-zinc-400 font-normal ml-1.5">UNITS</span>
                      </span>
                    </div>
                  </div>

                  <hr className="border-[#2A2F3A]" />

                  {/* Cavity Count */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">
                      <span>CAVITY COUNT</span>
                      <span className="text-emerald-400 font-bold">ACTIVE</span>
                    </div>
                    <span className="text-3xl font-bold text-white font-['Space_Grotesk']">
                      {machine.cavity ?? 8} <span className="text-xs text-zinc-400 font-normal">CAVITIES</span>
                    </span>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-medium bg-black/40 p-2 rounded border border-white/5 mt-0.5 font-['IBM_Plex_Mono']">
                      <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>CAVITY COUNT: {machine.cavity ?? 8} OPERATIONAL MOULD CAVITIES</span>
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
                    <span className="text-[10px] text-zinc-400 font-['IBM_Plex_Mono']">CLAMPING FORCE</span>
                    <span className="text-2xl font-bold text-white font-['Space_Grotesk']">
                      200 <span className="text-xs text-zinc-400">TONS</span>
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
