# Spoiler Alert 🥦

**Stop wasting money on food you forget about.**

Spoiler Alert is a household food management app that tracks what's in your fridge, warns you before things expire, and suggests tonight's dinner using ingredients that need to be used up first. Built for two audiences: busy families who need fast weeknight dinners, and performance athletes who want zero protein waste.

---

## What it does

The core loop is simple: you add food to the app, the app tracks when it expires, and when something is about to go bad it tells you exactly what to cook with it tonight. It also shows you how much money you've saved over time.

The product plan calls for two meaningfully different user modes — family mode (speed, kid-friendliness, dollar savings framed as experiences, e.g. "you saved $85 — that's 2 movie tickets") and performance mode (macro tracking, protein utilization, efficiency scores), picked during onboarding. **This mode split has not been built.** There's no onboarding step for it and no component that varies by mode today — see `CLAUDE.md` for the current status. Every user currently gets the same (family-leaning) framing.

---

## Tech stack

This is a Next.js web application. Here's what each piece of the stack does and why it was chosen.

**Next.js + TypeScript** is the frontend and backend in one. Next.js lets you write API routes in the same project as your UI, which means less complexity for a solo builder. TypeScript adds type safety so Claude Code can catch errors before they become bugs.

**Supabase** handles the database (PostgreSQL) and authentication. It gives you a full backend without having to manage a server. Auth and user sessions are handled for you. Row-level security is enabled at the project level, but as of this writing has **not** been applied to the `pantry_items` or `food_logs` tables specifically — see `directives/pantry-feature.md`'s "Known Limitations" for the current status.

**Tailwind CSS** is the styling system. Instead of writing custom CSS files, you apply utility classes directly in your components. It keeps styling fast and consistent.

**shadcn/ui** is a component library built on top of Tailwind. It gives you pre-built, accessible UI components (buttons, inputs, cards, dialogs) that match your design system.

**Polar** handles payments and subscriptions. It's the monetization layer for the freemium model.

**Spoonacular API** provides recipe data. You query it by ingredients and it returns recipes ranked by prep time, nutrition, and ingredient overlap.

**USDA FoodKeeper** data (embedded as a static TypeScript module, `src/lib/shelf-life.ts` — not a JSON file or external API) powers the shelf-life engine. Every item you add gets an expiry window computed from USDA data adjusted for storage zone and opened/sealed status.

---

## Project structure

```
src/
  app/                    # Next.js pages (file-based routing)
    (auth)/               # Auth route group — login, signup, callback
    api/                  # Backend API routes
    dashboard/            # Main logged-in experience
    pricing/              # Pricing page
    success/              # Post-payment success page
    actions.ts            # Server Actions for general app logic (auth, payments)
    pantry-actions.ts     # Server Actions for inventory/pantry logic
    recipe-actions.ts     # Server Actions wrapping Spoonacular fetch/detail calls
    layout.tsx            # Root layout wrapping every page
    page.tsx              # Homepage / landing page
  components/
    spoiler/              # App-specific components (inventory, recipes, etc.)
    ui/                   # Generic reusable UI primitives (shadcn)
    hero.tsx              # Landing page hero section
    navbar.tsx            # Top navigation
    dashboard-navbar.tsx  # Logged-in dashboard navigation
    footer.tsx            # Site footer
    pricing-card.tsx      # Pricing tier card
    subscription-check.tsx # Guards premium content behind subscription check
  hooks/
    use-mobile.tsx        # Detects mobile viewport for responsive behavior
  lib/
    polar.ts              # Polar payments client
    recipes.ts            # Spoonacular recipe fetching + caching logic
    shelf-life.ts         # USDA-based shelf-life lookup engine
    utils.ts              # Shared utility functions
supabase/                 # Migrations, generated types, Supabase client (server.ts/client.ts), and session middleware (middleware.ts)
index.html                 # Experimental, disconnected prototype — see note below
```

**Note on `index.html`:** the repo root also contains a standalone `index.html` that runs receipt OCR client-side with Tesseract.js and downloads the extracted text as a `.txt` file. It's a prototype from an earlier exploration of receipt scanning — it is **not** wired into the Next.js app, isn't linked from any page, and doesn't write to `pantry_items`. Receipt scanning is still post-launch/unbuilt as far as the actual product is concerned; don't mistake this file for a working feature.

---

## Getting started

First, clone the repo and install dependencies.

```bash
git clone https://github.com/Avikuniyal/Spoiler-Alert.git
cd Spoiler-Alert
npm install
```

Then copy the environment variables template and fill in your keys.

```bash
cp .env.example .env.local
```

You'll need the following keys in your `.env.local` file. Each one is explained below.

```
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Your Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Your Supabase service role key (never expose this client-side)
POLAR_ACCESS_TOKEN=              # Your Polar API token for payments
POLAR_WEBHOOK_SECRET=            # Your Polar webhook signing secret, for verifying webhook events
SPOONACULAR_API_KEY=             # Your Spoonacular (RapidAPI) key for recipes — see directives/recipes-feature.md
NEXT_PUBLIC_REQUIRE_SUBSCRIPTION=# Set to "false" in development to bypass the subscription gate on /dashboard
```

Finally, run the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## MVP scope

The MVP consists of four features, in priority order: inventory management with shelf-life tracking, tonight's hero recipe suggestion, expiry alerts, and a savings tracker. Today, expiry alerts are in-app only (the dashboard's alert strip) — push/email notifications outside the app are not yet built, see `directives/pantry-feature.md` §7. Everything else — delivery sync, fridge scanner, community features, meal planning — is post-launch. See the full product plan for the complete roadmap.

---

## Architecture

This project follows a 3-layer architecture designed to separate thinking from doing. Claude Code acts as the orchestration layer — it reads directives, makes decisions, calls the right tools, and handles errors. Deterministic logic lives in server actions and API routes. The directive layer lives in `CLAUDE.md` and the `directives/` folder.

See `CLAUDE.md` for full instructions on how Claude Code should operate in this codebase.