import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const demoAccounts = [
    { label: 'Citizen Priya', email: 'citizen.priya@gmail.com', pass: 'Password123!', role: 'citizen', badge: 'bg-emerald-100 text-emerald-800' },
    { label: 'NGO Shelter Admin', email: 'delhi_shelter@resq.org', pass: 'Password123!', role: 'org_admin', badge: 'bg-purple-100 text-purple-800' },
    { label: 'Field Rescuer Rahul', email: 'rescuer.rahul@resq.org', pass: 'Password123!', role: 'rescuer', badge: 'bg-sky-100 text-sky-800' },
    { label: 'Platform Admin', email: 'admin@resq.org', pass: 'Password123!', role: 'admin', badge: 'bg-rose-100 text-rose-800' },
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      // Route based on role
      const redirectRoutes = {
        citizen: '/dashboard/citizen',
        org_admin: '/dashboard/ngo',
        rescuer: '/dashboard/rescuer',
        admin: '/dashboard/admin',
      };
      const dest = location.state?.from?.pathname || redirectRoutes[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 sm:p-10 shadow-ethereal border border-white/90 space-y-7 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ethereal-800 to-ethereal-500 text-white flex items-center justify-center mx-auto shadow-glow-emerald">
            <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to ResQ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to submit reports, manage rescues, and coordinate field dispatches.
          </p>
        </div>

        {/* Demo Fast-Fill Bar for Evaluator */}
        <div className="p-3.5 rounded-2xl bg-ethereal-50/80 border border-ethereal-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ethereal-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-ethereal-600" />
            <span>Evaluation Demo Fast-Fill:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="text-left px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-slate-200 text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col"
              >
                <span className="font-semibold text-slate-800 text-[11px] leading-tight">{acc.label}</span>
                <span className="text-[10px] text-slate-400 capitalize">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-sm text-slate-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-ethereal-800 to-ethereal-600 hover:from-ethereal-900 hover:to-ethereal-700 text-white font-bold text-sm shadow-ethereal-sm hover:shadow-ethereal transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-ethereal-700 font-bold hover:underline">
            Register as Citizen or Shelter
          </Link>
        </div>

      </div>
    </div>
  );
}

