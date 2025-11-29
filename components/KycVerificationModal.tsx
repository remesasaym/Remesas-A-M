import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import XIcon from './icons/XIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import type { User } from '../types';

interface KycVerificationModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const KycVerificationModal: React.FC<KycVerificationModalProps> = ({ user, isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [documentImage, setDocumentImage] = useState<string>('');
    const [selfieImage, setSelfieImage] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const documentInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (type: 'document' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen es demasiado grande. Máximo 5MB.');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten imágenes.');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (type === 'document') {
                setDocumentImage(base64);
                setError('');
            } else {
                setSelfieImage(base64);
                setError('');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!documentImage || !selfieImage) {
            setError('Por favor sube ambas imágenes.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const response = await fetch('/api/kyc/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.id}`,
                },
                body: JSON.stringify({
                    userId: user.id,
                    documentImage,
                    selfieImage,
                    fullName: user.fullName || '',
                    country: '',
                    documentId: '',
                    address: '',
                    phone: user.phone || '',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al subir documentos');
            }

            setStep(3); // Success step
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Error uploading KYC:', err);
            setError(err instanceof Error ? err.message : 'Error al subir documentos');
        } finally {
            setIsUploading(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Verificación de Identidad</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Para poder enviar dinero, necesitamos verificar tu identidad. Este proceso es rápido y seguro.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📋 Necesitarás:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>✅ Documento de identidad (DNI, pasaporte o licencia)</li>
                    <li>✅ Una selfie tuya sosteniendo el documento</li>
                </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Importante:</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                    <li>• El documento debe estar vigente</li>
                    <li>• La foto debe ser clara y legible</li>
                    <li>• No uses fotos de fotos</li>
                </ul>
            </div>

            <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                Comenzar Verificación
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Subir Documentos</h3>

            {/* Document Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    1. Foto de tu Documento
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    {documentImage ? (
                        <div className="relative">
                            <img src={documentImage} alt="Document" className="max-h-48 mx-auto rounded" />
                            <button
                                onClick={() => setDocumentImage('')}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">Click para subir tu documento</p>
                            <button
                                onClick={() => documentInputRef.current?.click()}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg"
                            >
                                Seleccionar Archivo
                            </button>
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect('document')}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Selfie Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    2. Selfie con tu Documento
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    {selfieImage ? (
                        <div className="relative">
                            <img src={selfieImage} alt="Selfie" className="max-h-48 mx-auto rounded" />
                            <button
                                onClick={() => setSelfieImage('')}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-2">Tómate una selfie sosteniendo tu documento</p>
                            <button
                                onClick={() => selfieInputRef.current?.click()}
                                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg"
                            >
                                Seleccionar Archivo
                            </button>
                            <input
                                ref={selfieInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect('selfie')}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => setStep(1)}
                    disabled={isUploading}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Atrás
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!documentImage || !selfieImage || isUploading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Subiendo...' : 'Enviar Documentos'}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Documentos Enviados!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tu solicitud de verificación está en revisión. Te notificaremos cuando esté lista.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
                Tiempo estimado: 24-48 horas
            </p>
        </div>
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Paso {step} de 3
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default KycVerificationModal;
