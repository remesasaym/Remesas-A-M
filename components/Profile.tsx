import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { COUNTRIES } from '../constants';
import Card from './common/Card';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DocumentIcon from './icons/DocumentIcon';
import { supabase } from '../supabaseClient';
import CameraIcon from './icons/CameraIcon';
import CameraModal from './CameraModal';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import PhoneNumberInput from './common/PhoneNumberInput';
import Spinner from './common/Spinner';
import { logger } from '../services/logger';


interface ProfileProps {
  user: User;
  // FIX: Changed Omit<> to Pick<> to match the updated handleProfileUpdate signature.
  onProfileUpdate: (updates: Partial<Pick<User, 'fullName' | 'isVerified' | 'phone'>>) => Promise<void>;
}

enum VerificationStep {
  NotStarted,
  FormDetails,
  UploadDocuments,
  Processing,
}

// Helper function to extract a readable error message from various formats.
const getErrorMessage = (error: unknown): string => {
  const defaultMessage = "Ocurrió un error inesperado. Revisa la calidad de tus imágenes y tu conexión e inténtalo de nuevo.";

  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const potentialError = error as any;
    // Handle nested Gemini API errors
    if (potentialError.response?.data?.error?.message) {
      return potentialError.response.data.error.message;
    }
    // Handle common nested error structures
    if (potentialError.error?.message) {
      return potentialError.error.message;
    }
    // Handle standard error objects
    if (potentialError.message) {
      return String(potentialError.message);
    }
  }

  // Last resort
  try {
    const stringified = JSON.stringify(error);
    if (stringified !== '{}') return stringified;
  } catch (e) {
    // Ignore stringify errors
  }

  return defaultMessage;
};


const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [step, setStep] = useState<VerificationStep>(VerificationStep.NotStarted);
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    country: COUNTRIES[0].code,
    documentId: '',
    address: '',
    phone: user.phone || '',
  });

  const [docUrls, setDocUrls] = useState<{ id: string | null; address: string | null; selfie: string | null }>({
    id: null,
    address: null,
    selfie: null
  });
  const [docFiles, setDocFiles] = useState<{ id: File | null; address: File | null; selfie: File | null }>({
    id: null,
    address: null,
    selfie: null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerificationDisabled, setIsVerificationDisabled] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // NEW: Track verification status
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'approved' | 'rejected'>('not_started');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, [user.id]);

  useEffect(() => {
    fetchUserCountry();
  }, [user.isVerified, user.id]);

  const fetchVerificationStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/kyc/status/${user.id}`);

      if (!response.ok) {
        console.error('Error fetching verification status');
        return;
      }

      const data = await response.json();

      if (data.status && data.status !== 'not_started') {
        setVerificationData(data);
        setVerificationStatus(data.status as any);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const fetchUserCountry = async () => {
    if (user.isVerified) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/kyc/status/${user.id}`);

        if (!response.ok) {
          throw new Error('Error fetching country');
        }

        const data = await response.json();

        if (data.status && data.status !== 'not_started') {
          const countryName = COUNTRIES.find(c => c.code === data.country)?.name;
          setUserCountry(countryName || data.country || 'No disponible');
        }
      } catch (err) {
        console.error('Error fetching user country:', err);
        setUserCountry('No disponible');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(VerificationStep.UploadDocuments);
  };

  const handleDocUploadSuccess = (type: 'id' | 'address' | 'selfie', url: string, file: File) => {
    setDocUrls(prev => ({ ...prev, [type]: url }));
    setDocFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleDocRemove = (type: 'id' | 'address' | 'selfie') => {
    setDocUrls(prev => ({ ...prev, [type]: null }));
    setDocFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleSavePhone = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await onProfileUpdate({ phone });
      setSaveMessage({ type: 'success', text: '¡Guardado!' });
      setTimeout(() => setSaveMessage(null), 3000);
      setIsEditingPhone(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Error al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    setFormError(null);
    setStep(VerificationStep.Processing);

    if (!docFiles.id || !docFiles.address || !docFiles.selfie) {
      setFormError("Por favor, sube todos los documentos requeridos.");
      setStep(VerificationStep.UploadDocuments);
      return;
    }

    try {
      // 1. Subir documentos a Supabase Storage (mantener lógica existente)
      const uploadDocument = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);

        return publicUrl;
      };

      const [idUrl, addressUrl, selfieUrl] = await Promise.all([
        uploadDocument(docFiles.id, 'id'),
        uploadDocument(docFiles.address, 'address'),
        uploadDocument(docFiles.selfie, 'selfie')
      ]);

      // 2. Llamar al backend para verificación con Gemini AI
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/kyc/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          country: formData.country,
          documentId: formData.documentId,
          address: formData.address,
          phone: formData.phone,
          docUrls: {
            id: idUrl,
            address: addressUrl,
            selfie: selfieUrl
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la verificación');
      }

      const result = await response.json();

      // 3. Actualizar UI según resultado
      if (result.status === 'approved') {
        // Auto-aprobado
        await onProfileUpdate({
          isVerified: true,
          phone: formData.phone,
          fullName: formData.fullName,
        });
        logger.info('✅ Auto-approved by AI with confidence:', result.aiConfidence);
        setVerificationStatus('approved');
      } else {
        // Revisión manual
        logger.info('📋 Sent to manual review. Confidence:', result.aiConfidence);
        setVerificationStatus('pending');
        setVerificationData({
          status: 'pending',
          created_at: new Date().toISOString(),
          ai_confidence: result.aiConfidence
        });
        await onProfileUpdate({
          phone: formData.phone,
          fullName: formData.fullName,
        });
        setStep(VerificationStep.NotStarted);
      }

    } catch (error) {
      console.error("KYC Verification Error:", error);
      const errorMessage = getErrorMessage(error);
      const lowerCaseError = errorMessage.toLowerCase();

      if (lowerCaseError.includes('no se pudo procesar la imagen') || lowerCaseError.includes('unable to process')) {
        alert("⚠️ Foto no legible\n\nAsegúrate de:\n• Buena iluminación\n• Sin reflejos\n• Documento completo en la foto\n• Enfocada y nítida");
        setFormError("La imagen no es legible. Por favor, intenta de nuevo siguiendo las recomendaciones.");
      } else if (lowerCaseError.includes('api key') || lowerCaseError.includes('authentication')) {
        setFormError("El servicio de verificación no está disponible por un problema de configuración. Por favor, contacta al soporte.");
        setIsVerificationDisabled(true);
      } else {
        setFormError(errorMessage);
      }
      setStep(VerificationStep.UploadDocuments);
    }
  };

  const renderContent = () => {
    if (user.isVerified) {
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mi Perfil</h2>
          <div className="space-y-6">
            <VerificationStatus />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Información Personal</h3>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400">Nombre Completo</p>
                <p className="font-medium text-gray-800 dark:text-white">{user.fullName}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400">Correo Electrónico</p>
                <p className="font-medium text-gray-800 dark:text-white">{user.email}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400">Número de Teléfono</p>
                {!isEditingPhone ? (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 dark:text-white">{phone || 'No establecido'}</p>
                    <button onClick={() => setIsEditingPhone(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Editar</button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <PhoneNumberInput
                        value={phone}
                        onChange={setPhone}
                        className="flex-grow bg-gray-100 dark:bg-slate-900 border-gray-200 dark:border-slate-700 rounded-lg"
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={isSaving || phone === (user.phone || '')}
                        className="flex-shrink-0 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md disabled:bg-indigo-400 disabled:cursor-wait flex items-center justify-center w-20"
                      >
                        {isSaving ? <Spinner className="w-4 h-4" /> : 'Guardar'}
                      </button>
                      <button
                        onClick={() => { setIsEditingPhone(false); setPhone(user.phone || ''); setSaveMessage(null); }}
                        className="flex-shrink-0 text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300 dark:hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                    {saveMessage && (
                      <div className="text-right mt-1">
                        <p className={`text-xs ${saveMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{saveMessage.text}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-sm">
                <p className="text-gray-500 dark:text-gray-400">País de Residencia</p>
                <p className="font-medium text-gray-800 dark:text-white">{userCountry || 'Cargando...'}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (step) {
      case VerificationStep.NotStarted:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mi Perfil</h2>
            <VerificationStatus
              onStart={() => setStep(VerificationStep.FormDetails)}
              status={verificationStatus}
              data={verificationData}
            />
          </div>
        );
      case VerificationStep.FormDetails:
        return (
          <form onSubmit={handleFormSubmit}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verificación - Paso 1/2</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Ingresa tu información personal.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre Completo</label>
                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-100 dark:bg-slate-900 border-transparent rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-600 dark:text-gray-300">País de Residencia</label>
                <select name="country" id="country" value={formData.country} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-100 dark:bg-slate-900 border-transparent rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="documentId" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Documento de Identidad (ID)</label>
                <input type="text" name="documentId" id="documentId" value={formData.documentId} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-100 dark:bg-slate-900 border-transparent rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent" placeholder="Escribe el número tal como aparece" />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Dirección</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-100 dark:bg-slate-900 border-transparent rounded-lg py-3 px-4 focus:ring-2 focus:ring-indigo-600 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Número de Teléfono</label>
                <PhoneNumberInput
                  value={formData.phone}
                  onChange={handlePhoneInputChange}
                  className="bg-gray-100 dark:bg-slate-900 border-transparent rounded-lg focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-transparent"
                  required
                />
              </div>
              <button type="submit" disabled={!formData.documentId || !formData.address || !formData.fullName || !formData.phone} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Continuar</button>
            </div>
          </form>
        );
      case VerificationStep.UploadDocuments:
        return (
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setStep(VerificationStep.FormDetails)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 rounded-full"><ArrowLeftIcon className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Verificación - Paso 2/2</h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Carga tus documentos para confirmar tu identidad.</p>
            <div className="space-y-4">
              <UploadItem
                title="Documento de Identidad"
                description="Sube o toma una foto clara de tu DNI o pasaporte."
                tooltipText="Asegúrate de que la foto tenga buena iluminación, sin brillos, y que todo el texto y la foto sean claramente visibles."
                userId={user.id}
                isUploaded={!!docUrls.id}
                onUploadSuccess={(url, file) => handleDocUploadSuccess('id', url, file)}
                onRemove={() => handleDocRemove('id')}
              />
              <UploadItem
                title="Comprobante de Domicilio"
                description="Una factura de servicio o estado de cuenta reciente."
                tooltipText="Debe ser un documento reciente (últimos 3 meses) donde tu nombre y dirección sean legibles. Sube el documento completo, no solo una parte."
                userId={user.id}
                isUploaded={!!docUrls.address}
                onUploadSuccess={(url, file) => handleDocUploadSuccess('address', url, file)}
                onRemove={() => handleDocRemove('address')}
              />
              <UploadItem
                title="Selfie"
                description="Toma una foto clara de tu rostro."
                tooltipText="Tómate la foto en un lugar bien iluminado, sin gafas ni sombreros. Tu rostro debe estar centrado y completamente visible."
                userId={user.id}
                isUploaded={!!docUrls.selfie}
                onUploadSuccess={(url, file) => handleDocUploadSuccess('selfie', url, file)}
                onRemove={() => handleDocRemove('selfie')}
              />
              {formError &&
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-md text-sm text-red-700 dark:text-red-300 text-center">
                  <strong>Error de Verificación:</strong> {formError}
                </div>
              }
              <button onClick={handleFinalSubmit} disabled={!docUrls.id || !docUrls.address || !docUrls.selfie || isVerificationDisabled} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                Enviar Verificación
              </button>
            </div>
          </div>
        );
      case VerificationStep.Processing:
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">Verificando con IA</h3>
            <p className="text-gray-500 dark:text-gray-400">Analizando documentos y biometría... Esto puede tardar un momento.</p>
          </div>
        );
    }
  };

  const verifiedCardClass = user.isVerified
    ? 'border-purple-500/50 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20'
    : '';

  return <Card className={verifiedCardClass}>{renderContent()}</Card>;
};

const VerificationStatus: React.FC<{ onStart?: () => void; status?: string; data?: any }> = ({ onStart, status, data }) => {
  const isVerified = !onStart;
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const bgColor = isVerified ? 'bg-green-100 dark:bg-green-900/50'
    : isPending ? 'bg-blue-100 dark:bg-blue-900/50'
      : isRejected ? 'bg-red-100 dark:bg-red-900/50'
        : 'bg-yellow-100 dark:bg-yellow-900/50';

  const iconBgColor = isVerified ? 'bg-green-200 dark:bg-green-800'
    : isPending ? 'bg-blue-200 dark:bg-blue-800'
      : isRejected ? 'bg-red-200 dark:bg-red-800'
        : 'bg-yellow-200 dark:bg-yellow-800';

  const textColor = isVerified ? 'text-green-800 dark:text-green-300'
    : isPending ? 'text-blue-800 dark:text-blue-300'
      : isRejected ? 'text-red-800 dark:text-red-300'
        : 'text-yellow-800 dark:text-yellow-300';

  const subtextColor = isVerified ? 'text-green-600 dark:text-green-400'
    : isPending ? 'text-blue-600 dark:text-blue-400'
      : isRejected ? 'text-red-600 dark:text-red-400'
        : 'text-yellow-600 dark:text-yellow-400';

  const icon = isVerified ? <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
    : isPending ? <Spinner className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      : isRejected ? <span className="text-2xl">❌</span>
        : <span className="text-2xl">⚠️</span>;

  const title = isVerified ? 'Identidad Verificada'
    : isPending ? 'Verificación en Revisión'
      : isRejected ? 'Verificación Rechazada'
        : 'Verificación Requerida';

  const subtitle = isVerified ? 'Puedes realizar transacciones sin límites.'
    : isPending ? `Tu verificación está siendo revisada. Te notificaremos cuando esté lista.${data?.ai_confidence ? ` (Confianza IA: ${(data.ai_confidence * 100).toFixed(0)}%)` : ''}`
      : isRejected ? 'Tu verificación fue rechazada. Por favor, intenta de nuevo con documentos válidos.'
        : 'Completa la verificación para enviar dinero.';

  return (
    <div className={`p-4 rounded-lg flex items-center gap-4 ${bgColor}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgColor}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className={`font-bold ${textColor}`}>
          {title}
        </h3>
        <p className={`text-sm ${subtextColor}`}>
          {subtitle}
        </p>
      </div>
      {!isVerified && !isPending && (
        <button onClick={onStart} className="ml-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
          {isRejected ? 'Intentar de Nuevo' : 'Verificar Ahora'}
        </button>
      )}
    </div>
  );
};


const UploadItem: React.FC<{
  title: string;
  description: string;
  tooltipText: string;
  userId: string;
  isUploaded: boolean;
  onUploadSuccess: (url: string, file: File) => void;
  onRemove: () => void;
}> = ({ title, description, tooltipText, userId, isUploaded, onUploadSuccess, onRemove }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setError(null);
    setIsUploading(true);
    let filePath = '';

    try {
      const fileExt = file.name.split('.').pop();
      const documentType = title.toLowerCase().includes('identidad') ? 'id-document'
        : title.toLowerCase().includes('domicilio') ? 'address-proof'
          : 'selfie';
      const fileName = `${documentType}-${Date.now()}.${fileExt}`;
      filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('user-documents').getPublicUrl(filePath);
      onUploadSuccess(data.publicUrl, file);

    } catch (err) {
      const e = err as Error;
      console.error('Error durante la carga:', e);
      setError(e.message || 'Error al procesar el archivo. Intenta de nuevo.');
      if (filePath) supabase.storage.from('user-documents').remove([filePath]);
      onRemove(); // Limpiar el estado si falla
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    if (!isUploading && !isUploaded) {
      fileInputRef.current?.click();
    }
  };

  const statusText =
    isUploading ? "Subiendo..."
      : isUploaded ? "Documento cargado."
        : description;

  const statusColorClass =
    isUploading ? "text-blue-600 dark:text-blue-400"
      : isUploaded ? "text-green-600 dark:text-green-400"
        : "text-gray-500 dark:text-gray-400";

  const borderColorClass = error
    ? "border-red-500/50"
    : isUploaded
      ? "border-green-500/50"
      : "border-gray-200 dark:border-gray-700";

  return (
    <div className={`bg-gray-50 dark:bg-slate-800/50 border ${borderColorClass} p-4 rounded-lg transition-colors`}>
      {isCameraOpen && <CameraModal onCapture={handleFileSelect} onClose={() => setIsCameraOpen(false)} />}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-grow flex items-center gap-4">
          <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isUploaded ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-slate-700'
            }`}>
            <DocumentIcon className={`w-6 h-6 ${isUploaded ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 dark:text-white">{title}</p>

              {/* --- TOOLTIP --- */}
              <div className="relative group flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  {tooltipText}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800 dark:border-t-slate-900"></div>
                </div>
              </div>

              {isUploaded && <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />}
            </div>
            <p className={`text-xs mt-1 ${statusColorClass}`}>
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
            className="hidden"
            accept="image/png, image/jpeg, application/pdf"
          />
          {!isUploaded && !isUploading && (
            <>
              <button
                title="Tomar foto"
                onClick={() => setIsCameraOpen(true)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-semibold p-3 rounded-lg transition-colors"
              >
                <CameraIcon className="w-5 h-5" />
              </button>
              <button
                onClick={triggerFileInput}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cargar
              </button>
            </>
          )}
          {isUploading && (
            <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 border-gray-200 dark:border-gray-600 animate-spin"></div>
          )}
          {isUploaded && (
            <button onClick={onRemove} className="bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-600 dark:text-red-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
              Eliminar
            </button>
          )}
        </div>
      </div>
      {error &&
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-md text-sm text-red-700 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      }
    </div>
  );
}

export default Profile;