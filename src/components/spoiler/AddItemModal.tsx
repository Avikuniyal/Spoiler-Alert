'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ScanLine } from 'lucide-react';
import { FoodCategory } from '@/types/pantry';
import { getShelfLife, StorageZone, FOOD_SUGGESTIONS } from '@/lib/shelf-life';

const CATEGORIES: FoodCategory[] = [
  'Produce', 'Dairy', 'Meat', 'Pantry Staples', 'Bakery', 'Frozen', 'Beverages', 'Other'
];

const STORAGE_ZONES: { value: StorageZone; label: string; icon: string }[] = [
  { value: 'fridge',  label: 'Fridge',  icon: '🧊' },
  { value: 'freezer', label: 'Freezer', icon: '❄️' },
  { value: 'pantry',  label: 'Pantry',  icon: '🏠' },
];

interface AddItemModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: FoodCategory;
    purchaseDate?: string;
    expiryDate: string;
    storageZone: StorageZone;
    opened: boolean;
  }) => Promise<void>;
}

// Rank starts-with matches above contains matches, cap at 6.
function getSuggestions(input: string): string[] {
  const q = input.toLowerCase().trim();
  if (!q) return [];
  const startsWith = FOOD_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(q));
  const contains  = FOOD_SUGGESTIONS.filter(s => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
  return [...startsWith, ...contains].slice(0, 6);
}

// Wrap the matched substring in a bold span so it reads as a highlight.
function HighlightedSuggestion({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1 || !query.trim()) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-white font-semibold">{text.slice(idx, idx + query.trim().length)}</span>
      {text.slice(idx + query.trim().length)}
    </span>
  );
}

export default function AddItemModal({ onClose, onSubmit }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [storageZone, setStorageZone] = useState<StorageZone>('fridge');
  const [opened, setOpened] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryAutoFilled, setExpiryAutoFilled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Typeahead state
  const [inputFocused, setInputFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => getSuggestions(name), [name]);
  const showSuggestions = inputFocused && suggestions.length > 0;

  // Reset keyboard cursor when the suggestion list changes.
  useEffect(() => { setActiveSuggestion(-1); }, [suggestions]);

  // Auto-fill expiry date from shelf-life lookup.
  useEffect(() => {
    if (name.trim().length < 3) return;
    const days = getShelfLife(name.trim(), category, storageZone, opened);
    const date = new Date();
    date.setDate(date.getDate() + days);
    setExpiryDate(date.toISOString().split('T')[0]);
    setExpiryAutoFilled(true);
    setErrors(prev => { const next = { ...prev }; delete next.expiryDate; return next; });
  }, [name, category, storageZone, opened]);

  const selectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setInputFocused(false);
    setActiveSuggestion(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setInputFocused(false);
      setActiveSuggestion(-1);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Item name is required';
    if (!expiryDate) newErrors.expiryDate = 'Expiry date is required';
    else if (purchaseDate && new Date(expiryDate) < new Date(purchaseDate)) {
      newErrors.expiryDate = 'Expiry must be after purchase date';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        purchaseDate: purchaseDate || undefined,
        expiryDate,
        storageZone,
        opened,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-[15px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] overflow-hidden card-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="font-playfair text-xl font-bold text-white">Add Food Item</h2>
            <p className="font-crimson text-sm text-white/50 mt-0.5">Track a new item in your pantry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[7px] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          {/* Name + typeahead */}
          <div className="flex flex-col gap-1.5">
            <label className="font-crimson text-sm text-white/70">Food Name</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => {
                  // Delay so onMouseDown on a suggestion fires first.
                  setTimeout(() => setInputFocused(false), 120);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Broccoli, Greek Yogurt..."
                autoComplete="off"
                className={`flex-1 bg-[#0a0a0a] border ${errors.name ? 'border-red-500/60' : 'border-white/10'} rounded-[10px] px-3 py-2.5 text-white font-crimson text-base placeholder-white/30 outline-none focus:border-[#0D9488]/60 focus:ring-1 focus:ring-[#0D9488]/30 transition-all duration-200`}
              />
              <button
                type="button"
                className="p-2.5 bg-[#0a0a0a] border border-white/10 rounded-[10px] text-white/40 hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all duration-200"
                title="Barcode scan (coming soon)"
              >
                <ScanLine size={16} />
              </button>
            </div>

            {/* Suggestion dropdown — inline so it's never clipped by overflow-hidden */}
            {showSuggestions && (
              <ul className="bg-[#0a0a0a] border border-white/10 rounded-[10px] overflow-hidden">
                {suggestions.map((s, i) => (
                  <li key={s}>
                    <button
                      type="button"
                      // onMouseDown fires before onBlur, so e.preventDefault() keeps
                      // focus on the input long enough for the click to register.
                      onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                      className={`w-full text-left px-3 py-2 font-crimson text-sm transition-colors duration-100 flex items-center gap-2 ${
                        i === activeSuggestion
                          ? 'bg-[#0D9488]/20 text-[#0D9488]'
                          : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                      } ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                    >
                      <HighlightedSuggestion text={s} query={name} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {errors.name && <span className="font-crimson text-xs text-red-400">{errors.name}</span>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="font-crimson text-sm text-white/70">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-crimson border transition-all duration-200 ${
                    category === cat
                      ? 'bg-[#0D9488]/20 border-[#0D9488]/60 text-[#0D9488]'
                      : 'bg-[#0a0a0a] border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Zone */}
          <div className="flex flex-col gap-1.5">
            <label className="font-crimson text-sm text-white/70">Storage Location</label>
            <div className="flex gap-2">
              {STORAGE_ZONES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStorageZone(value)}
                  className={`flex-1 py-2 rounded-[10px] text-sm font-crimson border transition-all duration-200 ${
                    storageZone === value
                      ? 'bg-[#0D9488]/20 border-[#0D9488]/60 text-[#0D9488]'
                      : 'bg-[#0a0a0a] border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Opened toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={opened}
              onClick={() => setOpened(o => !o)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                opened ? 'bg-[#0D9488]' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                  opened ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
            <span className="font-crimson text-sm text-white/70">
              Already opened
              <span className="text-white/30 ml-1.5">affects shelf life estimate</span>
            </span>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70">
                Purchase Date <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded-[10px] px-3 py-2.5 text-white font-crimson text-sm outline-none focus:border-[#0D9488]/60 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70 flex items-center gap-1.5">
                Expiry Date <span className="text-red-400/70">*</span>
                {expiryAutoFilled && (
                  <span className="text-[#0D9488]/70 text-xs font-crimson">auto-suggested</span>
                )}
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => {
                  setExpiryDate(e.target.value);
                  setExpiryAutoFilled(false);
                }}
                className={`bg-[#0a0a0a] border ${errors.expiryDate ? 'border-red-500/60' : 'border-white/10'} rounded-[10px] px-3 py-2.5 text-white font-crimson text-sm outline-none focus:border-[#0D9488]/60 transition-all duration-200 [color-scheme:dark]`}
              />
              {errors.expiryDate && (
                <span className="font-crimson text-xs text-red-400">{errors.expiryDate}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[10px] border border-white/10 text-white/60 font-crimson text-base hover:border-white/20 hover:text-white transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-[10px] bg-[#0D9488] text-white font-crimson text-base font-medium hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
