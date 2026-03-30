'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface SavingsWidgetProps {
  totalSaved: number;
  monthSaved: number;
  totalUsed: number;
  totalWasted: number;
  sparklineData: { day: number; value: number }[];
}

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
      else prevValue.current = end;
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className="stat-animate inline-block">
      {prefix}{displayValue.toFixed(2)}
    </span>
  );
}

export default function SavingsWidget({
  totalSaved,
  monthSaved,
  totalUsed,
  totalWasted,
  sparklineData,
}: SavingsWidgetProps) {
  const wasteRate = totalUsed + totalWasted > 0
    ? Math.round((totalUsed / (totalUsed + totalWasted)) * 100)
    : 0;

  return (
    <div className="bg-[#111111] border border-white/[0.08] rounded-[10px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-playfair text-base font-semibold text-white">Savings Tracker</h3>
        <div className="p-2 bg-[#0D9488]/15 rounded-[7px]">
          <DollarSign size={16} className="text-[#0D9488]" />
        </div>
      </div>

      <div>
        <p className="font-crimson text-xs text-white/40 uppercase tracking-wider mb-1">Total Saved</p>
        <p className="font-playfair text-4xl font-bold text-white">
          $<AnimatedNumber value={totalSaved} />
        </p>
        {monthSaved > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={12} className="text-[#0D9488]" />
            <span className="font-crimson text-sm text-[#0D9488]">
              +${monthSaved.toFixed(2)} this month
            </span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px' }}
              labelStyle={{ display: 'none' }}
              formatter={(val: number) => [`$${val.toFixed(2)}`, 'Saved']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0D9488"
              strokeWidth={2}
              fill="url(#savingsGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-white/[0.06]">
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-playfair text-xl font-bold text-white">{totalUsed}</span>
          <span className="font-crimson text-xs text-white/40">Used</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-playfair text-xl font-bold text-white">{totalWasted}</span>
          <span className="font-crimson text-xs text-white/40">Wasted</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className={`font-playfair text-xl font-bold ${wasteRate >= 70 ? 'text-[#0D9488]' : wasteRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {wasteRate}%
          </span>
          <span className="font-crimson text-xs text-white/40">Used Rate</span>
        </div>
      </div>
    </div>
  );
}
