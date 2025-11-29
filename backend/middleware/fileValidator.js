// backend/middleware/fileValidator.js
const crypto = require('crypto');
const logger = require('pino')();

/**
 * Valida que el archivo sea realmente una imagen verificando magic bytes
 * No confía solo en la extensión o MIME type del cliente
 */
const validateImageMagicBytes = (buffer) => {
    // Magic bytes de formatos de imagen comunes
    const magicBytes = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46], // RIFF
        bmp: [0x42, 0x4D],
    };

    // Verificar cada formato
    for (const [format, bytes] of Object.entries(magicBytes)) {
        let matches = true;
        for (let i = 0; i < bytes.length; i++) {
            if (buffer[i] !== bytes[i]) {
                matches = false;
                break;
            }
        }
        if (matches) {
            return { valid: true, format };
        }
    }

    return { valid: false, format: null };
};

/**
 * Valida que el archivo sea realmente un PDF verificando magic bytes
 */
const validatePDFMagicBytes = (buffer) => {
    const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF

    for (let i = 0; i < pdfMagicBytes.length; i++) {
        if (buffer[i] !== pdfMagicBytes[i]) {
            return false;
        }
    }

    return true;
};

/**
 * Middleware mejorado de validación de archivos
 */
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const file = req.file;
    const buffer = file.buffer;

    try {
        // 1. Validar tamaño (ya lo hace multer, pero doble verificación)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (buffer.length > MAX_SIZE) {
            logger.warn({ size: buffer.length }, 'File size exceeds limit');
            return res.status(400).json({
                error: 'Archivo demasiado grande. Máximo 5MB.'
            });
        }

        // 2. Validar magic bytes según el tipo
        let isValid = false;
        let detectedFormat = null;

        if (file.mimetype.startsWith('image/')) {
            const imageValidation = validateImageMagicBytes(buffer);
            isValid = imageValidation.valid;
            detectedFormat = imageValidation.format;

            if (!isValid) {
                logger.warn({
                    declaredMime: file.mimetype,
                    filename: file.originalname
                }, 'Invalid image file - magic bytes mismatch');

                return res.status(400).json({
                    error: 'El archivo no es una imagen válida.'
                });
            }
        } else if (file.mimetype === 'application/pdf') {
            isValid = validatePDFMagicBytes(buffer);

            if (!isValid) {
                logger.warn({
                    declaredMime: file.mimetype,
                    filename: file.originalname
                }, 'Invalid PDF file - magic bytes mismatch');

                return res.status(400).json({
                    error: 'El archivo no es un PDF válido.'
                });
            }
            detectedFormat = 'pdf';
        }

        // 3. Calcular hash del archivo para detección de duplicados (opcional)
        const fileHash = crypto
            .createHash('sha256')
            .update(buffer)
            .digest('hex');

        // Agregar metadata al request para uso posterior
        req.fileMetadata = {
            hash: fileHash,
            detectedFormat,
            validatedSize: buffer.length,
            validatedAt: new Date().toISOString(),
        };

        logger.info({
            format: detectedFormat,
            size: buffer.length,
            hash: fileHash.substring(0, 16) + '...'
        }, 'File validated successfully');

        next();
    } catch (error) {
        logger.error({ error }, 'Error validating file');
        return res.status(500).json({
            error: 'Error al validar el archivo.'
        });
    }
};

/**
 * Validación básica de malware usando patrones conocidos
 * NOTA: Para producción, usar servicio dedicado como ClamAV o VirusTotal
 */
const basicMalwareCheck = (buffer) => {
    // Patrones sospechosos comunes en archivos maliciosos
    const suspiciousPatterns = [
        Buffer.from('eval('),
        Buffer.from('<script'),
        Buffer.from('<?php'),
        Buffer.from('#!/bin/bash'),
        Buffer.from('powershell'),
    ];

    for (const pattern of suspiciousPatterns) {
        if (buffer.includes(pattern)) {
            return { suspicious: true, pattern: pattern.toString() };
        }
    }

    return { suspicious: false };
};

/**
 * Middleware de escaneo básico de malware
 * Para producción, integrar con ClamAV o servicio cloud
 */
const scanForMalware = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const result = basicMalwareCheck(req.file.buffer);

        if (result.suspicious) {
            logger.warn({
                pattern: result.pattern,
                filename: req.file.originalname,
                userId: req.user?.id
            }, 'Suspicious file detected');

            return res.status(400).json({
                error: 'Archivo sospechoso detectado. Por favor, contacta soporte.'
            });
        }

        next();
    } catch (error) {
        logger.error({ error }, 'Error scanning file for malware');
        return res.status(500).json({
            error: 'Error al escanear el archivo.'
        });
    }
};

module.exports = {
    validateFileUpload,
    scanForMalware,
    validateImageMagicBytes,
    validatePDFMagicBytes,
};
