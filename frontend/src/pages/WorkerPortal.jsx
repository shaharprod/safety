import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCertifications } from '../lib/api.js';

function trainingStatus(last_training_date) {
  if (!last_training_date) return { label: 'ללא הדרכה רשומה', color: 'text-red-600', bg: 'bg-red-50 border-red-200', days: null };
  const days = Math.floor((Date.now() - new Date(last_training_date).getTime()) / 86_400_000);
  if (days <= 300) return { label: `תקין — ${days} ימים מאז הדרכה`, color: 'text-green-700', bg: 'bg-green-50 border-green-200', days };
  if (days <= 365) return { label: `פג בקרוב — ${365 - days} ימים נותרו`, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', days };
  return { label: `פג תוקף — ${days - 365} ימים אחרי תוקף`, color: 'text-red-600', bg: 'bg-red-50 border-red-200', days };
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL');
}

export default function WorkerPortal() {
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [certs, setCerts]   = useState([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('worker_session');
    if (!raw) { navigate('/', { replace: true }); return; }
    const w = JSON.parse(raw);
    setWorker(w);
    getCertifications()
      .then(all => setCerts(all.filter(c => c.worker_id === w.id)))
      .catch(() => {});
  }, [navigate]);

  function handleExit() {
    sessionStorage.removeItem('worker_session');
    navigate('/', { replace: true });
  }

  if (!worker) return null;

  const training = trainingStatus(worker.last_training_date);
  const now = new Date().toLocaleString('he-IL');

  return (
    <div className="min-h-dvh bg-blue-950 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto" dir="rtl">
      <div className="w-full max-w-sm space-y-4">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-4xl mb-2">🦺</div>
          <h1 className="text-xl font-bold text-white">SafetyOS — פורטל עובד</h1>
          <p className="text-blue-300 text-xs mt-1">{now}</p>
        </div>

        {/* Welcome card */}
        <div className="bg-green-500 rounded-2xl p-5 text-center shadow-xl">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-white text-xl font-bold">{worker.first_name} {worker.last_name}</p>
          <p className="text-green-100 text-sm mt-1">כניסה מאושרת לאתר</p>
          <p className="text-green-200 text-xs mt-1">ת.ז. {worker.id_number}</p>
        </div>

        {/* Training status */}
        <div className={`bg-white rounded-2xl border-2 ${training.bg} p-4`}>
          <p className="text-xs font-semibold text-gray-500 mb-1">הדרכת בטיחות</p>
          <p className={`font-bold text-sm ${training.color}`}>{training.label}</p>
          {worker.last_training_date && (
            <p className="text-xs text-gray-400 mt-1">תאריך הדרכה אחרונה: {fmtDate(worker.last_training_date)}</p>
          )}
        </div>

        {/* Height clearance */}
        <div className={`bg-white rounded-2xl border-2 p-4 ${worker.has_height_clearance ? 'border-green-200' : 'border-gray-200'}`}>
          <p className="text-xs font-semibold text-gray-500 mb-1">עבודה בגובה</p>
          <p className={`font-bold text-sm ${worker.has_height_clearance ? 'text-green-700' : 'text-gray-500'}`}>
            {worker.has_height_clearance ? '✅ אישור עבודה בגובה בתוקף' : '❌ אין אישור עבודה בגובה'}
          </p>
        </div>

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
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
        )}

        {/* Exit */}
        <button
          onClick={handleExit}
          className="w-full bg-blue-800 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-semibold transition"
        >
          ← סיים וחזור לדף הכניסה
        </button>

        <p className="text-center text-blue-800 text-xs">SafetyOS v3.0</p>
      </div>
    </div>
  );
}
