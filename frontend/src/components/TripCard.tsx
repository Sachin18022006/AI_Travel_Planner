import Link from 'next/link';
import { Trip } from '@/types';

const TIER_ACCENT: Record<Trip['budgetTier'], string> = {
  Low: 'bg-teal-400',
  Medium: 'bg-gold-500',
  High: 'bg-stamp-500'
};

export default function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/dashboard/trip/${trip._id}`}
      className="card-lift block overflow-hidden rounded-xl border border-ink-700 bg-ink-800/50"
    >
      <span className={`block h-1.5 w-full ${TIER_ACCENT[trip.budgetTier]}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-lg text-paper-50">{trip.destination}</p>
            <p className="mt-1 text-xs text-paper-200/50">
              {trip.durationDays} days · {trip.budgetTier} budget
            </p>
          </div>
          <span className="stamp rounded-full border border-gold-500/40 px-2 py-1 text-[10px] uppercase text-gold-400">
            {trip.status}
          </span>
        </div>
        <div className="ticket-perforation my-4" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-paper-200/60">Est. budget</span>
          <span className="font-display text-gold-400">${trip.estimatedBudget?.total ?? 0}</span>
        </div>
      </div>
    </Link>
  );
}
