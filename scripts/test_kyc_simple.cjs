const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUid = process.env.ADMIN_UID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKYC() {
    console.log('Iniciando prueba KYC...');

    try {
        // Crear imagen de prueba (PNG 1x1)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const testImageBuffer = Buffer.from(testImageBase64, 'base64');

        console.log('Subiendo documentos...');

        const timestamp = Date.now();
        const userId = adminUid;

        // Subir 3 documentos
        const paths = [
            `${userId}/test-id-${timestamp}.png`,
            `${userId}/test-address-${timestamp}.png`,
            `${userId}/test-selfie-${timestamp}.png`
        ];

        const urls = [];
        for (const filePath of paths) {
            await supabase.storage.from('user-documents').upload(filePath, testImageBuffer, { contentType: 'image/png' });
            const { data } = supabase.storage.from('user-documents').getPublicUrl(filePath);
            urls.push(data.publicUrl);
        }

        console.log('Documentos subidos OK');
        console.log('Llamando API...');

        // Llamar API
        const response = await fetch('http://localhost:3001/api/kyc/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}` // Usar service key directamente
            },
            body: JSON.stringify({
                fullName: 'Test User',
                country: 'CO',
                documentId: '123456789',
                address: 'Test Address 123',
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
        console.log('RESULTADO:');
        console.log('Status HTTP:', response.status);
        console.log('Respuesta:', JSON.stringify(result, null, 2));

        // Limpiar
        for (const filePath of paths) {
            await supabase.storage.from('user-documents').remove([filePath]);
        }

    } catch (error) {
        console.log('ERROR:', error.message);
    }
}

testKYC();
