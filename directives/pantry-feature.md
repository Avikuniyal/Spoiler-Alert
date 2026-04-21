# Pantry Feature — Working Directive

This document describes how the pantry/inventory feature works today. It is the authoritative reference for anyone touching pantry-related code. Read this before writing a line.

---

## 1. Database Schema

There are two tables that own pantry data. Both live in `supabase/migrations/20240601_spoiler_alert.sql`.

### `public.pantry_items`

The source of truth for what food a user currently has.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `user_id` | `text` | no | — | Auth user ID. **Not a foreign key** — orphans silently if user is deleted |
| `name` | `text` | no | — | Free-text item name entered by the user |
| `category` | `text` | no | `'Other'` | Must match one of the 8 `FoodCategory` values (see types below) |
| `purchase_date` | `date` | yes | `null` | Optional. Date the item was bought |
| `expiry_date` | `date` | no | — | Required. The date this item expires |
| `status` | `text` | no | `'active'` | One of: `active`, `used`, `wasted` |
| `estimated_cost` | `numeric(10,2)` | yes | `0` | Set at insert time from `CATEGORY_COSTS` lookup. Never updated after insert |
| `storage_zone` | `text` | yes | `null` | Where item is stored: `fridge`, `freezer`, or `pantry`. Nullable — rows before migration have null |
| `opened` | `boolean` | yes | `false` | Whether the package has been opened. Affects shelf-life estimate |
| `created_at` | `timestamptz` | no | now() (UTC) | Set at insert, never changed |
| `updated_at` | `timestamptz` | no | now() (UTC) | Manually set by update functions. No DB trigger |

**Indexes:** `user_id`, `status`

**Important:** There are no Row Level Security (RLS) policies on this table. Data isolation is enforced only at the application layer.

---

### `public.food_logs`

An append-only event log. Every time an item is marked used or wasted, a row lands here. This table drives all savings calculations — it is never updated, only inserted.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | no | `gen_random_uuid()` | Primary key |
| `user_id` | `text` | no | — | Auth user ID. Not a FK |
| `item_id` | `uuid` | yes | — | FK → `pantry_items.id`. Set to `null` on item delete |
| `item_name` | `text` | no | — | Snapshot of the item name at log time |
| `category` | `text` | no | — | Snapshot of the item category at log time |
| `action` | `text` | no | — | Either `'used'` or `'wasted'` |
| `savings_amount` | `numeric(10,2)` | yes | `0` | Dollar value saved. Equals `estimated_cost` for `used`, `0` for `wasted` |
| `logged_at` | `timestamptz` | no | now() (UTC) | Timestamp of the action |

**Indexes:** `user_id`, `action`

**Important:** No RLS on this table either.

---

### Urgency tiers (`src/types/pantry.ts` — `getUrgency`)

Every pantry item's expiry date is classified into one of four tiers. These tiers drive all visual states: card border colors, alert strip styles, `TonightsHeroCard` eligibility.

| Level | Days left | Label examples | Visual treatment |
|-------|-----------|---------------|-----------------|
| `expired` | < 0 | "Expired" | Dark muted red border, strikethrough name in strip, static dot |
| `red` | 0–1 | "Expires today", "Expires tomorrow" | Bright red border, pulsing dot |
| `amber` | 2–3 | "2 days left", "3 days left" | Amber border, pulsing dot |
| `green` | 4+ | "7 days left" | Teal border, no dot — not shown in alert strip |

The function returns `{ level, daysLeft, label }`. All components derive urgency by calling `getUrgency(item.expiry_date)` — never by computing days themselves.

---

### Category constants (`src/types/pantry.ts`)

The 8 valid categories and their flat-rate cost estimates used for savings math:

| Category | Cost estimate | Icon |
|----------|--------------|------|
| Produce | $3.50 | 🥦 |
| Dairy | $5.00 | 🥛 |
| Meat | $8.00 | 🥩 |
| Pantry Staples | $4.00 | 🥫 |
| Bakery | $3.00 | 🍞 |
| Frozen | $6.00 | 🧊 |
| Beverages | $4.50 | 🧃 |
| Other | $4.00 | 🥡 |

---

## 2. Server Actions — `src/app/pantry-actions.ts`

All database writes and reads go through these server actions. They run on the server (Next.js App Router `'use server'`). Do not call Supabase directly from components.

---

### `getExpiringItems(userId: string, daysAhead: number)`

**What it does:** Returns all active items whose `expiry_date` falls on or before today + `daysAhead`. Sorted by expiry ascending. Includes items that are already past their expiry date (no lower bound on the query) — these are the most urgent cases.

**Input:** `userId`, `daysAhead` — e.g. `3` to get everything expiring within 3 days including already-expired.

**Output:** `PantryItem[]`. Throws on DB error.

**SQL equivalent:**
```sql
SELECT * FROM pantry_items
WHERE user_id = $1
  AND status = 'active'
  AND expiry_date <= CURRENT_DATE + $2
ORDER BY expiry_date ASC;
```

**When it's called:** Once during server-side dashboard page render (in Promise.all alongside `getPantryItems` and `getSavingsStats`). Result is passed as `initialExpiringItems` prop to `SpoilerDashboard`.

**Primary use cases:**
- Initial data for `ExpiryAlertStrip` on dashboard load
- Foundation for future scheduled notifications (daily cron job calling this per user)
- Input to `TonightsHeroCard` (filtered to red tier client-side)

---

### `getPantryItems(userId: string)`

**What it does:** Returns all items for a user that still have `status = 'active'`, ordered by expiry date ascending (soonest first).

**Input:** `userId` — the Supabase auth user ID string.

**Output:** `PantryItem[]` — the raw rows from `pantry_items`. Throws on DB error (not caught — will crash the caller if not handled).

**When it runs:** Called once on the server during `dashboard/page.tsx` initial load, then client state takes over. Not called again unless the page is refreshed.

**Edge case:** If the DB call fails, the error propagates up to `dashboard/page.tsx` where it is caught in a try/catch and silently falls back to an empty array.

---

### `addPantryItem(formData)`

**What it does:** Inserts a new row into `pantry_items` with `status = 'active'`. Calculates `estimated_cost` from the `CATEGORY_COSTS` lookup table at insert time.

**Input object:**
```ts
{
  userId: string;          // required
  name: string;            // required, should be trimmed before passing
  category: FoodCategory;  // required, one of the 8 valid values
  purchaseDate?: string;   // optional, ISO date string (YYYY-MM-DD)
  expiryDate: string;      // required, ISO date string (YYYY-MM-DD)
  storageZone?: 'fridge' | 'freezer' | 'pantry'; // optional, stored as-is
  opened?: boolean;        // optional, defaults to false
}
```

**Output:** The newly inserted `PantryItem` row (single object, not an array). Throws on DB error.

**Side effect:** Calls `revalidatePath('/dashboard')` to bust the Next.js cache.

**Edge cases:**
- Accepts past expiry dates. No server-side guard against adding an item that is already expired.
- Category defaults to `4.0` if somehow an unknown category slips through (`CATEGORY_COSTS[formData.category] || 4.0`).
- No duplicate detection. You can add "Milk" ten times.
- No item count limit enforced here (the Free plan's "10 item limit" is not checked at this layer).

---

### `markItemUsed(itemId: string, userId: string)`

**What it does:** Marks an item as used and records the savings. Runs as two sequential DB operations: update the item, then insert a log row.

**Input:** `itemId` — the UUID of the pantry item. `userId` — the auth user ID.

**Output:** The `PantryItem` row as it was **before** the update (fetched first, then updated). The returned object will have `status: 'active'`, not `'used'`. This is a known quirk — the dashboard discards the return value and manages state client-side.

**What gets written to `food_logs`:**
- `action: 'used'`
- `savings_amount`: the item's `estimated_cost`
- Snapshot of `item_name` and `category`

**Side effects:** `revalidatePath('/dashboard')`, `updated_at` manually set to now.

**Edge cases:**
- Does not check `userId` ownership when fetching the item. Fetches by `itemId` alone. Any authenticated caller who knows the UUID can mark any item used.
- Does not check if the item is already `used` or `wasted`. Calling this twice will create two `food_logs` rows, double-counting savings.
- If the update succeeds but the log insert fails, the item is marked used but no savings are recorded. These two writes are not wrapped in a transaction.

---

### `markItemWasted(itemId: string, userId: string)`

**What it does:** Same flow as `markItemUsed` but sets `status = 'wasted'` and logs `savings_amount = 0`.

**Input/Output:** Identical structure to `markItemUsed`.

**What gets written to `food_logs`:**
- `action: 'wasted'`
- `savings_amount: 0`

**Edge cases:** Same ownership and double-call issues as `markItemUsed`. Same non-atomic write issue.

---

### `getSavingsStats(userId: string)`

**What it does:** Fetches all `food_logs` rows for a user and computes savings metrics in JavaScript.

**Input:** `userId`

**Output object:**
```ts
{
  totalSaved: number;    // sum of savings_amount for all 'used' logs, all time
  totalUsed: number;     // count of 'used' log entries
  totalWasted: number;   // count of 'wasted' log entries
  monthSaved: number;    // sum of savings_amount for 'used' logs in the current calendar month
  sparklineData: Array<{ day: number; value: number }>; // 7 entries, one per day, last 7 days
}
```

**Edge cases:**
- Fetches **all logs for the user with no limit**. Will get slower as a user accumulates history. There is no pagination or date-range filter at the SQL level.
- `monthSaved` resets to 0 on the first of each calendar month — this is correct behavior, not a bug.
- `sparklineData` is always exactly 7 entries (indices 0–6, representing today minus 6 days through today). Days with no activity return `value: 0`.
- Throws on DB error (not caught internally).

---

## 3. UI Components

### `PantryGrid` — `src/components/spoiler/PantryGrid.tsx`

**What it is:** The full pantry view. Contains filter pills, a sort dropdown, an Add Item button, and the grid of cards.

**Props:**
```ts
{
  items: PantryItem[];       // all active pantry items for the user
  onUsed: (id: string) => void;    // called when user clicks "Used" on a card
  onWasted: (id: string) => void;  // called when user clicks "Wasted" on a card
  onAddItem: () => void;           // called when user clicks "Add Item" button
}
```

**What it renders:**
- A header row with a sort `<select>` (Expiry / Name / Category) and an Add Item button
- Category filter pills — only categories that have at least one item in the list are shown. "All" is always shown with total count.
- A responsive grid of `PantryCard` components (1 col → 2 col → 3 col → 4 col at `xl`)
- An empty state with a CTA button if the filtered list is empty

**Local state it owns:**
- `activeCategory`: which category filter is active (defaults to `'All'`)
- `sortBy`: current sort (defaults to `'expiry'`)

**Important behavior:** Filtering and sorting happen entirely in this component, in memory. It does not fetch data. It operates on whatever `items` array is passed in.

**Edge case:** If a user filters to a specific category (e.g., "Dairy") and then marks the last dairy item as used, the filter pill for "Dairy" disappears from the UI but `activeCategory` stays `'Dairy'`. The grid shows empty with no obvious reset. The user can click "All" to recover.

---

### `PantryCard` — `src/components/spoiler/PantryCard.tsx`

**What it is:** A single item card. Handles its own exit animation before bubbling the action up.

**Props:**
```ts
{
  item: PantryItem;
  onUsed: (id: string) => void;
  onWasted: (id: string) => void;
  style?: React.CSSProperties;  // used for animation delay (passed by PantryGrid)
}
```

**What it renders:**
- A colored left border (red/amber/teal) based on urgency
- Item emoji icon (from `CATEGORY_ICONS`)
- Item name and category
- Urgency badge (e.g., "2 days left", "Expired", "14 days left") with a pulsing dot for red/amber
- Purchase date if present
- "Used" and "Wasted" action buttons

**Urgency logic** (from `getUrgency()` in `src/types/pantry.ts`):
- `daysLeft < 0` → expired ("Expired") — muted dark red, static dot, strikethrough in strip
- `daysLeft 0–1` → red ("Expires today" / "Expires tomorrow") — bright red, pulsing dot
- `daysLeft 2–3` → amber ("X days left") — amber, pulsing dot
- `daysLeft 4+` → green ("X days left") — teal, no dot

**Action flow:** When a button is clicked, the card sets local `isExiting: true` (which applies a CSS exit animation class), then waits 200ms before calling `onUsed` or `onWasted`. The animation classes `card-enter` and `card-exit` must be defined in global CSS for this to work visually.

**Edge case:** The card manages its own exit state locally. If `onUsed`/`onWasted` throws, the card has already begun animating but the error is swallowed — the item won't visually reappear.

---

### `AddItemModal` — `src/components/spoiler/AddItemModal.tsx`

**What it is:** A full-screen modal form for adding a new pantry item. Manages its own form state and validation. Includes a shelf-life auto-fill engine to pre-populate the expiry date.

**Props:**
```ts
{
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: FoodCategory;
    purchaseDate?: string;   // YYYY-MM-DD or undefined
    expiryDate: string;      // YYYY-MM-DD
    storageZone: 'fridge' | 'freezer' | 'pantry';
    opened: boolean;
  }) => Promise<void>;
}
```

**What it renders:**
- A backdrop (`bg-black/80 blur`) that closes the modal on click
- Food name text input with typeahead autocomplete (see below) and a non-functional barcode scan button (placeholder, does nothing)
- Category selector as pill buttons (one of 8 categories, defaults to "Produce")
- Storage zone selector as three buttons: Fridge / Freezer / Pantry (defaults to Fridge)
- "Already opened" toggle (affects shelf-life auto-fill; defaults to off)
- Purchase date input (optional)
- Expiry date input — auto-filled by `getShelfLife`, editable. Shows "auto-suggested" label when auto-filled.
- Cancel and "Add Item" buttons

**Typeahead autocomplete:**
- Suggestions come from `FOOD_SUGGESTIONS` exported by `src/lib/shelf-life.ts` — all food names in the shelf-life database, title-cased and sorted.
- Filtered as the user types: starts-with matches ranked above contains matches, capped at 6 results.
- The matched substring is bolded in each suggestion.
- Keyboard navigable: ↑↓ moves the cursor, Enter selects the active suggestion, Escape closes the dropdown.
- Click to select: uses `onMouseDown` + `e.preventDefault()` to prevent the input's `onBlur` from firing before the click registers. A 120ms `setTimeout` on `onBlur` provides a secondary guard.
- The dropdown renders inline in the form (not absolutely positioned) to avoid being clipped by the modal's `overflow-hidden` container.
- Selecting a suggestion triggers the expiry auto-fill effect immediately.

**Auto-fill behavior:**
- A `useEffect` fires whenever `name`, `category`, `storageZone`, or `opened` changes.
- Requires `name.trim().length >= 3` before firing (avoids spurious matches on partial input).
- Calls `getShelfLife(name, category, storageZone, opened)` from `src/lib/shelf-life.ts`.
- Sets `expiryDate` to today + returned days, formatted as `YYYY-MM-DD`.
- Sets `expiryAutoFilled = true` so the "auto-suggested" label appears.
- If the user types directly into the expiry date field, `expiryAutoFilled` is reset to `false`.
- If name/category/zone/opened change again after a manual override, auto-fill runs again (intentional — new inputs = new suggestion).

**Validation (client-side only):**
- Name must not be blank
- Expiry date must be present
- If both dates are provided, expiry must be on or after purchase date
- Auto-fill clears any stale expiry validation error when it fires

**Submission flow:**
1. Validates form
2. Calls `onSubmit()` with all fields including `storageZone` and `opened`
3. On success: calls `onClose()` to dismiss
4. On error: logs to console, does not show the user an error message
5. Shows "Adding..." on the submit button while pending

**Edge case:** If `onSubmit` rejects, the modal stays open but the user sees no error message — only a console log. This is a gap.

---

### `ExpiryAlertStrip` — `src/components/spoiler/ExpiryAlertStrip.tsx`

**What it is:** Horizontal scrollable strip showing items from `getExpiringItems(userId, 3)` — expired, red, and amber tier only. Green-tier items never appear here.

**Props:**
```ts
{
  items: PantryItem[]; // pre-filtered: expired + red + amber only
}
```

**What it renders:**
- Header: "⚠ Expiring Soon" or "🚨 Expired & Expiring Soon" (when any item has level `expired`)
- One pill per item, styled by tier:
  - `expired`: dark muted red border, strikethrough item name, static dot
  - `red`: bright red border, pulsing dot
  - `amber`: amber border, pulsing dot
- Returns `null` if `items` is empty

**Data source:** `SpoilerDashboard` maintains an `expiringItems` state initialized from the server-fetched `initialExpiringItems` prop (result of `getExpiringItems(userId, 3)` in `dashboard/page.tsx`). Client-side mutations (used/wasted/added) update this state directly.

---

### `TonightsHeroCard` — `src/components/spoiler/TonightsHeroCard.tsx`

**What it is:** A full-width urgent recipe card shown above the pantry grid when there are red-tier items (expiring today or tomorrow) and at least one matching recipe.

**Props:**
```ts
{
  recipe: Recipe;      // best recipe for red items — derived in SpoilerDashboard
  redItems: PantryItem[]; // items with urgency level 'red'
}
```

**What it renders:**
- "🔥 Cook Tonight" banner label
- Recipe thumbnail (88×88), title, and urgency context ("X expires today/tomorrow")
- Ingredient badges — red if the ingredient matches a red-tier item, muted white otherwise
- "View Recipe" toggle button (red accent)
- Expanded: full ingredient list + steps (or Spoonacular link if steps are empty)

**Hero recipe selection logic (in `SpoilerDashboard`):**
- Filters `recipes` state to find the recipe with the most `matchedIngredients` that correspond to red-tier item names
- Only shows if `bestScore > 0` (at least one matched ingredient from a red item)
- Falls back to `null` (card hidden) if no match or if `recipesLoading` is still true
- No extra API call — derives from the already-fetched `recipes` state

**When it renders:** Only on the dashboard tab, above the 2-column pantry/savings grid. Not shown on the pantry or recipes tabs.

---

## 4. Shelf-Life Lookup Engine — `src/lib/shelf-life.ts`

A static lookup table seeded with USDA FoodKeeper data, exported as a single pure function. This file has no side effects and no imports beyond its own types.

### `StorageZone` type

```ts
export type StorageZone = 'fridge' | 'freezer' | 'pantry';
```

### `getShelfLife(itemName, category, storageZone, opened)`

**What it does:** Returns an estimated number of days until expiry based on item name, storage conditions, and opened status.

**Inputs:**
- `itemName: string` — user-entered name, case-insensitive, will be normalized internally
- `category: string` — one of the FoodCategory values; used as fallback when no name match
- `storageZone: StorageZone` — where the item will be stored
- `opened: boolean` — whether the package is already open

**Output:** `number` — days until expiry, always >= 1.

**Lookup order:**
1. Normalizes `itemName` to lowercase, trimmed.
2. Iterates `SHELF_LIFE_DATA` (ordered specific-first) checking if the normalized name is a substring of any entry alias, or vice versa.
3. If a match is found and the zone value is > 0, returns that value.
4. If the matched zone value is 0 (not recommended for that zone), breaks and falls through to step 5.
5. If no name match, falls through to category default from `CATEGORY_DEFAULTS`.

**Data coverage:** 38 named items across Produce, Dairy, Meat, Pantry Staples, Frozen, and Beverages. Category fallbacks cover: Produce, Dairy, Meat, Seafood, Leftovers, Pantry Staples, Bakery, Frozen, Beverages, Other.

**Limitations of the current lookup:**
- Substring matching is loose. "rice" matches both "white rice" and "licorice" (though licorice is not in the table). Always check for false positives when adding new entries.
- Values are USDA midpoints — not label dates, not actual package expiry. They are estimates for general guidance.
- No fuzzy matching or synonym resolution. "Whole milk" matches the "milk" entry; "dairy milk" does not.
- The data is hardcoded. Updates require editing the source file and redeploying.

---

## 5. Known Limitations and Edge Cases

These are issues in the current code that will cause bugs or security problems as the app scales. They are not hypothetical — they will bite you.

**Security**

- **No Row Level Security on `pantry_items` or `food_logs`.** Any authenticated user making a direct Supabase query (bypassing the app) can read or write any user's data. Add RLS policies before this goes to production.
- **`markItemUsed` and `markItemWasted` do not verify ownership.** The fetch is `eq('id', itemId)` with no `eq('user_id', userId)` check. An attacker who knows an item UUID can mark it used/wasted. Fix: add `.eq('user_id', userId)` to the fetch query.

**Data integrity**

- **Non-atomic multi-step writes.** Both mark functions do: (1) fetch item, (2) update item status, (3) insert food_log. If step 3 fails, the item is marked used/wasted but no savings are recorded. There's no rollback. These should be wrapped in a Postgres function or transaction.
- **No idempotency guard.** Calling `markItemUsed` twice on the same item creates two `food_logs` rows and inflates savings. The item should be checked for `status !== 'active'` before proceeding.
- **`updated_at` has no DB trigger.** It is set manually in update calls. Any future query that updates `pantry_items` directly without setting `updated_at` will leave it stale.
- **`user_id` is `text`, not a UUID FK.** If a user is deleted from Supabase Auth, their pantry rows and food logs remain. No cascade.

**Cost estimation**

- **`estimated_cost` is set once at insert and never updated.** If `CATEGORY_COSTS` values change in code, existing items keep their old cost. The savings number is always based on the cost at the time of item creation.
- **One flat rate per category.** There is no way to record the actual price paid. "Generic chicken" and "premium ribeye" both get $8.00.

**Performance**

- **`getSavingsStats` fetches all logs with no limit.** It pulls every row for a user and filters in JavaScript. For a user with hundreds of logs this is fine; at thousands it becomes slow. There is no date-range filter at the SQL level.

**UI behavior**

- **Stale category filter after last item in category is removed.** Described in PantryGrid section above.
- **`AddItemModal` swallows submit errors silently.** If `addPantryItem` throws, the user sees nothing — the modal just stops spinning.
- **`markItemUsed` returns pre-update data.** The return value has `status: 'active'`. If any future code relies on the return value to confirm the new status, it will get the wrong answer.
- **Past expiry dates are accepted.** You can add an item that expired last week. No server-side guard.
- **No edit flow.** There is no way to correct a typo in a name, change a category, or fix a wrong expiry date. The only actions are Used and Wasted.
- **Barcode scan is a no-op.** The button exists in `AddItemModal` but has no handler beyond a tooltip that says "coming soon".

---

## 6. What's Missing to Complete This Feature

Based on the product design evident in the codebase — expiry tracking, recipe matching, and food waste reduction — here is what is not yet built.

**Core functionality gaps**

- **Edit item.** No mutation exists for updating an existing pantry item's name, category, or dates. A user who enters a wrong expiry date cannot fix it. Every pantry feature should include a basic edit path.
- **Delete item.** There is no way to remove a phantom item (e.g., something added by mistake) without marking it as used or wasted, which pollutes savings stats.
- **Quantity tracking.** Each row represents one "unit" of a food item with no concept of quantity. A user with 6 eggs and 3 apples has to add six rows, not one row with quantity 6.
- **Free plan item limit enforcement.** The pricing page promises a Free plan capped at 10 items. `addPantryItem` does not check how many active items the user has. This gate must be added server-side.

**Reliability gaps**

- **RLS policies** on `pantry_items` and `food_logs` (Supabase migration required).
- **Ownership check** in `markItemUsed` and `markItemWasted` (one-line fix: add `.eq('user_id', userId)` to the item fetch).
- **Atomic writes** for mark-used and mark-wasted flows (requires a Postgres stored procedure or Supabase RPC).
- **Error feedback in `AddItemModal`** when `onSubmit` rejects.

**Product features not yet started**

- **Expiry notifications.** The `ExpiryAlertStrip` shows alerts inside the app, but there is nothing that notifies the user outside the app. A daily cron job checking for items expiring in 1–3 days and sending an email or push notification is needed for the core value proposition to work passively.
- **Barcode scanning.** The UI placeholder exists in `AddItemModal`. Not wired to any camera or barcode lookup API. Most food items have barcodes — this dramatically reduces friction for adding items.
- **Richer recipe data.** `lib/recipes.ts` calls the Spoonacular `findByIngredients` API. This endpoint does not return cooking steps or cook times — a separate `/recipes/{id}/information` call is needed for each recipe. See `directives/recipes-feature.md` for the full constraint breakdown.
- **Household/shared pantry.** The entire data model is single-user. There is no concept of a shared household pantry that multiple family members can contribute to.
- **Export / history view.** Users can see a 7-day sparkline but cannot view their full log history, filter by date range, or export a CSV of what they've saved/wasted.
