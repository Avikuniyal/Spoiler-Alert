import { describe, it, expect } from 'vitest';
import {
  getShelfLife,
  getDefaultCategory,
  getDefaultZone,
  FOOD_SUGGESTIONS,
} from '@/lib/shelf-life';

describe('getDefaultCategory', () => {
  it('returns Produce for known produce items', () => {
    expect(getDefaultCategory('apple')).toBe('Produce');
    expect(getDefaultCategory('Banana')).toBe('Produce');
    expect(getDefaultCategory('baby spinach')).toBe('Produce');
  });

  it('returns Dairy for known dairy items', () => {
    expect(getDefaultCategory('milk')).toBe('Dairy');
    expect(getDefaultCategory('greek yogurt')).toBe('Dairy');
    expect(getDefaultCategory('cheddar')).toBe('Dairy');
  });

  it('returns Meat for known meat items', () => {
    expect(getDefaultCategory('chicken breast')).toBe('Meat');
    expect(getDefaultCategory('ground beef')).toBe('Meat');
    expect(getDefaultCategory('salmon')).toBe('Meat');
  });

  it('returns Pantry Staples for shelf-stable items', () => {
    expect(getDefaultCategory('flour')).toBe('Pantry Staples');
    expect(getDefaultCategory('olive oil')).toBe('Pantry Staples');
    expect(getDefaultCategory('white rice')).toBe('Pantry Staples');
  });

  it('returns null for unknown items', () => {
    expect(getDefaultCategory('unicorn meat')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getDefaultCategory('MILK')).toBe('Dairy');
    expect(getDefaultCategory('ChIcKeN')).toBe('Meat');
  });

  it('matches substrings', () => {
    expect(getDefaultCategory('organic free-range chicken thighs')).toBe('Meat');
    expect(getDefaultCategory('2% reduced fat milk')).toBe('Dairy');
  });
});

describe('getDefaultZone', () => {
  it('returns fridge for fridge-stored items', () => {
    expect(getDefaultZone('milk')).toBe('fridge');
    expect(getDefaultZone('chicken breast')).toBe('fridge');
    expect(getDefaultZone('broccoli')).toBe('fridge');
  });

  it('returns pantry for pantry-stored items', () => {
    expect(getDefaultZone('banana')).toBe('pantry');
    expect(getDefaultZone('bread')).toBe('pantry');
    expect(getDefaultZone('olive oil')).toBe('pantry');
  });

  it('returns freezer for frozen items', () => {
    expect(getDefaultZone('ice cream')).toBe('freezer');
    expect(getDefaultZone('frozen peas')).toBe('freezer');
  });

  it('returns null for unknown items', () => {
    expect(getDefaultZone('unicorn meat')).toBeNull();
  });
});

describe('getShelfLife', () => {
  it('returns correct days for a known item in its default zone (unopened)', () => {
    // Milk in fridge, unopened: 14 days
    expect(getShelfLife('milk', 'Dairy', 'fridge', false)).toBe(14);
  });

  it('returns correct days for opened items', () => {
    // Milk in fridge, opened: 7 days
    expect(getShelfLife('milk', 'Dairy', 'fridge', true)).toBe(7);
  });

  it('returns category default when zone value is 0 (not recommended)', () => {
    // Cheese in pantry returns 0 (not recommended for pantry storage)
    // Should fall back to Pantry Staples category default for pantry: 365
    // Wait — cheese is Dairy, not Pantry Staples. Dairy pantry default is 1.
    const result = getShelfLife('cheese', 'Dairy', 'pantry', false);
    expect(result).toBe(1); // Dairy category fallback for pantry
  });

  it('returns category default for unknown items', () => {
    // Unknown item in fridge with Meat category → Meat fridge default = 2
    expect(getShelfLife('mystery meat', 'Meat', 'fridge', false)).toBe(2);
  });

  it('always returns at least 1', () => {
    // Unknown item in a zone with 0 default should still return >= 1 from category defaults
    const result = getShelfLife('unknown', 'Other', 'fridge', false);
    expect(result).toBeGreaterThanOrEqual(1);
  });

  it('is case-insensitive', () => {
    expect(getShelfLife('MILK', 'Dairy', 'fridge', false)).toBe(14);
    expect(getShelfLife('Chicken Breast', 'Meat', 'fridge', false)).toBe(2);
  });

  it('handles items with multiple names', () => {
    // "eggs" and "large eggs" should both match
    expect(getShelfLife('eggs', 'Dairy', 'fridge', false)).toBe(35);
    expect(getShelfLife('large eggs', 'Dairy', 'fridge', false)).toBe(35);
  });

  it('returns correct values for freezer storage', () => {
    // Chicken in freezer, unopened: 270 days
    expect(getShelfLife('chicken breast', 'Meat', 'freezer', false)).toBe(270);
    // Chicken in freezer, opened: 270 days
    expect(getShelfLife('chicken breast', 'Meat', 'freezer', true)).toBe(270);
  });

  it('handles produce items correctly', () => {
    // Avocado in pantry (default), unopened: 3 days
    expect(getShelfLife('avocado', 'Produce', 'pantry', false)).toBe(3);
    // Avocado in fridge, unopened: 5 days
    expect(getShelfLife('avocado', 'Produce', 'fridge', false)).toBe(5);
    // Avocado in fridge, opened: 2 days
    expect(getShelfLife('avocado', 'Produce', 'fridge', true)).toBe(2);
  });
});

describe('FOOD_SUGGESTIONS', () => {
  it('is sorted alphabetically', () => {
    for (let i = 1; i < FOOD_SUGGESTIONS.length; i++) {
      expect(FOOD_SUGGESTIONS[i].localeCompare(FOOD_SUGGESTIONS[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('contains no duplicates', () => {
    const unique = new Set(FOOD_SUGGESTIONS);
    expect(unique.size).toBe(FOOD_SUGGESTIONS.length);
  });

  it('contains known food items', () => {
    expect(FOOD_SUGGESTIONS).toContain('Apple');
    expect(FOOD_SUGGESTIONS).toContain('Milk');
    expect(FOOD_SUGGESTIONS).toContain('Chicken Breast');
    expect(FOOD_SUGGESTIONS).toContain('Eggs');
  });

  it('all entries are title-cased', () => {
    for (const name of FOOD_SUGGESTIONS) {
      // First character should be uppercase
      expect(name[0]).toBe(name[0].toUpperCase());
    }
  });
});
