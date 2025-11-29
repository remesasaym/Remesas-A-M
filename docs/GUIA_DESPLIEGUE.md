# 🚀 Guía de Despliegue: Remesas A&M

Esta guía te llevará paso a paso para poner tu aplicación en internet.

## 1. Subir el Código a GitHub

Como no tienes un repositorio remoto configurado, primero debemos crear uno.

1. Ve a [github.com/new](https://github.com/new) y crea un repositorio (ej. `remesas-am`).
2. **No** marques "Initialize with README".
3. Copia la URL del repositorio (ej. `https://github.com/tu-usuario/remesas-am.git`).
4. Abre tu terminal en VS Code y ejecuta:

```bash
# 1. Guardar tus cambios locales
git add .
git commit -m "Preparado para despliegue"

# 2. Conectar con GitHub (reemplaza la URL por la tuya)
git remote add origin https://github.com/TU-USUARIO/remesas-am.git

# 3. Subir el código
git branch -M main
git push -u origin main
```

---

## 2. Desplegar Backend (Render)

Render alojará tu servidor (Node.js) y base de datos.

1. Ve a [render.com](https://render.com) y crea una cuenta.
2. Haz clic en **New +** -> **Web Service**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio `remesas-am`.
4. **Configuración:**
    * **Name:** `remesas-backend`
    * **Region:** Ohio (US East) o Frankfurt (EU)
    * **Branch:** `main`
    * **Root Directory:** `backend` (¡Importante!)
    * **Runtime:** Node
    * **Build Command:** `npm install`
    * **Start Command:** `npm start`
5. **Variables de Entorno (Environment Variables):**
    Haz clic en "Advanced" o "Environment" y agrega:
    * `SUPABASE_URL`: (Tu URL de Supabase)
    * `SUPABASE_SERVICE_ROLE_KEY`: (Tu Key de Supabase)
    * `GEMINI_API_KEY`: (Tu API Key de Google)
    * `RESEND_API_KEY`: (Tu API Key de Resend)
    * `SENDER_EMAIL`: (Tu email de Resend)
    * `ENCRYPTION_KEY`: (Tu clave de encriptación del .env)
    * `ALLOWED_ORIGINS`: `*` (Para empezar)
6. Haz clic en **Create Web Service**.
7. **Espera:** Render tardará unos minutos. Al final te dará una URL (ej. `https://remesas-backend.onrender.com`). **Cópiala.**

---

## 3. Desplegar Frontend (Vercel)

Vercel alojará tu página web (React).

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta.
2. Haz clic en **Add New...** -> **Project**.
3. Importa el repositorio `remesas-am`.
4. **Configuración:**
    * **Framework Preset:** Vite (lo detectará automático).
    * **Root Directory:** `./` (Déjalo vacío o punto).
5. **Variables de Entorno:**
    * Nombre: `VITE_API_URL`
    * Valor: `https://remesas-backend.onrender.com` (La URL que copiaste de Render, **sin** la barra `/` al final).
6. Haz clic en **Deploy**.

---

## 4. ¡Listo

Vercel te dará una URL (ej. `https://remesas-am.vercel.app`).
¡Esa es tu aplicación en vivo! 🌍

### Solución de Problemas Comunes

* **Error de CORS:** Si el frontend no conecta, revisa la variable `ALLOWED_ORIGINS` en Render.
* **Error 404 en Backend:** Asegúrate de que el "Root Directory" en Render sea `backend`.
* **Error de Build en Vercel:** Revisa que no haya errores de TypeScript (ya los corregimos, pero por si acaso).
