import React, { useState } from 'react';
import { changePassword } from '../lib/api.js';

export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next !== confirm) {
      setError('הסיסמאות החדשות אינן תואמות');
      return;
    }
    if (next.length < 4) {
      setError('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await changePassword(current, next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'שגיאה בשינוי סיסמה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:px-4" dir="rtl">
      <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92dvh]">

        {/* Header — never scrolls */}
        <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">🔐 שנה סיסמה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {success ? (
          <div className="text-center py-8 px-5">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-700 font-medium">הסיסמה שונתה בהצלחה!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה נוכחית</label>
                <input
                  type="password"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
                <input
                  type="password"
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה חדשה</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Pinned action buttons — always visible above keyboard */}
            <div className="shrink-0 px-5 pb-6 pt-3 border-t border-gray-100 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-medium transition disabled:opacity-60"
              >
                {loading ? 'שומר...' : 'שנה סיסמה'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
