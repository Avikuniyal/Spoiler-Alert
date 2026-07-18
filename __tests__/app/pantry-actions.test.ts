import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { testSupabase, testUserId, cleanupTestData } from '../helpers/supabase-test-client';
import type { PantryItem } from '@/types/pantry';

// Mock next/cache — revalidatePath has no meaning outside Next.js
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock supabase/server to return a real Supabase client (service role key, bypasses RLS).
// Path must match what src/app/pantry-actions.ts resolves: ../../supabase/server
// From __tests__/app/ this also resolves to ../../supabase/server → project root supabase/server.
vi.mock('../../supabase/server', () => ({
  createClient: async () => testSupabase,
}));

const SUITE = 'pantry-actions';
const userId = testUserId(SUITE);

// Dynamic import after mocks are wired up
const {
  getPantryItems,
  addPantryItem,
  markItemUsed,
  markItemWasted,
  getExpiringItems,
  getSavingsStats,
} = await import('../../src/app/pantry-actions');

beforeAll(async () => {
  await cleanupTestData(userId);
});

afterAll(async () => {
  await cleanupTestData(userId);
});

describe('addPantryItem', () => {
  it('inserts a pantry item with correct fields', async () => {
    const item = await addPantryItem({
      userId,
      name: 'Test Milk',
      category: 'Dairy',
      expiryDate: '2026-08-01',
      storageZone: 'fridge',
      opened: false,
    });

    expect(item).toBeDefined();
    expect(item.name).toBe('Test Milk');
    expect(item.category).toBe('Dairy');
    expect(item.user_id).toBe(userId);
    expect(item.status).toBe('active');
    expect(item.estimated_cost).toBe(5.0); // CATEGORY_COSTS.Dairy
    expect(item.storage_zone).toBe('fridge');
    expect(item.opened).toBe(false);
    expect(item.expiry_date).toBe('2026-08-01');

    // Cleanup
    await testSupabase.from('pantry_items').delete().eq('id', item.id);
  });

  it('uses default cost when category is unknown', async () => {
    const item = await addPantryItem({
      userId,
      name: 'Mystery Item',
      category: 'Other',
      expiryDate: '2026-08-01',
    });

    expect(item.estimated_cost).toBe(4.0); // CATEGORY_COSTS.Other

    await testSupabase.from('pantry_items').delete().eq('id', item.id);
  });

  it('defaults storage_zone to null and opened to false', async () => {
    const item = await addPantryItem({
      userId,
      name: 'Plain Bread',
      category: 'Bakery',
      expiryDate: '2026-07-25',
    });

    expect(item.storage_zone).toBeNull();
    expect(item.opened).toBe(false);

    await testSupabase.from('pantry_items').delete().eq('id', item.id);
  });
});

describe('getPantryItems', () => {
  let testItemId: string;

  beforeAll(async () => {
    const { data } = await testSupabase
      .from('pantry_items')
      .insert({
        user_id: userId,
        name: 'GetTest Eggs',
        category: 'Dairy',
        expiry_date: '2026-07-30',
        status: 'active',
        estimated_cost: 5.0,
      })
      .select()
      .single();
    testItemId = data!.id;
  });

  afterAll(async () => {
    await testSupabase.from('pantry_items').delete().eq('id', testItemId);
  });

  it('returns only active items for the given user', async () => {
    const items = await getPantryItems(userId);
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      expect(item.user_id).toBe(userId);
      expect(item.status).toBe('active');
    }
  });

  it('includes the test item', async () => {
    const items = await getPantryItems(userId);
    const found = items.find((i: PantryItem) => i.id === testItemId);
    expect(found).toBeDefined();
    expect(found!.name).toBe('GetTest Eggs');
  });

  it('orders by expiry_date ascending', async () => {
    const items = await getPantryItems(userId);
    for (let i = 1; i < items.length; i++) {
      expect(items[i].expiry_date >= items[i - 1].expiry_date).toBe(true);
    }
  });
});

describe('markItemUsed', () => {
  let itemId: string;

  beforeAll(async () => {
    const { data } = await testSupabase
      .from('pantry_items')
      .insert({
        user_id: userId,
        name: 'UsedTest Cheese',
        category: 'Dairy',
        expiry_date: '2026-07-28',
        status: 'active',
        estimated_cost: 5.0,
      })
      .select()
      .single();
    itemId = data!.id;
  });

  it('updates item status to used', async () => {
    await markItemUsed(itemId, userId);

    const { data } = await testSupabase
      .from('pantry_items')
      .select('status')
      .eq('id', itemId)
      .single();

    expect(data!.status).toBe('used');
  });

  it('creates a food_log entry with action=used and correct savings', async () => {
    const { data: logs } = await testSupabase
      .from('food_logs')
      .select('*')
      .eq('item_id', itemId)
      .eq('action', 'used');

    expect(logs).toBeDefined();
    expect(logs!.length).toBeGreaterThanOrEqual(1);
    const log = logs!.find((l) => l.user_id === userId);
    expect(log).toBeDefined();
    expect(log!.savings_amount).toBe(5.0); // estimated_cost from the item
  });

  afterAll(async () => {
    await testSupabase.from('food_logs').delete().eq('item_id', itemId);
    await testSupabase.from('pantry_items').delete().eq('id', itemId);
  });
});

describe('markItemWasted', () => {
  let itemId: string;

  beforeAll(async () => {
    const { data } = await testSupabase
      .from('pantry_items')
      .insert({
        user_id: userId,
        name: 'WastedTest Spinach',
        category: 'Produce',
        expiry_date: '2026-07-20',
        status: 'active',
        estimated_cost: 3.5,
      })
      .select()
      .single();
    itemId = data!.id;
  });

  it('updates item status to wasted', async () => {
    await markItemWasted(itemId, userId);

    const { data } = await testSupabase
      .from('pantry_items')
      .select('status')
      .eq('id', itemId)
      .single();

    expect(data!.status).toBe('wasted');
  });

  it('creates a food_log entry with action=wasted and savings_amount=0', async () => {
    const { data: logs } = await testSupabase
      .from('food_logs')
      .select('*')
      .eq('item_id', itemId)
      .eq('action', 'wasted');

    expect(logs).toBeDefined();
    expect(logs!.length).toBeGreaterThanOrEqual(1);
    const log = logs!.find((l) => l.user_id === userId);
    expect(log).toBeDefined();
    expect(log!.savings_amount).toBe(0);
  });

  afterAll(async () => {
    await testSupabase.from('food_logs').delete().eq('item_id', itemId);
    await testSupabase.from('pantry_items').delete().eq('id', itemId);
  });
});

describe('getExpiringItems', () => {
  let itemIds: string[] = [];

  beforeAll(async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const items = [
      {
        user_id: userId,
        name: 'ExpiryTest Expired Item',
        category: 'Produce',
        expiry_date: yesterday.toISOString().split('T')[0],
        status: 'active',
        estimated_cost: 3.5,
      },
      {
        user_id: userId,
        name: 'ExpiryTest Tomorrow Item',
        category: 'Dairy',
        expiry_date: tomorrow.toISOString().split('T')[0],
        status: 'active',
        estimated_cost: 5.0,
      },
      {
        user_id: userId,
        name: 'ExpiryTest Next Week Item',
        category: 'Meat',
        expiry_date: nextWeek.toISOString().split('T')[0],
        status: 'active',
        estimated_cost: 8.0,
      },
    ];

    const { data } = await testSupabase
      .from('pantry_items')
      .insert(items)
      .select();

    itemIds = data?.map((d) => d.id) ?? [];
  });

  afterAll(async () => {
    for (const id of itemIds) {
      await testSupabase.from('pantry_items').delete().eq('id', id);
    }
  });

  it('returns items expiring within daysAhead', async () => {
    const items = await getExpiringItems(userId, 3);
    // Should include expired item and tomorrow item, but not next week item
    const names = items.map((i: PantryItem) => i.name);
    expect(names).toContain('ExpiryTest Expired Item');
    expect(names).toContain('ExpiryTest Tomorrow Item');
    expect(names).not.toContain('ExpiryTest Next Week Item');
  });

  it('includes already-expired items', async () => {
    const items = await getExpiringItems(userId, 0);
    const names = items.map((i: PantryItem) => i.name);
    expect(names).toContain('ExpiryTest Expired Item');
  });

  it('orders by expiry_date ascending', async () => {
    const items = await getExpiringItems(userId, 10);
    for (let i = 1; i < items.length; i++) {
      expect(items[i].expiry_date >= items[i - 1].expiry_date).toBe(true);
    }
  });

  it('only returns active items', async () => {
    const items = await getExpiringItems(userId, 10);
    for (const item of items) {
      expect(item.status).toBe('active');
    }
  });
});

describe('getSavingsStats', () => {
  const logIds: string[] = [];

  beforeAll(async () => {
    // Create some food_logs for the test user
    const { data } = await testSupabase
      .from('food_logs')
      .insert([
        {
          user_id: userId,
          item_name: 'StatsTest Used Item 1',
          category: 'Dairy',
          action: 'used',
          savings_amount: 5.0,
        },
        {
          user_id: userId,
          item_name: 'StatsTest Used Item 2',
          category: 'Meat',
          action: 'used',
          savings_amount: 8.0,
        },
        {
          user_id: userId,
          item_name: 'StatsTest Wasted Item',
          category: 'Produce',
          action: 'wasted',
          savings_amount: 0,
        },
      ])
      .select();

    logIds.push(...(data?.map((d) => d.id) ?? []));
  });

  afterAll(async () => {
    for (const id of logIds) {
      await testSupabase.from('food_logs').delete().eq('id', id);
    }
  });

  it('computes totalSaved from used items', async () => {
    const stats = await getSavingsStats(userId);
    // At minimum, the two items we inserted should be included
    expect(stats.totalSaved).toBeGreaterThanOrEqual(13.0);
  });

  it('computes totalWasted count', async () => {
    const stats = await getSavingsStats(userId);
    expect(stats.totalWasted).toBeGreaterThanOrEqual(1);
  });

  it('computes totalUsed count', async () => {
    const stats = await getSavingsStats(userId);
    expect(stats.totalUsed).toBeGreaterThanOrEqual(2);
  });

  it('computes monthSaved for current month', async () => {
    const stats = await getSavingsStats(userId);
    // Our test items were just created, so they should be in current month
    expect(stats.monthSaved).toBeGreaterThanOrEqual(13.0);
  });

  it('returns sparklineData as a 7-element array', async () => {
    const stats = await getSavingsStats(userId);
    expect(stats.sparklineData).toHaveLength(7);
    for (const entry of stats.sparklineData) {
      expect(entry).toHaveProperty('day');
      expect(entry).toHaveProperty('value');
      expect(typeof entry.value).toBe('number');
    }
  });
});
