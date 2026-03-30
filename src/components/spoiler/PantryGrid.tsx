'use client';

import { PantryItem, FoodCategory, getUrgency } from '@/types/pantry';
import { useState } from 'react';
import PantryCard from './PantryCard';
import { Plus } from 'lucide-react';

const CATEGORIES: FoodCategory[] = [
  'Produce', 'Dairy', 'Meat', 'Pantry Staples', 'Bakery', 'Frozen', 'Beverages', 'Other'
];

type SortOption = 'expiry' | 'name' | 'category';

interface PantryGridProps {
  items: PantryItem[];
  onUsed: (id: string) => void;
  onWasted: (id: string) => void;
  onAddItem: () => void;
}

export default function PantryGrid({ items, onUsed, onWasted, onAddItem }: PantryGridProps) {
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('expiry');

  const filtered = items.filter(item =>
    activeCategory === 'All' || item.category === activeCategory
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'expiry') {
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return a.category.localeCompare(b.category);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-playfair text-xl font-bold text-white">Pantry Inventory</h2>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="bg-[#111111] border border-white/10 rounded-[7px] px-3 py-1.5 text-sm font-crimson text-white/70 outline-none focus:border-[#0D9488]/60 transition-all duration-200 [color-scheme:dark]"
          >
            <option value="expiry">Sort: Expiry</option>
            <option value="name">Sort: Name</option>
            <option value="category">Sort: Category</option>
          </select>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D9488] text-white rounded-[10px] font-crimson text-sm font-medium hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] transition-all duration-200"
          >
            <Plus size={15} />
            Add Item
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3 py-1.5 rounded-full text-sm font-crimson border transition-all duration-200 ${
            activeCategory === 'All'
              ? 'bg-[#0D9488]/20 border-[#0D9488]/60 text-[#0D9488]'
              : 'bg-transparent border-white/10 text-white/50 hover:border-white/20'
          }`}
        >
          All ({items.length})
        </button>
        {CATEGORIES.filter(cat => items.some(i => i.category === cat)).map(cat => {
          const count = items.filter(i => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-crimson border transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[#0D9488]/20 border-[#0D9488]/60 text-[#0D9488]'
                  : 'bg-transparent border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 bg-[#111111] border border-white/[0.08] border-dashed rounded-[10px]">
          <span className="text-4xl">🥦</span>
          <div className="text-center">
            <p className="font-playfair text-white/60 text-lg">Your pantry is empty</p>
            <p className="font-crimson text-white/30 text-sm mt-1">Add food items to start tracking expiry dates</p>
          </div>
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D9488] text-white rounded-[10px] font-crimson font-medium hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] transition-all duration-200"
          >
            <Plus size={15} />
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sorted.map((item, i) => (
            <PantryCard
              key={item.id}
              item={item}
              onUsed={onUsed}
              onWasted={onWasted}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
