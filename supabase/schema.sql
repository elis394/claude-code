-- Recepten-app database schema (MVP)
-- Run this once in the Supabase SQL editor of your project (see SETUP.md).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  title text not null,
  source_url text,
  source_type text not null default 'manual' check (source_type in ('website', 'video', 'manual')),
  image_url text,
  instructions text,
  servings integer,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  position integer not null default 0
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  recipe_id uuid references recipes (id) on delete set null,
  source text not null default 'manual' check (source in ('generated', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists recipes_household_id_idx on recipes (household_id);
create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients (recipe_id);
create index if not exists shopping_list_items_household_id_idx on shopping_list_items (household_id);

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER to avoid RLS recursion on household_members)
-- ---------------------------------------------------------------------------

create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Household create/join (SECURITY DEFINER: households/household_members have
-- no direct client-side insert policies, so this is the only way in)
-- ---------------------------------------------------------------------------

create or replace function create_household(household_name text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household households;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  insert into households (name, invite_code)
  values (nullif(trim(household_name), ''), new_code)
  returning * into new_household;

  insert into household_members (household_id, user_id)
  values (new_household.id, auth.uid());

  return new_household;
end;
$$;

create or replace function join_household(code text)
returns households
language plpgsql
security definer
set search_path = public
as $$
declare
  target households;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into target from households where invite_code = upper(trim(code));

  if target.id is null then
    raise exception 'Uitnodigingscode niet gevonden';
  end if;

  insert into household_members (household_id, user_id)
  values (target.id, auth.uid())
  on conflict do nothing;

  return target;
end;
$$;

grant execute on function create_household(text) to authenticated;
grant execute on function join_household(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table shopping_list_items enable row level security;

-- households: members can see their own household's row (e.g. to show the
-- invite code). No insert/update/delete policy: joining/creating goes
-- through the SECURITY DEFINER functions above.
create policy "Members can view their household"
  on households for select
  using (is_household_member(id));

-- household_members: members can see who's in their household.
create policy "Members can view household membership"
  on household_members for select
  using (is_household_member(household_id));

-- recipes
create policy "Members can view household recipes"
  on recipes for select
  using (is_household_member(household_id));

create policy "Members can add household recipes"
  on recipes for insert
  with check (is_household_member(household_id));

create policy "Members can update household recipes"
  on recipes for update
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "Members can delete household recipes"
  on recipes for delete
  using (is_household_member(household_id));

-- recipe_ingredients (scoped via the parent recipe's household)
create policy "Members can view recipe ingredients"
  on recipe_ingredients for select
  using (exists (
    select 1 from recipes r
    where r.id = recipe_ingredients.recipe_id
      and is_household_member(r.household_id)
  ));

create policy "Members can add recipe ingredients"
  on recipe_ingredients for insert
  with check (exists (
    select 1 from recipes r
    where r.id = recipe_ingredients.recipe_id
      and is_household_member(r.household_id)
  ));

create policy "Members can update recipe ingredients"
  on recipe_ingredients for update
  using (exists (
    select 1 from recipes r
    where r.id = recipe_ingredients.recipe_id
      and is_household_member(r.household_id)
  ))
  with check (exists (
    select 1 from recipes r
    where r.id = recipe_ingredients.recipe_id
      and is_household_member(r.household_id)
  ));

create policy "Members can delete recipe ingredients"
  on recipe_ingredients for delete
  using (exists (
    select 1 from recipes r
    where r.id = recipe_ingredients.recipe_id
      and is_household_member(r.household_id)
  ));

-- shopping_list_items
create policy "Members can view shopping list items"
  on shopping_list_items for select
  using (is_household_member(household_id));

create policy "Members can add shopping list items"
  on shopping_list_items for insert
  with check (is_household_member(household_id));

create policy "Members can update shopping list items"
  on shopping_list_items for update
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "Members can delete shopping list items"
  on shopping_list_items for delete
  using (is_household_member(household_id));
