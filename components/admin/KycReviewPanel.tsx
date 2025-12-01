import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, XCircle, FileText, User as UserIcon, Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';
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
            parentElement?.classList.add('bg-slate-200', 'flex', 'items-center', 'justify-center');
            if (parentElement) {
                parentElement.innerHTML = '<span class="text-slate-500 text-sm p-2 text-center">Imagen no disponible</span>';
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
        parentElement?.classList.add('bg-slate-200', 'flex', 'items-center', 'justify-center');
        if (parentElement) {
            parentElement.innerHTML = '<span class="text-slate-500 text-sm p-2 text-center">Archivo no encontrado (404)</span>';
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
            <Card variant="default" padding="lg">
                <div className="text-center py-12 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Cargando verificaciones...</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card variant="default" padding="none" className="overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verificaciones KYC Pendientes</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {verifications.length} verificación{verifications.length !== 1 ? 'es' : ''} pendiente{verifications.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadPendingVerifications}
                        className="text-slate-500 hover:text-primary"
                    >
                        <RefreshCw size={16} />
                    </Button>
                </div>

                {verifications.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No hay verificaciones pendientes</p>
                        <p className="text-slate-400 text-sm mt-1">¡Todo está al día!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {verifications.map((verification) => (
                            <div
                                key={verification.id}
                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedVerification(verification)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                                                {verification.profiles.full_name}
                                            </h3>
                                            {verification.ai_confidence && (
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${verification.ai_confidence >= 0.95
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-warning/20 text-warning-dark'
                                                    }`}>
                                                    IA: {(verification.ai_confidence * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {verification.profiles.email}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(verification.created_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-warning/10 text-warning-dark text-xs font-bold rounded-full border border-warning/20">
                                            {verification.status === 'pending' ? 'Pendiente' : 'En Revisión'}
                                        </span>
                                        <Button size="sm" variant="secondary">
                                            Revisar
                                        </Button>
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                            Revisar Verificación
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                            {selectedVerification.profiles.full_name} • {selectedVerification.profiles.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedVerification(null)}
                                        className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* AI Validation Summary */}
                                {selectedVerification.ai_validation && (
                                    <div className="mb-8 p-6 bg-secondary/5 rounded-2xl border border-secondary/20">
                                        <h4 className="font-bold text-secondary-dark mb-4 flex items-center gap-2">
                                            <span>🤖</span> Validación de IA
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${((selectedVerification.ai_confidence || 0) >= 0.95)
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-warning/20 text-warning-dark'
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
                                                    <div key={key} className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                        <span className={value ? 'text-green-500' : 'text-red-500'}>
                                                            {value ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 capitalize font-medium">
                                                            {label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {selectedVerification.ai_validation.summary && (
                                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 italic border-t border-secondary/20 pt-3">
                                                "{selectedVerification.ai_validation.summary}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    {/* Document Images */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" /> Documento de Identidad
                                            </h4>
                                            <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group shadow-inner">
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
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"
                                                >
                                                    Ver original
                                                </a>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <UserIcon className="w-5 h-5 text-secondary" /> Selfie
                                            </h4>
                                            <div className="aspect-square max-w-[300px] mx-auto bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group shadow-inner">
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
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold"
                                                >
                                                    Ver original
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Actions */}
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 h-full flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white mb-6 text-lg">Decisión de Revisión</h4>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                            Notas internas (opcional)
                                                        </label>
                                                        <textarea
                                                            value={reviewNotes}
                                                            onChange={(e) => setReviewNotes(e.target.value)}
                                                            className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 transition-all outline-none"
                                                            rows={4}
                                                            placeholder="Agrega notas para el registro..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                            Motivo de rechazo (si aplica)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={rejectionReason}
                                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                                className="w-full rounded-xl border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 p-3 appearance-none outline-none transition-all"
                                                            >
                                                                <option value="">-- Selecciona un motivo --</option>
                                                                {REJECTION_REASONS.map((reason) => (
                                                                    <option key={reason} value={reason}>
                                                                        {reason}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-8">
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleReview(false)}
                                                    disabled={isProcessing}
                                                    className="w-full py-4 text-base"
                                                >
                                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                                                    Rechazar
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleReview(true)}
                                                    disabled={isProcessing}
                                                    className="w-full py-4 text-base shadow-lg shadow-primary/30"
                                                >
                                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                                    Aprobar
                                                </Button>
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
