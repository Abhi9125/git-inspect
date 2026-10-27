'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import DemoSwitcher from '../../../components/DemoSwitcher';
import ReportHeader from '../../../components/ReportHeader';
import ScoreGauge from '../../../components/ScoreGauge';
import SignalCard from '../../../components/SignalCard';
import HourChart from '../../../components/HourChart';
import WeekdayChart from '../../../components/WeekdayChart';
import { MOCK_AUTHENTIC_REPORT, MOCK_BOT_REPORT } from '../../../lib/mockData';

export default function ReportPage() {
  const [activeModel, setActiveModel] = useState<'authentic' | 'bot'>('authentic');

  const report = activeModel === 'authentic' ? MOCK_AUTHENTIC_REPORT : MOCK_BOT_REPORT;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Controls: Back link + Interactive Demo Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Analyze Another Repository</span>
        </Link>

        {/* The interactive Figma toggle */}
        <DemoSwitcher activeModel={activeModel} onSwitch={setActiveModel} />
      </div>

      {/* Main Report Header (Stats Ribbon, Repo Title, Badge copy) */}
      <ReportHeader report={report} />

      {/* Authenticity Score Gauge Card */}
      <ScoreGauge
        score={report.score}
        verdict={report.verdict}
        confidence={report.confidence}
        verdictTitle={report.verdictTitle}
        verdictDescription={report.verdictDescription}
      />

      {/* 7 Forensic Signals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              Forensic Signal Analysis
            </h3>
            <p className="text-[12px] text-dark-muted">
              Deep inspection across 7 behavioral dimensions
            </p>
          </div>
          <span className="text-[11px] font-mono text-dark-muted">
            {report.signals.filter((s) => s.status === 'PASS').length}/7 Signals Cleared
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </div>

      {/* Visual Analytics Grid: 24-hr & Weekday Charts */}
      <div>
        <h3 className="text-lg font-bold tracking-tight text-white mb-4">
          Chronological Patterns & Behavior
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HourChart data={report.hourDistribution} />
          <WeekdayChart data={report.weekdayDistribution} />
        </div>
      </div>

      {/* Bottom CTA to scan another repo */}
      <div className="rounded-xl bg-dark-card border border-dark-border p-6 text-center space-y-3">
        <h4 className="text-base font-semibold text-white">
          Want to verify another GitHub repository?
        </h4>
        <p className="text-[13px] text-dark-muted max-w-md mx-auto">
          Test any open-source repo, personal project, or suspected fake activity graph in seconds.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-vibrant px-4 py-2 text-[13px] font-medium text-white hover:bg-vibrant-hover shadow-vibrant-glow transition-all"
        >
          <RotateCcw className="size-3.5" />
          <span>Scan New Repo</span>
        </Link>
      </div>
    </div>
  );
}
