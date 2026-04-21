'use server';

// Thin server action wrapper around the Spoonacular recipe fetch in
// src/lib/recipes.ts. Keeping this as a separate 'use server' file ensures
// SPOONACULAR_API_KEY is never exposed to the client bundle.

import { getRecipeSuggestions, getRecipeDetails } from '@/lib/recipes';
import { Recipe, RecipeDetail } from '@/types/pantry';

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
