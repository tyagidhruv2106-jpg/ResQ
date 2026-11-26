import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-ethereal-300 border-t-ethereal-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 tracking-wide">Validating security credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user's role is not allowed, redirect to their role-appropriate dashboard
    const roleRoutes = {
      citizen: '/dashboard/citizen',
      org_admin: '/dashboard/ngo',
      rescuer: '/dashboard/rescuer',
      admin: '/dashboard/admin',
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return children;
}

