import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../types';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import DocumentIcon from '../icons/DocumentIcon';
import UserAvatarIcon from '../icons/UserAvatarIcon';
import { supabase } from '../../supabaseClient';

interface KycVerification {
    id: string;
    user_id: string;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected';
    id_document_url: string;
    selfie_url: string;
    address_proof_url?: string;
    document_type: string;
    created_at: string;
    ai_validation?: any;
    ai_confidence?: number;
    requires_manual_review?: boolean;
    auto_approved?: boolean;
    profiles: {
        full_name: string;
        email: string;
        phone: string;
    };
}

interface KycReviewPanelProps {
    user: User;
}

const KycReviewPanel: React.FC<KycReviewPanelProps> = ({ user }) => {
    const [verifications, setVerifications] = useState<KycVerification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVerification, setSelectedVerification] = useState<KycVerification | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    // Mapa de traducción para las validaciones de IA
    const validationTranslations: Record<string, string> = {
        id_matches: 'Coincidencia de ID',
        faces_match: 'Rostros Coinciden',
        is_authentic: 'Es Auténtico',
        is_not_expired: 'No Ha Expirado',
        address_matches: 'Dirección Coincide',
        is_from_country: 'País Correcto',
        no_parsing_errors: 'Sin Errores de Lectura',
        document_type_matches: 'Tipo de Documento Correcto'
    };

    const REJECTION_REASONS = [
        "Documento ilegible o borroso",
        "Documento vencido o expirado",
        "El documento no coincide con los datos ingresados",
        "La selfie no coincide con la foto del documento",
        "La selfie está borrosa o muy oscura",
        "El documento parece alterado o falso",
        "Comprobante de domicilio no válido o muy antiguo",
        "Otro (especificar en notas)"
    ];

    // Función para obtener la URL correcta de la imagen
    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        // Si es una ruta relativa, asumimos que está en el bucket 'user-documents' (que es el que usa el backend)
        const { data } = supabase.storage.from('user-documents').getPublicUrl(path);
        return data.publicUrl;
    };

    const getDisplayUrl = (originalUrl: string) => {
        if (signedUrls[originalUrl]) return signedUrls[originalUrl];
        return getImageUrl(originalUrl);
    };

    const handleImageError = async (originalUrl: string, event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const imgElement = event.currentTarget;
        const parentElement = imgElement.parentElement;

        if (signedUrls[originalUrl]) {
            // Ya intentamos firmar y falló, mostrar error final
            imgElement.style.display = 'none';
            parentElement?.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
            if (parentElement) {
                parentElement.innerHTML = '<span class="text-gray-500 text-sm p-2 text-center">Imagen no disponible</span>';
            }
            return;
        }

        console.log('⚠️ Imagen falló al cargar, intentando obtener URL firmada para:', originalUrl);

        try {
            // Intentar extraer el path y el bucket
            let bucket = 'user-documents';
            let path = originalUrl;

            // Si es una URL completa de Supabase, intentamos extraer el path relativo
            if (originalUrl.includes('/user-documents/')) {
                bucket = 'user-documents';
                path = originalUrl.split('/user-documents/')[1];
            } else if (originalUrl.includes('/kyc-documents/')) {
                bucket = 'kyc-documents';
                path = originalUrl.split('/kyc-documents/')[1];
            }

            // Limpiar query params si existen
            if (path.includes('?')) path = path.split('?')[0];

            if (path) {
                if (path) {
                    // Usar backend para generar URL firmada (evita problemas de RLS)
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                    const response = await fetch(`${API_URL}/api/kyc/signed-url`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ path, bucket }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.signedUrl) {
                            console.log('✅ URL firmada generada con éxito (backend)');
                            setSignedUrls(prev => ({ ...prev, [originalUrl]: data.signedUrl }));
                            return;
                        }
                    } else {
                        console.error('Error generando URL firmada (backend):', await response.text());
                    }
                }
            }
        } catch (err) {
            console.error('Error en recuperación de imagen:', err);
        }

        // Si llegamos aquí, falló la firma o el path no es válido. Mostrar fallback.
        imgElement.style.display = 'none';
        parentElement?.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
        if (parentElement) {
            parentElement.innerHTML = '<span class="text-gray-500 text-sm p-2 text-center">Archivo no encontrado (404)</span>';
        }
    };

    useEffect(() => {
        loadPendingVerifications();
    }, []);

    const loadPendingVerifications = async () => {
        try {
            setIsLoading(true);

            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                console.error('❌ No auth token found');
                setIsLoading(false);
                return;
            }

            console.log('📡 Fetching pending verifications...');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/kyc/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error:', response.status, errorText);
                throw new Error(`Failed to load verifications: ${response.status}`);
            }

            const data = await response.json();
            console.log('🔍 KYC Data received:', data);

            if (data.verifications && data.verifications.length > 0) {
                setVerifications(data.verifications);
            } else {
                console.log('⚠️ No verifications found in response');
                setVerifications([]);
            }
        } catch (error) {
            console.error('❌ Error loading verifications:', error);
            setVerifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async (approved: boolean) => {
        if (!selectedVerification) return;

        if (!approved && !rejectionReason) {
            alert('Por favor selecciona un motivo de rechazo');
            return;
        }

        setIsProcessing(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${API_URL}/api/kyc/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    verificationId: selectedVerification.id,
                    adminId: user.id,
                    approved,
                    reason: approved ? null : rejectionReason,
                    notes: reviewNotes,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to review verification');

            if (data.warning) {
                console.warn(data.warning);
            }

            // Refresh list and close modal
            await loadPendingVerifications();
            setSelectedVerification(null);
            setReviewNotes('');
            setRejectionReason('');
        } catch (error) {
            console.error('Error reviewing verification:', error);
            alert('Error al procesar la revisión: ' + (error instanceof Error ? error.message : 'Error desconocido'));
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <div className="text-center py-12">
                    <Spinner className="w-8 h-8 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando verificaciones...</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Verificaciones KYC Pendientes</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {verifications.length} verificación{verifications.length !== 1 ? 'es' : ''} pendiente{verifications.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={loadPendingVerifications}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Actualizar
                    </button>
                </div>

                {verifications.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No hay verificaciones pendientes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verifications.map((verification) => (
                            <div
                                key={verification.id}
                                className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                                onClick={() => setSelectedVerification(verification)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-800 dark:text-white">
                                                {verification.profiles.full_name}
                                            </h3>
                                            {verification.ai_confidence && (
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${verification.ai_confidence >= 0.95
                                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                                    : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'
                                                    }`}>
                                                    IA: {(verification.ai_confidence * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {verification.profiles.email}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            Enviado: {new Date(verification.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
                                            {verification.status === 'pending' ? 'Pendiente' : 'En Revisión'}
                                        </span>
                                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                            Revisar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedVerification && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                            Revisar Verificación
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {selectedVerification.profiles.full_name} • {selectedVerification.profiles.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedVerification(null)}
                                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* AI Validation Summary */}
                                {selectedVerification.ai_validation && (
                                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                                            <span>🤖</span> Validación de IA
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${(selectedVerification.ai_confidence || 0) >= 0.95
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                Confianza: {((selectedVerification.ai_confidence || 0) * 100).toFixed(0)}%
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                            {Object.entries(selectedVerification.ai_validation.validations || {}).map(([key, value]) => {
                                                // Convertir key de camelCase o snake_case a formato legible para buscar en el mapa
                                                const normalizedKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                                                // Intentar buscar traducción exacta o normalizada, si no, usar la original formateada
                                                const label = validationTranslations[key] || validationTranslations[normalizedKey] || key.replace(/_/g, ' ');

                                                return (
                                                    <div key={key} className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                        <span className={value ? 'text-green-600' : 'text-red-600'}>
                                                            {value ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                                        </span>
                                                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                                                            {label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {selectedVerification.ai_validation.summary && (
                                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic border-t border-blue-200 dark:border-blue-800 pt-2">
                                                "{selectedVerification.ai_validation.summary}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Document Images */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <DocumentIcon className="w-4 h-4" /> Documento de Identidad
                                        </h4>
                                        <div className="aspect-video bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative group">
                                            <img
                                                src={getDisplayUrl(selectedVerification.id_document_url)}
                                                alt="Documento de Identidad"
                                                className="w-full h-full object-contain"
                                                onError={(e) => handleImageError(selectedVerification.id_document_url, e)}
                                            />
                                            <a
                                                href={getDisplayUrl(selectedVerification.id_document_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                                            >
                                                Ver original
                                            </a>
                                        </div>

                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mt-6">
                                            <UserAvatarIcon className="w-4 h-4" /> Selfie
                                        </h4>
                                        <div className="aspect-square max-w-[300px] mx-auto bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative group">
                                            <img
                                                src={getDisplayUrl(selectedVerification.selfie_url)}
                                                alt="Selfie"
                                                className="w-full h-full object-cover"
                                                onError={(e) => handleImageError(selectedVerification.selfie_url, e)}
                                            />
                                            <a
                                                href={getDisplayUrl(selectedVerification.selfie_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                                            >
                                                Ver original
                                            </a>
                                        </div>
                                    </div>

                                    {/* Review Actions */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Decisión de Revisión</h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Notas internas (opcional)
                                                    </label>
                                                    <textarea
                                                        value={reviewNotes}
                                                        onChange={(e) => setReviewNotes(e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                                        rows={3}
                                                        placeholder="Agrega notas para el registro..."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Motivo de rechazo (si aplica)
                                                    </label>
                                                    <select
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500 p-2.5"
                                                    >
                                                        <option value="">-- Selecciona un motivo --</option>
                                                        {REJECTION_REASONS.map((reason) => (
                                                            <option key={reason} value={reason}>
                                                                {reason}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <button
                                                    onClick={() => handleReview(false)}
                                                    disabled={isProcessing}
                                                    className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {isProcessing ? <Spinner className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                                    Rechazar
                                                </button>
                                                <button
                                                    onClick={() => handleReview(true)}
                                                    disabled={isProcessing}
                                                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {isProcessing ? <Spinner className="w-5 h-5 text-white" /> : <CheckCircleIcon className="w-5 h-5" />}
                                                    Aprobar Verificación
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KycReviewPanel;
