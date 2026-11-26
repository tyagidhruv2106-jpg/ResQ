import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  ShieldAlert, 
  MapPin, 
  Navigation, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';

export default function ReportAnimalPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    animal_type: 'dog',
    breed: '',
    severity_level: 'medium',
    condition_description: '',
    latitude: '28.5728',
    longitude: '77.2345',
    address_text: '',
    photo_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80',
  });

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedReport, setSubmittedReport] = useState(null);

  const animalOptions = [
    { value: 'dog', label: 'Dog / Stray Pup' },
    { value: 'cat', label: 'Cat / Kitten' },
    { value: 'cattle', label: 'Cattle / Cow / Bull' },
    { value: 'bird', label: 'Bird / Pigeon / Raptor' },
    { value: 'wildlife', label: 'Monkey / Wildlife' },
    { value: 'horse', label: 'Horse / Donkey' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', desc: 'Minor scratch or superficial limp', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
    { value: 'medium', label: 'Medium', desc: 'Moderate injury, stable consciousness', color: 'border-amber-300 text-amber-800 bg-amber-50' },
    { value: 'high', label: 'High', desc: 'Severe trauma, heavy bleeding or unable to stand', color: 'border-orange-300 text-orange-800 bg-orange-50' },
    { value: 'critical', label: 'Critical', desc: 'Life-threatening, unconscious or collision victim', color: 'border-rose-400 text-rose-800 bg-rose-50' },
  ];

  const photoPresets = [
    { label: 'Injured Dog', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80' },
    { label: 'Stray Kitten', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
    { label: 'Injured Bird', url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=600&q=80' },
    { label: 'Injured Cattle', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80' },
  ];

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          address_text: prev.address_text || `GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
        }));
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve GPS coordinates. Defaulting to Delhi NCR center.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.condition_description.trim()) {
      setError('Please provide a description of the animal condition.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Latitude and Longitude are required for spatial dispatch.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        animal_type: formData.animal_type,
        breed: formData.breed || null,
        condition_description: formData.condition_description.trim(),
        severity_level: formData.severity_level,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address_text: formData.address_text.trim() || 'Nearby reported GPS pin',
        photo_url: formData.photo_url || null,
      };

      const res = await api.post('/api/v1/reports', payload);
      if (res.data?.data) {
        setSubmittedReport(res.data.data);
      }
    } catch (err) {
      console.error('Report submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit report';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-800 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Report Animal in Distress</span>
      </div>

      {submittedReport ? (
        // Ethereal Confirmation Screen
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-ethereal border border-white/90">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-glow-emerald">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Distress Report Registered
            </h2>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              Your report has been securely persisted in the database and dispatched via RabbitMQ to the nearest qualified shelters.
            </p>
          </div>

          {/* Report ID chip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Unique Report ID:</span>
              <span className="font-mono text-ethereal-800 font-bold">{submittedReport.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Status:</span>
              <span className="font-bold text-amber-700 uppercase">{submittedReport.status}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Animal & Severity:</span>
              <span className="font-bold text-slate-800 uppercase">{submittedReport.animal_type} • {submittedReport.severity_level}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/reports/${submittedReport.id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-ethereal-700 hover:bg-ethereal-800 text-white font-bold text-sm shadow-md transition-all"
            >
              Track Live Rescue Status →
            </Link>
            <button
              onClick={() => {
                setSubmittedReport(null);
                setFormData((prev) => ({ ...prev, condition_description: '', address_text: '' }));
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl glass-card hover:bg-white text-slate-700 font-semibold text-sm border border-slate-200"
            >
              Report Another Animal
            </button>
          </div>
        </div>
      ) : (
        // Report Form
        <div className="glass-card rounded-3xl p-6 sm:p-10 shadow-ethereal border border-white/80 space-y-8 text-left">
          
          <div className="space-y-1.5 border-b border-slate-200/60 pb-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Emergency Dispatch Form</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Report an Injured or Distressed Stray
            </h1>
            <p className="text-sm text-slate-600">
              Please provide accurate location and condition details to assist incoming rescue teams.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Submission Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Animal Type & Breed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Animal Category *
                </label>
                <select
                  value={formData.animal_type}
                  onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-slate-800"
                  required
                >
                  {animalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Breed / Appearance (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indie Stray, Brown Coat, Pup"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Severity Level Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Severity Level *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {severityLevels.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity_level: lvl.value })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.severity_level === lvl.value
                        ? `${lvl.color} ring-2 ring-ethereal-600/30 font-bold shadow-xs`
                        : 'bg-white/70 border-slate-200/80 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider">{lvl.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{lvl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Condition Description *
              </label>
              <textarea
                rows={3}
                placeholder="Describe visible wounds, bleeding, responsiveness, nearby hazards (e.g. traffic), or specific landmarks..."
                value={formData.condition_description}
                onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium text-slate-800"
                required
              />
            </div>

            {/* Location & GPS Coordinates */}
            <div className="p-5 rounded-2xl bg-ethereal-50/70 border border-ethereal-200/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ethereal-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Incident Location (PostGIS 4326)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-ethereal-300 text-ethereal-800 hover:bg-ethereal-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Landmark / Street Address Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Moolchand Metro Station Gate 2, Ring Road, South Delhi"
                  value={formData.address_text}
                  onChange={(e) => setFormData({ ...formData, address_text: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Latitude (WGS 84)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Longitude (WGS 84)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Photo Preset / URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Photo Evidence Reference (URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono text-slate-800 mb-2"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500">Quick Test Presets:</span>
                {photoPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: preset.url })}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-ethereal-100 text-slate-700 hover:text-ethereal-900 border border-slate-200 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Publishes immediate report.created event to RabbitMQ broker</span>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Transmitting Distress Alert...' : 'Submit Emergency Report'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

