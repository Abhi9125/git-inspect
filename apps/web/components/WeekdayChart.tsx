'use client';

import { Calendar } from 'lucide-react';

export default function WeekdayChart({ data }: { data: Record<string, number> }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const total = Object.values(data).reduce((acc, v) => acc + v, 0) || 1;

  return (
    <div className="rounded-xl bg-dark-card ring-1 ring-dark-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-vibrant" />
          <h4 className="text-[14px] font-semibold text-white tracking-tight">
            Weekday vs Weekend Activity
          </h4>
        </div>
        <span className="text-[11px] font-mono text-dark-muted">
          Total: {total.toLocaleString()} commits
        </span>
      </div>

      <div className="space-y-2.5">
        {days.map((day) => {
          const count = data[day] || 0;
          const percent = Math.round((count / total) * 100);
          const isWeekend = day === 'Sat' || day === 'Sun';

          return (
            <div key={day} className="flex items-center gap-3 text-[12px]">
              <span className={`w-8 font-mono font-medium ${isWeekend ? 'text-dark-muted' : 'text-white/90'}`}>
                {day}
              </span>
              <div className="relative h-2 flex-1 rounded-full bg-dark-bg ring-1 ring-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWeekend ? 'bg-amber-500/70' : 'bg-vibrant'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-[11px] text-dark-muted">
                {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
