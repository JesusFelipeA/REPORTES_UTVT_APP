-- =====================================================================
--  Reportes UTVT · Esquema de base de datos, RLS y Storage (Supabase)
--  Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- ---------- 1. Perfiles y roles ----------
create table if not exists public.perfiles (
  id      uuid primary key references auth.users (id) on delete cascade,
  nombre  text,
  rol     text not null default 'estudiante'
          check (rol in ('estudiante', 'administrativo', 'mantenimiento'))
);

-- Crea el perfil automáticamente cuando se registra un usuario en Auth
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ¿El usuario autenticado tiene rol de mantenimiento?
create or replace function public.es_mantenimiento()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'mantenimiento');
$$;

-- ---------- 2. Reportes ----------
create table if not exists public.reportes (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria   text not null
              check (categoria in ('computo', 'iluminacion', 'mobiliario', 'internet', 'electrica')),
  ubicacion   text not null check (char_length(trim(ubicacion)) between 3 and 120),
  descripcion text not null check (char_length(trim(descripcion)) between 10 and 500),
  foto_path   text,
  estado      text not null default 'Pendiente'
              check (estado in ('Pendiente', 'En proceso', 'Resuelto')),
  creado_en   timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists reportes_usuario_idx on public.reportes (usuario_id, creado_en desc);

-- El servidor decide el dueño y la fecha: el cliente no puede falsificarlos
create or replace function public.proteger_reporte()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.usuario_id := auth.uid();
    new.creado_en  := now();
    new.estado     := 'Pendiente';
  else
    new.usuario_id := old.usuario_id;
    new.creado_en  := old.creado_en;
  end if;
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists proteger_reporte on public.reportes;
create trigger proteger_reporte
  before insert or update on public.reportes
  for each row execute function public.proteger_reporte();

-- ---------- 3. Row Level Security ----------
alter table public.perfiles enable row level security;
alter table public.reportes enable row level security;

drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio" on public.perfiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "ver reportes propios o mantenimiento" on public.reportes;
create policy "ver reportes propios o mantenimiento" on public.reportes
  for select to authenticated
  using (usuario_id = auth.uid() or public.es_mantenimiento());

drop policy if exists "crear reportes propios" on public.reportes;
create policy "crear reportes propios" on public.reportes
  for insert to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "mantenimiento actualiza estado" on public.reportes;
create policy "mantenimiento actualiza estado" on public.reportes
  for update to authenticated
  using (public.es_mantenimiento())
  with check (public.es_mantenimiento());
-- Sin política DELETE: nadie puede borrar reportes desde la app.

-- ---------- 4. Storage: bucket privado de evidencias ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png'];

-- Cada usuario solo sube a su carpeta: evidencias/<uid>/archivo.jpg
drop policy if exists "subir evidencia propia" on storage.objects;
create policy "subir evidencia propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "ver evidencia propia o mantenimiento" on storage.objects;
create policy "ver evidencia propia o mantenimiento" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.es_mantenimiento()));
