export type PantryItemStatus = 'active' | 'used' | 'wasted';

export type FoodCategory = 
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Pantry Staples'
  | 'Bakery'
  | 'Frozen'
  | 'Beverages'
  | 'Other';

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: FoodCategory;
  purchase_date: string | null;
  expiry_date: string;
  status: PantryItemStatus;
  estimated_cost: number;
  storage_zone: 'fridge' | 'freezer' | 'pantry' | null;
  opened: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  item_id: string | null;
  item_name: string;
  category: string;
  action: 'used' | 'wasted';
  savings_amount: number;
  logged_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  matchedIngredients: string[];
  allIngredients: string[];
  steps: string[];
  imageUrl: string;
  cookTime: string;
  sourceUrl?: string; // link to full recipe on Spoonacular
}

export interface UrgencyLevel {
  // expired: past expiry date — distinct from red (shown differently in UI)
  // red:     expires today or tomorrow (0–1 days)
  // amber:   expires in 2–3 days
  // green:   expires in 4+ days
  level: 'green' | 'amber' | 'red' | 'expired';
  daysLeft: number;
  label: string;
}

export function getUrgency(expiryDate: string): UrgencyLevel {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { level: 'expired', daysLeft, label: 'Expired' };
  } else if (daysLeft <= 1) {
    return { level: 'red', daysLeft, label: daysLeft === 0 ? 'Expires today' : 'Expires tomorrow' };
  } else if (daysLeft <= 3) {
    return { level: 'amber', daysLeft, label: `${daysLeft} days left` };
  } else {
    return { level: 'green', daysLeft, label: `${daysLeft} days left` };
  }
}

export const CATEGORY_COSTS: Record<FoodCategory, number> = {
  Produce: 3.5,
  Dairy: 5.0,
  Meat: 8.0,
  'Pantry Staples': 4.0,
  Bakery: 3.0,
  Frozen: 6.0,
  Beverages: 4.5,
  Other: 4.0,
};

export const CATEGORY_ICONS: Record<FoodCategory, string> = {
  Produce: '🥦',
  Dairy: '🥛',
  Meat: '🥩',
  'Pantry Staples': '🥫',
  Bakery: '🍞',
  Frozen: '🧊',
  Beverages: '🧃',
  Other: '🥡',
};
