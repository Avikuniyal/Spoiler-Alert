# CLAUDE.md — Spoiler Alert

This file is your briefing document. Read it at the start of every session before touching any code. It tells you what this project is, how it's structured, how you should think and operate, and what rules are non-negotiable.

---

## What this project is

Spoiler Alert is a household food management web app built with Next.js and Supabase. The core loop: users add food to their pantry/fridge, the app tracks expiry dates using USDA shelf-life data, and when something is about to go bad it surfaces a recipe suggestion (Tonight's Hero) that uses that ingredient first.

There are two user modes set at onboarding and never mixed: **family** mode (speed, kid-friendliness, dollar savings) and **performance** mode (macro tracking, protein utilization, efficiency scores). Every feature decision must respect this split — never show macro data to family users, never show community/environmental messaging to performance users.

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

**Supabase** is the database and auth layer. The client is initialized in `src/lib/` — use the existing client, do not create a new one. Row-level security is enabled, which means queries automatically scope to the logged-in user. Never use the service role key client-side — it bypasses RLS and is a security vulnerability.

**TypeScript** is used throughout. Always define types for function parameters and return values. Never use `any` unless absolutely unavoidable, and if you do, leave a comment explaining why.

**Tailwind + shadcn/ui** handle styling. Use existing shadcn components from `src/components/ui/` before writing custom UI. Do not write raw CSS files — use Tailwind utility classes. Do not add inline `style` attributes unless Tailwind can't express what you need.

**Polar** handles payments. The client lives in `src/lib/polar.ts`. Do not hardcode prices or product IDs — read them from environment variables.

**Spoonacular** provides recipe data. The fetching logic lives in `src/lib/recipes.ts`. Always cache Spoonacular responses — the free tier has a daily request limit. Never call Spoonacular client-side; always proxy through a server action or API route to keep the API key hidden.

**USDA FoodKeeper** shelf-life data is embedded as static JSON. It does not require an API call. When computing `expires_at` for a new inventory item, use this data — category + storage zone + opened/sealed status maps to a day range. Use the midpoint of the range for the default expiry window.

---

## Database schema (Supabase)

These are the core tables. Do not add columns or create new tables without updating this section and the relevant directive.

`inventory_items` — id, user_id, name, category, quantity, unit, storage_zone, status (active | used | wasted | frozen), source (voice | quick_add | barcode | receipt | scanner), opened (boolean), added_at, expires_at, used_at, price_cents.

`waste_log` — id, inventory_item_id, reason (expired | manual), logged_at.

`suggestions` — id, user_id, recipe_id, trigger_item_id (the expiring item that triggered this), suggested_at, status (shown | cooked | skipped | rejected), profile_type.

`nudges` — id, user_id, type (quantity | swap | timing | pre_shop | freeze), message, delivered_at, status (pending | acted | dismissed).

`savings` — user_id, month, items_saved_count, dollars_saved, protein_utilization_pct.

---

## Rules that are never negotiable

**Never mix profile types.** Family users never see macros, protein utilization, or efficiency scores. Performance users never see community messaging, environmental guilt framing, or dollar-savings-as-experiences. This is enforced at the component level using the `profile_type` field on the user record.

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

`supabase/` — database migrations and generated types. Run `supabase gen types typescript` after any schema change to keep types in sync.

`.tmp/` — temporary files used during processing. Never commit. Always regenerated.

---

## Self-annealing loop

When something breaks, follow this sequence exactly: read the error and stack trace, identify the root cause (not the symptom), fix it, test that the fix works, and then update the relevant directive or this file with what you learned. Do not skip the last step. The system gets stronger after every failure because the learning is written down. If you skip writing it down, the next session starts from scratch.

---

## When to ask vs. when to proceed

Ask before proceeding when: the directive is missing or contradicts itself, the task requires creating a new database table or changing the schema, the task is ambiguous in a way that could cause you to build the wrong thing entirely, or the task involves a paid API call that could incur unexpected costs.

Proceed without asking when: the task is clearly scoped in a directive, you are fixing a bug and the fix is obvious, you are adding a comment or updating documentation, or you are writing a test.

---

*This file is a living document. Update it when you learn something that future sessions should know. Never delete content without confirming with the user first.*