// backend/middleware/webhookValidator.js
const crypto = require('crypto');
const logger = require('pino')();

/**
 * Valida la firma HMAC de webhooks de Thunes
 * Docs: https://developers.thunes.com/docs/webhooks
 */
const validateThunesWebhook = (req, res, next) => {
    try {
        const signature = req.headers['x-thunes-signature'];
        const secret = process.env.THUNES_WEBHOOK_SECRET;

        if (!secret) {
            logger.error('THUNES_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        if (!signature) {
            logger.warn('Missing webhook signature');
            return res.status(401).json({ error: 'Missing signature' });
        }

        // Generar HMAC del payload
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        // Comparación segura contra timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            logger.warn({ signature, expectedSignature }, 'Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        logger.info('Webhook signature validated successfully');
        next();
    } catch (error) {
        logger.error({ error }, 'Error validating webhook signature');
        return res.status(500).json({ error: 'Signature validation failed' });
    }
};

/**
 * Valida la firma HMAC de webhooks de Persona
 * Docs: https://docs.withpersona.com/docs/webhooks
 */
const validatePersonaWebhook = (req, res, next) => {
    try {
        const signature = req.headers['persona-signature'];
        const timestamp = req.headers['persona-timestamp'];
        const secret = process.env.PERSONA_WEBHOOK_SECRET;

        if (!secret) {
            logger.error('PERSONA_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        if (!signature || !timestamp) {
            logger.warn('Missing webhook signature or timestamp');
            return res.status(401).json({ error: 'Missing signature or timestamp' });
        }

        // Verificar que el timestamp no sea muy antiguo (prevenir replay attacks)
        const currentTime = Math.floor(Date.now() / 1000);
        const timestampAge = currentTime - parseInt(timestamp);

        if (timestampAge > 300) { // 5 minutos
            logger.warn({ timestampAge }, 'Webhook timestamp too old');
            return res.status(401).json({ error: 'Timestamp too old' });
        }

        // Generar HMAC del payload con timestamp
        const payload = `${timestamp}.${JSON.stringify(req.body)}`;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        // Comparación segura
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) {
            logger.warn('Invalid Persona webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        logger.info('Persona webhook signature validated successfully');
        next();
    } catch (error) {
        logger.error({ error }, 'Error validating Persona webhook signature');
        return res.status(500).json({ error: 'Signature validation failed' });
    }
};

module.exports = {
    validateThunesWebhook,
    validatePersonaWebhook,
};
