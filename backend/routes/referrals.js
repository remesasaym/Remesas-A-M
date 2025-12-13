const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const logger = require('pino')();

// Helper to generate a random code
function generateCode(name) {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${random}`;
}

// Generar o recuperar código de referido
router.post('/generate-code', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // 1. Verificar si ya tiene código
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('referral_code, full_name')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        if (profile.referral_code) {
            return res.json({ code: profile.referral_code });
        }

        // 2. Generar nuevo código
        let newCode = generateCode(profile.full_name || 'USER');
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', newCode)
                .maybeSingle();

            if (!data) isUnique = true;
            else {
                newCode = generateCode(profile.full_name || 'USER');
                attempts++;
            }
        }

        if (!isUnique) throw new Error('Could not generate unique code');

        // 3. Guardar código
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ referral_code: newCode })
            .eq('id', userId);

        if (updateError) throw updateError;

        logger.info({ userId, newCode }, 'Referral code generated');
        res.json({ code: newCode });

    } catch (error) {
        logger.error({ error, userId }, 'Error generating referral code');
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Obtener estadísticas de referidos
router.get('/stats', async (req, res) => {
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ message: 'User ID required' });

    try {
        // Obtener créditos actuales
        const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        // Obtener lista de referidos
        const { data: referrals, error } = await supabase
            .from('referrals')
            .select('status, created_at, profiles!referrals_referee_id_fkey(full_name)')
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const stats = {
            totalEarned: profile?.credits || 0,
            totalInvited: referrals.length,
            completed: referrals.filter(r => r.status === 'COMPLETED').length,
            pending: referrals.filter(r => r.status === 'PENDING').length,
            history: referrals.map(r => ({
                name: r.profiles?.full_name || 'Usuario',
                status: r.status,
                date: r.created_at
            }))
        };

        res.json(stats);

    } catch (error) {
        logger.error({ error, userId }, 'Error fetching referral stats');
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Validar código (para usar al registrarse)
router.post('/validate', async (req, res) => {
    const { code } = req.body;

    if (!code) return res.status(400).json({ valid: false });

    try {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('referral_code', code.toUpperCase())
            .maybeSingle();

        if (data) {
            res.json({ valid: true, referrerName: data.full_name });
        } else {
            res.json({ valid: false, message: 'Código inválido' });
        }
    } catch (e) {
        res.status(500).json({ valid: false });
    }
});

module.exports = router;
