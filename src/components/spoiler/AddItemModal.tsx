'use client';

import { useState } from 'react';
import { X, ScanLine } from 'lucide-react';
import { FoodCategory } from '@/types/pantry';

const CATEGORIES: FoodCategory[] = [
  'Produce', 'Dairy', 'Meat', 'Pantry Staples', 'Bakery', 'Frozen', 'Beverages', 'Other'
];

interface AddItemModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: FoodCategory;
    purchaseDate?: string;
    expiryDate: string;
  }) => Promise<void>;
}

export default function AddItemModal({ onClose, onSubmit }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Produce');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
      await onSubmit({ name: name.trim(), category, purchaseDate: purchaseDate || undefined, expiryDate });
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
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-crimson text-sm text-white/70">Food Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Broccoli, Greek Yogurt..."
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

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70">Purchase Date <span className="text-white/30">(optional)</span></label>
              <input
                type="date"
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded-[10px] px-3 py-2.5 text-white font-crimson text-sm outline-none focus:border-[#0D9488]/60 transition-all duration-200 [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-crimson text-sm text-white/70">Expiry Date <span className="text-red-400/70">*</span></label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
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
