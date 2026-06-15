import React, { useEffect, useMemo, useState } from 'react';
import {
  getProjects, getDirectives, addDirective, updateDirective, deleteDirective,
  updateDirectiveStatus, sendProjectBriefing,
} from '../lib/api.js';
import { useCanWrite } from '../lib/permissions.js';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
  { value: 'מפגע',       icon: '⚠️' },
  { value: 'הדרכה',      icon: '🎓' },
  { value: 'ציוד',       icon: '🔧' },
  { value: 'היתר',       icon: '📜' },
  { value: 'נוהל',       icon: '📄' },
  { value: 'ארגון אתר',  icon: '🏗️' },
  { value: 'אחר',        icon: '📌' },
];
const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.value, c.icon]));

const PRIORITY = {
  low:    { label: 'נמוכה',  cls: 'bg-green-100 text-green-700' },
  medium: { label: 'בינונית', cls: 'bg-yellow-100 text-yellow-700' },
  high:   { label: 'גבוהה',  cls: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'דחוף',   cls: 'bg-red-100 text-red-700' },
};

const STATUS = {
  open:         { label: 'ממתין לטיפול',      cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  acknowledged: { label: 'בטיפול',            cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  reported:     { label: 'דווח — לאימות',     cls: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
  closed:       { label: 'נסגר',              cls: 'bg-green-100 text-green-700',    dot: 'bg-green-400' },
};

const EMPTY = { title: '', description: '', category: 'מפגע', priority: 'medium', due_date: '' };

const FORMS = [
  { title: 'טופס תיאום בטיחות', icon: '📝', href: '/docs/coordination-form.html' },
  { title: 'פרוטוקול ישיבת בטיחות', icon: '📋', href: '/docs/safety-meeting-protocol.html' },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
}
function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86_400_000);
}

export default function Coordination() {
  const canWrite = useCanWrite();
  const { user } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState('');
  const [directives, setDirectives] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busy, setBusy]           = useState(false);
  const [banner, setBanner]       = useState(null); // {type, text}

  // create/edit modal
  const [modal, setModal]   = useState(null); // null | 'new' | directive obj
  const [form, setForm]     = useState(EMPTY);
  const [error, setError]   = useState('');

  // status / briefing modals
  const [statusModal, setStatusModal] = useState(null); // {directive, action}
  const [note, setNote]               = useState('');
  const [briefMsg, setBriefMsg]       = useState('');
  const [showBrief, setShowBrief]     = useState(false);

  useEffect(() => { (async () => {
    try {
      const ps = await getProjects();
      setProjects(ps);
      if (ps.length) {
        const wanted = new URLSearchParams(window.location.search).get('project');
        const match = wanted && ps.find(p => String(p.id) === String(wanted));
        setProjectId(String(match ? match.id : ps[0].id));
      }
    } finally { setLoading(false); }
  })(); }, []);

  useEffect(() => { if (projectId) loadDirectives(); }, [projectId]);

  async function loadDirectives() {
    setDirectives(await getDirectives(projectId));
  }

  const project = useMemo(() => projects.find(p => String(p.id) === String(projectId)), [projects, projectId]);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function flash(type, text) { setBanner({ type, text }); setTimeout(() => setBanner(null), 4000); }

  function openNew() { setForm(EMPTY); setError(''); setModal('new'); }
  function openEdit(d) {
    setForm({ title: d.title, description: d.description || '', category: d.category || 'אחר',
      priority: d.priority || 'medium', due_date: d.due_date ? d.due_date.slice(0, 10) : '' });
    setError(''); setModal(d);
  }

  async function handleSave(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (modal === 'new') {
        await addDirective({ ...form, project_id: Number(projectId) });
        flash('ok', `ההנחיה נשלחה ל${project?.manager_name || 'מנהל הפרויקט'} במייל ✓`);
      } else {
        await updateDirective(modal.id, form);
      }
      setModal(null); await loadDirectives();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function advance(directive, status) {
    setBusy(true);
    try {
      await updateDirectiveStatus(directive.id, { status, note });
      setStatusModal(null); setNote('');
      flash('ok', status === 'closed' ? 'ההנחיה אומתה ונסגרה ✓' : status === 'reported' ? 'הדיווח נשלח לממונה הבטיחות ✓' : 'אישור הקבלה עודכן ✓');
      await loadDirectives();
    } catch (err) { flash('err', err.message); }
    finally { setBusy(false); }
  }

  async function handleDelete(id) {
    await deleteDirective(id); setStatusModal(null); await loadDirectives();
  }

  async function handleBriefing() {
    setBusy(true);
    try {
      const r = await sendProjectBriefing({ project_id: Number(projectId), message: briefMsg });
      setShowBrief(false); setBriefMsg('');
      flash('ok', `תדריך הבטיחות נשלח ל-${r.sentTo} ✓`);
    } catch (err) { flash('err', err.message); }
    finally { setBusy(false); }
  }

  const counts = useMemo(() => ({
    overdue: directives.filter(d => d.status !== 'closed' && daysUntil(d.due_date) !== null && daysUntil(d.due_date) < 0).length,
    open:    directives.filter(d => d.status === 'open').length,
    active:  directives.filter(d => d.status === 'acknowledged').length,
    pending: directives.filter(d => d.status === 'reported').length,
    closed:  directives.filter(d => d.status === 'closed').length,
  }), [directives]);

  const openItems   = directives.filter(d => d.status !== 'closed');
  const closedItems = directives.filter(d => d.status === 'closed');

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">תיאום בטיחות</h1>
          <p className="text-sm text-gray-500 mt-0.5">ניהול הבטיחות דרך מנהל הפרויקט — הנחיה, ביצוע ואימות</p>
        </div>
        {canWrite && project && (
          <button onClick={openNew}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0">
            + הנחיית בטיחות
          </button>
        )}
      </div>

      {banner && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${banner.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {banner.text}
        </div>
      )}

      {/* Forms quick-access */}
      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
        <p className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1.5"><span>🗂️</span> טפסי תיאום להורדה והדפסה</p>
        <div className="flex flex-wrap gap-2">
          {FORMS.map(d => (
            <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition">
              <span>{d.icon}</span> {d.title}
            </a>
          ))}
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 py-12">טוען...</p>}

      {!loading && projects.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🏗️</div>
          <p className="font-medium">אין פרוייקטים רשומים</p>
          <p className="text-sm mt-1">הוסף פרויקט במסך "פרוייקטים" כדי להתחיל בתיאום בטיחות</p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <>
          {/* Project selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">בחר פרויקט</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>)}
            </select>
          </div>

          {/* Project manager card */}
          {project && (
            <div className="mb-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">מנהל הפרויקט האחראי</p>
                  <p className="font-bold text-gray-800">👤 {project.manager_name || '— לא הוגדר'}</p>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {project.manager_phone && <p>📞 {project.manager_phone}</p>}
                    <p className={project.manager_email ? '' : 'text-red-500'}>📧 {project.manager_email || 'חסרה כתובת מייל — לא ניתן לשלוח תדריך'}</p>
                  </div>
                </div>
                {canWrite && (
                  <button onClick={() => setShowBrief(true)} disabled={!project.manager_email}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 shrink-0">
                    📧 שלח תדריך בטיחות
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stat strip */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { val: counts.overdue, label: 'באיחור',     cls: counts.overdue ? 'text-red-600' : 'text-gray-400', bg: counts.overdue ? 'bg-red-50 border-red-200' : '' },
              { val: counts.open,    label: 'ממתין',      cls: counts.open ? 'text-orange-600' : 'text-gray-400' },
              { val: counts.active + counts.pending, label: 'בטיפול', cls: 'text-blue-600' },
              { val: counts.closed,  label: 'נסגרו',      cls: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border border-gray-200 p-3 text-center ${s.bg || 'bg-white'}`}>
                <p className={`text-2xl font-bold ${s.cls}`}>{s.val}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Directives */}
          {directives.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-medium">אין הנחיות בטיחות בפרויקט זה</p>
              {canWrite && <p className="text-sm mt-1">לחץ על "הנחיית בטיחות" כדי להקצות משימה למנהל הפרויקט</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {openItems.map(d => (
                <DirectiveCard key={d.id} d={d} canWrite={canWrite} role={user?.role}
                  onEdit={openEdit} onAction={(action) => { setNote(''); setStatusModal({ directive: d, action }); }} />
              ))}
              {closedItems.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 py-2">הנחיות סגורות ({closedItems.length})</summary>
                  <div className="space-y-3 mt-2 opacity-75">
                    {closedItems.map(d => (
                      <DirectiveCard key={d.id} d={d} canWrite={canWrite} role={user?.role}
                        onEdit={openEdit} onAction={(action) => { setNote(''); setStatusModal({ directive: d, action }); }} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}

      {/* Create / edit modal */}
      {modal && (
        <Modal title={modal === 'new' ? 'הנחיית בטיחות חדשה' : 'עריכת הנחיה'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave}>
            <div className="px-5 py-4 space-y-3 overflow-y-auto max-h-[65vh]">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">נושא ההנחיה *</label>
                <input required value={form.title} onChange={e => f('title', e.target.value)}
                  placeholder="לדוגמה: גידור פתח רצפה בקומה 3"
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c.value} type="button" onClick={() => f('category', c.value)}
                      className={`flex items-center gap-1 px-2 py-2 rounded-xl border text-xs transition ${form.category === c.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-gray-200 text-gray-600 hover:border-blue-200'}`}>
                      <span>{c.icon}</span> {c.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">פירוט ודרישות</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3}
                  placeholder="מה נדרש לבצע, היכן, ולפי איזה תקן/נוהל..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">דחיפות</label>
                  <select value={form.priority} onChange={e => f('priority', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">לביצוע עד</label>
                  <input type="date" value={form.due_date} onChange={e => f('due_date', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {modal === 'new' && project?.manager_email && (
                <p className="text-[11px] text-gray-400">📧 בשמירה יישלח מייל אוטומטי ל{project.manager_name} ({project.manager_email})</p>
              )}
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            </div>
            <div className="px-5 pb-10 pt-3 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button type="submit" disabled={busy || !form.title}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {busy ? 'שומר...' : modal === 'new' ? 'הוצא הנחיה ושלח מייל' : 'שמור שינויים'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status action modal */}
      {statusModal && (
        <Modal title={
          statusModal.action === 'acknowledged' ? 'אישור קבלת הנחיה'
            : statusModal.action === 'reported' ? 'דיווח ביצוע'
            : statusModal.action === 'closed' ? 'אימות וסגירת הנחיה'
            : 'מחיקת הנחיה'
        } onClose={() => setStatusModal(null)}>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600 font-medium">{statusModal.directive.title}</p>
            {statusModal.action === 'delete' ? (
              <p className="text-sm text-gray-500">האם למחוק הנחיה זו? פעולה זו אינה ניתנת לביטול.</p>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {statusModal.action === 'reported' ? 'תיאור הביצוע (יישלח לממונה)' : statusModal.action === 'closed' ? 'הערות אימות' : 'הערה (לא חובה)'}
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder={statusModal.action === 'reported' ? 'מה בוצע בפועל...' : 'הערה...'}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            )}
          </div>
          <div className="px-5 pb-10 pt-3 border-t border-gray-100 flex gap-3">
            <button onClick={() => setStatusModal(null)}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
            {statusModal.action === 'delete' ? (
              <button onClick={() => handleDelete(statusModal.directive.id)} disabled={busy}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">מחק</button>
            ) : (
              <button onClick={() => advance(statusModal.directive, statusModal.action)} disabled={busy}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {busy ? 'שומר...' : 'אישור'}
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Briefing modal */}
      {showBrief && project && (
        <Modal title="שליחת תדריך בטיחות" onClose={() => setShowBrief(false)}>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-gray-600">יישלח אל <strong>{project.manager_name}</strong> ({project.manager_email}) תדריך מרוכז של כל הנחיות הבטיחות הפתוחות בפרויקט.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">הודעה אישית (לא חובה)</label>
              <textarea value={briefMsg} onChange={e => setBriefMsg(e.target.value)} rows={3}
                placeholder="לדוגמה: לקראת ביקורת קבלן — נא להשלים את כל הסעיפים שבאיחור עד יום ה׳."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="px-5 pb-10 pt-3 border-t border-gray-100 flex gap-3">
            <button onClick={() => setShowBrief(false)}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
            <button onClick={handleBriefing} disabled={busy}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
              {busy ? 'שולח...' : '📧 שלח תדריך'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DirectiveCard({ d, canWrite, role, onEdit, onAction }) {
  const st = STATUS[d.status] || {};
  const pr = PRIORITY[d.priority] || {};
  const dleft = daysUntil(d.due_date);
  const isLate = d.status !== 'closed' && dleft !== null && dleft < 0;
  const isOfficer = role === 'safety_officer' || role === 'admin';

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isLate ? 'border-red-200' : 'border-gray-200'}`}>
      <div className={`h-1 w-full ${st.dot || 'bg-gray-200'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-base">{CAT_ICON[d.category] || '📌'}</span>
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pr.cls}`}>{pr.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-sm leading-snug">{d.title}</h3>
          </div>
          {canWrite && d.status !== 'closed' && (
            <div className="flex shrink-0">
              <button onClick={() => onEdit(d)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition text-sm">✏️</button>
              <button onClick={() => onAction('delete')} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition text-sm">🗑️</button>
            </div>
          )}
        </div>

        {d.description && <p className="text-xs text-gray-500 leading-relaxed mb-2">{d.description}</p>}

        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-1">
          {d.due_date && <span className={isLate ? 'text-red-600 font-semibold' : ''}>📅 לביצוע עד {fmtDate(d.due_date)}{isLate ? ` (באיחור ${Math.abs(dleft)} י׳)` : ''}</span>}
          {d.assignee_name && <span>👤 {d.assignee_name}</span>}
          {d.issued_by && <span className="text-gray-400">הוצא ע״י {d.issued_by}</span>}
        </div>

        {d.report_notes && (
          <p className="text-xs bg-purple-50 text-purple-800 rounded-lg px-3 py-2 mt-2">📨 דיווח ביצוע: {d.report_notes}</p>
        )}
        {d.close_notes && (
          <p className="text-xs bg-green-50 text-green-800 rounded-lg px-3 py-2 mt-2">✓ אימות: {d.close_notes}</p>
        )}

        {/* Lifecycle actions */}
        {d.status !== 'closed' && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {d.status === 'open' && (
              <button onClick={() => onAction('acknowledged')}
                className="flex-1 min-w-[120px] border border-blue-300 text-blue-700 py-2 rounded-lg text-xs font-semibold hover:bg-blue-50 transition">
                👍 אשר קבלה / בטיפול
              </button>
            )}
            {(d.status === 'open' || d.status === 'acknowledged') && (
              <button onClick={() => onAction('reported')}
                className="flex-1 min-w-[120px] border border-purple-300 text-purple-700 py-2 rounded-lg text-xs font-semibold hover:bg-purple-50 transition">
                ✅ דווח ביצוע
              </button>
            )}
            {d.status === 'reported' && isOfficer && (
              <button onClick={() => onAction('closed')}
                className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-semibold transition">
                ✓ אמת וסגור
              </button>
            )}
            {d.status === 'reported' && !isOfficer && (
              <span className="flex-1 text-center text-xs text-gray-400 py-2">ממתין לאימות ממונה הבטיחות</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="flex min-h-full items-end sm:items-center justify-center bg-black/40 sm:px-4" onClick={onClose}>
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
