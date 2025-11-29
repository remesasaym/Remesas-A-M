const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.ADMIN_UID;

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan credenciales de Supabase');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetKYC() {
    console.log(`Reseteando KYC para usuario: ${userId}`);

    // Intentar actualizar is_verified (snake_case)
    const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);

    if (error) {
        console.error('Error al actualizar is_verified:', error);
    } else {
        console.log('✅ KYC reseteado exitosamente (is_verified = false)');
    }
}

resetKYC();
