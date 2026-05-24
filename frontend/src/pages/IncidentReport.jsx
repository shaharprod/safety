import React, { useState, useEffect } from 'react';
import { reportIncident, getWorkers, getProjects } from '../lib/api.js';

const INCIDENT_TYPES = [
  { value: 'near_miss',        label: 'כמעט ונפגע (Near Miss)', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'injury',           label: 'תאונת עבודה / פציעה',   color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'property_damage',  label: 'נזק לרכוש / ציוד',      color: 'bg-orange-100 text-orange-800 border-orange-300' }
];

export default function IncidentReport() {
  const [form, setForm] = useState({ incident_type: 'near_miss', description: '', location: '', involved_parties: '', immediate_cause: '', root_cause: '', actions_taken: '', reporter_name: '' });
  const [image, setImage] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getWorkers().then(setWorkers).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description || !form.reporter_name) { setError('יש למלא תיאור ושם מדווח'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      await reportIncident(fd);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-green-700 mb-2">הדיווח נקלט בהצלחה</h2>
      <p className="text-gray-500 mb-6">האירוע תועד ביומן הפעילות</p>
      <button onClick={() => { setSubmitted(false); setForm({ incident_type: 'near_miss', description: '', location: '', involved_parties: '', immediate_cause: '', root_cause: '', actions_taken: '', reporter_name: '' }); setImage(null); }}
        className="bg-blue-700 text-white px-6 py-2 rounded-lg">דיווח נוסף</button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🔍 בירור אירוע בטיחות</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג האירוע</label>
            <div className="space-y-2">
              {INCIDENT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, incident_type: t.value }))}
                  className={`w-full py-2 px-4 rounded-lg border-2 text-right font-medium transition ${t.color} ${form.incident_type === t.value ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-70'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="תיאור האירוע *" required><textarea required rows={3} value={form.description} onChange={set('description')} className="input resize-none" placeholder="תאר מה קרה, מתי ואיפה..." /></Field>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מיקום / פרויקט</label>
            <select value={form.location} onChange={set('location')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">בחר פרויקט / מיקום...</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}{p.location ? ` — ${p.location}` : ''}</option>
              ))}
            </select>
          </div>
          <Field label="גורמים מעורבים"><input type="text" value={form.involved_parties} onChange={set('involved_parties')} className="input" placeholder="שמות / תפקידים" /></Field>
          <Field label="גורם מיידי (מה גרם לאירוע)"><input type="text" value={form.immediate_cause} onChange={set('immediate_cause')} className="input" /></Field>
          <Field label="גורם שורש (מדוע קרה)"><input type="text" value={form.root_cause} onChange={set('root_cause')} className="input" /></Field>
          <Field label="פעולות שננקטו"><textarea rows={2} value={form.actions_taken} onChange={set('actions_taken')} className="input resize-none" /></Field>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת האירוע (אופציונלי)</label>
            <input type="file" accept="image/*" capture="environment" onChange={e => setImage(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 file:ml-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם המדווח *</label>
            <select required value={form.reporter_name} onChange={set('reporter_name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">בחר עובד מדווח...</option>
              {workers.map(w => (
                <option key={w.id} value={`${w.first_name} ${w.last_name}`}>{w.first_name} {w.last_name}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? 'שומר...' : 'שמור דיווח'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      {React.cloneElement(children, { className: (children.props.className || '') + ' w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500' })}
    </div>
  );
}
