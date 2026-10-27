'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { SignalResult } from '@git-forensics/shared';

export default function SignalCard({ signal }: { signal: SignalResult }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPass = signal.status === 'PASS';
  const isWarning = signal.status === 'WARNING';
  const isAlert = signal.status === 'ALERT';

  const badgeConfig = isPass
    ? {
        label: 'Passed',
        icon: CheckCircle2,
        color: 'text-authentic',
        bg: 'bg-authentic/10',
        border: 'ring-authentic/30'
      }
    : isWarning
    ? {
        label: 'Warning',
        icon: AlertTriangle,
        color: 'text-warning',
        bg: 'bg-warning/10',
        border: 'ring-warning/30'
      }
    : isAlert
    ? {
        label: 'Red Flag',
        icon: AlertCircle,
        color: 'text-danger',
        bg: 'bg-danger/10',
        border: 'ring-danger/30'
      }
    : {
        label: 'Info',
        icon: Info,
        color: 'text-vibrant',
        bg: 'bg-vibrant/10',
        border: 'ring-vibrant/30'
      };

  const Icon = badgeConfig.icon;

  return (
    <div className="vibrant-card rounded-xl bg-dark-card ring-1 ring-dark-border hover:ring-dark-border/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${badgeConfig.bg} ring-1 ${badgeConfig.border}`}>
            <Icon className={`size-3.5 ${badgeConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-semibold text-white tracking-tight">
                {signal.name}
              </h4>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeConfig.bg} ${badgeConfig.color} ring-1 ${badgeConfig.border}`}>
                {badgeConfig.label}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-dark-muted">
              {signal.summary}
            </p>
          </div>
        </div>

        {/* Penalty Tag */}
        <div className="shrink-0 text-right">
          <span
            className={`font-mono text-[12px] font-semibold px-2 py-0.5 rounded ${
              signal.scorePenalty > 0
                ? 'bg-danger/15 text-danger ring-1 ring-danger/30'
                : 'bg-white/5 text-dark-muted ring-1 ring-white/10'
            }`}
          >
            {signal.scorePenalty > 0 ? `-${signal.scorePenalty} pts` : '0 pts'}
          </span>
        </div>
      </div>

      {/* Expandable Evidence Accordion */}
      <div className="mt-4 border-t border-dark-border/50 pt-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-[11px] font-medium text-dark-muted hover:text-white transition-colors"
        >
          <span>{isExpanded ? 'Hide Forensic Evidence' : 'Show Forensic Evidence & Metrics'}</span>
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-vibrant' : ''
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2.5 rounded-lg bg-dark-bg/60 p-3 ring-1 ring-dark-border/40 text-[12px]">
            <p className="text-dark-muted italic">
              {signal.explanation}
            </p>

            <div className="border-t border-dark-border/40 pt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              {Object.entries(signal.details).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-dark-muted/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-white/90 truncate">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
