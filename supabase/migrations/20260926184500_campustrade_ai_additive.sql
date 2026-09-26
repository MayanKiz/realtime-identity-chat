-- CampusTrade AI additive domain model
-- IMPORTANT: This migration is intentionally non-destructive. Apply only after
-- confirming the correct Supabase project and reviewing RLS with real auth users.

create table if not exists public.ct_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  legacy_user_id uuid unique references public.users(id) on delete set null,
  display_name text not null,
  avatar_url text,
  bio text,
  campus text,
  dorm text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_marketplace_items (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.ct_profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  condition text not null,
  dorm text,
  seller_name text not null,
  description text not null check (char_length(description) between 1 and 2000),
  image_urls jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft','published','reserved','sold','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_marketplace_saved (
  profile_id uuid not null references public.ct_profiles(id) on delete cascade,
  item_id uuid not null references public.ct_marketplace_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);

create table if not exists public.ct_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid references public.ct_profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) between 1 and 3000),
  category text not null,
  budget numeric(10,2) not null check (budget >= 0),
  deadline timestamptz,
  attachment_urls jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  assigned_profile_id uuid references public.ct_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_task_offers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.ct_tasks(id) on delete cascade,
  profile_id uuid not null references public.ct_profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  message text not null check (char_length(message) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, profile_id)
);

create table if not exists public.ct_conversations (
  id uuid primary key default gen_random_uuid(),
  context_type text not null check (context_type in ('direct','marketplace','task')),
  context_id uuid,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_conversation_members (
  conversation_id uuid not null references public.ct_conversations(id) on delete cascade,
  profile_id uuid not null references public.ct_profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, profile_id)
);

create table if not exists public.ct_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ct_conversations(id) on delete cascade,
  sender_profile_id uuid references public.ct_profiles(id) on delete set null,
  content text,
  attachment_urls jsonb not null default '[]'::jsonb,
  message_type text not null default 'text' check (message_type in ('text','file','voice')),
  created_at timestamptz not null default now()
);

create table if not exists public.ct_companions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.ct_profiles(id) on delete cascade,
  name text not null default 'Nova',
  personality text not null default 'Warm, practical, and emotionally aware.',
  tone text not null default 'supportive',
  reply_length text not null default 'balanced',
  emoji_level text not null default 'low',
  system_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_ai_conversations (
  id uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.ct_companions(id) on delete cascade,
  title text not null default 'New conversation',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ct_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ct_ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ct_knowledge_files (
  id uuid primary key default gen_random_uuid(),
  companion_id uuid not null references public.ct_companions(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_path text,
  extracted_text text,
  status text not null default 'ready' check (status in ('processing','ready','failed')),
  created_at timestamptz not null default now()
);

create index if not exists ct_marketplace_items_created_idx on public.ct_marketplace_items (created_at desc);
create index if not exists ct_marketplace_items_category_idx on public.ct_marketplace_items (category);
create index if not exists ct_tasks_status_deadline_idx on public.ct_tasks (status, deadline);
create index if not exists ct_conversation_messages_created_idx on public.ct_conversation_messages (conversation_id, created_at);
create index if not exists ct_ai_messages_created_idx on public.ct_ai_messages (conversation_id, created_at);

-- Enable RLS on all new tables. Policies are intentionally scoped to profiles
-- linked to auth.uid(); existing custom-PIN users remain untouched until linked.
alter table public.ct_profiles enable row level security;
alter table public.ct_marketplace_items enable row level security;
alter table public.ct_marketplace_saved enable row level security;
alter table public.ct_tasks enable row level security;
alter table public.ct_task_offers enable row level security;
alter table public.ct_conversations enable row level security;
alter table public.ct_conversation_members enable row level security;
alter table public.ct_conversation_messages enable row level security;
alter table public.ct_companions enable row level security;
alter table public.ct_ai_conversations enable row level security;
alter table public.ct_ai_messages enable row level security;
alter table public.ct_knowledge_files enable row level security;

create or replace function public.ct_my_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.ct_profiles where auth_user_id = auth.uid() limit 1
$$;

create policy "ct profiles are visible to signed in users" on public.ct_profiles for select to authenticated using (true);
create policy "ct users manage their profile" on public.ct_profiles for all to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "ct published listings are public" on public.ct_marketplace_items for select using (status = 'published' or owner_profile_id = public.ct_my_profile_id());
create policy "ct users create listings" on public.ct_marketplace_items for insert to authenticated with check (owner_profile_id = public.ct_my_profile_id());
create policy "ct owners update listings" on public.ct_marketplace_items for update to authenticated using (owner_profile_id = public.ct_my_profile_id()) with check (owner_profile_id = public.ct_my_profile_id());
create policy "ct owners remove listings" on public.ct_marketplace_items for delete to authenticated using (owner_profile_id = public.ct_my_profile_id());

create policy "ct users manage saved listings" on public.ct_marketplace_saved for all to authenticated using (profile_id = public.ct_my_profile_id()) with check (profile_id = public.ct_my_profile_id());
create policy "ct tasks are visible" on public.ct_tasks for select using (status <> 'cancelled' or owner_profile_id = public.ct_my_profile_id());
create policy "ct users create tasks" on public.ct_tasks for insert to authenticated with check (owner_profile_id = public.ct_my_profile_id());
create policy "ct task owners update tasks" on public.ct_tasks for update to authenticated using (owner_profile_id = public.ct_my_profile_id()) with check (owner_profile_id = public.ct_my_profile_id());
create policy "ct users view task offers" on public.ct_task_offers for select to authenticated using (profile_id = public.ct_my_profile_id() or exists (select 1 from public.ct_tasks t where t.id = task_id and t.owner_profile_id = public.ct_my_profile_id()));
create policy "ct users create offers" on public.ct_task_offers for insert to authenticated with check (profile_id = public.ct_my_profile_id());
create policy "ct offer owners update offers" on public.ct_task_offers for update to authenticated using (profile_id = public.ct_my_profile_id() or exists (select 1 from public.ct_tasks t where t.id = task_id and t.owner_profile_id = public.ct_my_profile_id()));

create policy "ct conversation members can view conversations" on public.ct_conversations for select to authenticated using (exists (select 1 from public.ct_conversation_members m where m.conversation_id = id and m.profile_id = public.ct_my_profile_id()));
create policy "ct members view membership" on public.ct_conversation_members for select to authenticated using (profile_id = public.ct_my_profile_id());
create policy "ct members view messages" on public.ct_conversation_messages for select to authenticated using (exists (select 1 from public.ct_conversation_members m where m.conversation_id = conversation_id and m.profile_id = public.ct_my_profile_id()));
create policy "ct members send messages" on public.ct_conversation_messages for insert to authenticated with check (sender_profile_id = public.ct_my_profile_id() and exists (select 1 from public.ct_conversation_members m where m.conversation_id = conversation_id and m.profile_id = public.ct_my_profile_id()));

create policy "ct users manage companions" on public.ct_companions for all to authenticated using (profile_id = public.ct_my_profile_id()) with check (profile_id = public.ct_my_profile_id());
create policy "ct users manage ai conversations" on public.ct_ai_conversations for all to authenticated using (exists (select 1 from public.ct_companions c where c.id = companion_id and c.profile_id = public.ct_my_profile_id())) with check (exists (select 1 from public.ct_companions c where c.id = companion_id and c.profile_id = public.ct_my_profile_id()));
create policy "ct users manage ai messages" on public.ct_ai_messages for all to authenticated using (exists (select 1 from public.ct_ai_conversations c join public.ct_companions cp on cp.id = c.companion_id where c.id = conversation_id and cp.profile_id = public.ct_my_profile_id())) with check (exists (select 1 from public.ct_ai_conversations c join public.ct_companions cp on cp.id = c.companion_id where c.id = conversation_id and cp.profile_id = public.ct_my_profile_id()));
create policy "ct users manage knowledge files" on public.ct_knowledge_files for all to authenticated using (exists (select 1 from public.ct_companions c where c.id = companion_id and c.profile_id = public.ct_my_profile_id())) with check (exists (select 1 from public.ct_companions c where c.id = companion_id and c.profile_id = public.ct_my_profile_id()));
