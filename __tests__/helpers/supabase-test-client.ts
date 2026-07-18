import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase env vars for tests. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local',
  );
}

/**
 * Supabase client using the service role key.
 * Bypasses RLS — use ONLY for test setup/teardown, never in production code.
 */
export const testSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Returns a unique test user ID for a given suite name.
 * Scoped to avoid collisions between parallel test runs.
 */
export function testUserId(suiteName: string): string {
  return `test-${suiteName}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Deletes all pantry_items and food_logs for a given user ID.
 * Call in afterAll/afterEach to clean up test data.
 */
export async function cleanupTestData(userId: string) {
  await testSupabase.from('food_logs').delete().eq('user_id', userId);
  await testSupabase.from('pantry_items').delete().eq('user_id', userId);
}
