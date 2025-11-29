const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb2V0Y3h4cWR3bnR3eGxtZmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTExMDksImV4cCI6MjA3NzU4NzEwOX0.qLHlYpCNlxCfWvbZwXEqJIHjp0KvOGKtqJCEWcxWLSo'; // Anon key del proyecto
const adminEmail = process.env.ADMIN_EMAIL;

// Cliente con anon key para autenticación
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

async function testKYC() {
    console.log('=== PRUEBA DE VERIFICACION KYC ===');
    console.log('');

    try {
        // 1. Autenticar como usuario admin
        console.log('1. Autenticando usuario...');
        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
            email: adminEmail,
            password: 'Anthonypinero2@' // Password del admin
        });

        if (authError) {
            console.log('ERROR DE AUTENTICACION:', authError.message);
            return;
        }

        const accessToken = authData.session.access_token;
        console.log('   OK - Token obtenido');
        console.log('');

        // 2. Subir documentos
        console.log('2. Subiendo documentos de prueba...');
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testImageBuffer = Buffer.from(testImageBase64, 'base64');

        const timestamp = Date.now();
        const userId = authData.user.id;

        const paths = [
            `${userId}/test-id-${timestamp}.png`,
            `${userId}/test-address-${timestamp}.png`,
            `${userId}/test-selfie-${timestamp}.png`
        ];

        const urls = [];
        for (const filePath of paths) {
            const { error } = await supabaseAuth.storage.from('user-documents').upload(filePath, testImageBuffer, { contentType: 'image/png' });
            if (error) {
                console.log('   ERROR subiendo:', error.message);
                return;
            }
            const { data } = supabaseAuth.storage.from('user-documents').getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }

        console.log('   OK - 3 documentos subidos');
        console.log('');

        // 3. Llamar API de verificación
        console.log('3. Llamando API de verificacion KYC...');
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
                address: 'Calle Prueba 123, Bogota',
                phone: '+573001234567',
                docUrls: {
                    id: urls[0],
                    address: urls[1],
                    selfie: urls[2]
                }
            })
        });

        const result = await response.json();
        console.log('');
        console.log('=== RESULTADO ===');
        console.log('HTTP Status:', response.status);
        console.log('');
        console.log(JSON.stringify(result, null, 2));
        console.log('');

        // 4. Limpiar archivos
        console.log('4. Limpiando archivos de prueba...');
        for (const filePath of paths) {
            await supabaseAuth.storage.from('user-documents').remove([filePath]);
        }
        console.log('   OK - Archivos eliminados');
        console.log('');

        if (response.ok) {
            console.log('=== EXITO ===');
            console.log('La verificacion KYC funciona correctamente!');
        } else {
            console.log('=== ERROR ===');
            console.log('La verificacion fallo. Ver detalles arriba.');
        }

    } catch (error) {
        console.log('');
        console.log('=== ERROR GENERAL ===');
        console.log(error.message);
        console.log(error.stack);
    }
}

testKYC();
