// src/components/Calculator.tsx
import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REMITTANCE_FEE_PERCENTAGE } from '../constants';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import SwapIcon from './icons/SwapIcon';
import ClockIcon from './icons/ClockIcon';
import type { User, Beneficiary } from '../types';
import { Screen } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import FlagIcon from './icons/FlagIcon';
import { supabase } from '../supabaseClient';
import XIcon from './icons/XIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import CountrySelector from './CountrySelector';
import { logger } from '../services/logger';

// New Design System Imports
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PageTransition } from './animations/PageTransition';

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
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { type: 'spring', stiffness: 300, damping: 30 },
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

  const DetailRow: React.FC<{ label: string; value: React.ReactNode; isBold?: boolean }> = ({ label, value, isBold = false }) => (
    <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm text-text-primary ${isBold ? 'font-bold' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card variant="default" padding="none" className="overflow-hidden">
          <header className="p-4 flex justify-between items-center border-b border-border bg-bg-secondary/50">
            <h3 className="text-lg font-bold text-text-primary">Confirmar Envío</h3>
            <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-bg-tertiary transition-colors">
              <XIcon className="w-5 h-5" />
            </button>
          </header>

          <div className="p-6 space-y-6">
            {/* Visual Flow */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
              <div className="flex items-center gap-3">
                <FlagIcon countryCode={details.fromCountryCode} className="w-8 h-8 rounded-full shadow-sm" />
                <div>
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Envías</p>
                  <p className="font-bold text-lg text-text-primary">
                    {parseFloat(details.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {details.fromCurrency}
                  </p>
                </div>
              </div>
              <div className="bg-white p-2 rounded-full shadow-sm">
                <ArrowRightIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Reciben</p>
                  <p className="font-bold text-lg text-accent-dark">
                    {details.receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {details.receivedCurrency}
                  </p>
                </div>
                <FlagIcon countryCode={details.toCountryCode} className="w-8 h-8 rounded-full shadow-sm" />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1">
              <DetailRow label="Comisión" value={`${details.fee.toFixed(2)} ${details.fromCurrency}`} />
              <DetailRow label="Total a pagar" value={`${details.total.toFixed(2)} ${details.fromCurrency}`} isBold />
            </div>
          </div>

          <footer className="p-4 bg-bg-secondary/30 flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => { logger.debug('Confirmar clicked'); handleConfirm(); }}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Confirmar Envío
            </Button>
          </footer>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const Calculator = forwardRef<CalculatorRef, CalculatorProps>(
  ({ user, setActiveScreen, prefillData, onClearPrefill }, ref) => {
    const { countriesWithLatestRates: COUNTRIES, isLoading: areRatesLoading, getRate } = useExchangeRates();

    // Estado del flujo
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
    const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);

    // Step 1 State
    const [amount, setAmount] = useState<string>('');
    const [fromCountryCode, setFromCountryCode] = useState<string>('');
    const [toCountryCode, setToCountryCode] = useState<string>('');
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

    const getCleanAmount = (val: string) => parseFloat(val.replace(/,/g, '')) || 0;

    const formatAmount = (val: string) => {
      const clean = val.replace(/[^\d.]/g, '');
      const parts = clean.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

      const feeCalc = numericAmount * REMITTANCE_FEE_PERCENTAGE;
      const total = numericAmount + feeCalc;

      const amountInUSD = fromCountry.currency === 'USD'
        ? numericAmount
        : numericAmount / fromCountry.exchangeRateToUSD;

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
          case 'recipientName': return 'Nombre es requerido';
          case 'recipientAccount': return 'Cuenta es requerida';
          case 'recipientId': return 'Documento es requerido';
          default: return undefined;
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No hay sesión activa');

        const formData = new FormData();
        formData.append('file', receiptFile);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Error uploading file');
        }

        const data = await response.json();
        setReceiptUrl(data.publicUrl);
        setStep(4);
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No hay sesión activa');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/remittances/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: user.id,
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
            receiptUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'Error al enviar la remesa';
          alert(errorMessage);
          throw new Error(errorMessage);
        }
        const data = await response.json();
        setTransactionId(data.transaction_id);
        setIsSummaryVisible(false);
        setStep(5);
      } catch (err) {
        console.error('handleConfirmSend error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
        setSubmissionError(errorMessage);
        if (!errorMessage.includes('mínimo')) {
          setIsSummaryVisible(false);
          setStep(6);
        }
      } finally {
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
        <Card className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4 text-text-secondary">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p>Cargando tasas de cambio...</p>
          </div>
        </Card>
      );
    }

    const renderStep1_Calculator = () => {
      const allowedOriginCodes = ['VE', 'BR', 'CO', 'PE', 'US'];
      const originCountries = COUNTRIES.filter(c => allowedOriginCodes.includes(c.code) || c.region === 'Europe');
      return (
        <motion.div key="step1" {...stepAnimation} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveScreen(Screen.Calculator)} // Or welcome if available
              className="p-3 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="w-6 h-6 text-slate-600" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Enviar Dinero</h2>
          </div>

          {/* Dark Rate Card (Replaces ExchangeRateBanner) */}
          <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-accent text-sm font-bold tracking-wide">TASA EN TIEMPO REAL</span>
            </div>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-slate-400 text-sm">1 {fromCurrency} equivale a</p>
                <p className="text-3xl font-bold mt-1">
                  {getRate(fromCurrency, receivedCurrency).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {receivedCurrency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-secondary text-sm font-medium flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  Mejor tasa garantizada
                </p>
              </div>
            </div>
          </div>

          {/* Main Input Form */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-2 shadow-sm border border-slate-100 dark:border-slate-700">

            {/* Origin Country */}
            <div className="p-6 pb-2">
              <div className="flex items-center gap-4 mt-2">
                <CountrySelector
                  countries={originCountries}
                  selectedCode={fromCountryCode}
                  onSelect={handleCountrySelectAndFocus(setFromCountryCode)}
                  variant="pill"
                />
                <Input
                  ref={amountInputRef}
                  label="Tú envías"
                  name="amount"
                  value={amount}
                  onChange={handleInputChange}
                  error={formErrors.amount}
                  placeholder="0.00"
                  autoComplete="off"
                  variant="big"
                />
              </div>
            </div>

            {/* Divider with Swap Icon */}
            <div className="relative h-px bg-slate-100 dark:bg-slate-700 my-2 mx-6">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-100 dark:border-slate-700 text-secondary shadow-sm cursor-pointer hover:scale-110 transition-transform" onClick={handleSwap}>
                <SwapIcon className="w-5 h-5" />
              </div>
            </div>

            {/* Destination Country */}
            <div className="p-6 pt-2">
              <div className="flex items-center gap-4 mt-2">
                <CountrySelector
                  countries={COUNTRIES.filter(c => c.code !== fromCountryCode)}
                  selectedCode={toCountryCode}
                  onSelect={handleCountrySelectAndFocus(setToCountryCode)}
                  variant="pill"
                />
                <div className="w-full flex flex-col">
                  <label className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1 mb-1">
                    Ellos reciben
                  </label>
                  <div className="text-4xl font-extrabold text-accent text-right px-0 py-2">
                    {receivedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2 text-sm">
                Comisión de servicio
              </span>
              <span className="font-bold">{fee.toFixed(2)} {fromCurrency}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="text-sm">Total a pagar</span>
              <span className="font-bold">{total.toFixed(2)} {fromCurrency}</span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Tiempo de entrega</span>
              <span className="font-bold text-accent bg-accent/10 px-3 py-1 rounded-full text-xs">⚡ {arrivalTime}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button
              onClick={handleContinueToRecipient}
              disabled={
                !user.isVerified ||
                !!formErrors.amount ||
                getCleanAmount(amount) <= 0 ||
                getCleanAmount(amount) < (COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount || 0)
              }
              size="lg"
              className="w-full py-6 text-xl shadow-xl shadow-primary/30"
            >
              {user.isVerified ? 'Continuar con el Envío' : 'Verificación Requerida'}
            </Button>

            {/* Warnings */}
            {getCleanAmount(amount) > 0 &&
              getCleanAmount(amount) < (COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount || 0) && (
                <p className="text-error text-sm text-center font-medium mt-2">
                  ⚠️ El monto mínimo es {COUNTRIES.find(c => c.code === fromCountryCode)?.minimumSendAmount.toLocaleString()} {fromCurrency}
                </p>
              )}

            {!user.isVerified && (
              <div className="mt-4 p-4 rounded-xl bg-warning/10 text-warning-dark text-sm flex items-center gap-4 border border-warning/20">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold">Verificación Requerida</p>
                  <p>Debes verificar tu perfil para poder enviar dinero.</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveScreen(Screen.Profile)}
                >
                  Verificar
                </Button>
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
        if (isFormComplete) setStep(3);
      };

      return (
        <motion.form key="step2" {...stepAnimation} onSubmit={handleProceedToPayment} className="space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button type="button" onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-bg-secondary transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-text-primary" />
            </button>
            <h2 className="text-2xl font-bold text-text-primary">Datos del Beneficiario</h2>
          </div>

          <Card variant="default" padding="lg" className="space-y-6">
            <Input
              label="Nombre Completo"
              name="recipientName"
              value={recipientName}
              onChange={handleInputChange}
              error={formErrors.recipientName}
              autoComplete="name"
              variant="clean"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-secondary ml-1">Banco del Beneficiario</label>
              <div className="relative">
                <select
                  name="recipientBank"
                  value={recipientBank}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl appearance-none focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="" disabled>Selecciona un banco</option>
                  {availableBanks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <Input
              label="Número de Cuenta"
              name="recipientAccount"
              value={recipientAccount}
              onChange={handleInputChange}
              error={formErrors.recipientAccount}
              autoComplete="off"
              variant="clean"
            />

            <Input
              label="Documento de Identidad"
              name="recipientId"
              value={recipientId}
              onChange={handleInputChange}
              error={formErrors.recipientId}
              autoComplete="off"
              variant="clean"
            />

            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="saveBeneficiary"
                checked={saveBeneficiary}
                onChange={e => setSaveBeneficiary(e.target.checked)}
                className="h-5 w-5 text-primary focus:ring-primary border-border rounded transition-colors"
              />
              <label htmlFor="saveBeneficiary" className="ml-3 block text-sm font-medium text-text-primary">
                Guardar como beneficiario frecuente
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full mt-4">
              Continuar al Pago
            </Button>
          </Card>
        </motion.form>
      );
    };

    const renderStep3_Payment = () => {
      return (
        <motion.div key="step3" {...stepAnimation} className="space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button type="button" onClick={() => setStep(2)} className="p-2 rounded-full hover:bg-bg-secondary transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-text-primary" />
            </button>
            <h2 className="text-2xl font-bold text-text-primary">Instrucciones de Pago</h2>
          </div>

          <Card variant="default" padding="lg" className="space-y-8">
            <div className="bg-secondary/10 p-6 rounded-2xl border border-secondary/20">
              <h3 className="font-bold text-secondary-dark mb-4 text-lg">Cuenta Bancaria (BCP)</h3>
              <div className="space-y-2 text-text-primary">
                <p>Titular: <span className="font-semibold">Remesas A&M SAC</span></p>
                <p>Cuenta: <span className="font-mono font-semibold bg-white/50 px-2 py-1 rounded">193-12345678-0-01</span></p>
                <p>CCI: <span className="font-mono font-semibold bg-white/50 px-2 py-1 rounded">002-193-0012345678001-14</span></p>
              </div>
              <div className="mt-6 pt-4 border-t border-secondary/20">
                <p className="text-xl font-bold text-text-primary">
                  Monto a pagar: <span className="text-secondary-dark">{total.toFixed(2)} {fromCurrency}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-primary">Subir Comprobante</label>
              <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-8 text-center transition-all cursor-pointer relative bg-bg-secondary/30 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {receiptFile ? (
                  <div className="flex flex-col items-center gap-3 text-accent-dark font-medium">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6" />
                    </div>
                    <span>{receiptFile.name}</span>
                    <span className="text-xs text-text-secondary">Click para cambiar</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-text-secondary group-hover:text-primary transition-colors">
                    <span>Arrastra tu comprobante aquí o haz click</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUploadReceipt}
              disabled={!receiptFile || isUploading}
              isLoading={isUploading}
              size="lg"
              className="w-full py-6 text-xl shadow-xl shadow-primary/30"
            >
              {isUploading ? 'Subiendo...' : 'Confirmar y Enviar'}
            </Button>
          </Card>
        </motion.div>
      );
    };

    const renderStep4_Summary = () => {
      // This is now handled by the Modal, but keeping a placeholder if needed for state logic
      return null;
    };

    const renderStep5_Success = () => {
      return (
        <motion.div key="step5" {...stepAnimation} className="text-center space-y-8 py-12">
          <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mx-auto relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
            <CheckCircleIcon className="w-16 h-16 text-accent" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-text-primary">¡Envío Exitoso!</h2>
            <p className="text-text-secondary text-lg">Tu transacción ha sido procesada correctamente.</p>
          </div>

          <Card variant="glass" padding="lg" className="max-w-sm mx-auto bg-white/50 backdrop-blur-sm border-white/50">
            <p className="text-sm text-text-secondary uppercase tracking-wider font-bold mb-1">ID de Transacción</p>
            <p className="text-2xl font-mono font-bold text-primary select-all">{transactionId}</p>
          </Card>

          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button onClick={handleNewTransaction} size="lg" className="shadow-lg shadow-primary/20">
              Realizar otro envío
            </Button>
            <Button variant="ghost" onClick={() => setActiveScreen(Screen.History)}>
              Ver Historial
            </Button>
          </div>
        </motion.div>
      );
    };

    const renderStep6_Error = () => {
      return (
        <motion.div key="step6" {...stepAnimation} className="text-center space-y-8 py-12">
          <div className="w-32 h-32 bg-error/10 rounded-full flex items-center justify-center mx-auto">
            <XCircleIcon className="w-16 h-16 text-error" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-text-primary">Algo salió mal</h2>
            <p className="text-text-secondary text-lg max-w-md mx-auto">
              {submissionError || 'No pudimos procesar tu solicitud. Por favor intenta nuevamente.'}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Intentar de nuevo
            </Button>
            <Button variant="ghost" onClick={handleNewTransaction}>
              Volver al inicio
            </Button>
          </div>
        </motion.div>
      );
    };

    return (
      <PageTransition>
        <AnimatePresence mode="wait">
          {step === 1 && renderStep1_Calculator()}
          {step === 2 && renderStep2_Recipient()}
          {step === 3 && renderStep3_Payment()}
          {step === 4 && (
            <Card className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4 text-text-secondary">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p>Procesando transacción...</p>
              </div>
            </Card>
          )}
          {step === 5 && renderStep5_Success()}
          {step === 6 && renderStep6_Error()}
        </AnimatePresence>

        <AnimatePresence>
          {isSummaryVisible && (
            <TransactionSummaryModal
              details={{
                amount,
                fee,
                total,
                fromCurrency,
                receivedAmount,
                receivedCurrency,
                fromCountryCode,
                toCountryCode,
              }}
              onConfirm={handleConfirmSend}
              onClose={() => setIsSummaryVisible(false)}
            />
          )}
        </AnimatePresence>
      </PageTransition>
    );
  }
);

export default Calculator;
