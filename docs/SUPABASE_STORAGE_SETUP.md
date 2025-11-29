# Configuración Rápida - Supabase Storage para KYC

## Paso 1: Crear Bucket en Supabase

1. Ve a tu proyecto en <https://supabase.com/dashboard>
2. Click en **Storage** en el menú lateral
3. Click en **"Create a new bucket"**
4. Configuración:
   - **Name**: `kyc-documents`
   - **Public**: ❌ NO (debe ser privado)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/jpg`
5. Click **"Create bucket"**

## Paso 2: Configurar Políticas de Seguridad (RLS)

En la pestaña **Policies** del bucket `kyc-documents`:

### Política 1: Usuarios pueden subir sus propios documentos

```sql
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Política 2: Usuarios pueden ver sus propios documentos

```sql
CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Política 3: Admins pueden ver todos los documentos

```sql
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND email IN ('admin@remesas.com', 'tu_email@example.com')
  )
);
```

## Paso 3: Ejecutar Migración de Base de Datos

En Supabase Dashboard → **SQL Editor**:

```sql
-- Copiar y pegar el contenido de:
-- backend/migrations/create_kyc_table.sql

-- O ejecutar directamente:
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  document_url TEXT,
  selfie_url TEXT,
  document_type TEXT DEFAULT 'id_card',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);

-- Habilitar RLS
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas (ver archivo completo para todas las políticas)
```

## Paso 4: Verificar Configuración

### Test 1: Verificar Bucket

```bash
# En la consola de Supabase Storage, deberías ver:
# ✅ kyc-documents (privado)
```

### Test 2: Verificar Tabla

```sql
-- En SQL Editor:
SELECT * FROM kyc_verifications LIMIT 1;
-- Debería retornar 0 filas (tabla vacía pero existente)
```

## Paso 5: Reiniciar Backend

```bash
cd backend
npm start
```

El backend ahora tiene acceso a:

- ✅ Rutas KYC (`/api/kyc/*`)
- ✅ Bucket de almacenamiento
- ✅ Tabla de verificaciones

## ¡Listo para Probar

Ahora puedes:

1. Ir a tu app en `http://localhost:5173`
2. Iniciar sesión
3. Ir a **Perfil**
4. Click en **"Verificar Identidad"**
5. Subir documentos
6. Ver el estado en el perfil

---

## Troubleshooting

### Error: "Bucket not found"

- Verifica que el bucket se llame exactamente `kyc-documents`
- Verifica que las credenciales de Supabase en `.env` sean correctas

### Error: "Permission denied"

- Verifica que las políticas RLS estén creadas
- Verifica que el usuario esté autenticado

### Error: "File too large"

- Máximo 5MB por imagen
- Comprime la imagen antes de subir
