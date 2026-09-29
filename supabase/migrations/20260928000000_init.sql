-- ═══════════════════════════════════════════════════════════════════════════
--  Nukhba Academy — core schema
--  Roles · courses · lessons (media protected) · enrollments · progress
--  orders (Plutu + bank transfer) · instructor earnings & payouts · certificates
--  Every table is protected by Row Level Security.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────────── Types ───────────────────────────────
create type public.user_role      as enum ('student', 'instructor', 'admin');
create type public.course_status  as enum ('draft', 'review', 'published', 'archived');
create type public.order_status   as enum ('pending', 'awaiting_review', 'paid', 'failed', 'canceled', 'refunded');
create type public.payment_method as enum ('mpgs', 'localbankcards', 'tlync', 'bank_transfer');

-- ───────────────────────────── Settings ──────────────────────────────
create table public.app_settings (
  id                        boolean primary key default true check (id),
  usd_to_lyd                numeric(10,4) not null default 5.50,   -- update from the admin panel
  default_instructor_share  numeric(5,2)  not null default 70 check (default_instructor_share between 0 and 100),
  bank_transfer_ar          text not null default 'حوّل المبلغ إلى الحساب المصرفي الموضّح، ثم ارفع صورة الإيصال.',
  bank_transfer_en          text not null default 'Transfer the amount to the bank account shown, then upload the receipt.',
  support_email             text,
  updated_at                timestamptz not null default now()
);
insert into public.app_settings default values;

-- ───────────────────────────── Profiles ──────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null default '',
  avatar_url     text,
  headline       text,
  bio            text,
  role           public.user_role not null default 'student',
  revenue_share  numeric(5,2) check (revenue_share between 0 and 100), -- per-instructor override
  locale         text not null default 'ar' check (locale in ('ar', 'en')),
  created_at     timestamptz not null default now()
);


-- ───────────────────────────── Helpers ───────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_instructor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('instructor', 'admin'));
$$;

-- ───────────────────────────── Courses ───────────────────────────────
create table public.courses (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  instructor_id      uuid not null references public.profiles (id),
  status             public.course_status not null default 'draft',
  category           text not null default 'general',
  level              text not null default 'intermediate' check (level in ('beginner', 'intermediate', 'advanced', 'executive')),
  title_ar           text, title_en text,
  subtitle_ar        text, subtitle_en text,
  description_ar     text, description_en text,
  outcomes_ar        text[] not null default '{}',
  outcomes_en        text[] not null default '{}',
  cover_url          text,
  theme              text not null default 'gold',
  price_usd          numeric(10,2) not null default 0 check (price_usd >= 0),
  price_lyd          numeric(10,2) check (price_lyd >= 0),           -- optional fixed LYD price
  compare_price_usd  numeric(10,2) check (compare_price_usd >= 0),
  featured           boolean not null default false,
  -- denormalised stats (maintained by triggers, read-only for clients)
  students_count     integer not null default 0,
  rating_avg         numeric(3,2) not null default 0,
  rating_count       integer not null default 0,
  lessons_count      integer not null default 0,
  duration_sec       integer not null default 0,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint course_has_title check (coalesce(title_ar, title_en) is not null)
);
create index courses_status_idx on public.courses (status, featured desc, students_count desc);

create table public.modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  position   integer not null default 0,
  title_ar   text, title_en text
);
create index modules_course_idx on public.modules (course_id, position);

create table public.lessons (
  id            uuid primary key default gen_random_uuid(),
  module_id     uuid not null references public.modules (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  position      integer not null default 0,
  title_ar      text, title_en text,
  summary_ar    text, summary_en text,
  duration_sec  integer not null default 0 check (duration_sec >= 0),
  is_preview    boolean not null default false
);
create index lessons_module_idx on public.lessons (module_id, position);
create index lessons_course_idx on public.lessons (course_id);

-- Video links & downloadable files live apart from lesson metadata so that
-- the catalogue can be public while the paid media stays locked.
create table public.lesson_media (
  lesson_id  uuid primary key references public.lessons (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  video_url  text,
  resources  jsonb not null default '[]'::jsonb   -- [{ "name": "...", "url": "...", "type": "PDF", "size": "2 MB" }]
);

-- ─────────────────────────── Enrollments ─────────────────────────────
create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid not null references public.courses (id) on delete cascade,
  source      text not null default 'purchase' check (source in ('purchase', 'free', 'admin')),
  order_id    uuid,
  created_at  timestamptz not null default now(),
  unique (user_id, course_id)
);
create index enrollments_course_idx on public.enrollments (course_id);

create or replace function public.has_course_access(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin()
      or exists (select 1 from courses  where id = p_course and instructor_id = auth.uid())
      or exists (select 1 from enrollments where course_id = p_course and user_id = auth.uid());
$$;

create or replace function public.course_is_visible(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from courses
    where id = p_course
      and (status = 'published' or instructor_id = auth.uid() or is_admin())
  );
$$;

create or replace function public.can_edit_course(p_course uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_admin() or exists (select 1 from courses where id = p_course and instructor_id = auth.uid());
$$;

-- ───────────────────────────── Learning ──────────────────────────────
create table public.lesson_progress (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  completed_at  timestamptz,
  position_sec  integer not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index progress_user_course_idx on public.lesson_progress (user_id, course_id);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  body        text check (char_length(body) <= 2000),
  created_at  timestamptz not null default now(),
  unique (course_id, user_id)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  lesson_id   uuid references public.lessons (id) on delete set null,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 3000),
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index comments_course_idx on public.comments (course_id, created_at desc);

-- Public-safe projection (no revenue data, no private students):
-- instructors, plus anyone who has publicly posted a review or comment.
create view public.public_profiles as
  select p.id, p.full_name, p.avatar_url, p.headline, p.bio, p.role
  from public.profiles p
  where p.role in ('instructor', 'admin')
     or exists (select 1 from public.reviews  r where r.user_id = p.id)
     or exists (select 1 from public.comments c where c.user_id = p.id);
grant select on public.public_profiles to anon, authenticated;

-- ───────────────────────────── Commerce ──────────────────────────────
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  invoice_no      text not null unique default ('NKB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 14))),
  user_id         uuid not null references public.profiles (id),
  course_id       uuid not null references public.courses (id),
  method          public.payment_method not null,
  status          public.order_status not null default 'pending',
  amount          numeric(12,2) not null check (amount > 0),
  currency        text not null check (currency in ('USD', 'LYD')),
  fx_rate         numeric(10,4) not null default 1,     -- LYD per USD at order time
  amount_usd      numeric(12,2) not null,
  gateway_txn     text,
  receipt_path    text,
  customer_phone  text,
  admin_note      text,
  raw             jsonb,
  reviewed_by     uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  paid_at         timestamptz
);
create index orders_user_idx   on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.earnings (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders (id),
  instructor_id   uuid not null references public.profiles (id),
  course_id       uuid not null references public.courses (id),
  gross_usd       numeric(12,2) not null,
  share_percent   numeric(5,2)  not null,
  instructor_usd  numeric(12,2) not null,
  platform_usd    numeric(12,2) not null,
  created_at      timestamptz not null default now()
);
create index earnings_instructor_idx on public.earnings (instructor_id, created_at desc);

create table public.payouts (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null references public.profiles (id),
  amount_usd     numeric(12,2) not null check (amount_usd > 0),
  method         text,
  reference      text,
  note           text,
  created_by     uuid references public.profiles (id),
  paid_at        timestamptz not null default now()
);

create view public.instructor_balances with (security_invoker = true) as
  select p.id as instructor_id,
         p.full_name,
         coalesce((select sum(e.instructor_usd) from public.earnings e where e.instructor_id = p.id), 0) as earned_usd,
         coalesce((select sum(x.amount_usd)     from public.payouts  x where x.instructor_id = p.id), 0) as paid_usd,
         coalesce((select sum(e.instructor_usd) from public.earnings e where e.instructor_id = p.id), 0)
       - coalesce((select sum(x.amount_usd)     from public.payouts  x where x.instructor_id = p.id), 0) as balance_usd
  from public.profiles p
  where p.role in ('instructor', 'admin');
grant select on public.instructor_balances to authenticated;

create table public.certificates (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  holder_name   text not null,
  course_title  text not null,
  issued_at     timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ═══════════════════════════ Triggers ═══════════════════════════

-- New auth user → profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, locale)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients cannot promote themselves or change their revenue share
create or replace function public.guard_profile() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.role := old.role;
    new.revenue_share := old.revenue_share;
  end if;
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Instructors submit for review; only admins publish, feature, or reassign
create or replace function public.guard_course() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.status = 'published' and old.status <> 'published' then
      new.status := 'review';
    end if;
    new.instructor_id  := old.instructor_id;
    new.featured       := old.featured;
    new.students_count := old.students_count;
    new.rating_avg     := old.rating_avg;
    new.rating_count   := old.rating_count;
    new.lessons_count  := old.lessons_count;
    new.duration_sec   := old.duration_sec;
  end if;
  if new.status = 'published' and old.status <> 'published' then
    new.published_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_course before update on public.courses
  for each row execute function public.guard_course();

create or replace function public.guard_course_insert() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := 'draft';
    new.featured := false;
    new.students_count := 0; new.rating_avg := 0; new.rating_count := 0;
    new.lessons_count := 0; new.duration_sec := 0;
  end if;
  return new;
end $$;
create trigger guard_course_insert before insert on public.courses
  for each row execute function public.guard_course_insert();

-- Only course owners/admins may pin discussion posts
create or replace function public.guard_comment() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.can_edit_course(new.course_id) then
    if tg_op = 'INSERT' then new.pinned := false; else new.pinned := old.pinned; end if;
  end if;
  return new;
end $$;
create trigger guard_comment before insert or update on public.comments
  for each row execute function public.guard_comment();

-- Keep course stats fresh
create or replace function public.refresh_course_stats(p_course uuid) returns void
language sql security definer set search_path = public as $$
  update courses c set
    students_count = (select count(*) from enrollments e where e.course_id = c.id),
    rating_avg     = coalesce((select round(avg(r.rating)::numeric, 2) from reviews r where r.course_id = c.id), 0),
    rating_count   = (select count(*) from reviews r where r.course_id = c.id),
    lessons_count  = (select count(*) from lessons l where l.course_id = c.id),
    duration_sec   = coalesce((select sum(l.duration_sec) from lessons l where l.course_id = c.id), 0)
  where c.id = p_course;
$$;
revoke execute on function public.refresh_course_stats(uuid) from public, anon, authenticated;

create or replace function public.trg_course_stats() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then perform refresh_course_stats(new.course_id); end if;
  if tg_op in ('DELETE', 'UPDATE') then perform refresh_course_stats(old.course_id); end if;
  return null;
end $$;
create trigger stats_enrollments after insert or delete on public.enrollments for each row execute function public.trg_course_stats();
create trigger stats_reviews     after insert or update or delete on public.reviews for each row execute function public.trg_course_stats();
create trigger stats_lessons     after insert or update or delete on public.lessons for each row execute function public.trg_course_stats();

-- lessons.course_id must match its module
create or replace function public.sync_lesson_course() returns trigger
language plpgsql as $$
begin
  select course_id into new.course_id from public.modules where id = new.module_id;
  return new;
end $$;
create trigger sync_lesson_course before insert or update of module_id on public.lessons
  for each row execute function public.sync_lesson_course();

create or replace function public.sync_media_course() returns trigger
language plpgsql as $$
begin
  select course_id into new.course_id from public.lessons where id = new.lesson_id;
  return new;
end $$;
create trigger sync_media_course before insert or update on public.lesson_media
  for each row execute function public.sync_media_course();

-- ═══════════════════════════ RPC functions ═══════════════════════════

-- Price of a course in a currency, using the admin-controlled exchange rate
create or replace function public.course_price(p_course uuid, p_currency text)
returns table (amount numeric, fx_rate numeric, amount_usd numeric)
language sql stable security definer set search_path = public as $$
  select case when p_currency = 'LYD'
              then coalesce(c.price_lyd, round(c.price_usd * s.usd_to_lyd, 2))
              else c.price_usd end,
         case when p_currency = 'LYD' then s.usd_to_lyd else 1 end,
         c.price_usd
  from courses c cross join app_settings s
  where c.id = p_course;
$$;

-- Marks an order paid, enrolls the student and books the revenue split (idempotent).
create or replace function public.fulfill_order(p_order uuid, p_txn text default null, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  o orders%rowtype;
  v_share numeric;
  v_instructor uuid;
begin
  select * into o from orders where id = p_order for update;
  if not found then raise exception 'order_not_found'; end if;
  if o.status = 'paid' then return; end if;

  update orders set status = 'paid', paid_at = now(),
         gateway_txn = coalesce(p_txn, gateway_txn), raw = coalesce(p_raw, raw)
   where id = p_order;

  insert into enrollments (user_id, course_id, source, order_id)
  values (o.user_id, o.course_id, 'purchase', o.id)
  on conflict (user_id, course_id) do nothing;

  select c.instructor_id, coalesce(p.revenue_share, s.default_instructor_share)
    into v_instructor, v_share
    from courses c join profiles p on p.id = c.instructor_id cross join app_settings s
   where c.id = o.course_id;

  insert into earnings (order_id, instructor_id, course_id, gross_usd, share_percent, instructor_usd, platform_usd)
  values (o.id, v_instructor, o.course_id, o.amount_usd, v_share,
          round(o.amount_usd * v_share / 100, 2),
          o.amount_usd - round(o.amount_usd * v_share / 100, 2))
  on conflict (order_id) do nothing;
end $$;
revoke execute on function public.fulfill_order(uuid, text, jsonb) from public, anon, authenticated;
grant  execute on function public.fulfill_order(uuid, text, jsonb) to service_role;

-- Free courses: enroll directly
create or replace function public.enroll_free(p_course uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from courses where id = p_course and status = 'published' and price_usd = 0) then
    raise exception 'course_not_free';
  end if;
  insert into enrollments (user_id, course_id, source) values (auth.uid(), p_course, 'free')
  on conflict (user_id, course_id) do nothing;
end $$;
grant execute on function public.enroll_free(uuid) to authenticated;

-- Bank transfer: server computes the amount; the client only uploads the receipt
create or replace function public.create_bank_transfer_order(p_course uuid, p_currency text, p_receipt_path text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_price record;
  v_invoice text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_currency not in ('USD', 'LYD') then raise exception 'bad_currency'; end if;
  if p_receipt_path is null or split_part(p_receipt_path, '/', 1) <> auth.uid()::text then raise exception 'bad_receipt'; end if;
  if not exists (select 1 from courses where id = p_course and status = 'published' and price_usd > 0) then raise exception 'course_unavailable'; end if;
  if exists (select 1 from enrollments where course_id = p_course and user_id = auth.uid()) then raise exception 'already_enrolled'; end if;

  select * into v_price from course_price(p_course, p_currency);
  insert into orders (user_id, course_id, method, status, amount, currency, fx_rate, amount_usd, receipt_path)
  values (auth.uid(), p_course, 'bank_transfer', 'awaiting_review', v_price.amount, p_currency, v_price.fx_rate, v_price.amount_usd, p_receipt_path)
  returning invoice_no into v_invoice;
  return v_invoice;
end $$;
grant execute on function public.create_bank_transfer_order(uuid, text, text) to authenticated;

create or replace function public.review_bank_transfer(p_order uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update orders set reviewed_by = auth.uid(), admin_note = p_note where id = p_order and method = 'bank_transfer';
  if p_approve then
    perform fulfill_order(p_order, 'manual:' || auth.uid()::text, null);
  else
    update orders set status = 'failed' where id = p_order and status = 'awaiting_review';
  end if;
end $$;
grant execute on function public.review_bank_transfer(uuid, boolean, text) to authenticated;

-- Certificate once every lesson is complete
create or replace function public.issue_certificate(p_course uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_total int; v_done int; v_code text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from enrollments where user_id = auth.uid() and course_id = p_course) then raise exception 'not_enrolled'; end if;
  select count(*) into v_total from lessons where course_id = p_course;
  select count(*) into v_done from lesson_progress where user_id = auth.uid() and course_id = p_course and completed_at is not null;
  if v_total = 0 or v_done < v_total then raise exception 'course_incomplete'; end if;

  insert into certificates (user_id, course_id, holder_name, course_title)
  select auth.uid(), c.id, p.full_name, coalesce(c.title_ar, c.title_en)
    from courses c, profiles p where c.id = p_course and p.id = auth.uid()
  on conflict (user_id, course_id) do nothing;
  select code into v_code from certificates where user_id = auth.uid() and course_id = p_course;
  return v_code;
end $$;
grant execute on function public.issue_certificate(uuid) to authenticated;

-- ═══════════════════════════ Row Level Security ═══════════════════════════
alter table public.app_settings    enable row level security;
alter table public.profiles        enable row level security;
alter table public.courses         enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.lesson_media    enable row level security;
alter table public.enrollments     enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.reviews         enable row level security;
alter table public.comments        enable row level security;
alter table public.orders          enable row level security;
alter table public.earnings        enable row level security;
alter table public.payouts         enable row level security;
alter table public.certificates    enable row level security;

-- settings
create policy settings_read  on public.app_settings for select using (true);
create policy settings_admin on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

-- profiles (public data is served through the public_profiles view)
create policy profiles_self_read   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- courses
create policy courses_read   on public.courses for select using (status = 'published' or instructor_id = auth.uid() or public.is_admin());
create policy courses_insert on public.courses for insert with check (public.is_instructor() and (instructor_id = auth.uid() or public.is_admin()));
create policy courses_update on public.courses for update using (instructor_id = auth.uid() or public.is_admin());
create policy courses_delete on public.courses for delete using (public.is_admin() or (instructor_id = auth.uid() and status = 'draft'));

-- modules & lessons: readable when the course is visible, writable by its owner
create policy modules_read  on public.modules for select using (public.course_is_visible(course_id));
create policy modules_write on public.modules for all    using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));
create policy lessons_read  on public.lessons for select using (public.course_is_visible(course_id));
create policy lessons_write on public.lessons for all    using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));

-- media: enrolled students, owners, admins — or free-preview lessons of published courses
create policy media_read on public.lesson_media for select using (
  public.has_course_access(course_id)
  or exists (select 1 from public.lessons l join public.courses c on c.id = l.course_id
             where l.id = lesson_media.lesson_id and l.is_preview and c.status = 'published')
);
create policy media_write on public.lesson_media for all using (public.can_edit_course(course_id)) with check (public.can_edit_course(course_id));

-- enrollments (created only by server functions)
create policy enrollments_read on public.enrollments for select
  using (user_id = auth.uid() or public.is_admin() or public.can_edit_course(course_id));

-- progress
create policy progress_own on public.lesson_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_course_access(course_id));

-- reviews
create policy reviews_read   on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (user_id = auth.uid() and exists (select 1 from public.enrollments e where e.course_id = reviews.course_id and e.user_id = auth.uid()));
create policy reviews_update on public.reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_delete on public.reviews for delete using (user_id = auth.uid() or public.is_admin());

-- comments
create policy comments_read   on public.comments for select using (public.has_course_access(course_id));
create policy comments_insert on public.comments for insert with check (user_id = auth.uid() and public.has_course_access(course_id));
create policy comments_update on public.comments for update using (user_id = auth.uid() or public.can_edit_course(course_id));
create policy comments_delete on public.comments for delete using (user_id = auth.uid() or public.can_edit_course(course_id));

-- orders (inserted by Edge Functions / RPC only)
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_admin());

-- money
create policy earnings_read on public.earnings for select using (instructor_id = auth.uid() or public.is_admin());
create policy payouts_read  on public.payouts  for select using (instructor_id = auth.uid() or public.is_admin());
create policy payouts_admin on public.payouts  for insert with check (public.is_admin());

-- certificates: public verification by code
create policy certificates_read on public.certificates for select using (true);

-- ═══════════════════════════ Storage ═══════════════════════════
insert into storage.buckets (id, name, public) values
  ('receipts', 'receipts', false),
  ('covers',   'covers',   true)
on conflict (id) do nothing;

create policy receipts_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy receipts_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy covers_read   on storage.objects for select using (bucket_id = 'covers');
create policy covers_write  on storage.objects for insert to authenticated with check (bucket_id = 'covers' and public.is_instructor());
create policy covers_update on storage.objects for update to authenticated using (bucket_id = 'covers' and public.is_instructor());
