# Spoiler Alert — Project Context for Claude

## What This App Is

Spoiler Alert is a food waste tracking SaaS. Users add items to a virtual pantry, get expiry date estimates automatically, see recipe suggestions based on what's about to expire, and track how much food (and money) they've saved vs. wasted.

Stack: Next.js 15 App Router, Supabase (Postgres + Auth), TypeScript, Tailwind CSS, Polar (payments), Spoonacular (recipes), Sonner (toasts).

---

## Environment Variables in Use

All variables must be in `.env.local` locally. See `.env.example` for the full list with comments.

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase project Settings → API |
| `POLAR_ACCESS_TOKEN` | Yes (for payments) | Polar dashboard → Settings → API |
| `POLAR_WEBHOOK_SECRET` | Yes (for webhooks) | Polar dashboard → Webhooks |
| `NEXT_PUBLIC_REQUIRE_SUBSCRIPTION` | No | Set to `false` in dev to bypass subscription gate |
| `SPOONACULAR_API_KEY` | No (degrades gracefully) | spoonacular.com/food-api → Console |

---

## Database Schema

Two tables. Both are in `supabase/migrations/`.

### `public.pantry_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `user_id` | `text` | Auth user ID. Not a FK — no cascade on user delete |
| `name` | `text` | Free-text, entered by user |
| `category` | `text` | One of 8 `FoodCategory` values |
| `purchase_date` | `date` | Nullable |
| `expiry_date` | `date` | Required |
| `status` | `text` | `active` / `used` / `wasted` |
| `estimated_cost` | `numeric(10,2)` | Set at insert from `CATEGORY_COSTS`, never updated |
| `storage_zone` | `text` | `fridge` / `freezer` / `pantry`. Nullable (pre-migration rows are null) |
| `opened` | `boolean` | Default false. Affects shelf-life estimate |
| `created_at` | `timestamptz` | Set at insert |
| `updated_at` | `timestamptz` | Set manually in update calls — no DB trigger |

**No RLS policies on this table.** Data isolation is app-layer only.

### `public.food_logs`

Append-only event log for savings tracking. Written when items are marked used or wasted. Never updated.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `text` | Auth user ID |
| `item_id` | `uuid` | FK → `pantry_items.id`, SET NULL on delete |
| `item_name` | `text` | Name snapshot at log time |
| `category` | `text` | Category snapshot at log time |
| `action` | `text` | `used` or `wasted` |
| `savings_amount` | `numeric(10,2)` | `estimated_cost` for used, `0` for wasted |
| `logged_at` | `timestamptz` | Set at insert |

**No RLS on this table either.**

---

## Server Actions

All DB access goes through server actions. Never call Supabase directly from components.

| File | Exports |
|---|---|
| `src/app/pantry-actions.ts` | `getPantryItems`, `addPantryItem`, `markItemUsed`, `markItemWasted`, `getExpiringItems`, `getSavingsStats` |
| `src/app/recipe-actions.ts` | `fetchRecipeSuggestions` (server-action wrapper for Spoonacular) |
| `src/app/actions.ts` | `checkoutSessionAction`, `manageSubscriptionAction` (Polar) |

### Key edge cases in pantry-actions.ts

- `markItemUsed` and `markItemWasted` do **not** verify ownership. Fetch is `.eq('id', itemId)` with no user check — a known security gap.
- Both mark functions do three sequential writes (fetch → update → insert log). Not wrapped in a transaction. If the log insert fails, the item is already marked used/wasted with no rollback.
- No idempotency guard — calling twice creates two log rows and double-counts savings.
- `getSavingsStats` pulls all logs for a user with no SQL date filter — computes entirely in JS.

---

## Shelf-Life Engine — `src/lib/shelf-life.ts`

Static USDA FoodKeeper lookup. No imports, no side effects. Safe to import anywhere.

**Exports:**
- `StorageZone` — `'fridge' | 'freezer' | 'pantry'`
- `FOOD_SUGGESTIONS` — `readonly string[]` of all 90+ food names from the data, title-cased, sorted. Used as autocomplete source in `AddItemModal`.
- `getShelfLife(itemName, category, storageZone, opened): number` — returns days until expiry (always ≥ 1).

**Lookup order:**
1. Case-insensitive substring match against `names[]` arrays in `SHELF_LIFE_DATA`.
2. If matched zone value is 0 (not recommended for that zone), falls through to category default.
3. If no name match, uses `CATEGORY_DEFAULTS[category][storageZone]`.

**Data:** 38 named entries + category fallbacks. Values are USDA midpoints — estimates only, not label dates.

---

## Spoonacular Integration — `src/lib/recipes.ts` + `src/app/recipe-actions.ts`

Server-only. The API key must never reach the client bundle.

- **Endpoint:** `GET /recipes/findByIngredients?ingredients=...&number=6&ranking=1&ignorePantry=false`
- **Cache:** Module-level `Map` with 1-hour TTL. Cache key = sorted, lowercased ingredient names joined by comma.
- **Free tier:** 150 points/day. Each call for 6 results costs 6 points = 25 triggers/day max.
- **Steps/cook time:** Not returned by `findByIngredients`. Always empty/`'—'`. Recipe links go to Spoonacular site.
- **On missing key or API error:** Returns `[]` gracefully — no crash, recipe panel simply hides.

The `fetchRecipeSuggestions` server action in `recipe-actions.ts` is the only entry point for client code.

---

## Urgency Tiers

Every expiry date maps to one of four levels via `getUrgency()` in `src/types/pantry.ts`.

| Level | Condition | UI treatment |
|---|---|---|
| `expired` | `daysLeft < 0` | Dark red, static dot, strikethrough in alert strip |
| `red` | `daysLeft 0–1` | Bright red, pulsing dot, eligible for Tonight's Hero |
| `amber` | `daysLeft 2–3` | Amber, pulsing dot, shown in alert strip |
| `green` | `daysLeft 4+` | Teal, no dot, not shown in alert strip |

Always call `getUrgency(item.expiry_date)` — never compute days directly in components.

---

## Key Component Behaviors

### AddItemModal
- Typeahead autocomplete on name input: suggestions come from `FOOD_SUGGESTIONS` in shelf-life.ts. Starts-with matches ranked above contains matches, max 6 shown. Keyboard navigable (↑↓ Enter Esc). Click selects.
- Auto-fills expiry date via `getShelfLife()` whenever name ≥ 3 chars, category, storageZone, or opened changes. Shows "auto-suggested" label.
- Barcode scan button exists but is a no-op (placeholder for future feature).
- On submit error: logs to console but shows no UI error to the user.

### SpoilerDashboard
- Owns `items`, `expiringItems`, `recipes`, `savings` state.
- `expiringItems` is initialized from server-fetched `initialExpiringItems` (result of `getExpiringItems(userId, 3)`) and updated client-side on add/used/wasted.
- Recipe fetch runs in a `useEffect` gated on `expiringNamesKey` — a memoized stable string to avoid infinite loops.
- `redItems` = `expiringItems` filtered to level `'red'`. `heroRecipe` = best scoring recipe against red item names. Both are `useMemo`.

### TonightsHeroCard
- Only renders on dashboard tab when there are red-tier items AND at least one recipe with `bestScore > 0` (at least one matched ingredient).
- Not an extra API call — derives from already-fetched `recipes` state.

---

## Development Flags

- `NEXT_PUBLIC_REQUIRE_SUBSCRIPTION=false` — bypasses the Polar subscription check in `dashboard/page.tsx`. Set this in dev so you can use the dashboard without a Polar account.
- `SPOONACULAR_API_KEY=` (blank) — disables recipe fetching entirely. App falls back gracefully.

---

## Known Gaps (Post-MVP)

**Security (must fix before real users):**
- Add RLS policies on `pantry_items` and `food_logs`.
- Add `.eq('user_id', userId)` ownership check to `markItemUsed` and `markItemWasted`.

**Data integrity:**
- Wrap mark-used/wasted in a Postgres transaction or RPC.
- Add idempotency check (`status !== 'active'`) before marking.

**Missing features:**
- Edit item (no mutation exists for updating name/category/dates).
- Delete item (no way to remove a phantom item without polluting logs).
- Free plan item limit enforcement (10 items — not checked server-side).
- Expiry notifications (email/push when items approach expiry).
- Persistent recipe cache (Redis / Vercel KV — current in-memory cache dies on deploy).
- Barcode scanning.
- Quantity tracking.
