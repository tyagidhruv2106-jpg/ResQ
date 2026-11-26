import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  HeartHandshake, 
  ShieldAlert, 
  Bell, 
  LogOut, 
  User, 
  PlusCircle, 
  Menu, 
  X, 
  Activity,
  Building2,
  Ambulance,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchUnread() {
      try {
        const res = await api.get('/api/v1/notifications?is_read=false&limit=10');
        if (res.data?.data?.notifications) {
          setUnreadCount(res.data.data.notifications.length);
        }
      } catch (e) {
        // Silent background poll
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'org_admin') return '/dashboard/ngo';
    if (user.role === 'rescuer') return '/dashboard/rescuer';
    return '/dashboard/citizen';
  };

  const roleLabel = {
    admin: 'Platform Admin',
    org_admin: 'Shelter Coordinator',
    rescuer: 'Field Rescuer',
    citizen: 'Citizen Guardian',
  }[user?.role] || 'Member';

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-ethereal-100/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Tagline */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-ethereal-800 to-ethereal-500 flex items-center justify-center text-white shadow-glow-emerald group-hover:scale-105 transition-transform duration-300">
              <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-ethereal-700 transition-colors">
                Res<span className="text-ethereal-600 font-serif italic">Q</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                From Distress to Rescue
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1.5">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/') 
                  ? 'text-ethereal-800 bg-ethereal-50/80 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Explore
            </Link>

            {/* Quick Report CTA Button */}
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50/90 hover:bg-rose-100 border border-rose-200/80 shadow-2xs hover:shadow-xs transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Report Animal</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname.startsWith('/dashboard')
                      ? 'text-ethereal-800 bg-ethereal-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-ethereal-600" />
                  <span>Dashboard</span>
                </Link>

                {/* Role-specific direct links */}
                {user.role === 'org_admin' && (
                  <Link
                    to="/dashboard/ngo"
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    Rescue Offers
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/dashboard/admin"
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    System Admin
                  </Link>
                )}
              </>
            ) : null}
          </div>

          {/* Right Section: Auth & Notifications */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                
                {/* Notification Bell */}
                <Link
                  to={getDashboardPath()}
                  title="Notifications"
                  className="relative p-2.5 rounded-xl text-slate-500 hover:text-ethereal-700 hover:bg-ethereal-50 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  )}
                </Link>

                {/* User chip */}
                <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <div className="w-8 h-8 rounded-full bg-ethereal-100 text-ethereal-800 flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {user?.full_name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-ethereal-600 font-medium">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-ethereal-800 hover:bg-slate-50 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-ethereal-700 to-ethereal-600 hover:from-ethereal-800 hover:to-ethereal-700 shadow-ethereal-sm hover:shadow-ethereal transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-2 bg-white/95 backdrop-blur-xl border-b border-slate-200">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-ethereal-50"
          >
            Explore
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-rose-700 bg-rose-50"
          >
            🚨 Report an Animal
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-ethereal-800 hover:bg-ethereal-50"
              >
                Dashboard ({roleLabel})
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-ethereal-700 text-white text-sm font-semibold"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

