// Shelf-life lookup engine based on USDA FoodKeeper data.
// All values are in days, using the midpoint of USDA's published ranges.
// A value of 0 means "not recommended for this storage zone" — callers
// should fall back to the category default in that case.

export type StorageZone = 'fridge' | 'freezer' | 'pantry';

interface ShelfLifeEntry {
  names: string[];
  fridge: { unopened: number; opened: number };
  freezer: { unopened: number; opened: number };
  pantry: { unopened: number; opened: number };
}

// Sorted longest-name-first so more specific entries match before generic ones
// (e.g. "cream cheese" before "cheese", "ground beef" before "beef").
const SHELF_LIFE_DATA: ShelfLifeEntry[] = [
  // ── PRODUCE ────────────────────────────────────────────────────────────────
  {
    names: ['cherry tomato', 'cherry tomatoes', 'grape tomato', 'grape tomatoes'],
    fridge: { unopened: 7, opened: 7 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 4, opened: 4 },
  },
  {
    names: ['baby spinach'],
    fridge: { unopened: 7, opened: 4 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['strawberry', 'strawberries'],
    fridge: { unopened: 5, opened: 3 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['avocado', 'avocados'],
    fridge: { unopened: 5, opened: 2 },
    freezer: { unopened: 90, opened: 90 },
    pantry: { unopened: 3, opened: 1 },
  },
  {
    names: ['mushroom', 'mushrooms', 'button mushroom'],
    fridge: { unopened: 7, opened: 5 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['apple', 'apples'],
    fridge: { unopened: 42, opened: 42 },
    freezer: { unopened: 300, opened: 300 },
    pantry: { unopened: 10, opened: 10 },
  },
  {
    names: ['banana', 'bananas'],
    fridge: { unopened: 6, opened: 6 },
    freezer: { unopened: 60, opened: 60 },
    pantry: { unopened: 3, opened: 3 },
  },
  {
    names: ['broccoli'],
    fridge: { unopened: 5, opened: 5 },
    freezer: { unopened: 365, opened: 365 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['carrot', 'carrots', 'baby carrot', 'baby carrots'],
    fridge: { unopened: 28, opened: 28 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 4, opened: 4 },
  },
  {
    names: ['lettuce', 'romaine', 'iceberg'],
    fridge: { unopened: 10, opened: 5 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['spinach'],
    fridge: { unopened: 7, opened: 4 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['tomato', 'tomatoes'],
    fridge: { unopened: 10, opened: 10 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 6, opened: 6 },
  },
  {
    names: ['onion', 'onions', 'red onion'],
    fridge: { unopened: 60, opened: 10 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 30, opened: 10 },
  },
  {
    names: ['garlic'],
    fridge: { unopened: 14, opened: 7 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 120, opened: 30 },
  },
  {
    names: ['bell pepper', 'bell peppers', 'capsicum'],
    fridge: { unopened: 10, opened: 4 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 2, opened: 2 },
  },
  {
    names: ['cucumber', 'cucumbers'],
    fridge: { unopened: 7, opened: 5 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 2, opened: 2 },
  },
  {
    names: ['lemon', 'lemons', 'lime', 'limes'],
    fridge: { unopened: 21, opened: 7 },
    freezer: { unopened: 120, opened: 120 },
    pantry: { unopened: 7, opened: 3 },
  },

  // ── DAIRY ──────────────────────────────────────────────────────────────────
  {
    names: ['cream cheese'],
    fridge: { unopened: 14, opened: 10 },
    freezer: { unopened: 60, opened: 60 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['heavy cream', 'whipping cream', 'heavy whipping cream'],
    fridge: { unopened: 21, opened: 7 },
    freezer: { unopened: 90, opened: 90 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['greek yogurt', 'yogurt', 'yoghurt'],
    fridge: { unopened: 14, opened: 7 },
    freezer: { unopened: 60, opened: 60 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['milk', 'whole milk', 'skim milk', '2% milk', 'oat milk', 'almond milk'],
    fridge: { unopened: 14, opened: 7 },
    freezer: { unopened: 90, opened: 90 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['egg', 'eggs', 'large eggs'],
    fridge: { unopened: 35, opened: 21 },
    freezer: { unopened: 365, opened: 365 },
    pantry: { unopened: 14, opened: 7 },
  },
  {
    names: ['butter', 'unsalted butter', 'salted butter'],
    fridge: { unopened: 90, opened: 30 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 1, opened: 1 },
  },
  {
    names: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'gouda', 'swiss cheese', 'brie'],
    fridge: { unopened: 60, opened: 21 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['sour cream'],
    fridge: { unopened: 21, opened: 7 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 0, opened: 0 },
  },

  // ── MEAT ───────────────────────────────────────────────────────────────────
  {
    names: ['chicken breast', 'chicken thigh', 'chicken thighs', 'chicken wings', 'chicken legs', 'chicken'],
    fridge: { unopened: 2, opened: 1 },
    freezer: { unopened: 270, opened: 270 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['ground beef', 'beef mince', 'hamburger meat'],
    fridge: { unopened: 2, opened: 1 },
    freezer: { unopened: 120, opened: 120 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['pork chop', 'pork chops', 'pork loin', 'pork'],
    fridge: { unopened: 4, opened: 2 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['bacon'],
    fridge: { unopened: 7, opened: 4 },
    freezer: { unopened: 30, opened: 30 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['steak', 'sirloin', 'ribeye', 'beef steak', 'beef'],
    fridge: { unopened: 4, opened: 3 },
    freezer: { unopened: 365, opened: 365 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['salmon', 'tilapia', 'cod', 'tuna steak', 'fish fillet', 'fish'],
    fridge: { unopened: 2, opened: 1 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['shrimp', 'prawns'],
    fridge: { unopened: 2, opened: 1 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['deli meat', 'lunch meat', 'turkey slices', 'ham slices', 'salami'],
    fridge: { unopened: 14, opened: 5 },
    freezer: { unopened: 60, opened: 60 },
    pantry: { unopened: 0, opened: 0 },
  },

  // ── PANTRY STAPLES ─────────────────────────────────────────────────────────
  {
    names: ['all purpose flour', 'all-purpose flour', 'flour'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 365, opened: 365 },
    pantry: { unopened: 365, opened: 180 },
  },
  {
    names: ['olive oil', 'vegetable oil', 'canola oil', 'cooking oil'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 365, opened: 90 },
  },
  {
    names: ['canned beans', 'black beans', 'kidney beans', 'chickpeas', 'garbanzo', 'canned tomatoes'],
    fridge: { unopened: 4, opened: 4 },
    freezer: { unopened: 180, opened: 180 },
    pantry: { unopened: 1095, opened: 4 },
  },
  {
    names: ['pasta', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'rigatoni'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 730, opened: 365 },
  },
  {
    names: ['white rice', 'brown rice', 'jasmine rice', 'rice'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 1825, opened: 365 },
  },
  {
    names: ['bread', 'sourdough', 'sandwich bread', 'white bread', 'whole wheat bread'],
    fridge: { unopened: 14, opened: 7 },
    freezer: { unopened: 90, opened: 90 },
    pantry: { unopened: 7, opened: 5 },
  },
  {
    names: ['sugar', 'white sugar', 'brown sugar', 'caster sugar'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 3650, opened: 3650 },
  },
  {
    names: ['honey'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 3650, opened: 3650 },
  },
  {
    names: ['peanut butter', 'almond butter', 'nut butter'],
    fridge: { unopened: 270, opened: 90 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 180, opened: 90 },
  },

  // ── FROZEN ─────────────────────────────────────────────────────────────────
  {
    names: ['ice cream', 'gelato', 'sorbet', 'frozen yogurt'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 120, opened: 60 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['frozen peas', 'frozen corn', 'frozen broccoli', 'frozen vegetables', 'mixed vegetables'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 270, opened: 180 },
    pantry: { unopened: 0, opened: 0 },
  },
  {
    names: ['frozen pizza'],
    fridge: { unopened: 0, opened: 0 },
    freezer: { unopened: 60, opened: 30 },
    pantry: { unopened: 0, opened: 0 },
  },

  // ── BEVERAGES ──────────────────────────────────────────────────────────────
  {
    names: ['orange juice', 'apple juice', 'grapefruit juice', 'juice'],
    fridge: { unopened: 14, opened: 7 },
    freezer: { unopened: 365, opened: 365 },
    pantry: { unopened: 7, opened: 3 },
  },
  {
    names: ['red wine', 'white wine', 'rosé', 'wine'],
    fridge: { unopened: 1825, opened: 5 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 1825, opened: 1 },
  },
  {
    names: ['beer', 'lager', 'ale', 'craft beer'],
    fridge: { unopened: 180, opened: 1 },
    freezer: { unopened: 0, opened: 0 },
    pantry: { unopened: 120, opened: 1 },
  },
];

// Category fallbacks when no item name matches.
// Used when getShelfLife can't find the item or when the matched zone returns 0.
const CATEGORY_DEFAULTS: Record<string, Record<StorageZone, number>> = {
  Produce:         { fridge: 7,   freezer: 180, pantry: 5   },
  Dairy:           { fridge: 7,   freezer: 60,  pantry: 1   },
  Meat:            { fridge: 2,   freezer: 180, pantry: 1   },
  Seafood:         { fridge: 2,   freezer: 180, pantry: 1   },
  Leftovers:       { fridge: 4,   freezer: 60,  pantry: 1   },
  'Pantry Staples':{ fridge: 60,  freezer: 365, pantry: 365 },
  Bakery:          { fridge: 7,   freezer: 90,  pantry: 5   },
  Frozen:          { fridge: 3,   freezer: 90,  pantry: 1   },
  Beverages:       { fridge: 7,   freezer: 30,  pantry: 14  },
  Other:           { fridge: 5,   freezer: 90,  pantry: 3   },
};

/**
 * All known food names from the shelf-life database, title-cased and
 * deduplicated. Exported for use as autocomplete suggestions in AddItemModal.
 * Starts-with matches are ranked first in the modal's filtering logic.
 */
export const FOOD_SUGGESTIONS: readonly string[] = Array.from(
  new Set(
    SHELF_LIFE_DATA.flatMap((e) => e.names).map((n) =>
      n
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    ),
  ),
).sort() as readonly string[];

/**
 * Returns estimated days until expiry for a food item.
 *
 * Lookup order:
 * 1. Search SHELF_LIFE_DATA for a name match (case-insensitive substring).
 * 2. If matched zone value is 0 (not recommended), fall through to category default.
 * 3. If no name match, use category default.
 *
 * @param itemName  - User-entered item name (e.g. "Greek Yogurt")
 * @param category  - One of the FoodCategory values from pantry.ts
 * @param storageZone - Where the item will be stored
 * @param opened    - Whether the package has already been opened
 * @returns number of days — always >= 1
 */
export function getShelfLife(
  itemName: string,
  category: string,
  storageZone: StorageZone,
  opened: boolean,
): number {
  const normalized = itemName.toLowerCase().trim();

  for (const entry of SHELF_LIFE_DATA) {
    const matched = entry.names.some(
      (n) => normalized.includes(n) || n.includes(normalized),
    );
    if (matched) {
      const days = entry[storageZone][opened ? 'opened' : 'unopened'];
      if (days > 0) return days;
      // Zone returned 0 (not recommended) — break and use category default
      break;
    }
  }

  const key = category in CATEGORY_DEFAULTS ? category : 'Other';
  return CATEGORY_DEFAULTS[key][storageZone];
}
