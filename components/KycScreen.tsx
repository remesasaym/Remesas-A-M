
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from './common/Card';
import { User } from '../types';
import { Screen } from '../types';

interface KycScreenProps {
  user: User;
  setActiveScreen: (screen: Screen) => void;
}

const KycScreen: React.FC<KycScreenProps> = ({ user, setActiveScreen }) => {
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idDocument || !proofOfAddress) {
      alert('Please upload both documents.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    // Simulate API call to backend for KYC verification
    try {
      // In a real application, you would use FormData to send files to the backend
      // const formData = new FormData();
      // formData.append('idDocument', idDocument);
      // formData.append('proofOfAddress', proofOfAddress);
      // await kycVerificationService(formData);

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      setSubmissionStatus('success');
    } catch (error) {
      console.error('KYC Submission failed:', error);
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Verificación de Identidad (KYC)</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Para cumplir con las regulaciones, necesitamos verificar tu identidad. Por favor, sube los siguientes documentos.
        </p>

        {submissionStatus === 'success' ? (
          <div className="text-center p-8 bg-green-50 dark:bg-green-900/50 rounded-lg">
            <h3 className="text-xl font-bold text-green-700 dark:text-green-300">¡Documentos Enviados!</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Hemos recibido tus documentos y los estamos revisando. Te notificaremos una vez que tu cuenta haya sido verificada.
            </p>
            <button
              onClick={() => setActiveScreen(Screen.Calculator)}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Volver a la Calculadora
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="idDocument" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Documento de Identidad (Pasaporte, Cédula)
              </label>
              <input
                type="file"
                id="idDocument"
                onChange={(e) => handleFileChange(e, setIdDocument)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*,.pdf"
              />
              {idDocument && <span className="text-xs text-gray-500">{idDocument.name}</span>}
            </div>

            <div>
              <label htmlFor="proofOfAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prueba de Dirección (Factura de servicios, estado de cuenta)
              </label>
              <input
                type="file"
                id="proofOfAddress"
                onChange={(e) => handleFileChange(e, setProofOfAddress)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*,.pdf"
              />
              {proofOfAddress && <span className="text-xs text-gray-500">{proofOfAddress.name}</span>}
            </div>

            {submissionStatus === 'error' && (
              <p className="text-red-500 text-sm">
                Hubo un error al enviar tus documentos. Por favor, intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !idDocument || !proofOfAddress}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Documentos para Verificación'}
            </button>
          </form>
        )}
      </motion.div>
    </Card>
  );
};

export default KycScreen;
