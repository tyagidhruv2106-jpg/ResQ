import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  Ambulance, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Navigation,
  Send,
  AlertCircle,
  Activity
} from 'lucide-react';

export default function RescuerDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/reports/assignments/mine');
      if (res.data?.data?.assignments) {
        setAssignments(res.data.data.assignments);
      }
    } catch (err) {
      console.warn('Rescuer case fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleUpdate = async (reportId, nextStatus, notes) => {
    setUpdatingId(reportId);
    setActionSuccess(null);
    try {
      await api.put(`/api/v1/reports/${reportId}/status`, {
        status: nextStatus,
        notes: notes || `Field rescuer updated status to ${nextStatus}`,
      });
      setActionSuccess(`Case successfully updated to '${nextStatus}'.`);
      await fetchCases();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7 text-left">
      
      {/* Rescuer Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-ethereal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            <Ambulance className="w-3.5 h-3.5" />
            <span>Field Rescuer Terminal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Assigned Field Cases
          </h1>
          <p className="text-xs text-slate-500">
            Rescuer: <span className="font-semibold text-slate-800">{user?.full_name}</span> • Active Field Duty
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          Refresh Feed
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Cases list */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-base text-slate-800">No Pending Field Rescues</p>
            <p className="text-xs text-slate-400">All current assigned cases have been safely rescued or resolved.</p>
          </div>
        ) : (
          assignments.map((item) => (
            <div
              key={item.assignment_id}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 capitalize">
                      {item.animal_type}
                    </span>
                    {item.breed && <span className="text-xs text-slate-400 font-normal">({item.breed})</span>}
                    <SeverityBadge severity={item.severity_level} />
                  </div>
                  <p className="text-xs text-slate-500">Case ID: {item.report_id}</p>
                </div>

                <StatusBadge status={item.report_status || item.assignment_status} size="md" />
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                {item.condition_description}
              </p>

              {/* Location & Navigation Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-ethereal-50/70 border border-ethereal-200/70 text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{item.address_text || 'Delhi Location'}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    GPS: {item.latitude}, {item.longitude}
                  </p>
                </div>

                {item.latitude && item.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-ethereal-300 text-ethereal-800 font-bold hover:bg-ethereal-100 transition-colors shrink-0"
                  >
                    <Navigation className="w-3 h-3 text-ethereal-700" />
                    <span>Navigate (Maps)</span>
                  </a>
                )}
              </div>

              {/* Step progression buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={`/reports/${item.report_id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  View Full Timeline →
                </Link>

                <div className="flex items-center gap-2">
                  {item.report_status === 'assigned' && (
                    <button
                      onClick={() => handleUpdate(item.report_id, 'in_progress', 'Rescuer arrived on site. Commencing treatment.')}
                      disabled={updatingId === item.report_id}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      {updatingId === item.report_id ? 'Updating...' : 'Mark Arrived / In Progress'}
                    </button>
                  )}

                  {item.report_status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdate(item.report_id, 'rescued', 'Animal secured and transported to sanctuary.')}
                      disabled={updatingId === item.report_id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                    >
                      {updatingId === item.report_id ? 'Recording...' : 'Mark Successfully Rescued'}
                    </button>
                  )}

                  {item.report_status === 'rescued' && (
                    <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Rescue Mission Completed
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

