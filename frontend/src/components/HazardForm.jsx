import React, { useState } from 'react';
import { reportHazard } from '../lib/api.js';

const SEVERITY_OPTIONS = [
  { value: 'Low',    label: 'נמוכה',   color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'Medium', label: 'בינונית', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'High',   label: 'גבוהה',   color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'Urgent', label: 'דחוף',    color: 'bg-red-100 text-red-800 border-red-300' }
];

const SUPERVISORS = [
  { name: 'יוסי כהן',   email: 'yossi@example.com' },
  { name: 'רחל לוי',    email: 'rachel@example.com' },
  { name: 'דוד ישראלי', email: 'david@example.com' }
];

export default function HazardForm({ onSuccess }) {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedSupervisor = SUPERVISORS.find(s => s.name === supervisor);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description || !severity || !supervisor || !image) {
      setError('יש למלא את כל השדות ולצרף תמונה');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('description', description);
      fd.append('severity', severity);
      fd.append('supervisor_name', selectedSupervisor.name);
      fd.append('supervisor_email', selectedSupervisor.email);
      fd.append('image', image);
      await reportHazard(fd);
      onSuccess();
    } catch (err) {
      setError('שגיאה בשליחה: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המפגע</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="תאר את המפגע/התקלה שזוהתה..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">רמת דחיפות</label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`py-2 px-4 rounded-lg border-2 font-medium transition ${opt.color} ${
                severity === opt.value ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ממונה אחראי</label>
        <select
          required
          value={supervisor}
          onChange={e => setSupervisor(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">בחר ממונה...</option>
          {SUPERVISORS.map(s => (
            <option key={s.email} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תמונת המפגע</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => setImage(e.target.files[0])}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 file:ml-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
        />
        {image && <p className="text-xs text-gray-500 mt-1">נבחר: {image.name}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
      >
        {loading ? 'שולח...' : 'שלח דיווח'}
      </button>
    </form>
  );
}
