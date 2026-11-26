import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { StatusBadge, SeverityBadge } from '../components/StatusBadge';
import { 
  ShieldAlert, 
  MapPin, 
  Activity, 
  ArrowRight, 
  HeartHandshake, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Clock, 
  Navigation,
  PhoneCall,
  Search
} from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, orgsRes] = await Promise.all([
          api.get('/api/v1/reports?limit=4'),
          api.get('/api/v1/organizations?limit=3'),
        ]);

        if (reportsRes.data?.data?.reports) {
          setRecentReports(reportsRes.data.data.reports);
        }
        if (orgsRes.data?.data?.organizations) {
          setOrganizations(orgsRes.data.data.organizations);
        }
      } catch (err) {
        console.warn('Landing data fetch note:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ethereal-100/90 border border-ethereal-200 text-ethereal-900 text-xs font-semibold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-ethereal-600 animate-pulse"></span>
              Emergency Stray Rescue Network Active
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              From <span className="text-rose-600 font-serif italic">Distress</span> to <span className="text-ethereal-700 font-serif italic">Rescue</span> in Minutes.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
              Every second matters when an animal is in distress. ResQ bridges compassionate citizens with the nearest equipped animal welfare NGOs using real-time PostGIS proximity dispatch.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-base shadow-lg shadow-rose-600/20 hover:shadow-xl hover:shadow-rose-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Report Injured Animal</span>
              </Link>
              <Link
                to="/dashboard/citizen"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl glass-card hover:bg-white text-slate-800 font-semibold text-base border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all"
              >
                <span>Track Rescue Case</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/60 max-w-lg">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">100%</p>
                <p className="text-xs text-slate-500 font-medium">Free & Non-Profit</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-ethereal-800">20 km</p>
                <p className="text-xs text-slate-500 font-medium">Auto Spatial Radius</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">&lt; 15 min</p>
                <p className="text-xs text-slate-500 font-medium">Avg Response Goal</p>
              </div>
            </div>
          </div>

          {/* Right Visual: High-Impact Ethereal Card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-ethereal-300/40 via-amber-100/30 to-emerald-200/30 rounded-3xl blur-2xl -z-10"></div>
            
            <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-ethereal-lg relative overflow-hidden border border-white/80">
              
              {/* Emotional Rescue Photo */}
              <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80"
                  alt="Rescued dog recovering"
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Rescue Case
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Case #99999999 • Delhi NCR</p>
                  <p className="text-base font-bold leading-tight">Indie stray pup recovering at Friendicoes Sanctuary</p>
                </div>
              </div>

              {/* Sub-card Dispatch Status */}
              <div className="mt-4 p-4 rounded-xl bg-ethereal-50/90 border border-ethereal-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ethereal-600 text-white flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Spatial Proximity Engine</p>
                    <p className="text-[11px] text-slate-500">PostGIS GiST indexing matching nearest NGO</p>
                  </div>
                </div>
                <StatusBadge status="rescued" size="xs" />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. HOW RESQ WORKS (4-STAGE PIPELINE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-ethereal-700">The Lifecycle</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Distress Turns into Life-Saving Action
          </h2>
          <p className="text-base text-slate-600">
            A reliable, four-step event-driven pipeline designed for rapid turnaround in critical situations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="glass-card glass-card-hover p-6 rounded-2xl relative text-left space-y-4 border border-white/80">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Instant Report</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A citizen discovers an injured stray, inputs GPS location, severity level, condition description, and photo.
            </p>
            <span className="text-xs font-semibold text-rose-700 inline-flex items-center gap-1">
              POST /reports • ST_MakePoint
            </span>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl relative text-left space-y-4 border border-white/80">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Proximity Match</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              RabbitMQ topic exchange emits domain event. PostGIS calculates nearest authorized shelters within operating radius.
            </p>
            <span className="text-xs font-semibold text-purple-700 inline-flex items-center gap-1">
              RabbitMQ: report.created
            </span>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl relative text-left space-y-4 border border-white/80">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Shelter Dispatch</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Shelter reviews distress alert and accepts case with atomic concurrency. Field ambulance is dispatched immediately.
            </p>
            <span className="text-xs font-semibold text-sky-700 inline-flex items-center gap-1">
              rescue.assigned • In-transit
            </span>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl relative text-left space-y-4 border border-white/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              04
            </div>
            <h3 className="text-lg font-bold text-slate-900">4. Recovery & Care</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Rescuer treats animal, logs real-time audit updates, and marks case as rescued. Citizen receives live notification.
            </p>
            <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
              rescue.completed • Healed
            </span>
          </div>

        </div>
      </section>

      {/* 3. LIVE RESCUE FEED (REAL DATA FROM BACKEND) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ethereal-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Feed
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Recent Animal Distress Cases
            </h2>
            <p className="text-sm text-slate-600">
              Actual database records synchronized across our microservices.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 text-sm font-bold text-ethereal-700 hover:text-ethereal-800"
          >
            <span>Report a new case</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-2xl">
            <p className="text-slate-500">No distress reports recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentReports.map((report) => (
              <div 
                key={report.id}
                className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col justify-between text-left space-y-4 border border-white/80"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {report.animal_type}
                    </span>
                    <SeverityBadge severity={report.severity_level} />
                  </div>

                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                    {report.condition_description}
                  </p>

                  <div className="flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{report.address_text || 'Delhi Coordinates'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <StatusBadge status={report.status} size="xs" />
                  <Link
                    to={`/reports/${report.id}`}
                    className="text-xs font-semibold text-ethereal-700 hover:text-ethereal-900"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. PARTNER ORGANIZATIONS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl glass-card border border-white/90 shadow-ethereal text-left space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-ethereal-700">Verified Shelters</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Partner Animal Welfare Organizations
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Equipped veterinary shelters connected to our API to respond to distress alerts in Delhi NCR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div 
                key={org.id} 
                className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-ethereal-100 text-ethereal-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {org.is_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Verified NGO
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Pending Audit
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">{org.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{org.address_text}</p>
                
                <div className="pt-2 text-xs text-slate-600 flex items-center justify-between border-t border-slate-100">
                  <span>Radius: {org.operational_radius_km} km</span>
                  <span className="font-semibold text-ethereal-700">{org.contact_phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CLOSING EMOTIONAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-tr from-ethereal-950 via-slate-900 to-ethereal-900 text-white p-10 sm:p-16 overflow-hidden text-center space-y-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-ethereal-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif italic max-w-2xl mx-auto">
            "The greatness of a nation can be judged by the way its animals are treated."
          </h2>

          <p className="text-base text-slate-300 max-w-xl mx-auto font-normal">
            Whether you are a college student walking to class or a driver on the ring road, if you spot an animal in distress, don't look away. Report in 30 seconds.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Report an Animal Now
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/20 transition-all"
            >
              Join as Volunteer Rescuer
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

