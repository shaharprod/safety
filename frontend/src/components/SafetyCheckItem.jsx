import React, { useState } from 'react';

export default function SafetyCheckItem({ item, auditId, onUpdate }) {
  const [status, setStatus] = useState(item.status || 'pending');
  const [note, setNote] = useState(item.notes || '');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save(newStatus) {
    setSaving(true);
    setStatus(newStatus);
    const fd = new FormData();
    fd.append('status', newStatus);
    fd.append('notes', note);
    if (image) fd.append('image', image);
    try {
      await onUpdate(item.id, fd);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`p-4 rounded-xl border-2 mb-3 transition-all ${
      status === 'pass' ? 'bg-green-50 border-green-200' :
      status === 'fail' ? 'bg-red-50 border-red-200' :
      status === 'na'   ? 'bg-gray-50 border-gray-200' :
      'bg-white border-gray-200'
    }`}>
      <p className="font-medium text-gray-800 mb-3">{item.item_text}</p>
      {item.category && <span className="text-xs text-gray-400 mb-2 block">{item.category}</span>}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => save('pass')}
          disabled={saving}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
            status === 'pass' ? 'bg-green-600 text-white shadow' : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >✓ תקין</button>
        <button
          onClick={() => save('fail')}
          disabled={saving}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
            status === 'fail' ? 'bg-red-600 text-white shadow' : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >✗ ליקוי</button>
        <button
          onClick={() => save('na')}
          disabled={saving}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
            status === 'na' ? 'bg-gray-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >לא רלוונטי</button>
      </div>

      {status !== 'pending' && (
        <div className="space-y-2 mt-2">
          {status === 'fail' && (
            <textarea
              placeholder="תאר את הליקוי..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => save('fail')}
              rows={2}
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-blue-600 transition">
            <span className="text-base">📷</span>
            <span>{image ? image.name : 'צלם / צרף תמונה'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => { setImage(e.target.files[0]); save(status); }}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
