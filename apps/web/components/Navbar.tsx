import Link from 'next/link';
import { ShieldCheck, Github, ExternalLink } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-6 items-center justify-center rounded-md bg-vibrant/10 ring-1 ring-vibrant/30 group-hover:ring-vibrant/60 transition-all">
            <ShieldCheck className="size-4 text-vibrant" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-white flex items-center gap-1.5">
            GitForensics
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-vibrant/15 text-vibrant ring-1 ring-vibrant/30">
              v1.0
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/report/demo"
            className="text-[12px] text-dark-muted hover:text-white transition-colors flex items-center gap-1"
          >
            Live Demo
          </Link>
          <div className="h-3 w-[1px] bg-dark-border" />
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-medium text-dark-muted hover:text-white transition-colors"
          >
            <Github className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
