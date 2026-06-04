// One-off generator: builds a printable checklist HTML document per safety domain
// from CHECKLIST_ITEMS, matching the style/theme of the existing procedures-*.html docs.
// Run: node frontend/scripts/gen-checklist-docs.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CHECKLIST_ITEMS, AUDIT_TYPES } from '../src/lib/checklists.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'docs');

// Per-domain theme colors (mirror the procedures-*.html docs)
const THEME = {
  work: '#1e3a5f', construction: '#7b4f12', infrastructure: '#5b4e9e',
  industrial: '#1a5276', traffic: '#d35400', fire: '#b03a2e',
  electrical: '#b7950b', scaffolding: '#1a7a6e', confined: '#4a4a4a',
  chemicals: '#6c3483', ergonomics: '#1e8449', emergency: '#922b21',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildDoc(key) {
  const type = AUDIT_TYPES[key];
  const items = CHECKLIST_ITEMS[key] || [];
  const color = THEME[key] || '#1e3a5f';

  // group items by category, preserving first-seen order
  const groups = [];
  const index = new Map();
  for (const it of items) {
    if (!index.has(it.category)) { index.set(it.category, groups.length); groups.push({ cat: it.category, rows: [] }); }
    groups[index.get(it.category)].rows.push(it.item_text);
  }

  const css = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;color:#1a1a1a;direction:rtl}`
    + `.page{max-width:800px;margin:20px auto;background:#fff;border:2px solid ${color};border-radius:8px;overflow:hidden}`
    + `.header{background:${color};color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center}`
    + `.header h1{font-size:19px;font-weight:bold}.header p{font-size:12px;opacity:.8;margin-top:3px}`
    + `.body{padding:20px 24px}.cat{margin-bottom:20px}`
    + `.cat-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;border-radius:6px;font-weight:bold;font-size:13px;background:#eef2f7;color:${color}}`
    + `.checklist{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}`
    + `.check-row{display:flex;align-items:flex-start;gap:10px;padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px}`
    + `.check-row:last-child{border-bottom:none}.check-row:nth-child(even){background:#fafafa}`
    + `.check-row input{width:17px;height:17px;flex-shrink:0;margin-top:2px;cursor:pointer}`
    + `.status{display:flex;gap:10px;margin-right:auto;flex-shrink:0;font-size:11px;color:#777}`
    + `.status span{display:inline-flex;align-items:center;gap:3px}`
    + `.sec-title{font-size:13px;font-weight:bold;color:${color};border-bottom:2px solid ${color};padding-bottom:4px;margin-bottom:10px;margin-top:18px}`
    + `.field .line{border-bottom:1px solid #999;min-height:50px}`
    + `.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px}`
    + `.sig-box{border:1px solid #bbb;border-radius:6px;padding:12px;text-align:center}`
    + `.sig-label{font-size:11px;font-weight:bold;color:#555;margin-bottom:6px}`
    + `.sig-line{border-bottom:1px solid #999;height:40px;margin-bottom:6px}.sig-name{font-size:10px;color:#777}`
    + `.print-btn{display:block;margin:0 auto 20px;padding:10px 32px;background:${color};color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer}`
    + `@media print{body{background:#fff}.page{border:none;margin:0;border-radius:0}.print-btn{display:none}}`;

  const sections = groups.map(g => {
    const rows = g.rows.map(t =>
      `  <label class="check-row"><input type="checkbox"> ${esc(t)}<span class="status">✔️ תקין ❌ ליקוי ⊘ לא רלוונטי</span></label>`
    ).join('\n');
    return `<div class="cat"><div class="cat-header">☑️ ${esc(g.cat)}</div><div class="checklist">\n${rows}\n</div></div>`;
  }).join('\n');

  return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>צ'קליסט ביקורת — ${esc(type.label)}</title><style>${css}</style></head>
<body><div class="page"><div class="header"><div><h1>${type.icon} צ'קליסט ביקורת בטיחות — ${esc(type.label)}</h1><p>Safety Inspection Checklist</p></div><div style="font-size:36px">☑️</div></div><div class="body">
<div class="sec-title">פרטי הביקורת</div><div class="sig-grid" style="grid-template-columns:1fr 1fr 1fr">
  <div class="sig-box"><div class="sig-label">אתר / פרויקט</div><div class="sig-line"></div></div>
  <div class="sig-box"><div class="sig-label">תאריך</div><div class="sig-line"></div></div>
  <div class="sig-box"><div class="sig-label">שם הבודק</div><div class="sig-line"></div></div>
</div><br>
${sections}
<div class="sec-title">ממצאים והערות</div><div class="field"><div class="line"></div></div>
<div class="sec-title">חתימות</div><div class="sig-grid">
  <div class="sig-box"><div class="sig-label">בודק / מבקר</div><div class="sig-line"></div><div class="sig-name">שם: _______________ | שעה: _______</div></div>
  <div class="sig-box"><div class="sig-label">ממונה בטיחות</div><div class="sig-line"></div><div class="sig-name">שם: _______________ | שעה: _______</div></div>
</div></div></div><br><button class="print-btn" onclick="window.print()">🖨️ הדפס</button></body></html>
`;
}

let count = 0;
for (const key of Object.keys(CHECKLIST_ITEMS)) {
  const html = buildDoc(key);
  writeFileSync(join(OUT_DIR, `checklist-${key}.html`), html, 'utf8');
  count++;
  console.log(`wrote checklist-${key}.html (${(CHECKLIST_ITEMS[key] || []).length} items)`);
}
console.log(`\nDone. Generated ${count} checklist documents.`);
