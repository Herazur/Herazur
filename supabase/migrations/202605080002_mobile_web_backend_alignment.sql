-- Align mobile and web clients on the same Supabase follow/message contract.

alter table if exists public.follows enable row level security;
alter table if exists public.messages enable row level security;

revoke all on table public.follows from anon;
grant select, insert, delete on table public.follows to authenticated;
grant select, insert on table public.messages to authenticated;
grant select on table public.messages to anon;

delete from public.follows a
using public.follows b
where a.ctid < b.ctid
  and a.follower_id = b.follower_id
  and a.following_id = b.following_id;

create unique index if not exists follows_follower_following_id_uidx
  on public.follows (follower_id, following_id);

create index if not exists follows_follower_id_idx
  on public.follows (follower_id);

create index if not exists follows_following_id_idx
  on public.follows (following_id);

create index if not exists messages_sender_receiver_created_at_idx
  on public.messages (sender_id, receiver_id, created_at);

create index if not exists messages_receiver_sender_created_at_idx
  on public.messages (receiver_id, sender_id, created_at);

drop policy if exists "follows participants can read" on public.follows;
create policy "follows participants can read"
  on public.follows for select
  to authenticated
  using (
    (select auth.uid()) = follower_id
    or (select auth.uid()) = following_id
  );

drop policy if exists "follows users can create own follows" on public.follows;
create policy "follows users can create own follows"
  on public.follows for insert
  to authenticated
  with check (
    (select auth.uid()) = follower_id
    and following_id <> (select auth.uid())
  );

drop policy if exists "follows users can delete own follows" on public.follows;
create policy "follows users can delete own follows"
  on public.follows for delete
  to authenticated
  using ((select auth.uid()) = follower_id);

drop policy if exists "messages are publicly readable" on public.messages;
create policy "messages are publicly readable"
  on public.messages for select
  to anon, authenticated
  using (true);

drop policy if exists "messages senders can message followed users" on public.messages;
create policy "messages senders can message followed users"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and receiver_id <> (select auth.uid())
    and exists (
      select 1
      from public.follows
      where follower_id = (select auth.uid())
        and following_id = receiver_id
    )
  );

create or replace function public.follow_user(p_following_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.';
  end if;

  if p_following_id = (select auth.uid()) then
    raise exception 'Cannot follow yourself.';
  end if;

  insert into public.follows (follower_id, following_id)
  values ((select auth.uid()), p_following_id)
  on conflict do nothing;
end;
$$;

create or replace function public.unfollow_user(p_following_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.';
  end if;

  delete from public.follows
  where follower_id = (select auth.uid())
    and following_id = p_following_id;
end;
$$;

create or replace function public.check_follow_status(p_target_user_id uuid)
returns table (is_following boolean, is_followed_by boolean)
language sql
security invoker
set search_path = ''
stable
as $$
  select
    exists (
      select 1
      from public.follows
      where follower_id = (select auth.uid())
        and following_id = p_target_user_id
    ) as is_following,
    exists (
      select 1
      from public.follows
      where follower_id = p_target_user_id
        and following_id = (select auth.uid())
    ) as is_followed_by;
$$;

revoke execute on function public.follow_user(uuid) from public, anon;
revoke execute on function public.unfollow_user(uuid) from public, anon;
grant execute on function public.follow_user(uuid) to authenticated;
grant execute on function public.unfollow_user(uuid) to authenticated;
grant execute on function public.check_follow_status(uuid) to authenticated, anon;

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('banners', 'banners', true),
  ('blog-images', 'blog-images', true)
on conflict (id) do update
set public = excluded.public;
