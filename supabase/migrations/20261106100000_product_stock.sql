-- How many of a product are on the shelf.
-- Empty (null) means stock isn't counted for that product, and 0 means it is sold out.
alter table public.products
  add column if not exists stock integer check (stock is null or stock >= 0);
