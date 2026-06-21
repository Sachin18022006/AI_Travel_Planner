'use client';

import { useState } from 'react';
import { ItineraryDay as ItineraryDayType } from '@/types';

interface Props {
  day: ItineraryDayType;
  destination: string;
  onAddActivity: (dayNumber: number, title: string, timeOfDay: 'Morning' | 'Afternoon' | 'Evening') => Promise<void>;
  onRemoveActivity: (dayNumber: number, activityIndex: number) => Promise<void>;
  onRegenerateDay: (dayNumber: number, instruction: string) => Promise<void>;
}

const TIME_ORDER: Record<string, number> = { Morning: 0, Afternoon: 1, Evening: 2 };

function googleMapsUrl(placeName: string, destination: string) {
  const query = encodeURIComponent(`${placeName}, ${destination}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function ItineraryDay({ day, destination, onAddActivity, onRemoveActivity, onRegenerateDay }: Props) {
  const [newActivity, setNewActivity] = useState('');
  const [newTime, setNewTime] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [regenInstruction, setRegenInstruction] = useState('');
  const [showRegen, setShowRegen] = useState(false);
  const [busy, setBusy] = useState(false);

  const sortedActivities = day.activities
    .map((act, originalIndex) => ({ act, originalIndex }))
    .sort((a, b) => (TIME_ORDER[a.act.timeOfDay] ?? 99) - (TIME_ORDER[b.act.timeOfDay] ?? 99));

  async function handleAdd() {
    if (!newActivity.trim()) return;
    setBusy(true);
    try {
      await onAddActivity(day.dayNumber, newActivity.trim(), newTime);
      setNewActivity('');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate() {
    if (!regenInstruction.trim()) return;
    setBusy(true);
    try {
      await onRegenerateDay(day.dayNumber, regenInstruction.trim());
      setRegenInstruction('');
      setShowRegen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/50">
      <div className="flex items-center justify-between bg-ink-700/40 px-6 py-4">
        <div>
          <p className="stamp text-xs text-paper-200/50">DAY {day.dayNumber}</p>
          <p className="font-display text-lg text-paper-50">{day.theme || 'Itinerary'}</p>
        </div>
        <button
          onClick={() => setShowRegen((s) => !s)}
          disabled={busy}
          className="stamp rounded-full border border-teal-400/50 px-3 py-1.5 text-xs uppercase text-teal-400 hover:bg-teal-500/10 transition-colors disabled:opacity-50"
        >
          Regenerate day
        </button>
      </div>

      {showRegen && (
        <div className="border-b border-ink-700 bg-ink-900/40 px-6 py-4">
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-paper-200/50">
            Tell the AI how to change this day
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder="e.g. more outdoor activities, less walking"
              className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-paper-100 outline-none focus:border-gold-500"
            />
            <button
              onClick={handleRegenerate}
              disabled={busy || !regenInstruction.trim()}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Apply'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 px-6 py-5">
        {sortedActivities.map(({ act, originalIndex }) => (
          <div
            key={act._id || originalIndex}
            className="flex items-start justify-between gap-4 rounded-lg border border-ink-700 bg-ink-900/40 p-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="stamp rounded bg-ink-700 px-1.5 py-0.5 text-[10px] uppercase text-paper-200/60">
                  {act.timeOfDay}
                </span>
                <span className="font-medium text-paper-100">{act.title}</span>
                <a
                  href={googleMapsUrl(act.title, destination)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open "${act.title}" in Google Maps`}
                  className="text-teal-400 transition-colors hover:text-teal-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </a>
              </div>
              {act.description && <p className="mt-1 text-xs text-paper-200/50">{act.description}</p>}
              {act.estimatedCostUSD > 0 && (
                <p className="mt-1 text-xs text-gold-400">${act.estimatedCostUSD}</p>
              )}
            </div>
            <button
              onClick={() => onRemoveActivity(day.dayNumber, originalIndex)}
              className="text-xs text-stamp-500 hover:text-stamp-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Add a new activity…"
            className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-gold-500"
          />
          <select
            value={newTime}
            onChange={(e) => setNewTime(e.target.value as 'Morning' | 'Afternoon' | 'Evening')}
            className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-paper-100 outline-none focus:border-gold-500"
          >
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={busy || !newActivity.trim()}
            className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-gold-400 transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
