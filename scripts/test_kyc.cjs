const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminUid = process.env.ADMIN_UID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKYCVerification() {
    console.log('🚀 Iniciando prueba de verificación KYC...\n');

    try {
        // 1. Crear imágenes de prueba simples (1x1 pixel PNG)
        console.log('📸 Creando imágenes de prueba...');

        // PNG de 1x1 pixel transparente en base64
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testImageBuffer = Buffer.from(testImageBase64, 'base64');

        // 2. Subir imágenes a Supabase Storage
        console.log('☁️  Subiendo documentos a Supabase Storage...');

        const timestamp = Date.now();
        const userId = adminUid;

        const uploads = [
            { type: 'id', path: `${userId}/test-id-${timestamp}.png` },
            { type: 'address', path: `${userId}/test-address-${timestamp}.png` },
            { type: 'selfie', path: `${userId}/test-selfie-${timestamp}.png` }
        ];

        const docUrls = {};

        for (const upload of uploads) {
            const { error } = await supabase.storage
                .from('user-documents')
                .upload(upload.path, testImageBuffer, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (error) {
                console.error(`❌ Error subiendo ${upload.type}:`, error.message);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user-documents')
                .getPublicUrl(upload.path);

            docUrls[upload.type] = publicUrl;
            console.log(`   ✅ ${upload.type}: ${publicUrl}`);
        }

        // 3. Obtener token de autenticación del usuario admin
        console.log('\n🔐 Obteniendo token de autenticación...');

        // Crear sesión temporal para el admin
        const { data: sessionData, error: authError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: adminEmail
        });

        if (authError) {
            console.error('❌ Error generando link:', authError.message);
            throw authError;
        }

        // Extraer token de la URL
        const tokenMatch = sessionData.properties.action_link.match(/token=([^&]+)/);
        if (!tokenMatch) {
            throw new Error('No se pudo extraer el token del magic link');
        }

        // Verificar el token para obtener una sesión válida
        const { data: { session }, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenMatch[1],
            type: 'magiclink'
        });

        if (verifyError || !session) {
            console.error('❌ Error verificando token');
            // Intentar método alternativo: usar el service role key directamente
            console.log('⚠️  Usando método alternativo con Service Role Key...');
        }

        const accessToken = session?.access_token || supabaseKey; // Fallback al service key

        console.log('   ✅ Token obtenido');

        // 4. Llamar al endpoint de verificación KYC
        console.log('\n🤖 Llamando al endpoint /api/kyc/verify...');

        const response = await fetch('http://localhost:3001/api/kyc/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                fullName: 'Anthony Pinero Test',
                country: 'CO',
                documentId: '123456789',
                address: 'Calle Prueba 123, Bogotá',
                phone: '+573001234567',
                docUrls: {
                    id: docUrls.id,
                    address: docUrls.address,
                    selfie: docUrls.selfie
                }
            })
        });

        const result = await response.json();

        console.log('\n📊 RESULTADO DE LA VERIFICACIÓN:');
        console.log('═══════════════════════════════════════');

        if (response.ok) {
            console.log('✅ Estado:', result.status);
            console.log('🎯 Confianza IA:', (result.aiConfidence * 100).toFixed(1) + '%');
            console.log('📋 Revisión manual:', result.requiresManualReview ? 'Sí' : 'No');
            console.log('💬 Mensaje:', result.message);
            console.log('\n🎉 ¡VERIFICACIÓN COMPLETADA EXITOSAMENTE!');
        } else {
            console.log('❌ Error HTTP:', response.status);
            console.log('💬 Mensaje:', result.message);
            console.log('📝 Detalles:', result.details || 'N/A');
            console.log('\n⚠️  La verificación falló. Ver detalles arriba.');
        }

        console.log('═══════════════════════════════════════\n');

        // 5. Limpiar archivos de prueba
        console.log('🧹 Limpiando archivos de prueba...');
        for (const upload of uploads) {
            await supabase.storage
                .from('user-documents')
                .remove([upload.path]);
        }
        console.log('   ✅ Archivos eliminados\n');

    } catch (error) {
        console.error('\n❌ ERROR GENERAL:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testKYCVerification();
