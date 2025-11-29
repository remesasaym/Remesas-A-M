## Objetivos
- Eliminar duplicados reales, carpetas vacías y archivos sin uso sin romper el flujo.
- Consolidar el frontend en un único árbol y optimizar organización de recursos.
- Migrar la lógica de IA al backend con una capa de proveedores y contratos estables.
- Generar reporte detallado de cambios, recomendaciones y riesgos.

## Alcance y Suposiciones
- Entradas actuales: `index.html → index.tsx → App.tsx` (raíz) y `frontend/index.html → frontend/index.tsx → frontend/App.tsx`.
- Backend Express: `backend/index.js` con CORS `http://localhost:5173` (puerto a alinear con Vite).
- No se modifican datos externos ni claves durante la fase de análisis y planificación.

## Fase 1: Auditoría y Evidencias
- Hashes: obtener SHA-256 de todos los archivos y agrupar por hash para detectar duplicados exactos.
- Carpetas vacías: listar directorios sin archivos.
- Grafo de importaciones: desde ambas entradas, mapear módulos alcanzados y detectar archivos sin referencias.
- Entregar inventario con rutas y clasificación (usado, duplicado, no referenciado).

## Fase 2: Deduplicación y Consolidación del Frontend
- Decidir árbol canónico (raíz o `frontend/`) según cobertura y calidad (accesibilidad/ARIA, lógica admin).
- Extraer diferencias en módulos/props/config en lugar de mantener dos árboles:
  - `Admin` como feature opcional (p. ej., `features/admin` y `SettingsContext`).
  - Accesibilidad/ARIA como utilidades compartidas.
- Unificar `types.ts`, `supabaseClient.ts`, `services/**`, `contexts/**` bajo un único espacio de nombres.
- Asegurar alias `@` en `tsconfig.json` y `vite.config.ts` para imports estables.

## Fase 3: Archivos y Carpetas Sin Uso
- Marcar para eliminación segura:
  - `src/**` obsoleto (no referenciado).
  - Alternativas no importadas: `MainApp.tsx` (raíz, distinto de `components/MainApp.tsx`), `frontend/MainApp.tsx`.
- Confirmar que ningún test o script los consume; si existen, reubicar o actualizar referencias.

## Fase 4: Dependencias
- Validar uso de `dependencies` y `devDependencies` en ambos `package.json`.
- Si aparecen paquetes no usados, remover y ejecutar instalación limpia.
- Alinear versiones y evitar dependencias duplicadas entre raíz y backend si no son necesarias.

## Fase 5: Optimización y Reubicación
- Estructura propuesta:
  - `src/components`, `src/contexts`, `src/services`, `src/features`, `src/icons`, `src/common`.
  - `features/admin` para UI/servicios admin.
- Reubicar archivos subutilizados a módulos lógicos y documentar su nueva función.
- Alinear CORS y puertos: decidir `5173` o `3000`, ajustar `vite.config.ts` y `backend/index.js`.

## Fase 6: Integración de IA (Arquitectura)
- Backend:
  - Interface `IAProvider` con métodos: `startChatSession`, `sendMessageStream`, `generateContent`, `verifyIdentity`.
  - Implementar `GeminiProvider` primero; diseñar puntos de extensión `OpenAIProvider`, `AnthropicProvider`, `VertexProvider`.
  - Endpoints: `/api/assistant` (SSE/WebSocket) y `/api/verify` (POST multipart).
  - Plantillas de prompts versionadas y centralizadas.
- Frontend:
  - Hooks `useAssistant` y `useVerification` consumiendo backend.
  - Eliminar SDKs de IA en cliente; no exponer claves (`process.env.API_KEY`).

## Fase 7: Seguridad y Configuración
- Variables de entorno: `IA_PROVIDER`, `MODEL_CHAT`, `MODEL_VISION`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.
- Rate limiting en backend por endpoint/proveedor; sanitización y validación de imágenes.
- Observabilidad: métricas de latencia, errores (auth, cuota, input), y presupuestos.

## Fase 8: Pruebas y Verificación
- Smoke test de rutas críticas: autenticación (`Supabase`), cálculo, historial, beneficiarios, asistente, KYC.
- Pruebas de regresión de UI tras consolidación de componentes/contexts.
- Validación de streaming SSE/WebSocket y verificación de imágenes con límites de tamaño/formato.
- Revisar que estilos referenciados (`index.css`) existan o reemplazar por CSS-in-JS/estilos locales.

## Fase 9: Reporte Detallado
- Listado de archivos/carpetas eliminados con justificación.
- Cambios realizados por área (frontend, backend, IA, config).
- Recomendaciones de estructura futura y mapa de dependencias.
- Riesgos potenciales y mitigaciones aplicadas.

## Riesgos y Mitigaciones
- Ruptura de imports relativos al consolidar: usar alias `@`, ejecutar auditoría de imports.
- Desalineación de puertos/CORS: actualizar ambos lados y probar.
- Latencia al mover IA al backend: usar SSE/WebSocket y caching prudente.

## Plan de Retroceso
- Commits granulares por fase con posibilidad de revert.
- Feature flags para activar la nueva capa de IA progresivamente.

## Criterios de Aceptación
- Un solo árbol frontend estable sin referencias rotas.
- Sin archivos duplicados exactos ni carpetas vacías.
- Sin archivos no referenciados desde entradas.
- IA consumida exclusivamente vía backend, sin claves en cliente.
- Reporte final entregado con evidencias y recomendaciones.