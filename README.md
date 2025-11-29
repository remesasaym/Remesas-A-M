# Remesas A&M (Aplicación Frontend)

Bienvenido al proyecto Remesas A&M. Esta es una aplicación web moderna que permite enviar remesas internacionales y cambiar saldo de PayPal o Worldcoin, conectando Latinoamérica, EE.UU. y Europa.

Esta es una aplicación frontend pura que se conecta directamente a Supabase para la gestión de datos y autenticación.

## 🚀 Configuración del Proyecto

Para que la aplicación funcione correctamente, es crucial que tu proyecto de Supabase esté configurado como se describe a continuación.

### 1. Requisitos de Supabase

Este proyecto utiliza Supabase para la autenticación, el almacenamiento de datos y la gestión de archivos.

**a. Crea un proyecto en Supabase:**
1.  Ve a [supabase.com](https://supabase.com/).
2.  Regístrate o inicia sesión.
3.  Crea un nuevo proyecto.

**b. Obtén tus credenciales de Supabase:**
1.  Una vez creado el proyecto, ve a `Project Settings` (⚙️) > `API`.
2.  Copia tu `Project URL` y tu `Anon Public Key`.

**c. Actualiza las credenciales en el código:**
*   Abre el archivo `supabaseClient.ts` y reemplaza los valores de `supabaseUrl` y `supabaseAnonKey` con tus propias credenciales.

**d. Configura las tablas en Supabase:**
Necesitarás las siguientes tablas con sus respectivas configuraciones. Puedes crearlas usando el **SQL Editor** en tu dashboard de Supabase.

---

#### Solución Rápida para Tabla `transactions` (¡Corregido!)

Si ya tienes una tabla `transactions` con datos y te dio un error al ejecutar el comando anterior (error `column contains null values`), es porque la base de datos no puede añadir una columna `NOT NULL` a una tabla que ya tiene filas.

Para solucionarlo, ejecuta estos dos comandos en orden en el **SQL Editor** de Supabase:

**Paso 1: Añadir las columnas con un valor por defecto**

Este comando añade las columnas y rellena las filas existentes con una cadena vacía (`''`) para cumplir con la restricción `NOT NULL`.

```sql
-- Añade las columnas faltantes con un valor por defecto para las filas existentes.
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS recipient_account TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS recipient_id TEXT NOT NULL DEFAULT '';
```

**Paso 2: Eliminar el valor por defecto (Opcional pero recomendado)**

Este comando elimina el valor por defecto para futuras inserciones. Esto asegura que el código de tu aplicación deba proporcionar siempre un valor para estas columnas, evitando datos vacíos accidentales.

```sql
-- Elimina el valor por defecto para que las nuevas filas requieran un valor explícito.
ALTER TABLE public.transactions
ALTER COLUMN recipient_account DROP DEFAULT,
ALTER COLUMN recipient_id DROP DEFAULT;
```

---

**Tabla `profiles`** (Para perfiles de usuario extendidos)

| Columna       | Tipo                      | Clave       | Default             | Notas                        |
|---------------|---------------------------|-------------|---------------------|------------------------------|
| `id`          | `uuid`                    | Primary Key |                     | Referencia a `auth.users(id)` |
| `full_name`   | `text`                    |             |                     |                              |
| `is_verified` | `boolean`                 |             | `FALSE`             |                              |
| `phone`       | `text`                    |             |                     |                              |

*   **RLS (Row Level Security):** Habilita RLS y crea políticas para permitir a los usuarios gestionar solo su propio perfil.

---

**Tabla `transactions`** (Para el historial de remesas)

| Columna             | Tipo                      | Clave         | Default             | Notas                               |
|---------------------|---------------------------|---------------|---------------------|-------------------------------------|
| `id`                | `uuid`                    | Primary Key   | `gen_random_uuid()` |                                     |
| `created_at`        | `timestamp with time zone`|               | `now()`             |                                     |
| `user_id`           | `uuid`                    | Foreign Key   |                     | Referencia a `auth.users(id)`        |
| `transaction_id`    | `text`                    | `UNIQUE`      |                     | ID de referencia para el usuario    |
| `amount_sent`       | `numeric`                 |               |                     |                                     |
| `currency_sent`     | `text`                    |               |                     |                                     |
| `amount_received`   | `numeric`                 |               |                     |                                     |
| `currency_received` | `text`                    |               |                     |                                     |
| `fee`               | `numeric`                 |               |                     |                                     |
| `from_country_code` | `text`                    |               |                     |                                     |
| `to_country_code`   | `text`                    |               |                     |                                     |
| `recipient_name`    | `text`                    |               |                     |                                     |
| `recipient_bank`    | `text`                    |               |                     |                                     |
| `recipient_account` | `text`                    |               |                     | **¡Columna requerida!**             |
| `recipient_id`      | `text`                    |               |                     | **¡Columna requerida!**             |
| `status`            | `text`                    |               | `'Pendiente'`       |                                     |

*   **RLS (Row Level Security):** Habilita RLS y crea políticas para permitir a los usuarios ver e insertar solo sus propias transacciones.

---

**Tabla `beneficiaries` (¡NUEVA!)**

Copia y pega el siguiente script completo en el **SQL Editor** de Supabase para crear la tabla `beneficiaries` y configurar su seguridad. Si ya intentaste crear la tabla y falló, puede que necesites eliminarla primero con `DROP TABLE public.beneficiaries;` antes de correr este script.

```sql
-- 1. Crear la tabla para almacenar los beneficiarios de los usuarios.
CREATE TABLE public.beneficiaries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  "name" text NOT NULL,
  country_code text NOT NULL,
  bank text NOT NULL,
  account_number text NOT NULL,
  document_id text NOT NULL,
  CONSTRAINT beneficiaries_pkey PRIMARY KEY (id),
  CONSTRAINT beneficiaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Se añade una restricción única para que la función 'upsert' de "Guardar Beneficiario" funcione correctamente.
  -- Un usuario no puede tener dos beneficiarios con el mismo número de cuenta.
  CONSTRAINT beneficiaries_user_id_account_number_key UNIQUE (user_id, account_number)
);

-- 2. Habilitar la Seguridad a Nivel de Fila (RLS) para la tabla.
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de RLS para que los usuarios solo puedan gestionar sus propios beneficiarios.
CREATE POLICY "Users can view their own beneficiaries"
ON public.beneficiaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own beneficiaries"
ON public.beneficiaries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beneficiaries"
ON public.beneficiaries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own beneficiaries"
ON public.beneficiaries FOR DELETE
USING (auth.uid() = user_id);
```

---

**Tabla `verification_requests`** (Para el proceso de verificación de identidad)

| Columna             | Tipo                      | Clave         | Default             | Notas                        |
|---------------------|---------------------------|---------------|---------------------|------------------------------|
| `id`                | `uuid`                    | Primary Key   | `gen_random_uuid()` |                              |
| `created_at`        | `timestamp with time zone`|               | `now()`             |                              |
| `user_id`           | `uuid`                    | Foreign Key   |                     | Referencia a `auth.users(id)` |
| `full_name`         | `text`                    |               |                     |                              |
| `country`           | `text`                    |               |                     |                              |
| `document_id`       | `text`                    |               |                     |                              |
| `address`           | `text`                    |               |                     |                              |
| `id_document_url`   | `text`                    |               |                     |                              |
| `address_proof_url` | `text`                    |               |                     |                              |
| `phone`             | `text`                    |               |                     |                              |
| `status`            | `text`                    |               | `'pending'`         |                              |

*   **RLS (Row Level Security):** Habilita RLS y crea políticas para que los usuarios puedan crear y ver sus propias solicitudes.

---

**e. Configura la autenticación (Triggers y RLS para Perfiles):**
Para que los perfiles se creen automáticamente y sean seguros, necesitas un *trigger* y políticas de RLS. Sin estas configuraciones, la aplicación no podrá obtener los datos del perfil del usuario y podría quedarse atascada o no funcionar como se espera después de iniciar sesión.

**Paso 1: Crear la función y el trigger para nuevos perfiles**
Copia y pega este código en el **SQL Editor** de tu proyecto de Supabase y ejecútalo. Esto crea un perfil en la tabla `profiles` cada vez que un nuevo usuario se registra.

```sql
-- 1. Function to create a profile for a new user.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

-- 2. Trigger to run when a new user signs up.
-- Drop the trigger if it already exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Paso 2: Habilitar RLS y crear políticas para `profiles`**
Esto es crucial para la seguridad. Habilita RLS en la tabla `profiles` desde el dashboard de Supabase (Authentication > Policies) y luego ejecuta este SQL para permitir que los usuarios solo accedan a su propia información.

```sql
-- 1. Enable RLS on the profiles table (if not already enabled)
alter table public.profiles enable row level security;

-- 2. Create policy for users to view their own profile
-- Drop policy if it already exists to avoid errors on re-run
drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- 3. Create policy for users to update their own profile
-- Drop policy if it already exists to avoid errors on re-run
drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );
```

---

**f. Configura Supabase Storage:**
1.  Ve a `Storage` en tu proyecto de Supabase.
2.  Crea un nuevo bucket público llamado `user-documents`.
3.  Establece políticas de acceso que permitan `insert` y `select` para usuarios autenticados (`authenticated`).

### 2. Troubleshooting

*   **Error: `Could not find the 'column_name' column of 'transactions' in the schema cache`**

    Este error de Supabase significa que hay un desajuste entre el nombre de una columna que el código intenta usar (por ejemplo, `recipient_account`) y el nombre real de la columna en tu tabla de la base de datos.

    **Cómo solucionarlo:**
    1.  Ve a tu dashboard del proyecto de Supabase.
    2.  Navega al **SQL Editor**.
    3.  Ejecuta los comandos SQL de la sección "Solución Rápida" de arriba para añadir las columnas faltantes.
    4.  Si el error persiste, ve al **Table Editor**, selecciona la tabla `transactions` y verifica que todos los nombres de las columnas coincidan exactamente con la documentación.