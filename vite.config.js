import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 5173,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['logo-final.png', 'brand-logo.png'],
                manifest: {
                    name: 'Remesas A&M - Envíos Rápidos',
                    short_name: 'Remesas A&M',
                    description: 'Envía dinero a Latinoamérica de forma rápida, segura y con las mejores tasas.',
                    theme_color: '#ffffff',
                    background_color: '#ffffff',
                    display: 'standalone',
                    orientation: 'portrait',
                    icons: [
                        {
                            src: 'logo-final.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'logo-final.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'logo-final.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                }
            })
        ],
        define: {
            'process.env.USE_BACKEND_IA': JSON.stringify(env.USE_BACKEND_IA || 'false'),
            'process.env.USE_BACKEND_ADMIN': JSON.stringify(env.USE_BACKEND_ADMIN || 'false'),
            'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
            'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || ''),
            'process.env.ADMIN_EMAIL': JSON.stringify(env.ADMIN_EMAIL || ''),
            'process.env.ADMIN_UID': JSON.stringify(env.ADMIN_UID || '')
        },
        resolve: {
            preserveSymlinks: true,
            alias: {
                '@': path.resolve(process.cwd(), '.'),
            }
        },
        build: {
            chunkSizeWarningLimit: 1600,
        }
    };
});
