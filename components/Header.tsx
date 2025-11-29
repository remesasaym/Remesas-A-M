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
    <motion.header
      className="fixed top-0 left-0 right-0 py-4 px-4 md:px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-border/50 dark:border-gray-700/50 z-50 transition-colors duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <LogoIcon className="h-8 w-auto text-gray-800 dark:text-white" />
          <span className="text-xl font-bold hidden sm:inline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Remesas A&M
          </span>
        </motion.div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            className="bg-bg-secondary dark:bg-gray-700 text-text-secondary dark:text-gray-300 hover:bg-bg-tertiary dark:hover:bg-gray-600 p-2.5 rounded-full transition-colors duration-300"
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
          </motion.button>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 dark:bg-slate-700/50 hover:from-primary/20 hover:to-secondary/20 dark:hover:bg-slate-700 rounded-full py-2 pl-2 pr-4 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/20"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              id="user-menu-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserAvatarIcon className="h-8 w-8 text-white" />
              <span className="text-sm font-semibold text-text-primary dark:text-gray-200 hidden md:inline truncate max-w-[150px]">
                {user.fullName}
              </span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20
                  }}
                  className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl shadow-xl origin-top-right z-50 overflow-hidden"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  {/* User info */}
                  <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-secondary/5 dark:bg-slate-700/50 border-b border-border dark:border-slate-700">
                    <p className="font-semibold text-sm text-text-primary dark:text-white truncate">{user.fullName}</p>
                    <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <motion.button
                      onClick={() => { setActiveScreen(Screen.Profile); setIsDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary dark:text-gray-300 hover:bg-bg-secondary dark:hover:bg-slate-700 transition-colors text-left"
                      role="menuitem"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <UserCircleIcon className="h-5 w-5 text-primary" />
                      <span>Mi Perfil</span>
                    </motion.button>

                    {(user.email === 'pineroanthony2@gmail.com' || user.id === '9ddd1796-86f1-4c39-81c2-9e7c4b64ceda') && (
                      <motion.button
                        onClick={() => { setActiveScreen(Screen.Admin); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary dark:text-secondary-light hover:bg-secondary/10 dark:hover:bg-secondary/20 transition-colors text-left"
                        role="menuitem"
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span>Panel de Administración</span>
                      </motion.button>
                    )}

                    <div className="border-t border-border dark:border-slate-700 my-1" />

                    <motion.button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 dark:hover:bg-error/20 transition-colors text-left"
                      role="menuitem"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <LogoutIcon className="h-5 w-5" />
                      <span>Cerrar Sesión</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
