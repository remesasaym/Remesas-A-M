// backend/__tests__/remittances.test.js
const request = require('supertest');
const express = require('express');

// Mock de supabase ANTES de importar las rutas
jest.mock('../supabaseClient', () => {
    const mockSupabase = {
        from: jest.fn(() => ({
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: {
                            id: 'test-transaction-id',
                            transaction_id: 'TXN-TEST-123',
                            status: 'PENDIENTE',
                            amount: 100,
                            fee: 2.5
                        },
                        error: null
                    }))
                }))
            })),
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    order: jest.fn(() => ({
                        limit: jest.fn(() => Promise.resolve({
                            data: [{
                                id: 'test-transaction-id',
                                status: 'PENDIENTE',
                                amount: 100
                            }],
                            error: null
                        }))
                    }))
                }))
            }))
        })),
        auth: {
            getUser: jest.fn(() => Promise.resolve({
                data: { user: { id: 'test-user-id' } },
                error: null
            }))
        }
    };

    return {
        supabase: mockSupabase,
        createClient: jest.fn(() => mockSupabase)
    };
});

// Mock de encryption service
jest.mock('../services/encryptionService', () => ({
    encrypt: jest.fn((text) => `encrypted_${text}`),
    decrypt: jest.fn((text) => text.replace('encrypted_', ''))
}));

// Mock de logger (pino)
jest.mock('pino', () => {
    return jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    }));
});

// Importar rutas DESPUÉS de los mocks
const remittanceRoutes = require('../routes/remittances');

// Setup de app de prueba
const app = express();
app.use(express.json());
app.use('/api/remittances', remittanceRoutes);

describe('Remittances API', () => {
    describe('POST /api/remittances/send', () => {
        it('should create a new remittance', async () => {
            const remittanceData = {
                userId: 'test-user-id',
                fromCountry: 'US',
                toCountry: 'VE',
                amount: 100,
                recipientAmount: 3650,
                fee: 2.5,
                exchangeRate: 36.5,
                beneficiary: {
                    fullName: 'John Doe',
                    accountNumber: '1234567890',
                    bankName: 'Test Bank',
                    documentNumber: '12345678'
                }
            };

            const response = await request(app)
                .post('/api/remittances/send')
                .send(remittanceData)
                .expect(200);

            expect(response.body).toHaveProperty('transactionId');
            expect(response.body.status).toBe('PENDIENTE');
        });

        it('should validate required fields', async () => {
            const invalidData = {
                userId: 'test-user-id',
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/remittances/send')
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate minimum amount', async () => {
            const invalidData = {
                userId: 'test-user-id',
                fromCountry: 'US',
                toCountry: 'VE',
                amount: 5, // Menos del mínimo (10)
                recipientAmount: 182.5,
                fee: 0.125,
                exchangeRate: 36.5,
                beneficiary: {
                    fullName: 'John Doe',
                    accountNumber: '1234567890',
                    bankName: 'Test Bank',
                    documentNumber: '12345678'
                }
            };

            const response = await request(app)
                .post('/api/remittances/send')
                .send(invalidData)
                .expect(400);

            expect(response.body.error).toMatch(/mínimo/i);
        });
    });

    describe('GET /api/remittances/history/:userId', () => {
        it('should return user transaction history', async () => {
            const response = await request(app)
                .get('/api/remittances/history/test-user-id')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('status');
        });
    });
});
