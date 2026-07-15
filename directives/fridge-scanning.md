# Fridge Scanning Feature — Working Directive

This document describes how the fridge scanning feature *will* work once built. It is the authoritative reference for anyone touching fridge scanning-related code. Read this before writing a line.

---

## 0. Status

**Not started. Post-MVP.** `CLAUDE.md` and `README.md` both explicitly list the fridge scanner as post-launch scope, under "Never build post-MVP features." This directive exists so the plan is ready when the feature is unblocked — it is not an instruction to start building. If you've been asked to implement this, confirm with the user first that MVP scope has actually expanded; do not treat the existence of this file as authorization.

Two decisions below (a schema addition and a paid/infra API choice) also require explicit user sign-off per `CLAUDE.md`'s "When to ask vs. when to proceed" rules, independent of the post-MVP gate.

---

## 1. Overview

### Purpose
The fridge scanning feature lets a user point a camera at their fridge and have the app (a) recognize which tracked pantry items are visible and check them for visible spoilage that predates their computed `expiry_date`, and (b) surface items it doesn't recognize so the user can quick-add them to `pantry_items` — all without typing.

Scanning is a **capture and confirmation** tool, not an autonomous inventory manager. It never writes or mutates `pantry_items` without the user confirming — this is consistent with the rest of the app (e.g. `addPantryItem` is always user-initiated).

### Where this fits relative to existing features
- `directives/pantry-feature.md` owns `pantry_items` and all shelf-life logic (`src/lib/shelf-life.ts`). Scanning is a new *input source* into that same table — it does not introduce a parallel data model.
- Expiry tracking already works (`expiry_date`, `getUrgency`, urgency tiers). Scanning's spoilage check is a *supplement* to that, not a replacement — vision catches the case where an item spoils earlier than its estimated shelf life (mostly produce), not a general substitute for date tracking.
- `TonightsHeroCard` / recipe suggestions are untouched — scanning only affects what's in `pantry_items`, which recipe matching already reads from.

---

## 2. Schema note — real vs. described

`CLAUDE.md` describes an `inventory_items` table with a `source` column whose enum already includes `'scanner'`. **That table does not exist.** The real, implemented table per `pantry-feature.md` is `public.pantry_items`, and it has no `source` column at all.

This plan targets the real schema. Two consequences:

- Writing scanner-originated items reuses the existing `pantry_items` insert path (`addPantryItem` or a sibling action), not a new table.
- Distinguishing "added by scanner" from "added by hand" requires a new nullable `source text` column on `pantry_items` (values: `manual`, `scanner` — extend later if barcode/receipt ship). **This is a schema change and requires user confirmation before migration**, per `CLAUDE.md`. Until approved, scanner-added items are indistinguishable from manually-added ones — acceptable for a v1, but should be called out in the PR.
- Someone should reconcile `CLAUDE.md`'s schema description with reality independent of this feature — not in scope here, but flagging it since it will confuse the next person who reads `CLAUDE.md` first.

---

## 3. Architecture

### 3.1 Pipeline

```
Camera capture (browser)
   → Item detection (YOLO, fine-tuned)
   → Match detections against user's active pantry_items (by name)
        ├─ Matched item, category = Produce → visual freshness check (server-side)
        │     → flags item as "check me" if classifier confidence exceeds threshold
        │     → does NOT auto-change `status`; surfaces as a UI flag only
        ├─ Matched item, category ≠ Produce → no visual check (see §3.4); expiry_date remains sole signal
        └─ Unmatched detection → shown in "Add these?" tray → user confirms → addPantryItem-style insert
```

### 3.2 Detection — item identification

- YOLOv8/v11 fine-tuned on public fridge/grocery datasets (e.g. Roboflow Universe fridge-object sets, Open Images grocery subset). No custom labeling effort planned for v1 — public datasets only, per decision above.
- **Open question, needs a decision before implementation:** Spoiler Alert is a Next.js *web app* with no native mobile shell. "Runs on-device" for a web app means one of:
  - (A) True client-side inference in the browser via `onnxruntime-web` or TF.js/WASM — real-time, no network round-trip, but adds a non-trivial model payload to the client bundle and browser compute variance across devices.
  - (B) Capture the frame client-side, send it to a server action / API route for YOLO inference too — simpler infra (one inference path instead of two), but loses the "on-device, real-time" property entirely, and every scan becomes a network call.
  - This directive assumes (A) is the intent based on prior discussion, but it has **not been decided against this codebase's actual constraints** and should be confirmed before work starts. If (A), a `src/lib/scanner.ts` client module analogous to `src/lib/recipes.ts` should hold the inference logic, kept out of server-only files.
- Output category classes from the detector must map to the app's 8 `FoodCategory` values (`Produce`, `Dairy`, `Meat`, `Pantry Staples`, `Bakery`, `Frozen`, `Beverages`, `Other`) defined in `src/types/pantry.ts`. This mapping table doesn't exist yet and needs to be built as part of implementation — do not assume the dataset's native class names line up with these 8.

### 3.3 Matching detections to existing pantry_items

- Matching should reuse the same normalization approach as `getShelfLife` in `src/lib/shelf-life.ts` (lowercase, trim, substring match) rather than inventing a second matching algorithm — consistency matters here since `shelf-life.ts` already documents known false-positive risk (e.g. "rice" / "licorice") that a second implementation would silently reintroduce.
- Match scope: only the requesting user's `status = 'active'` items (same scope as `getPantryItems`). Never match or expose another user's items — this needs an explicit `user_id` filter, mirroring the ownership-check gap already flagged as a known bug in `markItemUsed`/`markItemWasted` (§6 of `pantry-feature.md`). Do not repeat that bug here.

### 3.4 Spoilage assessment — server-side

- **Primary signal stays `expiry_date`.** It already works, already drives urgency tiers, and is the correct source of truth for packaged goods where visual spoilage cues aren't reliable (sealed dairy, meat) or aren't visible at all through packaging.
- **Secondary signal: visual freshness check, scoped to `Produce` only for v1.** Cropped detections for items categorized `Produce` are sent server-side to a classifier fine-tuned on a public fresh/rotten dataset (e.g. Kaggle's fresh-vs-rotten produce sets). This scoping is intentional — visual spoilage classifiers don't generalize across food types (mold on bread looks nothing like a soft, browning banana), and packaged/opaque items can't be assessed visually at all regardless of category. Expanding beyond Produce is a future decision, not v1 scope.
- A flagged item does **not** automatically transition `status` to `wasted`. `pantry-feature.md` already flags that `markItemWasted` has no idempotency guard and writes an unconditional `food_logs` row — an automated vision flag triggering that same path would inflate waste stats on every scan and needs its own idempotency handling regardless. For v1, a visual flag is a UI-only "worth checking" indicator; the user still confirms via the existing Used/Wasted actions.
- **Infra/cost decision needed before implementation:** running a classifier server-side implies either a self-hosted model or a third-party vision API call. `CLAUDE.md`'s tech stack section has no ML/vision service listed today, and `CLAUDE.md`'s own rule requires asking before any task "involves a paid API call that could incur unexpected costs." Whatever is chosen should be added to `CLAUDE.md`'s tech stack reference once decided, the same way Spoonacular and Polar are documented there.

### 3.5 Unmatched items → quick-add

- Detections with no match against active `pantry_items` are shown in a review tray, not auto-inserted.
- On confirmation, the write should reuse `addPantryItem`'s conventions: `category` from the detector's mapped class, `storage_zone` presumably defaulted to `'fridge'` (scan context), `opened` left to user input since it can't be reliably inferred visually, and `expiry_date` computed via the existing `getShelfLife(itemName, category, storageZone, opened)` — **not** via a new barcode/product lookup, since no such lookup exists yet (see §5).
- `estimated_cost` follows the existing `CATEGORY_COSTS` lookup at insert time, same as manual add.

---

## 4. Server Actions (planned)

Following the pattern in `src/app/pantry-actions.ts`:

| Action | Purpose | Notes |
|---|---|---|
| `matchScannedItems(userId, detections)` | Cross-references detected item names against the user's active `pantry_items` | Must scope by `user_id`; reuse `shelf-life.ts` normalization for matching |
| `checkVisualFreshness(cropImages)` | Sends Produce-category crops to the server-side classifier | Server-only; classifier client (if third-party) must not be importable client-side, mirroring the `SPOONACULAR_API_KEY` isolation rule |
| `addScannedItem(formData)` | Confirms one unmatched detection into `pantry_items` | Should share logic with `addPantryItem` rather than duplicate it — check for existing tools first, per `CLAUDE.md` |

No action here should be added until directive review confirms scope, per "Read before writing."

---

## 5. Explicitly out of scope for v1

- Barcode/receipt-based expiration lookup. Not built (`pantry-feature.md` confirms the barcode button is a UI no-op). Do not assume it as a data source until it ships as its own feature.
- Visual spoilage checks for non-Produce categories (Dairy, Meat, etc.) — packaging makes this unreliable; expiry_date remains sole signal for these.
- Any automatic mutation of `status` on `pantry_items` based on a vision result.
- Quantity handling — `pantry-feature.md` already notes quantity isn't modeled at all (one row = one unit); scanning multiple of the same item will hit that same gap and is not fixed by this feature.

---

## 6. Profile-mode considerations

Per `CLAUDE.md`'s non-negotiable rule, family vs. performance mode framing must not leak. Scanning results themselves are mode-agnostic (an item is an item), but any UI copy surfacing scan results (e.g. "3 items need checking") must route through the same `profile_type`-gated component pattern used elsewhere — no macro/efficiency framing in family mode, no savings/environmental framing in performance mode.

---

## 7. Open decisions before implementation starts

These need explicit answers, not assumptions, before this moves out of planning:

1. **In-browser vs. server-side detection** (§3.2) — the "on-device" assumption predates confirming this is a web-only Next.js app.
2. **New `source` column on `pantry_items`** (§2) — schema change, needs sign-off.
3. **Vision classifier hosting choice and cost** (§3.4) — needs a tech stack decision and, if paid, explicit approval per `CLAUDE.md`.
4. **Category-to-class mapping table** (§3.2) — needs to be built and reviewed; false mappings would misfile items into the wrong `FoodCategory`, which cascades into wrong `estimated_cost` and wrong shelf-life defaults.

---

## 8. What's Missing

- The detector-to-`FoodCategory` mapping table (does not exist yet).
- A decision on classifier hosting/infra.
- The `source` column migration, if approved.
- UI spec for the review tray and "check me" flag — not designed yet, only the data flow above.
