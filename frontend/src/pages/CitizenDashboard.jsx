import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  PlusCircle, 
  Clock, 
  MapPin, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  CheckCheck
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsRes, notifsRes] = await Promise.all([
        api.get('/api/v1/reports/my'),
        api.get('/api/v1/notifications?limit=20'),
      ]);

      if (reportsRes.data?.data?.reports) {
        setReports(reportsRes.data.data.reports);
      }
      if (notifsRes.data?.data?.notifications) {
        setNotifications(notifsRes.data.data.notifications);
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await api.patch('/api/v1/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingRead(false);
    }
  };

  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'reported' || r.status === 'matching').length;
  const inProgressCount = reports.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length;
  const rescuedCount = reports.filter((r) => r.status === 'rescued' || r.status === 'closed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/80 shadow-ethereal">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-ethereal-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Citizen Guardian Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Guardian'}
          </h1>
          <p className="text-sm text-slate-500">
            Thank you for being the eyes and voice for vulnerable animals in your community.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Animal</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Submitted</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Historical distress calls</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Dispatch</p>
          <p className="text-3xl font-extrabold text-amber-700 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Matching nearby shelters</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Active Rescue</p>
          <p className="text-3xl font-extrabold text-sky-700 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Rescuer on the way</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Successfully Rescued</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{rescuedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Safe and receiving care</p>
        </div>
      </div>

      {/* 2 Column Layout: Reports Table & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: My Reports */}
        <div className="lg:col-span-8 glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-ethereal space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">My Rescue Reports</h3>
              <p className="text-xs text-slate-500">Live lifecycle tracking of animals you have reported</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {reports.length} Cases
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-500">You haven't submitted any animal distress reports yet.</p>
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ethereal-700 hover:text-ethereal-800"
              >
                <span>Report an animal in need</span> →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Animal</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-medium text-slate-900">
                        <span className="capitalize font-bold">{report.animal_type}</span>
                        {report.breed && <span className="block text-[11px] text-slate-400 font-normal">{report.breed}</span>}
                      </td>
                      <td className="py-3.5">
                        <SeverityBadge severity={report.severity_level} />
                      </td>
                      <td className="py-3.5 text-slate-600 max-w-[200px] truncate" title={report.address_text}>
                        {report.address_text || 'GPS Coordinates'}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={report.status} size="xs" />
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-ethereal-800 hover:bg-ethereal-100/80 transition-colors"
                        >
                          <span>Track</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: In-App Notifications */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-ethereal space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-ethereal-700" />
              <h3 className="text-base font-bold text-slate-900">Live Alerts</h3>
            </div>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="text-[11px] font-semibold text-ethereal-700 hover:text-ethereal-900 cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No alerts or updates yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border text-xs text-left space-y-1.5 transition-all ${
                    n.is_read
                      ? 'bg-white/60 border-slate-100 text-slate-500'
                      : 'bg-ethereal-50/90 border-ethereal-200 text-slate-800 font-medium shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 text-xs leading-snug">{n.title}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

