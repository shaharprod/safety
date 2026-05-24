import React, { useState, useEffect } from 'react';
import { getAudits } from '../lib/api.js';

const REPORT_TYPES = [
  { id: 'hazards',   label: 'מפגעי בטיחות פתוחים', icon: '⚠️',  url: '/api/reports/hazards?inline=1' },
  { id: 'incidents', label: 'אירועי בטיחות',         icon: '🔍',  url: '/api/reports/incidents?inline=1' },
];

export default function ReportsViewer() {
  const [selected, setSelected] = useState(null);
  const [audits, setAudits] = useState([]);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    getAudits().then(setAudits).catch(() => {});
  }, []);

  function select(url) {
    setSelected(url);
    setIframeKey(k => k + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">דוחות בטיחות</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {REPORT_TYPES.map(r => (
          <button
            key={r.id}
            onClick={() => select(r.url)}
            className={`rounded-xl border-2 p-4 text-right transition ${
              selected === r.url
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="text-3xl mb-2">{r.icon}</div>
            <div className="font-semibold text-gray-800">{r.label}</div>
            <div className="text-xs text-blue-600 mt-1">לחץ לצפייה</div>
          </button>
        ))}

        <div className="rounded-xl border-2 border-gray-200 bg-white p-4 text-right">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold text-gray-800 mb-2">דוח בקרת בטיחות</div>
          {audits.length === 0 ? (
            <div className="text-xs text-gray-400">אין בקרות מוגמרות</div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {audits.map(a => (
                <button
                  key={a.id}
                  onClick={() => select(`/api/reports/audit/${a.id}?inline=1`)}
                  className={`w-full text-right text-xs px-2 py-1.5 rounded-lg transition ${
                    selected === `/api/reports/audit/${a.id}?inline=1`
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
                  }`}
                >
                  #{a.id} — {a.project_name || a.audit_type} ({a.status === 'Closed' ? 'סגור' : 'פתוח'})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">תצוגת דוח</span>
            <a
              href={selected.replace('?inline=1', '')}
              download
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              ⬇ הורד PDF
            </a>
          </div>
          <iframe
            key={iframeKey}
            src={selected}
            title="דוח בטיחות"
            className="w-full"
            style={{ height: '75vh', border: 'none' }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm" style={{ height: '300px' }}>
          בחר דוח לצפייה
        </div>
      )}
    </div>
  );
}
