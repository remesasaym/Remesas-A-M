# 🔐 KYC Integration Guide - Persona (Free Tier)

## 🎯 Why Persona?

- ✅ **100 verificaciones gratis/mes**
- ✅ Registro instantáneo (solo email)
- ✅ Sandbox ilimitado
- ✅ Excelente documentación
- ✅ Buena cobertura LatAm

---

## 🚀 Quick Start (5 minutos)

### Step 1: Crear Cuenta Persona

1. Ve a <https://withpersona.com/>
2. Click en **"Get Started"** o **"Sign Up"**
3. Usa tu email (no requiere tarjeta de crédito)
4. Confirma tu email

### Step 2: Obtener Credenciales

1. Una vez dentro del dashboard, ve a **"Developers"** → **"API Keys"**
2. Copia tu **API Key** (empieza con `persona_`)
3. Ve a **"Inquiry Templates"** → Crea un template básico
4. Copia el **Template ID** (empieza con `itmpl_`)

### Step 3: Configurar Variables de Entorno

Agrega a tu `.env`:

```bash
# Persona KYC
PERSONA_API_KEY=persona_sandbox_xxxxxxxxxxxxxxxx
PERSONA_TEMPLATE_ID=itmpl_xxxxxxxxxxxxxxxx
PERSONA_ENV=sandbox
```

---

## 📝 Configuración del Template

En el dashboard de Persona:

1. **Ir a "Inquiry Templates"** → **"Create Template"**
2. **Configurar verificaciones**:
   - ✅ Government ID (documento de identidad)
   - ✅ Selfie (foto del rostro)
   - ✅ Database verification (opcional)
3. **Países soportados**: Selecciona los que necesites (VE, CO, PE, MX, etc.)
4. **Guardar** y copiar el Template ID

---

## 🔧 Integración Backend

### Agregar a `backend/server.ts`

```typescript
import { kycService } from '../services/kycService';

// Iniciar verificación KYC
app.post('/api/kyc/start-verification', async (req, res) => {
  try {
    const { userId, email, phone, firstName, lastName } = req.body;
    
    const result = await kycService.createVerificationSession({
      userId,
      email,
      phone,
      firstName,
      lastName,
    });

    if (result.success) {
      res.json({
        success: true,
        sessionToken: result.sessionToken,
        inquiryId: result.inquiryId,
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to start KYC verification' });
  }
});

// Consultar estado de verificación
app.get('/api/kyc/status/:inquiryId', async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const status = await kycService.getVerificationStatus(inquiryId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// Webhook de Persona
app.post('/api/kyc/webhook', async (req, res) => {
  try {
    await kycService.handleWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Notificación de verificación completada (desde frontend)
app.post('/api/kyc/verification-completed', async (req, res) => {
  try {
    const { inquiryId, status } = req.body;
    
    // Actualizar estado en base de datos
    const verificationStatus = await kycService.getVerificationStatus(inquiryId);
    
    // TODO: Actualizar perfil del usuario en Supabase
    // await supabase.from('profiles').update({
    //   is_verified: verificationStatus.status === 'approved',
    //   kyc_status: verificationStatus.status,
    //   kyc_inquiry_id: inquiryId
    // }).eq('id', userId);
    
    res.json({ success: true, status: verificationStatus.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process verification' });
  }
});
```

---

## 🎨 Integración Frontend

### Opción 1: Modal Embebido (Recomendado)

Actualiza `components/Profile.tsx`:

```typescript
import { useState } from 'react';

const Profile = ({ user, onProfileUpdate }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const handleStartKYC = async () => {
    try {
      setIsVerifying(true);
      setVerificationError('');

      // 1. Obtener session token del backend
      const response = await fetch('/api/kyc/start-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.fullName?.split(' ')[0],
          lastName: user.fullName?.split(' ').slice(1).join(' '),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start verification');
      }

      // 2. Iniciar Persona Client
      const Persona = (window as any).Persona;
      const client = new Persona.Client({
        templateId: 'itmpl_xxxxxxxxxxxxxxxx', // Tu template ID
        environmentId: 'env_sandbox', // o 'env_production'
        sessionToken: data.sessionToken,
        
        onReady: () => {
          console.log('Persona ready');
          client.open();
        },
        
        onComplete: async ({ inquiryId, status, fields }) => {
          console.log('✅ Verification completed:', inquiryId, status);
          
          // Notificar al backend
          await fetch('/api/kyc/verification-completed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inquiryId, status }),
          });

          // Actualizar UI
          if (status === 'approved') {
            onProfileUpdate({ isVerified: true });
            alert('¡Verificación exitosa! ✅');
          }
          
          setIsVerifying(false);
        },
        
        onCancel: ({ inquiryId }) => {
          console.log('⚠️ Verification cancelled');
          setIsVerifying(false);
        },
        
        onError: (error) => {
          console.error('❌ Verification error:', error);
          setVerificationError('Error en la verificación. Intenta de nuevo.');
          setIsVerifying(false);
        },
      });

    } catch (error) {
      console.error('Failed to start KYC:', error);
      setVerificationError(error.message);
      setIsVerifying(false);
    }
  };

  return (
    <div>
      {/* ... resto del componente ... */}
      
      {!user.isVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 className="font-bold mb-2">⚠️ Verificación Requerida</h3>
          <p className="text-sm mb-4">
            Para enviar dinero, necesitas verificar tu identidad.
          </p>
          <button
            onClick={handleStartKYC}
            disabled={isVerifying}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isVerifying ? 'Verificando...' : 'Verificar Identidad'}
          </button>
          {verificationError && (
            <p className="text-red-500 text-sm mt-2">{verificationError}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### Agregar Script de Persona al HTML

En `index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- ... otros tags ... -->
  
  <!-- Persona SDK -->
  <script src="https://cdn.withpersona.com/dist/persona-v4.9.0.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

---

## 🔔 Configurar Webhooks

1. En Persona Dashboard → **"Developers"** → **"Webhooks"**
2. Click **"Add Endpoint"**
3. URL: `https://your-domain.com/api/kyc/webhook`
4. Eventos a escuchar:
   - ✅ `inquiry.completed`
   - ✅ `inquiry.approved`
   - ✅ `inquiry.declined`
5. Guardar

---

## 🧪 Testing en Sandbox

### Datos de Prueba

Persona proporciona documentos de prueba en sandbox:

- **Nombre**: Test User
- **Documento**: Cualquier número (en sandbox acepta todo)
- **Selfie**: Cualquier foto clara de un rostro

### Flujo de Prueba

1. Inicia verificación desde tu app
2. Sube un documento de identidad (cualquier imagen en sandbox)
3. Toma una selfie
4. Persona procesará automáticamente
5. En ~30 segundos recibirás el resultado

---

## 📊 Actualizar Base de Datos

```sql
-- Agregar campos KYC a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_inquiry_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
```

---

## 💰 Pricing

### Plan Gratuito

- ✅ **100 verificaciones/mes** gratis
- ✅ Sandbox ilimitado
- ✅ Soporte por email

### Plan Paid (cuando crezcas)

- **$1-2 por verificación** (depende del volumen)
- Descuentos por volumen disponibles
- Soporte prioritario

---

## 🆘 Troubleshooting

### Error: "API Key inválido"

- Verifica que copiaste la key completa
- Asegúrate de usar la key de **sandbox** si estás en desarrollo

### Error: "Template ID no encontrado"

- Verifica el Template ID en el dashboard
- Asegúrate de que el template esté **publicado**

### Verificación no se completa

- Revisa la consola del navegador
- Verifica que el script de Persona esté cargado
- Prueba en modo incógnito (a veces extensiones interfieren)

---

## 📚 Recursos

- [Persona Docs](https://docs.withpersona.com/)
- [Persona Dashboard](https://app.withpersona.com/)
- [API Reference](https://docs.withpersona.com/reference)
- [React Example](https://github.com/persona-id/persona-react-example)

---

## ✅ Checklist de Implementación

- [ ] Crear cuenta en Persona
- [ ] Obtener API Key y Template ID
- [ ] Configurar `.env` con credenciales
- [ ] Agregar endpoints al backend
- [ ] Agregar script de Persona al HTML
- [ ] Actualizar componente Profile
- [ ] Configurar webhook
- [ ] Actualizar schema de base de datos
- [ ] Probar en sandbox
- [ ] ¡Listo para producción! 🚀

---

¿Necesitas ayuda con algún paso? ¡Avísame! 😎
