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
}

export interface UrgencyLevel {
  level: 'green' | 'amber' | 'red';
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
  
  if (daysLeft <= 0) {
    return { level: 'red', daysLeft, label: daysLeft === 0 ? 'Expires today' : 'Expired' };
  } else if (daysLeft <= 3) {
    return { level: 'amber', daysLeft, label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` };
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
