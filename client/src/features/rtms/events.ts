import type {
  AlertItem,
  AlertPriority,
  AlertType,
  FactorySnapshot,
  Machine,
  TimelineEvent,
} from './types';

function at(h: number, m: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
}

/** Build a representative operating history timeline for a machine/shift. */
export function generateTimeline(m: Machine, keepLive = true): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let cursor = 8; // start of shift
  const seq: TimelineEvent['type'][] = ['Idle', 'Trial', 'Production', 'Idle', 'Production', 'Changeover', 'Trial', 'Production'];
  const durations = [25, 23, 197, 48, 160, 28, 20, 999];

  seq.forEach((type, i) => {
    const dur = durations[i];
    events.push({
      id: `${m.id}-e${i}`,
      machineId: m.id,
      start: at(cursor, 0),
      end: dur >= 999 ? null : at(Math.floor((cursor + dur) / 60), (cursor + dur) % 60),
      type,
      moldId: m.moldId,
      mode: type === 'Trial' ? 'Trial' : type === 'Production' ? 'Production' : 'None',
      durationMin: dur >= 999 ? Math.round((m.productionTime + m.trialTime) / 3) : dur,
    });
    cursor += dur;
  });

  return keepLive ? events : events.slice(0, -1);
}

export function generateTimelineFor(m: Machine): TimelineEvent[] {
  return generateTimeline(m);
}

function newAlert(
  priority: AlertPriority,
  type: AlertType,
  machineId: string,
  moldId: string | null,
  message: string,
  detail: string,
  idx: number
): AlertItem {
  const t = new Date();
  t.setMinutes(t.getMinutes() - idx * 7);
  return {
    id: `a-${machineId}-${idx}`,
    priority,
    type,
    machineId,
    moldId,
    message,
    detail,
    time: t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    read: idx > 4,
  };
}

/** Derive prioritized alerts from the live factory snapshot. */
export function generateAlerts(snapshot: FactorySnapshot): AlertItem[] {
  const out: AlertItem[] = [];
  let idx = 0;

  snapshot.machines.forEach((m) => {
    const k = snapshot.kpis.find((k) => k.machineId === m.id);
    if (!k) return;

    // Cavity loss alert
    if (m.cavity.active < m.cavity.total && m.status === 'Running') {
      out.push(
        newAlert(
          'Critical',
          'Cavity',
          m.id,
          m.moldId,
          `Cavity loss on ${m.id}`,
          `Mold ${m.moldId} — expected ${m.cavity.total} cavities, actual ${m.cavity.active}. Loss ${k.actualQty > 0 ? Math.round((1 - k.cavityEfficiency / 100) * 100) : 0} active. ${Math.min(120, Math.round(m.successfulCycles * 0.02))} cycles affected.`,
          idx++
        )
      );
    }

    // Trial timeout alert
    if (m.status === 'Trial') {
      const mins = Math.round(m.trialTime);
      out.push(
        newAlert(
          mins > 60 ? 'Warning' : 'Information',
          'Trial',
          m.id,
          m.moldId,
          `Trial in progress on ${m.id}`,
          `Mold ${m.moldId} in Trial mode for ${mins} minute${mins > 1 ? 's' : ''}.${mins > 60 ? ' Approaching trial limit.' : ''}`,
          idx++
        )
      );
    }

    // Utilization alert
    if (m.status === 'Running' && k.utilization < 75) {
      out.push(
        newAlert(
          'Warning',
          'Utilization',
          m.id,
          m.moldId,
          `Low utilization on ${m.id}`,
          `Machine utilization at ${Math.round(k.utilization)}% — below 75% target.`,
          idx++
        )
      );
    }

    // Breakdown / stoppage
    if (m.status === 'Stopped') {
      out.push(
        newAlert(
          'Critical',
          'Breakdown',
          m.id,
          m.moldId,
          `${m.id} stopped`,
          `Machine stopped with ${m.changeoverTime + m.idleTime} min of downtime logged.`,
          idx++
        )
      );
    }

    // Achievement alert
    if (m.targetQty > 0 && k.achievement >= 100) {
      out.push(
        newAlert(
          'Information',
          'Achievement',
          m.id,
          m.moldId,
          `Target achieved on ${m.id}`,
          `Actual ${k.actualQty.toLocaleString('en-IN')} of ${m.targetQty.toLocaleString('en-IN')} target (${Math.round(k.achievement)}%).`,
          idx++
        )
      );
    }
  });

  // Mold change / install events
  out.push(
    newAlert('Information', 'MoldInstall', 'M-021', 'MD-021', 'Mold installed', 'MD-021 installed on M-021 at 11:03 AM (Trial mode).', idx++),
    newAlert('Information', 'MoldChange', 'M-024', 'MD-024', 'Mold changed on M-024', 'MD-024 removed from M-024 at 10:42 AM; starting new changeover.', idx++)
  );

  return out.sort((a, b) => {
    const rank = { Critical: 0, Warning: 1, Information: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });
}
