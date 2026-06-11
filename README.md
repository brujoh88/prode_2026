# ⚽ Prode Mundial 2026

Prototipo de pronósticos del Mundial para un grupo cerrado. Sin dinero de por
medio: el objetivo es validar la mecánica (ritual grupal + tabla de posiciones).

**Stack:** Next.js 16 (App Router) · Supabase (auth con magic link + Postgres con
RLS) · football-data.org (fixture y resultados).

## Cómo funciona

- Entrás con tu email (magic link, sin contraseña).
- Elegís tu apodo: es **único** por persona (índice único sobre `lower(display_name)`).
- Cargás tu pronóstico por partido **antes del saque** (lo garantiza RLS, no la UI).
- No ves los pronósticos ajenos hasta que el partido arranca (RLS también).
- Los resultados se sincronizan solos cada 15 min (ver [Sincronización](#sincronización-de-resultados)).
- Al terminar cada partido, un trigger de Postgres recalcula los puntos:
  **3** resultado exacto · **1** acierto de signo (1X2) · **0** errado.
- `/grupos` muestra la tabla de posiciones de cada zona + su fixture.
- `/tabla` muestra el ranking del grupo (vista `leaderboard`).

## Puesta en marcha

1. **Claves pendientes en `.env.local`** (las dos que dicen `PEGAR_ACA`):
   - `SUPABASE_SECRET_KEY`: dashboard → [Settings → API keys](https://supabase.com/dashboard/project/bflbtgoheetkhvkrfvtz/settings/api-keys).
   - `FOOTBALL_DATA_TOKEN`: registro gratis en [football-data.org](https://www.football-data.org/client/register) (el plan free incluye el Mundial, ~10 req/min — de sobra).

2. **Levantar la app:**

   ```bash
   npm run dev
   ```

3. **Cargar el fixture a mano** (opcional; en producción ya se sincroniza solo):

   ```bash
   curl "http://localhost:3000/api/sync?secret=$(grep SYNC_SECRET .env.local | cut -d= -f2)"
   ```

## Sincronización de resultados

El fixture y los resultados salen de **football-data.org** (competición `WC`).
Hay dos caminos para traerlos, con la misma lógica de mapeo:

- **Automático (producción):** una **Supabase Edge Function** (`sync-matches`) que
  un job de **`pg_cron`** dispara **cada 15 min** (`*/15 * * * *`). Corre dentro de
  Supabase, así que no depende de que la app Next.js esté levantada ni deployada.
  El cron invoca la función con `net.http_post`, autenticando con el *anon key*
  (guardado en Vault como `sync_anon_key`); la función, por dentro, escribe en
  `matches` con el service role.
- **Manual (desarrollo):** el endpoint `GET/POST /api/sync` de la app, protegido
  por `SYNC_SECRET` (ver el `curl` de arriba).

### Secret de la Edge Function

La función necesita el token de football-data como secret de Supabase
(las env vars `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` las inyecta el runtime):

```bash
supabase secrets set FOOTBALL_DATA_TOKEN="<token>" --project-ref bflbtgoheetkhvkrfvtz
```

(O por UI: Dashboard → Edge Functions → `sync-matches` → **Manage secrets**.)
Sin este secret la función responde `500: Falta el secret FOOTBALL_DATA_TOKEN`.

### Operar y verificar el cron

```sql
-- Ver el job
select jobid, schedule, jobname, active from cron.job;

-- Últimas corridas
select * from cron.job_run_details order by start_time desc limit 10;

-- Pausar / reanudar / borrar
select cron.unschedule('sync-matches-cada-15min');
```

> **Límites del plan free de football-data.org:** 10 req/min y resultados con
> retraso ("scores delayed"). 96 sync/día quedan muy por debajo del tope, y el
> retraso no molesta porque el scoring solo corre al pasar el partido a `FINISHED`.

## Estructura

| Ruta | Qué es |
|---|---|
| `src/app/page.tsx` | Partidos: lo de hoy + próximos 5 con "Ver todos" |
| `src/app/grupos/page.tsx` | Tabla de posiciones por grupo + fixture de la zona |
| `src/app/tabla/page.tsx` | Tabla general del ranking |
| `src/app/apodo/page.tsx` | Elegir/cambiar el apodo (único por persona) |
| `src/app/login/page.tsx` | Login por magic link |
| `src/app/auth/callback/route.ts` | Intercambio del código del magic link por sesión |
| `src/app/api/sync/route.ts` | Sync manual (dev) desde football-data.org |
| `src/components/Header.tsx` | Nav sticky con blur al scrollear + sol y estrellas |
| `src/components/MatchList.tsx` | Agrupado por día + colapso "próximos 5 / ver todos" |
| `src/components/GroupView.tsx` | Selector de grupo + cálculo de la tabla de posiciones |
| `src/components/PredictionRow.tsx` | Carga del pronóstico + confeti al clavar el +3 |
| `supabase/functions/sync-matches/` | Edge Function de sync (la que dispara el cron) |
| `src/proxy.ts` | Refresco de sesión + protección de rutas (Next 16) |
| `src/lib/supabase/` | Clients browser/server de Supabase |

## Base de datos (Supabase: `mundial-pronosticos`)

- `profiles` — se crea solo al registrarse (trigger sobre `auth.users`).
  `display_name` es único: índice `profiles_display_name_unique` sobre
  `lower(display_name)`. Al chocar, el upsert devuelve `23505` y la UI avisa.
- `matches` — fixture; solo escribe el service role (Edge Function `sync-matches`
  vía cron, o `/api/sync` a mano).
- `predictions` — RLS: crear/editar solo lo propio y solo antes del kickoff;
  ver lo ajeno solo con el partido iniciado.
- `leaderboard` — vista agregada con puntos, exactos y signos.
- Scoring: `calculate_points()` + trigger `trg_recalc_points` sobre `matches`.
- Sync automático: extensiones `pg_cron` + `pg_net`, secret `sync_anon_key` en
  Vault y job `sync-matches-cada-15min` (migraciones `enable_pg_cron_and_pg_net`
  y `sync_matches_cron`).
