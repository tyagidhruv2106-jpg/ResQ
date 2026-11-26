import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import ReportAnimalPage from './pages/ReportAnimalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReportDetailPage from './pages/ReportDetailPage';
import CitizenDashboard from './pages/CitizenDashboard';
import NgoDashboard from './pages/NgoDashboard';
import RescuerDashboard from './pages/RescuerDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/report" element={<ReportAnimalPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reports/:id" element={<ReportDetailPage />} />

              {/* Citizen Routes */}
              <Route
                path="/dashboard/citizen"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />

              {/* NGO / Shelter Routes */}
              <Route
                path="/dashboard/ngo"
                element={
                  <ProtectedRoute allowedRoles={['org_admin', 'admin']}>
                    <NgoDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Field Rescuer Routes */}
              <Route
                path="/dashboard/rescuer"
                element={
                  <ProtectedRoute allowedRoles={['rescuer', 'org_admin', 'admin']}>
                    <RescuerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}
