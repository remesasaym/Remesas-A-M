// Payment Corridor Service - Thunes Integration
// Docs: https://developers.thunes.com/

interface ThunesConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
    environment: 'sandbox' | 'production';
}

interface RemittanceRequest {
    senderId: string;
    senderName: string;
    senderCountry: string;
    recipientName: string;
    recipientCountry: string;
    recipientBank?: string;
    recipientAccountNumber?: string;
    recipientPhone?: string;
    amount: number;
    currency: string;
    purpose?: string;
}

interface RemittanceResponse {
    success: boolean;
    transactionId?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    estimatedDelivery?: string;
    exchangeRate?: number;
    fees?: number;
    totalAmount?: number;
    error?: string;
}

interface TransactionStatusResponse {
    transactionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    statusMessage?: string;
    completedAt?: string;
    failureReason?: string;
}

interface PayoutMethod {
    id: string;
    name: string;
    type: 'bank_transfer' | 'mobile_money' | 'cash_pickup' | 'wallet';
    currency: string;
    country: string;
    minAmount: number;
    maxAmount: number;
    estimatedTime: string;
    fee: number;
}

class PaymentCorridorService {
    private config: ThunesConfig;

    constructor() {
        this.config = {
            apiKey: process.env.THUNES_API_KEY || '',
            apiSecret: process.env.THUNES_API_SECRET || '',
            baseUrl: process.env.THUNES_BASE_URL || 'https://api-sandbox.thunes.com',
            environment: (process.env.THUNES_ENV as 'sandbox' | 'production') || 'sandbox',
        };
    }

    /**
     * Envía una remesa a través de Thunes
     */
    async sendRemittance(request: RemittanceRequest): Promise<RemittanceResponse> {
        try {
            if (!this.config.apiKey || !this.config.apiSecret) {
                console.warn('⚠️ Thunes credentials not configured. Using mock response.');
                return this.mockRemittanceResponse(request);
            }

            // Aquí iría la implementación real:
            // 1. Validar corredor disponible
            // 2. Crear transacción en Thunes
            // 3. Procesar pago

            const response = await this.callThunesAPI('/v2/transactions', 'POST', {
                external_id: `txn-${Date.now()}`,
                sender: {
                    id: request.senderId,
                    name: request.senderName,
                    country: request.senderCountry,
                },
                beneficiary: {
                    name: request.recipientName,
                    country: request.recipientCountry,
                    bank_account: request.recipientAccountNumber,
                    bank_code: request.recipientBank,
                    phone: request.recipientPhone,
                },
                transaction: {
                    send_amount: request.amount,
                    send_currency: request.currency,
                    purpose: request.purpose || 'family_support',
                },
            });

            return {
                success: true,
                transactionId: response.id,
                status: this.mapThunesStatus(response.status),
                estimatedDelivery: response.estimated_delivery_time,
                exchangeRate: response.exchange_rate,
                fees: response.fees,
                totalAmount: response.total_amount,
            };
        } catch (error) {
            console.error('❌ Error sending remittance:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Consulta el estado de una transacción
     */
    async getTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
        try {
            if (!this.config.apiKey || !this.config.apiSecret) {
                console.warn('⚠️ Thunes credentials not configured. Using mock response.');
                return {
                    transactionId,
                    status: 'completed',
                    statusMessage: 'Transaction completed successfully (mock)',
                    completedAt: new Date().toISOString(),
                };
            }

            const response = await this.callThunesAPI(`/v2/transactions/${transactionId}`, 'GET');

            return {
                transactionId: response.id,
                status: this.mapThunesStatus(response.status),
                statusMessage: response.status_message,
                completedAt: response.completed_at,
                failureReason: response.failure_reason,
            };
        } catch (error) {
            console.error('❌ Error getting transaction status:', error);
            throw error;
        }
    }

    /**
     * Obtiene métodos de pago disponibles para un corredor
     */
    async getAvailablePayoutMethods(
        sourceCountry: string,
        destinationCountry: string,
        currency: string
    ): Promise<PayoutMethod[]> {
        try {
            if (!this.config.apiKey || !this.config.apiSecret) {
                console.warn('⚠️ Thunes credentials not configured. Using mock response.');
                return this.mockPayoutMethods(destinationCountry);
            }

            const response = await this.callThunesAPI(
                `/v2/payout-methods?source_country=${sourceCountry}&destination_country=${destinationCountry}&currency=${currency}`,
                'GET'
            );

            return response.payout_methods.map((method: any) => ({
                id: method.id,
                name: method.name,
                type: method.type,
                currency: method.currency,
                country: method.country,
                minAmount: method.min_amount,
                maxAmount: method.max_amount,
                estimatedTime: method.estimated_time,
                fee: method.fee,
            }));
        } catch (error) {
            console.error('❌ Error getting payout methods:', error);
            return [];
        }
    }

    /**
     * Webhook handler para recibir actualizaciones de Thunes
     */
    async handleWebhook(payload: any, signature: string): Promise<void> {
        try {
            // TODO: Verificar firma del webhook
            // TODO: Actualizar estado en base de datos

            console.log('📥 Received payment webhook:', payload);

            const { transaction_id, status, completed_at } = payload;

            // Aquí actualizarías tu base de datos (Supabase)
            // await supabase.from('transactions').update({
            //   status: this.mapThunesStatus(status),
            //   completed_at,
            //   updated_at: new Date().toISOString()
            // }).eq('external_id', transaction_id);

        } catch (error) {
            console.error('❌ Error handling payment webhook:', error);
            throw error;
        }
    }

    /**
     * Helper para llamar a la API de Thunes con autenticación
     */
    private async callThunesAPI(endpoint: string, method: string, body?: any): Promise<any> {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Generar autenticación Basic
        const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
                'X-Thunes-Environment': this.config.environment,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Thunes API error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Mapea estados de Thunes a nuestros estados internos
     */
    private mapThunesStatus(thunesStatus: string): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
        const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'> = {
            'pending': 'pending',
            'processing': 'processing',
            'in_progress': 'processing',
            'completed': 'completed',
            'success': 'completed',
            'failed': 'failed',
            'error': 'failed',
            'cancelled': 'cancelled',
            'rejected': 'failed',
        };

        return statusMap[thunesStatus.toLowerCase()] || 'pending';
    }

    /**
     * Mock response para desarrollo sin credenciales
     */
    private mockRemittanceResponse(request: RemittanceRequest): RemittanceResponse {
        return {
            success: true,
            transactionId: `mock-txn-${Date.now()}`,
            status: 'completed',
            estimatedDelivery: 'Instantáneo',
            exchangeRate: 36.5,
            fees: request.amount * 0.025,
            totalAmount: request.amount * 1.025,
        };
    }

    /**
     * Mock payout methods para desarrollo
     */
    private mockPayoutMethods(country: string): PayoutMethod[] {
        const methods: PayoutMethod[] = [
            {
                id: 'bank-transfer',
                name: 'Transferencia Bancaria',
                type: 'bank_transfer',
                currency: 'USD',
                country,
                minAmount: 10,
                maxAmount: 10000,
                estimatedTime: 'Instantáneo',
                fee: 0,
            },
        ];

        // Agregar mobile money para países específicos
        if (['VE', 'CO', 'PE'].includes(country)) {
            methods.push({
                id: 'mobile-money',
                name: 'Billetera Móvil',
                type: 'mobile_money',
                currency: 'USD',
                country,
                minAmount: 5,
                maxAmount: 5000,
                estimatedTime: 'Instantáneo',
                fee: 0,
            });
        }

        return methods;
    }
}

export const paymentCorridorService = new PaymentCorridorService();
export type { RemittanceRequest, RemittanceResponse, TransactionStatusResponse, PayoutMethod };
