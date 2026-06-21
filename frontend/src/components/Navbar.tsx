'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-paper-100">
            Voyager
          </span>
          <span className="stamp rounded border border-gold-500/40 px-1.5 py-0.5 text-[10px] uppercase text-gold-400">
            AI
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-paper-200/80 hover:text-gold-400 transition-colors">
                Dashboard
              </Link>
              <Link
                href="/dashboard/new-trip"
                className="rounded-full bg-gold-500 px-4 py-1.5 font-medium text-ink-950 hover:bg-gold-400 transition-colors"
              >
                + New Trip
              </Link>
              <span className="hidden sm:inline text-paper-200/50">{user.name}</span>
              <button
                onClick={logout}
                className="text-stamp-500 hover:text-stamp-600 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper-200/80 hover:text-gold-400 transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gold-500 px-4 py-1.5 font-medium text-ink-950 hover:bg-gold-400 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
