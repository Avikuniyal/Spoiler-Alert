'use server';

import { createClient } from '../../supabase/server';
import { revalidatePath } from 'next/cache';
import { FoodCategory, CATEGORY_COSTS } from '@/types/pantry';

export async function getPantryItems(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expiry_date', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function addPantryItem(formData: {
  userId: string;
  name: string;
  category: FoodCategory;
  purchaseDate?: string;
  expiryDate: string;
  storageZone?: 'fridge' | 'freezer' | 'pantry';
  opened?: boolean;
}) {
  const supabase = await createClient();
  const estimatedCost = CATEGORY_COSTS[formData.category] || 4.0;

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: formData.userId,
      name: formData.name,
      category: formData.category,
      purchase_date: formData.purchaseDate || null,
      expiry_date: formData.expiryDate,
      status: 'active',
      estimated_cost: estimatedCost,
      storage_zone: formData.storageZone ?? null,
      opened: formData.opened ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/dashboard');
  return data;
}

export async function markItemUsed(itemId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: item, error: fetchError } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', itemId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const { error: updateError } = await supabase
    .from('pantry_items')
    .update({ status: 'used', updated_at: new Date().toISOString() })
    .eq('id', itemId);
  
  if (updateError) throw updateError;
  
  const { error: logError } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      item_id: itemId,
      item_name: item.name,
      category: item.category,
      action: 'used',
      savings_amount: item.estimated_cost,
    });
  
  if (logError) throw logError;
  revalidatePath('/dashboard');
  return item;
}

export async function markItemWasted(itemId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: item, error: fetchError } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', itemId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const { error: updateError } = await supabase
    .from('pantry_items')
    .update({ status: 'wasted', updated_at: new Date().toISOString() })
    .eq('id', itemId);
  
  if (updateError) throw updateError;
  
  const { error: logError } = await supabase
    .from('food_logs')
    .insert({
      user_id: userId,
      item_id: itemId,
      item_name: item.name,
      category: item.category,
      action: 'wasted',
      savings_amount: 0,
    });
  
  if (logError) throw logError;
  revalidatePath('/dashboard');
  return item;
}

export async function getExpiringItems(userId: string, daysAhead: number) {
  const supabase = await createClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const cutoffStr = cutoff.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('expiry_date', cutoffStr) // includes already-expired items (no lower bound)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSavingsStats(userId: string) {
  const supabase = await createClient();
  
  const { data: logs, error } = await supabase
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });
  
  if (error) throw error;
  
  const totalSaved = logs
    ?.filter(l => l.action === 'used')
    .reduce((sum, l) => sum + (l.savings_amount || 0), 0) || 0;
  
  const totalWasted = logs
    ?.filter(l => l.action === 'wasted')
    .length || 0;
  
  const totalUsed = logs
    ?.filter(l => l.action === 'used')
    .length || 0;
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSaved = logs
    ?.filter(l => l.action === 'used' && new Date(l.logged_at) >= monthStart)
    .reduce((sum, l) => sum + (l.savings_amount || 0), 0) || 0;
  
  const sparklineData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const dayTotal = logs
      ?.filter(l => {
        const logDate = new Date(l.logged_at);
        return l.action === 'used' && logDate >= day && logDate < nextDay;
      })
      .reduce((sum, l) => sum + (l.savings_amount || 0), 0) || 0;
    
    return { day: i, value: dayTotal };
  });
  
  return { totalSaved, totalWasted, totalUsed, monthSaved, sparklineData };
}
