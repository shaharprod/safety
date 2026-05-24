import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getToolInspection, getToolInspectionItems,
  addToolInspectionItem, updateToolInspectionItem,
  deleteToolInspectionItem, closeToolInspection
} from '../lib/api.js';

const TOOL_TYPE_LABEL = {
  electrical: 'כלים חשמליים', hydraulic: 'כלים הידראוליים',
  lifting: 'מתקני הרמה', hand_tools: 'כלי יד',
  pressure: 'ציוד לחץ', pneumatic: 'כלים פנאומטיים',
};

const PRESET_TOOLS = {
  electrical:  ['מקדחה', 'מסור עגול', 'זווית טחינה', 'מסור מחרוזת', 'מברג חשמלי', 'מסור תנועה'],
  hydraulic:   ['ג\'ק הידראולי', 'משאבה הידראולית', 'מברג הידראולי', 'לחצן הידראולי', 'מספריים הידראוליים'],
  lifting:     ['מנוף', 'כבל פלדה', 'שרשרת הרמה', 'רתמת הרמה', 'וו הרמה', 'פלטפורמת הרמה', 'מלגזה'],
  hand_tools:  ['פטיש', 'מפתח ברגים', 'מברג', 'אזמל', 'מסור יד', 'כלי חיתוך', 'פינצטה'],
  pressure:    ['מדחס אוויר', 'מיכל לחץ', 'שסתום בטיחות', 'מד לחץ', 'צינור לחץ'],
  pneumatic:   ['מברג פנאומטי', 'מקדחה פנאומטית', 'מסמרייה', 'מזרק אוויר'],
};

const COND = [
  { value: 'pass',         label: 'תקין',         cls: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'needs_repair', label: 'דורש תיקון',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'fail',         label: 'לא תקין',      cls: 'bg-red-100 text-red-700 border-red-300' },
];

const BADGE = { pass: 'bg-green-100 text-green-700', needs_repair: 'bg-yellow-100 text-yellow-700', fail: 'bg-red-100 text-red-700', pending: 'bg-gray-100 text-gray-500' };
const LABEL = { pass: 'תקין', needs_repair: 'דורש תיקון', fail: 'לא תקין', pending: 'ממתין' };

export default function ToolInspectionSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [newName, setNewName]       = useState('');
  const [newSerial, setNewSerial]   = useState('');
  const [adding, setAdding]         = useState(false);
  const [closing, setClosing]       = useState(false);
  const [editNotes, setEditNotes]   = useState({});

  const load = useCallback(async () => {
    const [insp, its] = await Promise.all([
      getToolInspection(id), getToolInspectionItems(id)
    ]);
    setInspection(insp);
    setItems(its);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function addItem(name, serial = '') {
    if (!name.trim()) return;
    setAdding(true);
    const item = await addToolInspectionItem(id, { tool_name: name.trim(), serial_number: serial.trim(), condition: 'pending', notes: '' });
    setItems(p => [...p, item]);
    setNewName(''); setNewSerial('');
    setAdding(false);
  }

  async function setCondition(item, condition) {
    const updated = await updateToolInspectionItem(id, item.id, { condition, notes: editNotes[item.id] ?? item.notes });
    setItems(p => p.map(i => i.id === item.id ? { ...i, condition } : i));
  }

  async function saveNotes(item) {
    const notes = editNotes[item.id] ?? item.notes;
    await updateToolInspectionItem(id, item.id, { condition: item.condition, notes });
    setItems(p => p.map(i => i.id === item.id ? { ...i, notes } : i));
  }

  async function removeItem(itemId) {
    await deleteToolInspectionItem(id, itemId);
    setItems(p => p.filter(i => i.id !== itemId));
  }

  async function handleClose() {
    if (!confirm('לסגור את הבדיקה? לא ניתן יהיה להוסיף כלים לאחר מכן.')) return;
    setClosing(true);
    await closeToolInspection(id);
    setInspection(p => ({ ...p, status: 'Closed' }));
    setClosing(false);
  }

  if (loading) return <p className="text-center text-gray-400 py-10">טוען...</p>;
  if (!inspection) return <p className="text-center text-red-500 py-10">בדיקה לא נמצאה</p>;

  const isClosed = inspection.status === 'Closed';
  const pass    = items.filter(i => i.condition === 'pass').length;
  const fail    = items.filter(i => i.condition === 'fail').length;
  const repair  = items.filter(i => i.condition === 'needs_repair').length;
  const pending = items.filter(i => i.condition === 'pending').length;
  const presets = PRESET_TOOLS[inspection.tool_type] || [];
  const addedNames = new Set(items.map(i => i.tool_name));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <button onClick={() => navigate('/tools')} className="text-xs text-blue-600 hover:underline mb-1 block">← רשימת בדיקות</button>
          <h1 className="text-xl font-bold text-gray-800">
            {TOOL_TYPE_LABEL[inspection.tool_type] || inspection.tool_type}
          </h1>
          <p className="text-sm text-gray-500">{inspection.inspector_name}  ·  {inspection.location || '—'}  ·  {new Date(inspection.created_at).toLocaleDateString('he-IL')}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isClosed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {isClosed ? 'סגורה' : 'פתוחה'}
        </span>
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[['תקין', pass, 'bg-green-50 text-green-700'], ['דורש תיקון', repair, 'bg-yellow-50 text-yellow-700'], ['לא תקין', fail, 'bg-red-50 text-red-700'], ['ממתין', pending, 'bg-gray-50 text-gray-500']].map(([l,n,cls]) => (
            <div key={l} className={`rounded-xl p-2 text-center ${cls}`}>
              <div className="text-xl font-bold">{n}</div>
              <div className="text-[10px] font-medium">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick-add presets */}
      {!isClosed && presets.filter(p => !addedNames.has(p)).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">הוסף מרשימה מהירה:</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.filter(p => !addedNames.has(p)).map(name => (
              <button key={name} onClick={() => addItem(name)}
                className="text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-50 transition">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual add */}
      {!isClosed && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex gap-2 items-end">
          <div className="flex-1">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(newName, newSerial)}
              placeholder="שם הכלי"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={newSerial} onChange={e => setNewSerial(e.target.value)}
              placeholder="מ&quot;ס (אופציונלי)"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
          <button onClick={() => addItem(newName, newSerial)} disabled={!newName.trim() || adding}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40">
            הוסף
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm">{item.tool_name}</p>
                {item.serial_number && <p className="text-xs text-gray-400">מ&quot;ס: {item.serial_number}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[item.condition]}`}>
                  {LABEL[item.condition]}
                </span>
                {!isClosed && (
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-sm transition">✕</button>
                )}
              </div>
            </div>

            {/* Condition buttons */}
            {!isClosed && (
              <div className="flex gap-1.5 mb-2">
                {COND.map(c => (
                  <button key={c.value} onClick={() => setCondition(item, c.value)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium border transition ${
                      item.condition === c.value ? c.cls : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Notes */}
            {!isClosed ? (
              <input
                value={editNotes[item.id] ?? item.notes}
                onChange={e => setEditNotes(p => ({ ...p, [item.id]: e.target.value }))}
                onBlur={() => saveNotes(item)}
                placeholder="הערות..."
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400" />
            ) : (
              item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex gap-3">
        {!isClosed && (
          <button onClick={handleClose} disabled={closing || items.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40">
            {closing ? 'סוגר...' : 'סגור בדיקה'}
          </button>
        )}
        <a href={`/api/reports/tool-inspection/${id}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition text-center">
          📄 הורד PDF
        </a>
      </div>
    </div>
  );
}
