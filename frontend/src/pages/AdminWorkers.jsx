import React, { useEffect, useState } from 'react';
import { getWorkers, addWorker, updateWorker, deleteWorker } from '../lib/api.js';

const EMPTY = { first_name: '', last_name: '', id_number: '', google_email: '', has_height_clearance: false, last_training_date: '' };

function accessStatus(worker) {
  if (!worker.last_training_date) return { label: 'ללא הדרכה', color: 'bg-red-100 text-red-700' };
  const days = Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000);
  return days <= 365
    ? { label: `מורשה (${days} ימים)`, color: 'bg-green-100 text-green-700' }
    : { label: `נדחה (${days} ימים)`, color: 'bg-red-100 text-red-700' };
}

function toDateInput(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

export default function AdminWorkers() {
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);   // null = closed, 0 = new
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setWorkers(await getWorkers()); } finally { setLoading(false); }
  }

  function openNew() {
    setForm(EMPTY);
    setEditId(0);
    setError('');
  }

  function openEdit(w) {
    setForm({ ...w, last_training_date: toDateInput(w.last_training_date), google_email: w.google_email || '' });
    setEditId(w.id);
    setError('');
  }

  function closeForm() { setEditId(null); setError(''); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId === 0) {
        await addWorker(form);
      } else {
        await updateWorker(editId, form);
      }
      await load();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteWorker(id);
      setConfirmDel(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ניהול עובדים והרשאות כניסה</h1>
          <p className="text-sm text-gray-500 mt-0.5">בקרת גישה לאתר — Google ו-תעודת זהות</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
          + הוסף עובד
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {/* Workers table */}
      {!loading && (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {workers.map(w => {
              const st = accessStatus(w);
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{w.first_name} {w.last_name}</p>
                      <p className="text-xs text-gray-400">ת.ז. {w.id_number}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                    {w.google_email && <p>📧 {w.google_email}</p>}
                    <p>{w.has_height_clearance ? '✅ אישור עבודה בגובה' : '❌ ללא אישור גובה'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(w)}
                      className="flex-1 border border-blue-300 text-blue-700 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition">
                      עריכה
                    </button>
                    <button onClick={() => setConfirmDel(w)}
                      className="flex-1 border border-red-300 text-red-600 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition">
                      מחיקה
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right">שם</th>
                  <th className="px-4 py-3 text-right">ת.ז.</th>
                  <th className="px-4 py-3 text-right">אימייל Google</th>
                  <th className="px-4 py-3 text-right">גובה</th>
                  <th className="px-4 py-3 text-right">הדרכה אחרונה</th>
                  <th className="px-4 py-3 text-right">סטטוס</th>
                  <th className="px-4 py-3 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.map(w => {
                  const st = accessStatus(w);
                  return (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{w.first_name} {w.last_name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{w.id_number}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{w.google_email || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-center">{w.has_height_clearance ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-gray-500">{w.last_training_date ? new Date(w.last_training_date).toLocaleDateString('he-IL') : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(w)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium transition">עריכה</button>
                          <button onClick={() => setConfirmDel(w)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium transition">מחיקה</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {workers.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">אין עובדים רשומים</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'הוסף עובד חדש' : 'עריכת עובד'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם פרטי *</label>
                  <input required value={form.first_name} onChange={e => f('first_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם משפחה *</label>
                  <input required value={form.last_name} onChange={e => f('last_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תעודת זהות *</label>
                <input required value={form.id_number} onChange={e => f('id_number', e.target.value)}
                  inputMode="numeric" maxLength={9} placeholder="9 ספרות"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">אימייל Google (לכניסה)</label>
                <input type="email" value={form.google_email} onChange={e => f('google_email', e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">ריק = אין כניסה עם Google</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך הדרכת בטיחות אחרונה</label>
                <input type="date" value={form.last_training_date} onChange={e => f('last_training_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">תוקף: 365 יום מתאריך זה</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.has_height_clearance} onChange={e => f('has_height_clearance', e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">אישור עבודה בגובה</span>
              </label>

              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  ביטול
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת עובד</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.first_name} {confirmDel.last_name}</strong>?<br/>פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button onClick={() => handleDelete(confirmDel.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
