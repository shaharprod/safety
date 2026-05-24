import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getHazards } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import HazardTable from '../components/HazardTable.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getHazards()
      .then(setHazards)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = {
    Open:        hazards.filter(h => h.status === 'Open').length,
    In_Progress: hazards.filter(h => h.status === 'In_Progress').length,
    Resolved:    hazards.filter(h => h.status === 'Resolved').length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">לוח בקרה</h1>
        <div className="flex gap-2">
          <Link to="/reports"
            className="flex-1 sm:flex-none text-center bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition">
            📊 דוחות
          </Link>
          <a href="/api/reports/hazards" download
            className="flex-1 sm:flex-none text-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition">
            📄 PDF
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{counts.Open}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">פתוחים</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{counts.In_Progress}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">בטיפול</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{counts.Resolved}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">טופלו</p>
        </div>
      </div>

      {/* Quick actions on mobile */}
      <div className="grid grid-cols-2 gap-2 mb-6 sm:hidden">
        <Link to="/report"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-sm font-semibold text-center transition">
          ⚠️ דווח מפגע
        </Link>
        <Link to="/audits"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 text-sm font-semibold text-center transition">
          📋 בקרה חדשה
        </Link>
      </div>

      {loading && <p className="text-center text-gray-500 py-10">טוען נתונים...</p>}
      {error   && <p className="text-center text-red-500 py-4">שגיאה: {error}</p>}
      {!loading && !error && <HazardTable hazards={hazards} currentUser={user} onStatusUpdate={load} />}
    </div>
  );
}
