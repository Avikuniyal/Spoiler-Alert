'use client';

import { useState, useCallback } from 'react';
import { PantryItem, FoodCategory, getUrgency } from '@/types/pantry';
import { getMatchingRecipes } from '@/lib/recipes';
import SpoilerSidebar, { SpoilerBottomNav } from '@/components/spoiler/SpoilerSidebar';
import SpoilerScoreBar from '@/components/spoiler/SpoilerScoreBar';
import ExpiryAlertStrip from '@/components/spoiler/ExpiryAlertStrip';
import PantryGrid from '@/components/spoiler/PantryGrid';
import RecipeSuggestionsPanel from '@/components/spoiler/RecipeSuggestionsPanel';
import SavingsWidget from '@/components/spoiler/SavingsWidget';
import AddItemModal from '@/components/spoiler/AddItemModal';
import { addPantryItem, markItemUsed, markItemWasted } from '@/app/pantry-actions';
import { toast } from 'sonner';

type NavTab = 'dashboard' | 'pantry' | 'recipes' | 'savings';

interface SpoilerDashboardProps {
  initialItems: PantryItem[];
  userId: string;
  userEmail: string;
  savings: {
    totalSaved: number;
    monthSaved: number;
    totalUsed: number;
    totalWasted: number;
    sparklineData: { day: number; value: number }[];
  };
}

export default function SpoilerDashboard({
  initialItems,
  userId,
  userEmail,
  savings: initialSavings,
}: SpoilerDashboardProps) {
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [savings, setSavings] = useState(initialSavings);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const expiringItems = items.filter(item => getUrgency(item.expiry_date).level !== 'green');
  const expiringNames = expiringItems.map(item => item.name);
  const recipes = getMatchingRecipes(expiringNames, 3);

  const handleAddItem = useCallback(async (data: {
    name: string;
    category: FoodCategory;
    purchaseDate?: string;
    expiryDate: string;
  }) => {
    const newItem = await addPantryItem({ userId, ...data });
    setItems(prev => [newItem as PantryItem, ...prev]);
    toast.success(`${data.name} added to pantry! 🌿`, {
      style: { background: '#111', border: '1px solid rgba(13,148,136,0.4)', color: '#fff' }
    });
  }, [userId]);

  const handleUsed = useCallback(async (id: string) => {
    setExitingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      try {
        const item = items.find(i => i.id === id);
        await markItemUsed(id, userId);
        setItems(prev => prev.filter(i => i.id !== id));
        setSavings(prev => ({
          ...prev,
          totalSaved: prev.totalSaved + (item?.estimated_cost || 0),
          monthSaved: prev.monthSaved + (item?.estimated_cost || 0),
          totalUsed: prev.totalUsed + 1,
        }));
        toast.success(`Great job! ${item?.name} marked as used 🎉`, {
          style: { background: '#111', border: '1px solid rgba(13,148,136,0.4)', color: '#fff' }
        });
      } catch (err) {
        console.error(err);
        setItems(prev => prev);
      } finally {
        setExitingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      }
    }, 200);
  }, [items, userId]);

  const handleWasted = useCallback(async (id: string) => {
    setExitingIds(prev => new Set(prev).add(id));
    setTimeout(async () => {
      try {
        const item = items.find(i => i.id === id);
        await markItemWasted(id, userId);
        setItems(prev => prev.filter(i => i.id !== id));
        setSavings(prev => ({
          ...prev,
          totalWasted: prev.totalWasted + 1,
        }));
        toast.error(`${item?.name} logged as wasted`, {
          style: { background: '#111', border: '1px solid rgba(239,68,68,0.4)', color: '#fff' }
        });
      } catch (err) {
        console.error(err);
      } finally {
        setExitingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      }
    }, 200);
  }, [items, userId]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6">
            {/* Hero Score */}
            <SpoilerScoreBar
              totalItems={items.length}
              expiringCount={expiringItems.length}
              monthSaved={savings.monthSaved}
              totalSaved={savings.totalSaved}
            />

            {/* Expiry Alert Strip */}
            {expiringItems.length > 0 && <ExpiryAlertStrip items={expiringItems} />}

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
              {/* Left: Pantry + Recipes */}
              <div className="flex flex-col gap-6">
                <PantryGrid
                  items={items}
                  onUsed={handleUsed}
                  onWasted={handleWasted}
                  onAddItem={() => setShowAddModal(true)}
                />
                {expiringItems.length > 0 && (
                  <RecipeSuggestionsPanel recipes={recipes} expiringItems={expiringNames} />
                )}
              </div>

              {/* Right rail: Savings widget */}
              <div className="flex flex-col gap-4">
                <SavingsWidget
                  totalSaved={savings.totalSaved}
                  monthSaved={savings.monthSaved}
                  totalUsed={savings.totalUsed}
                  totalWasted={savings.totalWasted}
                  sparklineData={savings.sparklineData}
                />
                {/* Quick tips */}
                <div className="bg-[#111111] border border-white/[0.08] rounded-[10px] p-4">
                  <h4 className="font-playfair text-sm font-semibold text-white mb-3">💡 Tips</h4>
                  <ul className="flex flex-col gap-2">
                    {[
                      'Store herbs in water like flowers to extend freshness',
                      'Keep bananas separate — ethylene gas ripens nearby produce',
                      'Freeze bread before it goes stale',
                    ].map((tip, i) => (
                      <li key={i} className="font-crimson text-sm text-white/50 flex gap-2">
                        <span className="text-[#0D9488] flex-shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pantry':
        return (
          <div className="flex flex-col gap-6">
            {expiringItems.length > 0 && <ExpiryAlertStrip items={expiringItems} />}
            <PantryGrid
              items={items}
              onUsed={handleUsed}
              onWasted={handleWasted}
              onAddItem={() => setShowAddModal(true)}
            />
          </div>
        );

      case 'recipes':
        return (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-white mb-1">Recipe Ideas</h1>
              <p className="font-crimson text-white/50">
                {expiringItems.length > 0
                  ? `Based on your ${expiringItems.length} expiring item${expiringItems.length !== 1 ? 's' : ''}`
                  : 'Add items to your pantry to get personalized recipe suggestions'}
              </p>
            </div>
            {expiringItems.length > 0 ? (
              <RecipeSuggestionsPanel recipes={getMatchingRecipes(expiringNames, 6)} expiringItems={expiringNames} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[#111111] border border-white/[0.08] border-dashed rounded-[10px]">
                <span className="text-5xl">🍳</span>
                <div className="text-center">
                  <p className="font-playfair text-white/60 text-xl">No expiring items</p>
                  <p className="font-crimson text-white/30 text-base mt-1">Track items in your pantry to discover recipes</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'savings':
        return (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-white mb-1">Savings Tracker</h1>
              <p className="font-crimson text-white/50">Track your food waste savings over time</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Saved', value: `$${savings.totalSaved.toFixed(2)}`, color: 'text-[#0D9488]', icon: '💰' },
                { label: 'This Month', value: `$${savings.monthSaved.toFixed(2)}`, color: 'text-[#0D9488]', icon: '📅' },
                { label: 'Items Used', value: String(savings.totalUsed), color: 'text-white', icon: '✅' },
                { label: 'Items Wasted', value: String(savings.totalWasted), color: 'text-red-400', icon: '🗑️' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#111111] border border-white/[0.08] rounded-[10px] p-5">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="font-crimson text-sm text-white/40">{stat.label}</p>
                  <p className={`font-playfair text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <SavingsWidget
              totalSaved={savings.totalSaved}
              monthSaved={savings.monthSaved}
              totalUsed={savings.totalUsed}
              totalWasted={savings.totalWasted}
              sparklineData={savings.sparklineData}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <SpoilerSidebar activeTab={activeTab} onTabChange={setActiveTab} userEmail={userEmail} />

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-6">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
          {renderContent()}
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <SpoilerBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddItem}
        />
      )}
    </div>
  );
}
