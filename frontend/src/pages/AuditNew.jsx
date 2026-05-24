import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAudit, getWorkers, getProjects } from '../lib/api.js';
import { CHECKLIST_ITEMS, PERMIT_ITEMS, AUDIT_TYPES } from '../lib/checklists.js';

export default function AuditNew() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [inspectorName, setInspectorName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getWorkers().then(setWorkers).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  const auditType   = AUDIT_TYPES[type];
  const permitItems = PERMIT_ITEMS[type]    || [];
  const checkItems  = CHECKLIST_ITEMS[type] || [];
  const allItems    = [...permitItems, ...checkItems];

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
        items: allItems.map(i => ({ ...i, status: 'pending' }))
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
      <div className="flex gap-3 mb-6 text-sm text-gray-500">
        <span>📋 {permitItems.length} אישורים נדרשים</span>
        <span>·</span>
        <span>🔍 {checkItems.length} סעיפי בקרה</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם המפקח / יועץ הבטיחות</label>
            <select required value={inspectorName} onChange={e => setInspectorName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">בחר מפקח...</option>
              {workers.map(w => (
                <option key={w.id} value={`${w.first_name} ${w.last_name}`}>{w.first_name} {w.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">פרויקט</label>
            <select value={projectName} onChange={e => setProjectName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">בחר פרויקט...</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>
              ))}
            </select>
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
