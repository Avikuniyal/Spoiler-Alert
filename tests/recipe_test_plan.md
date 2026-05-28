# Recipe Scoring Heuristic — Test Plan

## Summary

All recipes are now scored by a heuristic and sorted high-to-low. Nothing is excluded.

**Scoring formula:** `score = (redMatchCount × 10) + (matchedIngredients.length × 2) − (missedIngredientCount × 5)`

**Tonight's Hero:** the highest-scored recipe with at least one red-tier item match. Falls back to `null` if no recipe matches any red item.

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

### 4. Hero falls back gracefully when no recipe matches red items

**Setup:** User has red-tier `["milk"]`. Spoonacular returns recipes where no ingredient matches "milk".

**Expected:** `heroRecipe` is `null`. Recipe panel shows all scored recipes (none with red match).

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

**Check:** After fetch completes, hero card appears if any recipe matched a red item.

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
| All recipes have negative scores | Still shown (sorted), hero is null if no red match |
| Only 1 recipe returned | Scored list has 1 entry, hero card if red match |
| Rapid add/remove of items | Recipe fetch debounced via `allItemNamesKey`, cancelled flag prevents stale data |
| Spoonacular returns empty array | Empty state message: "No recipe suggestions found" |
| Network error during fetch | Empty state message, no crash |
| Recipe matches 0 pantry items but 0 missed | Score = 0 − 0 = 0. Shown but at bottom |

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
