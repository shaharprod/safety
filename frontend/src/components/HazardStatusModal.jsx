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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {isInProgress ? '🔧' : '✅'} {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg px-3 py-2">
          {hazard.description}
        </p>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              required
              placeholder="תאר את הטיפול שבוצע..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 rounded-lg text-white font-medium transition disabled:opacity-60 ${
                isInProgress ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'שומר...' : title}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
