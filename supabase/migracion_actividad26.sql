-- =====================================================================
--  Actividad 26 · Coordenadas GPS en los reportes
--  Ejecutar UNA vez en: Supabase > SQL Editor > New query > Run
--  (Las políticas RLS existentes siguen aplicando a estas columnas.)
-- =====================================================================
alter table public.reportes
  add column if not exists latitud     double precision,
  add column if not exists longitud    double precision,
  add column if not exists precision_m real;

alter table public.reportes drop constraint if exists reportes_coordenadas_validas;
alter table public.reportes add constraint reportes_coordenadas_validas check (
  (latitud is null and longitud is null)
  or (latitud between -90 and 90 and longitud between -180 and 180)
);

alter table public.reportes drop constraint if exists reportes_precision_valida;
alter table public.reportes add constraint reportes_precision_valida
  check (precision_m is null or precision_m >= 0);
