// KYC Service - Persona Integration
// Docs: https://docs.withpersona.com/

interface PersonaConfig {
    apiKey: string;
    templateId: string;
    environment: 'sandbox' | 'production';
    baseUrl: string;
}

interface KYCVerificationRequest {
    userId: string;
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
}

interface KYCVerificationResponse {
    success: boolean;
    sessionToken?: string;
    inquiryId?: string;
    status?: 'pending' | 'approved' | 'declined';
    error?: string;
}

interface KYCStatusResponse {
    status: 'pending' | 'approved' | 'declined' | 'reviewing';
    inquiryId: string;
    fields?: Record<string, any>;
    createdAt?: string;
    completedAt?: string;
}

class KYCService {
    private config: PersonaConfig;

    constructor() {
        this.config = {
            apiKey: process.env.PERSONA_API_KEY || '',
            templateId: process.env.PERSONA_TEMPLATE_ID || 'itmpl_test',
            environment: (process.env.PERSONA_ENV as 'sandbox' | 'production') || 'sandbox',
            baseUrl: 'https://withpersona.com/api/v1',
        };
    }

    /**
     * Crea una sesión de verificación para el usuario
     * El usuario completará la verificación en el frontend usando Persona SDK
     */
    async createVerificationSession(request: KYCVerificationRequest): Promise<KYCVerificationResponse> {
        try {
            if (!this.config.apiKey) {
                console.warn('⚠️ Persona API key not configured. Using mock response.');
                return {
                    success: true,
                    sessionToken: 'mock-session-token',
                    inquiryId: `inq-mock-${request.userId}`,
                    status: 'pending',
                };
            }

            // Crear inquiry en Persona
            const response = await this.callPersonaAPI('/inquiries', 'POST', {
                data: {
                    type: 'inquiry',
                    attributes: {
                        'inquiry-template-id': this.config.templateId,
                        'reference-id': request.userId,
                        'name-first': request.firstName,
                        'name-last': request.lastName,
                        'email-address': request.email,
                        'phone-number': request.phone,
                    },
                },
            });

            return {
                success: true,
                sessionToken: response.data.attributes['session-token'],
                inquiryId: response.data.id,
                status: 'pending',
            };
        } catch (error) {
            console.error('❌ Error creating verification session:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Consulta el estado de una verificación
     */
    async getVerificationStatus(inquiryId: string): Promise<KYCStatusResponse> {
        try {
            if (!this.config.apiKey) {
                console.warn('⚠️ Persona API key not configured. Using mock response.');
                return {
                    status: 'approved',
                    inquiryId,
                    createdAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                };
            }

            const response = await this.callPersonaAPI(`/inquiries/${inquiryId}`, 'GET');

            return {
                status: this.mapPersonaStatus(response.data.attributes.status),
                inquiryId: response.data.id,
                fields: response.data.attributes.fields,
                createdAt: response.data.attributes['created-at'],
                completedAt: response.data.attributes['completed-at'],
            };
        } catch (error) {
            console.error('❌ Error getting verification status:', error);
            throw error;
        }
    }

    /**
     * Webhook handler para recibir actualizaciones de Persona
     */
    async handleWebhook(payload: any): Promise<void> {
        try {
            console.log('📥 Received Persona webhook:', payload);

            const { data } = payload;
            const inquiryId = data.id;
            const status = data.attributes.status;
            const referenceId = data.attributes['reference-id']; // userId

            // Aquí actualizarías tu base de datos (Supabase)
            // await supabase.from('profiles').update({
            //   kyc_status: this.mapPersonaStatus(status),
            //   kyc_inquiry_id: inquiryId,
            //   is_verified: status === 'approved',
            //   kyc_completed_at: data.attributes['completed-at']
            // }).eq('id', referenceId);

            console.log(`✅ Updated KYC status for user ${referenceId}: ${status}`);
        } catch (error) {
            console.error('❌ Error handling Persona webhook:', error);
            throw error;
        }
    }

    /**
     * Helper para llamar a la API de Persona
     */
    private async callPersonaAPI(endpoint: string, method: string, body?: any): Promise<any> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Persona-Version': '2023-01-05',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Persona API error: ${response.status} - ${errorData.errors?.[0]?.title || response.statusText}`);
        }

        return response.json();
    }

    /**
     * Mapea estados de Persona a nuestros estados internos
     */
    private mapPersonaStatus(personaStatus: string): 'pending' | 'approved' | 'declined' | 'reviewing' {
        const statusMap: Record<string, 'pending' | 'approved' | 'declined' | 'reviewing'> = {
            'created': 'pending',
            'pending': 'reviewing',
            'completed': 'reviewing',
            'approved': 'approved',
            'declined': 'declined',
            'expired': 'declined',
            'failed': 'declined',
        };

        return statusMap[personaStatus] || 'pending';
    }

    /**
     * Genera el código HTML para el widget de Persona (frontend)
     */
    getEmbedCode(sessionToken: string): string {
        return `
      <div id="persona-inquiry"></div>
      <script src="https://cdn.withpersona.com/dist/persona-v4.9.0.js"></script>
      <script>
        const client = new Persona.Client({
          templateId: '${this.config.templateId}',
          environmentId: '${this.config.environment === 'sandbox' ? 'env_sandbox' : 'env_production'}',
          sessionToken: '${sessionToken}',
          onReady: () => client.open(),
          onComplete: ({ inquiryId, status, fields }) => {
            console.log('Verification completed:', inquiryId, status);
            // Notificar a tu backend que la verificación se completó
            fetch('/api/kyc/verification-completed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inquiryId, status })
            });
          },
          onCancel: ({ inquiryId, sessionToken }) => {
            console.log('Verification cancelled');
          },
          onError: (error) => {
            console.error('Verification error:', error);
          }
        });
      </script>
    `;
    }
}

export const kycService = new KYCService();
export type { KYCVerificationRequest, KYCVerificationResponse, KYCStatusResponse };
