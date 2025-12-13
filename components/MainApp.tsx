import React, { useState, useRef, useEffect } from 'react';
import { User, Beneficiary, Screen } from '../types';
import { Navigation } from './Navigation'; // New Navigation Component
import Calculator, { type CalculatorRef } from './Calculator';
import Exchange from './Exchange';
import Profile from './Profile';
import Info from './Info';
import History from './History';
import Beneficiaries from './Beneficiaries';
import VirtualAssistant from './VirtualAssistant';
import AdminPanel from './admin/AdminPanel';
import Referrals from './Referrals';
import DashboardWelcome from './DashboardWelcome';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from './ui/Toaster';

interface MainAppProps {
  user: User;
  onProfileUpdate: (updates: Partial<Pick<User, 'fullName' | 'isVerified' | 'phone'>>) => Promise<void>;
}

const MainApp: React.FC<MainAppProps> = ({ user, onProfileUpdate }) => {
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Home);
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

  const handleNewTransactionClick = (beneficiary?: any) => {
    if (beneficiary) {
      // Map the dashboard recipient format to the Beneficiary type expected by Calculator
      // Note: The dashboard history API returns slightly different fields than the Beneficiary type
      // We need to map them correctly.
      const mappedBeneficiary: Beneficiary = {
        id: beneficiary.id || 'temp-id',
        created_at: new Date().toISOString(), // Required by type
        user_id: user.id, // Required by type
        name: beneficiary.name,
        country_code: beneficiary.country_code || 'VE', // Default to VE if missing, but should be there
        bank: beneficiary.bank,
        account_number: beneficiary.account_number || '',
        document_id: beneficiary.document_id || ''
      };
      setBeneficiaryPrefill(mappedBeneficiary);
    } else {
      clearPrefill();
    }

    if (activeScreen === Screen.Calculator) {
      if (!beneficiary) {
        calculatorRef.current?.resetCalculator();
      }
    } else {
      setShouldResetCalculator(true);
      setActiveScreen(Screen.Calculator);
    }
  };

  const renderScreen = () => {
    console.log('Rendering screen:', activeScreen); // DEBUG LOG
    switch (activeScreen) {
      case Screen.Home:
        return <DashboardWelcome user={user} onNewTransaction={handleNewTransactionClick} />;
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
      case Screen.Referrals:
        return <Referrals user={user} />;
      default:
        return <DashboardWelcome user={user} onNewTransaction={handleNewTransactionClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-gray-900 text-text-primary pb-24 md:pb-0 md:pl-20 relative overflow-hidden transition-colors duration-300">

      {/* Decorative Background Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-96 h-96 bg-warning/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Navigation (Sidebar for Desktop, Bottom Bar for Mobile) */}
      <Navigation
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        user={user}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="w-full">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <VirtualAssistant />
      <Toaster />
    </div>
  );
};

export default MainApp;
