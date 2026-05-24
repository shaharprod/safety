import React from 'react';

const SEVERITY_COLORS = {
  Low:    'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High:   'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
};
const SEVERITY_LABELS = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABELS   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const STATUS_COLORS   = { Open: 'text-red-600', In_Progress: 'text-yellow-600', Resolved: 'text-green-600' };
const STATUS_BG       = { Open: 'bg-red-50 border-red-200', In_Progress: 'bg-yellow-50 border-yellow-200', Resolved: 'bg-green-50 border-green-200' };

export default function HazardTable({ hazards }) {
  if (!hazards || hazards.length === 0) {
    return <p className="text-center text-gray-500 py-10">אין מפגעים להצגה</p>;
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {hazards.map(h => (
          <div key={h.id} className={`rounded-xl border p-4 ${STATUS_BG[h.status] || 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[h.severity]}`}>
                {SEVERITY_LABELS[h.severity] || h.severity}
              </span>
              <span className={`text-sm font-semibold ${STATUS_COLORS[h.status]}`}>
                {STATUS_LABELS[h.status] || h.status}
              </span>
            </div>
            <p className="text-gray-800 text-sm font-medium mb-1">{h.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
              <span>{new Date(h.created_at).toLocaleDateString('he-IL')}</span>
              <span>{h.supervisor_name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs">
            <tr>
              <th className="px-4 py-3 text-right">#</th>
              <th className="px-4 py-3 text-right">תיאור</th>
              <th className="px-4 py-3 text-right">דחיפות</th>
              <th className="px-4 py-3 text-right">ממונה</th>
              <th className="px-4 py-3 text-right">סטטוס</th>
              <th className="px-4 py-3 text-right">תאריך</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hazards.map(h => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{h.id}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={h.description}>{h.description}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[h.severity]}`}>
                    {SEVERITY_LABELS[h.severity] || h.severity}
                  </span>
                </td>
                <td className="px-4 py-3">{h.supervisor_name}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_COLORS[h.status]}`}>
                  {STATUS_LABELS[h.status] || h.status}
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(h.created_at).toLocaleDateString('he-IL')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
