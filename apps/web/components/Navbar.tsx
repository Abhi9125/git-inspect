'use client';

import Link from 'next/link';
import { ShieldCheck, Github, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex size-7 items-center justify-center rounded-md bg-vibrant/10 ring-1 ring-vibrant/30 group-hover:ring-vibrant/60 transition-all">
            <ShieldCheck className="size-4 text-vibrant" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-white flex items-center gap-1.5">
            GitForensics
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-vibrant/15 text-vibrant ring-1 ring-vibrant/30">
              v1.0
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/report/demo"
            className="text-[12px] font-medium text-dark-muted hover:text-white transition-colors hidden sm:flex items-center gap-1"
          >
            <Sparkles className="size-3 text-vibrant" />
            <span>Interactive Demo</span>
          </Link>

          <div className="h-3 w-[1px] bg-dark-border hidden sm:block" />

          {isLoading ? (
            <div className="h-7 w-20 bg-dark-card animate-pulse rounded-lg" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-full bg-dark-card ring-1 ring-dark-border pl-1 pr-2.5 py-1 text-[11px] font-mono">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.login}
                    className="size-5 rounded-full ring-1 ring-white/10"
                  />
                ) : (
                  <div className="size-5 rounded-full bg-vibrant/20 flex items-center justify-center text-[10px] font-bold text-vibrant">
                    {user.login[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-semibold text-white/90">@{user.login}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-authentic bg-authentic/10 px-1.5 py-0.2 rounded-full ring-1 ring-authentic/20">
                  <span className="size-1 rounded-full bg-authentic animate-pulse" />
                  5k Quota
                </span>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                title="Sign out"
                className="text-dark-muted hover:text-danger transition-colors p-1 rounded-md hover:bg-white/5"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => login()}
                title="Public Profile Only (read:user) • Zero access to your private repos"
                className="inline-flex items-center gap-1.5 rounded-lg bg-dark-card hover:bg-white/5 ring-1 ring-dark-border hover:ring-vibrant/40 px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition-all active:scale-95"
              >
                <Github className="size-3.5" />
                <span>Sign in with GitHub</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
