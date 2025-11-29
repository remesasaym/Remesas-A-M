-- Resetear estado de verificación para el usuario admin
UPDATE profiles
SET is_verified = false,
    verification_status = 'pending',
    verification_submitted_at = NULL
WHERE id = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda';

-- Limpiar logs de auditoría relacionados (opcional, para limpieza)
DELETE FROM verification_requests WHERE user_id = '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda';
