-- 1. Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'user',
  created_at timestamp with time zone default now()
);

-- 2. Create trigger function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- 3. Create trigger
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 4. Enable RLS
alter table public.profiles enable row level security;

-- 5. Create RLS Policies

-- Users can read their own profile
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Users can update their own profile (but not role)
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from public.profiles where id = auth.uid())
);

-- Admins can read all profiles
create policy "Admins can read all profiles"
on public.profiles
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

-- Admins can update any profile
create policy "Admins can update any profile"
on public.profiles
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);
