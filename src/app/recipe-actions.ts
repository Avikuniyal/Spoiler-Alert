'use server';

// Thin server action wrapper around the Spoonacular recipe fetch in
// src/lib/recipes.ts. Keeping this as a separate 'use server' file ensures
// SPOONACULAR_API_KEY is never exposed to the client bundle.

import { getRecipeSuggestions, getRecipeDetails, getRecipesByType } from '@/lib/recipes';
import { Recipe, RecipeDetail } from '@/types/pantry';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Server action: fetch recipe suggestions for a list of expiring ingredient names.
 * Safe to call from client components — the API key stays on the server.
 *
 * @param ingredientNames  Names of expiring pantry items
 * @param count            Max number of recipes to return (default 6)
 */
export async function fetchRecipeSuggestions(
  ingredientNames: string[],
  count: number = 6,
): Promise<Recipe[]> {
  return getRecipeSuggestions(ingredientNames, count);
}

export async function fetchRecipeDetails(recipeId: string): Promise<RecipeDetail | null> {
  return getRecipeDetails(recipeId);
}

/**
 * Fetch one popular meal, snack, and dessert for the dashboard.
 * Sequential with 700ms gaps to stay within the free-tier 1 req/s limit.
 * Results are cached server-side for 1 hour, so only the first load per
 * offset pays the wait time.
 */
export async function fetchDashboardRecipes(
  _ingredientNames: string[],
  offset: number = 0,
): Promise<{ recipe: Recipe; label: string }[]> {
  // Stagger offsets so the three types don't pull the same top result from the shared popularity pool.
  const meal = await getRecipesByType('main course', offset * 3);
  await delay(700);
  const snack = await getRecipesByType('snack', offset * 3 + 1);
  await delay(700);
  const dessert = await getRecipesByType('dessert', offset * 3 + 2);

  const result: { recipe: Recipe; label: string }[] = [];
  if (meal) result.push({ recipe: meal, label: 'Meal' });
  if (snack) result.push({ recipe: snack, label: 'Snack' });
  if (dessert) result.push({ recipe: dessert, label: 'Dessert' });
  return result;
}
