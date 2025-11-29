// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter para endpoints de KYC (máximo 3 intentos por 15 minutos)
const kycLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Demasiados intentos de verificación. Por favor, intenta de nuevo en 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para uploads (máximo 10 archivos por hora)
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10,
    message: 'Demasiados archivos subidos. Por favor, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para remesas (máximo 20 transacciones por hora)
const remittanceLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,
    message: 'Demasiadas transacciones. Por favor, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter general para API (máximo 100 requests por 15 minutos)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    kycLimiter,
    uploadLimiter,
    remittanceLimiter,
    apiLimiter,
};
