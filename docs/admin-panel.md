# Panel de Administración

## Acceso y Roles
- Admin verificado por email (`ADMIN_EMAIL`) o UID (`ADMIN_UID`).
- Middleware `requireAdmin` valida el JWT `Authorization: Bearer` y compara contra admin.
- Configurar variables de entorno en el backend:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAIL` (opcional, por defecto el actual)
  - `ADMIN_UID` (opcional)

## Endpoints Backend
- `GET /api/admin/metrics` — totales de transacciones, monto enviado, usuarios, verificaciones.
- `GET /api/admin/users` — lista de perfiles.
- `PUT /api/admin/users/:id` — actualizar perfil.
- `DELETE /api/admin/users/:id` — eliminar perfil.
- `GET /api/admin/settings` — configuración de la app.
- `PUT /api/admin/settings` — guardar configuración.
- `GET /api/admin/activity` — últimas transacciones y verificaciones.

## Frontend
- Servicio `services/adminService.ts` gestiona autenticación y llamadas.
- UI `components/admin/AdminPanel.tsx` con pestañas: Dashboard, Usuarios, Configuración, Actividad.
- Integración en `MainApp` y menú del `Header` visible solo para admin.
- Variables de entorno del cliente (via Vite `define`):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

## Diseño Responsive (Móvil)
- Tablas envueltas en `overflow-x-auto` para evitar desbordes.
- Grids adaptativas (`grid-cols-1 sm:grid-cols-2 md:grid-cols-4`).
- Inputs/botones con `text-sm`, `px-2 py-1` en móviles.
- Contenedores `container mx-auto px-2 sm:px-4`.
- Fondo: `min-h-screen` en `App.tsx` y `frontend/App.tsx`; `index.css` con `html, body { height:100% }`.

## Seguridad
- Validación de JWT en backend.
- CORS limitado a `localhost:3000` y `localhost:5173`.
- Sin claves de proveedor IA en cliente cuando `USE_BACKEND_IA=true`.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend.

## Mantenimiento
- Variables: `ADMIN_EMAIL`, `ADMIN_UID` en `services/adminService.ts`.
- Supabase: RLS puede dejar listas vacías si usas anon key; el backend usa Service Role para bypass.
- Trigger de perfiles: asegurar creación y campos necesarios (`email`, `full_name`, `phone`).

## Pruebas
- Iniciar backend `npm start`.
- Iniciar frontend en `http://localhost:3000/`.
- Autenticar admin y abrir “Panel de Administración”.
- Verificar visualización en móviles (320/375/414/768px) y navegadores.
- Confirmar que el fondo cubre el scroll en páginas largas.