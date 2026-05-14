-- ============================================================
-- WEST 1 Sales Lab — Schema inicial
-- ============================================================

-- Perfis de usuário (estende auth.users)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text not null default 'consultant' check (role in ('master', 'consultant')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Personas de estudante (criadas pelos masters, visíveis por todos)
create table if not exists public.student_profiles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  age integer not null check (age > 0 and age < 120),
  gender text not null check (gender in ('Male', 'Female', 'Other')),
  destination text not null,
  marital_status text not null check (marital_status in ('Single', 'Married', 'Other')),
  personality text not null,
  profession text,
  avatar_url text,
  ai_voice_tone text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cenários de atendimento (criados pelos masters)
create table if not exists public.scenarios (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  west1_expectation text not null,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessões de role-play
create table if not exists public.roleplay_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  student_profile_id uuid references public.student_profiles on delete set null,
  scenario_id uuid references public.scenarios on delete set null,
  student_profile_snapshot jsonb,
  scenario_snapshot jsonb,
  transcript text,
  score decimal(3,1) check (score >= 0 and score <= 5),
  feedback_positive text,
  feedback_improvements text,
  duration_seconds integer,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.user_profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.roleplay_sessions enable row level security;

-- user_profiles
create policy "Perfis visíveis por todos autenticados"
  on public.user_profiles for select
  using (auth.role() = 'authenticated');

create policy "Usuário insere próprio perfil"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on public.user_profiles for update
  using (auth.uid() = id);

-- student_profiles
create policy "Autenticados visualizam personas"
  on public.student_profiles for select
  using (auth.role() = 'authenticated');

create policy "Masters gerenciam personas"
  on public.student_profiles for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'master'
    )
  );

-- scenarios
create policy "Autenticados visualizam cenários"
  on public.scenarios for select
  using (auth.role() = 'authenticated');

create policy "Masters gerenciam cenários"
  on public.scenarios for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'master'
    )
  );

-- roleplay_sessions
create policy "Consultores veem próprias sessões"
  on public.roleplay_sessions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'master'
    )
  );

create policy "Consultores inserem próprias sessões"
  on public.roleplay_sessions for insert
  with check (auth.uid() = user_id);

create policy "Consultores atualizam próprias sessões"
  on public.roleplay_sessions for update
  using (auth.uid() = user_id);

-- ============================================================
-- Leaderboard view
-- ============================================================

create or replace view public.leaderboard as
select
  up.id,
  up.full_name,
  count(rs.id)::integer as total_sessions,
  coalesce(round(avg(rs.score)::numeric, 1), 0) as average_score,
  max(rs.score) as best_score
from public.user_profiles up
left join public.roleplay_sessions rs
  on rs.user_id = up.id and rs.score is not null
group by up.id, up.full_name
order by average_score desc, total_sessions desc;

-- ============================================================
-- Trigger: criar perfil ao registrar usuário
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'consultant'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Trigger: updated_at automático
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_student_profiles
  before update on public.student_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at_scenarios
  before update on public.scenarios
  for each row execute procedure public.set_updated_at();

-- FK adicional para permitir join via PostgREST entre roleplay_sessions e user_profiles
alter table public.roleplay_sessions
  add constraint roleplay_sessions_user_profiles_fk
  foreign key (user_id) references public.user_profiles(id) on delete cascade;
