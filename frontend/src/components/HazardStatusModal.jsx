import React, { useState } from 'react';
import { updateHazardStatus } from '../lib/api.js';

export default function HazardStatusModal({ hazard, mode, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isInProgress = mode === 'in_progress';
  const title = isInProgress ? 'סימון בטיפול' : 'אישור טיפול';
  const label = isInProgress ? 'פרטי הטיפול' : 'פרטי הסגירה';
  const status = isInProgress ? 'In_Progress' : 'Resolved';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!notes.trim()) {
      setError('נא למלא פרטים');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body = isInProgress
        ? { status, treatment_notes: notes }
        : { status, resolved_notes: notes };
      await updateHazardStatus(hazard.id, body);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  return (
    /* overlay — overflow-y-auto lets user scroll to buttons when keyboard is open */
    <div className="fixed inset-0 z-[200] overflow-y-auto" dir="rtl">
      <div className="flex min-h-full items-end sm:items-center justify-center bg-black/50 sm:px-4"
           onClick={onClose}>
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
             onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              {isInProgress ? '🔧' : '✅'} {title}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                {hazard.description}
              </p>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={4} required placeholder="תאר את הטיפול שבוצע..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            {/* Buttons — inside scroll flow so keyboard never covers them */}
            <div className="px-5 pt-2 pb-10 border-t border-gray-100 flex gap-2 mt-1">
              <button type="submit" disabled={loading}
                className={`flex-1 py-3.5 rounded-xl text-white font-medium transition disabled:opacity-60 ${
                  isInProgress ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
                {loading ? 'שומר...' : title}
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
