const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpb2V0Y3h4cWR3bnR3eGxtZmhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTExMDksImV4cCI6MjA3NzU4NzEwOX0.6eCmAXcBHsb8Mx1BjInBphWkhhyub8u1eOHZtUDaZMs';
const adminEmail = process.env.ADMIN_EMAIL;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

async function testKYC() {
    const log = {
        steps: [],
        result: null,
        error: null
    };

    try {
        // 1. Autenticar
        log.steps.push('Autenticando usuario...');
        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
            email: adminEmail,
            password: 'Anthonypinero2@'
        });

        if (authError) {
            log.error = 'Error de autenticacion: ' + authError.message;
            fs.writeFileSync('kyc_test_result.json', JSON.stringify(log, null, 2));
            return;
        }

        const accessToken = authData.session.access_token;
        log.steps.push('Token obtenido OK');

        // 2. Subir documentos
        log.steps.push('Subiendo documentos...');
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
            await supabaseAuth.storage.from('user-documents').upload(filePath, testImageBuffer, { contentType: 'image/png' });
            const { data } = supabaseAuth.storage.from('user-documents').getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }

        log.steps.push('3 documentos subidos OK');

        // 3. Llamar API
        log.steps.push('Llamando API /api/kyc/verify...');
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
        log.result = {
            httpStatus: response.status,
            response: result
        };

        // 4. Limpiar
        for (const filePath of paths) {
            await supabaseAuth.storage.from('user-documents').remove([filePath]);
        }
        log.steps.push('Archivos limpiados');

    } catch (error) {
        log.error = error.message;
        log.errorStack = error.stack;
    }

    fs.writeFileSync('kyc_test_result.json', JSON.stringify(log, null, 2));
    console.log('Resultado guardado en kyc_test_result.json');
}

testKYC();
