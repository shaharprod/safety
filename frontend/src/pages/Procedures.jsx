import React, { useState } from 'react';
import { AUDIT_TYPES, PERMIT_ITEMS, PERMIT_CATEGORIES } from '../lib/checklists.js';
import { useCanWrite } from '../lib/permissions.js';

const DOMAIN_DOC = {
  work:           '/docs/procedures-work.html',
  construction:   '/docs/procedures-construction.html',
  infrastructure: '/docs/procedures-infrastructure.html',
  industrial:     '/docs/procedures-industrial.html',
  traffic:        '/docs/procedures-traffic.html',
  fire:           '/docs/procedures-fire.html',
  electrical:     '/docs/procedures-electrical.html',
  scaffolding:    '/docs/procedures-scaffolding.html',
  confined:       '/docs/procedures-confined.html',
  chemicals:      '/docs/procedures-chemicals.html',
  ergonomics:     '/docs/procedures-ergonomics.html',
  emergency:      '/docs/procedures-emergency.html',
};

const CATEGORY_CONFIG = {
  'היתרים ואישורים': { icon: '📋', color: 'bg-blue-50 border-blue-200 text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  'נהלים מוקדמים':   { icon: '📌', color: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  'תיעוד נדרש':      { icon: '📄', color: 'bg-green-50 border-green-200 text-green-800', badge: 'bg-green-100 text-green-700' },
};

function DomainCard({ typeKey, onSelect, isSelected, canWrite }) {
  const type = AUDIT_TYPES[typeKey];
  const items = PERMIT_ITEMS[typeKey] || [];
  const counts = {};
  items.forEach(it => { counts[it.category] = (counts[it.category] || 0) + 1; });
  const doc = DOMAIN_DOC[typeKey];

  return (
    <div className={`w-full text-right rounded-2xl border-2 transition shadow-sm hover:shadow-md ${
      isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
    }`}>
      <button
        onClick={() => onSelect(isSelected ? null : typeKey)}
        className="w-full text-right p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{type.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-snug">{type.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} דרישות</p>
          </div>
          <span className={`text-xs font-bold transition-transform ${isSelected ? 'rotate-90' : ''}`}>›</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(counts).map(([cat, n]) => {
            const cfg = CATEGORY_CONFIG[cat] || {};
            return (
              <span key={cat} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.badge || 'bg-gray-100 text-gray-600'}`}>
                {n} {cat === 'היתרים ואישורים' ? 'היתרים' : cat === 'נהלים מוקדמים' ? 'נהלים' : 'מסמכים'}
              </span>
            );
          })}
        </div>
      </button>
      {canWrite && doc && (
        <div className="px-4 pb-3">
          <a href={doc} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
            📥 הורד טופס
          </a>
        </div>
      )}
    </div>
  );
}

function DomainDetail({ typeKey, canWrite }) {
  const type = AUDIT_TYPES[typeKey];
  const items = PERMIT_ITEMS[typeKey] || [];
  const doc = DOMAIN_DOC[typeKey];

  const grouped = {};
  [...PERMIT_CATEGORIES].forEach(cat => { grouped[cat] = []; });
  items.forEach(it => {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push(it);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-blue-900 px-5 py-4 flex items-center gap-3">
        <span className="text-3xl">{type.icon}</span>
        <div className="flex-1">
          <h2 className="font-bold text-white text-base">{type.label}</h2>
          <p className="text-blue-300 text-xs mt-0.5">נהלים, היתרים ותיעוד נדרש</p>
        </div>
        {canWrite && doc && (
          <a href={doc} target="_blank" rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white transition">
            📥 הורד טופס
          </a>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {Object.entries(grouped).map(([cat, catItems]) => {
          if (!catItems.length) return null;
          const cfg = CATEGORY_CONFIG[cat] || { icon: '•', color: 'bg-gray-50 border-gray-200 text-gray-700' };
          return (
            <div key={cat} className="p-4">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-3 ${cfg.color}`}>
                <span>{cfg.icon}</span>
                <span>{cat}</span>
              </div>
              <ul className="space-y-2">
                {catItems.map((it, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                      <span>{it.item_text}</span>
                    </div>
                    {it.doc && (
                      <a href={it.doc} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition whitespace-nowrap mt-0.5">
                        📋 מסמך
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Procedures() {
  const canWrite = useCanWrite();
  const [selected, setSelected] = useState(null);

  return (
    <div dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">📄 נהלים ואישורים</h1>
        <p className="text-sm text-gray-500 mt-1">מדריך דרישות בטיחות לפי תחום — היתרים, נהלים מוקדמים ותיעוד נדרש</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {Object.keys(AUDIT_TYPES).map(key => (
          <DomainCard
            key={key}
            typeKey={key}
            onSelect={setSelected}
            isSelected={selected === key}
            canWrite={canWrite}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-2">
          <DomainDetail typeKey={selected} canWrite={canWrite} />
          <button
            onClick={() => setSelected(null)}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ← סגור
          </button>
        </div>
      )}

      {!selected && (
        <p className="text-center text-sm text-gray-400 py-4">בחר תחום בטיחות לצפייה בדרישות המלאות</p>
      )}
    </div>
  );
}
