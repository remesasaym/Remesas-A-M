## Requisitos

* Node.js y npm instalados en Windows.

* Archivo `.env` en la raíz con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_EMAIL`, `ADMIN_UID`, `GEMINI_API_KEY`.

* Archivo `backend/.env` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (opcional pero recomendado para endpoints de administración/IA).

## Puertos y Servicios

* Frontend Vite en `http://localhost:3000` (configurado en `vite.config.ts`).

* Backend Express en `http://localhost:3001` (`backend/index.js`).

* CORS permite `http://localhost:3000` y `http://localhost:5173`.

## Pasos: Backend

* Abrir una terminal y ejecutar:

  * `cd backend`

  * `npm install`

  * `npm run start`

* Variables necesarias en `backend/.env`:

  * `SUPABASE_URL` = mismo del frontend.

  * `SUPABASE_SERVICE_ROLE_KEY` = Service Role Key de Supabase (requerido para escritura/operaciones administrativas).

  * `ADMIN_EMAIL` y `ADMIN_UID` (opcional si ya están en frontend, útil para verificación en backend).

## Pasos: Frontend

* Abrir otra terminal en la raíz del proyecto y ejecutar:

  * `npm install`

  * `npm run dev`

* Acceder a `http://localhost:3000`.

## Verificación

* Frontend cargando: visitar `http://localhost:3000` y probar login.

* Supabase salud (backend): `GET http://localhost:3001/api/health/supabase` debe responder `{ ok: true }` si `backend/.env` está bien.

* Funciones admin: si `USE_BACKEND_ADMIN=false`, el frontend accede directo a Supabase; si se cambia a `true`, requiere backend activo y Service Role Key.

## Observaciones

* El backend puede arrancar sin `SUPABASE_SERVICE_ROLE_KEY`, pero endpoints que escriben/administran fallarán. Recomendado completar ese valor.

* Los valores de `.env` del frontend ya están mapeados a `process.env` por `vite.config.ts`.

## Siguiente Paso

* Con tu confirmación, ejecutaré ambos servidores, te compartiré la URL de vista previa del frontend y comprobaré el estado del backend con el endpoint de salud.

