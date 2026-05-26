import React, { useState, useEffect, useRef } from 'react';
import { checkWorker, checkWorkerByGoogle, getWorkerCertifications } from '../lib/api.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
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
  if (!expiryDate) return <span className="text-[11px] text-gray-400 italic">ללא תפוגה</span>;
  const d = daysUntil(expiryDate);
  if (d < 0)   return <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">פג לפני {Math.abs(d)}י׳</span>;
  if (d <= 30)  return <span className="text-[11px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠ עוד {d}י׳</span>;
  if (d <= 90)  return <span className="text-[11px] font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">עוד {d}י׳</span>;
  return         <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ עוד {d}י׳</span>;
}

function WorkerProfile({ result, certs }) {
  const { worker } = result;
  const trainDays   = daysSince(worker.last_training_date);
  const trainingOk  = trainDays !== null && trainDays <= 365;
  const daysLeft    = trainingOk ? 365 - trainDays : null;

  return (
    <div className="space-y-2 mt-3">

      {/* Identity */}
      <div className="flex items-center gap-3 bg-blue-800 text-white rounded-xl px-4 py-3">
        <span className="text-2xl shrink-0">👷</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight truncate">{worker.first_name} {worker.last_name}</p>
          <p className="text-blue-200 text-xs">ת.ז: {worker.id_number}
            {worker.worker_role && <span className="mr-2 bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
              {worker.worker_role === 'safety_officer' ? 'ממונה בטיחות' : worker.worker_role === 'project_manager' ? 'מנהל פרויקט' : 'עובד'}
            </span>}
          </p>
        </div>
      </div>

      {/* Training + Height — side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl border px-3 py-2.5 ${trainingOk ? 'bg-green-50 border-green-200' : trainDays === null ? 'bg-red-50 border-red-200' : 'bg-red-50 border-red-300'}`}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">הדרכת בטיחות</p>
          {trainDays === null ? (
            <p className="text-xs font-bold text-red-600">ללא רישום</p>
          ) : trainingOk ? (
            <>
              <p className="text-xs font-bold text-green-700">תקינה ✅</p>
              <p className="text-[11px] text-green-600">עוד {daysLeft} ימים</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-red-600">פגה 🚫</p>
              <p className="text-[11px] text-red-500">לפני {trainDays - 365}י׳</p>
            </>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{fmtDate(worker.last_training_date)}</p>
        </div>

        <div className={`rounded-xl border px-3 py-2.5 ${worker.has_height_clearance ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">עבודה בגובה</p>
          <p className={`text-xs font-bold ${worker.has_height_clearance ? 'text-green-700' : 'text-gray-400'}`}>
            {worker.has_height_clearance ? '✅ מאושר' : '❌ לא מאושר'}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {certs.filter(c => !c.expiry_date || daysUntil(c.expiry_date) >= 0).length}/{certs.length} הסמכות בתוקף
          </p>
        </div>
      </div>

      {/* Certifications — scrollable */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-600">הסמכות ואישורים</p>
          <span className="text-[11px] text-gray-400">{certs.length} רשומות</span>
        </div>

        {certs.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-400">אין הסמכות רשומות</div>
        ) : (
          <div className="overflow-y-auto max-h-52 divide-y divide-gray-100">
            {certs.map(c => {
              const expired = c.expiry_date && daysUntil(c.expiry_date) < 0;
              return (
                <div key={c.id} className={`px-3 py-2.5 ${expired ? 'bg-red-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{c.cert_type}</p>
                      <div className="flex flex-wrap gap-x-3 mt-0.5">
                        {c.cert_number    && <span className="text-[11px] text-gray-400">מס׳ {c.cert_number}</span>}
                        {c.issuing_authority && <span className="text-[11px] text-gray-400">{c.issuing_authority}</span>}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        {c.issue_date  && <span className="text-[11px] text-gray-400">הנפקה: {fmtDate(c.issue_date)}</span>}
                        {c.expiry_date && <span className="text-[11px] text-gray-400">תפוגה: {fmtDate(c.expiry_date)}</span>}
                      </div>
                      {c.notes && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{c.notes}</p>}
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <ExpiryBadge expiryDate={c.expiry_date} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GateControl() {
  const [idNumber, setIdNumber] = useState('');
  const [result, setResult]     = useState(null);
  const [certs, setCerts]       = useState([]);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState('id');
  const googleBtnRef            = useRef(null);

  useEffect(() => {
    if (tab !== 'google' || !GOOGLE_CLIENT_ID) return;
    const gsi = window.google?.accounts?.id;
    if (!gsi) return;
    gsi.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential, auto_select: false, cancel_on_tap_outside: false });
    if (googleBtnRef.current)
      gsi.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', text: 'signin_with', locale: 'he', width: googleBtnRef.current.offsetWidth || 280 });
  }, [tab]);

  async function loadWorker(data) {
    setResult(data);
    try { setCerts(await getWorkerCertifications(data.worker.id)); }
    catch { setCerts([]); }
  }

  async function handleGoogleCredential(response) {
    setLoading(true); setError(''); setResult(null); setCerts([]);
    try {
      const { ok, data } = await checkWorkerByGoogle(response.credential);
      if (!ok) setError(data.error || 'משתמש לא נמצא'); else await loadWorker(data);
    } catch { setError('שגיאת תקשורת'); } finally { setLoading(false); }
  }

  async function handleIdCheck(e) {
    e.preventDefault();
    if (!idNumber.trim()) return;
    setLoading(true); setError(''); setResult(null); setCerts([]);
    try {
      const { ok, data } = await checkWorker(idNumber.trim());
      if (!ok) setError(data.error || 'עובד לא נמצא'); else await loadWorker(data);
    } catch { setError('שגיאת תקשורת'); } finally { setLoading(false); }
  }

  function reset() { setResult(null); setCerts([]); setError(''); setIdNumber(''); }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">בקרת כניסה לאתר</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 text-sm">
          <button onClick={() => { setTab('id'); reset(); }}
            className={`flex-1 py-2 font-medium transition ${tab === 'id' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            🪪 ת.ז
          </button>
          <button onClick={() => { setTab('google'); reset(); }}
            className={`flex-1 py-2 font-medium transition ${tab === 'google' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            🔐 Google
          </button>
        </div>

        {tab === 'id' && !result && (
          <form onSubmit={handleIdCheck} className="space-y-3">
            <input
              type="text" inputMode="numeric"
              value={idNumber} onChange={e => setIdNumber(e.target.value)}
              placeholder="9 ספרות..." maxLength={9} autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={loading || !idNumber.trim()}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 text-sm">
              {loading ? 'מחפש...' : 'חפש עובד'}
            </button>
          </form>
        )}

        {tab === 'google' && !result && (
          !GOOGLE_CLIENT_ID
            ? <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 text-center">
                הוסף <code>VITE_GOOGLE_CLIENT_ID</code> לקובץ .env
              </div>
            : <div>
                <p className="text-xs text-gray-500 mb-3 text-center">התחבר עם Google הרשום במערכת</p>
                <div ref={googleBtnRef} className="flex justify-center" />
                {loading && <p className="text-center text-gray-400 text-xs mt-2">מאמת...</p>}
              </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
        )}

        {result && (
          <>
            <WorkerProfile result={result} certs={certs} />
            <button onClick={reset}
              className="mt-3 w-full border border-gray-200 text-gray-500 py-2 rounded-lg text-xs hover:bg-gray-50 transition">
              ← חיפוש עובד אחר
            </button>
          </>
        )}
      </div>
    </div>
  );
}
