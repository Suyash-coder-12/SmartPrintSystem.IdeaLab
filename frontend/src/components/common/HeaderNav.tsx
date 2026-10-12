import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Printer,
  Shield,
  Smartphone,
  Cpu,
  LogIn,
  LogOut,
  ChevronDown,
  Building,
  UserCheck,
  Sparkles,
  Activity
} from 'lucide-react';

interface HeaderNavProps {
  currentView: 'customer' | 'center' | 'superadmin' | 'agent';
  onViewChange: (view: 'customer' | 'center' | 'superadmin' | 'agent') => void;
  onOpenLogin: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ currentView, onViewChange, onOpenLogin }) => {
  const { user, center, role, logout, quickLogin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/80 border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <img
              src="/AppIcon.png"
              alt="SmartPrint Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl shadow-xs border border-slate-200/50"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                  SMARTPRINT
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 tracking-wide uppercase">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                Xerox Center Management & Micro-Print Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Role Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 text-xs font-medium">
            <button
              onClick={() => onViewChange('customer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                currentView === 'customer'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Flow</span>
            </button>

            <button
              onClick={() => onViewChange('center')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                currentView === 'center'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Xerox Center</span>
              {center && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md font-mono">
                  {center.center_code}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('superadmin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                currentView === 'superadmin'
                  ? 'bg-white text-purple-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Super Admin</span>
            </button>

            <button
              onClick={() => onViewChange('agent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                currentView === 'agent'
                  ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Print Agent</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </nav>

          {/* Right Action / Auth Pill */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-xs font-medium text-slate-800 transition-all"
                >
                  <div className="w-6 h-6 rounded-full border border-slate-300 bg-slate-100 text-slate-800 flex items-center justify-center text-[11px] font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="font-semibold text-slate-900 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-panel-elevated p-2 bg-white/95 text-slate-800 shadow-xl z-50 text-xs">
                    <div className="p-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          quickLogin('superadmin');
                          onViewChange('superadmin');
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <span>Switch to Super Admin</span>
                      </button>
                      <button
                        onClick={() => {
                          quickLogin('center');
                          onViewChange('center');
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                      >
                        <Building className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Switch to Xerox Center</span>
                      </button>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">Vendor Login</span>
                <span className="xs:hidden sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Ultra Responsive for all Phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-2 py-1.5 flex justify-around items-center">
        <button
          onClick={() => onViewChange('customer')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'customer'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-5 h-5 mb-0.5" strokeWidth={currentView === 'customer' ? 2.3 : 1.8} />
          <span className="text-[10px]">Customer</span>
        </button>

        <button
          onClick={() => onViewChange('center')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'center'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-5 h-5 mb-0.5" strokeWidth={currentView === 'center' ? 2.3 : 1.8} />
          <span className="text-[10px]">Center</span>
        </button>

        <button
          onClick={() => onViewChange('superadmin')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentView === 'superadmin'
              ? 'text-purple-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-5 h-5 mb-0.5" strokeWidth={currentView === 'superadmin' ? 2.3 : 1.8} />
          <span className="text-[10px]">Admin</span>
        </button>

        <button
          onClick={() => onViewChange('agent')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'agent'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Cpu className="w-5 h-5 mb-0.5" strokeWidth={currentView === 'agent' ? 2.3 : 1.8} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[10px]">Agent</span>
        </button>
      </div>
    </header>
  );
};
