const { supabase } = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('Ejecutando migración: create_transactions_table.sql\n');

    const sqlPath = path.join(__dirname, 'migrations', 'create_transactions_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;

        console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
            console.error(`❌ Error en statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
            console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
        }
    }

    console.log('\n✅ Migración completada');
}

runMigration().catch(err => {
    console.error('Error ejecutando migración:', err);
    process.exit(1);
});
