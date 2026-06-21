'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col px-6 pt-20">
        <h1 className="font-display text-3xl text-paper-50">Welcome back</h1>
        <p className="mt-2 text-sm text-paper-200/60">Log in to view and edit your saved trips.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-paper-100 outline-none focus:border-gold-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-paper-100 outline-none focus:border-gold-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-stamp-500/40 bg-stamp-500/10 px-3 py-2 text-sm text-stamp-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold-500 px-4 py-2.5 font-medium text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-paper-200/60">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-gold-400 hover:underline">
            Create one
          </Link>
        </p>
      </main>
    </div>
  );
}
