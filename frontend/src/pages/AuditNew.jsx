import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAudit } from '../lib/api.js';
import { CHECKLIST_ITEMS, AUDIT_TYPES } from '../lib/checklists.js';

export default function AuditNew() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [inspectorName, setInspectorName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auditType = AUDIT_TYPES[type];
  const items = CHECKLIST_ITEMS[type] || [];

  if (!auditType) return <p className="text-red-500 p-4">סוג בקרה לא מוכר</p>;

  async function handleStart(e) {
    e.preventDefault();
    if (!inspectorName.trim()) { setError('יש להזין שם מפקח'); return; }
    setLoading(true);
    try {
      const audit = await createAudit({
        audit_type: type,
        inspector_name: inspectorName,
        project_name: projectName,
        items: items.map(i => ({ ...i, status: 'pending' }))
      });
      navigate(`/audit/${audit.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{auditType.icon} {auditType.label}</h1>
      <p className="text-gray-500 mb-6">{items.length} סעיפים לבדיקה</p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם המפקח / יועץ הבטיחות</label>
            <input
              type="text"
              required
              value={inspectorName}
              onChange={e => setInspectorName(e.target.value)}
              placeholder="הכנס שם..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הפרויקט / מוסד</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="לדוגמה: אתר בנייה רחוב הרצל 5..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'יוצר בקרה...' : 'התחל בקרה'}
          </button>
        </form>
      </div>
    </div>
  );
}
