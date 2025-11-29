import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { User, Beneficiary } from '../types';
import { COUNTRIES } from '../constants';
import { supabase } from '../supabaseClient';
import XIcon from './icons/XIcon';
import Spinner from './common/Spinner';

interface BeneficiaryModalProps {
  user: User;
  beneficiaryToEdit: Beneficiary | null;
  onClose: () => void;
  onSave: () => void;
}

const BeneficiaryModal: React.FC<BeneficiaryModalProps> = ({ user, beneficiaryToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    country_code: 'VE',
    bank: '',
    account_number: '',
    document_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (beneficiaryToEdit) {
      setFormData({
        name: beneficiaryToEdit.name,
        country_code: beneficiaryToEdit.country_code,
        bank: beneficiaryToEdit.bank,
        account_number: beneficiaryToEdit.account_number,
        document_id: beneficiaryToEdit.document_id,
      });
    }
  }, [beneficiaryToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...beneficiaryToEdit, // Includes ID if editing
        user_id: user.id,
        name: formData.name,
        country_code: formData.country_code,
        bank: formData.bank,
        account_number: formData.account_number,
        document_id: formData.document_id,
      };

      const { error: upsertError } = await supabase.from('beneficiaries').upsert(payload);

      if (upsertError) throw upsertError;

      onSave();
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Error al guardar el beneficiario.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableBanks = COUNTRIES.find(c => c.code === formData.country_code)?.banks || [];
  
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 50, scale: 0.95 },
  };

  const inputStyles = "mt-1 block w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700"
      >
        <form onSubmit={handleSubmit}>
          <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {beneficiaryToEdit ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
            </h3>
            <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
          </header>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre Completo</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={inputStyles}/>
            </div>
            <div>
              <label htmlFor="country_code" className="block text-sm font-medium text-gray-600 dark:text-gray-300">País</label>
              <select name="country_code" id="country_code" value={formData.country_code} onChange={handleInputChange} required className={inputStyles}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="bank" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Banco</label>
              <select name="bank" id="bank" value={formData.bank} onChange={handleInputChange} required className={inputStyles}>
                <option value="" disabled>Selecciona un banco</option>
                {availableBanks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="account_number" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Número de Cuenta</label>
              <input type="text" name="account_number" id="account_number" value={formData.account_number} onChange={handleInputChange} required className={inputStyles}/>
            </div>
            <div>
              <label htmlFor="document_id" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Documento de Identidad (ID)</label>
              <input type="text" name="document_id" id="document_id" value={formData.document_id} onChange={handleInputChange} required className={inputStyles}/>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>

          <footer className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end items-center gap-4 rounded-b-2xl">
            <button type="button" onClick={onClose} className="text-gray-600 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-indigo-400 flex items-center justify-center w-28">
              {isSubmitting ? <Spinner className="w-5 h-5" /> : 'Guardar'}
            </button>
          </footer>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BeneficiaryModal;