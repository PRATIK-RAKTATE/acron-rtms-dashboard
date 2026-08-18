import { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, ArrowRight, X, ShieldAlert, Info } from 'lucide-react';
import { useRtmsContext } from '../RtmsContext';

export function AlertBell() {
  const context = useRtmsContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const alerts = context?.alerts ?? [];
  const go = context?.go;
  const goMachine = context?.goMachine;

  const criticalCount = alerts.filter((a) => a.priority === 'Critical').length;
  const totalCount = alerts.length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Alert Bell Button with Badge Count on Top */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer group flex items-center justify-center ${
          isOpen
            ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 ring-2 ring-sky-500/30'
            : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20'
        }`}
        title={`${totalCount} Active Alerts (${criticalCount} Critical)`}
        aria-label="Alert Notifications"
      >
        <Bell
          className={`w-5 h-5 transition-transform duration-300 ${
            criticalCount > 0
              ? 'text-amber-400 group-hover:rotate-12'
              : 'text-zinc-400 group-hover:scale-105'
          }`}
        />

        {/* Floating Top Badge with Alert Count */}
        {totalCount > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 flex items-center justify-center text-[10px] font-extrabold font-mono text-white rounded-full border shadow-lg transition-all animate-pulse ${
              criticalCount > 0
                ? 'bg-gradient-to-r from-red-600 to-rose-500 border-red-400/50 shadow-red-500/50'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 border-amber-300/50 shadow-amber-500/40'
            }`}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Floating Recent 4 Alerts Panel situated to the LEFT of the icon */}
      {isOpen && (
        <div className="absolute right-full top-0 mr-3 w-84 sm:w-96 rounded-2xl border border-white/15 bg-[#141820]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-right-3 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-400" />
              <span className="font-['Space_Grotesk'] font-bold text-xs text-zinc-100 uppercase tracking-wide">
                Recent 4 Alerts
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500/20 text-red-300 border border-red-500/30">
                {totalCount} Active
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alert Items List - Recent 4 Alerts */}
          <div className="p-2 space-y-1.5 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-5 text-center text-zinc-500 text-xs">
                No active alerts at this time.
              </div>
            ) : (
              alerts.slice(0, 4).map((alert, idx) => {
                const isCritical = alert.priority === 'Critical';
                const isWarning = alert.priority === 'Warning';
                return (
                  <button
                    key={alert.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (alert.machineId && goMachine) {
                        goMachine(alert.machineId);
                      } else if (go) {
                        go('alerts');
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex gap-2.5 ${
                      isCritical
                        ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                        : isWarning
                        ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/15'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 flex flex-col items-center gap-1">
                      {isCritical ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Info className="w-4 h-4 text-sky-400" />
                      )}
                      <span className="text-[9px] font-bold font-mono text-zinc-500">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-200 truncate">
                          {alert.message}
                        </span>
                        <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                          {alert.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-tight">
                        {alert.detail}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer view all button */}
          <div className="p-2 border-t border-white/10 bg-white/[0.02]">
            <button
              onClick={() => {
                setIsOpen(false);
                if (go) go('alerts');
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              View All Alerts & Events ({totalCount}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
