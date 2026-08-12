import React, { useRef } from 'react';
import { MACHINE_LIST, ZONE_DATA } from '../data/zoneData';
import type { CadGuideData, MachineInfo, SelectedItem, ThemeMode, ZoneInfo } from '../types/machineVisualization.types';
import { MachineUnit } from './MachineUnit';
import { CadHoverGuides } from './CadHoverGuides';

interface ArchitecturalSvgBoardProps {
  theme: ThemeMode;
  selectedItem: SelectedItem | null;
  onSelectZone: (zone: ZoneInfo) => void;
  onSelectMachine: (machine: MachineInfo, e: React.MouseEvent) => void;
  cadGuide: CadGuideData | null;
  setCadGuide: (guide: CadGuideData | null) => void;
}

export const ArchitecturalSvgBoard: React.FC<ArchitecturalSvgBoardProps> = ({
  theme,
  selectedItem,
  onSelectZone,
  onSelectMachine,
  cadGuide,
  setCadGuide,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG Mousemove for empty space CAD cursor crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as HTMLElement;
    const isHoveringInteractive =
      target.closest('.machine-unit') || target.closest('.zone-bay');

    if (!isHoveringInteractive && svgRef.current) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
      const curX = Math.round(svgP.x);
      const curY = Math.round(svgP.y);

      if (curX >= 20 && curX <= 1260 && curY >= 90 && curY <= 650) {
        setCadGuide({
          x: curX,
          y: curY,
          w: 0,
          h: 0,
          labelText: `X:${curX} Y:${curY}`,
          isCursorCrosshair: true,
        });
      } else {
        setCadGuide(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setCadGuide(null);
  };

  const handleZoneMouseEnter = (zoneId: string, x: number, y: number, w: number, h: number) => {
    const zone = ZONE_DATA[zoneId];
    setCadGuide({
      x,
      y,
      w,
      h,
      labelText: zone ? zone.title : 'ZONE BAY',
    });
  };

  const handleMachineMouseEnter = (machine: MachineInfo) => {
    setCadGuide({
      x: machine.x,
      y: machine.y,
      w: machine.width,
      h: machine.height,
      labelText: machine.name.toUpperCase(),
    });
  };

  return (
    <svg
      ref={svgRef}
      id="architectural-svg"
      className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] select-none font-['Space_Grotesk']"
      viewBox="0 0 1280 720"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        {/* 3D Wall Drop Shadow Filter */}
        <filter id="wall-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="8" dy="12" stdDeviation="6" floodColor="#0e130a" floodOpacity="0.65" />
          <feDropShadow dx="3" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Machinery Drop Shadow Filter */}
        <filter id="equip-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
        </filter>

        {/* Glowing Green Shadow Filter */}
        <filter id="green-glow-filter" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22c55e" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#4ade80" floodOpacity="0.7" />
        </filter>

        {/* Hatch Patterns for Storage & WIP Areas */}
        <pattern
          id="hatch-pattern"
          width="12"
          height="12"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(228, 232, 219, 0.08)" strokeWidth="1.5" />
        </pattern>
        <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Background Floor Grid */}
      <rect width="1280" height="720" fill="url(#grid-pattern)" />

      {/* Zone Floor Sub-Bays */}
      <g className="zone-floors">
        {/* Zone 1: Raw Material IM */}
        <rect
          id="bay-rm-im"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-rm-im'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="32"
          y="110"
          width="135"
          height="520"
          rx="8"
          fill="#38432e"
          onClick={() => onSelectZone(ZONE_DATA['bay-rm-im'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-rm-im', 32, 110, 135, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 2: IM1 */}
        <rect
          id="bay-im1"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-im1'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="178"
          y="110"
          width="200"
          height="520"
          rx="8"
          fill="#3c4832"
          onClick={() => onSelectZone(ZONE_DATA['bay-im1'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-im1', 178, 110, 200, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 3: IM2 */}
        <rect
          id="bay-im2"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-im2'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="390"
          y="110"
          width="200"
          height="520"
          rx="8"
          fill="#3f4b34"
          onClick={() => onSelectZone(ZONE_DATA['bay-im2'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-im2', 390, 110, 200, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 4: WIP Goods Area */}
        <rect
          id="bay-wip"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-wip'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="602"
          y="110"
          width="135"
          height="520"
          rx="8"
          fill="url(#hatch-pattern)"
          stroke="rgba(228, 232, 219, 0.15)"
          strokeWidth="1"
          onClick={() => onSelectZone(ZONE_DATA['bay-wip'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-wip', 602, 110, 135, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 5: Blow Moulding 2 */}
        <rect
          id="bay-bm2"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-bm2'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="749"
          y="110"
          width="175"
          height="520"
          rx="8"
          fill="#435037"
          onClick={() => onSelectZone(ZONE_DATA['bay-bm2'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-bm2', 749, 110, 175, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 6: Blow Moulding 1 */}
        <rect
          id="bay-bm1"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-bm1'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="936"
          y="110"
          width="175"
          height="520"
          rx="8"
          fill="#46543a"
          onClick={() => onSelectZone(ZONE_DATA['bay-bm1'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-bm1', 936, 110, 175, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 7: Raw Material Area */}
        <rect
          id="bay-rm-area"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${
            selectedItem?.type === 'zone' && selectedItem.id === 'bay-rm-area'
              ? 'stroke-white stroke-[3px]'
              : ''
          }`}
          x="1123"
          y="110"
          width="125"
          height="520"
          rx="8"
          fill="#3b4630"
          onClick={() => onSelectZone(ZONE_DATA['bay-rm-area'])}
          onMouseEnter={() => handleZoneMouseEnter('bay-rm-area', 1123, 110, 125, 520)}
          onMouseLeave={() => setCadGuide(null)}
        />
      </g>

      {/* INTERNAL MACHINERY & FURNITURE VECTOR ILLUSTRATIONS */}
      <g
        className="internal-equipment"
        filter="url(#equip-shadow)"
        stroke="#d6dad0"
        strokeWidth="1.2"
        fill="none"
        textAnchor="middle"
      >
        {/* Zone 1 Internal Layout: Raw Material IM */}
        <g id="equip-rm-im">
          <circle cx="74" cy="170" r="22" stroke="#d6dad0" strokeWidth="2" fill="rgba(214, 218, 208, 0.08)" />
          <circle cx="124" cy="170" r="22" stroke="#d6dad0" strokeWidth="2" fill="rgba(214, 218, 208, 0.08)" />
          <circle cx="74" cy="170" r="8" stroke="#a1a896" />
          <circle cx="124" cy="170" r="8" stroke="#a1a896" />
          <text x="99" y="210" fontSize="9" fill="#c2c7b8" stroke="none">
            SILO HOPPERS
          </text>
          <rect x="44" y="240" width="111" height="150" rx="4" strokeDasharray="4,4" />
          <rect x="52" y="250" width="42" height="60" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="105" y="250" width="42" height="60" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="52" y="320" width="42" height="60" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="105" y="320" width="42" height="60" fill="rgba(214, 218, 208, 0.05)" />
          <text x="99" y="410" fontSize="9" fill="#c2c7b8" stroke="none">
            STAGING RACKS
          </text>
          <rect x="44" y="440" width="111" height="150" rx="4" />
          <line x1="44" y1="475" x2="155" y2="475" />
          <line x1="44" y1="510" x2="155" y2="510" />
          <line x1="44" y1="545" x2="155" y2="545" />
          <line x1="99" y1="440" x2="99" y2="590" />
          <text x="99" y="610" fontSize="9" fill="#c2c7b8" stroke="none">
            RESIN PALLETS
          </text>
        </g>

        {/* Zone 4 Internal Layout: WIP Goods Area */}
        <g id="equip-wip">
          <line x1="669" y1="120" x2="669" y2="620" stroke="#d6dad0" strokeWidth="1.5" strokeDasharray="6,4" />
          <text x="669" y="140" fontSize="9" fill="#c2c7b8" stroke="none">
            AGV PATH
          </text>
          <rect x="609" y="160" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="677" y="160" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="609" y="280" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="677" y="280" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="609" y="400" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="677" y="400" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="609" y="510" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="677" y="510" width="52" height="90" rx="3" fill="rgba(214, 218, 208, 0.08)" />
          <text x="669" y="615" fontSize="9" fill="#c2c7b8" stroke="none">
            WIP STAGING
          </text>
        </g>

        {/* Zone 6 Internal Layout: Blow Moulding 1 Output Bay */}
        <g id="equip-bm1-bay">
          <rect x="943" y="140" width="72" height="460" rx="4" strokeDasharray="4,4" />
          <text x="979" y="370" fontSize="9" fill="#c2c7b8" stroke="none">
            OUTPUT BAY
          </text>
        </g>

        {/* Zone 7 Internal Layout: Raw Material Area */}
        <g id="equip-rm-area">
          <rect x="1131" y="140" width="109" height="210" rx="4" strokeDasharray="4,4" />
          <text x="1185" y="240" fontSize="9" fill="#c2c7b8" stroke="none">
            STORAGE BINS
          </text>
          <rect x="1131" y="380" width="109" height="220" rx="4" />
          <line x1="1131" y1="430" x2="1240" y2="430" />
          <line x1="1131" y1="480" x2="1240" y2="480" />
          <line x1="1131" y1="530" x2="1240" y2="530" />
          <line x1="1131" y1="580" x2="1240" y2="580" />
          <text x="1185" y="615" fontSize="9" fill="#c2c7b8" stroke="none">
            RECEIVING DOCK
          </text>
        </g>

        {/* Dynamic Machine Units */}
        {MACHINE_LIST.map((machine) => (
          <MachineUnit
            key={machine.id}
            machine={machine}
            isActive={selectedItem?.type === 'machine' && selectedItem.id === machine.id}
            onClick={onSelectMachine}
            onMouseEnter={handleMachineMouseEnter}
            onMouseLeave={() => setCadGuide(null)}
          />
        ))}
      </g>

      {/* ARCHITECTURAL 3D WALL STRUCTURES */}
      <g
        className="architectural-walls"
        filter="url(#wall-shadow)"
        stroke="#d6dad0"
        strokeWidth="12"
        strokeLinejoin="round"
        strokeLinecap="square"
      >
        {/* Outer Perimeter Walls */}
        <line x1="25" y1="90" x2="1255" y2="90" />
        <line x1="1255" y1="90" x2="1255" y2="650" />
        <line x1="1255" y1="650" x2="25" y2="650" />
        <line x1="25" y1="650" x2="25" y2="90" />

        {/* Inner Partition Walls */}
        <line x1="172" y1="90" x2="172" y2="650" strokeWidth="10" />
        <line x1="384" y1="90" x2="384" y2="650" strokeWidth="10" />
        <line x1="596" y1="90" x2="596" y2="650" strokeWidth="10" />
        <line x1="743" y1="90" x2="743" y2="650" strokeWidth="10" />
        <line x1="930" y1="90" x2="930" y2="650" strokeWidth="10" />
        <line x1="1117" y1="90" x2="1117" y2="650" strokeWidth="10" />
      </g>

      {/* ARCHITECTURAL LABELS & DIMENSIONS */}
      <g className="architectural-labels" textAnchor="middle" fill="#e4e8db">
        {/* Zone 1 Label */}
        <g transform="translate(99, 70)">
          <rect x="-60" y="-16" width="120" height="22" rx="4" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-1" fontSize="10" fontWeight="700" letterSpacing="1" fill="#e4e8db">
            RAW MATERIAL IM
          </text>
        </g>

        {/* Zone 2 Label */}
        <g transform="translate(278, 70)">
          <rect x="-65" y="-18" width="130" height="26" rx="4" fill="#323b28" stroke="#ffffff" strokeWidth="1.5" />
          <text x="0" y="0" fontSize="14" fontWeight="800" letterSpacing="2" fill="#ffffff">
            IM1
          </text>
        </g>

        {/* Zone 3 Label */}
        <g transform="translate(490, 70)">
          <rect x="-65" y="-18" width="130" height="26" rx="4" fill="#323b28" stroke="#ffffff" strokeWidth="1.5" />
          <text x="0" y="0" fontSize="14" fontWeight="800" letterSpacing="2" fill="#ffffff">
            IM2
          </text>
        </g>

        {/* Zone 4 Label */}
        <g transform="translate(669, 70)">
          <rect x="-65" y="-16" width="130" height="22" rx="4" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-1" fontSize="10" fontWeight="700" letterSpacing="1" fill="#e4e8db">
            WIP GOODS AREA
          </text>
        </g>

        {/* Zone 5 Label */}
        <g transform="translate(836, 70)">
          <rect x="-70" y="-16" width="140" height="22" rx="4" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-1" fontSize="10" fontWeight="700" letterSpacing="1" fill="#e4e8db">
            BLOW MOULDING 2
          </text>
        </g>

        {/* Zone 6 Label */}
        <g transform="translate(1023, 70)">
          <rect x="-70" y="-16" width="140" height="22" rx="4" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-1" fontSize="10" fontWeight="700" letterSpacing="1" fill="#e4e8db">
            BLOW MOULDING 1
          </text>
        </g>

        {/* Zone 7 Label */}
        <g transform="translate(1185, 70)">
          <rect x="-55" y="-16" width="110" height="22" rx="4" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-1" fontSize="9" fontWeight="700" letterSpacing="1" fill="#e4e8db">
            RAW MAT AREA
          </text>
        </g>

        {/* Bottom Title Block Stamp */}
        <g transform="translate(640, 685)">
          <text
            x="0"
            y="-12"
            fontFamily="'Cinzel', serif"
            fontSize="13"
            fontWeight="600"
            letterSpacing="3"
            fill="#e4e8db"
          >
            GROUND FLOOR PLAN — 13,420 SQ.FT
          </text>
          <text
            x="0"
            y="4"
            fontSize="11"
            fontWeight="700"
            letterSpacing="2"
            fill="#c4ceb6"
          >
            STHAAYI / ACRON DESIGN LAB
          </text>
          <text
            x="0"
            y="18"
            fontSize="9"
            fontWeight="400"
            letterSpacing="1"
            fill="#98a488"
          >
            ARCHITECTURAL INDUSTRIAL LAYOUT & CONSERVATION
          </text>
        </g>
      </g>

      {/* CAD Hover Guide Overlay System */}
      <CadHoverGuides cadGuide={cadGuide} theme={theme} />
    </svg>
  );
};
