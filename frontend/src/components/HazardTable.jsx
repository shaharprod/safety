import React from 'react';

const SEVERITY_COLORS = {
  Low:    'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High:   'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
};
const SEVERITY_LABELS = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABELS = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const STATUS_COLORS = {
  Open: 'text-red-600',
  In_Progress: 'text-yellow-600',
  Resolved: 'text-green-600'
};

export default function HazardTable({ hazards }) {
  if (!hazards || hazards.length === 0) {
    return <p className="text-center text-gray-500 py-10">אין מפגעים להצגה</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
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
              <td className="px-4 py-3 text-gray-400">{h.id}</td>
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
              <td className="px-4 py-3 text-gray-500">
                {new Date(h.created_at).toLocaleDateString('he-IL')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
