import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeaderNav } from './components/common/HeaderNav';
import { CustomerFlow } from './components/customer/CustomerFlow';
import { CenterView } from './components/center/CenterView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { AgentConsoleView } from './components/agent/AgentConsoleView';
import { LoginModal } from './components/common/LoginModal';
import { Sparkles, Layers, ShieldCheck, Printer, Smartphone, Cpu } from 'lucide-react';

function MainContent() {
  const { role, user } = useAuth();
  const [currentView, setCurrentView] = useState<'customer' | 'center' | 'superadmin' | 'agent'>(
    role === 'superadmin' ? 'superadmin' : role === 'center' ? 'center' : 'customer'
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [customerCenterCode, setCustomerCenterCode] = useState('XC-89412');

  const handleOpenCustomerWithCode = (code: string) => {
    setCustomerCenterCode(code);
    setCurrentView('customer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <HeaderNav
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Interactive Work Area */}
      <main className="flex-1 pb-16">
        {currentView === 'customer' && (
          <CustomerFlow initialCenterCode={customerCenterCode} />
        )}

        {currentView === 'center' && (
          <CenterView
            onOpenCustomerFlowWithCode={handleOpenCustomerWithCode}
            onOpenAgentConsole={() => setCurrentView('agent')}
          />
        )}

        {currentView === 'superadmin' && <SuperAdminView />}

        {currentView === 'agent' && <AgentConsoleView />}
      </main>

      {/* Footer System Info */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SmartPrint Architecture</span>
            <span>&bull;</span>
            <span>PHP 8.5 REST API</span>
            <span>&bull;</span>
            <span>TypeScript Frontend & Local Agent</span>
            <span>&bull;</span>
            <span>Liquid Crystal White Theme</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" strokeWidth={1.8} />
              Role-Based Authentication
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Cpu className="w-3.5 h-3.5 text-slate-700" strokeWidth={1.8} />
              Hardware Print Agent
            </span>
          </div>
        </div>
      </footer>

      {/* Global Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
