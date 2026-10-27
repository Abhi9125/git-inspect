'use client';

import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Verdict, Confidence } from '@git-forensics/shared';

interface ScoreGaugeProps {
  score: number;
  verdict: Verdict;
  confidence: Confidence;
  verdictTitle: string;
  verdictDescription: string;
}

export default function ScoreGauge({
  score,
  verdict,
  confidence,
  verdictTitle,
  verdictDescription
}: ScoreGaugeProps) {
  const isAuthentic = verdict === 'AUTHENTIC';
  const isMixed = verdict === 'MIXED';
  const isSuspicious = verdict === 'SUSPICIOUS';

  const theme = isAuthentic
    ? {
        color: '#10B981',
        text: 'text-authentic',
        bg: 'bg-authentic/10',
        ring: 'ring-authentic/30',
        glow: 'rgba(16, 185, 129, 0.2)',
        icon: ShieldCheck,
        badge: '🟢 HIGH CONFIDENCE'
      }
    : isMixed
    ? {
        color: '#F59E0B',
        text: 'text-warning',
        bg: 'bg-warning/10',
        ring: 'ring-warning/30',
        glow: 'rgba(245, 158, 11, 0.2)',
        icon: AlertTriangle,
        badge: '🟡 MODERATE CONFIDENCE'
      }
    : {
        color: '#EF4444',
        text: 'text-danger',
        bg: 'bg-danger/10',
        ring: 'ring-danger/30',
        glow: 'rgba(239, 68, 68, 0.2)',
        icon: AlertOctagon,
        badge: '🔴 SUSPICIOUS PATTERN'
      };

  const Icon = theme.icon;

  // SVG Radial meter math
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-dark-card p-6 ring-1 ring-dark-border shadow-xl">
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 size-48 rounded-full blur-3xl opacity-30"
        style={{ background: theme.color }}
      />

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Circular Radial Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="size-36 -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active meter */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={theme.color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
                filter: `drop-shadow(0 0 8px ${theme.glow})`
              }}
            />
          </svg>

          {/* Centered Score */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
              {score}
            </span>
            <span className="text-[11px] font-medium text-dark-muted uppercase tracking-wider">
              / 100
            </span>
          </div>
        </div>

        {/* Verdict Details */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 mb-2.5"
            style={{
              backgroundColor: isAuthentic ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              borderColor: isAuthentic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
              color: theme.color
            }}
          >
            <Icon className="size-3.5" />
            <span>{theme.badge}</span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-white mb-1.5">
            {verdictTitle}
          </h3>

          <p className="text-[13px] text-dark-muted leading-relaxed max-w-xl">
            {verdictDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
