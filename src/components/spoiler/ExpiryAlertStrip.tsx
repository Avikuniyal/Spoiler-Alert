'use client';

import { PantryItem, getUrgency } from '@/types/pantry';

interface ExpiryAlertStripProps {
  items: PantryItem[]; // pre-filtered: only items expiring within the alert window
}

export default function ExpiryAlertStrip({ items }: ExpiryAlertStripProps) {
  if (items.length === 0) return null;

  const hasExpired = items.some(i => getUrgency(i.expiry_date).level === 'expired');

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-crimson text-amber-400 uppercase tracking-widest">
          {hasExpired ? '🚨 Expired & Expiring Soon' : '⚠ Expiring Soon'}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {items.map(item => {
          const urgency = getUrgency(item.expiry_date);

          const borderColor =
            urgency.level === 'expired' ? 'border-red-900/50'
            : urgency.level === 'red'     ? 'border-red-500/60'
            :                               'border-amber-500/60';

          const bgColor =
            urgency.level === 'expired' ? 'bg-red-950/40'
            : urgency.level === 'red'     ? 'bg-red-500/10'
            :                               'bg-amber-500/10';

          const dotColor =
            urgency.level === 'expired' ? 'bg-red-800'
            : urgency.level === 'red'     ? 'bg-red-400'
            :                               'bg-amber-400';

          const labelColor =
            urgency.level === 'expired' ? 'text-red-300/60'
            : urgency.level === 'red'     ? 'text-red-400'
            :                               'text-amber-400';

          return (
            <div
              key={item.id}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderColor} ${bgColor} transition-all duration-200`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${urgency.level !== 'expired' ? 'pulse-dot' : ''}`} />
              <span className={`font-crimson text-sm whitespace-nowrap ${urgency.level === 'expired' ? 'text-white/50 line-through' : 'text-white'}`}>
                {item.name}
              </span>
              <span className={`font-crimson text-xs ${labelColor} whitespace-nowrap`}>
                {urgency.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
