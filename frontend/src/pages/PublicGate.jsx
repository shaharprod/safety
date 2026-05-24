import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { checkWorker, checkWorkerByGoogle } from '../lib/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function PublicGate() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return <GateForm />;
}

function GateForm() {
  const navigate                = useNavigate();
  const [idNumber, setIdNumber] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [tab, setTab]           = useState('id');
  const googleBtnRef            = useRef(null);

  useEffect(() => {
    if (tab !== 'google' || !GOOGLE_CLIENT_ID) return;
    const gsi = window.google?.accounts?.id;
    if (!gsi) return;
    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: false,
    });
    if (googleBtnRef.current) {
      gsi.renderButton(googleBtnRef.current, {
        theme: 'outline', size: 'large', text: 'signin_with', locale: 'he',
        width: googleBtnRef.current.offsetWidth || 320,
      });
    }
  }, [tab]);

  function openPortal(data) {
    sessionStorage.setItem('worker_session', JSON.stringify(data.worker));
    navigate('/worker-portal');
  }

  async function handleGoogleCredential(response) {
    setBusy(true); setError('');
    try {
      const { ok, data } = await checkWorkerByGoogle(response.credential);
      if (!ok) { setError(data.error || 'משתמש לא נמצא במערכת'); return; }
      if (data.access_status === 'Allowed') openPortal(data);
      else setError('כניסה נדחתה — הדרכת הבטיחות פגה. פנה למנהל.');
    } catch { setError('שגיאת תקשורת עם השרת'); }
    finally { setBusy(false); }
  }

  async function handleIdCheck(e) {
    e.preventDefault();
    if (!idNumber.trim()) return;
    setBusy(true); setError('');
    try {
      const { ok, data } = await checkWorker(idNumber.trim());
      if (!ok) { setError(data.error || 'עובד לא נמצא במערכת'); return; }
      if (data.access_status === 'Allowed') openPortal(data);
      else setError('כניסה נדחתה — הדרכת הבטיחות פגה. פנה למנהל.');
    } catch { setError('שגיאת תקשורת עם השרת'); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-dvh bg-blue-950 px-4 py-10 overflow-y-auto flex flex-col items-center" dir="rtl">
      <div className="w-full max-w-sm my-auto">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦺</div>
          <h1 className="text-2xl font-bold text-white">SafetyOS</h1>
          <p className="text-blue-300 text-sm mt-1">בקרת כניסה לאתר</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Tab selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
            <button
              onClick={() => { setTab('id'); setError(''); setIdNumber(''); }}
              className={`flex-1 py-2.5 text-sm font-medium transition ${tab === 'id' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              🪪 תעודת זהות
            </button>
            <button
              onClick={() => { setTab('google'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium transition ${tab === 'google' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              🔐 Google
            </button>
          </div>

          {tab === 'id' && (
            <form onSubmit={handleIdCheck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר תעודת זהות</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="הכנס 9 ספרות..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={9}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={busy || !idNumber.trim()}
                className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {busy ? 'בודק...' : 'כניסה'}
              </button>
            </form>
          )}

          {tab === 'google' && (
            <div className="space-y-4">
              {!GOOGLE_CLIENT_ID ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 text-center">
                  <div className="font-semibold mb-1">הגדרה נדרשת</div>
                  <div>הוסף <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code></div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-4 text-center">התחבר עם חשבון Google הרשום במערכת</p>
                  <div ref={googleBtnRef} className="flex justify-center" />
                  {busy && <p className="text-center text-gray-500 text-sm mt-3">מאמת...</p>}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Staff link */}
        <div className="text-center mt-6">
          <Link to="/login" className="text-blue-400 hover:text-blue-200 text-xs transition">
            כניסת צוות בטיחות ←
          </Link>
        </div>

        <p className="text-center text-blue-800 text-xs mt-4">SafetyOS v2.7</p>
      </div>
    </div>
  );
}
