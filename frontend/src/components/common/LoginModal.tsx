import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Lock, Mail, Building, UserCheck, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'superadmin' | 'center' | 'customer';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultRole }) => {
  const { login, quickLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [centerName, setCenterName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.auth.register({
          name,
          email,
          password,
          role: 'center',
          center_name: centerName || `${name} Xerox Center`,
          contact_no: contactNo
        });
        if (res.success) {
          localStorage.setItem('smartprint_token', res.token);
          window.location.reload();
        }
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: 'superadmin' | 'center') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel-elevated p-5 sm:p-8 bg-white/95 text-slate-800 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/AppIcon.png"
              alt="SmartPrint Logo"
              className="w-16 h-16 object-contain rounded-2xl shadow-md border border-slate-200/60 mx-auto"
            />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Register Xerox Center' : 'Sign in to SmartPrint'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise Cloud Management & Micro-Print Engine
          </p>
        </div>

        {/* Quick Demo Login Cards */}
        {!isRegister && (
          <div className="mb-5 sm:mb-6 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
              1-Click Instant Demo Login
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuick('superadmin')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs transition-all shadow-xs group"
              >
                <Sparkles className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuick('center')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs transition-all shadow-xs group"
              >
                <Building className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
                <span>Xerox Vendor</span>
              </button>
            </div>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-widest">or email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Your Full Name</label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Xerox Store / Center Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="e.g. QuickPrint Hub"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-slate-800"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Center & Generate ID' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {isRegister
              ? 'Already registered? Sign in here'
              : 'New Xerox Center? Register here to get your Unique QR'}
          </button>
        </div>
      </div>
    </div>
  );
};
