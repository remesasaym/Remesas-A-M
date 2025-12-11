import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { COUNTRIES } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DocumentIcon from './icons/DocumentIcon';
import { supabase } from '../supabaseClient';
import CameraIcon from './icons/CameraIcon';
import CameraModal from './CameraModal';
import PhoneNumberInput from './common/PhoneNumberInput';
import Spinner from './common/Spinner';
import { logger } from '../services/logger';
import { PageTransition } from './animations/PageTransition';
import { toast } from 'sonner';

interface ProfileProps {
  user: User;
  onProfileUpdate: (updates: Partial<Pick<User, 'fullName' | 'isVerified' | 'phone'>>) => Promise<void>;
}

enum VerificationStep {
  NotStarted,
  FormDetails,
  UploadDocuments,
  Processing,
}

const getErrorMessage = (error: unknown): string => {
  const defaultMessage = "Ocurrió un error inesperado. Revisa la calidad de tus imágenes y tu conexión e inténtalo de nuevo.";
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const potentialError = error as any;
    if (potentialError.response?.data?.error?.message) return potentialError.response.data.error.message;
    if (potentialError.error?.message) return potentialError.error.message;
    if (potentialError.message) return String(potentialError.message);
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
    id: null, address: null, selfie: null
  });
  const [docFiles, setDocFiles] = useState<{ id: File | null; address: File | null; selfie: File | null }>({
    id: null, address: null, selfie: null
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerificationDisabled, setIsVerificationDisabled] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'approved' | 'rejected'>('not_started');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => { fetchVerificationStatus(); }, [user.id]);
  useEffect(() => { fetchUserCountry(); }, [user.isVerified, user.id]);

  const fetchVerificationStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/kyc/status/${user.id}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.status && data.status !== 'not_started') {
        setVerificationData(data);
        setVerificationStatus(data.status as any);
      }
    } catch (err) { console.error('Error fetching verification status:', err); }
  };

  const fetchUserCountry = async () => {
    if (user.isVerified) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/kyc/status/${user.id}`);
        if (!response.ok) throw new Error('Error fetching country');
        const data = await response.json();
        if (data.status && data.status !== 'not_started') {
          const countryName = COUNTRIES.find(c => c.code === data.country)?.name;
          setUserCountry(countryName || data.country || 'No disponible');
        }
      } catch (err) { setUserCountry('No disponible'); }
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
      await onProfileUpdate({ phone });
      toast.success('¡Teléfono actualizado correctamente!');
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
      const uploadDocument = async (file: File, folder: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${folder}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('user-documents').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('user-documents').getPublicUrl(filePath);
        return publicUrl;
      };

      const [idUrl, addressUrl, selfieUrl] = await Promise.all([
        uploadDocument(docFiles.id, 'id'),
        uploadDocument(docFiles.address, 'address'),
        uploadDocument(docFiles.selfie, 'selfie')
      ]);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

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
          docUrls: { id: idUrl, address: addressUrl, selfie: selfieUrl }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la verificación');
      }

      const result = await response.json();

      if (result.status === 'approved') {
        await onProfileUpdate({ isVerified: true, phone: formData.phone, fullName: formData.fullName });
        setVerificationStatus('approved');
      } else {
        setVerificationStatus('pending');
        setVerificationData({ status: 'pending', created_at: new Date().toISOString(), ai_confidence: result.aiConfidence });
        await onProfileUpdate({ phone: formData.phone, fullName: formData.fullName });
        setStep(VerificationStep.NotStarted);
      }

    } catch (error) {
      console.error("KYC Verification Error:", error);
      const errorMessage = getErrorMessage(error);
      const lowerCaseError = errorMessage.toLowerCase();

      if (lowerCaseError.includes('no se pudo procesar la imagen') || lowerCaseError.includes('unable to process')) {
        toast.error("⚠️ Foto no legible. Asegúrate de tener buena iluminación y enfoque.");
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
        <div className="space-y-8">
          <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20 ring-4 ring-white dark:ring-slate-800">
              {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{user.fullName || 'Usuario'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wide border border-teal-100 dark:border-teal-900/50">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Verificado
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
            </div>
          </div>

          <VerificationStatus />

          <Card variant="default" padding="lg" className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Información Personal</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</p>
                <p className="font-medium text-lg text-slate-800 dark:text-white">{user.fullName}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico</p>
                <p className="font-medium text-lg text-slate-800 dark:text-white">{user.email}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">País de Residencia</p>
                <p className="font-medium text-lg text-slate-800 dark:text-white">{userCountry || 'Cargando...'}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Número de Teléfono</p>
                {!isEditingPhone ? (
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-lg text-slate-800 dark:text-white">{phone || 'No establecido'}</p>
                    <button onClick={() => setIsEditingPhone(true)} className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Editar</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <PhoneNumberInput
                      value={phone}
                      onChange={setPhone}
                      className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <Button
                      size="sm"
                      onClick={handleSavePhone}
                      disabled={isSaving || phone === (user.phone || '')}
                      isLoading={isSaving}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setIsEditingPhone(false); setPhone(user.phone || ''); setSaveMessage(null); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {saveMessage && (
                  <p className={`text-xs mt-1 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{saveMessage.text}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    switch (step) {
      case VerificationStep.NotStarted:
        return (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <span className="text-4xl">🛡️</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Verificación de Identidad</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-lg">Completa tu perfil para desbloquear todas las funciones y aumentar tus límites.</p>
            </div>
            <VerificationStatus
              onStart={() => setStep(VerificationStep.FormDetails)}
              status={verificationStatus}
              data={verificationData}
            />
          </div>
        );
      case VerificationStep.FormDetails:
        return (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button type="button" onClick={() => setStep(VerificationStep.NotStarted)} className="p-3 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group">
                <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Datos Personales</h2>
                <p className="text-slate-500 text-sm font-medium">Paso 1 de 2</p>
              </div>
            </div>

            <Card variant="default" padding="lg" className="space-y-6">
              <Input
                label="Nombre Completo"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                autoComplete="name"
                required
                variant="clean"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">País de Residencia</label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                    autoComplete="country-name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-800 dark:text-white"
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <Input
                label="Documento de Identidad (ID)"
                name="documentId"
                value={formData.documentId}
                onChange={handleInputChange}
                required
                placeholder="Número de documento"
                variant="clean"
              />

              <Input
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                autoComplete="street-address"
                required
                variant="clean"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Número de Teléfono</label>
                <PhoneNumberInput
                  value={formData.phone}
                  onChange={handlePhoneInputChange}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  autoComplete="tel"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-6 py-4 text-lg shadow-xl shadow-primary/30"
                disabled={!formData.documentId || !formData.address || !formData.fullName || !formData.phone}
              >
                Continuar
              </Button>
            </Card>
          </form>
        );
      case VerificationStep.UploadDocuments:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setStep(VerificationStep.FormDetails)} className="p-3 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group">
                <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Documentos</h2>
                <p className="text-slate-500 text-sm font-medium">Paso 2 de 2</p>
              </div>
            </div>

            <Card variant="default" padding="lg" className="space-y-6">
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
                tooltipText="Debe ser un documento reciente (últimos 3 meses) donde tu nombre y dirección sean legibles."
                userId={user.id}
                isUploaded={!!docUrls.address}
                onUploadSuccess={(url, file) => handleDocUploadSuccess('address', url, file)}
                onRemove={() => handleDocRemove('address')}
              />
              <UploadItem
                title="Selfie"
                description="Toma una foto clara de tu rostro."
                tooltipText="Tómate la foto en un lugar bien iluminado, sin gafas ni sombreros."
                userId={user.id}
                isUploaded={!!docUrls.selfie}
                onUploadSuccess={(url, file) => handleDocUploadSuccess('selfie', url, file)}
                onRemove={() => handleDocRemove('selfie')}
              />

              {formError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-center font-medium border border-red-100 dark:border-red-900/30">
                  {formError}
                </div>
              )}

              <Button
                onClick={handleFinalSubmit}
                size="lg"
                className="w-full mt-6 py-4 text-lg shadow-xl shadow-primary/30"
                disabled={!docUrls.id || !docUrls.address || !docUrls.selfie || isVerificationDisabled}
              >
                Enviar Verificación
              </Button>
            </Card>
          </div>
        );
      case VerificationStep.Processing:
        return (
          <Card className="text-center py-16 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8" />
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verificando con IA</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Estamos analizando tus documentos y biometría para verificar tu identidad. Esto solo tomará unos segundos.
            </p>
          </Card>
        );
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        {renderContent()}
      </div>
    </PageTransition>
  );
};

const VerificationStatus: React.FC<{ onStart?: () => void; status?: string; data?: any }> = ({ onStart, status, data }) => {
  const isVerified = !onStart;
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const styles = isVerified
    ? { bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-100 dark:border-teal-900/30', icon: 'text-teal-600 dark:text-teal-400', title: 'text-teal-800 dark:text-teal-300' }
    : isPending
      ? { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', title: 'text-amber-800 dark:text-amber-300' }
      : isRejected
        ? { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-100 dark:border-red-900/30', icon: 'text-red-600 dark:text-red-400', title: 'text-red-800 dark:text-red-300' }
        : { bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-100 dark:border-slate-700', icon: 'text-primary', title: 'text-slate-800 dark:text-white' };

  const icon = isVerified ? <CheckCircleIcon className="w-8 h-8" />
    : isPending ? <Spinner className="w-8 h-8" />
      : isRejected ? <span className="text-2xl">❌</span>
        : <span className="text-2xl">🛡️</span>;

  const title = isVerified ? 'Identidad Verificada'
    : isPending ? 'Verificación en Revisión'
      : isRejected ? 'Verificación Rechazada'
        : 'Verificación Requerida';

  const subtitle = isVerified ? 'Tu cuenta está totalmente verificada. Puedes realizar envíos sin límites.'
    : isPending ? `Tu verificación está siendo revisada manualmente.${data?.ai_confidence ? ` (Confianza IA: ${(data.ai_confidence * 100).toFixed(0)}%)` : ''}`
      : isRejected ? 'Tu verificación fue rechazada. Por favor, intenta de nuevo con documentos válidos.'
        : 'Para cumplir con las regulaciones y garantizar la seguridad, necesitamos verificar tu identidad antes de realizar envíos.';

  return (
    <Card className={`${styles.bg} border ${styles.border} p-8`}>
      <div className="flex items-start gap-6">
        <div className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm ${styles.icon}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-xl font-bold mb-2 ${styles.title}`}>{title}</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{subtitle}</p>
        </div>
      </div>
      {!isVerified && !isPending && (
        <div className="mt-8 flex justify-end">
          <Button onClick={onStart} variant={isRejected ? 'secondary' : 'primary'} size="lg" className="shadow-lg shadow-primary/20">
            {isRejected ? 'Intentar de Nuevo' : 'Iniciar Verificación'}
          </Button>
        </div>
      )}
    </Card>
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
        : title.toLowerCase().includes('domicilio') ? 'address-proof' : 'selfie';
      const fileName = `${documentType}-${Date.now()}.${fileExt}`;
      filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('user-documents').upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('user-documents').getPublicUrl(filePath);
      onUploadSuccess(data.publicUrl, file);

    } catch (err) {
      const e = err as Error;
      console.error('Error durante la carga:', e);
      setError(e.message || 'Error al procesar el archivo.');
      if (filePath) supabase.storage.from('user-documents').remove([filePath]);
      onRemove();
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    if (!isUploading && !isUploaded) fileInputRef.current?.click();
  };

  return (
    <div className={`group relative border rounded-2xl p-5 transition-all duration-300 ${isUploaded
      ? 'border-teal-200 bg-teal-50/50 dark:border-teal-900/30 dark:bg-teal-900/10'
      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}>
      {isCameraOpen && <CameraModal onCapture={handleFileSelect} onClose={() => setIsCameraOpen(false)} />}

      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isUploaded
          ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 group-hover:bg-white group-hover:text-primary group-hover:shadow-md'
          }`}>
          {isUploading ? <Spinner className="w-6 h-6" /> : <DocumentIcon className="w-7 h-7" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-slate-800 dark:text-white truncate text-lg">{title}</p>
            {isUploaded && <CheckCircleIcon className="w-5 h-5 text-teal-500" />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{isUploaded ? 'Documento cargado correctamente' : description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
            className="hidden"
            accept="image/png, image/jpeg, application/pdf"
          />

          {!isUploaded && !isUploading && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="p-2.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                title="Usar cámara"
              >
                <CameraIcon className="w-6 h-6" />
              </button>
              <Button size="sm" onClick={triggerFileInput} className="shadow-md shadow-primary/20">
                Subir
              </Button>
            </div>
          )}

          {isUploaded && (
            <button
              onClick={onRemove}
              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-3 pl-20 font-medium">{error}</p>}
    </div>
  );
}

export default Profile;