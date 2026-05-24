import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuditItems, updateAuditItem, closeAudit } from '../lib/api.js';
import { PERMIT_CATEGORIES } from '../lib/checklists.js';
import SafetyCheckItem from '../components/SafetyCheckItem.jsx';

export default function AuditSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [closing,     setClosing]     = useState(false);
  const [showPermits, setShowPermits] = useState(true);

  useEffect(() => {
    getAuditItems(id).then(setItems).finally(() => setLoading(false));
  }, [id]);

  const permitItems = items.filter(i => PERMIT_CATEGORIES.has(i.category));
  const checkItems  = items.filter(i => !PERMIT_CATEGORIES.has(i.category));

  const donePermits = permitItems.filter(i => i.status !== 'pending').length;
  const doneChecks  = checkItems.filter(i => i.status !== 'pending').length;
  const done        = items.filter(i => i.status !== 'pending').length;
  const fails       = items.filter(i => i.status === 'fail').length;
  const passes      = items.filter(i => i.status === 'pass').length;
  const pct         = items.length ? Math.round((done / items.length) * 100) : 0;

  async function handleUpdate(itemId, formData) {
    const updated = await updateAuditItem(id, itemId, formData);
    setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
  }

  async function handleClose() {
    setClosing(true);
    await closeAudit(id);
    navigate('/audits');
  }

  if (loading) return <p className="text-center text-gray-400 py-10">טוען...</p>;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">התקדמות: {done}/{items.length} סעיפים</span>
          <span className="text-sm font-bold text-blue-700">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">✓ {passes} תקין</span>
          <span className="text-red-600 font-medium">✗ {fails} ליקוי</span>
          <span className="text-gray-400">{items.length - done} ממתינים</span>
        </div>
      </div>

      {/* ── Permits / Approvals section ───────────────────────────────── */}
      {permitItems.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setShowPermits(p => !p)}
            className="w-full flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-2 text-right"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-amber-900">אישורים ונהלים מוקדמים</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                donePermits === permitItems.length
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {donePermits}/{permitItems.length}
              </span>
              <span className="text-amber-600 text-xs">{showPermits ? '▲' : '▼'}</span>
            </div>
          </button>

          {showPermits && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-xs text-amber-700 mb-3 px-1">
                ודא שכל ההיתרים, הנהלים והתיעוד הנדרשים קיימים ובתוקף לפני תחילת הבקרה.
              </p>
              {permitItems.map((item, idx) => (
                <SafetyCheckItem
                  key={item.id}
                  item={item}
                  auditId={id}
                  onUpdate={handleUpdate}
                  num={idx + 1}
                  variant="permit"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Checklist items ───────────────────────────────────────────── */}
      {checkItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="font-semibold text-gray-700">סעיפי הבקרה</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              doneChecks === checkItems.length
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {doneChecks}/{checkItems.length}
            </span>
          </div>
          <div className="space-y-1">
            {checkItems.map((item, idx) => (
              <SafetyCheckItem
                key={item.id}
                item={item}
                auditId={id}
                onUpdate={handleUpdate}
                num={idx + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Close audit */}
      {done === items.length && items.length > 0 && (
        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {closing ? 'סוגר...' : '✔ סיים וסגור בקרה'}
        </button>
      )}
    </div>
  );
}
