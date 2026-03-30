'use client';

import Link from 'next/link';
import { LayoutDashboard, ShoppingBasket, ChefHat, TrendingUp, Settings, LogOut, Leaf } from 'lucide-react';

type NavTab = 'dashboard' | 'pantry' | 'recipes' | 'savings';

interface SpoilerSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userEmail?: string;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'pantry', label: 'Pantry', icon: <ShoppingBasket size={18} /> },
  { id: 'recipes', label: 'Recipes', icon: <ChefHat size={18} /> },
  { id: 'savings', label: 'Savings', icon: <TrendingUp size={18} /> },
];

export default function SpoilerSidebar({ activeTab, onTabChange, userEmail }: SpoilerSidebarProps) {
  return (
    <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col bg-[#050505] border-r border-white/[0.06] min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#0D9488] rounded-[7px] flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <span className="font-playfair text-white font-bold text-base leading-none block">Spoiler</span>
            <span className="font-playfair text-[#0D9488] font-bold text-base leading-none block">Alert</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-crimson text-base transition-all duration-200 w-full text-left ${
                isActive
                  ? 'bg-[#0D9488]/15 text-[#0D9488]'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
              }`}
            >
              <span className={isActive ? 'text-[#0D9488]' : 'text-white/40'}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-[#0D9488]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-[#0D9488] font-playfair font-bold">
              {userEmail?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="font-crimson text-xs text-white/40 truncate">{userEmail}</span>
        </div>
        <a
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-[10px] font-crimson text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 w-full"
        >
          <Settings size={15} />
          Settings
        </a>
      </div>
    </aside>
  );
}

// Mobile bottom nav
export function SpoilerBottomNav({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (tab: NavTab) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505] border-t border-white/[0.06] flex">
      {NAV_ITEMS.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
              isActive ? 'text-[#0D9488]' : 'text-white/40'
            }`}
          >
            {item.icon}
            <span className="font-crimson text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
