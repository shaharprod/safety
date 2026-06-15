import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, addProject, updateProject, deleteProject, getCoordinationSummary } from '../lib/api.js';
import { PROJECT_DOCS } from '../lib/subjectDocs.js';
import { useCanWrite } from '../lib/permissions.js';

const EMPTY = { name: '', location: '', start_date: '', end_date: '', manager_name: '', manager_phone: '', manager_email: '', status: 'active' };

function toDateInput(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

const STATUS_LABEL = { active: 'פעיל', completed: 'הושלם', on_hold: 'מושהה' };
const STATUS_COLOR = { active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', on_hold: 'bg-yellow-100 text-yellow-700' };

export default function Projects() {
  const canWrite = useCanWrite();
  const navigate = useNavigate();
  const [projects, setProjects]     = useState([]);
  const [coord, setCoord]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [ps, summary] = await Promise.all([
        getProjects(),
        getCoordinationSummary().catch(() => ({})),
      ]);
      setProjects(ps);
      setCoord(summary || {});
    } finally { setLoading(false); }
  }

  function CoordBadge({ id }) {
    const c = coord[id];
    const overdue = c?.overdue || 0;
    const open = c?.open_total || 0;
    return (
      <button onClick={() => navigate(`/coordination?project=${id}`)}
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
          overdue > 0 ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
            : open > 0 ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}>
        🤝 תיאום
        {open > 0 && <span className="bg-white/70 rounded-full px-1.5">{open}</span>}
        {overdue > 0 && <span className="text-red-600">⚠{overdue}</span>}
      </button>
    );
  }

  function openNew() { setForm(EMPTY); setEditId(0); setError(''); }
  function openEdit(p) {
    setForm({ ...p, start_date: toDateInput(p.start_date), end_date: toDateInput(p.end_date) });
    setEditId(p.id); setError('');
  }
  function closeForm() { setEditId(null); setError(''); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editId === 0) await addProject(form);
      else await updateProject(editId, form);
      await load(); closeForm();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteProject(id); setConfirmDel(null); await load(); }
    catch (err) { setError(err.message); }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">פרוייקטים</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניהול פרוייקטים ומנהלים אחראיים</p>
        </div>
        {canWrite && (
          <button onClick={openNew}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2">
            + פרוייקט חדש
          </button>
        )}
      </div>

      {/* Project safety documents — a detailed document per subject */}
      <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
        <p className="text-xs font-bold text-teal-800 mb-2 flex items-center gap-1.5">
          <span>📚</span> מסמכי בטיחות פרויקט
        </p>
        <div className="flex flex-wrap gap-2">
          {PROJECT_DOCS.map(d => (
            <a key={d.slug} href={d.doc} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-teal-200 text-teal-800 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition">
              <span>{d.icon}</span> {d.title}
            </a>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">📍 {p.location || '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <p>👤 {p.manager_name}</p>
                  {p.manager_phone && <p>📞 {p.manager_phone}</p>}
                  {p.manager_email && <p>📧 {p.manager_email}</p>}
                  {p.start_date && <p>🗓️ {new Date(p.start_date).toLocaleDateString('he-IL')} — {p.end_date ? new Date(p.end_date).toLocaleDateString('he-IL') : '...'}</p>}
                </div>
                <div className="mb-2"><CoordBadge id={p.id} /></div>
                {canWrite && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 border border-blue-300 text-blue-700 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition">עריכה</button>
                    <button onClick={() => setConfirmDel(p)}
                      className="flex-1 border border-red-300 text-red-600 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition">מחיקה</button>
                  </div>
                )}
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🏗️</div>
                <p className="font-medium">אין פרוייקטים רשומים</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right">שם הפרוייקט</th>
                  <th className="px-4 py-3 text-right">מיקום</th>
                  <th className="px-4 py-3 text-right">מנהל אחראי</th>
                  <th className="px-4 py-3 text-right">טלפון</th>
                  <th className="px-4 py-3 text-right">אימייל</th>
                  <th className="px-4 py-3 text-right">תאריכים</th>
                  <th className="px-4 py-3 text-right">סטטוס</th>
                  <th className="px-4 py-3 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.location || '—'}</td>
                    <td className="px-4 py-3 font-medium">{p.manager_name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.manager_phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.manager_email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.start_date ? new Date(p.start_date).toLocaleDateString('he-IL') : '—'}
                      {p.end_date ? ` — ${new Date(p.end_date).toLocaleDateString('he-IL')}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CoordBadge id={p.id} />
                        {canWrite && (
                          <>
                            <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">עריכה</button>
                            <button onClick={() => setConfirmDel(p)} className="text-red-500 hover:text-red-700 text-xs font-medium">מחיקה</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">אין פרוייקטים רשומים</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      {editId !== null && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center bg-black/40 sm:px-4"
               onClick={closeForm}>
            <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'פרוייקט חדש' : 'עריכת פרוייקט'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="px-5 py-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">שם הפרוייקט *</label>
                    <input required value={form.name} onChange={e => f('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">מיקום</label>
                    <input value={form.location} onChange={e => f('location', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך התחלה</label>
                      <input type="date" value={form.start_date} onChange={e => f('start_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">תאריך סיום</label>
                      <input type="date" value={form.end_date} onChange={e => f('end_date', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">מנהל אחראי *</label>
                    <input required value={form.manager_name} onChange={e => f('manager_name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
                      <input type="tel" value={form.manager_phone} onChange={e => f('manager_phone', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
                      <input type="email" value={form.manager_email} onChange={e => f('manager_email', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">סטטוס</label>
                    <select value={form.status} onChange={e => f('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">פעיל</option>
                      <option value="on_hold">מושהה</option>
                      <option value="completed">הושלם</option>
                    </select>
                  </div>
                  {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                </div>
                <div className="px-5 pt-2 pb-10 border-t border-gray-100 flex gap-3 mt-1">
                  <button type="button" onClick={closeForm}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                    {saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור שינויים'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת פרוייקט</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.name}</strong>?<br/>פעולה זו אינה ניתנת לביטול.</p>
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
