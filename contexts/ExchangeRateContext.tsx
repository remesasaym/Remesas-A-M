
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Country } from '../types';
import { COUNTRIES, MARGEN_EXCHANGE, REMITTANCE_FEE_PERCENTAGE } from '../constants';
import {
  fetchExchangeRates,
  refreshExchangeRates,
  convertCurrency,
  getExchangeRate,
  type ExchangeRates
} from '../services/exchangeRateService';
import { loadSystemSettings } from '../services/settingsService';

interface ExchangeRateContextType {
  countriesWithLatestRates: Country[];
  liveRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshRates: () => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string, applySpread?: boolean) => number;
  getRate: (fromCurrency: string, toCurrency: string, applySpread?: boolean) => number;
  remittanceFee: number;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const ExchangeRateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [liveRates, setLiveRates] = useState<ExchangeRates | null>(null);
  const [countriesWithLatestRates, setCountriesWithLatestRates] = useState<Country[]>(COUNTRIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [margin, setMargin] = useState<number>(MARGEN_EXCHANGE);
  const [remittanceFee, setRemittanceFee] = useState<number>(REMITTANCE_FEE_PERCENTAGE);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar configuraciones dinámicas primero
      const settings = await loadSystemSettings();
      setMargin(settings.margen_exchange);
      if (settings.remittance_fee_percentage !== undefined) {
        setRemittanceFee(settings.remittance_fee_percentage);
      }
      console.log('⚙️ Config cargada:', { margin: settings.margen_exchange, fee: settings.remittance_fee_percentage });

      const rates = await fetchExchangeRates();

      if (!rates) {
        throw new Error('No se pudieron obtener las tasas de cambio');
      }

      setLiveRates(rates);
      setLastUpdated(new Date());

      // Update countries with live rates
      const updatedCountries = COUNTRIES.map(country => ({
        ...country,
        exchangeRateToUSD: rates.rates[country.currency] || country.exchangeRateToUSD,
      }));

      setCountriesWithLatestRates(updatedCountries);

      console.log('✅ Tasas de cambio actualizadas:', rates.date);
    } catch (err) {
      console.error('Error cargando tasas:', err);
      setError('Las tasas de cambio no están disponibles. Usando valores de respaldo.');

      // Fallback to static rates from constants
      setCountriesWithLatestRates(COUNTRIES);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRatesManual = async () => {
    console.log('🔄 Refrescando tasas de cambio...');
    const rates = await refreshExchangeRates();
    if (rates) {
      setLiveRates(rates);
      setLastUpdated(new Date());

      const updatedCountries = COUNTRIES.map(country => ({
        ...country,
        exchangeRateToUSD: rates.rates[country.currency] || country.exchangeRateToUSD,
      }));

      setCountriesWithLatestRates(updatedCountries);
      setError(null);
    }
  };

  // Load rates on mount
  useEffect(() => {
    loadRates();
  }, []);

  // Auto-refresh every hour
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh de tasas de cambio');
      loadRates();
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    applySpread: boolean = true
  ): number => {
    if (!liveRates) {
      // Fallback to static conversion
      const fromCountry = COUNTRIES.find(c => c.currency === fromCurrency);
      const toCountry = COUNTRIES.find(c => c.currency === toCurrency);

      if (fromCountry && toCountry) {
        const usdAmount = amount / fromCountry.exchangeRateToUSD;
        let result = usdAmount * toCountry.exchangeRateToUSD;

        if (applySpread) {
          result = result * margin;
        }

        return result;
      }

      return amount;
    }

    return convertCurrency(amount, fromCurrency, toCurrency, liveRates, applySpread, margin);
  };

  const getRate = (
    fromCurrency: string,
    toCurrency: string,
    applySpread: boolean = true
  ): number => {
    if (!liveRates) {
      // Fallback to static rate
      const fromCountry = COUNTRIES.find(c => c.currency === fromCurrency);
      const toCountry = COUNTRIES.find(c => c.currency === toCurrency);

      if (fromCountry && toCountry) {
        let rate = toCountry.exchangeRateToUSD / fromCountry.exchangeRateToUSD;

        if (applySpread) {
          rate = rate * margin;
        }

        return rate;
      }

      return 0;
    }

    return getExchangeRate(fromCurrency, toCurrency, liveRates, applySpread, margin);
  };

  const value = {
    countriesWithLatestRates,
    liveRates,
    isLoading,
    error,
    lastUpdated,
    refreshRates: refreshRatesManual,
    convertAmount,
    getRate,
    remittanceFee,
  };

  return (
    <ExchangeRateContext.Provider value={value}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

export const useExchangeRates = (): ExchangeRateContextType => {
  const context = useContext(ExchangeRateContext);
  if (context === undefined) {
    throw new Error('useExchangeRates must be used within an ExchangeRateProvider');
  }
  return context;
};
