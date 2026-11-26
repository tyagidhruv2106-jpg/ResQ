import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartHandshake, User, Mail, Lock, Phone, AlertCircle, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'citizen',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        role: formData.role,
      };

      const user = await register(payload);
      if (user.role === 'org_admin') {
        navigate('/dashboard/ngo');
      } else {
        navigate('/dashboard/citizen');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 sm:p-10 shadow-ethereal border border-white/90 space-y-6 text-left">
        
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ethereal-800 to-ethereal-500 text-white flex items-center justify-center mx-auto shadow-glow-emerald">
            <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Join the ResQ animal protection network.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'citizen' })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  formData.role === 'citizen'
                    ? 'bg-ethereal-50/90 border-ethereal-400 text-ethereal-900 font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1 text-ethereal-700" />
                <span className="text-xs">Citizen / Reporter</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'org_admin' })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  formData.role === 'org_admin'
                    ? 'bg-ethereal-50/90 border-ethereal-400 text-ethereal-900 font-bold shadow-2xs'
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 mx-auto mb-1 text-ethereal-700" />
                <span className="text-xs">Animal Shelter / NGO</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              placeholder="priya@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                placeholder="Min. 8 chars"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirm *
              </label>
              <input
                type="password"
                placeholder="Repeat pass"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm text-slate-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-ethereal-800 to-ethereal-600 hover:from-ethereal-900 hover:to-ethereal-700 text-white font-bold text-sm shadow-ethereal-sm hover:shadow-ethereal transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="text-ethereal-700 font-bold hover:underline">
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
}

