'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ItineraryDay from '@/components/ItineraryDay';
import PackingList from '@/components/PackingList';
import TripReadiness from '@/components/TripReadiness';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/utils/api';
import { Trip } from '@/types';

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await api.get<Trip>(`/api/trips/${id}`);
      setTrip(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this trip.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchTrip();
  }, [authLoading, user, router, fetchTrip]);

  async function handleAddActivity(
    dayNumber: number,
    title: string,
    timeOfDay: 'Morning' | 'Afternoon' | 'Evening'
  ) {
    if (!trip) return;
    const updatedItinerary = trip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? {
            ...day,
            activities: [
              ...day.activities,
              { title, description: 'Added by traveler', estimatedCostUSD: 0, timeOfDay }
            ]
          }
        : day
    );
    const updated = await api.put<Trip>(`/api/trips/${trip._id}`, { itinerary: updatedItinerary });
    setTrip(updated);
  }

  async function handleRemoveActivity(dayNumber: number, activityIndex: number) {
    if (!trip) return;
    const updatedItinerary = trip.itinerary.map((day) =>
      day.dayNumber === dayNumber
        ? { ...day, activities: day.activities.filter((_, i) => i !== activityIndex) }
        : day
    );
    const updated = await api.put<Trip>(`/api/trips/${trip._id}`, { itinerary: updatedItinerary });
    setTrip(updated);
  }

  async function handleRegenerateDay(dayNumber: number, instruction: string) {
    if (!trip) return;
    const updated = await api.post<Trip>(`/api/trips/${trip._id}/days/${dayNumber}/regenerate`, {
      instruction
    });
    setTrip(updated);
  }

  async function handleTogglePacking(itemId: string) {
    if (!trip) return;
    const updatedPacking = trip.packingList.map((item) =>
      item._id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    setTrip({ ...trip, packingList: updatedPacking });
    try {
      await api.put<Trip>(`/api/trips/${trip._id}`, { packingList: updatedPacking });
    } catch {
      fetchTrip();
    }
  }

  async function handleDelete() {
    if (!trip) return;
    if (!confirm(`Delete the trip to ${trip.destination}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.del(`/api/trips/${trip._id}`);
      router.push('/dashboard');
    } catch {
      setDeleting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="px-6 pt-20 text-paper-200/50">Loading your itinerary…</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="px-6 pt-20 text-stamp-500">{error || 'Trip not found.'}</p>
      </div>
    );
  }

  const b = trip.estimatedBudget;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="stamp text-xs text-paper-200/50">DESTINATION</p>
            <h1 className="font-display text-4xl text-paper-50">{trip.destination}</h1>
            <p className="mt-2 text-sm text-paper-200/60">
              {trip.durationDays} days · {trip.budgetTier} budget
              {trip.travelMonth && ` · ${trip.travelMonth}`}
              {trip.interests.length > 0 && ` · ${trip.interests.join(', ')}`}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-stamp-500/40 px-4 py-2 text-sm text-stamp-500 hover:bg-stamp-500/10 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete trip'}
          </button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {}
          <div className="space-y-6 lg:col-span-1">
            <TripReadiness trip={trip} />

            <div className="rounded-2xl border border-ink-700 bg-ink-800/50 p-6">
              <h2 className="font-display text-lg text-paper-50">Estimated budget</h2>
              <div className="ticket-perforation my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-paper-200/60">Transport</span><span>${b.transport}</span></div>
                <div className="flex justify-between"><span className="text-paper-200/60">Accommodation</span><span>${b.accommodation}</span></div>
                <div className="flex justify-between"><span className="text-paper-200/60">Food</span><span>${b.food}</span></div>
                <div className="flex justify-between"><span className="text-paper-200/60">Activities</span><span>${b.activities}</span></div>
                <div className="mt-2 flex justify-between border-t border-ink-700 pt-2 font-display text-base text-gold-400">
                  <span>Total</span><span>${b.total}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-700 bg-ink-800/50 p-6">
              <h2 className="font-display text-lg text-paper-50">Recommended hotels</h2>
              <div className="ticket-perforation my-4" />
              <div className="space-y-3">
                {trip.hotels.map((hotel, idx) => (
                  <div key={idx} className="card-lift rounded-lg border border-ink-700 bg-ink-900/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-paper-100">{hotel.name}</span>
                      <span className="stamp text-[10px] uppercase text-gold-400">{hotel.tier}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-paper-200/50">
                      <span>{hotel.rating}</span>
                      <span>${hotel.estimatedCostNightUSD}/night</span>
                    </div>
                    {hotel.description && <p className="mt-1 text-xs text-paper-200/50">{hotel.description}</p>}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${trip.destination}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      View on map
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-ink-700 bg-ink-800/50 p-6">
              <h2 className="font-display text-lg text-paper-50">⛈️ Weather-aware packing</h2>
              <p className="mt-1 text-xs text-paper-200/50">
                Generated from your destination&apos;s climate and planned activities.
              </p>
              <div className="ticket-perforation my-4" />
              <PackingList packingList={trip.packingList} onToggle={handleTogglePacking} />
            </div>
          </div>

          {}
          <div className="space-y-6 lg:col-span-2">
            {trip.itinerary
              .slice()
              .sort((a, b2) => a.dayNumber - b2.dayNumber)
              .map((day) => (
                <ItineraryDay
                  key={day.dayNumber}
                  day={day}
                  destination={trip.destination}
                  onAddActivity={handleAddActivity}
                  onRemoveActivity={handleRemoveActivity}
                  onRegenerateDay={handleRegenerateDay}
                />
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
