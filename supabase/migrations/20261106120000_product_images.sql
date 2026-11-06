-- The photos of a product, in the order they are shown. The first one is the main photo and is also kept in image_url.
-- Rows made before this column existed have an empty list and keep using image_url alone.
alter table public.products
  add column if not exists images text[] not null default '{}' check (cardinality(images) <= 8);
