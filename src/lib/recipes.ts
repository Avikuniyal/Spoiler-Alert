// Server-side only. This module reads SPOONACULAR_API_KEY from environment.
// Never import this file from a client component — use the server action in
// src/app/recipe-actions.ts instead.

import { Recipe, RecipeDetail } from '@/types/pantry';

const SPOONACULAR_BASE = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: Recipe[];
  expiresAt: number;
}

// Module-level cache. Lives in the Node.js process for the lifetime of the
// server instance. Empty on cold start / after a deploy. That is acceptable —
// the worst case is one extra Spoonacular call after a restart.
const recipeCache = new Map<string, CacheEntry>();

interface DetailCacheEntry {
  data: RecipeDetail;
  expiresAt: number;
}
const recipeDetailCache = new Map<string, DetailCacheEntry>();

// ── Spoonacular response shapes ───────────────────────────────────────────────

interface SpoonacularRecipeInfo {
  id: number;
  readyInMinutes: number;
  servings: number;
  extendedIngredients: { original: string }[];
  analyzedInstructions: { steps: { number: number; step: string }[] }[];
  summary: string;
  diets: string[];
}

interface SpoonacularIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  image: string;
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: SpoonacularIngredient[];
  missedIngredients: SpoonacularIngredient[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

function buildCacheKey(ingredients: string[]): string {
  return [...ingredients].sort().join(',').toLowerCase();
}

function mapToRecipe(raw: SpoonacularRecipe): Recipe {
  const usedNames = raw.usedIngredients.map((i) => i.name);
  const allNames = [...raw.usedIngredients, ...raw.missedIngredients].map((i) => i.name);
  // Spoonacular recipe page URL format is well-known and stable.
  const slug = raw.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return {
    id: String(raw.id),
    title: raw.title,
    imageUrl: raw.image,
    matchedIngredients: usedNames,
    allIngredients: allNames,
    steps: [], // findByIngredients does not return steps — see sourceUrl
    cookTime: '—',
    sourceUrl: `https://spoonacular.com/recipes/${slug}-${raw.id}`,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch recipe suggestions from Spoonacular's findByIngredients endpoint.
 *
 * Results are cached in memory for 1 hour keyed by sorted ingredient names.
 * Returns an empty array if:
 *   - ingredients is empty
 *   - SPOONACULAR_API_KEY is missing
 *   - the API call fails for any reason
 *
 * This function must only be called server-side.
 */
export async function getRecipeSuggestions(
  ingredients: string[],
  count: number = 6,
): Promise<Recipe[]> {
  if (ingredients.length === 0) return [];

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.warn('[recipes] SPOONACULAR_API_KEY is not set — recipe suggestions disabled');
    return [];
  }

  const key = buildCacheKey(ingredients);
  const cached = recipeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    ingredients: ingredients.join(',+'),
    number: String(count),
    ranking: '1',          // 1 = maximize used ingredients, 2 = minimize missing
    ignorePantry: 'false',
  });

  try {
    const res = await fetch(
      `${SPOONACULAR_BASE}/recipes/findByIngredients?${params}`,
      {
        cache: 'no-store', // we manage our own caching
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
        },
      },
    );

    if (!res.ok) {
      console.error(`[recipes] Spoonacular error: ${res.status} ${res.statusText}`);
      return [];
    }

    const json: SpoonacularRecipe[] = await res.json();
    const data = json.map(mapToRecipe);
    recipeCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (err) {
    console.error('[recipes] Failed to fetch from Spoonacular:', err);
    return [];
  }
}

export async function getRecipeDetails(recipeId: string): Promise<RecipeDetail | null> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return null;

  const cached = recipeDetailCache.get(recipeId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const res = await fetch(
      `${SPOONACULAR_BASE}/recipes/${recipeId}/information`,
      {
        cache: 'no-store',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
        },
      },
    );

    if (!res.ok) {
      console.error(`[recipes] /information error for ${recipeId}: ${res.status}`);
      return null;
    }

    const json: SpoonacularRecipeInfo = await res.json();
    const detail: RecipeDetail = {
      cookTime: json.readyInMinutes ?? 0,
      servings: json.servings ?? 0,
      steps: json.analyzedInstructions?.[0]?.steps?.map(s => s.step) ?? [],
      ingredients: json.extendedIngredients?.map(i => i.original) ?? [],
      summary: json.summary ? stripHtml(json.summary) : '',
      diets: json.diets ?? [],
    };

    recipeDetailCache.set(recipeId, { data: detail, expiresAt: Date.now() + CACHE_TTL_MS });
    return detail;
  } catch (err) {
    console.error('[recipes] Failed to fetch recipe details:', err);
    return null;
  }
}
