import React from 'react';

export function StatusBadge({ status, size = 'sm' }) {
  const norm = (status || '').toLowerCase().trim();

  const configs = {
    reported: {
      label: 'Reported',
      bg: 'bg-slate-100/90 text-slate-700 border-slate-200/80',
      dot: 'bg-slate-400',
    },
    matching: {
      label: 'Matching',
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500 animate-pulse',
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500 animate-ping',
    },
    rescued: {
      label: 'Rescued',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    closed: {
      label: 'Resolved',
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-teal-500',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-400',
    },
  };

  const current = configs[norm] || {
    label: norm || 'Unknown',
    bg: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'md' 
    ? 'px-3.5 py-1.5 text-sm' 
    : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${sizeClasses} tracking-wide backdrop-blur-sm shadow-2xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const norm = (severity || '').toLowerCase().trim();

  const configs = {
    critical: { label: 'Critical', bg: 'bg-rose-100/90 text-rose-800 border-rose-200' },
    high: { label: 'High', bg: 'bg-orange-100/90 text-orange-800 border-orange-200' },
    medium: { label: 'Medium', bg: 'bg-amber-100/80 text-amber-800 border-amber-200' },
    low: { label: 'Low', bg: 'bg-emerald-100/80 text-emerald-800 border-emerald-200' },
  };

  const current = configs[norm] || configs.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${current.bg}`}>
      {current.label}
    </span>
  );
}

