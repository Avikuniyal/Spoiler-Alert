# CLAUDE.md — Spoiler Alert

This file is your briefing document. Read it at the start of every session before touching any code. It tells you what this project is, how it's structured, how you should think and operate, and what rules are non-negotiable.

---

## What this project is

Spoiler Alert is a household food management web app built with Next.js and Supabase. The core loop: users add food to their pantry/fridge, the app tracks expiry dates using USDA shelf-life data, and when something is about to go bad it surfaces a recipe suggestion (Tonight's Hero) that uses that ingredient first.

The original product plan calls for two user modes set at onboarding and never mixed: **family** mode (speed, kid-friendliness, dollar savings) and **performance** mode (macro tracking, protein utilization, efficiency scores) — see the MVP doc for the full rationale. **This has not been built.** There is no `profile_type` field, no onboarding step for it, and no component in this codebase gates on it. Treat the family/performance split as a planned direction to keep in mind when designing future UI copy and scoring, not as something currently enforced — see "Rules that are never negotiable" below for the corrected status.

The MVP is four features only: inventory + shelf life, Tonight's Hero recipe suggestion, expiry alerts, and savings tracking. Do not build post-MVP features unless explicitly instructed.

---

## The 3-layer architecture you operate within

This project uses a strict 3-layer architecture. Understanding which layer you're in at any moment is the most important thing you can do.

**Layer 1: Directives** are the SOPs that live in `directives/`. They are written in plain language and describe goals, inputs, tools, outputs, and edge cases for specific features. Always check `directives/` before starting any feature work. If a directive exists for what you're building, follow it exactly. If it doesn't exist, ask before proceeding.

**Layer 2: Orchestration** is your job. You read directives, decide which tools and scripts to call and in what order, handle errors, ask for clarification when genuinely ambiguous, and update directives when you learn something new. You are the intelligent glue between intent and execution. You do not freestyle — you follow the directive and escalate when the directive is unclear or wrong.

**Layer 3: Execution** is the deterministic code layer — Next.js server actions in `src/app/actions.ts` and `src/app/pantry-actions.ts`, API routes in `src/app/api/`, and utility functions in `src/lib/`. This is where logic that must be consistent lives. Push complexity here, not into your own reasoning.

The reason for this separation is error compounding. If you try to do everything yourself through reasoning, a 90% accuracy rate across 5 steps produces 59% overall success. Deterministic code doesn't drift. Keep your reasoning focused on routing and decisions; let the code handle the execution.

---

## How to operate in this codebase

**One feature per session.** Scope every session to a single deliverable. "Build the quick-add inventory screen" is correct scope. "Build the app" is not. Announce your scope at the start of each session and confirm it before writing code.

**Read before writing.** At the start of every session, read the relevant directive in `directives/`, the relevant existing components in `src/components/spoiler/`, and the relevant server actions before writing a single line. State what you found.

**Check for existing tools first.** Before writing a new server action, API route, or utility function, check whether one already exists that handles the same thing. Duplicate logic is a maintenance liability.

**Test immediately.** After generating code, confirm it compiles and the relevant behavior works as described. Report the exact error if something fails — do not paraphrase errors.

**Self-anneal when things break.** When something fails: read the error and stack trace, fix the root cause (not the symptom), test again, and then update the relevant directive with what you learned — new API constraints, timing issues, edge cases, whatever caused the break. The system should be stronger after every failure.

**Update directives as you learn, but never overwrite without asking.** Directives are living documents. When you discover something new — an API rate limit, a Supabase quirk, a better approach — add it to the directive. But never delete or replace directive content without confirming with the user first. Directives are the institutional memory of this project.

---

## Tech stack reference

You need to understand what each piece of the stack does so you use the right tool for each job.

**Next.js App Router** is the framework. Pages live in `src/app/` and use file-based routing. API routes live in `src/app/api/`. Server Actions (functions that run server-side but are called from components) live in `actions.ts` and `pantry-actions.ts`. Prefer Server Actions over API routes for simple data mutations — they're less boilerplate. Use API routes for anything that needs to be called from outside Next.js or needs specific HTTP verbs.

**Supabase** is the database and auth layer. The client is initialized in the top-level `supabase/` folder (`supabase/server.ts` for server components/actions, `supabase/client.ts` for client components) — use the existing client, do not create a new one. Row-level security is enabled project-wide, but as of this writing it has **not** been applied to `pantry_items` or `food_logs` specifically — see "Known limitations" in `directives/pantry-feature.md`. Never use the service role key client-side — it bypasses RLS and is a security vulnerability.

**TypeScript** is used throughout. Always define types for function parameters and return values. Never use `any` unless absolutely unavoidable, and if you do, leave a comment explaining why.

**Tailwind + shadcn/ui** handle styling. Use existing shadcn components from `src/components/ui/` before writing custom UI. Do not write raw CSS files — use Tailwind utility classes. Do not add inline `style` attributes unless Tailwind can't express what you need.

**Polar** handles payments. The client lives in `src/lib/polar.ts`. Do not hardcode prices or product IDs — read them from environment variables.

**Spoonacular** provides recipe data. The fetching logic lives in `src/lib/recipes.ts`. Always cache Spoonacular responses — the free tier has a daily request limit. Never call Spoonacular client-side; always proxy through a server action or API route to keep the API key hidden.

**USDA FoodKeeper** shelf-life data is embedded as a static TypeScript module (`src/lib/shelf-life.ts`), not a JSON file or external API call. When computing `expiry_date` for a new `pantry_items` row, use this data — category + storage zone + opened/sealed status maps to a day range. Use the midpoint of the range for the default expiry window.

---

## Database schema (Supabase)

These are the core tables. Do not add columns or create new tables without updating this section and the relevant directive. Full column-by-column detail (types, defaults, nullability, indexes, RLS status) lives in `directives/pantry-feature.md` §1 — this is a summary, that file is authoritative.

`pantry_items` — id, user_id, name, category, purchase_date, expiry_date, status (active | used | wasted), estimated_cost, storage_zone (fridge | freezer | pantry, nullable), opened (boolean), created_at, updated_at. This is the actual inventory table — there is no separate `inventory_items` table.

`food_logs` — id, user_id, item_id (FK → `pantry_items.id`, nullable), item_name, category, action (used | wasted), savings_amount, logged_at. Append-only. This is what `getSavingsStats` reads to compute the savings tracker — there is no separate `savings` table.

Recipe suggestions and their scores are **not persisted**. They're fetched from Spoonacular on the client (via server action), scored, and cached in-memory (`src/lib/recipes.ts`) — there is no `suggestions` table. There is also no nudge engine and no `nudges` table; the nudge engine described in the product plan is post-MVP and unbuilt.

Auth and billing use a separate set of tables from the starter template — `users`, `subscriptions`, `webhook_events` (see `supabase/migrations/initial-setup.sql`) — which are out of scope for this section and not touched by pantry/recipe work.

---

## Rules that are never negotiable

**Family/performance profile split is planned, not built — do not assume it exists.** The MVP doc calls for `profile_type`-gated copy and scoring (family users never see macros/efficiency scores; performance users never see community/environmental framing). As of this writing there is no `profile_type` field on `users`, no onboarding step that collects it, and no component anywhere that gates on it. If you're asked to build onboarding, scoring, or copy that depends on this split, flag that it requires new schema and product decisions first — don't invent a `profile_type` value or gate logic on an assumed one.

**Never call Spoonacular client-side.** The API key must stay server-side. Always route through a server action or API route.

**Never use the Supabase service role key client-side.** It bypasses row-level security and exposes every user's data.

**Never build post-MVP features.** The MVP is: inventory, shelf life, Tonight's Hero, expiry alerts, savings tracker. Delivery sync, fridge scanner, meal planning, community features, and advanced composting are explicitly post-launch. If a user request would require one of these, flag it and note it as post-launch scope.

**Never share food past expiry.** The sharing feature (post-launch) may only surface items that are surplus but still within their safe consumption window. Items flagged as at-risk or past expiry route to the recipe engine or compost classification only. This is a hard rule, not a user setting.

**Always write comments on non-obvious logic.** Especially in the shelf-life engine, scoring algorithm, and nudge engine. The next person reading this code (including you, three weeks from now) should understand *why* a decision was made, not just what it does.

---

## File organization

`src/app/` — pages and routing. Each subfolder is a route. Server actions live here.

`src/components/spoiler/` — all app-specific components. This is where your UI work happens.

`src/components/ui/` — generic shadcn primitives. Do not put app-specific logic here.

`src/lib/` — external service clients and utility functions. One file per service.

`src/hooks/` — custom React hooks. Stateful logic that needs to be shared across components.

`directives/` — SOPs for each feature area. Read before building. Update after learning.

`index.html` (repo root) — an experimental, disconnected prototype: client-side receipt OCR using Tesseract.js that downloads a `.txt` file. It is not part of the Next.js app, is not linked from any page, and does not write to `pantry_items`. Do not treat it as a working receipt-scan feature or build on top of it without confirming with the user first — it predates any receipt-scan directive and uses a different OCR approach (Tesseract.js in-browser) than anything decided on for this project.

`supabase/` — database migrations, generated types, and the Supabase client (`server.ts`, `client.ts`). Also owns session/auth middleware logic (`supabase/middleware.ts`, see below). Run `supabase gen types typescript` after any schema change to keep types in sync.

`.tmp/` — use this directory for your own scratch/working files during a session (drafts, intermediate output, anything you don't want committed). It does not exist yet as of this writing — create it if you need it. Never commit its contents; it should be safe to delete between sessions.

**Middleware/proxy:** `src/proxy.ts` is the active Next.js middleware entry point — it delegates session refresh and route protection to `updateSession()` in `supabase/middleware.ts`. There is also a root-level `proxy.ts` with a different, simpler implementation (no route-protection redirect logic) that is **not** the active one — it's a stale duplicate left over from an earlier iteration. Do not edit the root `proxy.ts` expecting it to affect routing; the live logic is `src/proxy.ts` → `supabase/middleware.ts`.

---

## Self-annealing loop

When something breaks, follow this sequence exactly: read the error and stack trace, identify the root cause (not the symptom), fix it, test that the fix works, and then update the relevant directive or this file with what you learned. Do not skip the last step. The system gets stronger after every failure because the learning is written down. If you skip writing it down, the next session starts from scratch.

---

## When to ask vs. when to proceed

Ask before proceeding when: the directive is missing or contradicts itself, the task requires creating a new database table or changing the schema, the task is ambiguous in a way that could cause you to build the wrong thing entirely, or the task involves a paid API call that could incur unexpected costs.

Proceed without asking when: the task is clearly scoped in a directive, you are fixing a bug and the fix is obvious, you are adding a comment or updating documentation, or you are writing a test.

---

*This file is a living document. Update it when you learn something that future sessions should know. Never delete content without confirming with the user first.*