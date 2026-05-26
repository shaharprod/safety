import React, { useEffect, useState } from 'react';
import { getPermits, addPermit, updatePermit, deletePermit } from '../lib/api.js';
import { useCanWrite } from '../lib/permissions.js';

const PERMIT_TYPES = [
  { value: 'היתר בנייה',        icon: '🏗️' },
  { value: 'אישור כיבוי אש',    icon: '🔥' },
  { value: 'אישור חשמל',        icon: '⚡' },
  { value: 'היתר עבודה בגובה',  icon: '🪜' },
  { value: 'אישור בדיקת מנוף',  icon: '🏗️' },
  { value: 'אישור ביטוח',       icon: '📋' },
  { value: 'אישור סביבתי',      icon: '🌿' },
  { value: 'אחר',               icon: '📄' },
];

const TYPE_ICON = Object.fromEntries(PERMIT_TYPES.map(t => [t.value, t.icon]));

const EMPTY = { title: '', permit_type: '', issuing_authority: '', issue_date: '', expiry_date: '', document_url: '', notes: '' };

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86_400_000);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function StatusBadge({ expiry_date }) {
  const d = daysUntil(expiry_date);
  if (d === null)  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ללא תאריך</span>;
  if (d < 0)       return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">פג תוקף</span>;
  if (d <= 30)     return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">⚠ פג בעוד {d}י׳</span>;
  if (d <= 90)     return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">עוד {d} ימים</span>;
  return             <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ עוד {d} ימים</span>;
}

const TABS = [
  { key: 'all',     label: 'הכל' },
  { key: 'valid',   label: 'בתוקף' },
  { key: 'soon',    label: 'פג בקרוב' },
  { key: 'expired', label: 'פג תוקף' },
];

export default function Permits() {
  const canWrite = useCanWrite();
  const [permits, setPermits]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setPermits(await getPermits()); } finally { setLoading(false); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function openNew() {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  }
  function openEdit(p) {
    setEditing(p);
    setForm({
      title:             p.title || '',
      permit_type:       p.permit_type || '',
      issuing_authority: p.issuing_authority || '',
      issue_date:        p.issue_date  ? p.issue_date.slice(0, 10)  : '',
      expiry_date:       p.expiry_date ? p.expiry_date.slice(0, 10) : '',
      document_url:      p.document_url || '',
      notes:             p.notes || '',
    });
    setError(''); setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      editing ? await updatePermit(editing.id, form) : await addPermit(form);
      setShowModal(false); setEditing(null); setForm(EMPTY);
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    await deletePermit(id);
    setConfirmDel(null);
    setPermits(prev => prev.filter(p => p.id !== id));
  }

  function printAllPermits() {
    const fmt = d => d ? new Date(d).toLocaleDateString('he-IL') : '—';
    const rows = permits.map(p => {
      const d = daysUntil(p.expiry_date);
      const statusTxt = d === null ? 'ללא תאריך' : d < 0 ? 'פג תוקף' : d <= 30 ? `פג בעוד ${d} ימים` : 'בתוקף';
      const docCell = p.document_url ? `<a href="${p.document_url}" target="_blank">פתח מסמך</a>` : '—';
      return `<tr>
        <td style="border:1px solid #ddd;padding:7px">${p.permit_type}</td>
        <td style="border:1px solid #ddd;padding:7px;font-weight:bold">${p.title}</td>
        <td style="border:1px solid #ddd;padding:7px">${p.issuing_authority || '—'}</td>
        <td style="border:1px solid #ddd;padding:7px">${fmt(p.issue_date)}</td>
        <td style="border:1px solid #ddd;padding:7px">${fmt(p.expiry_date)}</td>
        <td style="border:1px solid #ddd;padding:7px">${statusTxt}</td>
        <td style="border:1px solid #ddd;padding:7px">${docCell}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">
      <title>היתרים ואישורים</title>
      <style>body{font-family:Arial,sans-serif;direction:rtl;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:16px}th{background:#1e3a5f;color:#fff;padding:8px;border:1px solid #ddd}@media print{button{display:none}}</style>
    </head><body>
      <h1>🦺 SafetyOS — היתרים ואישורים</h1>
      <p style="font-size:13px">תאריך הדפסה: ${new Date().toLocaleDateString('he-IL')} | סה״כ: ${permits.length} היתרים</p>
      <table><thead><tr>
        <th>סוג</th><th>כותרת</th><th>רשות מנפיקה</th><th>הנפקה</th><th>תפוגה</th><th>סטטוס</th><th>מסמך</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <br><button onclick="window.print()" style="padding:10px 24px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">🖨️ הדפס</button>
    </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  }

  const total   = permits.length;
  const valid   = permits.filter(p => { const d = daysUntil(p.expiry_date); return d !== null && d > 30; }).length;
  const soon    = permits.filter(p => { const d = daysUntil(p.expiry_date); return d !== null && d >= 0 && d <= 30; }).length;
  const expired = permits.filter(p => { const d = daysUntil(p.expiry_date); return d !== null && d < 0; }).length;

  const filtered = permits.filter(p => {
    const d = daysUntil(p.expiry_date);
    if (tab === 'valid')   return d !== null && d > 30;
    if (tab === 'soon')    return d !== null && d >= 0 && d <= 30;
    if (tab === 'expired') return d !== null && d < 0;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">היתרים ואישורים</h1>
          <p className="text-sm text-gray-500 mt-0.5">רישיונות, היתרים ואישורים תקפים לאתר</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button onClick={printAllPermits}
              className="border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5">
              📥 הורד
            </button>
            <button onClick={openNew}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              + היתר חדש
            </button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { val: total,   label: 'סה״כ',      cls: 'text-blue-700',   bg: '' },
            { val: valid,   label: 'בתוקף',     cls: 'text-green-600',  bg: '' },
            { val: soon,    label: 'פג בקרוב',  cls: soon > 0 ? 'text-orange-600' : 'text-gray-400', bg: soon > 0 ? 'bg-orange-50 border-orange-200' : '' },
            { val: expired, label: 'פג תוקף',   cls: expired > 0 ? 'text-red-600' : 'text-gray-400', bg: expired > 0 ? 'bg-red-50 border-red-200' : '' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border border-gray-200 p-3 text-center ${s.bg || 'bg-white'}`}>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 py-12">טוען...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📜</div>
          <p className="font-medium">אין היתרים {tab !== 'all' ? 'בקטגוריה זו' : 'עדיין'}</p>
          {tab === 'all' && canWrite && <p className="text-sm mt-1">לחץ על "היתר חדש" להוספה</p>}
        </div>
      )}

      {/* Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(permit => {
            const icon    = TYPE_ICON[permit.permit_type] || '📄';
            const hasDoc  = permit.document_url?.trim();
            const isDel   = confirmDel === permit.id;
            const dLeft   = daysUntil(permit.expiry_date);
            const isExpired = dLeft !== null && dLeft < 0;

            return (
              <div key={permit.id}
                className={`bg-white rounded-xl border shadow-sm flex flex-col gap-0 overflow-hidden ${isExpired ? 'border-red-200' : 'border-gray-200'}`}>

                {/* Color bar */}
                <div className={`h-1 w-full ${dLeft === null ? 'bg-gray-200' : dLeft < 0 ? 'bg-red-400' : dLeft <= 30 ? 'bg-orange-400' : dLeft <= 90 ? 'bg-yellow-400' : 'bg-green-400'}`} />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Type + badges row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-base">{icon}</span>
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                          {permit.permit_type}
                        </span>
                        <StatusBadge expiry_date={permit.expiry_date} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm leading-snug">{permit.title}</h3>
                    </div>
                    {canWrite && !isDel && (
                      <div className="flex shrink-0">
                        <button onClick={() => openEdit(permit)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition text-sm">✏️</button>
                        <button onClick={() => setConfirmDel(permit.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition text-sm">🗑️</button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    {permit.issuing_authority && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>🏛️</span>
                        <span>{permit.issuing_authority}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>📅</span>
                      <span>הנפקה: {fmtDate(permit.issue_date)}</span>
                      <span className="text-gray-300">|</span>
                      <span className={dLeft !== null && dLeft < 0 ? 'text-red-600 font-semibold' : ''}>
                        תפוגה: {fmtDate(permit.expiry_date)}
                      </span>
                    </div>
                    {permit.notes && (
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{permit.notes}</p>
                    )}
                  </div>

                  {/* Spacer + doc button at bottom */}
                  <div className="mt-auto pt-1">
                    {!isDel ? (
                      hasDoc ? (
                        <button
                          onClick={() => window.open(permit.document_url, '_blank', 'noopener')}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                          📄 פתח מסמך
                        </button>
                      ) : canWrite ? (
                        <button
                          onClick={() => openEdit(permit)}
                          className="w-full py-2 rounded-xl text-xs border border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition">
                          + הוסף קישור למסמך
                        </button>
                      ) : null
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-red-700 text-center mb-2">למחוק היתר זה?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDel(null)}
                            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-xs hover:bg-white transition">
                            ביטול
                          </button>
                          <button onClick={() => handleDelete(permit.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-semibold transition">
                            מחק
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center bg-black/40 sm:px-4"
               onClick={() => setShowModal(false)}>
            <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
                 onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">{editing ? 'עריכת היתר' : 'היתר חדש'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="px-5 py-4 space-y-3 overflow-y-auto max-h-[65vh]">

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">כותרת *</label>
                    <input required value={form.title} onChange={e => f('title', e.target.value)}
                      placeholder="לדוגמה: היתר בנייה - מגדל א׳"
                      className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">סוג היתר *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PERMIT_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => f('permit_type', t.value)}
                          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs text-right transition ${
                            form.permit_type === t.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-gray-200 text-gray-600 hover:border-blue-200'
                          }`}>
                          <span>{t.icon}</span> {t.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">רשות מנפיקה</label>
                    <input value={form.issuing_authority} onChange={e => f('issuing_authority', e.target.value)}
                      placeholder="לדוגמה: הוועדה המקומית לתכנון ובנייה"
                      className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך הנפקה</label>
                      <input type="date" value={form.issue_date} onChange={e => f('issue_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך תפוגה</label>
                      <input type="date" value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">קישור למסמך</label>
                    <input type="url" value={form.document_url} onChange={e => f('document_url', e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <p className="text-[11px] text-gray-400 mt-1">קישור לקובץ ב-Google Drive, SharePoint או כל שירות ענן אחר</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">הערות</label>
                    <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="תיאור קצר..."
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>

                  {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                </div>

                <div className="px-5 pb-10 pt-3 border-t border-gray-100 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">
                    ביטול
                  </button>
                  <button type="submit" disabled={saving || !form.title || !form.permit_type}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'שומר...' : editing ? 'שמור שינויים' : 'הוסף היתר'}
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
