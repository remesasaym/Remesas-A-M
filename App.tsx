import React, { useState, useEffect } from 'react';
import type { User } from './types';
import AuthScreen from './components/AuthScreen';
import MainApp from './components/MainApp';
import { ThemeProvider } from './contexts/ThemeContext';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';
import { supabase } from './supabaseClient';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import LogoIcon from './components/icons/LogoIcon';
import { motion } from 'framer-motion';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useSessionKeepAlive } from './hooks/useSessionKeepAlive';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep session alive
  useSessionKeepAlive();

  // Función para obtener el perfil del usuario de nuestra tabla 'profiles'
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Primer intento para obtener el perfil.
      // .single() dará error si no se encuentra ninguna fila, lo que puede ocurrir con nuevos registros
      // debido a una condición de carrera con el trigger de creación de perfiles.
      let { data, error } = await supabase
        .from('profiles')
        .select('full_name, is_verified, phone')
        .eq('id', supabaseUser.id)
        .single();

      // Si no se encontró el perfil (código de error PGRST116), esperamos un momento y reintentamos una vez.
      // Esto le da tiempo al trigger de la base de datos para crear el perfil.
      if (error && error.code === 'PGRST116') {
        console.warn("Perfil no encontrado para nuevo usuario, reintentando en 1 segundo...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        const retryResult = await supabase
          .from('profiles')
          .select('full_name, is_verified, phone')
          .eq('id', supabaseUser.id)
          .single();

        data = retryResult.data;
        error = retryResult.error;
      }

      // Si todavía hay un error (o un error del primer intento que no fue PGRST116), lo registramos.
      if (error) {
        // Registramos el mensaje de error específico para una mejor depuración.
        console.error("Error fetching profile:", error.message);
        return null;
      }

      // Si tenemos datos, construimos y devolvemos el objeto de usuario completo.
      if (data) {
        return {
          ...supabaseUser,
          fullName: data.full_name || '', // Añadimos un fallback por seguridad
          isVerified: data.is_verified || false, // Añadimos un fallback por seguridad
          phone: data.phone || '',
        };
      }

      return null;

    } catch (e) {
      const error = e as Error;
      console.error("Ocurrió un error inesperado en fetchUserProfile:", error.message);
      return null;
    }
  };

  useEffect(() => {
    let unsub: { subscription: { unsubscribe: () => void } } | null = null
      ; (async () => {
        try {
          const { data } = await supabase.auth.getSession()
          const session = data?.session || null
          if (session) {
            const fullUser = await fetchUserProfile(session.user)
            setUser(fullUser)
          } else {
            setUser(null)
          }
        } finally {
          setLoading(false)
        }
        const listener = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            const fullUser = await fetchUserProfile(session.user)
            setUser(fullUser)
          } else {
            setUser(null)
          }
        })
        unsub = listener.data || null
      })()
    return () => {
      unsub?.subscription.unsubscribe()
    }
  }, [])

  // FIX: Changed Omit<> to Pick<> for more stable type inference.
  // This resolves errors where properties on `updates` were not being recognized.
  const handleProfileUpdate = async (updates: Partial<Pick<User, 'fullName' | 'isVerified' | 'phone'>>) => {
    if (!user) return;

    // Mapea las claves de camelCase del tipo User a snake_case para la base de datos
    const dbUpdates: { [key: string]: any } = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    // No hacer nada si no hay actualizaciones para enviar
    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (!error) {
      // Actualiza el estado local para reflejar el cambio
      setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...updates };
      });
    } else {
      console.error("Error updating profile:", error);
      throw error; // Lanza el error para que el componente que llama pueda manejarlo
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:from-gray-900 dark:to-slate-800 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-6">

          {/* Animated Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            // FIX: Added `as const` to the `ease` property to satisfy Framer Motion's strict type requirements.
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
          >
            <LogoIcon className="h-32 w-auto" />
          </motion.div>

          {/* Loading Bar Container */}
          <div className="w-48 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            {/* Shimmer Effect */}
            <motion.div
              className="absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent"
              initial={{ x: '-150%' }}
              animate={{ x: '550%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                // FIX: Added `as const` to the `ease` property to satisfy Framer Motion's strict type requirements.
                ease: 'linear' as const
              }}
            />
          </div>

          {/* Loading Text */}
          <motion.p
            className="text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Conectando de forma segura...
          </motion.p>

        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ExchangeRateProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {user ? (
              <MainApp user={user} onProfileUpdate={handleProfileUpdate} />
            ) : (
              <AuthScreen />
            )}
          </div>
        </ErrorBoundary>
      </ExchangeRateProvider>
    </ThemeProvider>
  );
};

export default App;