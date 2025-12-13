
// backend/services/exchangeRateService.js
const logger = require("pino")();
const { fetchBinanceP2PRate } = require("./binanceP2PService");
// const fetch = require("node-fetch"); // Native fetch in Node 18+

// API Configuration
const EXCHANGERATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const EXCHANGERATE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`;

// ===== VENEZUELA (VES) - DolarAPI Paralelo =====
async function getVenezuelaRate() {
  try {
    const response = await fetch("https://ve.dolarapi.com/v1/dolares/paralelo");
    if (!response.ok) throw new Error(`DolarAPI VE returned ${response.status}`);
    const data = await response.json();
    return data.promedio || 36.5; // Fallback
  } catch (error) {
    logger.error("Error fetching Venezuela rate from DolarAPI:", error);
    return 36.5;
  }
}

// ===== BINANCE P2P - For all currencies except VES =====
async function getBinanceRate(currency) {
  try {
    const rate = await fetchBinanceP2PRate(currency);
    if (rate && rate.base > 0) {
      logger.info(`Binance P2P rate for ${currency}: ${rate.base}`);
      return rate.base;
    }
    return null;
  } catch (error) {
    logger.error(`Error fetching Binance P2P rate for ${currency}:`, error);
    return null;
  }
}

// ===== GLOBAL RATES - ExchangeRate-API (Fallback) =====
async function getGlobalRates() {
  try {
    const response = await fetch(EXCHANGERATE_API_URL);
    if (!response.ok) throw new Error(`ExchangeRate-API returned ${response.status}`);
    const data = await response.json();

    if (data.result !== "success") {
      throw new Error("ExchangeRate-API request failed");
    }

    return data.conversion_rates;
  } catch (error) {
    logger.error("Error fetching global rates from ExchangeRate-API:", error);
    // Return fallback rates
    return {
      BRL: 5.40,
      COP: 3950.00,
      MXN: 17.15,
      PEN: 3.75,
      CLP: 940.00,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.37,
      ARS: 1250.00,
      // Add more fallbacks as needed
    };
  }
}

// ===== MAIN FUNCTION - Fetch all exchange rates =====
async function getExchangeRates() {
  logger.info("Fetching exchange rates from multiple sources...");

  let vesRate, globalRates;

  // List of currencies to fetch from Binance P2P
  const binanceCurrencies = ['PEN', 'COP', 'BRL', 'ARS', 'MXN', 'CLP', 'EUR', 'GBP'];
  const binanceRates = {};

  try {
    // Fetch VES and global rates in parallel
    [vesRate, globalRates] = await Promise.all([
      getVenezuelaRate(),
      getGlobalRates(),
    ]);

    // Fetch Binance P2P rates for all currencies (except VES)
    logger.info("Fetching rates from Binance P2P...");
    for (const currency of binanceCurrencies) {
      const binanceRate = await getBinanceRate(currency);
      if (binanceRate) {
        binanceRates[currency] = binanceRate;
      }
    }

  } catch (error) {
    console.error("CRITICAL ERROR IN getExchangeRates:", error);
    // Fallback values in case of catastrophic failure
    vesRate = 36.5;
    globalRates = {};
  }

  logger.info(`Live rates fetched:`)
  logger.info(`  VES (Paralelo): ${vesRate}`);
  logger.info(`  Binance P2P rates: ${Object.keys(binanceRates).length} currencies`);
  logger.info(`  Fallback rates: ${Object.keys(globalRates).length} currencies`);
  logger.info(`  COP: ${globalRates?.COP || 'N/A'}`);

  // Helper function to get rate (Binance P2P first, then fallback)
  const getRate = (currency, fallback) => {
    return binanceRates[currency] || globalRates?.[currency] || fallback;
  };

  return [
    // Norteamérica
    {
      name: "EE.UU.",
      code: "US",
      dialCode: "+1",
      banks: [
        { name: "Bank of America", type: "International" },
        { name: "Chase", type: "International" },
        { name: "Wells Fargo", type: "International" },
        { name: "Citibank", type: "International" },
        { name: "Zelle", type: "International" }
      ],
      currency: "USD",
      exchangeRateToUSD: 1,
      region: "North America",
      minimumSendAmount: 20,
    },
    {
      name: "Canadá",
      code: "CA",
      dialCode: "+1",
      banks: [],
      currency: "CAD",
      exchangeRateToUSD: getRate('CAD', 1.37),
      region: "North America",
      minimumSendAmount: 25,
    },

    // Latinoamérica
    {
      name: "Argentina",
      code: "AR",
      dialCode: "+54",
      banks: [
        { name: "Banco Nación", type: "National" },
        { name: "Galicia", type: "National" },
        { name: "BBVA Argentina", type: "National" },
        { name: "Mercado Pago", type: "National" }
      ],
      currency: "ARS",
      exchangeRateToUSD: getRate('ARS', 1250.00),
      region: "LatAm",
      minimumSendAmount: 4000,
    },
    {
      name: "Bolivia",
      code: "BO",
      dialCode: "+591",
      banks: [],
      currency: "BOB",
      exchangeRateToUSD: getRate('BOB', 6.91),
      region: "LatAm",
      minimumSendAmount: 50,
    },
    {
      name: "Brasil",
      code: "BR",
      dialCode: "+55",
      banks: [],
      currency: "BRL",
      exchangeRateToUSD: getRate('BRL', 5.40),
      region: "LatAm",
      minimumSendAmount: 50,
    },
    {
      name: "Chile",
      code: "CL",
      dialCode: "+56",
      banks: [
        { name: "Banco de Chile", type: "National" },
        { name: "BancoEstado", type: "National" },
        { name: "Santander Chile", type: "National" }
      ],
      currency: "CLP",
      exchangeRateToUSD: getRate('CLP', 940.00),
      region: "LatAm",
      minimumSendAmount: 4000,
    },
    {
      name: "Colombia",
      code: "CO",
      dialCode: "+57",
      banks: [
        { name: "Bancolombia", type: "National" },
        { name: "Davivienda", type: "National" },
        { name: "Nequi", type: "National" },
        { name: "Daviplata", type: "National" },
        { name: "Banco de Bogotá", type: "National" }
      ],
      currency: "COP",
      exchangeRateToUSD: getRate('COP', 3950.00),
      region: "LatAm",
      minimumSendAmount: 25000,
    },
    {
      name: "Costa Rica",
      code: "CR",
      dialCode: "+506",
      banks: [],
      currency: "CRC",
      exchangeRateToUSD: getRate('CRC', 525.00),
      region: "LatAm",
      minimumSendAmount: 5000,
    },
    {
      name: "Cuba",
      code: "CU",
      dialCode: "+53",
      banks: [],
      currency: "CUP",
      exchangeRateToUSD: getRate('CUP', 24.00),
      region: "LatAm",
      minimumSendAmount: 500,
    },
    {
      name: "Ecuador",
      code: "EC",
      dialCode: "+593",
      banks: [
        { name: "Pichincha", type: "National" },
        { name: "Guayaquil", type: "National" },
        { name: "Produbanco", type: "National" },
        { name: "Banco Bolivariano", type: "National" }
      ],
      currency: "USD",
      exchangeRateToUSD: 1.00,
      region: "LatAm",
      minimumSendAmount: 20,
    },
    {
      name: "El Salvador",
      code: "SV",
      dialCode: "+503",
      banks: [],
      currency: "USD",
      exchangeRateToUSD: 1.00,
      region: "LatAm",
      minimumSendAmount: 20,
    },
    {
      name: "Guatemala",
      code: "GT",
      dialCode: "+502",
      banks: [],
      currency: "GTQ",
      exchangeRateToUSD: getRate('GTQ', 7.78),
      region: "LatAm",
      minimumSendAmount: 100,
    },
    {
      name: "Honduras",
      code: "HN",
      dialCode: "+504",
      banks: [],
      currency: "HNL",
      exchangeRateToUSD: getRate('HNL', 24.70),
      region: "LatAm",
      minimumSendAmount: 300,
    },
    {
      name: "México",
      code: "MX",
      dialCode: "+52",
      banks: [
        { name: "BBVA México", type: "National" },
        { name: "Santander México", type: "National" },
        { name: "Banorte", type: "National" },
        { name: "HSBC México", type: "National" },
        { name: "Citibanamex", type: "National" }
      ],
      currency: "MXN",
      exchangeRateToUSD: getRate('MXN', 17.15),
      region: "LatAm",
      minimumSendAmount: 80,
    },
    {
      name: "Nicaragua",
      code: "NI",
      dialCode: "+505",
      banks: [],
      currency: "NIO",
      exchangeRateToUSD: getRate('NIO', 36.60),
      region: "LatAm",
      minimumSendAmount: 400,
    },
    {
      name: "Panamá",
      code: "PA",
      dialCode: "+507",
      banks: [],
      currency: "USD",
      exchangeRateToUSD: 1.00,
      region: "LatAm",
      minimumSendAmount: 20,
    },
    {
      name: "Paraguay",
      code: "PY",
      dialCode: "+595",
      banks: [],
      currency: "PYG",
      exchangeRateToUSD: getRate('PYG', 7250.00),
      region: "LatAm",
      minimumSendAmount: 50000,
    },
    {
      name: "Perú",
      code: "PE",
      dialCode: "+51",
      banks: [
        { name: "BCP", type: "National" },
        { name: "Interbank", type: "National" },
        { name: "Scotiabank", type: "National" },
        { name: "BBVA Perú", type: "National" },
        { name: "Yape", type: "National" },
        { name: "Plin", type: "National" }
      ],
      currency: "PEN",
      exchangeRateToUSD: getRate('PEN', 3.75),
      region: "LatAm",
      minimumSendAmount: 25,
    },
    {
      name: "República Dominicana",
      code: "DO",
      dialCode: "+1",
      banks: [],
      currency: "DOP",
      exchangeRateToUSD: getRate('DOP', 59.00),
      region: "LatAm",
      minimumSendAmount: 500,
    },
    {
      name: "Uruguay",
      code: "UY",
      dialCode: "+598",
      banks: [],
      currency: "UYU",
      exchangeRateToUSD: getRate('UYU', 39.50),
      region: "LatAm",
      minimumSendAmount: 500,
    },
    {
      name: "Venezuela",
      code: "VE",
      dialCode: "+58",
      banks: [
        { name: "Mercantil", type: "National" },
        { name: "Banesco", type: "National" },
        { name: "Banco de Venezuela", type: "National" },
        { name: "Provincial", type: "National" },
        { name: "Pago Móvil", type: "National" }
      ],
      currency: "VES",
      exchangeRateToUSD: vesRate, // Live from DolarAPI Paralelo
      region: "LatAm",
      minimumSendAmount: 500,
    },

    // Europa
    {
      name: "Alemania",
      code: "DE",
      dialCode: "+49",
      banks: [],
      currency: "EUR",
      exchangeRateToUSD: getRate('EUR', 0.92),
      region: "Europe",
      minimumSendAmount: 20,
    },
    {
      name: "España",
      code: "ES",
      dialCode: "+34",
      banks: [
        { name: "SEPA Transfer", type: "International" },
        { name: "Revolut", type: "International" },
        { name: "Wise", type: "International" }
      ],
      currency: "EUR",
      exchangeRateToUSD: getRate('EUR', 0.92),
      region: "Europe",
      minimumSendAmount: 20,
    },
    {
      name: "Francia",
      code: "FR",
      dialCode: "+33",
      banks: [],
      currency: "EUR",
      exchangeRateToUSD: getRate('EUR', 0.92),
      region: "Europe",
      minimumSendAmount: 20,
    },
    {
      name: "Italia",
      code: "IT",
      dialCode: "+39",
      banks: [],
      currency: "EUR",
      exchangeRateToUSD: getRate('EUR', 0.92),
      region: "Europe",
      minimumSendAmount: 20,
    },
    {
      name: "Portugal",
      code: "PT",
      dialCode: "+351",
      banks: [],
      currency: "EUR",
      exchangeRateToUSD: getRate('EUR', 0.92),
      region: "Europe",
      minimumSendAmount: 20,
    },
    {
      name: "Reino Unido",
      code: "GB",
      dialCode: "+44",
      banks: [],
      currency: "GBP",
      exchangeRateToUSD: getRate('GBP', 0.79),
      region: "Europe",
      minimumSendAmount: 15,
    },
  ];
}

module.exports = { getExchangeRates };
