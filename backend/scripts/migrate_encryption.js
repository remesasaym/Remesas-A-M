require('dotenv').config({ path: '../.env' });
const { supabase } = require('../supabaseClient');
const { encrypt, decrypt } = require('../services/encryptionService');
const logger = require('pino')();

async function migrateEncryption() {
    logger.info('Starting encryption migration...');

    try {
        // 1. Fetch all transactions
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*');

        if (error) {
            throw new Error(`Error fetching transactions: ${error.message}`);
        }

        logger.info(`Found ${transactions.length} transactions to process.`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const tx of transactions) {
            try {
                // Check if already encrypted with new format (contains ':')
                // This is a heuristic, but our new format is iv:tag:data
                const isNewFormat = (text) => text && text.includes(':') && text.split(':').length === 3;

                if (isNewFormat(tx.recipient_name) && isNewFormat(tx.recipient_account)) {
                    logger.debug({ transaction_id: tx.transaction_id }, 'Skipping already encrypted transaction');
                    continue;
                }

                // Decrypt (will use fallback if base64)
                const name = decrypt(tx.recipient_name);
                const bank = decrypt(tx.recipient_bank);
                const account = decrypt(tx.recipient_account);
                const id = decrypt(tx.recipient_id);

                // Encrypt with new key (AES-256)
                const newName = encrypt(name);
                const newBank = encrypt(bank);
                const newAccount = encrypt(account);
                const newId = encrypt(id);

                // Update in DB
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({
                        recipient_name: newName,
                        recipient_bank: newBank,
                        recipient_account: newAccount,
                        recipient_id: newId
                    })
                    .eq('transaction_id', tx.transaction_id);

                if (updateError) {
                    logger.error({ transaction_id: tx.transaction_id, error: updateError }, 'Failed to update transaction');
                    errorCount++;
                } else {
                    updatedCount++;
                    if (updatedCount % 10 === 0) {
                        logger.info(`Processed ${updatedCount} transactions...`);
                    }
                }

            } catch (err) {
                logger.error({ transaction_id: tx.transaction_id, error: err }, 'Error processing transaction');
                errorCount++;
            }
        }

        logger.info(`Migration completed. Updated: ${updatedCount}, Errors: ${errorCount}, Skipped: ${transactions.length - updatedCount - errorCount}`);

    } catch (error) {
        logger.error({ error }, 'Fatal error during migration');
    }
}

migrateEncryption();
