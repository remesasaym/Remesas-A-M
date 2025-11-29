import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../types';
import { Screen } from '../types';
import LogoIcon from './icons/LogoIcon';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { supabase } from '../supabaseClient';
import UserAvatarIcon from './icons/UserAvatarIcon';

interface HeaderProps {
  user: User;
  setActiveScreen: (screen: Screen) => void;
}

const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Header: React.FC<HeaderProps> = ({ user, setActiveScreen }) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Error during logout:', error.message);
      }
    } catch (e) {
      console.error('Unexpected error during logout:', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="py-4 px-4 md:px-8 bg-white dark:bg-gray-800 shadow-sm z-40 relative transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <LogoIcon className="h-8 w-auto text-gray-800 dark:text-white" />
          <span className="text-xl font-bold hidden sm:inline text-gray-800 dark:text-white">Remesas A&M</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-full transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-3 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full py-1.5 pl-1.5 pr-4 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              id="user-menu-button"
            >
              <UserAvatarIcon className="h-8 w-8 text-white" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden md:inline truncate max-w-[150px]">{user.fullName}</span>
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  // FIX: Added `as const` to the `ease` property to satisfy Framer Motion's strict type requirements.
                  transition={{ duration: 0.15, ease: 'easeOut' as const }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl origin-top-right z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setActiveScreen(Screen.Profile); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                      role="menuitem"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Mi Perfil</span>
                    </button>
                    {(user.email === 'pineroanthony2@gmail.com' || user.id === '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda') && (
                      <button
                        onClick={() => { setActiveScreen(Screen.Admin); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-left"
                        role="menuitem"
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span>Panel de Administración</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left"
                      role="menuitem"
                    >
                      <LogoutIcon className="h-5 w-5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
