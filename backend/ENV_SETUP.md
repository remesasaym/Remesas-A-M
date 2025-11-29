# Configuración de Variables de Entorno

## Backend

1. **Copiar el template:**

   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generar ENCRYPTION_KEY:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Obtener credenciales de Supabase:**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Settings > API
   - Copia `Project URL` y `anon public key`
   - Para `service_role_key`: Settings > API > service_role (⚠️ NUNCA exponer en frontend)

4. **Obtener GEMINI_API_KEY:**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una API key

5. **Configurar Admin:**
   - `ADMIN_EMAIL`: Tu email de administrador
   - `ADMIN_UID`: ID de usuario de Supabase (obtener desde Dashboard > Authentication)

## Frontend

Las variables del frontend ya están en `.env.local`. Asegúrate de que coincidan con tu proyecto de Supabase.

## Producción

⚠️ **NUNCA** subir archivos `.env` a Git.

Para producción, usa el Secrets Manager de tu plataforma:

- **Vercel**: Settings > Environment Variables
- **Railway**: Variables tab
- **Render**: Environment > Environment Variables

## Seguridad

✅ **Hacer:**

- Usar diferentes keys para desarrollo y producción
- Rotar keys regularmente
- Usar Secrets Manager en producción

❌ **NO hacer:**

- Hardcodear credenciales en el código
- Compartir archivos `.env`
- Subir `.env` a Git
