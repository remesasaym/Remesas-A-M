import React from 'react';
import { motion } from 'framer-motion';
import type { Transaction } from '../types';
import { COUNTRIES } from '../constants';
import FlagIcon from './icons/FlagIcon';
import XIcon from './icons/XIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface TransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
  const fromCountry = COUNTRIES.find(c => c.code === transaction.from_country_code);
  const toCountry = COUNTRIES.find(c => c.code === transaction.to_country_code);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    // FIX: Added `as const` to the `type` property to satisfy Framer Motion's strict type requirements.
    // This ensures TypeScript infers the specific string literal 'spring' instead of the generic 'string'.
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 50, scale: 0.95 },
  };

  const DetailRow: React.FC<{ label: string; value: React.ReactNode; isMono?: boolean }> = ({ label, value, isMono = false }) => (
    <div className="flex justify-between items-center py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium text-gray-800 dark:text-white ${isMono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );

  return (
    <motion.div
      key="backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        key="modal"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700"
      >
        {/* Header */}
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Detalles de la Transacción</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{transaction.transaction_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cerrar modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Amount Summary */}
          <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              {fromCountry && <FlagIcon countryCode={fromCountry.code} className="w-6 h-auto rounded-full" />}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enviaste</p>
                <p className="font-bold text-lg text-gray-800 dark:text-white">
                  {transaction.amount_sent.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.currency_sent}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recibieron</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                  {transaction.amount_received.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.currency_received}
                </p>
              </div>
              {toCountry && <FlagIcon countryCode={toCountry.code} className="w-6 h-auto rounded-full" />}
            </div>
          </div>
          
          {/* Details List */}
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            <DetailRow label="Beneficiario" value={transaction.recipient_name} />
            <DetailRow label="Banco" value={transaction.recipient_bank} />
            <DetailRow label="N° de Cuenta" value={transaction.recipient_account} isMono={true} />
            <DetailRow label="ID Beneficiario" value={transaction.recipient_id} isMono={true} />
            <DetailRow label="Comisión" value={`${transaction.fee.toFixed(2)} ${transaction.currency_sent}`} />
            <DetailRow 
              label="Estado" 
              value={
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.status === 'Completado'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                }`}>
                    {transaction.status}
                </span>
              } 
            />
            <DetailRow 
              label="Fecha" 
              value={new Date(transaction.created_at).toLocaleString('es-ES', { 
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
              })} 
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionModal;