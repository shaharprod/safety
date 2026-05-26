import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../lib/api.js';

const URGENCY_CONFIG = {
  expired: {
    label: 'פג תוקף',
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    dot: '🔴',
    daysLabel: d => d <= -9999 ? 'הדרכה חסרה' : `פג לפני ${Math.abs(d)} ימים`,
  },
  soon30: {
    label: 'עד 30 יום',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-700',
    dot: '🟠',
    daysLabel: d => `פג בעוד ${d} ימים`,
  },
  soon90: {
    label: 'עד 90 יום',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: '🟡',
    daysLabel: d => `פג בעוד ${d} ימים`,
  },
};

function SummaryCard({ urgency, count }) {
  const cfg = URGENCY_CONFIG[urgency];
  const active = count > 0;
  return (
    <div className={`rounded-xl border ${active ? cfg.border : 'border-gray-200'} ${active ? cfg.bg : 'bg-white'} p-4 text-center`}>
      <div className="text-2xl mb-1">{cfg.dot}</div>
      <div className={`text-3xl font-bold ${active ? 'text-gray-800' : 'text-gray-300'}`}>{count}</div>
      <div className="text-xs text-gray-500 mt-1">{cfg.label}</div>
    </div>
  );
}

function AlertGroup({ urgency, items }) {
  const [open, setOpen] = useState(true);
  const cfg = URGENCY_CONFIG[urgency];
  const navigate = useNavigate();
  if (!items.length) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg} font-medium`}
      >
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        <span className="flex items-center gap-2">
          <span>{cfg.dot}</span>
          <span className="text-gray-800">{cfg.label}</span>
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{items.length}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3"
            >
              <button
                onClick={() => navigate(item.type === 'cert' ? '/certs' : '/admin')}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
              >
                {item.type === 'cert' ? 'הסמכות ←' : 'עובדים ←'}
              </button>

              <div className="flex-1 text-right min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.worker_name}</div>
                <div className="text-xs text-gray-500 truncate">{item.label}</div>
                <div className={`text-xs mt-0.5 ${urgency === 'expired' ? 'text-red-600' : urgency === 'soon30' ? 'text-orange-600' : 'text-yellow-700'}`}>
                  {cfg.daysLabel(item.days_left)}
                </div>
              </div>

              <span className="text-2xl shrink-0">{item.type === 'cert' ? '📋' : '🎓'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAlerts().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="text-center py-16 text-red-600">{error}</div>
  );

  if (!data) return (
    <div className="text-center py-16 text-gray-400">טוען...</div>
  );

  const { summary, items } = data;
  const total = summary.expired + summary.soon30 + summary.soon90;
  const grouped = {
    expired: items.filter(i => i.urgency === 'expired'),
    soon30:  items.filter(i => i.urgency === 'soon30'),
    soon90:  items.filter(i => i.urgency === 'soon90'),
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-5">🔔 התראות תוקף</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard urgency="expired" count={summary.expired} />
        <SummaryCard urgency="soon30"  count={summary.soon30}  />
        <SummaryCard urgency="soon90"  count={summary.soon90}  />
      </div>

      {total === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-500 font-medium">הכל תקין — אין התראות פעילות</p>
        </div>
      ) : (
        <>
          <AlertGroup urgency="expired" items={grouped.expired} />
          <AlertGroup urgency="soon30"  items={grouped.soon30}  />
          <AlertGroup urgency="soon90"  items={grouped.soon90}  />
        </>
      )}
    </div>
  );
}
