// components/__tests__/Calculator.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import Calculator from '../Calculator';
import { Screen } from '../../types';

const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    isVerified: true,
};

const mockSetActiveScreen = vi.fn();
const mockOnClearPrefill = vi.fn();

describe('Calculator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders calculator with default countries', () => {
        render(
            <Calculator
                user={mockUser}
                setActiveScreen={mockSetActiveScreen}
                prefillData={null}
                onClearPrefill={mockOnClearPrefill}
            />
        );

        expect(screen.getByText(/Enviar Remesa/i)).toBeInTheDocument();
        expect(screen.getByText(/Tú envías/i)).toBeInTheDocument();
    });

    it('calculates fee correctly', () => {
        render(
            <Calculator
                user={mockUser}
                setActiveScreen={mockSetActiveScreen}
                prefillData={null}
                onClearPrefill={mockOnClearPrefill}
            />
        );

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });

        // Comisión 2.5% de 100 = 2.50
        expect(screen.getByText(/2\.50/)).toBeInTheDocument();
    });

    it('validates minimum amount', async () => {
        render(
            <Calculator
                user={mockUser}
                setActiveScreen={mockSetActiveScreen}
                prefillData={null}
                onClearPrefill={mockOnClearPrefill}
            />
        );

        const amountInput = screen.getByPlaceholderText('0.00');
        const continueButton = screen.getByText(/Continuar con el Envío/i);

        fireEvent.change(amountInput, { target: { value: '5' } });
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText(/Monto inválido/i)).toBeInTheDocument();
        });
    });

    it('shows exchange rate calculation', () => {
        render(
            <Calculator
                user={mockUser}
                setActiveScreen={mockSetActiveScreen}
                prefillData={null}
                onClearPrefill={mockOnClearPrefill}
            />
        );

        const amountInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(amountInput, { target: { value: '100' } });

        expect(screen.getByText(/Tasa de cambio:/i)).toBeInTheDocument();
        expect(screen.getByText(/Receptor recibe:/i)).toBeInTheDocument();
    });
});
