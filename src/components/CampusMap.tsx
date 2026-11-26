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
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Interactive Campus Map</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any building zone to filter lost and found reports
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Lost
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Found
          </span>
          {selectedZone !== 'ALL' && (
            <button
              onClick={() => onSelectZone('ALL')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
            >
              Show All Zones
            </button>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-50/70 dark:bg-slate-950/60">
        <svg
          viewBox="0 0 800 460"
          className="w-full h-auto max-h-[380px] select-none"
          role="img"
          aria-label="Interactive University Campus Lost and Found Map"
        >
          {/* Campus Grounds Background */}
          <rect
            x="16"
            y="16"
            width="768"
            height="428"
            rx="24"
            className="fill-emerald-50/60 dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="2"
          />

          {/* Campus Walkways */}
          <g className="stroke-slate-300/80 dark:stroke-slate-700" strokeWidth="8" strokeLinecap="round" fill="none">
            <path d="M 115 385 L 185 270 L 245 125 L 560 115 L 695 195" />
            <path d="M 185 270 L 405 215 L 575 270 L 695 195" />
            <path d="M 245 125 L 405 215 L 340 365 L 575 270" />
            <path d="M 115 385 L 340 365" />
          </g>

          {/* Central Campus Lawn */}
          <ellipse
            cx="395"
            cy="285"
            rx="72"
            ry="34"
            className="fill-emerald-200/50 dark:fill-emerald-900/20 stroke-emerald-300/60 dark:stroke-emerald-800/50"
            strokeWidth="1.5"
          />
          <text
            x="395"
            y="289"
            textAnchor="middle"
            className="fill-emerald-800/60 dark:fill-emerald-400/50 text-[10px] font-semibold uppercase tracking-widest"
          >
            Central Lawn
          </text>

          {/* Interactive Building Zones */}
          {CAMPUS_ZONES.map((zone) => {
            const counts = countByZone(zone.id);
            const active = selectedZone === zone.id;
            return (
              <g
                key={zone.id}
                onClick={() => onSelectZone(active ? 'ALL' : zone.id)}
                className="cursor-pointer group"
              >
                {/* Building Footprint */}
                <rect
                  x={zone.x - 62}
                  y={zone.y - 28}
                  width="124"
                  height="56"
                  rx="14"
                  className={
                    active
                      ? 'fill-emerald-600 stroke-emerald-300 dark:fill-emerald-500'
                      : 'fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 group-hover:stroke-emerald-500'
                  }
                  strokeWidth={active ? 3 : 1.75}
                />

                {/* Building Label */}
                <text
                  x={zone.x}
                  y={zone.y - 3}
                  textAnchor="middle"
                  className={
                    active
                      ? 'fill-white text-[12px] font-bold'
                      : 'fill-slate-800 dark:fill-slate-100 text-[12px] font-bold'
                  }
                >
                  {zone.shortName}
                </text>

                {/* Active Item Pill inside Building */}
                <text
                  x={zone.x}
                  y={zone.y + 15}
                  textAnchor="middle"
                  className={
                    active
                      ? 'fill-emerald-100 text-[10px] font-medium'
                      : 'fill-slate-500 dark:fill-slate-400 text-[10px] font-medium'
                  }
                >
                  {counts.total === 0 ? 'No open reports' : `${counts.total} open report${counts.total > 1 ? 's' : ''}`}
                </text>

                {/* Lost Pin Badge (Top-Left) */}
                {counts.lost > 0 && (
                  <g transform={`translate(${zone.x - 52}, ${zone.y - 28})`}>
                    <circle r="11" className="fill-rose-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                    <text y="3.5" textAnchor="middle" className="fill-white text-[10px] font-extrabold">
                      {counts.lost}
                    </text>
                  </g>
                )}

                {/* Found Pin Badge (Top-Right) */}
                {counts.found > 0 && (
                  <g transform={`translate(${zone.x + 52}, ${zone.y - 28})`}>
                    <circle r="11" className="fill-emerald-500 stroke-white dark:stroke-slate-900" strokeWidth="2" />
                    <text y="3.5" textAnchor="middle" className="fill-white text-[10px] font-extrabold">
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
