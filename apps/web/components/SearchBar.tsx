'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { DEMO_PRESETS } from '@git-forensics/shared';

export default function SearchBar() {
  const [repoUrl, setRepoUrl] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoUrl.trim();
    if (!trimmed) return;

    // Sanitize input (handles both full URL and owner/repo shorthand)
    let clean = trimmed.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (!clean.includes('/')) {
      clean = `${clean}/repo`;
    }
    
    // Redirect to simulated scan page
    const encoded = encodeURIComponent(clean.replace('/', '--'));
    router.push(`/scan/${encoded}`);
  };

  const selectPreset = (owner: string, repo: string) => {
    setRepoUrl(`https://github.com/${owner}/${repo}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center rounded-xl bg-dark-card/90 ring-1 ring-dark-border focus-within:ring-vibrant/60 shadow-lg shadow-black/40 backdrop-blur-sm transition-all duration-200">
          <div className="pl-4 pr-2 text-dark-muted group-focus-within:text-vibrant transition-colors">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste public GitHub repository URL (e.g. facebook/react)"
            className="w-full bg-transparent py-3.5 pr-28 text-[14px] text-white placeholder-dark-muted focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 inline-flex items-center gap-1.5 rounded-lg bg-vibrant px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-vibrant-hover active:scale-[0.98] transition-all"
          >
            <span>Analyze</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </form>

      {/* Preset Chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12px] text-dark-muted">
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-dark-muted/80 mr-1">
          <Sparkles className="size-3 text-vibrant" /> Quick Try:
        </span>
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => selectPreset(preset.owner, preset.repo)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium bg-dark-card/80 ring-1 ring-dark-border hover:ring-vibrant/40 hover:text-white transition-all active:scale-95"
          >
            <span className="font-mono text-white/90">{preset.label}</span>
            <span className="text-[10px] text-dark-muted font-normal">({preset.tag})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
