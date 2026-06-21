'use client';

import { PackingItem } from '@/types';

interface Props {
  packingList: PackingItem[];
  onToggle: (itemId: string) => void;
}

const CATEGORY_ORDER: PackingItem['category'][] = ['Documents', 'Clothing', 'Gear', 'Other'];

export default function PackingList({ packingList, onToggle }: Props) {
  if (!packingList || packingList.length === 0) {
    return <p className="text-sm text-paper-200/50">No packing list generated for this trip yet.</p>;
  }

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((category) => {
        const items = packingList.filter((p) => p.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <p className="stamp mb-2 text-xs uppercase text-paper-200/50">{category}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <button
                  key={item._id}
                  onClick={() => item._id && onToggle(item._id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    item.isPacked
                      ? 'border-teal-500/40 bg-teal-500/10'
                      : 'border-ink-700 bg-ink-900/40 hover:border-ink-500'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      item.isPacked ? 'border-teal-400 bg-teal-400' : 'border-ink-500'
                    }`}
                  >
                    {item.isPacked && <span className="text-[10px] leading-none text-ink-950">✓</span>}
                  </span>
                  <span className={`text-sm ${item.isPacked ? 'text-paper-200/40 line-through' : 'text-paper-100'}`}>
                    {item.item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
