import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ShieldAlert,
  Ambulance,
  RefreshCw,
  Phone,
  Send
} from 'lucide-react';

export default function NgoDashboard() {
  const { user } = useAuth();

  const [availableReports, setAvailableReports] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'assigned'
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const [availRes, mineRes] = await Promise.all([
        api.get('/api/v1/reports/available'),
        api.get('/api/v1/reports/assignments/mine'),
      ]);

      if (availRes.data?.data?.reports) {
        setAvailableReports(availRes.data.data.reports);
      }
      if (mineRes.data?.data?.assignments) {
        setMyAssignments(mineRes.data.data.assignments);
      }
    } catch (err) {
      console.warn('NGO data load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAccept = async (reportId) => {
    setAcceptingId(reportId);
    try {
      await api.post(`/api/v1/reports/${reportId}/accept`, {
        notes: 'Dispatched rescue ambulance from shelter headquarters.',
      });
      setSuccessMsg('Distress call successfully accepted! Case is now assigned to your shelter.');
      await loadData();
      setActiveTab('assigned');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not accept report');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* NGO Shelter Identity Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/80 shadow-ethereal">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-800 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Animal Welfare Organization Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Rescue Dispatch Command Center
          </h1>
          <p className="text-sm text-slate-500">
            Logged in as <span className="font-semibold text-slate-800">{user?.full_name}</span> • Operating Partner Shelter
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Available Distress Calls</p>
          <p className="text-3xl font-extrabold text-rose-700 mt-1">{availableReports.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting shelter acceptance</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Our Active Operations</p>
          <p className="text-3xl font-extrabold text-sky-700 mt-1">
            {myAssignments.filter((a) => a.assignment_status !== 'rescued' && a.assignment_status !== 'cancelled').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Assigned or in transit</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/80">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Completed Rescues</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">
            {myAssignments.filter((a) => a.assignment_status === 'rescued').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Animals safe in care</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'available'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          🚨 Available Distress Requests ({availableReports.length})
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'assigned'
              ? 'bg-ethereal-50 text-ethereal-900 border border-ethereal-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          🚑 Our Active Cases ({myAssignments.length})
        </button>
      </div>

      {/* Tab 1: Available Emergency Requests */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {availableReports.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-base text-slate-800">No Open Distress Calls In Queue</p>
              <p className="text-xs text-slate-400">All recent reports have been accepted or resolved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {availableReports.map((report) => (
                <div 
                  key={report.id}
                  className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-900">
                          {report.animal_type}
                        </span>
                        {report.breed && <span className="text-xs text-slate-400">({report.breed})</span>}
                      </div>
                      <SeverityBadge severity={report.severity_level} />
                    </div>

                    <p className="text-sm text-slate-800 font-medium line-clamp-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/50">
                      {report.condition_description}
                    </p>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p className="flex items-start gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{report.address_text || 'Delhi Coordinates'}</span>
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        Lat: {report.latitude} • Lon: {report.longitude}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      to={`/reports/${report.id}`}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() => handleAccept(report.id)}
                      disabled={acceptingId === report.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-ethereal-800 to-ethereal-600 hover:from-ethereal-900 hover:to-ethereal-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {acceptingId === report.id ? 'Accepting Case...' : 'Accept & Dispatch Rescuer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Organization Active Assignments */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {myAssignments.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-slate-500">
              Your shelter has not accepted any rescue operations yet.
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Animal</th>
                    <th className="pb-3 font-semibold">Severity</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Dispatch Status</th>
                    <th className="pb-3 font-semibold">Accepted At</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {myAssignments.map((a) => (
                    <tr key={a.assignment_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900 capitalize">
                        {a.animal_type}
                        {a.breed && <span className="block text-[11px] text-slate-400 font-normal">{a.breed}</span>}
                      </td>
                      <td className="py-3.5">
                        <SeverityBadge severity={a.severity_level} />
                      </td>
                      <td className="py-3.5 text-slate-600 max-w-[200px] truncate" title={a.address_text}>
                        {a.address_text || 'Delhi Location'}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={a.report_status || a.assignment_status} size="xs" />
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px]">
                        {new Date(a.responded_at || a.assignment_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/reports/${a.report_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ethereal-100 text-ethereal-900 font-bold text-xs hover:bg-ethereal-200 transition-colors"
                        >
                          <span>Manage Status</span>
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
      )}

    </div>
  );
}

