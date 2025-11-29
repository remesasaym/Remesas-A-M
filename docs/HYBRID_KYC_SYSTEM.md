# Sistema Híbrido KYC - Guía de Implementación

## 🎯 Cómo Funciona

### Flujo Automático (IA)

1. Usuario sube documentos (ID + comprobante + selfie)
2. **Gemini AI** valida automáticamente:
   - Autenticidad del documento
   - Coincidencia facial (selfie vs ID)
   - Validación de dirección
   - Documento vigente
3. **Si confianza ≥ 95%** → ✅ **Auto-aprobado**
4. **Si confianza < 95%** → 📋 **Envía a revisión manual**

### Flujo Manual (Admin)

1. Admin ve verificaciones pendientes en Panel KYC
2. Revisa documentos e información de IA
3. Aprueba o rechaza manualmente

---

## 📊 Criterios de Auto-Aprobación

```javascript
const AI_CONFIDENCE_THRESHOLD = 0.95; // 95%

// Auto-aprobar si:
✅ is_authentic === true
✅ !is_expired === true  
✅ is_from_country === true
✅ faces_match === true
✅ address_matches === true
✅ Confianza general ≥ 95%

// Enviar a revisión manual si:
❌ Cualquier validación falla
❌ Confianza < 95%
❌ Documento borroso/ilegible
❌ Error en procesamiento de IA
```

---

## 🔧 Configuración

### 1. Ejecutar Migración SQL

En Supabase Dashboard → SQL Editor:

```sql
-- Copiar y pegar contenido de:
-- backend/migrations/add_ai_validation_fields.sql
```

### 2. Configurar API Key de Gemini

En `.env`:

```bash
API_KEY=tu_api_key_de_gemini_aqui
USE_BACKEND_IA=false  # true si usas backend para IA
```

**Obtener API Key gratis:**

1. Ir a <https://makersuite.google.com/app/apikey>
2. Crear API key
3. Copiar y pegar en `.env`

### 3. Ajustar Umbral de Confianza (Opcional)

En `Profile.tsx` línea ~300:

```typescript
const AI_CONFIDENCE_THRESHOLD = 0.95; // Ajustar entre 0.80 - 0.99
```

---

## 📈 Ventajas del Sistema Híbrido

| Feature | Solo IA | Solo Manual | **Híbrido** |
|---------|---------|-------------|-------------|
| Velocidad | ⚡ Instantáneo | 🐌 24-48h | ⚡ 90% instantáneo |
| Costo | 💰 Alto | 💵 Gratis | 💰 Bajo (solo casos dudosos) |
| Precisión | 🎯 85-90% | 🎯 99% | 🎯 **95-99%** |
| Escalabilidad | ✅ Alta | ❌ Baja | ✅ **Alta** |
| Fraude | ⚠️ Medio | ✅ Bajo | ✅ **Bajo** |

---

## 🧪 Testing

### Test 1: Auto-Aprobación

1. Subir documentos **claros y legibles**
2. Esperar ~10 segundos (procesamiento IA)
3. Debería auto-aprobar ✅
4. Verificar en BD: `auto_approved = true`

### Test 2: Revisión Manual

1. Subir documento **borroso** o con **datos incorrectos**
2. IA detecta problema
3. Envía a revisión manual 📋
4. Admin ve en Panel KYC → Pestaña KYC

### Test 3: Rechazo Manual

1. Admin revisa caso dudoso
2. Rechaza con motivo
3. Usuario ve mensaje de rechazo
4. Puede reintentar con mejores fotos

---

## 📊 Monitoreo

### Métricas Importantes

```sql
-- Tasa de auto-aprobación
SELECT 
  COUNT(*) FILTER (WHERE auto_approved = true) * 100.0 / COUNT(*) as auto_approval_rate
FROM verification_requests;

-- Casos que requieren revisión
SELECT COUNT(*) 
FROM verification_requests 
WHERE requires_manual_review = true AND status = 'pending';

-- Confianza promedio de IA
SELECT AVG(ai_confidence) as avg_confidence
FROM verification_requests
WHERE ai_confidence IS NOT NULL;
```

---

## ⚙️ Ajustes Recomendados

### Inicio (Primeros 100 usuarios)

```javascript
AI_CONFIDENCE_THRESHOLD = 0.90  // Más permisivo
```

### Producción (Después de validar)

```javascript
AI_CONFIDENCE_THRESHOLD = 0.95  // Balance óptimo
```

### Alta Seguridad (Fintech regulada)

```javascript
AI_CONFIDENCE_THRESHOLD = 0.98  // Muy estricto
```

---

## 🚨 Troubleshooting

### "IA siempre rechaza"

- Verificar API_KEY de Gemini
- Revisar calidad de imágenes de prueba
- Bajar threshold temporalmente

### "Todo va a revisión manual"

- Threshold muy alto (bajar a 0.90)
- Problemas con API de Gemini
- Documentos de mala calidad

### "Auto-aprueba casos dudosos"

- Threshold muy bajo (subir a 0.95+)
- Revisar lógica de validación
- Agregar más checks

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar migración SQL
2. ✅ Configurar API Key
3. ✅ Probar con documentos reales
4. ✅ Ajustar threshold según resultados
5. ✅ Monitorear métricas primeros días

---

¡El sistema híbrido está listo! 🚀
