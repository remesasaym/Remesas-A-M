import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 5173,
            host: '0.0.0.0',
        },
        plugins: [react(), tailwindcss()],
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
        }
    };
});
