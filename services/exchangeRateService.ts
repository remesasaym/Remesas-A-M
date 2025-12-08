// Service to fetch live exchange rates from ExchangeRate-API
// Free tier: 1500 requests/month (enough for MVP)
// Docs: https://www.exchangerate-api.com/docs/overview
import { MARGEN_EXCHANGE } from '../constants';

export interface ExchangeRates {
    base: string;
    date: string;
    rates: { [currency: string]: number };
    timestamp?: number; // For caching
}

/**
 * Fetches live exchange rates with USD as base currency
 */
export async function fetchExchangeRates(): Promise<ExchangeRates | null> {
    try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${API_URL}/api/exchange/rates`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const countriesData = await response.json();

        // Transform backend array format to the expected rates object format
        const rates: { [currency: string]: number } = {};

        // Map the backend data to the rates object
        // Backend returns array of Country objects with exchangeRateToUSD
        if (Array.isArray(countriesData)) {
            countriesData.forEach((country: any) => {
                if (country.currency && country.exchangeRateToUSD) {
                    rates[country.currency] = country.exchangeRateToUSD;
                }
            });
        }

        // Add timestamp
        const ratesWithTimestamp: ExchangeRates = {
            base: 'USD',
            date: new Date().toISOString().split('T')[0],
            rates: rates,
            timestamp: Date.now(),
        };

        console.log('✅ Exchange rates loaded from Backend');
        return ratesWithTimestamp;

    } catch (error) {
        console.error('❌ Error fetching exchange rates from backend:', error);
        return null;
    }
}

/**
 * Converts amount from one currency to another using live rates
 * Applies the FX spread to our advantage
 */
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRates,
    applySpread: boolean = true,
    margin: number = MARGEN_EXCHANGE
): number {
    if (!rates || !rates.rates) {
        throw new Error('Exchange rates not available');
    }

    // Get rates (all are relative to USD as base)
    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate || !toRate) {
        throw new Error(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    let convertedAmount = usdAmount * toRate;

    // Apply spread in our favor (reduce the amount user receives slightly)
    if (applySpread) {
        convertedAmount = convertedAmount * margin;
    }

    return convertedAmount;
}

/**
 * Gets the exchange rate between two currencies with spread applied
 */
export function getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRates,
    applySpread: boolean = true,
    margin: number = MARGEN_EXCHANGE
): number {
    if (!rates || !rates.rates) {
        return 0;
    }

    const fromRate = rates.rates[fromCurrency];
    const toRate = rates.rates[toCurrency];

    if (!fromRate || !toRate) {
        return 0;
    }

    let rate = toRate / fromRate;

    // Apply spread
    if (applySpread) {
        rate = rate * margin;
    }

    return rate;
}

/**
 * Force refresh exchange rates (bypass cache)
 */
export async function refreshExchangeRates(): Promise<ExchangeRates | null> {
    localStorage.removeItem('exchange_rates_cache');
    return fetchExchangeRates();
}
