import React from 'react';
import { HeartHandshake, PhoneCall, ShieldCheck, MapPin, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ethereal-700 to-ethereal-500 flex items-center justify-center text-white shadow-glow-emerald">
                <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Res<span className="text-ethereal-400 font-serif italic">Q</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every second matters. Every life counts. An intelligent geospatial animal rescue coordination network connecting compassionate citizens with equipped veterinary shelters.
            </p>
            <div className="flex items-center gap-2 text-xs text-ethereal-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Animal Emergency Dispatch Active
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors">
                  Report Injured Animal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  NGO Portal Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">
                  Join as Volunteer Rescuer
                </Link>
              </li>
              <li>
                <Link to="/dashboard/citizen" className="hover:text-emerald-400 transition-colors">
                  Track Your Rescue Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Animal Welfare Guidance */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">
              First Aid Protocols
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Keep distressed animal warm and shaded.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Do not force feed or hydrate unconscious animals.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Maintain safe perimeter from traffic hazards.</span>
              </li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100 mb-4">
              Emergency Hotlines
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>National Stray Helpline</span>
              </div>
              <p className="text-lg font-bold text-white tracking-wide">
                +91 11 2431 4987
              </p>
              <p className="text-xs text-slate-400">
                Direct hotline to Delhi NCR partner shelters
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ResQ Platform. All rights reserved. Capstone Evaluation Edition.</p>
          <div className="flex items-center gap-6">
            <span>Powered by PostgreSQL + PostGIS & RabbitMQ</span>
            <span>REST API v1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

