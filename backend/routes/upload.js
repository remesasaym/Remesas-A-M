const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../supabaseClient');
const { validateFileUpload, scanForMalware } = require('../middleware/fileValidator');
const logger = require('pino')();

// Middleware de autenticación
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = user;
    next();
};

// Configure multer for memory storage with file type validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Solo permitir imágenes y PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no soportado. Solo se permiten imágenes y PDF.'));
        }
    }
});

// Middleware para manejar errores de Multer
const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Error de Multer (ej. tamaño excedido)
            return res.status(400).json({ message: `Error de subida: ${err.message}` });
        } else if (err) {
            // Otro error (ej. fileFilter)
            return res.status(400).json({ message: err.message });
        }
        // Si no hay error, continuar
        next();
    });
};

router.post('/', authenticate, uploadMiddleware, validateFileUpload, scanForMalware, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const userId = req.user.id; // Usar el ID del usuario autenticado

        // Generate a unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        console.log(`Uploading file to ${filePath}...`);

        // Upload to Supabase Storage using the service role key (bypasses RLS)
        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase storage error:', error);
            throw error;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);

        console.log('Upload successful, public URL:', publicUrlData.publicUrl);

        res.json({ publicUrl: publicUrlData.publicUrl });

    } catch (error) {
        console.error('Upload route error:', error);
        res.status(500).json({ error: error.message || 'Error uploading file' });
    }
});

module.exports = router;
