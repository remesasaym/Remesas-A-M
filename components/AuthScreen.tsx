import React, { useState } from 'react';
import LogoIcon from './icons/LogoIcon';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { supabase } from '../supabaseClient';
import PhoneNumberInput from './common/PhoneNumberInput';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AuthScreen: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const switchView = (newView: 'login' | 'register' | 'forgotPassword') => {
    setError(null);
    setAuthMessage(null);
    setPassword('');
    setView(newView);
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthMessage(null);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setError(error.message);
      } else {
        toast.success('¡Bienvenido de nuevo!');
      }
    } else if (view === 'register') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setError(signUpError.message);
      } else if (signUpData.user) {
        const successMsg = "¡Registro exitoso! Revisa tu correo electrónico para completar la verificación.";
        toast.success(successMsg);
        setAuthMessage(successMsg);
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
      }
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    if (resetError) {
      toast.error(resetError.message);
      setError(resetError.message);
    } else {
      const msg = 'Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.';
      toast.success(msg);
      setAuthMessage(msg);
    }
    setLoading(false);
  }

  const renderTitle = () => {
    switch (view) {
      case 'login': return 'Bienvenido de Nuevo';
      case 'register': return 'Crea tu Cuenta';
      case 'forgotPassword': return 'Restablecer Contraseña';
    }
  };

  const renderSubtitle = () => {
    switch (view) {
      case 'forgotPassword': return 'Te enviaremos un enlace para que recuperes tu cuenta.';
      default: return 'Tu portal de finanzas globales.';
    }
  }

  const renderFormContent = () => {
    if (view === 'forgotPassword') {
      return (
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
            variant="default"
          />
          <Button
            type="submit"
            isLoading={loading}
            className="w-full"
            variant="primary"
          >
            Enviar Enlace de Recuperación
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={handleAuth} className="space-y-6">
        {view === 'register' && (
          <>
            <Input
              label="Nombre Completo"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              required
              variant="default"
            />
            <PhoneNumberInput
              id="phone"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              label="Número de Teléfono (Opcional)"
            />
          </>
        )}

        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
          required
          variant="default"
        />

        <div className="space-y-2">
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={view === 'register' ? 'new-password' : 'current-password'}
            required
            variant="default"
          />

          {view === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchView('forgotPassword')}
                className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </div>

        {view === 'login' && (
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded transition-colors"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-300">
              Recordar sesión
            </label>
          </div>
        )}

        <Button
          type="submit"
          isLoading={loading}
          className="w-full py-4 text-lg shadow-lg shadow-primary/20"
          variant="primary"
        >
          {view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </Button>

        <AnimatePresence>
          {loading && view === 'login' && (
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: ['0%', '75%', '0%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear' as const
              }}
              className="h-1 bg-primary rounded-full mt-4 mx-auto w-1/2 opacity-50"
            />
          )}
        </AnimatePresence>

      </form>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <Card variant="glass" padding="lg" className="w-full max-w-md relative z-10 border-white/40 dark:border-white/5 shadow-2xl shadow-indigo-500/10 dark:shadow-black/40">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <LogoIcon className="h-32 w-auto mx-auto drop-shadow-md" />
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-6 tracking-tight">{renderTitle()}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{renderSubtitle()}</p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center p-3 rounded-xl mb-6 border border-red-100 dark:border-red-900/30 font-medium"
            >
              {error}
            </motion.div>
          )}
          {authMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm text-center p-3 rounded-xl mb-6 border border-green-100 dark:border-green-900/30 font-medium"
            >
              {authMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderFormContent()}
        </motion.div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {view === 'login' && <span>¿No tienes cuenta?</span>}
            {view === 'register' && <span>¿Ya tienes una cuenta?</span>}
            {view === 'forgotPassword' && <span>¿Recordaste tu contraseña?</span>}
            <button
              onClick={() => switchView(view === 'login' ? 'register' : 'login')}
              className="ml-2 font-bold text-primary hover:text-primary-dark transition-colors"
            >
              {view === 'login' && <span>Regístrate</span>}
              {view === 'register' && <span>Inicia Sesión</span>}
              {view === 'forgotPassword' && <span>Volver a Iniciar Sesión</span>}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthScreen;