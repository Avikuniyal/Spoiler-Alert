'use client';

import { PantryItem, getUrgency } from '@/types/pantry';
import { useEffect, useRef } from 'react';

interface ExpiryAlertStripProps {
  items: PantryItem[];
}

export default function ExpiryAlertStrip({ items }: ExpiryAlertStripProps) {
  const urgentItems = items.filter(item => {
    const urgency = getUrgency(item.expiry_date);
    return urgency.level !== 'green';
  });

  if (urgentItems.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-crimson text-amber-400 uppercase tracking-widest">⚠ Expiring Soon</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {urgentItems.map(item => {
          const urgency = getUrgency(item.expiry_date);
          const isRed = urgency.level === 'red';
          const borderColor = isRed ? 'border-red-500/60' : 'border-amber-500/60';
          const textColor = isRed ? 'text-red-400' : 'text-amber-400';
          const bgColor = isRed ? 'bg-red-500/10' : 'bg-amber-500/10';
          const dotColor = isRed ? 'bg-red-400' : 'bg-amber-400';

          return (
            <div
              key={item.id}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border ${borderColor} ${bgColor} transition-all duration-200`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} pulse-dot`} />
              <span className="font-crimson text-sm text-white whitespace-nowrap">{item.name}</span>
              <span className={`font-crimson text-xs ${textColor} whitespace-nowrap`}>{urgency.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
