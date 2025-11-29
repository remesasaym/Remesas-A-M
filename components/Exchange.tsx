import React, { useState } from 'react';
import Card from './common/Card';
import { PAYPAL_FEE_PERCENTAGE, WORLDCOIN_MINIMUM_EXCHANGE, USDC_FEE_PERCENTAGE, USDC_MINIMUM_EXCHANGE } from '../constants';
import Spinner from './common/Spinner';

type CryptoType = 'WLD' | 'PAYPAL' | 'USDC';

const getCurrencySymbol = (type: CryptoType) => {
    switch (type) {
        case 'WLD': return 'WLD';
        case 'PAYPAL': return 'USD';
        case 'USDC': return 'USDC';
        default: return '';
    }
};

const Exchange: React.FC = () => {
  const [cryptoType, setCryptoType] = useState<CryptoType>('WLD');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const numericAmount = parseFloat(amount) || 0;
  let fee = 0;
  let received = 0;
  let error = '';

  if (numericAmount < 0) {
    error = 'La cantidad no puede ser negativa.';
  } else if (cryptoType === 'WLD') {
    if (numericAmount > 0 && numericAmount < WORLDCOIN_MINIMUM_EXCHANGE) {
      error = `Mínimo de ${WORLDCOIN_MINIMUM_EXCHANGE} WLD.`;
    }
    // Commission is variable, so we just show a placeholder
    fee = numericAmount * 0.1; // Example 10% variable fee
    received = numericAmount - fee;
  } else if (cryptoType === 'PAYPAL') {
    fee = numericAmount * PAYPAL_FEE_PERCENTAGE;
    received = numericAmount - fee;
  } else if (cryptoType === 'USDC') {
    if (numericAmount > 0 && numericAmount < USDC_MINIMUM_EXCHANGE) {
      error = `Mínimo de ${USDC_MINIMUM_EXCHANGE} USDC.`;
    }
    fee = numericAmount * USDC_FEE_PERCENTAGE;
    received = numericAmount - fee;
  }
  
  const handleSubmit = async () => {
      if (error || numericAmount <= 0) return;
      setIsSubmitting(true);
      // Simula una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1500));
      // En una app real, aquí se mostraría un mensaje de éxito
      console.log("Intercambio enviado por", numericAmount, cryptoType);
      setIsSubmitting(false);
  };

  const currencySymbol = getCurrencySymbol(cryptoType);

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Intercambiar Crypto y Saldo</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Convierte tus activos digitales a moneda local.</p>

      <div className="grid grid-cols-3 bg-gray-200 dark:bg-gray-700/80 p-1 rounded-lg mb-6">
        <button 
            onClick={() => {setCryptoType('WLD'); setAmount('');}}
            className={`flex-1 p-2 rounded-md font-semibold text-sm transition-colors ${cryptoType === 'WLD' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            Worldcoin (WLD)
        </button>
        <button 
            onClick={() => {setCryptoType('PAYPAL'); setAmount('');}}
            className={`flex-1 p-2 rounded-md font-semibold text-sm transition-colors ${cryptoType === 'PAYPAL' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            PayPal
        </button>
        <button 
            onClick={() => {setCryptoType('USDC'); setAmount('');}}
            className={`flex-1 p-2 rounded-md font-semibold text-sm transition-colors ${cryptoType === 'USDC' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            USDC
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="crypto-amount" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Cantidad a intercambiar
          </label>
          <div className="relative">
            <input
              type="number"
              id="crypto-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-gray-100 dark:bg-gray-700 border rounded-md py-3 pl-4 pr-16 text-gray-800 dark:text-white text-lg font-semibold transition-colors ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'}`}
              placeholder="0.00"
            />
            <span className="absolute inset-y-0 right-4 flex items-center text-gray-500 dark:text-gray-400 font-bold">{currencySymbol}</span>
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-2 text-sm">
             <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Comisión:</span>
                <span className="font-medium text-gray-800 dark:text-white">{fee > 0 ? fee.toFixed(2) : '0.00'} {cryptoType === 'PAYPAL' ? 'USD' : currencySymbol}</span>
            </div>
            <hr className="border-gray-300 dark:border-gray-700" />
            <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-bold">Recibirás (aprox):</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-xl">{received > 0 ? received.toFixed(2) : '0.00'} USD</span>
            </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!!error || numericAmount <= 0 || isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 text-lg disabled:bg-green-400 dark:disabled:bg-green-800/50 disabled:cursor-wait flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Spinner className="w-6 h-6 mr-3" />
              <span>Procesando...</span>
            </>
          ) : (
            'Iniciar Intercambio'
          )}
        </button>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {cryptoType === 'WLD' ? 'La tasa de cambio WLD a USD es variable.' 
            : cryptoType === 'PAYPAL' ? `La comisión de PayPal es del ${PAYPAL_FEE_PERCENTAGE * 100}%.`
            : `La comisión de USDC es del ${USDC_FEE_PERCENTAGE * 100}%.`}
        </p>
      </div>
    </Card>
  );
};

export default Exchange;