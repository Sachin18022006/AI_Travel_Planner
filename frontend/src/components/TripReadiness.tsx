'use client';

import { Trip } from '@/types';

interface Props {
  trip: Trip;
}


function computeReadiness(trip: Trip) {
  const packingTotal = trip.packingList.length;
  const packingDone = trip.packingList.filter((p) => p.isPacked).length;
  const packingScore = packingTotal > 0 ? packingDone / packingTotal : 0;

  const daysTotal = trip.itinerary.length;
  const daysFleshedOut = trip.itinerary.filter((d) => d.activities.length >= 2).length;
  const itineraryScore = daysTotal > 0 ? daysFleshedOut / daysTotal : 0;

  const score = Math.round((packingScore * 0.6 + itineraryScore * 0.4) * 100);

  let message = 'Just getting started';
  if (score >= 90) message = 'Ready to fly!';
  else if (score >= 70) message = 'Almost there';
  else if (score >= 40) message = 'Making progress';

  return { score, packingDone, packingTotal, daysFleshedOut, daysTotal, message };
}

export default function TripReadiness({ trip }: Props) {
  const { score, packingDone, packingTotal, daysFleshedOut, daysTotal, message } = computeReadiness(trip);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/50 p-6">
      <h2 className="font-display text-lg text-paper-50">Trip readiness</h2>
      <div className="ticket-perforation my-4" />

      <div className="flex items-center gap-5">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="#27466A" strokeWidth="8" />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="#D4A24C"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-xl text-paper-50">{score}%</span>
          </div>
        </div>

        <div>
          <p className="stamp text-sm text-gold-400">{message}</p>
          <p className="mt-1 text-xs text-paper-200/60">
            {packingDone}/{packingTotal} packed · {daysFleshedOut}/{daysTotal} days planned
          </p>
        </div>
      </div>
    </div>
  );
}