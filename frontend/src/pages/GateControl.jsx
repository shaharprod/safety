import React, { useState, useEffect, useRef } from 'react';
import { checkWorker, checkWorkerByGoogle, getWorkerCertifications } from '../lib/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return <span className="text-xs text-gray-400">ללא תאריך תפוגה</span>;
  const days = daysUntil(expiryDate);
  if (days < 0)
    return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">פג תוקף לפני {Math.abs(days)} ימים</span>;
  if (days <= 30)
    return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">⚠️ פג בעוד {days} ימים</span>;
  if (days <= 90)
    return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">בעוד {days} ימים</span>;
  return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">✓ בעוד {days} ימים</span>;
}

function WorkerProfile({ result, certs }) {
  const { worker } = result;
  const trainDays = daysSince(worker.last_training_date);
  const trainingOk = trainDays !== null && trainDays <= 365;
  const trainingExpiresDays = trainingOk ? 365 - trainDays : null;

  return (
    <div className="mt-4 space-y-4">

      {/* Identity card */}
      <div className="bg-gradient-to-l from-blue-700 to-blue-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0">👷</div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold leading-tight">{worker.first_name} {worker.last_name}</p>
            <p className="text-blue-200 text-sm mt-0.5">ת.ז: {worker.id_number}</p>
            {worker.worker_role && (
              <span className="inline-block mt-1.5 bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">
                {worker.worker_role === 'safety_officer' ? 'ממונה בטיחות' : worker.worker_role === 'project_manager' ? 'מנהל פרויקט' : 'עובד'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-2 gap-3">

        {/* Training status */}
        <div className={`col-span-2 rounded-xl border-2 p-4 ${trainingOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">הדרכת בטיחות</p>
              {trainDays === null ? (
                <p className="text-base font-bold text-red-600">ללא הדרכה רשומה</p>
              ) : trainingOk ? (
                <>
                  <p className="text-base font-bold text-green-700">תקינה ✅</p>
                  <p className="text-sm text-green-600 mt-0.5">עוד {trainingExpiresDays} ימים לתפוגה</p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-red-600">פגה 🚫</p>
                  <p className="text-sm text-red-500 mt-0.5">פגה לפני {trainDays - 365} ימים</p>
                </>
              )}
            </div>
            <div className="text-left shrink-0">
              <p className="text-xs text-gray-400 mb-0.5">תאריך הדרכה</p>
              <p className="text-sm font-medium text-gray-700">{fmtDate(worker.last_training_date)}</p>
              {worker.last_training_date && (
                <p className="text-xs text-gray-400 mt-0.5">{trainDays} ימים אחורה</p>
              )}
            </div>
          </div>
        </div>

        {/* Height clearance */}
        <div className={`rounded-xl border-2 p-4 ${worker.has_height_clearance ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">עבודה בגובה</p>
          <p className={`text-base font-bold ${worker.has_height_clearance ? 'text-green-700' : 'text-gray-400'}`}>
            {worker.has_height_clearance ? '✅ מאושר' : '❌ לא מאושר'}
          </p>
        </div>

        {/* Cert count summary */}
        <div className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">הסמכות</p>
          <p className="text-2xl font-bold text-blue-700">{certs.length}</p>
          <p className="text-xs text-blue-500 mt-0.5">
            {certs.filter(c => !c.expiry_date || daysUntil(c.expiry_date) >= 0).length} בתוקף
          </p>
        </div>
      </div>

      {/* Certifications table */}
      {certs.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">פירוט הסמכות ואישורים</p>
          </div>
          <div className="divide-y divide-gray-100">
            {certs.map(c => {
              const expDays = daysUntil(c.expiry_date);
              const isExpired = c.expiry_date && expDays < 0;
              return (
                <div key={c.id} className={`px-4 py-3.5 ${isExpired ? 'bg-red-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{c.cert_type}</p>
                      {c.cert_number && <p className="text-xs text-gray-500 mt-0.5">מספר: {c.cert_number}</p>}
                      {c.issuing_authority && <p className="text-xs text-gray-500">גוף מנפיק: {c.issuing_authority}</p>}
                    </div>
                    <ExpiryBadge expiryDate={c.expiry_date} />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-400">
                    {c.issue_date && <span>הונפק: {fmtDate(c.issue_date)}</span>}
                    {c.expiry_date && <span>תפוגה: {fmtDate(c.expiry_date)}</span>}
                  </div>
                  {c.notes && <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">{c.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm text-gray-500">אין הסמכות רשומות לעובד זה</p>
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
    <div className={result ? 'max-w-2xl mx-auto' : 'max-w-md mx-auto'}>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">בקרת כניסה לאתר</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Tab selector */}
        {!result && (
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
        )}

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
              className="mt-5 w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              ← חיפוש עובד אחר
            </button>
          </>
        )}
      </div>
    </div>
  );
}
