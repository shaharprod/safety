import React, { useEffect, useState } from 'react';
import { getWorkers, addWorker, updateWorker, deleteWorker, getUsers, addUser, updateUser, deleteUser } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { downloadCsv } from '../lib/csv.js';

function exportWorkers(workers) {
  const headers = ['שם פרטי', 'שם משפחה', 'תעודת זהות', 'אימייל Google', 'אישור גובה', 'הדרכה אחרונה', 'ימים מהדרכה'];
  const rows = workers.map(w => {
    const days = w.last_training_date
      ? Math.floor((Date.now() - new Date(w.last_training_date).getTime()) / 86_400_000)
      : '';
    return [
      w.first_name, w.last_name, w.id_number,
      w.google_email || '',
      w.has_height_clearance ? 'כן' : 'לא',
      w.last_training_date ? new Date(w.last_training_date).toLocaleDateString('he-IL') : '',
      days,
    ];
  });
  downloadCsv(`עובדים_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

const EMPTY_WORKER = { first_name: '', last_name: '', id_number: '', google_email: '', has_height_clearance: false, last_training_date: '' };
const EMPTY_USER   = { username: '', password: '', full_name: '', role: 'foreman' };

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

const ROLE_LABELS = { foreman: 'מנהל עבודה', safety_officer: 'ממונה בטיחות' };

// ── Workers tab ──────────────────────────────────────────────────────────────
function WorkersTab() {
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_WORKER);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setWorkers(await getWorkers()); } finally { setLoading(false); }
  }

  function openNew() { setForm(EMPTY_WORKER); setEditId(0); setError(''); }
  function openEdit(w) {
    setForm({ ...w, last_training_date: toDateInput(w.last_training_date), google_email: w.google_email || '' });
    setEditId(w.id); setError('');
  }
  function closeForm() { setEditId(null); setError(''); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId === 0) await addWorker(form);
      else await updateWorker(editId, form);
      await load(); closeForm();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteWorker(id); setConfirmDel(null); await load(); } catch (err) { setError(err.message); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-sm text-gray-500">בקרת גישה לאתר — Google ו-תעודת זהות</p>
        <div className="flex gap-2">
          <button onClick={() => exportWorkers(workers)} disabled={!workers.length}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition">
            📊 Sheets
          </button>
          <button onClick={openNew}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            + הוסף עובד
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && (
        <>
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
                    <button onClick={() => openEdit(w)} className="flex-1 border border-blue-300 text-blue-700 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition">עריכה</button>
                    <button onClick={() => setConfirmDel(w)} className="flex-1 border border-red-300 text-red-600 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition">מחיקה</button>
                  </div>
                </div>
              );
            })}
          </div>

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
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(w)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">עריכה</button>
                          <button onClick={() => setConfirmDel(w)} className="text-red-500 hover:text-red-700 text-xs font-medium">מחיקה</button>
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

      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 pb-safe" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'הוסף עובד חדש' : 'עריכת עובד'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם פרטי *</label>
                  <input required value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם משפחה *</label>
                  <input required value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תעודת זהות *</label>
                <input required value={form.id_number} onChange={e => f('id_number', e.target.value)} inputMode="numeric" maxLength={9} placeholder="9 ספרות" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">אימייל Google (לכניסה)</label>
                <input type="email" value={form.google_email} onChange={e => f('google_email', e.target.value)} placeholder="name@gmail.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">ריק = אין כניסה עם Google</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תאריך הדרכת בטיחות אחרונה</label>
                <input type="date" value={form.last_training_date} onChange={e => f('last_training_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-0.5">תוקף: 365 יום מתאריך זה</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.has_height_clearance} onChange={e => f('has_height_clearance', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">אישור עבודה בגובה</span>
              </label>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת עובד</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.first_name} {confirmDel.last_name}</strong>?<br/>פעולה זו אינה ניתנת לביטול.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button onClick={() => handleDelete(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Users tab (safety_officer only) ─────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_USER);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const { user: me } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await getUsers()); } finally { setLoading(false); }
  }

  function openNew() { setForm(EMPTY_USER); setEditId(0); setError(''); }
  function openEdit(u) { setForm({ username: u.username, full_name: u.full_name, role: u.role, password: '' }); setEditId(u.id); setError(''); }
  function closeForm() { setEditId(null); setError(''); }

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId === 0) await addUser(form);
      else await updateUser(editId, { full_name: form.full_name, role: form.role, ...(form.password ? { password: form.password } : {}) });
      await load(); closeForm();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteUser(id); setConfirmDel(null); await load(); } catch (err) { setError(err.message); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">ניהול משתמשי המערכת וההרשאות שלהם</p>
        <button onClick={openNew} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + הוסף משתמש
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right">שם משתמש</th>
                <th className="px-4 py-3 text-right">שם מלא</th>
                <th className="px-4 py-3 text-right">תפקיד</th>
                <th className="px-4 py-3 text-right">נוצר</th>
                <th className="px-4 py-3 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{u.username}</td>
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'safety_officer' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString('he-IL') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">עריכה</button>
                      {u.id !== me?.id && (
                        <button onClick={() => setConfirmDel(u)} className="text-red-500 hover:text-red-700 text-xs font-medium">מחיקה</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">אין משתמשים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 pb-safe" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'הוסף משתמש חדש' : 'עריכת משתמש'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              {editId === 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">שם משתמש *</label>
                  <input required value={form.username} onChange={e => f('username', e.target.value)} placeholder="כניסה למערכת" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
                <input required value={form.full_name} onChange={e => f('full_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד *</label>
                <select required value={form.role} onChange={e => f('role', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="foreman">מנהל עבודה</option>
                  <option value="safety_officer">ממונה בטיחות</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{editId === 0 ? 'סיסמה *' : 'סיסמה חדשה (ריק = ללא שינוי)'}</label>
                <input type="password" required={editId === 0} value={form.password} onChange={e => f('password', e.target.value)} placeholder={editId === 0 ? 'הכנס סיסמה' : 'השאר ריק לאי-שינוי'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                  {saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת משתמש</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.full_name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button onClick={() => handleDelete(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminWorkers() {
  const { isRole } = useAuth();
  const [tab, setTab] = useState('workers');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול אדמין</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('workers')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === 'workers' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          👷 עובדים
        </button>
        {isRole('safety_officer') && (
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === 'users' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            👤 משתמשים
          </button>
        )}
      </div>

      {tab === 'workers' && <WorkersTab />}
      {tab === 'users' && isRole('safety_officer') && <UsersTab />}
    </div>
  );
}
