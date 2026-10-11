-- 好習慣：家庭共用資料
-- 登入方式：匿名登入（每台裝置一個帳號），用「家庭邀請碼」加入同一個家庭。
-- 可重複執行。

-- 家庭
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default '我們家',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- 家庭成員（裝置帳號 ↔ 家庭）
create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- 全家共用的設定（小孩、照顧者、規則、獎品、串連、罰站設定），整份 JSON
create table if not exists public.family_config (
  family_id uuid primary key references public.families(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

-- 事件紀錄（append-only；只允許把 undone 改成 true）
create table if not exists public.events (
  id text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id text not null,
  caregiver_id text not null,
  at bigint not null,
  type text not null,
  ref_id text,
  step_id text,
  stickers int,
  label text,
  emoji text,
  undone boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists events_family_at on public.events (family_id, at desc);

-- 權限判斷：目前登入者是否屬於這個家庭
create or replace function public.is_family_member(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members where family_id = fid and user_id = auth.uid());
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_config enable row level security;
alter table public.events enable row level security;

drop policy if exists "members read family" on public.families;
create policy "members read family" on public.families for select using (public.is_family_member(id));

drop policy if exists "members read members" on public.family_members;
create policy "members read members" on public.family_members for select using (public.is_family_member(family_id));

drop policy if exists "members read config" on public.family_config;
create policy "members read config" on public.family_config for select using (public.is_family_member(family_id));
drop policy if exists "members insert config" on public.family_config;
create policy "members insert config" on public.family_config for insert with check (public.is_family_member(family_id));
drop policy if exists "members update config" on public.family_config;
create policy "members update config" on public.family_config for update using (public.is_family_member(family_id));

drop policy if exists "members read events" on public.events;
create policy "members read events" on public.events for select using (public.is_family_member(family_id));
drop policy if exists "members insert events" on public.events;
create policy "members insert events" on public.events for insert with check (public.is_family_member(family_id));
drop policy if exists "members update events" on public.events;
create policy "members update events" on public.events for update using (public.is_family_member(family_id));

-- 事件只能「撤銷」，其他欄位不能改
create or replace function public.events_only_undo()
returns trigger language plpgsql as $$
begin
  if (new.id, new.family_id, new.child_id, new.caregiver_id, new.at, new.type, new.ref_id, new.step_id, new.stickers)
     is distinct from
     (old.id, old.family_id, old.child_id, old.caregiver_id, old.at, old.type, old.ref_id, old.step_id, old.stickers)
     or (old.undone and not new.undone) then
    raise exception '事件只能撤銷，不能修改';
  end if;
  return new;
end $$;
drop trigger if exists events_only_undo on public.events;
create trigger events_only_undo before update on public.events for each row execute function public.events_only_undo();

-- 建立家庭：產生 6 碼邀請碼，建立者自動成為成員
create or replace function public.create_family(family_name text, initial_config jsonb)
returns public.families language plpgsql security definer set search_path = public as $$
declare
  fam public.families;
  code text;
begin
  if auth.uid() is null then raise exception '尚未登入'; end if;
  loop
    -- 去掉容易看錯的 0 O 1 I
    code := (select string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
             from generate_series(1, 6));
    exit when not exists (select 1 from public.families where invite_code = code);
  end loop;
  insert into public.families (name, invite_code) values (coalesce(nullif(family_name, ''), '我們家'), code) returning * into fam;
  insert into public.family_members (family_id, user_id) values (fam.id, auth.uid());
  insert into public.family_config (family_id, data) values (fam.id, initial_config);
  return fam;
end $$;

-- 用邀請碼加入家庭
create or replace function public.join_family(code text)
returns public.families language plpgsql security definer set search_path = public as $$
declare
  fam public.families;
begin
  if auth.uid() is null then raise exception '尚未登入'; end if;
  select * into fam from public.families where invite_code = upper(trim(code));
  if fam.id is null then raise exception '找不到這個邀請碼'; end if;
  insert into public.family_members (family_id, user_id) values (fam.id, auth.uid()) on conflict do nothing;
  return fam;
end $$;

revoke all on function public.create_family(text, jsonb) from public, anon;
revoke all on function public.join_family(text) from public, anon;
grant execute on function public.create_family(text, jsonb) to authenticated;
grant execute on function public.join_family(text) to authenticated;

-- 即時同步
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'events') then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'family_config') then
    alter publication supabase_realtime add table public.family_config;
  end if;
end $$;
