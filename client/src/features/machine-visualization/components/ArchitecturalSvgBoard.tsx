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

      if (curX >= 30 && curX <= 1890 && curY >= 135 && curY <= 975) {
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

  const handleZoneMouseEnter = () => {
    setCadGuide(null);
  };

  const handleMachineMouseEnter = () => {
    setCadGuide(null);
  };

  return (
    <svg
      ref={svgRef}
      id="architectural-svg"
      className="w-full h-full drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] select-none font-['Space_Grotesk']"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        {/* 3D Wall Drop Shadow Filter */}
        <filter id="wall-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="12" dy="18" stdDeviation="9" floodColor="#0e130a" floodOpacity="0.65" />
          <feDropShadow dx="5" dy="6" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Machinery Drop Shadow Filter */}
        <filter id="equip-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.35" />
        </filter>

        {/* Glowing Green Shadow Filter */}
        <filter id="green-glow-filter" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#22c55e" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#4ade80" floodOpacity="0.5" />
        </filter>

        {/* Hatch Patterns for Storage & WIP Areas */}
        <pattern
          id="hatch-pattern"
          width="18"
          height="18"
          patternTransform="rotate(45 0 0)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="18" stroke="rgba(228, 232, 219, 0.08)" strokeWidth="2" />
        </pattern>
        <pattern id="grid-pattern" width="45" height="45" patternUnits="userSpaceOnUse">
          <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Background Floor Grid */}
      <rect width="1920" height="1080" fill="url(#grid-pattern)" />

      {/* Zone Floor Sub-Bays */}
      <g className="zone-floors">
        {/* Zone 1: Raw Material IM */}
        <rect
          id="bay-rm-im"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-rm-im'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="48"
          y="165"
          width="203"
          height="780"
          rx="12"
          fill="#38432e"
          onClick={() => onSelectZone(ZONE_DATA['bay-rm-im'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 2: IM1 */}
        <rect
          id="bay-im1"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-im1'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="267"
          y="165"
          width="300"
          height="780"
          rx="12"
          fill="#3c4832"
          onClick={() => onSelectZone(ZONE_DATA['bay-im1'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 3: IM2 */}
        <rect
          id="bay-im2"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-im2'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="585"
          y="165"
          width="300"
          height="780"
          rx="12"
          fill="#3f4b34"
          onClick={() => onSelectZone(ZONE_DATA['bay-im2'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 4: WIP Goods Area */}
        <rect
          id="bay-wip"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-wip'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="903"
          y="165"
          width="203"
          height="780"
          rx="12"
          fill="url(#hatch-pattern)"
          stroke="rgba(228, 232, 219, 0.15)"
          strokeWidth="1"
          onClick={() => onSelectZone(ZONE_DATA['bay-wip'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 5: Blow Moulding 2 */}
        <rect
          id="bay-bm2"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-bm2'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="1124"
          y="165"
          width="263"
          height="780"
          rx="12"
          fill="#435037"
          onClick={() => onSelectZone(ZONE_DATA['bay-bm2'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 6: Blow Moulding 1 */}
        <rect
          id="bay-bm1"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-bm1'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="1404"
          y="165"
          width="263"
          height="780"
          rx="12"
          fill="#46543a"
          onClick={() => onSelectZone(ZONE_DATA['bay-bm1'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
        {/* Zone 7: Raw Material Area */}
        <rect
          id="bay-rm-area"
          className={`zone-bay cursor-pointer transition-all duration-250 hover:opacity-90 hover:stroke-[#cad4b8] hover:stroke-2 ${selectedItem?.type === 'zone' && selectedItem.id === 'bay-rm-area'
              ? 'stroke-white stroke-[3px]'
              : ''
            }`}
          x="1685"
          y="165"
          width="188"
          height="780"
          rx="12"
          fill="#3b4630"
          onClick={() => onSelectZone(ZONE_DATA['bay-rm-area'])}
          onMouseEnter={() => handleZoneMouseEnter()}
          onMouseLeave={() => setCadGuide(null)}
        />
      </g>

      {/* INTERNAL MACHINERY & FURNITURE VECTOR ILLUSTRATIONS */}
      <g
        className="internal-equipment"
        filter="url(#equip-shadow)"
        stroke="#d6dad0"
        strokeWidth="1.5"
        fill="none"
        textAnchor="middle"
      >
        {/* Zone 1 Internal Layout: Raw Material IM */}
        <g id="equip-rm-im">
          <circle cx="111" cy="255" r="33" stroke="#d6dad0" strokeWidth="3" fill="rgba(214, 218, 208, 0.08)" />
          <circle cx="186" cy="255" r="33" stroke="#d6dad0" strokeWidth="3" fill="rgba(214, 218, 208, 0.08)" />
          <circle cx="111" cy="255" r="12" stroke="#a1a896" />
          <circle cx="186" cy="255" r="12" stroke="#a1a896" />
          <text x="149" y="315" fontSize="13" fill="#c2c7b8" stroke="none">
            SILO HOPPERS
          </text>
          <rect x="66" y="360" width="167" height="225" rx="6" strokeDasharray="6,6" />
          <rect x="78" y="375" width="63" height="90" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="158" y="375" width="63" height="90" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="78" y="480" width="63" height="90" fill="rgba(214, 218, 208, 0.05)" />
          <rect x="158" y="480" width="63" height="90" fill="rgba(214, 218, 208, 0.05)" />
          <text x="149" y="615" fontSize="13" fill="#c2c7b8" stroke="none">
            STAGING RACKS
          </text>
          <rect x="66" y="660" width="167" height="225" rx="6" />
          <line x1="66" y1="713" x2="233" y2="713" />
          <line x1="66" y1="765" x2="233" y2="765" />
          <line x1="66" y1="818" x2="233" y2="818" />
          <line x1="149" y1="660" x2="149" y2="885" />
          <text x="149" y="915" fontSize="13" fill="#c2c7b8" stroke="none">
            RESIN PALLETS
          </text>
        </g>

        {/* Zone 4 Internal Layout: WIP Goods Area */}
        <g id="equip-wip">
          <line x1="1004" y1="180" x2="1004" y2="930" stroke="#d6dad0" strokeWidth="2" strokeDasharray="9,6" />
          <text x="1004" y="210" fontSize="13" fill="#c2c7b8" stroke="none">
            AGV PATH
          </text>
          <rect x="914" y="240" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="1016" y="240" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="914" y="420" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="1016" y="420" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="914" y="600" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="1016" y="600" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="914" y="765" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <rect x="1016" y="765" width="78" height="135" rx="5" fill="rgba(214, 218, 208, 0.08)" />
          <text x="1004" y="923" fontSize="13" fill="#c2c7b8" stroke="none">
            WIP STAGING
          </text>
        </g>

        {/* Zone 6 Internal Layout: Blow Moulding 1 Output Bay */}
        <g id="equip-bm1-bay">
          <rect x="1415" y="210" width="108" height="690" rx="6" strokeDasharray="6,6" />
          <text x="1469" y="555" fontSize="13" fill="#c2c7b8" stroke="none">
            OUTPUT BAY
          </text>
        </g>

        {/* Zone 7 Internal Layout: Raw Material Area */}
        <g id="equip-rm-area">
          <rect x="1697" y="210" width="164" height="315" rx="6" strokeDasharray="6,6" />
          <text x="1778" y="360" fontSize="13" fill="#c2c7b8" stroke="none">
            STORAGE BINS
          </text>
          <rect x="1697" y="570" width="164" height="330" rx="6" />
          <line x1="1697" y1="645" x2="1861" y2="645" />
          <line x1="1697" y1="720" x2="1861" y2="720" />
          <line x1="1697" y1="795" x2="1861" y2="795" />
          <line x1="1697" y1="870" x2="1861" y2="870" />
          <text x="1778" y="923" fontSize="13" fill="#c2c7b8" stroke="none">
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
        strokeWidth="18"
        strokeLinejoin="round"
        strokeLinecap="square"
      >
        {/* Outer Perimeter Walls */}
        <line x1="38" y1="135" x2="1883" y2="135" />
        <line x1="1883" y1="135" x2="1883" y2="975" />
        <line x1="1883" y1="975" x2="38" y2="975" />
        <line x1="38" y1="975" x2="38" y2="135" />

        {/* Inner Partition Walls */}
        <line x1="258" y1="135" x2="258" y2="975" strokeWidth="15" />
        <line x1="576" y1="135" x2="576" y2="975" strokeWidth="15" />
        <line x1="894" y1="135" x2="894" y2="975" strokeWidth="15" />
        <line x1="1115" y1="135" x2="1115" y2="975" strokeWidth="15" />
        <line x1="1395" y1="135" x2="1395" y2="975" strokeWidth="15" />
        <line x1="1676" y1="135" x2="1676" y2="975" strokeWidth="15" />
      </g>

      {/* ARCHITECTURAL LABELS & DIMENSIONS */}
      <g className="architectural-labels" textAnchor="middle" fill="#e4e8db">
        {/* Zone 1 Label */}
        <g transform="translate(149, 105)">
          <rect x="-90" y="-24" width="180" height="33" rx="6" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-2" fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#e4e8db">
            RAW MATERIAL IM
          </text>
        </g>

        {/* Zone 2 Label */}
        <g transform="translate(417, 105)">
          <rect x="-98" y="-27" width="195" height="39" rx="6" fill="#323b28" stroke="#ffffff" strokeWidth="2" />
          <text x="0" y="0" fontSize="20" fontWeight="800" letterSpacing="3" fill="#ffffff">
            IM1
          </text>
        </g>

        {/* Zone 3 Label */}
        <g transform="translate(735, 105)">
          <rect x="-98" y="-27" width="195" height="39" rx="6" fill="#323b28" stroke="#ffffff" strokeWidth="2" />
          <text x="0" y="0" fontSize="20" fontWeight="800" letterSpacing="3" fill="#ffffff">
            IM2
          </text>
        </g>

        {/* Zone 4 Label */}
        <g transform="translate(1004, 105)">
          <rect x="-98" y="-24" width="195" height="33" rx="6" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-2" fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#e4e8db">
            WIP GOODS AREA
          </text>
        </g>

        {/* Zone 5 Label */}
        <g transform="translate(1254, 105)">
          <rect x="-105" y="-24" width="210" height="33" rx="6" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-2" fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#e4e8db">
            BLOW MOULDING 2
          </text>
        </g>

        {/* Zone 6 Label */}
        <g transform="translate(1535, 105)">
          <rect x="-105" y="-24" width="210" height="33" rx="6" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-2" fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#e4e8db">
            BLOW MOULDING 1
          </text>
        </g>

        {/* Zone 7 Label */}
        <g transform="translate(1778, 105)">
          <rect x="-83" y="-24" width="165" height="33" rx="6" fill="#323b28" stroke="#a8b49a" strokeWidth="1" />
          <text x="0" y="-2" fontSize="13" fontWeight="700" letterSpacing="1.5" fill="#e4e8db">
            RAW MAT AREA
          </text>
        </g>

        {/* Bottom Title Block Stamp */}
        <g transform="translate(960, 1028)">
          <text
            x="0"
            y="-18"
            fontFamily="'Cinzel', serif"
            fontSize="18"
            fontWeight="600"
            letterSpacing="4"
            fill="#e4e8db"
          >
            GROUND FLOOR PLAN — 13,420 SQ.FT
          </text>
          <text
            x="0"
            y="6"
            fontSize="15"
            fontWeight="700"
            letterSpacing="3"
            fill="#c4ceb6"
          >
            STHAAYI / ACRON DESIGN LAB
          </text>
          <text
            x="0"
            y="27"
            fontSize="12"
            fontWeight="400"
            letterSpacing="1.5"
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
