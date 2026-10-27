'use client';

import { ShieldCheck, Bot } from 'lucide-react';

interface DemoSwitcherProps {
  activeModel: 'authentic' | 'bot';
  onSwitch: (model: 'authentic' | 'bot') => void;
}

export default function DemoSwitcher({ activeModel, onSwitch }: DemoSwitcherProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-dark-card/90 ring-1 ring-dark-border p-2 backdrop-blur-md">
      <div className="flex items-center gap-2 pl-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-dark-muted">
          Interactive Figma Preview:
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-dark-bg p-1 rounded-lg ring-1 ring-dark-border/50">
        <button
          type="button"
          onClick={() => onSwitch('authentic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
            activeModel === 'authentic'
              ? 'bg-authentic/15 text-authentic ring-1 ring-authentic/30 shadow-sm'
              : 'text-dark-muted hover:text-white'
          }`}
        >
          <ShieldCheck className="size-3.5" />
          <span>🟢 Authentic Repo (PulseOps)</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitch('bot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
            activeModel === 'bot'
              ? 'bg-danger/15 text-danger ring-1 ring-danger/30 shadow-sm'
              : 'text-dark-muted hover:text-white'
          }`}
        >
          <Bot className="size-3.5" />
          <span>🔴 Spoofed Bot Repo (Streak)</span>
        </button>
      </div>
    </div>
  );
}
