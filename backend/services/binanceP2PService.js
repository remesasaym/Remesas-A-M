/**
 * Binance P2P Exchange Rate Service
 * Fetches real-time exchange rates from Binance P2P for all currencies except VES
 */

const { supabase } = require("../supabaseClient");

const DEFAULT_MARGIN = 0; // Default margin (0% if no config found)

/**
 * Get configured margin from database
 * @returns {Promise<number>}
 */
async function getMargin() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'margin')
            .single();

        if (error || !data) {
            // If not found or error, try to find 'config' key which might contain margin
            const { data: configData } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'config')
                .single();

            if (configData && configData.value && configData.value.margin) {
                return Number(configData.value.margin);
            }

            return DEFAULT_MARGIN;
        }

        // Handle if value is a number directly or an object
        if (typeof data.value === 'object' && data.value.margin) {
            return Number(data.value.margin);
        }

        return Number(data.value) || DEFAULT_MARGIN;
    } catch (error) {
        console.error("Error fetching margin from DB:", error);
        return DEFAULT_MARGIN;
    }
}

/**
 * Fetch exchange rate from Binance P2P
 * @param {string} currency - Currency code (PEN, COP, BRL, ARS, EUR, MXN, CLP, etc.)
 * @returns {Promise<{buy: number, sell: number, base: number} | null>}
 */
async function fetchBinanceP2PRate(currency) {
    const code = currency.toString().trim().toUpperCase();

    // Skip VES - use your existing provider
    if (code === 'VES') {
        return null;
    }

    try {
        // Get dynamic margin
        const margin = await getMargin();

        const url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
        const payload = {
            page: 1,
            rows: 1,
            asset: "USDT",
            tradeType: "SELL",
            fiat: code,
            payTypes: [],
            countries: []
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            const base = parseFloat(data.data[0].adv.price); // Real P2P rate

            if (base > 0) {
                const buy = base * (1 + margin / 100);
                const sell = base * (1 - margin / 100);

                return {
                    buy: Number(buy.toFixed(2)),
                    sell: Number(sell.toFixed(2)),
                    base: Number(base.toFixed(2)),
                    source: 'binance_p2p',
                    currency: code,
                    margin_applied: margin,
                    timestamp: new Date().toISOString()
                };
            }
        }

        return null;
    } catch (error) {
        console.error(`Error fetching Binance P2P rate for ${code}:`, error.message);
        return null;
    }
}

/**
 * Fetch multiple currency rates from Binance P2P
 * @param {string[]} currencies - Array of currency codes
 * @returns {Promise<Object>} - Object with currency codes as keys
 */
async function fetchMultipleBinanceRates(currencies) {
    const rates = {};

    for (const currency of currencies) {
        const rate = await fetchBinanceP2PRate(currency);
        if (rate) {
            rates[currency] = rate;
        }
    }

    return rates;
}

module.exports = {
    fetchBinanceP2PRate,
    fetchMultipleBinanceRates
};
