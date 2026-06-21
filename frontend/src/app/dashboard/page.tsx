'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TripCard from '@/components/TripCard';
import FlightPath from '@/components/FlightPath';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { Trip } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<Trip[]>('/api/trips')
      .then(setTrips)
      .catch(() => setError('Could not load your trips. Please refresh.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="px-6 pt-20 text-paper-200/50">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-paper-50">Your trips</h1>
            <p className="mt-1 text-sm text-paper-200/60">Signed in as {user.email}</p>
          </div>
          <Link
            href="/dashboard/new-trip"
            className="rounded-full bg-gold-500 px-5 py-2.5 font-medium text-ink-950 hover:bg-gold-400 transition-colors"
          >
            + New Trip
          </Link>
        </div>

        {error && <p className="mt-8 text-stamp-500">{error}</p>}

        {loading ? (
          <p className="mt-8 text-paper-200/50">Loading your trips…</p>
        ) : trips.length === 0 ? (
          <div className="relative mt-12 overflow-hidden rounded-2xl border border-dashed border-ink-600 p-12 text-center">
            <div className="glow-gold left-1/3 top-0 h-48 w-48" />
            <FlightPath className="relative z-10 mx-auto h-20 w-full max-w-xs opacity-70" />
            <p className="relative z-10 mt-4 font-display text-xl text-paper-100">No trips yet</p>
            <p className="relative z-10 mt-2 text-sm text-paper-200/60">
              Create your first AI-generated itinerary to see it here.
            </p>
            <Link
              href="/dashboard/new-trip"
              className="relative z-10 mt-6 inline-block rounded-full bg-gold-500 px-5 py-2.5 font-medium text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-gold-400"
            >
              Plan a trip
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <div key={trip._id} className="fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
