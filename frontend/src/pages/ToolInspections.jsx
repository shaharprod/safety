import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToolInspections, createToolInspection, getWorkers, getProjects } from '../lib/api.js';

const TOOL_TYPES = [
  { value: 'electrical',  label: 'כלים חשמליים',      icon: '⚡' },
  { value: 'hydraulic',   label: 'כלים הידראוליים',   icon: '🔩' },
  { value: 'lifting',     label: 'מתקני הרמה',         icon: '🏗️' },
  { value: 'hand_tools',  label: 'כלי יד',             icon: '🔧' },
  { value: 'pressure',    label: 'ציוד לחץ',           icon: '🅿️' },
  { value: 'pneumatic',   label: 'כלים פנאומטיים',     icon: '💨' },
];

const TYPE_MAP = Object.fromEntries(TOOL_TYPES.map(t => [t.value, t]));

const EMPTY_FORM = { tool_type: '', inspector_name: '', location: '', expiry_date: '' };

function expiryBadge(expiry_date) {
  if (!expiry_date) return null;
  const now = new Date();
  const exp = new Date(expiry_date);
  const daysLeft = Math.ceil((exp - now) / 86_400_000);
  if (daysLeft < 0)  return { label: 'פג תוקף', cls: 'bg-red-100 text-red-700' };
  if (daysLeft <= 30) return { label: `פג בעוד ${daysLeft} ימים`, cls: 'bg-orange-100 text-orange-700' };
  return { label: `תקף עד ${exp.toLocaleDateString('he-IL')}`, cls: 'bg-green-100 text-green-700' };
}

export default function ToolInspections() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [workers, setWorkers]         = useState([]);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showNew, setShowNew]         = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    load();
    getWorkers().then(setWorkers).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try { setInspections(await getToolInspections()); } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const created = await createToolInspection(form);
      setShowNew(false);
      setForm(EMPTY_FORM);
      navigate(`/tool-inspection/${created.id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">תקינות כלי עבודה</h1>
          <p className="text-sm text-gray-500 mt-0.5">בדיקות תקופתיות לפי סוג ציוד</p>
        </div>
        <button onClick={() => { setShowNew(true); setError(''); }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
          + בדיקה חדשה
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && inspections.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔧</div>
          <p className="font-medium">אין בדיקות כלים עדיין</p>
          <p className="text-sm mt-1">לחץ על "בדיקה חדשה" כדי להתחיל</p>
        </div>
      )}

      {/* Type grouping */}
      {!loading && TOOL_TYPES.map(type => {
        const group = inspections.filter(i => i.tool_type === type.value);
        if (!group.length) return null;
        return (
          <div key={type.value} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <span>{type.icon}</span> {type.label}
            </h2>
            <div className="space-y-2">
              {group.map(insp => (
                <button key={insp.id} onClick={() => navigate(`/tool-inspection/${insp.id}`)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition text-right flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-gray-400">{`TOOL-${String(insp.id).padStart(3,'0')}`}</span>
                      <p className="font-semibold text-gray-800 text-sm">{insp.inspector_name}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{insp.location || '—'}  ·  {new Date(insp.created_at).toLocaleDateString('he-IL')}</p>
                    {(() => { const b = expiryBadge(insp.expiry_date); return b ? <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${b.cls}`}>{b.label}</span> : null; })()}
                  </div>
                  <span className={`mr-2 text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                    insp.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {insp.status === 'Closed' ? 'סגורה' : 'פתוחה'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* New inspection modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">בדיקת כלים חדשה</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">סוג הציוד *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TOOL_TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => f('tool_type', t.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition ${
                        form.tool_type === t.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:border-blue-200'
                      }`}>
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שם הבודק *</label>
                <select required value={form.inspector_name} onChange={e => f('inspector_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">בחר בודק...</option>
                  {workers.map(w => (
                    <option key={w.id} value={`${w.first_name} ${w.last_name}`}>{w.first_name} {w.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">פרויקט / מיקום</label>
                <select value={form.location} onChange={e => f('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">בחר פרויקט...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תפוגת תעודה / אישור</label>
                <input type="date" value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                <button type="submit" disabled={saving || !form.tool_type}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {saving ? 'יוצר...' : 'התחל בדיקה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
