// components/__tests__/AuthScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import AuthScreen from '../AuthScreen';

// Mock de supabase
vi.mock('../../supabaseClient', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
        },
    },
}));

describe('AuthScreen', () => {
    it('renders login form by default', () => {
        render(<AuthScreen />);

        expect(screen.getByText(/Iniciar Sesión/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
    });

    it('switches to register form when clicking register tab', () => {
        render(<AuthScreen />);

        const registerTab = screen.getByText(/Registrarse/i);
        fireEvent.click(registerTab);

        expect(screen.getByPlaceholderText(/nombre completo/i)).toBeInTheDocument();
    });

    it('validates email format', async () => {
        render(<AuthScreen />);

        const emailInput = screen.getByPlaceholderText(/correo/i);
        const submitButton = screen.getByRole('button', { name: /entrar/i });

        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/correo.*válido/i)).toBeInTheDocument();
        });
    });

    it('validates password length', async () => {
        render(<AuthScreen />);

        const passwordInput = screen.getByPlaceholderText(/contraseña/i);
        const submitButton = screen.getByRole('button', { name: /entrar/i });

        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/6 caracteres/i)).toBeInTheDocument();
        });
    });
});
