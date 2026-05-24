import React, { useState } from 'react';
import { checkWorker } from '../lib/api.js';
import WorkerCheckResult from '../components/WorkerCheckResult.jsx';

export default function GateControl() {
  const [idNumber, setIdNumber] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCheck(e) {
    e.preventDefault();
    if (!idNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { ok, data } = await checkWorker(idNumber.trim());
      if (!ok) {
        setError(data.error || 'עובד לא נמצא במערכת');
      } else {
        setResult(data);
      }
    } catch {
      setError('שגיאת תקשורת עם השרת');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">בקרת כניסה לאתר</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מספר תעודת זהות</label>
            <input
              type="text"
              inputMode="numeric"
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
              placeholder="הכנס 9 ספרות..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={9}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !idNumber.trim()}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'בודק...' : 'בדוק כניסה'}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && <WorkerCheckResult result={result} />}
      </div>
    </div>
  );
}
