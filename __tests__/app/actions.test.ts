import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { testSupabase, testUserId, cleanupTestData } from '../helpers/supabase-test-client';

// Mock next/cache
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock next/navigation redirect — not available in test context
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

// Mock supabase/server — path must match src/app/actions.ts import: ../../supabase/server
vi.mock('../../supabase/server', () => ({
  createClient: async () => testSupabase,
}));

const SUITE = 'actions';
const userId = testUserId(SUITE);

const { checkUserSubscription } = await import('../../src/app/actions');

beforeAll(async () => {
  // Insert a test subscription row
  await testSupabase.from('subscriptions').insert({
    user_id: userId,
    status: 'active',
    customer_id: `test-customer-${userId}`,
    product_price_id: 'test-price-id',
    cancel_at_period_end: false,
  });
});

afterAll(async () => {
  await testSupabase.from('subscriptions').delete().eq('user_id', userId);
  await cleanupTestData(userId);
});

describe('checkUserSubscription', () => {
  it('returns true when user has an active subscription', async () => {
    const result = await checkUserSubscription(userId);
    expect(result).toBe(true);
  });

  it('returns false when user has no active subscription', async () => {
    const fakeUserId = testUserId('no-sub');
    const result = await checkUserSubscription(fakeUserId);
    expect(result).toBe(false);
  });
});
