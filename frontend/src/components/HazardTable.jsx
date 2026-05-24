import React, { useState } from 'react';
import HazardStatusModal from './HazardStatusModal.jsx';

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

const docNum = (prefix, id) => `${prefix}-${String(id).padStart(3, '0')}`;

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('he-IL');
}

function TreatmentHistory({ hazard }) {
  if (!hazard.treated_at && !hazard.resolved_at) return null;
  return (
    <div className="mt-2 space-y-1">
      {hazard.treated_at && (
        <p className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
          🔧 בטיפול — {fmtDate(hazard.treated_at)}
          {hazard.treatment_notes ? ` | ${hazard.treatment_notes}` : ''}
        </p>
      )}
      {hazard.resolved_at && (
        <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
          ✅ טופל — {fmtDate(hazard.resolved_at)}
          {hazard.resolved_notes ? ` | ${hazard.resolved_notes}` : ''}
        </p>
      )}
    </div>
  );
}

function ActionButtons({ hazard, currentUser, onAction }) {
  if (!currentUser) return null;
  const { role } = currentUser;
  const { status } = hazard;

  const canMarkInProgress = (role === 'foreman' || role === 'safety_officer') && status === 'Open';
  const canResolve = role === 'safety_officer' && (status === 'In_Progress' || status === 'Open');

  if (!canMarkInProgress && !canResolve) return null;

  return (
    <div className="flex gap-2 mt-2">
      {canMarkInProgress && (
        <button
          onClick={() => onAction(hazard, 'in_progress')}
          className="flex-1 text-xs px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 rounded-lg font-medium transition"
        >
          🔧 סמן בטיפול
        </button>
      )}
      {canResolve && (
        <button
          onClick={() => onAction(hazard, 'resolved')}
          className="flex-1 text-xs px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300 rounded-lg font-medium transition"
        >
          ✅ אשר טופל
        </button>
      )}
    </div>
  );
}

export default function HazardTable({ hazards, currentUser, onStatusUpdate }) {
  const [modal, setModal] = useState(null);

  if (!hazards || hazards.length === 0) {
    return <p className="text-center text-gray-500 py-10">אין מפגעים להצגה</p>;
  }

  function handleAction(hazard, mode) {
    setModal({ hazard, mode });
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {hazards.map(h => (
          <div key={h.id} className={`rounded-xl border p-4 ${STATUS_BG[h.status] || 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 font-semibold">{docNum('HAZ', h.id)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[h.severity]}`}>
                  {SEVERITY_LABELS[h.severity] || h.severity}
                </span>
              </div>
              <span className={`text-sm font-semibold ${STATUS_COLORS[h.status]}`}>
                {STATUS_LABELS[h.status] || h.status}
              </span>
            </div>
            <p className="text-gray-800 text-sm font-medium mb-1">{h.description}</p>
            <TreatmentHistory hazard={h} />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
              <span>{fmtDate(h.created_at)}</span>
              <span>{h.supervisor_name}</span>
            </div>
            <ActionButtons hazard={h} currentUser={currentUser} onAction={handleAction} />
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
              {currentUser && <th className="px-4 py-3 text-right">פעולה</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hazards.map(h => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono font-semibold">{docNum('HAZ', h.id)}</td>
                <td className="px-4 py-3 max-w-xs">
                  <div className="truncate" title={h.description}>{h.description}</div>
                  <TreatmentHistory hazard={h} />
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[h.severity]}`}>
                    {SEVERITY_LABELS[h.severity] || h.severity}
                  </span>
                </td>
                <td className="px-4 py-3">{h.supervisor_name}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_COLORS[h.status]}`}>
                  {STATUS_LABELS[h.status] || h.status}
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(h.created_at)}</td>
                {currentUser && (
                  <td className="px-4 py-3">
                    <ActionButtons hazard={h} currentUser={currentUser} onAction={handleAction} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <HazardStatusModal
          hazard={modal.hazard}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSuccess={onStatusUpdate}
        />
      )}
    </>
  );
}
