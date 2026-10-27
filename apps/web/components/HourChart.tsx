'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

export default function HourChart({ data }: { data: Record<number, number> }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const values = hours.map((h) => data[h] || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div className="rounded-xl bg-dark-card ring-1 ring-dark-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-vibrant" />
          <h4 className="text-[14px] font-semibold text-white tracking-tight">
            24-Hour Diurnal Commit Distribution
          </h4>
        </div>
        <span className="text-[11px] font-mono text-dark-muted">
          {hoveredHour !== null
            ? `${hoveredHour}:00 - ${hoveredHour + 1}:00: ${data[hoveredHour] || 0} commits`
            : 'Hover bars for details'}
        </span>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative h-36 w-full pt-4">
        <div className="flex h-24 items-end gap-1.5 sm:gap-2">
          {hours.map((hour) => {
            const count = data[hour] || 0;
            const heightPercent = Math.max((count / maxVal) * 100, 4);
            const isHovered = hoveredHour === hour;
            const isNight = hour >= 0 && hour < 6;

            return (
              <div
                key={hour}
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
                className="group relative flex-1 flex flex-col items-center cursor-pointer h-full justify-end"
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-150 ${
                    isHovered
                      ? 'bg-vibrant shadow-vibrant-glow'
                      : isNight
                      ? 'bg-white/10 group-hover:bg-vibrant/70'
                      : 'bg-white/25 group-hover:bg-vibrant/80'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Hour Labels */}
        <div className="flex justify-between border-t border-dark-border/60 pt-2 text-[10px] font-mono text-dark-muted">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:59</span>
        </div>
      </div>
    </div>
  );
}
