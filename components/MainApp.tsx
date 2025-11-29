import React, { useState, useRef, useEffect } from 'react';
import type { User, Beneficiary } from '../types';
import { Screen } from '../types';
import Header from './Header';
import Calculator, { type CalculatorRef } from './Calculator';
import Exchange from './Exchange';
import Profile from './Profile';
import Info from './Info';
import History from './History';
import Beneficiaries from './Beneficiaries';
import VirtualAssistant from './VirtualAssistant';
import AdminPanel from './admin/AdminPanel';
import { isAdmin } from '../services/adminService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import HistoryIcon from './icons/HistoryIcon';
import DashboardWelcome from './DashboardWelcome';
import UsersIcon from './icons/UsersIcon';
import SendIcon from './icons/SendIcon';
import { AnimatePresence, motion } from 'framer-motion';


interface MainAppProps {
  user: User;
  // FIX: Changed Omit<> to Pick<> to match the updated handleProfileUpdate signature in App.tsx.
  onProfileUpdate: (updates: Partial<Pick<User, 'fullName' | 'isVerified' | 'phone'>>) => Promise<void>;
}

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${isActive
      ? 'bg-indigo-600 text-white shadow-lg'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-300'
      }`}
  >
    {icon}
    {label}
  </button>
);

// FIX: Moved icon components outside MainApp to prevent re-creation on every render.
const ExchangeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const MainApp: React.FC<MainAppProps> = ({ user, onProfileUpdate }) => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Calculator);
  const calculatorRef = useRef<CalculatorRef>(null);
  const [shouldResetCalculator, setShouldResetCalculator] = useState(false);
  const [beneficiaryPrefill, setBeneficiaryPrefill] = useState<Beneficiary | null>(null);

  // Effect to reset the calculator when it becomes visible after a request
  useEffect(() => {
    if (activeScreen === Screen.Calculator && shouldResetCalculator) {
      calculatorRef.current?.resetCalculator();
      setShouldResetCalculator(false); // Reset the flag
    }
  }, [activeScreen, shouldResetCalculator]);

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    setBeneficiaryPrefill(beneficiary);
    setActiveScreen(Screen.Calculator);
  };

  const clearPrefill = () => {
    setBeneficiaryPrefill(null);
  };


  const handleNewTransactionClick = () => {
    // If we're already on the calculator screen, reset it immediately.
    // Otherwise, set a flag to reset it once the screen switches.
    if (activeScreen === Screen.Calculator) {
      calculatorRef.current?.resetCalculator();
    } else {
      setShouldResetCalculator(true);
      setActiveScreen(Screen.Calculator);
    }
    clearPrefill();
  };


  const renderScreen = () => {
    switch (activeScreen) {
      case Screen.Calculator:
        return <Calculator ref={calculatorRef} user={user} setActiveScreen={setActiveScreen} prefillData={beneficiaryPrefill} onClearPrefill={clearPrefill} />;
      case Screen.Exchange:
        return <Exchange />;
      case Screen.History:
        return <History user={user} />;
      case Screen.Profile:
        return <Profile user={user} onProfileUpdate={onProfileUpdate} />;
      case Screen.Info:
        return <Info />;
      case Screen.Admin:
        return <AdminPanel user={user} />;
      case Screen.Beneficiaries:
        return <Beneficiaries user={user} onSelectBeneficiary={handleSelectBeneficiary} />;
      default:
        return <Calculator ref={calculatorRef} user={user} setActiveScreen={setActiveScreen} prefillData={null} onClearPrefill={clearPrefill} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} setActiveScreen={setActiveScreen} />
      <main className="flex-grow p-2 sm:p-4 md:p-8 container mx-auto">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          {/* Welcome Dashboard */}
          <DashboardWelcome user={user} onNewTransaction={handleNewTransactionClick} />

          <nav className="bg-white dark:bg-gray-800 p-2 rounded-xl mb-8 shadow-md overflow-x-auto">
            <div className="flex items-center gap-2 flex-nowrap min-w-max">
              <NavItem label="Enviar" isActive={activeScreen === Screen.Calculator} onClick={() => setActiveScreen(Screen.Calculator)} icon={<SendIcon className="h-5 w-5" />} />
              <NavItem label="Intercambiar" isActive={activeScreen === Screen.Exchange} onClick={() => setActiveScreen(Screen.Exchange)} icon={<ExchangeIcon />} />
              <NavItem label="Beneficiarios" isActive={activeScreen === Screen.Beneficiaries} onClick={() => setActiveScreen(Screen.Beneficiaries)} icon={<UsersIcon className="h-5 w-5" />} />
              <NavItem label="Historial" isActive={activeScreen === Screen.History} onClick={() => setActiveScreen(Screen.History)} icon={<HistoryIcon className="h-5 w-5" />} />
              <NavItem label="Perfil" isActive={activeScreen === Screen.Profile} onClick={() => setActiveScreen(Screen.Profile)} icon={<UserIcon />} />
              <NavItem label="Info" isActive={activeScreen === Screen.Info} onClick={() => setActiveScreen(Screen.Info)} icon={<InfoIcon />} />
              {isAdmin(user) && (
                <NavItem label="Admin" isActive={activeScreen === Screen.Admin} onClick={() => setActiveScreen(Screen.Admin)} icon={<UserIcon />} />
              )}
            </div>
          </nav>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <VirtualAssistant />
    </div>
  );
};

export default MainApp;
