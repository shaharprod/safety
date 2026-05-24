import React, { useEffect, useState } from 'react';
import { getCertifications, getWorkers, addCertification, updateCertification, deleteCertification } from '../lib/api.js';

const CERT_TYPES = [
  { value: 'height',     label: 'עבודה בגובה',     icon: '🏗️' },
  { value: 'forklift',   label: 'מלגזה',            icon: '🚜' },
  { value: 'crane',      label: 'עגורן',            icon: '🏗️' },
  { value: 'first_aid',  label: 'עזרה ראשונה',      icon: '🩺' },
  { value: 'electrical', label: 'עבודה חשמלית',     icon: '⚡' },
  { value: 'hot_work',   label: 'עבודה חמה',        icon: '🔥' },
  { value: 'confined',   label: 'מרחב מוגבל',       icon: '⚠️' },
  { value: 'scaffolding',label: 'פיגומים',           icon: '🔩' },
  { value: 'welding',    label: 'ריתוך',             icon: '🔧' },
];

const CERT_MAP = Object.fromEntries(CERT_TYPES.map(t => [t.value, t]));

const EMPTY_FORM = {
  worker_id: '',
  cert_type: '',
  cert_number: '',
  issuing_authority: '',
  issue_date: '',
  expiry_date: '',
  notes: '',
};

function expiryStatus(expiry_date) {
  if (!expiry_date) return { label: 'ללא תוקף', cls: 'bg-gray-100 text-gray-500' };
  const now = new Date();
  const exp = new Date(expiry_date);
  const daysLeft = Math.ceil((exp - now) / 86_400_000);
  if (daysLeft < 0)   return { label: 'פג תוקף', cls: 'bg-red-100 text-red-700' };
  if (daysLeft <= 30) return { label: `פג בעוד ${daysLeft} י׳`, cls: 'bg-orange-100 text-orange-700' };
  if (daysLeft <= 90) return { label: `${daysLeft} ימים`, cls: 'bg-yellow-100 text-yellow-700' };
  return { label: exp.toLocaleDateString('he-IL'), cls: 'bg-green-100 text-green-700' };
}

export default function WorkerCertifications() {
  const [certs, setCerts]       = useState([]);
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterWorker, setFilterWorker] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [c, w] = await Promise.all([getCertifications(), getWorkers()]);
      setCerts(c);
      setWorkers(w);
    } finally { setLoading(false); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  }

  function openEdit(cert) {
    setEditing(cert);
    setForm({
      worker_id: cert.worker_id,
      cert_type: cert.cert_type,
      cert_number: cert.cert_number || '',
      issuing_authority: cert.issuing_authority || '',
      issue_date: cert.issue_date ? cert.issue_date.slice(0, 10) : '',
      expiry_date: cert.expiry_date ? cert.expiry_date.slice(0, 10) : '',
      notes: cert.notes || '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        await updateCertification(editing.id, form);
      } else {
        await addCertification(form);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditing(null);
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('למחוק הסמכה זו?')) return;
    await deleteCertification(id);
    setCerts(prev => prev.filter(c => c.id !== id));
  }

  const workerName = (id) => {
    const w = workers.find(w => w.id === id || w.id === Number(id));
    return w ? `${w.first_name} ${w.last_name}` : `עובד #${id}`;
  };

  const filtered = certs.filter(c =>
    (!filterWorker || String(c.worker_id) === filterWorker) &&
    (!filterType   || c.cert_type === filterType)
  );

  // Group by worker
  const grouped = {};
  filtered.forEach(c => {
    const key = c.worker_id;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  // Stats
  const now = new Date();
  const expired  = certs.filter(c => c.expiry_date && new Date(c.expiry_date) < now).length;
  const expiring = certs.filter(c => {
    if (!c.expiry_date) return false;
    const d = Math.ceil((new Date(c.expiry_date) - now) / 86_400_000);
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">הסמכות עובדים</h1>
          <p className="text-sm text-gray-500 mt-0.5">אישורי עבודה ותעודות הסמכה</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
          + הסמכה חדשה
        </button>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{certs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">סה״כ הסמכות</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${expired > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-2xl font-bold ${expired > 0 ? 'text-red-600' : 'text-gray-400'}`}>{expired}</p>
            <p className="text-xs text-gray-500 mt-0.5">פגי תוקף</p>
          </div>
          <div className={`rounded-xl border p-3 text-center ${expiring > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-2xl font-bold ${expiring > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{expiring}</p>
            <p className="text-xs text-gray-500 mt-0.5">פגים ב-30 יום</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">כל העובדים</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">כל סוגי ההסמכות</option>
          {CERT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">אין הסמכות {filterWorker || filterType ? 'התואמות לסינון' : 'עדיין'}</p>
          {!filterWorker && !filterType && <p className="text-sm mt-1">לחץ על "הסמכה חדשה" כדי להוסיף</p>}
        </div>
      )}

      {/* Grouped by worker */}
      {!loading && Object.entries(grouped).map(([wid, wCerts]) => (
        <div key={wid} className="mb-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <span className="text-base">👤</span> {workerName(wid)}
            <span className="text-xs font-normal text-gray-400">({wCerts.length} הסמכות)</span>
          </h2>
          <div className="space-y-2">
            {wCerts.map(cert => {
              const typeInfo = CERT_MAP[cert.cert_type] || { label: cert.cert_type, icon: '📄' };
              const status   = expiryStatus(cert.expiry_date);
              return (
                <div key={cert.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-gray-400">{`CERT-${String(cert.id).padStart(3,'0')}`}</span>
                      <span className="text-base">{typeInfo.icon}</span>
                      <span className="font-semibold text-gray-800 text-sm">{typeInfo.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>{status.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-3">
                      {cert.cert_number && <span>מס׳ {cert.cert_number}</span>}
                      {cert.issuing_authority && <span>מוסד: {cert.issuing_authority}</span>}
                      {cert.issue_date && <span>הונפק: {new Date(cert.issue_date).toLocaleDateString('he-IL')}</span>}
                    </div>
                    {cert.notes && <p className="text-xs text-gray-500 mt-1">{cert.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(cert)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition text-sm">✏️</button>
                    <button onClick={() => handleDelete(cert.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition text-sm">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center bg-black/40 sm:px-4"
               onClick={() => setShowForm(false)}>
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">{editing ? 'עריכת הסמכה' : 'הסמכה חדשה'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">עובד *</label>
                    <select required value={form.worker_id} onChange={e => f('worker_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">בחר עובד...</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">סוג הסמכה *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CERT_TYPES.map(t => (
                        <button key={t.value} type="button"
                          onClick={() => f('cert_type', t.value)}
                          className={`flex items-center gap-1.5 p-2.5 rounded-lg border text-xs transition ${
                            form.cert_type === t.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-gray-200 text-gray-600 hover:border-blue-200'
                          }`}>
                          <span>{t.icon}</span> {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">מספר תעודה</label>
                    <input value={form.cert_number} onChange={e => f('cert_number', e.target.value)}
                      placeholder="לא חובה"
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">גורם מוסמך / מוסד מנפיק</label>
                    <input value={form.issuing_authority} onChange={e => f('issuing_authority', e.target.value)}
                      placeholder="לא חובה"
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך הנפקה</label>
                      <input type="date" value={form.issue_date} onChange={e => f('issue_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תפוגה *</label>
                      <input type="date" required value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
                    <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>

                <div className="px-5 pt-2 pb-10 border-t border-gray-100 flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                  <button type="submit" disabled={saving || !form.cert_type}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'שומר...' : editing ? 'שמור שינויים' : 'הוסף הסמכה'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
