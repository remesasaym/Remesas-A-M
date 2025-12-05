import type { Country } from './types';

export const COUNTRIES: Country[] = [
  // Latinoamérica
  { name: 'Argentina', code: 'AR', dialCode: '+54', banks: [{ name: 'Banco Nación', type: 'National' }, { name: 'Galicia', type: 'National' }, { name: 'BBVA Argentina', type: 'National' }, { name: 'Mercado Pago', type: 'National' }], currency: 'ARS', exchangeRateToUSD: 1250.00, region: 'LatAm', minimumSendAmount: 4000 },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', banks: [], currency: 'BOB', exchangeRateToUSD: 6.91, region: 'LatAm', minimumSendAmount: 50 },
  { name: 'Brasil', code: 'BR', dialCode: '+55', banks: [{ name: 'Banco do Brasil', type: 'National' }, { name: 'Itaú', type: 'National' }, { name: 'Bradesco', type: 'National' }, { name: 'Nubank', type: 'National' }, { name: 'Pix', type: 'National' }], currency: 'BRL', exchangeRateToUSD: 5.40, region: 'LatAm', minimumSendAmount: 50 },
  { name: 'Chile', code: 'CL', dialCode: '+56', banks: [{ name: 'Banco de Chile', type: 'National' }, { name: 'BancoEstado', type: 'National' }, { name: 'Santander Chile', type: 'National' }], currency: 'CLP', exchangeRateToUSD: 940.00, region: 'LatAm', minimumSendAmount: 4000 },
  { name: 'Colombia', code: 'CO', dialCode: '+57', banks: [{ name: 'Bancolombia', type: 'National' }, { name: 'Davivienda', type: 'National' }, { name: 'Nequi', type: 'National' }, { name: 'Daviplata', type: 'National' }, { name: 'Banco de Bogotá', type: 'National' }], currency: 'COP', exchangeRateToUSD: 3950.00, region: 'LatAm', minimumSendAmount: 25000 },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', banks: [], currency: 'CRC', exchangeRateToUSD: 525.00, region: 'LatAm', minimumSendAmount: 5000 },
  { name: 'Cuba', code: 'CU', dialCode: '+53', banks: [], currency: 'CUP', exchangeRateToUSD: 24.00, region: 'LatAm', minimumSendAmount: 500 },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', banks: [{ name: 'Pichincha', type: 'National' }, { name: 'Guayaquil', 'type': 'National' }, { name: 'Produbanco', type: 'National' }, { name: 'Banco Bolivariano', type: 'National' }], currency: 'USD', exchangeRateToUSD: 1.00, region: 'LatAm', minimumSendAmount: 20 },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', banks: [], currency: 'USD', exchangeRateToUSD: 1.00, region: 'LatAm', minimumSendAmount: 20 },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', banks: [], currency: 'GTQ', exchangeRateToUSD: 7.78, region: 'LatAm', minimumSendAmount: 100 },
  { name: 'Honduras', code: 'HN', dialCode: '+504', banks: [], currency: 'HNL', exchangeRateToUSD: 24.70, region: 'LatAm', minimumSendAmount: 300 },
  { name: 'México', code: 'MX', dialCode: '+52', banks: [{ name: 'BBVA México', type: 'National' }, { name: 'Santander México', type: 'National' }, { name: 'Banorte', type: 'National' }, { name: 'HSBC México', type: 'National' }, { name: 'Citibanamex', type: 'National' }], currency: 'MXN', exchangeRateToUSD: 17.15, region: 'LatAm', minimumSendAmount: 80 },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', banks: [], currency: 'NIO', exchangeRateToUSD: 36.60, region: 'LatAm', minimumSendAmount: 400 },
  { name: 'Panamá', code: 'PA', dialCode: '+507', banks: [], currency: 'USD', exchangeRateToUSD: 1.00, region: 'LatAm', minimumSendAmount: 20 },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', banks: [], currency: 'PYG', exchangeRateToUSD: 7250.00, region: 'LatAm', minimumSendAmount: 50000 },
  { name: 'Perú', code: 'PE', dialCode: '+51', banks: [{ name: 'BCP', type: 'National' }, { name: 'Interbank', type: 'National' }, { name: 'Scotiabank', type: 'National' }, { name: 'BBVA Perú', type: 'National' }, { name: 'Yape', type: 'National' }, { name: 'Plin', type: 'National' }], currency: 'PEN', exchangeRateToUSD: 3.75, region: 'LatAm', minimumSendAmount: 25 },
  { name: 'República Dominicana', code: 'DO', dialCode: '+1', banks: [], currency: 'DOP', exchangeRateToUSD: 59.00, region: 'LatAm', minimumSendAmount: 500 },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', banks: [], currency: 'UYU', exchangeRateToUSD: 39.50, region: 'LatAm', minimumSendAmount: 500 },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', banks: [{ name: 'Mercantil', type: 'National' }, { name: 'Banesco', type: 'National' }, { name: 'Banco de Venezuela', type: 'National' }, { name: 'Provincial', type: 'National' }, { name: 'Pago Móvil', type: 'National' }], currency: 'VES', exchangeRateToUSD: 36.50, region: 'LatAm', minimumSendAmount: 500 },
  // Norteamérica
  { name: 'Canadá', code: 'CA', dialCode: '+1', banks: [], currency: 'CAD', exchangeRateToUSD: 1.37, region: 'North America', minimumSendAmount: 25 },
  { name: 'EE.UU.', code: 'US', dialCode: '+1', banks: [{ name: 'Bank of America', type: 'International' }, { name: 'Chase', type: 'International' }, { name: 'Wells Fargo', type: 'International' }, { name: 'Citibank', type: 'International' }, { name: 'Zelle', type: 'International' }], currency: 'USD', exchangeRateToUSD: 1.00, region: 'North America', minimumSendAmount: 20 },
  // Europa
  { name: 'Alemania', code: 'DE', dialCode: '+49', banks: [{ name: 'Deutsche Bank', type: 'International' }, { name: 'Commerzbank', type: 'International' }, { name: 'SEPA Transfer', type: 'International' }, { name: 'N26', type: 'International' }, { name: 'Revolut', type: 'International' }], currency: 'EUR', exchangeRateToUSD: 0.92, region: 'Europe', minimumSendAmount: 20 },
  { name: 'España', code: 'ES', dialCode: '+34', banks: [{ name: 'SEPA Transfer', type: 'International' }, { name: 'Revolut', type: 'International' }, { name: 'Wise', type: 'International' }], currency: 'EUR', exchangeRateToUSD: 0.92, region: 'Europe', minimumSendAmount: 20 },
  { name: 'Francia', code: 'FR', dialCode: '+33', banks: [{ name: 'BNP Paribas', type: 'International' }, { name: 'Crédit Agricole', type: 'International' }, { name: 'SEPA Transfer', type: 'International' }, { name: 'Revolut', type: 'International' }, { name: 'Wise', type: 'International' }], currency: 'EUR', exchangeRateToUSD: 0.92, region: 'Europe', minimumSendAmount: 20 },
  { name: 'Italia', code: 'IT', dialCode: '+39', banks: [{ name: 'Intesa Sanpaolo', type: 'International' }, { name: 'UniCredit', type: 'International' }, { name: 'SEPA Transfer', type: 'International' }, { name: 'Revolut', type: 'International' }], currency: 'EUR', exchangeRateToUSD: 0.92, region: 'Europe', minimumSendAmount: 20 },
  { name: 'Portugal', code: 'PT', dialCode: '+351', banks: [{ name: 'Caixa Geral de Depósitos', type: 'International' }, { name: 'Millennium BCP', type: 'International' }, { name: 'SEPA Transfer', type: 'International' }, { name: 'Revolut', type: 'International' }], currency: 'EUR', exchangeRateToUSD: 0.92, region: 'Europe', minimumSendAmount: 20 },
  { name: 'Reino Unido', code: 'GB', dialCode: '+44', banks: [{ name: 'Barclays', type: 'International' }, { name: 'HSBC UK', type: 'International' }, { name: 'Lloyds Bank', type: 'International' }, { name: 'Revolut', type: 'International' }, { name: 'Wise', type: 'International' }], currency: 'GBP', exchangeRateToUSD: 0.79, region: 'Europe', minimumSendAmount: 15 },
];

// ===== NUEVO MODELO DE COMISIONES (Híbrido) =====
// Comisión base sobre el monto enviado
export const REMITTANCE_FEE_PERCENTAGE = 0.025; // 2.5% (bajado de 9%)

// Spread aplicado sobre la tasa de cambio FX
export const FX_SPREAD_PERCENTAGE = 0.005; // 0.5%

// Ganancia total aproximada: 2.5% + 0.5% = ~3% (vs 9% anterior)
// Esto nos hace competitivos con Remitly (2-4%) y WorldRemit (3-5%)

// Otras comisiones
export const PAYPAL_FEE_PERCENTAGE = 0.06; // 6% para PayPal

export const WORLDCOIN_MINIMUM_EXCHANGE = 3; // Mínimo 3 WLD
export const WORLDCOIN_FEE_PERCENTAGE = 0.03; // 3% para WLD

export const USDC_MINIMUM_EXCHANGE = 10; // Mínimo 10 USDC
export const USDC_FEE_PERCENTAGE = 0.02; // 2% para USDC (más bajo que antes)