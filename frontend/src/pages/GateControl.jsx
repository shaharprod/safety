import React, { useState, useEffect, useRef } from 'react';
import { checkWorker, checkWorkerByGoogle, getWorkerCertifications } from '../lib/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL');
}

function WorkerProfile({ result, certs }) {
  const { worker } = result;
  const days = worker.last_training_date
    ? Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000)
    : null;
  const trainingOk = days !== null && days <= 365;

  return (
    <div className="mt-4 space-y-3">
      {/* Worker identity */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <span className="text-3xl">👷</span>
        <div>
          <p className="text-lg font-bold text-gray-800">{worker.first_name} {worker.last_name}</p>
          <p className="text-sm text-gray-500">ת.ז: {worker.id_number}</p>
        </div>
      </div>

      {/* Training */}
      <div className={`rounded-xl border-2 p-3 ${trainingOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className="text-xs font-semibold text-gray-500 mb-0.5">הדרכת בטיחות</p>
        {days === null
          ? <p className="text-sm font-bold text-red-600">ללא הדרכה רשומה</p>
          : <p className={`text-sm font-bold ${trainingOk ? 'text-green-700' : 'text-red-600'}`}>
              {trainingOk ? `תקין — ${days} ימים מאז הדרכה` : `פג תוקף — ${days - 365} ימים אחרי תוקף`}
            </p>
        }
        {worker.last_training_date && (
          <p className="text-xs text-gray-400 mt-0.5">תאריך: {fmtDate(worker.last_training_date)}</p>
        )}
      </div>

      {/* Height clearance */}
      <div className={`rounded-xl border-2 p-3 ${worker.has_height_clearance ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-xs font-semibold text-gray-500 mb-0.5">עבודה בגובה</p>
        <p className={`text-sm font-bold ${worker.has_height_clearance ? 'text-green-700' : 'text-gray-500'}`}>
          {worker.has_height_clearance ? '✅ אישור בתוקף' : '❌ אין אישור'}
        </p>
      </div>

      {/* Certifications */}
      {certs.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">הסמכות</p>
          <div className="space-y-2">
            {certs.map(c => {
              const expired = c.expiry_date && new Date(c.expiry_date) < new Date();
              return (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{c.cert_type}</p>
                    {c.expiry_date && <p className="text-xs text-gray-400">תוקף: {fmtDate(c.expiry_date)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {expired ? 'פג' : 'תקין'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-center text-sm text-gray-500">
          אין הסמכות רשומות
        </div>
      )}
    </div>
  );
}

export default function GateControl() {
  const [idNumber, setIdNumber]   = useState('');
  const [result, setResult]       = useState(null);
  const [certs, setCerts]         = useState([]);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState('id');
  const googleBtnRef              = useRef(null);

  useEffect(() => {
    if (tab !== 'google') return;
    if (!GOOGLE_CLIENT_ID) return;
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

  async function loadWorker(data) {
    setResult(data);
    try {
      const workerCerts = await getWorkerCertifications(data.worker.id);
      setCerts(workerCerts);
    } catch {
      setCerts([]);
    }
  }

  async function handleGoogleCredential(response) {
    setLoading(true); setError(''); setResult(null); setCerts([]);
    try {
      const { ok, data } = await checkWorkerByGoogle(response.credential);
      if (!ok) setError(data.error || 'משתמש לא נמצא במערכת');
      else await loadWorker(data);
    } catch { setError('שגיאת תקשורת עם השרת'); }
    finally { setLoading(false); }
  }

  async function handleIdCheck(e) {
    e.preventDefault();
    if (!idNumber.trim()) return;
    setLoading(true); setError(''); setResult(null); setCerts([]);
    try {
      const { ok, data } = await checkWorker(idNumber.trim());
      if (!ok) setError(data.error || 'עובד לא נמצא במערכת');
      else await loadWorker(data);
    } catch { setError('שגיאת תקשורת עם השרת'); }
    finally { setLoading(false); }
  }

  function reset() {
    setResult(null); setCerts([]); setError(''); setIdNumber('');
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">בקרת כניסה לאתר</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Tab selector */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
          <button
            onClick={() => { setTab('id'); reset(); }}
            className={`flex-1 py-2 text-sm font-medium transition ${tab === 'id' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🪪 תעודת זהות
          </button>
          <button
            onClick={() => { setTab('google'); reset(); }}
            className={`flex-1 py-2 text-sm font-medium transition ${tab === 'google' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🔐 כניסה עם Google
          </button>
        </div>

        {tab === 'id' && !result && (
          <form onSubmit={handleIdCheck} className="space-y-4">
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
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !idNumber.trim()}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'מחפש...' : 'חפש עובד'}
            </button>
          </form>
        )}

        {tab === 'google' && !result && (
          <div className="space-y-4">
            {!GOOGLE_CLIENT_ID ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-center">
                <div className="font-semibold mb-1">הגדרה נדרשת</div>
                <div>הוסף <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> לקובץ <code className="bg-yellow-100 px-1 rounded">.env</code></div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">התחבר עם חשבון Google הרשום במערכת</p>
                <div ref={googleBtnRef} className="flex justify-center" />
                {loading && <p className="text-center text-gray-500 text-sm mt-3">מאמת...</p>}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {result && (
          <>
            <WorkerProfile result={result} certs={certs} />
            <button
              onClick={reset}
              className="mt-4 w-full border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              ← עובד אחר
            </button>
          </>
        )}
      </div>
    </div>
  );
}
