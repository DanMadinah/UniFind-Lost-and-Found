import { CAMPUS_ZONES } from '../data/matcher';
import { CampusZoneId, LostFoundItem } from '../types';

interface CampusMapProps {
  items: LostFoundItem[];
  selectedZone: CampusZoneId | 'ALL';
  onSelectZone: (zone: CampusZoneId | 'ALL') => void;
}

export function CampusMap({ items, selectedZone, onSelectZone }: CampusMapProps) {
  const activeItems = items.filter((i) => i.status !== 'Returned');

  const countByZone = (zoneId: CampusZoneId) => {
    const zoneItems = activeItems.filter((i) => i.zoneId === zoneId);
    return {
      lost: zoneItems.filter((i) => i.kind === 'LOST').length,
      found: zoneItems.filter((i) => i.kind === 'FOUND').length,
      total: zoneItems.length,
    };
  };

  return (
    <div className="rounded-3xl bg-zinc-950 text-white border border-indigo-500/20 shadow-xl overflow-hidden relative">
      {/* Floating Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-indigo-950/90 via-zinc-950 to-teal-950/70">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <h2 className="font-display text-sm font-bold tracking-tight">Live Campus Radar Map</h2>
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Click a zone pin to filter items
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-rose-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Lost
          </span>
          <span className="inline-flex items-center gap-1.5 text-teal-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400" /> Found
          </span>
          {selectedZone !== 'ALL' && (
            <button
              onClick={() => onSelectZone('ALL')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Blueprint SVG Canvas */}
      <div className="p-3 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.22),transparent_65%)]">
        <svg
          viewBox="0 0 800 440"
          className="w-full h-auto max-h-[340px] select-none"
          role="img"
          aria-label="Live Campus Radar Map"
        >
          {/* Blueprint Grid Lines */}
          <defs>
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(129,140,248,0.12)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="8" y="8" width="784" height="424" rx="20" fill="url(#radarGrid)" stroke="rgba(129,140,248,0.2)" />

          {/* Campus Connecting Paths */}
          <g stroke="rgba(148,163,184,0.22)" strokeWidth="2.5" strokeDasharray="6 6" fill="none">
            <path d="M 115 370 L 185 260 L 245 120 L 560 110 L 695 190" />
            <path d="M 185 260 L 405 210 L 575 260 L 695 190" />
            <path d="M 245 120 L 405 210 L 340 355 L 575 260" />
            <path d="M 115 370 L 340 355" />
          </g>

          {/* Interactive Zone Nodes */}
          {CAMPUS_ZONES.map((zone) => {
            const counts = countByZone(zone.id);
            const active = selectedZone === zone.id;
            const y = zone.y - 10;
            return (
              <g
                key={zone.id}
                onClick={() => onSelectZone(active ? 'ALL' : zone.id)}
                className="cursor-pointer group"
              >
                {/* Radar Ping Ring when zone has active items */}
                {counts.total > 0 && (
                  <circle
                    cx={zone.x}
                    cy={y}
                    r="24"
                    className={`radar-ping ${counts.lost > 0 ? 'fill-rose-500/30' : 'fill-teal-400/30'}`}
                  />
                )}

                {/* Glass Pill Node */}
                <rect
                  x={zone.x - 62}
                  y={y - 24}
                  width="124"
                  height="48"
                  rx="24"
                  className={
                    active
                      ? 'fill-indigo-600 stroke-indigo-300'
                      : 'fill-zinc-900/90 stroke-white/15 group-hover:stroke-indigo-400'
                  }
                  strokeWidth={active ? 2.5 : 1.5}
                />

                <text
                  x={zone.x}
                  y={y - 2}
                  textAnchor="middle"
                  className="fill-white text-[12px] font-bold"
                >
                  {zone.shortName}
                </text>
                <text
                  x={zone.x}
                  y={y + 13}
                  textAnchor="middle"
                  className={active ? 'fill-indigo-100 text-[10px]' : 'fill-zinc-400 text-[10px]'}
                >
                  {counts.total === 0 ? 'Quiet' : `${counts.total} active`}
                </text>

                {counts.lost > 0 && (
                  <g transform={`translate(${zone.x - 50}, ${y - 22})`}>
                    <circle r="10.5" className="fill-rose-500 stroke-zinc-950" strokeWidth="2" />
                    <text y="3.5" textAnchor="middle" className="fill-white text-[10px] font-extrabold">
                      {counts.lost}
                    </text>
                  </g>
                )}

                {counts.found > 0 && (
                  <g transform={`translate(${zone.x + 50}, ${y - 22})`}>
                    <circle r="10.5" className="fill-teal-400 stroke-zinc-950" strokeWidth="2" />
                    <text y="3.5" textAnchor="middle" className="fill-zinc-950 text-[10px] font-extrabold">
                      {counts.found}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
