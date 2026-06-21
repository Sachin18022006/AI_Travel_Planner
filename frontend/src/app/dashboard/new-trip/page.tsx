'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/utils/api';
import { Trip } from '@/types';

const INTEREST_OPTIONS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'Nightlife', 'Relaxation', 'History'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function NewTripPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [budgetTier, setBudgetTier] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [interests, setInterests] = useState<string[]>([]);
  const [travelMonth, setTravelMonth] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!destination.trim()) {
      setError('Please enter a destination.');
      return;
    }

    setSubmitting(true);
    try {
      const trip = await api.post<Trip>('/api/trips', {
        destination: destination.trim(),
        durationDays,
        budgetTier,
        interests,
        travelMonth
      });
      router.push(`/dashboard/trip/${trip._id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'The AI agent could not generate your itinerary. Please try again.'
      );
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 pt-12 pb-24">
        <h1 className="font-display text-3xl text-paper-50">Plan a new trip</h1>
        <p className="mt-1 text-sm text-paper-200/60">
          Tell the AI agent the basics — it will draft a full itinerary, budget, hotel options,
          and a weather-aware packing list.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="destination" className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
              Destination
            </label>
            <input
              id="destination"
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan"
              className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-paper-100 outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
                Number of days
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                max={30}
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-paper-100 outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label htmlFor="month" className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
                Travel month (optional)
              </label>
              <select
                id="month"
                value={travelMonth}
                onChange={(e) => setTravelMonth(e.target.value)}
                className="w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-paper-100 outline-none focus:border-gold-500"
              >
                <option value="">Not sure yet</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">Budget type</span>
            <div className="grid grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBudgetTier(tier)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    budgetTier === tier
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-ink-600 text-paper-200/70 hover:border-ink-500'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">Interests</span>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    interests.includes(interest)
                      ? 'border-teal-400 bg-teal-500/10 text-teal-400'
                      : 'border-ink-600 text-paper-200/70 hover:border-ink-500'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-stamp-500/40 bg-stamp-500/10 px-3 py-2 text-sm text-stamp-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gold-500 px-4 py-3 font-medium text-ink-950 transition-colors hover:bg-gold-400 disabled:opacity-60"
          >
            {submitting ? 'Generating your itinerary…' : 'Generate itinerary'}
          </button>
          {submitting && (
            <p className="text-center text-xs text-paper-200/50">
              The AI agent is drafting your trip — this usually takes a few seconds.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
