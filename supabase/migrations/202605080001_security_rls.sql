-- Security baseline for client-exposed Supabase tables.
-- Seed admins after deploying:
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
  on public.admin_users for select
  using (exists (
    select 1 from public.admin_users au
    where au.user_id = auth.uid()
  ));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

drop policy if exists "Only admins can read stripe events" on public.stripe_events;
create policy "Only admins can read stripe events"
  on public.stripe_events for select
  using (public.is_admin());

alter table if exists public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

alter table if exists public.blog_posts enable row level security;

drop policy if exists "Blog posts are publicly readable" on public.blog_posts;
create policy "Blog posts are publicly readable"
  on public.blog_posts for select
  using (true);

drop policy if exists "Only admins can insert blog posts" on public.blog_posts;
create policy "Only admins can insert blog posts"
  on public.blog_posts for insert
  with check (public.is_admin());

drop policy if exists "Only admins can update blog posts" on public.blog_posts;
create policy "Only admins can update blog posts"
  on public.blog_posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Only admins can delete blog posts" on public.blog_posts;
create policy "Only admins can delete blog posts"
  on public.blog_posts for delete
  using (public.is_admin());

alter table if exists public.reports enable row level security;

drop policy if exists "Users can create their own reports" on public.reports;
create policy "Users can create their own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_user_id);

drop policy if exists "Admins can manage reports" on public.reports;
create policy "Admins can manage reports"
  on public.reports for all
  using (public.is_admin())
  with check (public.is_admin());

alter table if exists public.activity enable row level security;

drop policy if exists "Users can read their notifications" on public.activity;
create policy "Users can read their notifications"
  on public.activity for select
  using (auth.uid() = target_user_id or public.is_admin());

drop policy if exists "Users can update their notifications" on public.activity;
create policy "Users can update their notifications"
  on public.activity for update
  using (auth.uid() = target_user_id)
  with check (auth.uid() = target_user_id);

alter table if exists public.user_boosts enable row level security;

drop policy if exists "Active boosts are publicly readable" on public.user_boosts;
create policy "Active boosts are publicly readable"
  on public.user_boosts for select
  using (end_at >= now() or public.is_admin());

drop policy if exists "Only admins can manage boosts" on public.user_boosts;
create policy "Only admins can manage boosts"
  on public.user_boosts for all
  using (public.is_admin())
  with check (public.is_admin());

alter table if exists public.subscriptions enable row level security;

do $$
begin
  if to_regclass('public.subscriptions') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'subscriptions'
        and column_name = 'stripe_subscription_id'
    )
  then
    execute 'create unique index if not exists subscriptions_stripe_subscription_id_key on public.subscriptions (stripe_subscription_id) where stripe_subscription_id is not null';
  end if;
end $$;

drop policy if exists "Users can read their subscriptions" on public.subscriptions;
create policy "Users can read their subscriptions"
  on public.subscriptions for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = subscriptions.profile_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Only admins can manage subscriptions" on public.subscriptions;
create policy "Only admins can manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public image buckets are readable" on storage.objects;
create policy "Public image buckets are readable"
  on storage.objects for select
  using (bucket_id in ('avatars', 'banners', 'blog-images'));

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'banners')
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users can update their own profile images" on storage.objects;
create policy "Users can update their own profile images"
  on storage.objects for update
  using (
    bucket_id in ('avatars', 'banners')
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars', 'banners')
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images"
  on storage.objects for delete
  using (
    bucket_id in ('avatars', 'banners')
    and (storage.foldername(name))[1] = 'public'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Admins can manage blog images" on storage.objects;
create policy "Admins can manage blog images"
  on storage.objects for all
  using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());

create or replace function public.grant_coin_purchase(
  p_profile_id uuid,
  p_amount integer,
  p_stripe_event_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'coin amount must be positive';
  end if;

  update public.profiles
  set coins = coalesce(coins, 0) + p_amount,
      updated_at = now()
  where id = p_profile_id;

  if not found then
    raise exception 'profile not found';
  end if;
end;
$$;

create or replace function public.activate_boost_purchase(
  p_profile_id uuid,
  p_plan_id text,
  p_stripe_session_id text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration interval := case
    when p_plan_id ilike '%ultimate%' or p_plan_id ilike '%presence%' then interval '90 days'
    when p_plan_id ilike '%monthly%' or p_plan_id ilike '%spotlight%' then interval '30 days'
    else interval '12 hours'
  end;
begin
  insert into public.user_boosts (profile_id, boost_type_id, start_at, end_at)
  values (p_profile_id, p_plan_id, now(), now() + v_duration);

  if p_stripe_subscription_id is not null then
    insert into public.subscriptions (
      profile_id,
      plan_id,
      status,
      stripe_customer_id,
      stripe_subscription_id,
      created_at,
      updated_at
    )
    values (
      p_profile_id,
      p_plan_id,
      'active',
      p_stripe_customer_id,
      p_stripe_subscription_id,
      now(),
      now()
    )
    on conflict (stripe_subscription_id)
    do update set
      status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      updated_at = now();
  end if;
end;
$$;

revoke all on function public.grant_coin_purchase(uuid, integer, text) from public;
revoke all on function public.activate_boost_purchase(uuid, text, text, text, text) from public;
