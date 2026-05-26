import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAudits } from '../lib/api.js';
import { AUDIT_TYPES } from '../lib/checklists.js';
import { downloadCsv } from '../lib/csv.js';
import { useCanWrite } from '../lib/permissions.js';

function exportAudits(audits) {
  const headers = ['#', 'סוג בקרה', 'מפקח', 'פרויקט', 'סטטוס', 'תאריך'];
  const rows = audits.map(a => [
    `AUD-${String(a.id).padStart(3,'0')}`,
    (AUDIT_TYPES[a.audit_type] || {}).label || a.audit_type,
    a.inspector_name,
    a.project_name || '',
    a.status === 'Open' ? 'פתוח' : 'הושלם',
    a.created_at ? new Date(a.created_at).toLocaleDateString('he-IL') : '',
  ]);
  downloadCsv(`בקרות_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

export default function AuditsList() {
  const canWrite = useCanWrite();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAudits().then(setAudits).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">בקרות בטיחות</h1>
        <button onClick={() => exportAudits(audits)} disabled={!audits.length}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
          📊 ייצוא Sheets
        </button>
      </div>

      {/* Start new audit — safety_officer / admin only */}
      {canWrite && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {Object.entries(AUDIT_TYPES).map(([type, { label, icon }]) => (
            <Link
              key={type}
              to={`/audit/new/${type}`}
              className="bg-white border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-4 text-center transition"
            >
              <div className="text-3xl mb-1">{icon}</div>
              <p className="text-sm font-semibold text-blue-700">{label}</p>
              <p className="text-xs text-gray-400 mt-1">בקרה חדשה +</p>
            </Link>
          ))}
        </div>
      )}

      {/* History */}
      <h2 className="text-lg font-semibold text-gray-700 mb-3">היסטוריית בקרות</h2>
      {loading && <p className="text-gray-400 text-center py-6">טוען...</p>}
      {!loading && audits.length === 0 && <p className="text-gray-400 text-center py-6">אין בקרות עדיין</p>}
      <div className="space-y-2">
        {audits.map(a => {
          const t = AUDIT_TYPES[a.audit_type] || { label: a.audit_type, icon: '📋' };
          return (
            <Link
              key={a.id}
              to={a.status === 'Open' ? `/audit/${a.id}` : '#'}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-gray-400">{`AUD-${String(a.id).padStart(3,'0')}`}</span>
                    <p className="font-medium text-gray-800">{t.label}</p>
                  </div>
                  <p className="text-xs text-gray-400">{a.inspector_name} {a.project_name ? `• ${a.project_name}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.status === 'Open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {a.status === 'Open' ? 'פתוח' : 'הושלם'}
                </span>
                <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('he-IL')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
