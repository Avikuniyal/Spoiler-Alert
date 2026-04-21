# Spoiler Alert 🥦

**Stop wasting money on food you forget about.**

Spoiler Alert is a household food management app that tracks what's in your fridge, warns you before things expire, and suggests tonight's dinner using ingredients that need to be used up first. Built for two audiences: busy families who need fast weeknight dinners, and performance athletes who want zero protein waste.

---

## What it does

The core loop is simple: you add food to the app, the app tracks when it expires, and when something is about to go bad it tells you exactly what to cook with it tonight. Over time it learns your habits, nudges you to buy smarter, and shows you how much money you've saved.

The two user modes are meaningfully different. Family mode emphasizes speed, kid-friendliness, and dollar savings framed as experiences ("you saved $85 — that's 2 movie tickets"). Performance mode emphasizes macro tracking, protein utilization, and efficiency scores. A 15-second onboarding picks the mode, and the entire app experience shifts accordingly.

---

## Tech stack

This is a Next.js web application. Here's what each piece of the stack does and why it was chosen.

**Next.js + TypeScript** is the frontend and backend in one. Next.js lets you write API routes in the same project as your UI, which means less complexity for a solo builder. TypeScript adds type safety so Claude Code can catch errors before they become bugs.

**Supabase** handles the database (PostgreSQL) and authentication. It gives you a full backend without having to manage a server. Auth, user sessions, and row-level security are all handled for you.

**Tailwind CSS** is the styling system. Instead of writing custom CSS files, you apply utility classes directly in your components. It keeps styling fast and consistent.

**shadcn/ui** is a component library built on top of Tailwind. It gives you pre-built, accessible UI components (buttons, inputs, cards, dialogs) that match your design system.

**Polar** handles payments and subscriptions. It's the monetization layer for the freemium model.

**Spoonacular API** provides recipe data. You query it by ingredients and it returns recipes ranked by prep time, nutrition, and ingredient overlap.

**USDA FoodKeeper** data (embedded as static JSON) powers the shelf-life engine. Every item you add gets an expiry window computed from USDA data adjusted for storage zone and opened/sealed status.

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
    actions.ts            # Server Actions for general app logic
    pantry-actions.ts     # Server Actions for inventory/pantry logic
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
    recipes.ts            # Spoonacular recipe fetching logic
supabase/                 # Supabase config, migrations, and types
```

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
SPOONACULAR_API_KEY=             # Your Spoonacular API key for recipes
```

Finally, run the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## MVP scope

The MVP consists of four features, in priority order: inventory management with shelf-life tracking, tonight's hero recipe suggestion, expiry alerts and push notifications, and a savings tracker. Everything else — delivery sync, fridge scanner, community features, meal planning — is post-launch. See the full product plan for the complete roadmap.

---

## Architecture

This project follows a 3-layer architecture designed to separate thinking from doing. Claude Code acts as the orchestration layer — it reads directives, makes decisions, calls the right tools, and handles errors. Deterministic logic lives in server actions and API routes. The directive layer lives in `CLAUDE.md` and the `directives/` folder.

See `CLAUDE.md` for full instructions on how Claude Code should operate in this codebase.