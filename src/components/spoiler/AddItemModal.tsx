'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, ScanLine } from 'lucide-react';
import { FoodCategory } from '@/types/pantry';
import { getShelfLife, getDefaultZone, getDefaultCategory, StorageZone, FOOD_SUGGESTIONS } from '@/lib/shelf-life';

const TODAY = new Date().toISOString().split('T')[0];

const CATEGORIES: FoodCategory[] = [
  'Produce', 'Dairy', 'Meat', 'Pantry Staples', 'Bakery', 'Frozen', 'Beverages', 'Other'
];

const STORAGE_ZONES: { value: StorageZone; label: string; icon: string }[] = [
  { value: 'fridge',  label: 'Fridge',  icon: '🧊' },
  { value: 'freezer', label: 'Freezer', icon: '❄️' },
  { value: 'pantry',  label: 'Pantry',  icon: '🏠' },
];

interface ItemData {
  name: string;
  category: FoodCategory;
  purchaseDate?: string;
  expiryDate: string;
  storageZone: StorageZone;
  opened: boolean;
}

interface AddItemModalProps {
  onClose: () => void;
  onSubmit: (data: ItemData) => Promise<void>;
}

function getSuggestions(input: string): string[] {
  const q = input.toLowerCase().trim();
  if (!q) return [];
  const startsWith = FOOD_SUGGESTIONS.filter(s => s.toLowerCase().startsWith(q));
  const contains  = FOOD_SUGGESTIONS.filter(s => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
  return [...startsWith, ...contains].slice(0, 6);
}

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
  // Current text in the chip input
  const [input, setInput] = useState('');
  // Committed chips (each carries its own settings snapshot)
  const [chips, setChips] = useState<ItemData[]>([]);

  // Settings for the current item being typed — auto-derived from input name
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [storageZone, setStorageZone] = useState<StorageZone>('fridge');
  const [zoneManual, setZoneManual] = useState(false);
  const [categoryManual, setCategoryManual] = useState(false);
  const [opened, setOpened] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(TODAY);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryAutoFilled, setExpiryAutoFilled] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestions(input), [input]);

  useEffect(() => { setActiveSuggestion(-1); }, [suggestions]);

  // Auto-derive zone from typed name
  useEffect(() => {
    if (input.trim().length < 3 || zoneManual) return;
    const z = getDefaultZone(input.trim());
    if (z) setStorageZone(z);
  }, [input, zoneManual]);

  // Auto-derive category from typed name
  useEffect(() => {
    if (input.trim().length < 3 || categoryManual) return;
    const c = getDefaultCategory(input.trim());
    if (c) setCategory(c);
  }, [input, categoryManual]);

  // Auto-fill expiry
  useEffect(() => {
    if (input.trim().length < 3) return;
    const days = getShelfLife(input.trim(), category, storageZone, opened);
    const base = purchaseDate ? new Date(`${purchaseDate}T00:00:00`) : new Date();
    base.setDate(base.getDate() + days);
    setExpiryDate(base.toISOString().split('T')[0]);
    setExpiryAutoFilled(true);
  }, [input, category, storageZone, opened, purchaseDate]);

  const commitChip = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || !expiryDate) return;

    setChips(prev => [...prev, {
      name: trimmed,
      category,
      purchaseDate: purchaseDate || undefined,
      expiryDate,
      storageZone,
      opened,
    }]);
    setInput('');
    setShowDropdown(false);
    setActiveSuggestion(-1);
    setZoneManual(false);
    setCategoryManual(false);
    setExpiryAutoFilled(false);
    setExpiryDate('');
    setErrors({});
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const selectSuggestion = (name: string) => {
    setInput(name);
    setShowDropdown(false);
    setActiveSuggestion(-1);
    // rAF ensures focus fires after React flushes state and the blur timeout clears
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeChip = (i: number) => {
    setChips(prev => prev.filter((_, j) => j !== i));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      const isKnown = FOOD_SUGGESTIONS.some(s => s.toLowerCase() === trimmed.toLowerCase());
      if (isKnown) {
        // Known ingredient — commit immediately with the canonical casing
        const canonical = FOOD_SUGGESTIONS.find(s => s.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
        commitChip(canonical);
      } else if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        // A suggestion is highlighted but input doesn't match yet — fill it first
        selectSuggestion(suggestions[activeSuggestion]);
      } else {
        // Free-typed name not in database — still commit it
        commitChip(trimmed);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveSuggestion(-1);
    } else if (e.key === 'Backspace' && input === '' && chips.length > 0) {
      setChips(prev => prev.slice(0, -1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Double-space commits the current input as a chip
    if (val.endsWith('  ') && val.trim()) {
      commitChip(val.trim());
      return;
    }
    setInput(val);
    setShowDropdown(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (chips.length === 0 && !input.trim()) errs.input = 'Add at least one item';
    if (input.trim() && !expiryDate) errs.expiryDate = 'Expiry date is required';
    if (input.trim() && expiryDate && purchaseDate && new Date(expiryDate) < new Date(purchaseDate)) {
      errs.expiryDate = 'Expiry must be after purchase date';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Include whatever is currently typed (if valid) as a final item
    const allItems: ItemData[] = [
      ...chips,
      ...(input.trim() && expiryDate ? [{
        name: input.trim(), category, purchaseDate: purchaseDate || undefined,
        expiryDate, storageZone, opened,
      }] : []),
    ];

    setLoading(true);
    try {
      for (const item of allItems) await onSubmit(item);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalQueued = chips.length + (input.trim() ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-[15px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] overflow-hidden card-enter max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="font-playfair text-xl font-bold text-white">Add Food Items</h2>
            <p className="font-crimson text-sm text-white/50 mt-0.5">
              {chips.length > 0
                ? `${chips.length} item${chips.length !== 1 ? 's' : ''} ready — keep adding or save`
                : 'Type a food name and press Enter or pick a suggestion'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[7px] border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all duration-200">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

            {/* Chip input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70">Food Names</label>

              {/* The chip+input container */}
              <div
                ref={wrapperRef}
                onClick={() => inputRef.current?.focus()}
                className={`min-h-[48px] flex flex-wrap gap-2 items-center bg-[#0a0a0a] border ${errors.input ? 'border-red-500/60' : 'border-white/10'} rounded-[10px] px-3 py-2.5 cursor-text focus-within:border-[#0D9488]/60 focus-within:ring-1 focus-within:ring-[#0D9488]/30 transition-all duration-200`}
              >
                {chips.map((chip, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0D9488]/20 border border-[#0D9488]/40 rounded-full text-sm font-crimson text-[#0D9488] flex-shrink-0"
                  >
                    {chip.name}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeChip(i); }}
                      className="text-[#0D9488]/60 hover:text-[#0D9488] transition-colors leading-none"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                    onKeyDown={handleKeyDown}
                    placeholder={chips.length === 0 ? 'e.g. Broccoli, Milk…' : 'Add another…'}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-white font-crimson text-base placeholder-white/30 outline-none"
                  />
                  <button
                    type="button"
                    className="p-1 text-white/30 hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all duration-200 flex-shrink-0"
                    title="Barcode scan (coming soon)"
                  >
                    <ScanLine size={15} />
                  </button>
                </div>
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <ul className="bg-[#0a0a0a] border border-white/10 rounded-[10px] overflow-hidden">
                  {suggestions.map((s, i) => (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
                        className={`w-full text-left px-3 py-2 font-crimson text-sm transition-colors duration-100 ${
                          i === activeSuggestion
                            ? 'bg-[#0D9488]/20 text-[#0D9488]'
                            : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                        } ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                      >
                        <HighlightedSuggestion text={s} query={input} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {errors.input && <span className="font-crimson text-xs text-red-400">{errors.input}</span>}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70 flex items-center gap-1.5">
                Category
                {!categoryManual && input.trim().length >= 3 && getDefaultCategory(input.trim()) && (
                  <span className="text-[#0D9488]/70 text-xs">auto-selected</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); setCategoryManual(true); }}
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

            {/* Storage Location */}
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70 flex items-center gap-1.5">
                Storage Location
                {!zoneManual && input.trim().length >= 3 && getDefaultZone(input.trim()) && (
                  <span className="text-[#0D9488]/70 text-xs">auto-selected</span>
                )}
              </label>
              <div className="flex gap-2">
                {STORAGE_ZONES.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setStorageZone(value); setZoneManual(true); }}
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
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${opened ? 'bg-[#0D9488]' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${opened ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="font-crimson text-sm text-white/70">
                Already opened
                <span className="text-white/30 ml-1.5">affects shelf life estimate</span>
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-crimson text-sm text-white/70 flex items-center gap-1.5">
                  Purchase Date
                  {purchaseDate === TODAY && <span className="text-[#0D9488]/70 text-xs">today</span>}
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
                  {expiryAutoFilled && <span className="text-[#0D9488]/70 text-xs">auto-suggested</span>}
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => { setExpiryDate(e.target.value); setExpiryAutoFilled(false); }}
                  className={`bg-[#0a0a0a] border ${errors.expiryDate ? 'border-red-500/60' : 'border-white/10'} rounded-[10px] px-3 py-2.5 text-white font-crimson text-sm outline-none focus:border-[#0D9488]/60 transition-all duration-200 [color-scheme:dark]`}
                />
                {errors.expiryDate && <span className="font-crimson text-xs text-red-400">{errors.expiryDate}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[10px] border border-white/10 text-white/60 font-crimson text-sm hover:border-white/20 hover:text-white transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || totalQueued === 0}
                className="flex-1 py-2.5 rounded-[10px] bg-[#0D9488] text-white font-crimson text-base font-medium hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(13,148,136,0.3)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Saving…' : totalQueued > 1 ? `Save All (${totalQueued})` : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
