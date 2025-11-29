const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');
const { verifyIdentity } = require('../ia/gemini');
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
        logger.warn({ error }, 'Invalid authentication token');
        return res.status(401).json({ message: 'Token inválido' });
    }

    req.user = user;
    next();
};

/**
 * Verify KYC documents with Gemini AI
 * POST /api/kyc/verify
 * Requiere autenticación. Procesa documentos y retorna resultado de verificación.
 */
router.post('/verify', authenticate, async (req, res) => {
    const {
        fullName,
        country,
        documentId,
        address,
        phone,
        docUrls // { id, address, selfie }
    } = req.body;

    try {
        // 1. Validar entrada
        if (!fullName || !country || !documentId || !address || !phone) {
            logger.warn({ userId: req.user.id }, 'Missing required fields in KYC request');
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }

        if (!docUrls?.id || !docUrls?.address || !docUrls?.selfie) {
            logger.warn({ userId: req.user.id }, 'Missing document URLs in KYC request');
            return res.status(400).json({ message: 'Faltan documentos requeridos' });
        }

        logger.info({ userId: req.user.id, country }, 'Starting KYC verification');

        const sharp = require('sharp');

        // ... existing code ...

        // 2. Descargar imágenes de Supabase Storage y convertir a Base64
        const downloadAndEncode = async (publicUrl) => {
            // Extraer el path del archivo desde la URL pública
            // URL format: https://{project}.supabase.co/storage/v1/object/public/user-documents/{path}
            const urlParts = publicUrl.split('/user-documents/');
            if (urlParts.length < 2) {
                throw new Error(`Invalid storage URL format: ${publicUrl}`);
            }
            const filePath = urlParts[1];

            // Descargar usando el SDK de Supabase (con Service Role Key)
            const { data, error } = await supabase.storage
                .from('user-documents')
                .download(filePath);

            if (error) {
                throw new Error(`Failed to download document from storage: ${error.message}`);
            }

            // Convertir Blob a Buffer
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = data.type || 'application/octet-stream';

            console.log(`📂 Procesando archivo: ${filePath} (${mimeType}, ${buffer.length} bytes)`);

            // Si es una imagen soportada por Sharp, la optimizamos
            if (mimeType.startsWith('image/')) {
                try {
                    const processedBuffer = await sharp(buffer)
                        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                        .jpeg({ quality: 90 })
                        .toBuffer();

                    return {
                        base64: processedBuffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    };
                } catch (sharpError) {
                    console.warn(`⚠️ Error optimizando imagen con Sharp (${filePath}), enviando original:`, sharpError.message);
                    // Si falla sharp (ej: formato raro), enviamos el original
                    return {
                        base64: buffer.toString('base64'),
                        mimeType: mimeType
                    };
                }
            }

            // Si es PDF u otro formato, lo enviamos tal cual a Gemini
            return {
                base64: buffer.toString('base64'),
                mimeType: mimeType
            };
        };

        const [idDoc, addressDoc, selfieDoc] = await Promise.all([
            downloadAndEncode(docUrls.id),
            downloadAndEncode(docUrls.address),
            downloadAndEncode(docUrls.selfie)
        ]);

        logger.debug({ userId: req.user.id }, 'Documents downloaded and encoded');
        console.log('✅ Documentos descargados y codificados');

        // 3. Llamar Gemini AI
        console.log('🤖 Llamando a Gemini AI verifyIdentity...');
        console.log('Parámetros:', { country, addressText: address });

        const { id: idResult, address: addressResult, face: faceMatchResult } =
            await verifyIdentity({
                idDocBase64: idDoc.base64,
                idDocMimeType: idDoc.mimeType,
                addressDocBase64: addressDoc.base64,
                addressDocMimeType: addressDoc.mimeType,
                selfieBase64: selfieDoc.base64,
                selfieMimeType: selfieDoc.mimeType,
                country,
                addressText: address
            });

        console.log('✅ Gemini AI respondió exitosamente');
        console.log('Resultados:', { idResult, addressResult, faceMatchResult });
        logger.debug({ userId: req.user.id }, 'Gemini AI verification completed');

        // 4. Calcular confianza AI
        const AI_CONFIDENCE_THRESHOLD = 0.95;

        const validations = {
            is_authentic: idResult.is_authentic === true,
            is_not_expired: idResult.is_expired === false,
            is_from_country: idResult.is_from_country === true,
            id_matches: false,
            address_matches: addressResult.address_matches === true,
            faces_match: faceMatchResult.faces_match === true,
            no_parsing_errors: true
        };

        // Validar ID extraído vs. ingresado
        const extractedId = (idResult.document_id || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        const userInputId = documentId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
        validations.id_matches = extractedId && extractedId === userInputId;

        const passedValidations = Object.values(validations).filter(v => v === true).length;
        const totalValidations = Object.keys(validations).length;
        const aiConfidence = passedValidations / totalValidations;

        const requiresManualReview = aiConfidence < AI_CONFIDENCE_THRESHOLD;
        const autoApproved = !requiresManualReview;

        logger.info({
            userId: req.user.id,
            aiConfidence,
            autoApproved,
            validations
        }, 'KYC validation results calculated');

        // 5. Preparar datos de validación
        const aiValidationData = {
            timestamp: new Date().toISOString(),
            validations,
            results: { id: idResult, address: addressResult, faceMatch: faceMatchResult },
            confidence: aiConfidence,
            threshold: AI_CONFIDENCE_THRESHOLD,
        };

        // 6. Guardar en verification_requests
        const { error: requestError } = await supabase
            .from('verification_requests')
            .insert({
                user_id: req.user.id,
                full_name: fullName,
                country,
                document_id: documentId,
                address,
                id_document_url: docUrls.id,
                address_proof_url: docUrls.address,
                selfie_url: docUrls.selfie,
                phone,
                status: autoApproved ? 'approved' : 'pending',
                ai_validation: aiValidationData,
                ai_confidence: aiConfidence,
                requires_manual_review: requiresManualReview,
                auto_approved: autoApproved,
            });

        if (requestError) {
            logger.error({ error: requestError, userId: req.user.id }, 'Failed to insert verification request');
            throw requestError;
        }

        // 7. Actualizar perfil si auto-aprobado
        if (autoApproved) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    is_verified: true,
                    phone,
                    full_name: fullName
                })
                .eq('id', req.user.id);

            if (profileError) {
                logger.error({ error: profileError, userId: req.user.id }, 'Failed to update profile (auto-approved)');
                throw profileError;
            }

            logger.info({ userId: req.user.id, aiConfidence }, '✅ KYC auto-approved');
        } else {
            // Solo actualizar phone y nombre si no auto-aprobado
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ phone, full_name: fullName })
                .eq('id', req.user.id);

            if (profileError) {
                logger.error({ error: profileError, userId: req.user.id }, 'Failed to update profile (pending review)');
                throw profileError;
            }

            logger.info({ userId: req.user.id, aiConfidence }, '📋 KYC sent to manual review');
        }

        // 8. Retornar resultado
        res.status(200).json({
            status: autoApproved ? 'approved' : 'pending',
            aiConfidence,
            requiresManualReview,
            message: autoApproved
                ? 'Verificación completada exitosamente'
                : 'Tu solicitud está en revisión manual'
        });

    } catch (error) {
        console.error('❌ ERROR EN KYC VERIFICATION:');
        console.error('Error message:', error.message);

        // Manejo específico de errores de Gemini
        if (error.message.includes("Unable to process input image") ||
            error.message.includes("400") ||
            (error.status === 400)) {
            return res.status(400).json({
                message: "No se pudo procesar la imagen. Asegúrate de que esté bien enfocada, sin reflejos y que sea una foto real del documento.",
                details: error.message
            });
        }

        logger.error({ error: error.message, stack: error.stack, userId: req.user.id }, 'KYC verification error');
        res.status(500).json({
            message: 'Error interno: ' + (error.message || error),
            details: error.toString()
        });
    }
});

/**
 * Upload KYC documents
 * POST /api/kyc/upload
 * Usa bucket 'user-documents' y tabla 'verification_requests' existentes
 */
router.post('/upload', async (req, res) => {
    try {
        const { userId, documentImage, selfieImage, fullName, country, documentId, address, phone } = req.body;

        if (!userId || !documentImage || !selfieImage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Helper to convert base64 to buffer
        const base64ToBuffer = (base64) => {
            const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        };

        // 1. Upload document image to existing bucket
        const documentPath = `${userId}/kyc-document-${Date.now()}.jpg`;
        const documentBuffer = base64ToBuffer(documentImage);

        const { error: docError } = await supabase.storage
            .from('user-documents')
            .upload(documentPath, documentBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (docError) {
            console.error('Document upload error:', docError);
            return res.status(500).json({ error: `Document upload failed: ${docError.message}` });
        }

        // 2. Upload selfie image
        const selfiePath = `${userId}/kyc-selfie-${Date.now()}.jpg`;
        const selfieBuffer = base64ToBuffer(selfieImage);

        const { error: selfieError } = await supabase.storage
            .from('user-documents')
            .upload(selfiePath, selfieBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (selfieError) {
            console.error('Selfie upload error:', selfieError);
            return res.status(500).json({ error: `Selfie upload failed: ${selfieError.message}` });
        }

        // 3. Get public URLs
        const { data: { publicUrl: documentUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(documentPath);

        const { data: { publicUrl: selfieUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(selfiePath);

        // 4. Create verification record in existing table
        const { data: verification, error: dbError } = await supabase
            .from('verification_requests')
            .insert({
                user_id: userId,
                full_name: fullName || '',
                country: country || '',
                document_id: documentId || '',
                address: address || '',
                phone: phone || '',
                id_document_url: documentUrl,
                selfie_url: selfieUrl,
                status: 'pending',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ error: `Database error: ${dbError.message}` });
        }

        console.log('✅ KYC documents uploaded successfully:', verification.id);

        res.json({
            success: true,
            verificationId: verification.id,
            status: 'pending',
        });
    } catch (error) {
        console.error('❌ Error in KYC upload:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
});

/**
 * Get KYC status for a user
 * GET /api/kyc/status/:userId
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('verification_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error getting KYC status:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!data) {
            return res.json({ status: 'not_started' });
        }

        res.json({
            status: data.status || 'pending',
            verificationId: data.id,
            documentUrl: data.id_document_url,
            selfieUrl: data.selfie_url,
            createdAt: data.created_at,
            country: data.country,
        });
    } catch (error) {
        console.error('❌ Error getting KYC status:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
});

/**
 * Get all pending verifications (Admin only)
 * GET /api/kyc/pending
 */
router.get('/pending', async (req, res) => {
    try {
        // 1. Get pending verifications
        const { data: verifications, error } = await supabase
            .from('verification_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error getting pending verifications:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!verifications || verifications.length === 0) {
            return res.json({ verifications: [] });
        }

        // 2. Manually fetch profiles for these verifications
        // This avoids complex join syntax issues
        const userIds = [...new Set(verifications.map(v => v.user_id))];

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Continue without profiles if error, to avoid blocking admin
        }

        // 3. Merge data
        const enrichedVerifications = verifications.map(v => {
            const profile = profiles?.find(p => p.id === v.user_id) || {};
            return {
                ...v,
                profiles: {
                    full_name: profile.full_name || v.full_name || 'Unknown',
                    email: profile.email || 'No email',
                    phone: profile.phone || v.phone || ''
                }
            };
        });

        res.json({ verifications: enrichedVerifications });
    } catch (error) {
        console.error('❌ Error getting pending verifications:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
});

/**
 * Review verification (Admin only)
 * POST /api/kyc/review
 */
router.post('/review', async (req, res) => {
    try {
        const { verificationId, adminId, approved, reason, notes } = req.body;

        if (!verificationId || !adminId || approved === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const status = approved ? 'approved' : 'rejected';
        const reviewedAt = new Date().toISOString();

        console.log(`📝 Processing review for ${verificationId}: ${status}`);

        // 1. Try to update verification status with ALL fields
        // This might fail if columns reviewed_at, rejection_reason, admin_notes don't exist
        let { error: updateError } = await supabase
            .from('verification_requests')
            .update({
                status: status,
                reviewed_at: reviewedAt,
                rejection_reason: reason || null,
                admin_notes: notes || null
            })
            .eq('id', verificationId);

        if (updateError) {
            console.warn('⚠️ Full update failed (likely missing columns), trying minimal update. Error:', updateError.message);

            // Fallback: Update ONLY status
            const { error: minimalError } = await supabase
                .from('verification_requests')
                .update({
                    status: status
                })
                .eq('id', verificationId);

            if (minimalError) {
                console.error('❌ Minimal update also failed:', minimalError);
                return res.status(500).json({ error: minimalError.message });
            }
        }

        // 2. If approved, update user's is_verified status
        if (approved) {
            const { data: verification } = await supabase
                .from('verification_requests')
                .select('user_id')
                .eq('id', verificationId)
                .single();

            if (verification) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ is_verified: true })
                    .eq('id', verification.user_id);

                if (profileError) {
                    console.error('⚠️ Failed to update profile verification status:', profileError);
                } else {
                    console.log('✅ User profile marked as verified');
                }

                // Enviar notificación de aprobación
                const { data: user } = await supabase.from('profiles').select('email, full_name').eq('id', verification.user_id).single();
                if (user && user.email) {
                    const { sendKycStatusEmail } = require('../services/notificationService');
                    sendKycStatusEmail(user, 'approved').catch(err => console.error('Error sending KYC email:', err));
                }
            }
        } else {
            // Enviar notificación de rechazo
            // Necesitamos el user_id para buscar el email
            const { data: verification } = await supabase.from('verification_requests').select('user_id').eq('id', verificationId).single();
            if (verification) {
                const { data: user } = await supabase.from('profiles').select('email, full_name').eq('id', verification.user_id).single();
                if (user && user.email) {
                    const { sendKycStatusEmail } = require('../services/notificationService');
                    sendKycStatusEmail(user, 'rejected', reason).catch(err => console.error('Error sending KYC email:', err));
                }
            }
        }

        console.log(`✅ KYC verification ${approved ? 'approved' : 'rejected'} successfully`);

        res.json({
            success: true,
            warning: updateError ? 'Saved status only (schema update needed)' : null
        });
    } catch (error) {
        console.error('❌ Error reviewing verification:', error);
        res.status(500).json({ error: error.message || 'Unknown error' });
    }
});

/**
 * Generate signed URL for a file (Admin/Auth only)
 * POST /api/kyc/signed-url
 */
router.post('/signed-url', authenticate, async (req, res) => {
    try {
        const { path, bucket } = req.body;
        if (!path) return res.status(400).json({ error: 'Missing path' });

        // Usamos el cliente de supabase con Service Role Key (admin)
        const { data, error } = await supabase.storage
            .from(bucket || 'user-documents')
            .createSignedUrl(path, 60 * 60); // 1 hora

        if (error) throw error;

        res.json({ signedUrl: data.signedUrl });
    } catch (error) {
        console.error('❌ Error generating signed URL:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
