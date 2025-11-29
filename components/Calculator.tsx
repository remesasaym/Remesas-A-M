// src/components/Calculator.tsx
import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './common/Card';
import { REMITTANCE_FEE_PERCENTAGE } from '../constants';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import SwapIcon from './icons/SwapIcon';
import ClockIcon from './icons/ClockIcon';
import type { User, Country, Beneficiary } from '../types';
import { Screen } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import FlagIcon from './icons/FlagIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { supabase } from '../supabaseClient';
import Spinner from './common/Spinner';
import XIcon from './icons/XIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ExchangeRateBanner from './ExchangeRateBanner';
import CountrySelector from './CountrySelector';
import { logger } from '../services/logger';

interface CalculatorProps {
  user: User;
  setActiveScreen: (screen: Screen) => void;
  prefillData: Beneficiary | null;
  onClearPrefill: () => void;
}

export interface CalculatorRef {
  resetCalculator: () => void;
}

const stepAnimation = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3, ease: "easeInOut" as const },
};

const amountAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

// New component for the summary modal
interface TransactionSummaryModalProps {
  details: {
    amount: string;
    fee: number;
    total: number;
    fromCurrency: string;
    receivedAmount: number;
    receivedCurrency: string;
    fromCountryCode: string;
    toCountryCode: string;
  };
  onConfirm: () => void;
  onClose: () => void;
}

const TransactionSummaryModal: React.FC<TransactionSummaryModalProps> = ({ details, onConfirm, onClose }) => {
  const { countriesWithLatestRates: COUNTRIES } = useExchangeRates();
  const fromCountry = COUNTRIES.find(c => c.code === details.fromCountryCode);
  const toCountry = COUNTRIES.find(c => c.code === details.toCountryCode);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 50, scale: 0.95 },
  };

  const DetailRow: React.FC<{ label: string; value: React.ReactNode; isBold?: boolean }> = ({ label, value, isBold = false }) => (
    <div className="flex justify-between items-center py-3">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm text-gray-800 dark:text-white ${isBold ? 'font-bold' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return; // Prevenir múltiples clics
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

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
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Confirmar Envío</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlagIcon countryCode={details.fromCountryCode} className="w-6 h-auto rounded-full" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Envías</p>
                <p className="font-bold text-lg text-gray-800 dark:text-white">
                  {parseFloat(details.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {details.fromCurrency}
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reciben</p>
                <p className="font-bold text-lg text-green-600 dark:text-green-400">
                  {details.receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {details.receivedCurrency}
                </p>
              </div>
              <FlagIcon countryCode={details.toCountryCode} className="w-6 h-auto rounded-full" />
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            <DetailRow label="Comisión" value={`${details.fee.toFixed(2)} ${details.fromCurrency}`} />
            <DetailRow label="Total a pagar" value={`${details.total.toFixed(2)} ${details.fromCurrency}`} />
          </div>
        </div>
        <footer className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end items-center gap-4 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-600 dark:text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={() => { logger.debug('Confirmar clicked'); handleConfirm(); }}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar y Continuar'}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

const Calculator = forwardRef<CalculatorRef, CalculatorProps>(
  ({ user, setActiveScreen, prefillData, onClearPrefill }, ref) => {
    const { countriesWithLatestRates: COUNTRIES, isLoading: areRatesLoading, getRate } = useExchangeRates();

    // Estado del flujo
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);

    // Step 1 State
    const [amount, setAmount] = useState<string>('');
    const [fromCountryCode, setFromCountryCode] = useState<string>('');
    const [toCountryCode, setToCountryCode] = useState<string>('');
    const [showVerificationWarning, setShowVerificationWarning] = useState<boolean>(false);
    const amountInputRef = useRef<HTMLInputElement>(null);

    // Step 2 State
    const [recipientName, setRecipientName] = useState<string>('');
    const [recipientBank, setRecipientBank] = useState<string>('');
    const [recipientAccount, setRecipientAccount] = useState<string>('');
    const [recipientId, setRecipientId] = useState<string>('');
    const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);

    // Loading State
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Real-time validation state
    const [formErrors, setFormErrors] = useState<{ amount?: string; recipientName?: string; recipientAccount?: string; recipientId?: string }>({});
    const [submissionError, setSubmissionError] = useState<string | null>(null);

    // Step 3 State (Payment)
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    // Step 4 State
    const [transactionId, setTransactionId] = useState<string>('');

    const resetCalculator = () => {
      setStep(1);
      if (COUNTRIES.length > 0) {
        const defaultFrom = COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0];
        const defaultTo = COUNTRIES.find(c => c.code === 'VE') || COUNTRIES[1] || COUNTRIES[0];
        setFromCountryCode(defaultFrom.code);
        setToCountryCode(defaultTo.code);
      }
      setRecipientName('');
      setRecipientBank('');
      setRecipientAccount('');
      setRecipientId('');
      setReceiptFile(null);
      setReceiptUrl(null);
      setTransactionId('');
      setFormErrors({});
      setShowVerificationWarning(false);
      setIsSummaryVisible(false);
      setSubmissionError(null);
      onClearPrefill();
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
    };

    // Effect to set default countries once the rates and country data are loaded
    useEffect(() => {
      if (COUNTRIES.length > 0 && !fromCountryCode && !toCountryCode) {
        const defaultFrom = COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0];
        const defaultTo = COUNTRIES.find(c => c.code === 'VE') || COUNTRIES[1] || COUNTRIES[0];
        setFromCountryCode(defaultFrom.code);
        setToCountryCode(defaultTo.code);
        setAmount(String(defaultFrom.minimumSendAmount * 2)); // Default to 2x minimum
      }
    }, [COUNTRIES, fromCountryCode, toCountryCode]);

    // Effect to pre-fill form if a beneficiary is provided
    useEffect(() => {
      if (prefillData) {
        setToCountryCode(prefillData.country_code);
        setRecipientName(prefillData.name);
        setRecipientBank(prefillData.bank);
        setRecipientAccount(prefillData.account_number);
        setRecipientId(prefillData.document_id);
        setSaveBeneficiary(false);
        if (!fromCountryCode) {
          const defaultFrom = COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0];
          setFromCountryCode(defaultFrom.code);
        }
        setStep(1);
        setTimeout(() => {
          amountInputRef.current?.focus();
          amountInputRef.current?.select();
        }, 100);
        onClearPrefill();
      }
    }, [prefillData, onClearPrefill, COUNTRIES, fromCountryCode]);

    // Auto-set amount when source country changes
    useEffect(() => {
      if (!fromCountryCode || COUNTRIES.length === 0 || prefillData) return;
      const fromCountry = COUNTRIES.find(c => c.code === fromCountryCode);
      if (!fromCountry) return;
      if (fromCountry.currency === 'USD') {
        setAmount('100');
      } else {
        const equivalent = 100 * fromCountry.exchangeRateToUSD;
        let roundedAmount;
        if (equivalent > 10000) {
          roundedAmount = Math.round(equivalent / 1000) * 1000;
        } else if (equivalent > 100) {
          roundedAmount = Math.round(equivalent / 10) * 10;
        } else {
          roundedAmount = Math.round(equivalent);
        }
        setAmount(String(roundedAmount));
      }
    }, [fromCountryCode, COUNTRIES, prefillData]);

    // Helper para limpiar el monto de comas para cálculos
    const getCleanAmount = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    // Helper para formatear con comas
    const formatAmount = (val: string) => {
      // Eliminar todo lo que no sea número o punto
      const clean = val.replace(/[^\d.]/g, '');

      // Separar parte entera y decimal
      const parts = clean.split('.');

      // Formatear parte entera con comas
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      // Unir de nuevo (limitando a 2 decimales si se desea, o dejando libre)
      return parts.slice(0, 2).join('.');
    };

    const calculationResult = useMemo(() => {
      const numericAmount = getCleanAmount(amount);
      if (!fromCountryCode || !toCountryCode || numericAmount <= 0) {
        return {
          fee: 0,
          total: 0,
          fromCurrency: '',
          receivedAmount: 0,
          receivedCurrency: '',
          exchangeRateText: '',
          arrivalTime: '',
        };
      }

      const fromCountry = COUNTRIES.find(c => c.code === fromCountryCode);
      const toCountry = COUNTRIES.find(c => c.code === toCountryCode);

      if (!fromCountry || !toCountry) return null;

      // Calculate fee based on amount
      const feeCalc = numericAmount * REMITTANCE_FEE_PERCENTAGE;
      const total = numericAmount + feeCalc;

      // Calculate exchange rate
      // Base calculation on USD
      const amountInUSD = fromCountry.currency === 'USD'
        ? numericAmount
        : numericAmount / fromCountry.exchangeRateToUSD;

      // Then convert USD to destination currency
      const amountReceived = amountInUSD * toCountry.exchangeRateToUSD;

      const displayedRate = getRate(fromCountry.currency, toCountry.currency, true);
      const rateText = `1 ${fromCountry.currency} ≈ ${displayedRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${toCountry.currency}`;
      const arrival = toCountry.region === 'LatAm' ? 'Instantáneo' : '2 días hábiles';
      return {
        fee: feeCalc,
        total: total,
        fromCurrency: fromCountry.currency,
        receivedAmount: amountReceived,
        receivedCurrency: toCountry.currency,
        exchangeRateText: rateText,
        arrivalTime: arrival,
      };
    }, [fromCountryCode, toCountryCode, amount, COUNTRIES, getRate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      switch (name) {
        case 'amount':
          // Formatear el valor con comas
          setAmount(formatAmount(value));
          if (formErrors.amount) setFormErrors(prev => ({ ...prev, amount: undefined }));
          break;
        case 'recipientName':
          setRecipientName(value);
          if (formErrors.recipientName) setFormErrors(prev => ({ ...prev, recipientName: undefined }));
          break;
        case 'recipientBank':
          setRecipientBank(value);
          if (formErrors.recipientBank) setFormErrors(prev => ({ ...prev, recipientBank: undefined }));
          break;
        case 'recipientAccount':
          setRecipientAccount(value);
          if (formErrors.recipientAccount) setFormErrors(prev => ({ ...prev, recipientAccount: undefined }));
          break;
        case 'recipientId':
          setRecipientId(value);
          if (formErrors.recipientId) setFormErrors(prev => ({ ...prev, recipientId: undefined }));
          break;
        default:
          break;
      }
    };

    // Extraer valores calculados con defaults seguros
    const {
      fee = 0,
      total = 0,
      fromCurrency = 'USD',
      receivedAmount = 0,
      receivedCurrency = 'USD',
      exchangeRateText = '',
      arrivalTime = ''
    } = calculationResult || {};

    const validateField = (field: string, value: string): string | undefined => {
      if (!value || value.trim() === '') {
        switch (field) {
          case 'recipientName':
            return 'Nombre es requerido';
          case 'recipientAccount':
            return 'Cuenta es requerida';
          case 'recipientId':
            return 'Documento es requerido';
          default:
            return undefined;
        }
      }
      return undefined;
    };

    const handleContinueToRecipient = () => {
      if (!amount || parseFloat(amount) <= 0) {
        setFormErrors(prev => ({ ...prev, amount: 'Monto inválido' }));
        return;
      }
      setStep(2);
    };

    const handleUploadReceipt = async () => {
      if (!receiptFile) return;
      setIsUploading(true);
      try {
        // Obtener el token de sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        const formData = new FormData();
        formData.append('file', receiptFile);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error uploading file');
        }

        const data = await response.json();
        setReceiptUrl(data.publicUrl);
        setStep(4); // Go to confirmation
        setIsSummaryVisible(true);
      } catch (error: any) {
        console.error('Upload error:', error);
        alert('Error subiendo comprobante: ' + (error.message || 'Error desconocido'));
      } finally {
        setIsUploading(false);
      }
    };

    const handleConfirmSend = async () => {
      logger.info('handleConfirmSend called');
      setIsSubmitting(true);
      setSubmissionError(null);
      try {
        logger.debug('Getting session...');
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        logger.debug('Session:', session ? 'Found' : 'Not found');
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        logger.info('Sending request to backend...');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/remittances/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: user.id, // Ensure userId is passed
            amountSent: amount,
            currencySent: fromCurrency,
            amountReceived: receivedAmount,
            currencyReceived: receivedCurrency,
            fee: fee,
            fromCountryCode,
            toCountryCode,
            recipientName,
            recipientBank,
            recipientAccount,
            recipientId,
            receiptUrl, // Send receipt URL
          }),
        });
        logger.debug('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          const errorMessage = errorData.message || errorData.error || 'Error al enviar la remesa';
          // Mostrar el error al usuario
          alert(errorMessage);
          throw new Error(errorMessage);
        }
        const data = await response.json();
        logger.info('Success! Transaction ID:', data.transaction_id);
        setTransactionId(data.transaction_id);
        setIsSummaryVisible(false);
        setStep(5); // Success
      } catch (err) {
        console.error('handleConfirmSend error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
        setSubmissionError(errorMessage);
        // No cambiar a paso de error si ya mostramos alert
        if (!errorMessage.includes('mínimo')) {
          setIsSummaryVisible(false);
          setStep(6); // Error
        }
      } finally {
        logger.debug('handleConfirmSend finished');
        setIsSubmitting(false);
      }
    };

    const handleSwap = () => {
      const temp = fromCountryCode;
      setFromCountryCode(toCountryCode);
      setToCountryCode(temp);
      setAmount('');
    };

    const handleCountrySelectAndFocus = (setter: React.Dispatch<React.SetStateAction<string>>) => (code: string) => {
      setter(code);
      setTimeout(() => amountInputRef.current?.focus(), 50);
    };

    const handleNewTransaction = () => {
      resetCalculator();
    };

    useImperativeHandle(ref, () => ({ resetCalculator }));

    if (COUNTRIES.length === 0 || areRatesLoading) {
      return (
        <Card>
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
            Cargando tasas de cambio...
          </div>
        </Card>
      );
    }

    const renderStep1_Calculator = () => {
      const allowedOriginCodes = ['VE', 'BR', 'CO', 'PE', 'US'];
      const originCountries = COUNTRIES.filter(c => allowedOriginCodes.includes(c.code) || c.region === 'Europe');
      return (
        <motion.div key="step1" {...stepAnimation}>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Enviar Remesa</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Calcula y envía dinero de forma rápida y segura.</p>
          <ExchangeRateBanner />
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
              <CountrySelector label="Desde" countries={originCountries} selectedCode={fromCountryCode} onSelect={handleCountrySelectAndFocus(setFromCountryCode)} />
              <button onClick={handleSwap} className="mt-6 bg-gray-200 dark:bg-gray-600 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-transform duration-300 hover:rotate-180">
                <SwapIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <CountrySelector label="Hacia" countries={COUNTRIES.filter(c => c.code !== fromCountryCode)} selectedCode={toCountryCode} onSelect={handleCountrySelectAndFocus(setToCountryCode)} />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tú envías</label>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  id="amount"
                  name="amount"
                  value={amount}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-100 dark:bg-gray-700/60 border rounded-lg py-3 pl-4 pr-16 text-gray-800 dark:text-white text-lg font-semibold transition-colors ${formErrors.amount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'}`}
                  placeholder="0.00"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-gray-400 font-semibold">{fromCurrency}</span>
              </div>
              {formErrors.amount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.amount}</p>}
            </div>
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                <span>Comisión ({REMITTANCE_FEE_PERCENTAGE * 100}%)</span>
                <motion.span key={`fee-${fee}`} {...amountAnimation} className="font-medium text-gray-800 dark:text-white">{fee.toFixed(2)} {fromCurrency}</motion.span>
              </div>
              <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                <span>Tasa de cambio:</span>
                <span className="font-medium text-gray-800 dark:text-white">{exchangeRateText}</span>
              </div>
              <hr className="border-gray-300 dark:border-gray-700 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-bold">Receptor recibe:</span>
                <motion.span key={`received-${receivedAmount}`} {...amountAnimation} className="font-bold text-green-600 dark:text-green-400 text-xl">
                  {receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {receivedCurrency}
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-bold">Total a pagar:</span>
                <motion.span key={`total-${total}`} {...amountAnimation} className="font-bold text-gray-900 dark:text-white text-lg">{total.toFixed(2)} {fromCurrency}</motion.span>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>Llegada estimada: <span className="font-semibold">{arrivalTime}</span></span>
              </div>
            </div>
            <button
              onClick={handleContinueToRecipient}
              disabled={
                !user.isVerified || // Bloquear si no está verificado
                !!formErrors.amount ||
                getCleanAmount(amount) <= 0 ||
                // Validar monto mínimo específico del país
                getCleanAmount(amount) < (COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount || 0)
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 text-lg disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {user.isVerified ? 'Continuar con el Envío' : 'Verificación Requerida para Enviar'}
            </button>
            {getCleanAmount(amount) > 0 &&
              getCleanAmount(amount) < (COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount || 0) && (
                <p className="text-red-500 text-sm mt-2 text-center font-medium">
                  ⚠️ El monto mínimo para {COUNTRIES.find(c => c.code === fromCountryCode)?.name} es {COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount.toLocaleString()} {fromCurrency}
                </p>
              )}
            {!user.isVerified && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-sm flex items-center gap-4">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold">Verificación Requerida</p>
                  <p>Debes verificar tu perfil para poder enviar dinero.</p>
                </div>
                <button onClick={() => setActiveScreen(Screen.Profile)} className="ml-auto bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700 text-xs flex-shrink-0">Verificar Ahora</button>
              </div>
            )}
          </div>
        </motion.div>
      );
    };

    const renderStep2_Recipient = () => {
      const destinationCountry = COUNTRIES.find(c => c.code === toCountryCode);
      const availableBanks = destinationCountry?.banks || [];
      const isFormComplete = recipientName && recipientBank && recipientAccount && recipientId;

      const handleProceedToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        const nameError = validateField('recipientName', recipientName);
        const accountError = validateField('recipientAccount', recipientAccount);
        const idError = validateField('recipientId', recipientId);
        const newErrors: typeof formErrors = {};
        if (nameError) newErrors.recipientName = nameError;
        if (accountError) newErrors.recipientAccount = accountError;
        if (idError) newErrors.recipientId = idError;
        setFormErrors(prev => ({ ...prev, ...newErrors }));
        if (Object.keys(newErrors).length > 0) return;
        if (isFormComplete) setStep(3); // Go to Payment
      };

      return (
        <motion.form key="step2" {...stepAnimation} onSubmit={handleProceedToPayment}>
          <div className="flex items-center gap-4 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 rounded-full"><ArrowLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Datos del Beneficiario</h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Ingresa la información de la persona que recibirá el dinero.</p>
          <div className="space-y-4">
            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre Completo</label>
              <input type="text" name="recipientName" id="recipientName" value={recipientName} onChange={handleInputChange} required className={`mt-1 block w-full bg-gray-100 dark:bg-gray-700 border rounded-md shadow-sm py-2 px-3 transition-colors ${formErrors.recipientName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'}`} />
              {formErrors.recipientName && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.recipientName}</p>}
            </div>
            <div>
              <label htmlFor="recipientBank" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Banco del Beneficiario</label>
              <select name="recipientBank" id="recipientBank" value={recipientBank} onChange={handleInputChange} required className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3">
                <option value="" disabled>Selecciona un banco</option>
                {availableBanks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="recipientAccount" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Número de Cuenta</label>
              <input type="text" name="recipientAccount" id="recipientAccount" value={recipientAccount} onChange={handleInputChange} required className={`mt-1 block w-full bg-gray-100 dark:bg-gray-700 border rounded-md shadow-sm py-2 px-3 transition-colors ${formErrors.recipientAccount ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'}`} />
              {formErrors.recipientAccount && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.recipientAccount}</p>}
            </div>
            <div>
              <label htmlFor="recipientId" className="block text-sm font-medium text-gray-600 dark:text-gray-300">Documento de Identidad</label>
              <input type="text" name="recipientId" id="recipientId" value={recipientId} onChange={handleInputChange} required className={`mt-1 block w-full bg-gray-100 dark:bg-gray-700 border rounded-md shadow-sm py-2 px-3 transition-colors ${formErrors.recipientId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'}`} />
              {formErrors.recipientId && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.recipientId}</p>}
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="saveBeneficiary" checked={saveBeneficiary} onChange={e => setSaveBeneficiary(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <label htmlFor="saveBeneficiary" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Guardar beneficiario</label>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">Continuar al Pago</button>
          </div>
        </motion.form>
      );
    };

    const renderStep3_Payment = () => {
      return (
        <motion.div key="step3" {...stepAnimation}>
          <div className="flex items-center gap-4 mb-2">
            <button type="button" onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 rounded-full"><ArrowLeftIcon className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Instrucciones de Pago</h2>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Realiza el depósito a la siguiente cuenta y sube el comprobante.</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Cuenta Bancaria (BCP)</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">Titular: <span className="font-semibold">Remesas A&M SAC</span></p>
            <p className="text-sm text-gray-700 dark:text-gray-300">Cuenta: <span className="font-mono font-semibold">193-12345678-0-01</span></p>
            <p className="text-sm text-gray-700 dark:text-gray-300">CCI: <span className="font-mono font-semibold">002-193-0012345678001-14</span></p>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-lg font-bold text-gray-800 dark:text-white">Monto a pagar: {total.toFixed(2)} {fromCurrency}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Subir Comprobante</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {receiptFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                    <CheckCircleIcon className="w-5 h-5" />
                    {receiptFile.name}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    <p>Haz clic para subir o arrastra la imagen aquí</p>
                    <p className="text-xs mt-1">(JPG, PNG)</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleUploadReceipt}
              disabled={!receiptFile || isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Subir y Confirmar'
              )}
            </button>
          </div>
        </motion.div>
      );
    };

    const renderStep4_Confirm = () => {
      // Step 4 is now just a placeholder for the modal logic which is triggered after upload
      return null;
    };

    const renderStep5_Success = () => (
      <motion.div key="step5" {...stepAnimation} className="text-center p-8">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Envío exitoso!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Tu transacción ha sido enviada a verificación.</p>
        <p className="text-gray-800 dark:text-gray-200 font-semibold">ID: {transactionId}</p>
        <button onClick={handleNewTransaction} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Enviar otra remesa</button>
      </motion.div>
    );

    const renderStep6_Error = () => (
      <motion.div key="step6" {...stepAnimation} className="text-center p-8">
        <XCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error al enviar</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Hubo un problema al procesar tu envío.</p>
        <p className="text-gray-800 dark:text-gray-200 font-semibold">{submissionError}</p>
        <button onClick={handleNewTransaction} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Intentar de nuevo</button>
      </motion.div>
    );

    const renderCurrentStep = () => {
      switch (step) {
        case 1:
          return renderStep1_Calculator();
        case 2:
          return renderStep2_Recipient();
        case 3:
          return renderStep3_Payment();
        case 4:
          // Step 4 is skipped in UI rendering because it triggers the modal
          // But we need to render something if modal is closed?
          // Actually, handleUploadReceipt sets Step 4 AND opens modal.
          // If modal is closed without confirming, we should probably go back to Step 3?
          // Or just render nothing and let the Modal be the only thing?
          // Let's render Step 3 content in background.
          return renderStep3_Payment();
        case 5:
          return renderStep5_Success();
        case 6:
          return renderStep6_Error();
        default:
          return null;
      }
    };

    return (
      <Card>
        <AnimatePresence mode="wait">{renderCurrentStep()}</AnimatePresence>
        {isSummaryVisible && (
          <TransactionSummaryModal
            details={{ amount, fee, total, fromCurrency, receivedAmount, receivedCurrency, fromCountryCode, toCountryCode }}
            onConfirm={handleConfirmSend}
            onClose={() => setIsSummaryVisible(false)}
          />
        )}
      </Card>
    );
  }
);

export default Calculator;
