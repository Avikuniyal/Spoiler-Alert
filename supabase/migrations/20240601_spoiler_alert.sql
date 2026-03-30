CREATE TABLE IF NOT EXISTS public.pantry_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL DEFAULT 'Other',
    purchase_date date,
    expiry_date date NOT NULL,
    status text NOT NULL DEFAULT 'active',
    estimated_cost numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS pantry_items_user_id_idx ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS pantry_items_status_idx ON public.pantry_items(status);

CREATE TABLE IF NOT EXISTS public.food_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    item_id uuid REFERENCES public.pantry_items(id) ON DELETE SET NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    action text NOT NULL,
    savings_amount numeric(10,2) DEFAULT 0,
    logged_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS food_logs_user_id_idx ON public.food_logs(user_id);
CREATE INDEX IF NOT EXISTS food_logs_action_idx ON public.food_logs(action);
