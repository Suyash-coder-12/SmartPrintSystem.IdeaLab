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
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center text-slate-900 pr-1">
              <Printer className="w-7 h-7 text-slate-900" strokeWidth={1.9} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  SMARTPRINT
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 tracking-wide uppercase">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Xerox Center Management & Micro-Print Engine
              </p>
            </div>
          </div>

          {/* Navigation Role Tabs */}
          <nav className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/60 text-xs font-medium">
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
              <span className="hidden md:inline">Print Agent</span>
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 text-xs font-medium text-slate-800 transition-all"
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Vendor Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
