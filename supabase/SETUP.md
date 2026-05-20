# Setup Supabase — MotoSmart Studio

## Paso 1: Crear proyecto Supabase

1. Ve a https://supabase.com y crea una cuenta (es gratis)
2. Clic en **New Project**
3. Nombre: `motosmart-studio`
4. Región: `South America (São Paulo)` — más cercana a Colombia
5. Contraseña de DB: anota una segura
6. Clic en **Create new project** y espera ~2 minutos

---

## Paso 2: Obtener credenciales

1. Ve a **Settings → API**
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (cuidado, no exponer en frontend) → `SUPABASE_SERVICE_ROLE_KEY`
3. Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MotoSmart Studio
```

---

## Paso 3: Ejecutar el schema

1. Ve a **SQL Editor** en el dashboard de Supabase
2. Crea una nueva query
3. Pega el contenido completo de `supabase/migrations/001_initial_schema.sql`
4. Clic en **Run** (debería decir "Success")

---

## Paso 4: Ejecutar seed data

1. En **SQL Editor**, crea otra query
2. Pega el contenido de `supabase/seed.sql`
3. Clic en **Run**

Esto creará:
- 28 modelos de motos (DT, Boxer, XR190, FZ, Pulsar, NKD, etc.)
- 25 materiales (vinilos, cueros, neopreno)
- 12 tipos de bordados
- 3 buckets de Storage (order-files, templates, avatars)

---

## Paso 5: Crear usuario administrador

1. Ve a **Authentication → Users**
2. Clic en **Add user**
3. Email: `admin@motosmart.app` (o el tuyo)
4. Password: (elige uno seguro)
5. En el campo **User Metadata** pon:
```json
{
  "full_name": "Administrador",
  "role": "admin"
}
```
6. Clic en **Create user**

El trigger `handle_new_user` creará automáticamente el perfil en `public.users`.

---

## Paso 6: Verificar Storage

1. Ve a **Storage**
2. Deberías ver los buckets: `order-files`, `templates`, `avatars`
3. Si no aparecen, ve a **SQL Editor** y ejecuta solo la sección de Storage del seed

---

## Paso 7: Habilitar Realtime

1. Ve a **Database → Replication**
2. Verifica que estén activas las tablas: `orders`, `notifications`, `order_status_history`, `order_designs`

---

## Paso 8: Regenerar tipos TypeScript (opcional pero recomendado)

```bash
npx supabase gen types typescript \
  --project-id TU_PROJECT_ID \
  > types/database.types.ts
```

Obtén `TU_PROJECT_ID` desde Settings → General.

---

## Paso 9: Arrancar el proyecto

```bash
npm run dev
```

Ve a http://localhost:3000 → te redirige a `/login` → ingresa con el admin creado.
