'use client';

import { Package, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SpoilerScoreBarProps {
  totalItems: number;
  expiringCount: number;
  monthSaved: number;
  totalSaved: number;
}

export default function SpoilerScoreBar({ totalItems, expiringCount, monthSaved, totalSaved }: SpoilerScoreBarProps) {
  const score = totalItems === 0 ? 100 : Math.max(0, Math.round(100 - (expiringCount / Math.max(totalItems, 1)) * 50));

  const scoreColor = score >= 80 ? 'text-[#0D9488]' : score >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="w-full bg-[#111111] border border-white/[0.08] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Spoiler Score */}
        <div className="flex items-center gap-4 md:pr-6 md:border-r md:border-white/[0.06]">
          <div>
            <p className="font-crimson text-sm text-white/50 uppercase tracking-widest">Spoiler Score</p>
            <div className="flex items-baseline gap-1">
              <span className={`font-playfair text-6xl font-bold ${scoreColor}`}>{score}</span>
              <span className="font-playfair text-2xl text-white/40">/100</span>
            </div>
            <p className="font-crimson text-sm text-white/50">
              {score >= 80 ? '🌿 Excellent! Keep it up' : score >= 50 ? '⚠️ Some items need attention' : '🚨 Act fast to avoid waste'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-1 flex-wrap gap-4 md:gap-0 md:justify-around">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/[0.05] rounded-[10px]">
              <Package size={18} className="text-white/60" />
            </div>
            <div>
              <p className="font-playfair text-2xl font-bold text-white">{totalItems}</p>
              <p className="font-crimson text-xs text-white/40">Items Tracked</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-[10px] ${expiringCount > 0 ? 'bg-amber-500/10' : 'bg-white/[0.05]'}`}>
              <AlertTriangle size={18} className={expiringCount > 0 ? 'text-amber-400' : 'text-white/60'} />
            </div>
            <div>
              <p className={`font-playfair text-2xl font-bold ${expiringCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {expiringCount}
              </p>
              <p className="font-crimson text-xs text-white/40">Expiring Soon</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0D9488]/10 rounded-[10px]">
              <TrendingDown size={18} className="text-[#0D9488]" />
            </div>
            <div>
              <p className="font-playfair text-2xl font-bold text-[#0D9488]">${monthSaved.toFixed(0)}</p>
              <p className="font-crimson text-xs text-white/40">Saved This Month</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0D9488]/10 rounded-[10px]">
              <CheckCircle2 size={18} className="text-[#0D9488]" />
            </div>
            <div>
              <p className="font-playfair text-2xl font-bold text-[#0D9488]">${totalSaved.toFixed(0)}</p>
              <p className="font-crimson text-xs text-white/40">Total Saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
