import React, { useState, useEffect } from 'react';
import { getAudits } from '../lib/api.js';

const STATIC_REPORTS = [
  { id: 'hazards',   label: 'מפגעי בטיחות פתוחים', icon: '⚠️',  url: '/api/reports/hazards?inline=1',   download: '/api/reports/hazards',   color: 'border-red-300 bg-red-50',    active: 'border-red-500 bg-red-100' },
  { id: 'incidents', label: 'אירועי בטיחות',         icon: '🔍',  url: '/api/reports/incidents?inline=1', download: '/api/reports/incidents',  color: 'border-orange-300 bg-orange-50', active: 'border-orange-500 bg-orange-100' },
];

export default function ReportsViewer() {
  const [selected, setSelected]   = useState(null);
  const [selectedLabel, setLabel] = useState('');
  const [selectedDl, setDl]       = useState('');
  const [audits, setAudits]       = useState([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [pdfError, setPdfError]   = useState(false);

  useEffect(() => {
    getAudits().then(setAudits).catch(() => {});
  }, []);

  function open(url, label, dl) {
    setSelected(url);
    setLabel(label);
    setDl(dl);
    setIframeKey(k => k + 1);
    setPdfError(false);
    // Scroll to viewer on mobile
    setTimeout(() => document.getElementById('pdf-viewer')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  const isActive = url => selected === url;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">דוחות בטיחות</h1>
        {selected && (
          <a href={selectedDl} download
             className="text-sm bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
            ⬇ הורד PDF
          </a>
        )}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {STATIC_REPORTS.map(r => (
          <button key={r.id} onClick={() => open(r.url, r.label, r.download)}
            className={`rounded-xl border-2 p-4 text-right transition ${isActive(r.url) ? r.active + ' shadow-md' : r.color + ' hover:shadow-sm'}`}>
            <div className="text-3xl mb-2">{r.icon}</div>
            <div className="font-semibold text-gray-800 text-base">{r.label}</div>
            <div className="text-xs text-gray-500 mt-1">לחץ לצפייה בדוח</div>
          </button>
        ))}

        {/* Audit reports card */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-right">
          <div className="text-3xl mb-2">📋</div>
          <div className="font-semibold text-gray-800 mb-2">בקרות בטיחות</div>
          {audits.length === 0 ? (
            <div className="text-xs text-gray-400">אין בקרות שמורות</div>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {audits.map(a => (
                <button key={a.id}
                  onClick={() => open(`/api/reports/audit/${a.id}?inline=1`, `בקרה #${a.id}`, `/api/reports/audit/${a.id}`)}
                  className={`w-full text-right text-xs px-2.5 py-1.5 rounded-lg transition ${
                    isActive(`/api/reports/audit/${a.id}?inline=1`)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-blue-100 text-gray-700 border border-blue-200'
                  }`}>
                  <span className="font-medium">#{a.id}</span> — {a.project_name || a.audit_type}
                  <span className={`mr-1 text-[10px] ${a.status === 'Closed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    ({a.status === 'Closed' ? 'סגור' : 'פתוח'})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div id="pdf-viewer">
        {selected ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <a href={selectedDl} download
                   className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition">
                  ⬇ הורד PDF
                </a>
                <a href={selected} target="_blank" rel="noreferrer"
                   className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition">
                  ↗ פתח בחלונית חדשה
                </a>
              </div>
              <span className="text-sm font-medium text-gray-700">{selectedLabel}</span>
            </div>

            {pdfError ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-4">
                <div className="text-4xl">📄</div>
                <p className="text-sm">הדפדפן אינו תומך בתצוגת PDF מוטמעת</p>
                <a href={selected} target="_blank" rel="noreferrer"
                   className="bg-blue-700 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-800 transition">
                  פתח את הדוח בחלונית חדשה
                </a>
                <a href={selectedDl} download
                   className="text-blue-600 underline text-sm">הורד PDF</a>
              </div>
            ) : (
              <iframe
                key={iframeKey}
                src={selected}
                title={selectedLabel}
                className="w-full"
                style={{ height: '78vh', border: 'none' }}
                onError={() => setPdfError(true)}
              />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-3 py-16 px-4">
            <div className="text-5xl">📊</div>
            <p className="text-gray-500 font-medium">בחר דוח מהרשימה למעלה</p>
            <p className="text-gray-400 text-sm">הדוח יוצג כאן ישירות בדפדפן</p>
          </div>
        )}
      </div>
    </div>
  );
}
