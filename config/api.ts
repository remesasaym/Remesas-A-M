// src/config/api.ts
/**
 * Configuración centralizada de URLs de API
 * Usar variables de entorno para diferentes ambientes
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
        REMITTANCES: '/api/remittances',
        KYC: '/api/kyc',
        UPLOAD: '/api/upload',
        EXCHANGE: '/api/exchange',
        ADMIN: '/api/admin',
        ASSISTANT: '/api/assistant',
    },
    TIMEOUT: 30000, // 30 segundos
};

/**
 * Helper para construir URLs completas
 */
export const getApiUrl = (endpoint: string): string => {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper para hacer requests con autenticación
 */
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<Response> => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
    });

    return response;
};
