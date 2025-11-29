import React, { useState } from 'react';
import LogoIcon from './icons/LogoIcon';
import Card from './common/Card';
import { supabase } from '../supabaseClient';
import PhoneNumberInput from './common/PhoneNumberInput';
import Spinner from './common/Spinner';
import { motion, AnimatePresence } from 'framer-motion';

const AuthScreen: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false); // Nuevo estado para "Recordar sesión"

  const switchView = (newView: 'login' | 'register' | 'forgotPassword') => {
    setError(null);
    setAuthMessage(null);
    setPassword(''); // Limpiar contraseña al cambiar de vista
    setView(newView);
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthMessage(null);

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else if (view === 'register') {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (signUpData.user) {
        const successMsg = "¡Registro exitoso! Revisa tu correo electrónico para completar la verificación.";
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
      setError(resetError.message);
    } else {
      setAuthMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
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
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-3 px-4 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors duration-300 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50 disabled:cursor-wait"
            >
              {loading ? <Spinner className="w-5 h-5" /> : 'Enviar Enlace de Recuperación'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleAuth} className="space-y-6">
        {view === 'register' && (
           <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 dark:text-gray-300">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-3 px-4 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Número de Teléfono <span className="text-gray-400">(Opcional)</span>
                  </label>
                  <PhoneNumberInput 
                    value={phone} 
                    onChange={setPhone}
                  />
              </div>
           </>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            Correo Electrónico
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-3 px-4 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="tu@email.com"
            required
          />
        </div>
        <div>
           <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300">
              Contraseña
            </label>
             {view === 'login' && (
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => switchView('forgotPassword')}
                    className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
          </div>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-md shadow-sm py-3 px-4 text-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="••••••••"
            required
          />
        </div>

        {view === 'login' && (
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-indigo-600 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 dark:text-gray-300">
              Recordar sesión
            </label>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors duration-300 disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50 disabled:cursor-wait"
          >
            {loading && view === 'login' ? (
              <>
                <Spinner className="w-5 h-5 mr-3" />
                <span>Verificando credenciales...</span>
              </>
            ) : loading ? (
              <>
                <Spinner className="w-5 h-5 mr-3" />
                <span>{view === 'login' ? 'Iniciando...' : 'Creando...'}</span>
              </>
            ) : view === 'login' ? (
              'Iniciar Sesión'
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </div>

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
              className="h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-2"
            />
          )}
        </AnimatePresence>

      </form>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 via-indigo-200/50 to-gray-100 dark:from-gray-900 dark:via-purple-900/50 dark:to-gray-900">
      <Card className="w-full max-w-md dark:bg-slate-900">
        <div className="text-center mb-8">
          <LogoIcon className="h-16 w-auto mx-auto" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{renderTitle()}</h1>
          <p className="text-gray-500 dark:text-gray-400">{renderSubtitle()}</p>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {authMessage && <p className="text-green-600 dark:text-green-400 text-sm text-center mb-4">{authMessage}</p>}
        
        {renderFormContent()}
        
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {view === 'login' && '¿No tienes cuenta?'}
          {view === 'register' && '¿Ya tienes una cuenta?'}
          {view === 'forgotPassword' && '¿Recordaste tu contraseña?'}
          <button 
            onClick={() => switchView(view === 'login' ? 'register' : 'login')}
            className="ml-1 font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
          >
            {view === 'login' && 'Regístrate'}
            {view === 'register' && 'Inicia Sesión'}
            {view === 'forgotPassword' && 'Volver a Iniciar Sesión'}
          </button>
        </p>
      </Card>
    </div>
  );
};

export default AuthScreen;