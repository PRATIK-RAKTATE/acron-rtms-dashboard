import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Sparkles,
  Anchor,
  Cpu,
  Radio,
  ArrowRightLeft
} from 'lucide-react';
import type { MachineInfo } from '../types/machineVisualization.types';

interface MouldChangeModalProps {
  machine?: MachineInfo;
  onClose: () => void;
}

export const MouldChangeModal: React.FC<MouldChangeModalProps> = ({
  machine = {
    id: 'm-im1-left-1',
    name: 'Milicron 200 ton n series',
    zone: 'IM1',
    side: 'Left',
    x: 186,
    y: 108,
    width: 86,
    height: 162,
    labelX: 229,
    labelY1: 116,
    labelY2: 126,
    subTitle: 'N Series [LEFT]',
    mouldNumber: '310-NEW',
    cavity: 16,
    mode: 'Production'
  },
  onClose,
}) => {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [stageProgress, setStageProgress] = useState<number>(0); // 0 to 1 for current stage
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isEmergencyStopped, setIsEmergencyStopped] = useState<boolean>(false);
  const [showDetectionModal, setShowDetectionModal] = useState<boolean>(false);

  // SVG Refs for dynamic frame updates
  const craneTrolleyRef = useRef<SVGGElement>(null);
  const chainLeftRef = useRef<SVGLineElement>(null);
  const chainRightRef = useRef<SVGLineElement>(null);
  const hookBlockRef = useRef<SVGGElement>(null);
  const mouldAssemblyRef = useRef<SVGGElement>(null);
  const movingPlatenRef = useRef<SVGGElement>(null);
  const clampLockGlowRef = useRef<SVGGElement>(null);
  const sensorStatusRef = useRef<HTMLDivElement>(null);

  const STAGES = [
    {
      id: 'crane-transit',
      name: '01. OVERHEAD CRANE TRANSIT',
      title: 'Horizontal Transit to Platen Gap',
      duration: 3500,
      color: '#3DD6E8',
      desc: 'The 3-Ton overhead gantry crane trolley moves horizontally along the yellow runway beam from the mould storage bay to align directly above the machine clamp opening.',
    },
    {
      id: 'vertical-descent',
      name: '02. MOULD DESCENT',
      title: 'Vertical Descent into Platen Gap',
      duration: 4000,
      color: '#FF6B35',
      desc: 'The dual electric chain hoist unspools smoothly, lowering the 2.4-ton precision steel injection mould into the opened clamp clearance between platens.',
    },
    {
      id: 'precision-seating',
      name: '03. SEATING & PLATEN CLAMPING',
      title: 'Guide Pin Alignment & Sensor Lock',
      duration: 3000,
      color: '#F2B705',
      desc: 'Mould locator ring seats onto fixed platen mounting hub. Hydraulic platen clamps actuate, securing the mold base with 200-ton clamping force verification.',
    },
    {
      id: 'detach-retract',
      name: '04. HOIST DETACH & RETRACT',
      title: 'Chain Detach & Crane Ascent',
      duration: 3000,
      color: '#A855F7',
      desc: 'Lifting straps release automatically from the mould eyebolts. The electric chain hoist retracts upward to top clearance height and crane returns to standby.',
    },
    {
      id: 'clamp-lock',
      name: '05. CLAMP CLOSING & READY',
      title: 'Clamp Closing & Production Lock',
      duration: 2500,
      color: '#00C853',
      desc: 'Moving platen closes under full tonnage. Live sensors verify zero gap alignment, water circuit connectivity, and automatic sequence initialization.',
    },
  ];

  // Helper Interpolation Math
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Main Loop
  useEffect(() => {
    let animFrame: number;
    let stageIdx = currentStage;
    let elapsedInStage = stageProgress * STAGES[stageIdx].duration;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50) * speedMultiplier;
      lastTime = now;

      if (isPlaying && !isEmergencyStopped) {
        elapsedInStage += dt;
        if (elapsedInStage >= STAGES[stageIdx].duration) {
          if (stageIdx === STAGES.length - 1) {
            // Completed final mould placement & clamping stage
            setIsPlaying(false);
            setShowDetectionModal(true);
            setStageProgress(1);
            return;
          } else {
            elapsedInStage = 0;
            stageIdx = stageIdx + 1;
            setCurrentStage(stageIdx);
          }
        }
      }

      const p = Math.min(1, Math.max(0, elapsedInStage / STAGES[stageIdx].duration));
      const ep = easeInOutCubic(p);
      setStageProgress(p);

      // Animation Coordinates:
      // Crane Overhead Beam Trolley X Range:
      // Staging (Left): X = 150 -> Platen Center (Target): X = 410
      // Mould Height Y Range:
      // High Clearance (Top): Y = 95 -> Seated in Machine: Y = 195
      // Moving Platen X Range:
      // Opened Wide: X = 300 (Offset 0) -> Closed Clamped: X = 350 (Offset +50)

      let trolleyX = 150;
      let mouldY = 95;
      let hookY = 95;
      let platenX = 0; // 0 = fully opened clamp gap
      let mouldOpacity = 1;
      let chainDetached = false;
      let clampLocked = false;

      if (stageIdx === 0) {
        // Stage 1: Crane Horizontal Transit from 150 to 410
        trolleyX = lerp(150, 410, ep);
        mouldY = 95;
        hookY = 95;
        platenX = 0;
      } else if (stageIdx === 1) {
        // Stage 2: Vertical Descent into Platen Gap from Y=95 to Y=195
        trolleyX = 410;
        mouldY = lerp(95, 195, ep);
        hookY = mouldY;
        platenX = 0;
      } else if (stageIdx === 2) {
        // Stage 3: Seating & Platen Clamping
        trolleyX = 410;
        mouldY = 195;
        hookY = 195;
        platenX = lerp(0, 10, ep); // micro alignment move
      } else if (stageIdx === 3) {
        // Stage 4: Hoist Detach & Retract (Hook goes from Y=195 up to Y=95, trolley moves back to 150)
        trolleyX = lerp(410, 150, ep);
        mouldY = 195; // Mould stays seated in machine!
        hookY = lerp(195, 95, ep);
        chainDetached = true;
        platenX = 10;
      } else if (stageIdx === 4) {
        // Stage 5: Clamp Closing (Moving Platen advances from X=300 to X=350)
        trolleyX = 150;
        mouldY = 195;
        hookY = 95;
        chainDetached = true;
        platenX = lerp(10, 50, ep);
        clampLocked = ep > 0.8;
      }

      // DOM SVG Updates
      if (craneTrolleyRef.current) {
        craneTrolleyRef.current.setAttribute('transform', `translate(${trolleyX}, 0)`);
      }
      if (hookBlockRef.current) {
        hookBlockRef.current.setAttribute('transform', `translate(${trolleyX}, ${hookY})`);
      }
      if (chainLeftRef.current && chainRightRef.current) {
        chainLeftRef.current.setAttribute('x1', String(trolleyX - 12));
        chainLeftRef.current.setAttribute('x2', String(trolleyX - 12));
        chainLeftRef.current.setAttribute('y2', String(hookY + 50));

        chainRightRef.current.setAttribute('x1', String(trolleyX + 12));
        chainRightRef.current.setAttribute('x2', String(trolleyX + 12));
        chainRightRef.current.setAttribute('y2', String(hookY + 50));
      }

      if (mouldAssemblyRef.current) {
        const mx = chainDetached ? 410 : trolleyX;
        mouldAssemblyRef.current.setAttribute('transform', `translate(${mx}, ${mouldY})`);
        mouldAssemblyRef.current.setAttribute('opacity', String(mouldOpacity));
      }

      if (movingPlatenRef.current) {
        movingPlatenRef.current.setAttribute('transform', `translate(${platenX}, 0)`);
      }

      if (clampLockGlowRef.current) {
        clampLockGlowRef.current.setAttribute('opacity', clampLocked ? '1' : '0');
      }

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, isEmergencyStopped, currentStage, speedMultiplier]);

  const handleJumpToStage = (idx: number) => {
    setCurrentStage(idx);
    setStageProgress(0);
    setShowDetectionModal(false);
  };

  const handleCloseDetectionAndRestart = () => {
    setShowDetectionModal(false);
    setCurrentStage(0);
    setStageProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10] text-[#E8ECF1] font-['IBM_Plex_Sans'] flex flex-col overflow-hidden select-none">
      {/* Dynamic Keyframes and Styling */}
      <style>{`
        .crane-chain { stroke-dasharray: 6 4; animation: chainMotion 0.8s linear infinite; }
        @keyframes chainMotion { to { stroke-dashoffset: 10px; } }
        .laser-guide { animation: pulseLaser 1.5s ease-in-out infinite; }
        @keyframes pulseLaser { 0%,100% { opacity: 0.3; } 50% { opacity: 0.9; } }
        .glow-sensor { filter: drop-shadow(0 0 8px #00C853); }
        .glow-cyan { filter: drop-shadow(0 0 10px #3DD6E8); }
      `}</style>

      {/* Top Header App Bar */}
      <header className="h-16 px-6 bg-[#12151C] border-b border-[#262B36] flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.6)] shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-[#1B1E28] hover:bg-[#3DD6E8]/20 text-[#3DD6E8] border border-[#3DD6E8]/30 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
          </button>

          <div className="h-6 w-px bg-white/10" />

          <div>
            <h1 className="font-['Space_Grotesk'] text-lg font-bold text-amber-400 tracking-tight flex items-center gap-2">
              <Anchor className="w-5 h-5 text-amber-400 animate-bounce" />
              OVERHEAD HOIST CRANE MOULD CHANGE SYSTEM
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium font-['IBM_Plex_Mono']">
              MILACRON ELEKTRON 110 // AUTOMATED 3-TON CRANE REPLACEMENT FEAT. MOULD #{machine.mouldNumber ?? '310-NEW'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-['IBM_Plex_Mono']">
          <button
            onClick={() => setShowDetectionModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,200,83,0.2)] active:scale-95"
            title="Preview Mould Auto-Detected RTMS Popup"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>RTMS DETECT POPUP</span>
          </button>

          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-md text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>CRANE AUTOMATION ACTIVE</span>
          </div>

          <button
            onClick={() => setIsEmergencyStopped(!isEmergencyStopped)}
            className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-all border cursor-pointer ${
              isEmergencyStopped
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
            }`}
          >
            {isEmergencyStopped ? 'RESUME CRANE' : 'E-STOP'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Control Panel & Diagnostics */}
        <aside className="hidden md:flex flex-col bg-[#12151C] border-r border-[#262B36] w-80 shrink-0 justify-between">
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Header Title */}
            <div className="border-b border-[#262B36] pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-['Space_Grotesk'] text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#3DD6E8]" /> SEQUENCE CONTROL
                </h2>
                <p className="text-[10px] text-zinc-400">STAGE SELECTOR & TIMELINE</p>
              </div>
              <span className="text-[11px] font-mono text-[#3DD6E8] font-bold">
                {currentStage + 1} / {STAGES.length}
              </span>
            </div>

            {/* Stages List */}
            <div className="flex flex-col gap-2">
              {STAGES.map((st, idx) => {
                const isActive = currentStage === idx;
                const isPast = currentStage > idx;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleJumpToStage(idx)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-1 relative overflow-hidden ${
                      isActive
                        ? 'bg-[#1B2230] border-[#3DD6E8] text-white shadow-[0_0_15px_rgba(61,214,232,0.2)]'
                        : isPast
                        ? 'bg-[#161922] border-[#2A303F] text-zinc-300 hover:border-zinc-500'
                        : 'bg-[#12151C] border-[#202530] text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold font-['Space_Grotesk']">
                      <span className={isActive ? 'text-[#3DD6E8]' : isPast ? 'text-emerald-400' : 'text-zinc-500'}>
                        {st.name}
                      </span>
                      {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium line-clamp-1">{st.title}</div>
                    {isActive && (
                      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-[#3DD6E8] h-full transition-all duration-75"
                          style={{ width: `${stageProgress * 100}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Telemetry Card */}
            <div className="bg-[#181C26] border border-[#2A303F] rounded-xl p-3.5 flex flex-col gap-3 font-['IBM_Plex_Mono']">
              <div className="text-[10px] text-zinc-400 font-bold border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> CRANE TELEMETRY
                </span>
                <span className="text-emerald-400 text-[9px] font-mono animate-pulse">SENSORS ONLINE</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 block">TROLLEY X-POS</span>
                  <span className="text-sm font-bold text-[#3DD6E8] font-mono">
                    {currentStage === 0
                      ? `${(150 + stageProgress * 260).toFixed(0)} mm`
                      : currentStage >= 1 && currentStage <= 2
                      ? '410 mm [SEATED]'
                      : currentStage === 3
                      ? `${(410 - stageProgress * 260).toFixed(0)} mm`
                      : '150 mm [HOME]'}
                  </span>
                </div>

                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 block">HOIST DROP DEPTH</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {currentStage === 0
                      ? '0.00 m [TOP]'
                      : currentStage === 1
                      ? `${(stageProgress * 1.85).toFixed(2)} m`
                      : currentStage === 2
                      ? '1.85 m [SET]'
                      : currentStage === 3
                      ? `${((1 - stageProgress) * 1.85).toFixed(2)} m`
                      : '0.00 m [RETRACTED]'}
                  </span>
                </div>

                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 block">LOAD CELL TENSION</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {currentStage <= 2 ? '2.40 TONS' : '0.00 TONS'}
                  </span>
                </div>

                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[9px] text-zinc-500 block">MOULD ALIGNMENT</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {currentStage >= 2 ? '±0.00 mm OK' : 'ALIGNING...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Speed Controls */}
          <div className="p-4 border-t border-[#262B36] flex items-center justify-between text-xs font-['IBM_Plex_Mono']">
            <span className="text-zinc-400">SIM SPEED:</span>
            <div className="flex gap-1">
              {[0.5, 1, 2].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    speedMultiplier === spd
                      ? 'bg-[#3DD6E8] text-black'
                      : 'bg-[#1E222D] text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Machine & Overhead Crane Viewport */}
        <main className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
          <div className="flex-1 bg-[#12151C] rounded-xl border border-[#262B36] relative overflow-hidden flex flex-col p-4 shadow-[inset_0_0_100px_rgba(0,0,0,0.7)]">
            {/* Viewport Header */}
            <div className="h-8 border-b border-[#262B36] flex items-center justify-between text-xs pb-2 mb-2">
              <span className="text-amber-400 font-bold font-['IBM_Plex_Mono'] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" /> OVERHEAD 3T CRANE & ELEKTRON 110 CUTAWAY
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 bg-[#1B1E28] border border-[#262B36] hover:border-[#3DD6E8] text-xs font-['IBM_Plex_Mono'] px-3 py-1 rounded-md text-white transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  onClick={() => handleJumpToStage(0)}
                  className="flex items-center gap-1.5 bg-[#1B1E28] border border-[#262B36] hover:border-[#3DD6E8] text-xs font-['IBM_Plex_Mono'] px-2.5 py-1 rounded-md text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> RESTART
                </button>
              </div>
            </div>

            {/* SVG Visualizer Area */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center min-h-[420px]">
              <svg
                viewBox="0 0 1200 520"
                className="w-full h-full max-h-[500px] object-contain drop-shadow-2xl"
                role="img"
                aria-label="Overhead crane mould change animation for Ferromatik Milacron machine"
              >
                <defs>
                  {/* Heavy Steel Gradients */}
                  <linearGradient id="craneBeamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5D020" />
                    <stop offset="60%" stopColor="#E5A900" />
                    <stop offset="100%" stopColor="#B38300" />
                  </linearGradient>

                  <linearGradient id="hoistMotorGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF7E47" />
                    <stop offset="100%" stopColor="#D94B18" />
                  </linearGradient>

                  <linearGradient id="mouldSteelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A0AAB8" />
                    <stop offset="50%" stopColor="#6C7787" />
                    <stop offset="100%" stopColor="#3E4756" />
                  </linearGradient>

                  <linearGradient id="steelPlatenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B6370" />
                    <stop offset="100%" stopColor="#2E3440" />
                  </linearGradient>

                  <filter id="yellowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. FACTORY ROOF STRUCTURAL STEEL BEAMS */}
                <rect x="0" y="0" width="1200" height="20" fill="#161922" stroke="#262B36" strokeWidth="1" />
                <line x1="200" y1="0" x2="200" y2="40" stroke="#2B313C" strokeWidth="6" />
                <line x1="600" y1="0" x2="600" y2="40" stroke="#2B313C" strokeWidth="6" />
                <line x1="1000" y1="0" x2="1000" y2="40" stroke="#2B313C" strokeWidth="6" />

                {/* 2. OVERHEAD GANTRY CRANE RUNWAY BEAM (YELLOW I-BEAM MATCHING IMAGE) */}
                {/* Top Flange */}
                <rect x="50" y="30" width="1100" height="8" fill="#F2B705" />
                {/* Web Plate with 3T Label */}
                <rect x="50" y="38" width="1100" height="28" fill="url(#craneBeamGrad)" stroke="#1A1D24" strokeWidth="1.5" />
                {/* Bottom Flange Rail */}
                <rect x="50" y="66" width="1100" height="10" fill="#D9A004" stroke="#1A1D24" strokeWidth="1" />
                
                {/* Beam End Stops */}
                <rect x="40" y="25" width="15" height="55" rx="3" fill="#3A404D" />
                <rect x="1145" y="25" width="15" height="55" rx="3" fill="#3A404D" />

                {/* 3T Markings on Crane Beam */}
                <text x="120" y="58" fontFamily="Space Grotesk" fontWeight="900" fontSize="20" fill="#14171D" opacity="0.8">
                  3t OVERHEAD CRANE RUNWAY
                </text>
                <text x="980" y="58" fontFamily="Space Grotesk" fontWeight="900" fontSize="20" fill="#14171D" opacity="0.8">
                  CAPACITY 3000 KG
                </text>

                {/* 3. MACHINE BASE & STAND (FERROMATIK MILACRON ELEKTRON 110) */}
                <rect x="110" y="470" width="980" height="25" rx="3" fill="#1F242E" stroke="#14171D" strokeWidth="1.5" />
                {/* Support Feet */}
                <rect x="140" y="495" width="22" height="12" rx="2" fill="#F2B705" />
                <rect x="360" y="495" width="22" height="12" rx="2" fill="#F2B705" />
                <rect x="740" y="495" width="22" height="12" rx="2" fill="#F2B705" />
                <rect x="1040" y="495" width="22" height="12" rx="2" fill="#F2B705" />

                {/* Lower Base Cabinets */}
                <rect x="120" y="340" width="370" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />
                <rect x="520" y="340" width="560" height="130" rx="4" fill="#252B35" stroke="#1A1F27" strokeWidth="2" />

                {/* 4. MILACRON MACHINE ENCLOSURE & CLAMP PLATENS */}
                {/* Left Enclosure body (White with Slanted Red Stripe) */}
                <rect x="50" y="180" width="230" height="160" rx="6" fill="#F8F9FA" stroke="#3A4048" strokeWidth="2" />
                <polygon points="180,180 220,180 155,340 115,340" fill="#E61C24" />
                
                {/* Milacron Brand Text */}
                <g transform="translate(68, 195)">
                  <rect x="0" y="0" width="5" height="5" fill="#E61C24" />
                  <rect x="7" y="0" width="5" height="5" fill="#14171D" />
                  <text x="18" y="8" fontFamily="Space Grotesk" fontWeight="800" fontSize="11" fill="#E61C24">
                    MILACRON ELEKTRON
                  </text>
                </g>

                {/* Glass Viewport Cutaway Frame */}
                <rect x="270" y="180" width="240" height="160" rx="6" fill="#151821" stroke="#3A4048" strokeWidth="2" />

                {/* Tie Bars across Clamp Gap */}
                <line x1="275" y1="210" x2="505" y2="210" stroke="#7A8290" strokeWidth="6" strokeLinecap="round" />
                <line x1="275" y1="310" x2="505" y2="310" stroke="#7A8290" strokeWidth="6" strokeLinecap="round" />

                {/* Fixed Platen (Right side of clamp gap, x=475) */}
                <g transform="translate(475, 190)">
                  <rect x="0" y="0" width="35" height="140" rx="3" fill="url(#steelPlatenGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                  {/* Locator Ring Hub */}
                  <circle cx="0" cy="70" r="14" fill="#8C95A6" stroke="#1A1F27" strokeWidth="1.5" />
                  <circle cx="0" cy="70" r="7" fill="#1A1F27" />
                  {/* Platen Lock Clamps */}
                  <rect x="-8" y="15" width="12" height="18" rx="2" fill="#F2B705" />
                  <rect x="-8" y="107" width="12" height="18" rx="2" fill="#F2B705" />
                </g>

                {/* Moving Platen Group (Animates horizontally) */}
                <g ref={movingPlatenRef} transform="translate(0, 0)">
                  {/* Moving Platen Body at base X = 280 */}
                  <rect x="280" y="190" width="35" height="140" rx="3" fill="url(#steelPlatenGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                  {/* Ejector Pins */}
                  <line x1="315" y1="220" x2="330" y2="220" stroke="#B8BEC8" strokeWidth="2.5" />
                  <line x1="315" y1="300" x2="330" y2="300" stroke="#B8BEC8" strokeWidth="2.5" />
                  {/* Moving Platen Lock Clamps */}
                  <rect x="311" y="205" width="12" height="18" rx="2" fill="#F2B705" />
                  <rect x="311" y="297" width="12" height="18" rx="2" fill="#F2B705" />
                </g>

                {/* Glow Sensor Lock Effect on Seated Mould */}
                <g ref={clampLockGlowRef} opacity="0" filter="url(#greenGlow)">
                  <rect x="350" y="190" width="125" height="140" rx="4" fill="none" stroke="#00C853" strokeWidth="3" />
                </g>

                {/* 5. RIGHT INJECTION UNIT & HOOPER */}
                {/* Barrel */}
                <rect x="520" y="240" width="260" height="55" rx="6" fill="url(#steelPlatenGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                <rect x="540" y="230" width="40" height="12" rx="2" fill="#8A5226" />
                <rect x="600" y="230" width="40" height="12" rx="2" fill="#8A5226" />
                <rect x="660" y="230" width="40" height="12" rx="2" fill="#8A5226" />

                {/* Drive Enclosure */}
                <rect x="780" y="210" width="280" height="145" rx="6" fill="#ECEEF0" stroke="#3A4048" strokeWidth="2" />
                <path d="M960,235 L940,275 L952,275 L932,320 L975,265 L960,265 Z" fill="#00C853" />

                {/* Resin Hopper */}
                <polygon points="610,95 680,95 660,230 630,230" fill="#F5F5F7" stroke="#3A4048" strokeWidth="1.5" />

                {/* HMI Screen Console */}
                <rect x="530" y="160" width="65" height="75" rx="4" fill="#EBECEE" stroke="#3A4048" strokeWidth="1.5" />
                <rect x="538" y="168" width="49" height="35" rx="2" fill="#0E1116" />
                <path d="M542,185 Q552,175 562,190 T582,180" fill="none" stroke="#3DD6E8" strokeWidth="1.5" />

                {/* 6. DYNAMIC OVERHEAD CRANE HOIST TROLLEY & MOTOR (MATCHING USER PHOTO) */}
                {/* Crane Chains dropping down to Hook */}
                <line ref={chainLeftRef} x1="138" y1="76" x2="138" y2="140" className="crane-chain" stroke="#D1D5DB" strokeWidth="3" />
                <line ref={chainRightRef} x1="162" y1="76" x2="162" y2="140" className="crane-chain" stroke="#D1D5DB" strokeWidth="3" />

                {/* Dynamic Crane Trolley Group (Animates horizontally along runway beam) */}
                <g ref={craneTrolleyRef} transform="translate(150, 0)">
                  {/* Trolley Wheel Assemblies riding on lower flange Y=66 */}
                  <circle cx="-25" cy="62" r="7" fill="#2B313C" stroke="#F2B705" strokeWidth="2" />
                  <circle cx="25" cy="62" r="7" fill="#2B313C" stroke="#F2B705" strokeWidth="2" />
                  <rect x="-35" y="66" width="70" height="10" rx="2" fill="#3A404D" />

                  {/* Trolley Frame */}
                  <rect x="-30" y="76" width="60" height="14" rx="2" fill="#F2B705" stroke="#1A1D24" strokeWidth="1" />

                  {/* Heavy Orange Electric Chain Hoist Motor Housing (Exact match to uploaded image) */}
                  <g transform="translate(0, 90)">
                    {/* Main Motor Casing */}
                    <rect x="-32" y="0" width="64" height="42" rx="6" fill="url(#hoistMotorGrad)" stroke="#1A1D24" strokeWidth="1.5" />
                    {/* Motor Cooling Fins */}
                    <line x1="-24" y1="8" x2="-24" y2="34" stroke="#B3370F" strokeWidth="2" />
                    <line x1="-16" y1="8" x2="-16" y2="34" stroke="#B3370F" strokeWidth="2" />
                    <line x1="-8" y1="8" x2="-8" y2="34" stroke="#B3370F" strokeWidth="2" />

                    {/* 3t Capacity Badge Stamp on Hoist */}
                    <rect x="2" y="10" width="22" height="18" rx="3" fill="#14171D" />
                    <text x="6" y="24" fontFamily="Space Grotesk" fontWeight="900" fontSize="12" fill="#F2B705">
                      3t
                    </text>

                    {/* Lower Chain Bucket Container (Yellow/Orange) */}
                    <rect x="-18" y="42" width="36" height="28" rx="4" fill="#F2B705" stroke="#1A1D24" strokeWidth="1" />
                    
                    {/* Coiled Yellow Pendant Remote Hanging Down with Wire */}
                    <path d="M-28,25 C-45,35 -40,110 -35,160" fill="none" stroke="#1A1D24" strokeWidth="2.5" />
                    <rect x="-40" y="160" width="12" height="26" rx="3" fill="#F2B705" stroke="#1A1D24" strokeWidth="1" />
                    <circle cx="-34" cy="166" r="2" fill="#E61C24" />
                    <circle cx="-34" cy="174" r="2" fill="#00C853" />
                  </g>
                </g>

                {/* Dynamic Hook Block Assembly */}
                <g ref={hookBlockRef} transform="translate(150, 95)">
                  {/* Heavy Steel Lifting Block */}
                  <rect x="-16" y="-10" width="32" height="20" rx="4" fill="#2B313C" stroke="#F2B705" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="4" fill="#F2B705" />
                  {/* Heavy Duty Swivel Hook */}
                  <path d="M0,10 C0,22 -12,22 -12,32 C-12,42 4,44 10,34 C12,30 10,24 6,24" fill="none" stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" />
                </g>

                {/* 7. NEW INJECTION MOULD ASSEMBLY (PRECISION 2-PLATE STEEL MOULD) */}
                <g ref={mouldAssemblyRef} transform="translate(150, 95)">
                  {/* Lifting Eyebolt Ring attached to top of Mould */}
                  <circle cx="0" cy="-35" r="8" fill="none" stroke="#F2B705" strokeWidth="4" />
                  <rect x="-4" y="-27" width="8" height="12" fill="#2B313C" />
                  
                  {/* Lifting Straps / Shackles connecting Hook to Mould Eyebolt */}
                  <line x1="0" y1="-35" x2="0" y2="-12" stroke="#E5A900" strokeWidth="3" />

                  {/* Mould Base Outer Frame */}
                  <g transform="translate(-40, -15)">
                    {/* Fixed Half A-Plate */}
                    <rect x="42" y="0" width="38" height="110" rx="2" fill="url(#mouldSteelGrad)" stroke="#1A1F27" strokeWidth="1.5" />
                    {/* Moving Half B-Plate */}
                    <rect x="0" y="0" width="38" height="110" rx="2" fill="url(#mouldSteelGrad)" stroke="#1A1F27" strokeWidth="1.5" />

                    {/* Precision Guide Pins & Bushings */}
                    <rect x="34" y="12" width="12" height="6" fill="#E5E7EB" />
                    <rect x="34" y="92" width="12" height="6" fill="#E5E7EB" />

                    {/* Center Mold Cavity Line */}
                    <line x1="40" y1="0" x2="40" y2="110" stroke="#10141C" strokeWidth="2" />

                    {/* Mould ID Badge */}
                    <rect x="10" y="45" width="60" height="20" rx="2" fill="#14171D" stroke="#F2B705" strokeWidth="1" />
                    <text x="15" y="58" fontFamily="IBM Plex Mono" fontWeight="700" fontSize="8" fill="#F2B705">
                      #{machine.mouldNumber ?? '310-NEW'}
                    </text>

                    {/* Cooling Water Fittings (Red & Blue Ports) */}
                    <circle cx="12" cy="8" r="3" fill="#E61C24" />
                    <circle cx="24" cy="8" r="3" fill="#3DD6E8" />
                    <circle cx="56" cy="8" r="3" fill="#E61C24" />
                    <circle cx="68" cy="8" r="3" fill="#3DD6E8" />
                  </g>
                </g>
              </svg>

              {/* HUD Sensor Overlay Box */}
              <div
                ref={sensorStatusRef}
                className="absolute bottom-4 left-4 p-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg z-20 font-['IBM_Plex_Mono'] max-w-xs shadow-xl"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-[#3DD6E8] uppercase">{STAGES[currentStage].name}</span>
                  <span className="text-emerald-400 text-[10px]">
                    {isEmergencyStopped ? 'STOPPED' : isPlaying ? 'AUTO LOOP' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug font-['IBM_Plex_Sans']">
                  {STAGES[currentStage].desc}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AUTOMATIC MOULD & CAVITY DETECTED RTMS POPUP */}
      {showDetectionModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 md:p-6 animate-fade-in font-['Space_Grotesk']">
          <div className="bg-[#10141D] border-2 border-emerald-500/60 rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-[0_0_80px_rgba(0,200,83,0.35)] flex flex-col gap-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,200,83,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 animate-pulse" />

            {/* Header Title */}
            <div className="text-center flex flex-col items-center justify-center gap-2 relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,200,83,0.3)]">
                <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                <span>RFID AUTO DETECTION</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                MOULD DETECTED AUTOMATICALLY TO RTMS SYSTEM
              </h2>
            </div>

            {/* Main Visual Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10 bg-[#0A0D14] border border-[#202738] rounded-2xl p-6 md:p-8 shadow-inner">
              {/* 1. Mould with RFID */}
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-[#141A26] border-2 border-amber-500/50 flex items-center justify-center p-3 relative shadow-[0_0_30px_rgba(245,208,32,0.15)] group hover:scale-105 transition-transform">
                  {/* Mould SVG with RFID Tag */}
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    {/* Mould Base A & B Plates */}
                    <rect x="15" y="20" width="40" height="80" rx="4" fill="#5B6575" stroke="#F2B705" strokeWidth="2.5" />
                    <rect x="65" y="20" width="40" height="80" rx="4" fill="#5B6575" stroke="#F2B705" strokeWidth="2.5" />
                    <line x1="60" y1="20" x2="60" y2="100" stroke="#0E121B" strokeWidth="3" />
                    {/* Cooling ports */}
                    <circle cx="30" cy="32" r="5" fill="#3DD6E8" />
                    <circle cx="30" cy="88" r="5" fill="#E61C24" />
                    <circle cx="90" cy="32" r="5" fill="#3DD6E8" />
                    <circle cx="90" cy="88" r="5" fill="#E61C24" />
                    
                    {/* RFID Tag Badge mounted on Mould */}
                    <rect x="25" y="48" width="70" height="24" rx="4" fill="#0E121B" stroke="#00C853" strokeWidth="2" />
                    <text x="32" y="64" fontSize="11" fontWeight="bold" fill="#00C853" fontFamily="monospace">RFID TAG</text>
                    <circle cx="85" cy="60" r="3" fill="#00C853" className="animate-ping" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-amber-300">
                    MOULD #{machine.mouldNumber ?? '310-NEW'}
                  </h4>
                  <p className="text-sm font-mono text-zinc-300 font-semibold">
                    {machine.cavity ?? 16} CAVITIES
                  </p>
                </div>
              </div>

              {/* 2. Center 2 Arrows Animation */}
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center shadow-[0_0_40px_rgba(0,200,83,0.4)] animate-pulse">
                    <ArrowRightLeft className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-full px-4 py-1.5 text-xs font-mono font-bold text-emerald-300 tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,200,83,0.2)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>MOULD DETECTED</span>
                </div>
              </div>

              {/* 3. Machine with RFID Scanner */}
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-[#141A26] border-2 border-emerald-500/50 flex items-center justify-center p-3 relative shadow-[0_0_30px_rgba(0,200,83,0.15)] group hover:scale-105 transition-transform">
                  {/* Machine with Scanner Graphic */}
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    {/* Machine Base */}
                    <rect x="15" y="65" width="90" height="40" rx="4" fill="#252C38" stroke="#3DD6E8" strokeWidth="2" />
                    {/* Clamp Platens */}
                    <rect x="25" y="30" width="18" height="35" rx="2" fill="#4B5563" />
                    <rect x="77" y="30" width="18" height="35" rx="2" fill="#4B5563" />
                    <line x1="25" y1="35" x2="95" y2="35" stroke="#9CA3AF" strokeWidth="2" />
                    <line x1="25" y1="60" x2="95" y2="60" stroke="#9CA3AF" strokeWidth="2" />

                    {/* RFID Scanner Antenna */}
                    <rect x="52" y="15" width="16" height="25" rx="3" fill="#0E121B" stroke="#00C853" strokeWidth="2" />
                    <line x1="60" y1="15" x2="60" y2="5" stroke="#00C853" strokeWidth="2.5" />
                    <circle cx="60" cy="5" r="3" fill="#00C853" />

                    {/* Scanner Beams */}
                    <path d="M45,25 L35,50 L85,50 L75,25 Z" fill="rgba(0, 200, 83, 0.2)" stroke="#00C853" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="36" y="90" fontSize="10" fontWeight="bold" fill="#3DD6E8" fontFamily="monospace">SCANNER</text>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-300">
                    MILACRON ELEKTRON 110
                  </h4>
                  <p className="text-sm font-mono text-emerald-400 font-semibold">
                    RTMS CONNECTED
                  </p>
                </div>
              </div>
            </div>

            {/* OKAY Button */}
            <div className="flex justify-center relative z-10 pt-2">
              <button
                onClick={handleCloseDetectionAndRestart}
                className="w-full md:w-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold font-['Space_Grotesk'] text-lg transition-all shadow-[0_0_35px_rgba(0,200,83,0.5)] active:scale-95 cursor-pointer flex items-center justify-center gap-3 tracking-wider uppercase"
              >
                <span>OKAY</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
