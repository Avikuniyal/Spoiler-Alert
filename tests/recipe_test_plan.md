# Recipe Scoring Heuristic — Test Plan

## Summary

All recipes are now scored by a heuristic and sorted high-to-low. Nothing is excluded.

**Scoring formula:** `score = (redMatchCount × 10) + (matchedIngredients.length × 2) − (missedIngredientCount × 5)`

**Tonight's Hero:** the highest-scored recipe with at least one red-tier item match, computed from the main `recipes` result set. If the main result set has no red match at all, a second dedicated Spoonacular call is made (`fetchRecipeSuggestions` scoped to just the red item names) and the hero is picked from that instead — see test case 4. Falls back to `null` only if that fallback call *also* returns no red match, or while either fetch is still loading.

---

## Test Cases

### 1. Scoring: red-match recipes rank highest

**Setup:** User has `["chicken", "broccoli"]` with chicken expiring today (red). Spoonacular returns:
- Recipe A: chicken + broccoli + salt (red=1, matched=2, missed=0) → score = 10 + 4 − 0 = **14**
- Recipe B: pasta + tomato + garlic (red=0, matched=0, missed=3) → score = 0 + 0 − 15 = **−15**

**Expected:** Recipe A appears first. Recipe B last. Recipe A is Tonight's Hero.

---

### 2. Missing-ingredient penalty

**Setup:** Two recipes both match 1 red item:
- Recipe A: red=1, matched=2, missed=0 → score = 10 + 4 − 0 = **14**
- Recipe B: red=1, matched=4, missed=3 → score = 10 + 8 − 15 = **3**

**Expected:** Recipe A (0 missing) ranks above Recipe B (3 missing), even though B uses more pantry items.

---

### 3. No red items — hero is null

**Setup:** All user's items have ≥4 days until expiry (green tier). No red-tier items exist.

**Expected:** `heroRecipe` is `null`. `TonightsHeroCard` does not render. Recipe panel still shows recipes sorted by score.

---

### 4. Hero falls back to a dedicated API call when no recipe matches red items

**Setup:** User has red-tier `["milk"]`. The main `fetchRecipeSuggestions` call (using all pantry item names) returns 6 recipes, none of which have any ingredient matching "milk".

**Expected:** A second `fetchRecipeSuggestions(["milk"], 6)` call fires automatically. If that call returns a recipe matching "milk", `heroRecipe` is picked from *that* result set (`heroRecipes` state), not the original 6. The main recipe panel continues to show the original (non-red-matching) results — the fallback call only feeds the hero, it does not replace the panel's list.

**Check:** Network tab shows 2 `fetchRecipeSuggestions`/Spoonacular calls total for this scenario, not 1. `heroRecipesLoading` is `true` between the main fetch resolving and the fallback resolving — hero card should show nothing (not a stale hero) during that window.

---

### 4b. Hero is genuinely null when even the fallback finds nothing

**Setup:** Same as above, but the fallback call (scoped to `["milk"]`) also returns no recipe containing "milk" as an ingredient.

**Expected:** `heroRecipe` is `null`. `TonightsHeroCard` does not render. Recipe panel still shows the original main-fetch recipes, sorted by score.

---

### 5. Missing-ingredient badge on recipe cards

**Setup:** Recipe has 2 ingredients not in the user's pantry.

**Expected:** Card shows `+2 more needed` badge in amber. Recipe with 0 missing shows no badge.

**Check:** Badge renders below matched ingredients, before "Cook This" button.

---

### 6. Hero card shows missing-ingredient context

**Setup:** Tonight's Hero recipe has 1 missing ingredient.

**Expected:** Hero card displays "Needs 1 more ingredient not in your pantry" below the ingredient badges.

---

### 7. Score tie-breaking (same score)

**Setup:** Two recipes score identically (e.g., both score 8). Recipe A has `missedIngredientCount=0`, Recipe B has `missedIngredientCount=2`.

**Expected:** A and B are adjacent. Sort is stable (keeps API order) for equal scores — no secondary sort needed beyond the formula.

---

### 8. Loading state shows skeletons

**Setup:** Dashboard mounts, recipes are being fetched.

**Expected:** 3 skeleton cards render. `heroRecipe` is `null` (hero card hidden).

**Check:** After the main fetch completes, hero card appears if any recipe matched a red item. If not, hero card stays hidden through the additional `heroRecipesLoading` window (see test 4) until the fallback call resolves.

---

### 9. `ignorePantry: true` still active

**Setup:** Recipe needs "salt" and "olive oil" — user doesn't have them but they're common staples.

**Expected:** These do not appear in `missedIngredients` (Spoonacular excludes them). `missedIngredientCount` stays 0 for this recipe. Score not penalized.

**Check:** In network tab, `ignorePantry=true` is in the Spoonacular request.

---

### 10. No regression: pantry actions unaffected

**Setup:** Add item, mark used, mark wasted.

**Expected:** PantryGrid, PantryCard, AddItemModal, ExpiryAlertStrip, SavingsWidget all behave identically to before.

---

## Manual Test Steps

1. Add 4−5 diverse items to pantry, setting at least 2 expiry dates to today (red).
2. Navigate to dashboard. Confirm hero card shows a recipe using one of the red items.
3. Confirm hero card shows `Needs N more ingredient(s)` if applicable.
4. Scroll to recipe panel. Confirm recipes sorted: those needing fewest extra items at top.
5. Confirm `+N more needed` badges appear on cards with missed ingredients.
6. Remove a red item (mark as used). Confirm hero may change or disappear.
7. On recipes tab, confirm same sort order applies.

## Edge Cases

| Case | Expected |
|------|----------|
| All recipes have negative scores | Still shown (sorted); hero is null only if neither the main results nor the fallback call (test 4) produce a red match |
| Only 1 recipe returned | Scored list has 1 entry, hero card if red match |
| Rapid add/remove of items | Recipe fetch debounced via `allItemNamesKey`, cancelled flag prevents stale data |
| Spoonacular returns empty array | Empty state message: "No recipe suggestions found" |
| Network error during fetch | Empty state message, no crash |
| Recipe matches 0 pantry items but 0 missed | Score = 0 − 0 = 0. Shown but at bottom |
| Fallback call itself errors or times out | Same failure handling as the main fetch — returns `[]`, `heroRecipes` stays empty, hero falls back to `null` rather than throwing |

## Build Verification

```bash
npm run build
```

Confirm no TypeScript errors in:
- `src/components/spoiler/SpoilerDashboard.tsx`
- `src/components/spoiler/RecipeSuggestionsPanel.tsx`
- `src/components/spoiler/TonightsHeroCard.tsx`
- `src/types/pantry.ts`
- `src/lib/recipes.ts`
