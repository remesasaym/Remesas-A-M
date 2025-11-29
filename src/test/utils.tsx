// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ExchangeRateProvider } from '../contexts/ExchangeRateContext';

// Wrapper con todos los providers necesarios
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider>
            <ExchangeRateProvider>
                {children}
            </ExchangeRateProvider>
        </ThemeProvider>
    );
};

// Custom render que incluye providers
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
