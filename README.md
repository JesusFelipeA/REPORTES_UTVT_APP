# Reportes UTVT

Aplicación móvil para registrar y dar seguimiento a reportes de mantenimiento de infraestructura universitaria.
Actividad 22 · Desarrollo Móvil Integral · Jesus Felipe Aviles

**Stack:** React Native CLI 0.88 (TypeScript) · Supabase Auth · API REST (PostgREST) · PostgreSQL con Row Level Security · Supabase Storage (bucket privado)

## Funcionalidades

| Requisito | Implementación |
|---|---|
| Autenticación remota | Supabase Auth (correo y contraseña); la sesión JWT se guarda cifrada con `react-native-keychain` (Keychain / Keystore) |
| Registro de reportes | Categoría, ubicación, descripción y fecha (la asigna el servidor) → `POST /rest/v1/reportes` |
| Consulta de reportes | `GET /rest/v1/reportes`; RLS devuelve solo los reportes autorizados |
| Evidencia fotográfica | Cámara o galería (`react-native-image-picker`) → bucket privado `evidencias/<uid>/<uuid>.jpg`; se muestra con URL firmada de 60 min |
| Seguridad | RLS por usuario y rol, validación cliente + servidor, sin llaves administrativas en la app, bloqueo tras 5 intentos de login |
| Sin conexión | Mensaje claro, borrador guardado en el teléfono, reenvío automático al volver internet, lista en caché |

## 1. Configurar Supabase (5 min)

1. Crea un proyecto gratis en <https://supabase.com>.
2. **SQL Editor → New query**: pega todo `supabase/schema.sql` y pulsa **Run**. Crea tablas, triggers, políticas RLS y el bucket privado.
3. **Authentication → Users → Add user** (marca *Auto Confirm User*). Crea al menos:
   - `alumno1@utvt.edu.mx`
   - `alumno2@utvt.edu.mx`
   - `mantenimiento@utvt.edu.mx`
4. Para dar rol de mantenimiento:
   ```sql
   update public.perfiles set rol = 'mantenimiento'
   where id = (select id from auth.users where email = 'mantenimiento@utvt.edu.mx');
   ```
5. **Project Settings → API**: copia la *Project URL* y la llave **anon / publishable** en `src/config.ts`.
   ⚠️ Nunca uses la llave `service_role` en la app. (`src/config.ts` está en `.gitignore`; la plantilla es `src/config.example.ts`.)

## 2. Ejecutar la app

Requisitos: Node 22.11+, JDK 17, Android Studio con un emulador o un teléfono con depuración USB.

```bash
npm install
npm start            # Metro
npm run android      # en otra terminal
```

iOS (solo macOS): `cd ios && bundle install && bundle exec pod install && cd ..` y luego `npm run ios`.

Pruebas unitarias de validación: `npm test`.

## 3. Guion de pruebas (Parte 5 del documento)

| # | Prueba | Cómo hacerla en la app | Resultado esperado |
|---|---|---|---|
| P1 | Autenticación correcta | Entrar con `alumno1` | Pantalla "Mis reportes" |
| P2 | Autenticación incorrecta | Contraseña errónea (5 veces) | "Correo o contraseña incorrectos" y luego bloqueo de 60 s |
| P3 | Registro de reporte | Nuevo reporte con foto | "Reporte #N registrado…", aparece como *Pendiente* |
| P4 | Datos inválidos | Enviar sin categoría/ubicación | Campos marcados en rojo, no se envía |
| P5 | Consulta | Ver la lista y abrir un reporte | Solo tus reportes; foto con enlace temporal |
| P6 | Acceso no autorizado | Anota el folio de un reporte de `alumno2`, entra como `alumno1` y búscalo con **Buscar por folio** | "Reporte #N no encontrado o sin permiso para verlo" |
| P7 | Sin conexión | Activa modo avión y envía un reporte / desliza para actualizar | Aviso de sin conexión, borrador guardado; al quitar el modo avión se envía solo |

Prueba P6 directo contra la API (opcional):

```bash
curl "https://TU-PROYECTO.supabase.co/rest/v1/reportes?id=eq.5" \
  -H "apikey: TU_LLAVE_ANON" -H "Authorization: Bearer TOKEN_DE_ALUMNO1"
# Respuesta: []   → RLS no devuelve reportes de otro usuario
```

## Estructura

```
index.js                     Polyfills (random values, URL) y registro de la app
App.tsx                      Sesión, SafeArea y navegación entre pantallas
src/config.ts                URL y llave anon de Supabase (no se versiona)
src/lib/supabase.ts          Cliente Supabase + sesión cifrada en Keychain/Keystore
src/lib/api.ts               Operaciones de integración, timeouts, borradores y caché
src/lib/validacion.ts        Validaciones previas al envío
src/screens/                 Login, Mis reportes, Nuevo reporte, Detalle
supabase/schema.sql          Tablas, triggers, RLS y bucket privado
__tests__/                   Pruebas unitarias (Jest)
```
