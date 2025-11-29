## Objetivos
- Mostrar correctamente usuarios y transacciones en el panel admin.
- Garantizar permisos y conexión backend ↔ Supabase.
- Optimizar diseño responsive para móviles.
- Corregir fondo para que cubra toda la pantalla en scroll.
- Probar en dispositivos y documentar cambios.

## Diagnóstico (solo lectura)
- Backend usa `supabaseClient.js` con clave anónima; las rutas admin (`backend/index.js`) leen tablas con RLS activa → pueden retornar vacío o error.
- Rutas admin actuales: `/api/admin/metrics`, `/api/admin/users`, `/api/admin/settings`, `/api/admin/activity` protegidas por `requireAdmin`.
- UI admin (`components/admin/AdminPanel.tsx`) muestra tablas sin contenedor `overflow-x-auto` → riesgo de desbordes en móviles.
- Fondo: `index.html` no aplica clases de fondo al `<body>`; el wrapper principal usa `bg-...` pero sin `min-h-screen` → puede verse blanco en scroll.

## Plan de Implementación
### 1) Datos y Permisos (Admin)
1. Sustituir el cliente de Supabase en backend a Service Role (env `SUPABASE_SERVICE_ROLE_KEY`) y `SUPABASE_URL`.
2. Actualizar `backend/supabaseClient.js` para leer claves desde entorno; nunca hardcodear.
3. Endurecer `requireAdmin`:
   - Validar JWT con `getUser(token)`, y permitir admin por claim (email/uid) configurable en env.
4. Consultas:
   - Añadir manejo de errores en rutas admin y retornar mensajes claros.
   - En `profiles` considerar incluir `email` (trigger de creación de perfil) o unir con `auth.users` si se requiere.
5. Verificar RLS:
   - Políticas que permitan lectura/escritura para admin (o bypass por Service Role).

### 2) Responsive Móvil (AdminPanel)
1. En tablas: envolver en `<div class="overflow-x-auto">` y usar columnas colapsables en `sm`.
2. En cards del dashboard: usar `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4` con espaciado reducido en `sm`.
3. Inputs y botones: padding y tipografías adaptadas (`text-sm`, `px-2 py-1` en móviles).
4. Layout general: contenedores con `container mx-auto px-2 sm:px-4` y `gap-2` en móviles.

### 3) Fondo y Scroll
1. Añadir `min-h-screen` al contenedor raíz que tiene `bg-gray-50 dark:bg-gray-900`.
2. Asegurar `html, body` con `height: 100%` (via CSS global `index.css`) y aplicar color de fondo consistente.
3. Revisar `overflow` en envolturas; evitar múltiples wrappers con fondo diferente.

### 4) Pruebas
1. Simular dispositivos en DevTools: 320, 375, 414, 768 px; comprobar tablas, cards, menús.
2. Navegadores: Chrome, Firefox, Edge móvil.
3. Panel admin: confirmar métricas y listado tras aplicar Service Role y políticas RLS.
4. Fondo: probar páginas largas y scroll en dark/light.

### 5) Documentación
1. Actualizar `docs/admin-panel.md` con:
   - Variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_UID`).
   - RLS/Triggers para `profiles` y lectura de `transactions`.
   - Guía responsive y pautas de diseño en móviles.
2. Registrar cambios en rutas y componentes.

## Entregables
- Backend configurado con Service Role y rutas admin robustas.
- AdminPanel con layout responsive en móviles.
- Fondo corregido y extendiéndose con scroll.
- Pruebas verificadas y documentación actualizada.

## Riesgos y Mitigaciones
- Service Role expuesto: cargar desde variables de entorno y nunca en cliente.
- RLS: si no está configurado, temporalmente usar Service Role para lectura mientras se definen políticas.
- UI móvil: revisar desbordes con `overflow-x-auto` en tablas.

¿Confirmas para aplicar estos cambios? 