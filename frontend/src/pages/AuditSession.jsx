import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuditItems, updateAuditItem, closeAudit } from '../lib/api.js';
import SafetyCheckItem from '../components/SafetyCheckItem.jsx';

export default function AuditSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    getAuditItems(id).then(setItems).finally(() => setLoading(false));
  }, [id]);

  const done   = items.filter(i => i.status !== 'pending').length;
  const fails  = items.filter(i => i.status === 'fail').length;
  const passes = items.filter(i => i.status === 'pass').length;
  const pct    = items.length ? Math.round((done / items.length) * 100) : 0;

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

      {/* Items */}
      <div className="space-y-1">
        {items.map(item => (
          <SafetyCheckItem key={item.id} item={item} auditId={id} onUpdate={handleUpdate} />
        ))}
      </div>

      {/* Close audit */}
      {done === items.length && items.length > 0 && (
        <button
          onClick={handleClose}
          disabled={closing}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {closing ? 'סוגר...' : '✔ סיים וסגור בקרה'}
        </button>
      )}
    </div>
  );
}
