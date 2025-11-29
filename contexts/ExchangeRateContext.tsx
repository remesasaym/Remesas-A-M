
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Country } from '../types';
import { COUNTRIES, FX_SPREAD_PERCENTAGE } from '../constants';
import {
  fetchExchangeRates,
  refreshExchangeRates,
  convertCurrency,
  getExchangeRate,
  type ExchangeRates
} from '../services/exchangeRateService';

interface ExchangeRateContextType {
  countriesWithLatestRates: Country[];
  liveRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshRates: () => Promise<void>;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string, applySpread?: boolean) => number;
  getRate: (fromCurrency: string, toCurrency: string, applySpread?: boolean) => number;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const ExchangeRateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [liveRates, setLiveRates] = useState<ExchangeRates | null>(null);
  const [countriesWithLatestRates, setCountriesWithLatestRates] = useState<Country[]>(COUNTRIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      setError(null);
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
          result = result * (1 - FX_SPREAD_PERCENTAGE);
        }

        return result;
      }

      return amount;
    }

    return convertCurrency(amount, fromCurrency, toCurrency, liveRates, applySpread);
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
          rate = rate * (1 - FX_SPREAD_PERCENTAGE);
        }

        return rate;
      }

      return 0;
    }

    return getExchangeRate(fromCurrency, toCurrency, liveRates, applySpread);
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
