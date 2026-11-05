-- Keeps shop shelves, the admin list and the coil lookup fast as the catalog grows.
create index if not exists products_category_position_idx on public.products (category, position);
create index if not exists products_position_idx on public.products (position);
create index if not exists products_fits_idx on public.products using gin (fits);
