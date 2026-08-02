-- Identifiant utilisateur interne. Jamais le SteamID64 directement (voir CLAUDE.md).
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Liaison de plateforme : rattache un identifiant externe (ex: SteamID64) à un user_id interne.
-- Pense pour accueillir d'autres plateformes plus tard (Epic, GOG...) sans migration.
create table if not exists platform_links (
  user_id uuid not null references users(id) on delete cascade,
  platform text not null,
  platform_id text not null,
  created_at timestamptz not null default now(),
  primary key (platform, platform_id)
);

create index if not exists platform_links_user_id_idx on platform_links (user_id);

-- Cache de la bibliothèque Steam. fetched_at sert de TTL (vérifié à la lecture, pas d'expiration DB).
create table if not exists library_cache (
  user_id uuid primary key references users(id) on delete cascade,
  games jsonb not null,
  fetched_at timestamptz not null default now()
);
