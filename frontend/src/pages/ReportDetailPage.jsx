import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  User, 
  Phone,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update state for NGO / Rescuer users
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [repRes, trackRes] = await Promise.all([
        api.get(`/api/v1/reports/${id}`),
        api.get(`/api/v1/reports/${id}/tracking`),
      ]);

      if (repRes.data?.data) {
        setReport(repRes.data.data);
      }
      if (trackRes.data?.data?.tracking) {
        setTracking(trackRes.data.data.tracking);
      }
    } catch (err) {
      console.error('Fetch report detail error:', err);
      setError(err.response?.data?.message || err.message || 'Report not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdating(true);
    setActionSuccess(null);

    try {
      await api.put(`/api/v1/reports/${id}/status`, {
        status: newStatus,
        notes: updateNotes || undefined,
      });
      setActionSuccess(`Status successfully advanced to '${newStatus}'.`);
      setNewStatus('');
      setUpdateNotes('');
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-ethereal-300 border-t-ethereal-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading report and tracking timeline...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Incident Not Found</h2>
        <p className="text-slate-500 text-sm">{error || 'Could not retrieve report details.'}</p>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-ethereal-700 text-white font-semibold text-sm">
          Return to Home
        </Link>
      </div>
    );
  }

  const isNgoOrRescuer = user && (user.role === 'org_admin' || user.role === 'rescuer' || user.role === 'admin');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link to={user?.role === 'org_admin' ? '/dashboard/ngo' : '/dashboard/citizen'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <StatusBadge status={report.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Report Details Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-white/80 shadow-ethereal">
            
            {/* Header info */}
            <div className="space-y-2 border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-ethereal-700">
                  Rescue Case Profile
                </span>
                <SeverityBadge severity={report.severity_level} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 capitalize">
                Injured {report.animal_type} {report.breed ? `(${report.breed})` : ''}
              </h1>
              <p className="text-xs font-mono text-slate-400">ID: {report.id}</p>
            </div>

            {/* Photo if available */}
            {report.photo_url && (
              <div className="h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-900 relative">
                <img
                  src={report.photo_url}
                  alt={report.animal_type}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Condition Report</h3>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                {report.condition_description}
              </p>
            </div>

            {/* Location Info */}
            <div className="p-4 rounded-2xl bg-ethereal-50/70 border border-ethereal-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-ethereal-900 font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-ethereal-700" />
                <span>Geospatial Incident Coordinates</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{report.address_text || 'Delhi Coordinates'}</p>
              <p className="text-[11px] font-mono text-slate-500">
                Lat: {report.latitude} • Lon: {report.longitude} (SRID 4326)
              </p>
            </div>

            {/* Submission timestamp */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Reported {new Date(report.created_at).toLocaleString()}
              </span>
              <span>Updated {new Date(report.updated_at).toLocaleString()}</span>
            </div>

          </div>

          {/* NGO Action Box: Update Status (Only visible to NGO / Rescuer / Admin) */}
          {isNgoOrRescuer && (
            <div className="glass-card rounded-3xl p-6 border border-ethereal-200 shadow-ethereal space-y-4">
              <div className="flex items-center gap-2 text-ethereal-800 font-bold text-sm">
                <Activity className="w-4 h-4 text-ethereal-600" />
                <span>Authorized Rescue Status Dispatch</span>
              </div>

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {actionSuccess}
                </div>
              )}

              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Advance Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium text-slate-800"
                      required
                    >
                      <option value="">Select Next Status</option>
                      {report.status === 'assigned' && <option value="in_progress">In Progress (Rescuer on site)</option>}
                      {report.status === 'in_progress' && <option value="rescued">Rescued (Animal safe)</option>}
                      {report.status === 'rescued' && <option value="closed">Closed (Case resolved)</option>}
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Action Notes / Findings
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bandaged leg, transported to shelter"
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating || !newStatus}
                  className="w-full py-2.5 rounded-xl bg-ethereal-700 hover:bg-ethereal-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Committing update...' : 'Record Status Transition'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Chronological Tracking Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-white/80 shadow-ethereal space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Rescue Audit Timeline</h3>
              <span className="text-[11px] text-slate-400 font-medium">{tracking.length} Milestones</span>
            </div>

            {tracking.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Initial report registered. Awaiting shelter dispatch.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-ethereal-200">
                {tracking.map((step, idx) => (
                  <div key={step.id || idx} className="relative space-y-1">
                    {/* Timeline dot */}
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-ethereal-600 shadow-2xs"></span>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {step.status_update?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {step.notes && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        {step.notes}
                      </p>
                    )}

                    {step.updated_by_name && (
                      <p className="text-[10px] text-slate-400">
                        Logged by: <span className="font-semibold text-slate-600">{step.updated_by_name}</span> ({step.updated_by_role})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

