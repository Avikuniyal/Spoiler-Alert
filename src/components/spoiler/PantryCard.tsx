'use client';

import { PantryItem, getUrgency, CATEGORY_ICONS } from '@/types/pantry';
import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface PantryCardProps {
  item: PantryItem;
  onUsed: (id: string) => void;
  onWasted: (id: string) => void;
  style?: React.CSSProperties;
}

export default function PantryCard({ item, onUsed, onWasted, style }: PantryCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [exitAction, setExitAction] = useState<'used' | 'wasted' | null>(null);
  const urgency = getUrgency(item.expiry_date);
  const icon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || '🥡';

  const borderAccent =
    urgency.level === 'expired' ? 'border-l-red-900'
    : urgency.level === 'red'     ? 'border-l-red-500'
    : urgency.level === 'amber'   ? 'border-l-amber-500'
    :                               'border-l-[#0D9488]';

  const badgeBg =
    urgency.level === 'expired' ? 'bg-red-950/40 text-red-300/60 border-red-900/40'
    : urgency.level === 'red'     ? 'bg-red-500/15 text-red-400 border-red-500/40'
    : urgency.level === 'amber'   ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
    :                               'bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/40';

  const dotColor =
    urgency.level === 'expired' ? 'bg-red-800'
    : urgency.level === 'red'     ? 'bg-red-400'
    : urgency.level === 'amber'   ? 'bg-amber-400'
    :                               'bg-[#0D9488]';

  const handleAction = (action: 'used' | 'wasted') => {
    setExitAction(action);
    setIsExiting(true);
    setTimeout(() => {
      if (action === 'used') onUsed(item.id);
      else onWasted(item.id);
    }, 200);
  };

  return (
    <div
      style={style}
      className={`relative bg-[#111111] border border-white/[0.08] border-l-2 ${borderAccent} rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-4 flex flex-col gap-3 transition-all duration-200 hover:border-white/[0.15] group ${
        isExiting ? 'card-exit' : 'card-enter'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-playfair text-white font-semibold text-base leading-tight">{item.name}</h3>
            <span className="font-crimson text-xs text-white/50">{item.category}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-crimson ${badgeBg}`}>
          {urgency.level !== 'green' && (
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0 ${urgency.level !== 'expired' ? 'pulse-dot' : ''}`} />
          )}
          {urgency.label}
        </div>
      </div>

      {item.purchase_date && (
        <div className="text-xs font-crimson text-white/40">
          Purchased: {new Date(item.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => handleAction('used')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[7px] border border-[#0D9488]/40 text-[#0D9488] text-sm font-crimson hover:bg-[#0D9488]/15 transition-all duration-200 hover:scale-[1.02]"
        >
          <Check size={13} />
          Used
        </button>
        <button
          onClick={() => handleAction('wasted')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[7px] border border-white/10 text-white/40 text-sm font-crimson hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 hover:scale-[1.02]"
        >
          <X size={13} />
          Wasted
        </button>
      </div>
    </div>
  );
}
