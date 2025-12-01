import React, { useState } from 'react';
import { ViewState } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SendMoneyForm } from './components/SendMoneyForm';
import { BeneficiariesList } from './components/BeneficiariesList';
import { TransactionHistory } from './components/TransactionHistory';
import { UserProfile } from './components/UserProfile';
import { AdminDashboard } from './components/AdminDashboard';
import { Navigation } from './components/Navigation';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');

  const renderView = () => {
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen onNavigate={setCurrentView} />;
      case 'send':
        return <SendMoneyForm onNavigate={setCurrentView} />;
      case 'beneficiaries':
        return <BeneficiariesList />;
      case 'history':
        return <TransactionHistory />;
      case 'profile':
        return <UserProfile />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <WelcomeScreen onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-stitch-bg text-stitch-text pb-24 md:pb-0 md:pl-24 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-stitch-sky/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-10%] left-[-5%] w-96 h-96 bg-stitch-yellow/10 rounded-full blur-3xl -z-10" />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-6 md:p-12 animate-fade-in">
        {renderView()}
      </main>

      {/* Navigation */}
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default App;