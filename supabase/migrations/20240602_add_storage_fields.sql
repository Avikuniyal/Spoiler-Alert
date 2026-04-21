-- Add storage zone and opened status to pantry items.
-- storage_zone: where the item is stored ('fridge', 'freezer', 'pantry').
-- opened: whether the package has already been opened (affects shelf life).
-- Both are nullable to remain compatible with rows inserted before this migration.

ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS storage_zone text,
  ADD COLUMN IF NOT EXISTS opened boolean DEFAULT false;
