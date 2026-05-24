import React, { useEffect, useState } from 'react';
import { getHazards, downloadPDF } from '../lib/api.js';
import HazardTable from '../components/HazardTable.jsx';

export default function Dashboard() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getHazards()
      .then(setHazards)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    Open: hazards.filter(h => h.status === 'Open').length,
    In_Progress: hazards.filter(h => h.status === 'In_Progress').length,
    Resolved: hazards.filter(h => h.status === 'Resolved').length
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">לוח בקרה - מפגעי בטיחות</h1>
        <button
          onClick={downloadPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          📄 הפק דוח PDF
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{counts.Open}</p>
          <p className="text-sm text-gray-600 mt-1">פתוחים</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-600">{counts.In_Progress}</p>
          <p className="text-sm text-gray-600 mt-1">בטיפול</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{counts.Resolved}</p>
          <p className="text-sm text-gray-600 mt-1">טופלו</p>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500 py-10">טוען נתונים...</p>}
      {error && <p className="text-center text-red-500 py-4">שגיאה: {error}</p>}
      {!loading && !error && <HazardTable hazards={hazards} />}
    </div>
  );
}
