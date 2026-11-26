import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileText,
  AlertTriangle,
  BadgeAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [activeTab, setActiveTab] = useState('orgs'); // 'orgs' | 'users' | 'reports'
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [statsRes, orgsRes, usersRes, reportsRes] = await Promise.all([
        api.get('/api/v1/admin/stats'),
        api.get('/api/v1/organizations?limit=20'),
        api.get('/api/v1/admin/users?limit=20'),
        api.get('/api/v1/admin/reports?limit=20'),
      ]);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      if (orgsRes.data?.data?.organizations) {
        setOrganizations(orgsRes.data.data.organizations);
      }
      if (usersRes.data?.data?.users) {
        setUsersList(usersRes.data.data.users);
      }
      if (reportsRes.data?.data?.reports) {
        setReportsList(reportsRes.data.data.reports);
      }
    } catch (err) {
      console.warn('Admin data load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyOrg = async (orgId, shouldVerify) => {
    setVerifyingId(orgId);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/verify`, {
        verified: shouldVerify,
      });
      setFeedback(`Organization verification status updated.`);
      await loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      
      {/* Admin Title Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/80 shadow-ethereal">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ResQ System Operations
          </h1>
          <p className="text-sm text-slate-500">
            Real-time analytics and management backed by PostgreSQL PostGIS spatial cluster and RabbitMQ AMQP broker.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Synchronize Live Data</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 6 Real Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Reports</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_reports ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Reported cases</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Dispatch</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats?.pending_reports ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Unassigned</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Active Rescues</p>
          <p className="text-2xl font-black text-sky-700 mt-1">{stats?.active_rescues ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Field operations</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Rescued Lives</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.rescued_count ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Safely healed</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Registered NGOs</p>
          <p className="text-2xl font-black text-purple-800 mt-1">{stats?.total_organizations ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active shelters</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/80">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ethereal-700">Total Users</p>
          <p className="text-2xl font-black text-ethereal-900 mt-1">{stats?.total_users ?? '—'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Citizens & staff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('orgs')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'orgs'
              ? 'bg-ethereal-100 text-ethereal-900 border border-ethereal-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Shelter Verification ({organizations.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-ethereal-100 text-ethereal-900 border border-ethereal-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          All Distress Reports ({reportsList.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-ethereal-100 text-ethereal-900 border border-ethereal-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Users Registry ({usersList.length})
        </button>
      </div>

      {/* Tab Content: Organizations Management */}
      {activeTab === 'orgs' && (
        <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal overflow-x-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Partner Animal Welfare Shelters</h3>
            <span className="text-xs text-slate-500">Live PostGIS location coordinates and audit status</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Shelter Name</th>
                <th className="pb-3 font-semibold">Reg. Number</th>
                <th className="pb-3 font-semibold">Contact</th>
                <th className="pb-3 font-semibold">Radius</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">
                    {org.name}
                    <span className="block text-[11px] text-slate-400 font-normal">{org.address_text}</span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-600">{org.registration_number || 'N/A'}</td>
                  <td className="py-3.5 text-slate-600">
                    <p>{org.contact_phone}</p>
                    <p className="text-[11px] text-slate-400">{org.contact_email}</p>
                  </td>
                  <td className="py-3.5 font-medium text-slate-700">{org.operational_radius_km} km</td>
                  <td className="py-3.5">
                    {org.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    {org.is_verified ? (
                      <button
                        onClick={() => handleVerifyOrg(org.id, false)}
                        disabled={verifyingId === org.id}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyOrg(org.id, true)}
                        disabled={verifyingId === org.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        {verifyingId === org.id ? 'Verifying...' : 'Approve NGO'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: All Reports */}
      {activeTab === 'reports' && (
        <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal overflow-x-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">All Recorded Distress Reports</h3>
            <span className="text-xs text-slate-500">PostgreSQL spatial database entries</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Animal</th>
                <th className="pb-3 font-semibold">Severity</th>
                <th className="pb-3 font-semibold">Condition</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {reportsList.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 capitalize">
                    {rep.animal_type}
                    {rep.breed && <span className="block text-[11px] text-slate-400 font-normal">{rep.breed}</span>}
                  </td>
                  <td className="py-3.5">
                    <SeverityBadge severity={rep.severity_level} />
                  </td>
                  <td className="py-3.5 text-slate-700 max-w-[240px] truncate" title={rep.condition_description}>
                    {rep.condition_description}
                  </td>
                  <td className="py-3.5 text-slate-600 max-w-[180px] truncate" title={rep.address_text}>
                    {rep.address_text || 'Delhi Coordinates'}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={rep.status} size="xs" />
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      to={`/reports/${rep.id}`}
                      className="text-xs font-bold text-ethereal-800 hover:text-ethereal-950"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-ethereal overflow-x-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Registered Platform Users</h3>
            <span className="text-xs text-slate-500">Role-based access credentials (JWT RBAC)</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Account Status</th>
                <th className="pb-3 font-semibold">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">
                    {u.full_name}
                    <span className="block text-[11px] text-slate-400 font-normal">{u.email}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      u.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                      u.role === 'org_admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'rescuer' ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-600 font-mono text-[11px]">{u.phone || '—'}</td>
                  <td className="py-3.5">
                    {u.is_active ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    ) : (
                      <span className="text-slate-400">Inactive</span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-400 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

