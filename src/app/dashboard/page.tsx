import { redirect } from 'next/navigation';
import { createClient } from '../../../supabase/server';
import { manageSubscriptionAction } from '../actions';
import { getPantryItems, getSavingsStats } from '../pantry-actions';
import SpoilerDashboard from '@/components/spoiler/SpoilerDashboard';
import { PantryItem } from '@/types/pantry';
import { Toaster } from 'sonner';

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const result = await manageSubscriptionAction(user?.id);

  if (!result) {
    return redirect('/pricing');
  }

  let items: PantryItem[] = [];
  let savings = {
    totalSaved: 0,
    monthSaved: 0,
    totalUsed: 0,
    totalWasted: 0,
    sparklineData: Array.from({ length: 7 }, (_, i) => ({ day: i, value: 0 })),
  };

  try {
    const [fetchedItems, fetchedSavings] = await Promise.all([
      getPantryItems(user.id),
      getSavingsStats(user.id),
    ]);
    items = (fetchedItems as PantryItem[]) || [];
    savings = fetchedSavings;
  } catch (err) {
    console.error('Failed to fetch pantry data:', err);
  }

  return (
    <>
      <Toaster position="top-right" />
      <SpoilerDashboard
        initialItems={items}
        userId={user.id}
        userEmail={user.email || ''}
        savings={savings}
      />
    </>
  );
}
