// Subject-document taxonomy — maps every safety subject to its own dedicated,
// detailed document page. Used to give each item/topic a specific document
// (not one shared generic template) across all module pages.
import { PERMIT_ITEMS, CHECKLIST_ITEMS } from './checklists.js';

const procDoc = (domain, slug) => `/docs/proc-${domain}-${slug}.html`;

// 3 detailed subject documents per safety domain. `cats` lists the checklist
// categories each subject covers; the 3 subjects also map 1:1 to the 3 permit
// categories (היתרים ואישורים / נהלים מוקדמים / תיעוד נדרש) by order.
export const PROCEDURE_SUBJECTS = {
  work: [
    { slug: 'ppe',            title: 'ציוד מגן אישי ובטיחות אישית',      cats: ['ציוד מגן אישי'] },
    { slug: 'height-tools',   title: 'עבודה בגובה וכלי עבודה',           cats: ['עבודה בגובה', 'כלי עבודה'] },
    { slug: 'housekeeping',   title: 'סדר, חומרים מסוכנים ואש וחירום',   cats: ['סדר וניקיון', 'חומרים מסוכנים', 'אש וחירום'] },
  ],
  construction: [
    { slug: 'scaffold-height', title: 'פיגומים, עבודה בגובה וגידור',     cats: ['גידור ופרוטקציה', 'פיגומים', 'עבודה בגובה'] },
    { slug: 'mechanical-dig',  title: 'ציוד מכני וחפירות',               cats: ['ציוד מכני', 'חפירות'] },
    { slug: 'electrical-ppe',  title: 'חשמל, ציוד מגן וסדר',             cats: ['חשמל', 'ציוד מגן אישי', 'סדר ניקיון'] },
  ],
  infrastructure: [
    { slug: 'excavation-util', title: 'חפירות, חשיפה וצינורות תת-קרקעיים', cats: ['חפירות וחשיפה', 'צינורות ורשתות'] },
    { slug: 'traffic-mgmt',    title: 'בטיחות תנועה והסדרי תנועה',        cats: ['בטיחות תנועה'] },
    { slug: 'equip-power-comm',title: 'ציוד מכני, חשמל ותקשורת',         cats: ['ציוד מכני', 'ציוד מגן אישי', 'חשמל', 'תקשורת'] },
  ],
  industrial: [
    { slug: 'machine-loto',    title: 'מיגון מכונות ונוהל LOTO',         cats: ['מכונות ציוד'] },
    { slug: 'hazmat-health',   title: 'חומרים מסוכנים וגהות תעסוקתית',    cats: ['חומרים מסוכנים', 'גהות תעסוקתית'] },
    { slug: 'ppe-fire-train',  title: 'ציוד מגן, אש והכשרה',             cats: ['ציוד מגן אישי', 'אש וחירום', 'הכשרה'] },
  ],
  fire: [
    { slug: 'extinguishing',   title: 'ציוד כיבוי וגלאים',               cats: ['ציוד כיבוי', 'גלאים'] },
    { slug: 'emergency-exits', title: 'מוצאי חירום ודלתות אש',           cats: ['מוצאי חירום', 'דלתות אש'] },
    { slug: 'fire-maintenance',title: 'תחזוקה ומניעת אש',               cats: ['תחזוקה'] },
  ],
  electrical: [
    { slug: 'loto',            title: 'נוהל LOTO וניתוק אנרגיה',         cats: ['עבודות חשמל'] },
    { slug: 'panels-ground',   title: 'לוחות חשמל והארקה',               cats: ['לוחות חשמל', 'הארקה'] },
    { slug: 'cables-wet',      title: 'כבלים, חיבורים וסביבה רטובה',     cats: ['כבלים וחיבורים', 'סביבה רטובה', 'תיעוד'] },
  ],
  scaffolding: [
    { slug: 'erection',        title: 'הקמת פיגום ומבנה',                cats: ['הקמה ומבנה'] },
    { slug: 'platforms-access',title: 'רצפות, מעקות וכניסה',             cats: ['רצפות ומעקות', 'כניסה ועלייה'] },
    { slug: 'workers-inspect', title: 'עובדים ובדיקות פיגום',            cats: ['עובדים', 'בדיקות'] },
  ],
  confined: [
    { slug: 'entry-permit',    title: 'היתר כניסה ושומר כניסה',          cats: ['הרשאות', 'שומר כניסה', 'כניסה ויציאה'] },
    { slug: 'atmosphere',      title: 'בדיקות אטמוספרה וניטור אוויר',     cats: ['בדיקות אוויר'] },
    { slug: 'rescue-energy',   title: 'ציוד חילוץ, אנרגיה ותקשורת',      cats: ['ציוד חירום', 'אנרגיה', 'תקשורת'] },
  ],
  chemicals: [
    { slug: 'id-storage',      title: 'זיהוי, סימון ואחסון חומרים מסוכנים', cats: ['זיהוי וסימון', 'אחסון'] },
    { slug: 'handling',        title: 'טיפול בחומרים מסוכנים ומיגון',     cats: ['טיפול'] },
    { slug: 'waste-emergency', title: 'פסולת, חירום והכשרה',             cats: ['פסולת', 'הכשרה', 'חירום'] },
  ],
  ergonomics: [
    { slug: 'lifting',         title: 'הרמה, סחיבה ועזרים מכניים',       cats: ['הרמה וסחיבה', 'כלי עבודה'] },
    { slug: 'posture',         title: 'תנוחת עבודה ועמדות',              cats: ['תנוחת עבודה'] },
    { slug: 'env-breaks',      title: 'סביבת עבודה והפסקות',             cats: ['סביבה', 'הפסקות'] },
  ],
  emergency: [
    { slug: 'plan-evac',       title: 'תכנית חירום ופינוי',              cats: ['תכנית חירום', 'פינוי'] },
    { slug: 'first-aid',       title: 'עזרה ראשונה ומוכנות רפואית',      cats: ['עזרה ראשונה'] },
    { slug: 'shelter-comm',    title: 'מרחב מוגן ותקשורת חירום',         cats: ['ממ"ד / מרחב מוגן', 'תקשורת'] },
  ],
  traffic: [
    { slug: 'signage',         title: 'שילוט והפרדת תנועה',              cats: ['שילוט', 'הפרדת תנועה'] },
    { slug: 'access-parking',  title: 'כניסה, יציאה וחניה',              cats: ['כניסה ויציאה', 'חניה'] },
    { slug: 'lighting-drivers',title: 'תאורה ונהגים',                   cats: ['תאורה', 'נהגים'] },
  ],
};

// Attach the resolved doc path to each subject for convenience
for (const [domain, subjects] of Object.entries(PROCEDURE_SUBJECTS)) {
  subjects.forEach(s => { s.doc = procDoc(domain, s.slug); });
}

const PERMIT_CATEGORY_ORDER = ['היתרים ואישורים', 'נהלים מוקדמים', 'תיעוד נדרש'];

// Resolve the detailed subject document for a (domain, category) pair.
export function docForCategory(domain, category) {
  const subjects = PROCEDURE_SUBJECTS[domain];
  if (!subjects) return null;
  const bySubject = subjects.find(s => s.cats.includes(category));
  if (bySubject) return bySubject.doc;
  const permitIdx = PERMIT_CATEGORY_ORDER.indexOf(category);
  if (permitIdx >= 0 && subjects[permitIdx]) return subjects[permitIdx].doc;
  return subjects[0].doc;
}

// Build an index: item_text -> { domain, category, specificDoc }
const _itemIndex = {};
for (const [domain, items] of Object.entries(PERMIT_ITEMS)) {
  for (const it of items) {
    // keep genuinely specific permit forms (e.g. hot-work-permit), drop the old generic domain page
    const specificDoc = it.doc && !it.doc.startsWith('/docs/procedures-') ? it.doc : null;
    _itemIndex[it.item_text] = { domain, category: it.category, specificDoc };
  }
}
for (const [domain, items] of Object.entries(CHECKLIST_ITEMS)) {
  for (const it of items) {
    if (!_itemIndex[it.item_text]) _itemIndex[it.item_text] = { domain, category: it.category, specificDoc: null };
  }
}

// Resolve the best dedicated document for any item by its text (used in audits).
export function docForItemText(text) {
  const entry = _itemIndex[text];
  if (!entry) return null;
  return entry.specificDoc || docForCategory(entry.domain, entry.category);
}

// ── Permit / certification / tool / project type documents ────────────────────
export const PERMIT_TYPE_DOC = {
  'מינוי ממונה בטיחות':       '/docs/permit-safety-officer-appointment.html',
  'היתר בנייה':               '/docs/permit-building.html',
  'היתר עבודות תשתית':        '/docs/permit-infrastructure.html',
  'רישיון עסק':               '/docs/permit-business-license.html',
  'היתר עבודה בכביש':         '/docs/permit-road-work.html',
  'אישור כיבוי אש':           '/docs/permit-fire-approval.html',
  'אישור חשמל':               '/docs/permit-electrical-approval.html',
  'היתר עבודה בגובה':         '/docs/permit-height-work.html',
  'אישור בדיקת מנוף':         '/docs/permit-crane-inspection.html',
  'היתר כניסה למרחב מוגבל':   '/docs/permit-confined-entry.html',
  'רישיון חומרים מסוכנים':    '/docs/permit-hazmat-license.html',
  'אישור סביבתי':             '/docs/permit-environmental.html',
  'אישור בריאות תעסוקתית':    '/docs/permit-occupational-health.html',
  'אישור מוכנות לחירום':      '/docs/permit-emergency-readiness.html',
  'אישור ביטוח':             '/docs/permit-insurance.html',
};

export const CERT_TYPE_DOC = {
  height:      '/docs/cert-height.html',
  forklift:    '/docs/cert-forklift.html',
  crane:       '/docs/cert-crane.html',
  first_aid:   '/docs/cert-first_aid.html',
  electrical:  '/docs/cert-electrical.html',
  hot_work:    '/docs/cert-hot_work.html',
  confined:    '/docs/cert-confined.html',
  scaffolding: '/docs/cert-scaffolding.html',
  welding:     '/docs/cert-welding.html',
};

export const TOOL_TYPE_DOC = {
  electrical: '/docs/tool-electrical.html',
  hydraulic:  '/docs/tool-hydraulic.html',
  lifting:    '/docs/tool-lifting.html',
  hand_tools: '/docs/tool-hand_tools.html',
  pressure:   '/docs/tool-pressure.html',
  pneumatic:  '/docs/tool-pneumatic.html',
};

export const PROJECT_DOCS = [
  { slug: 'safety-file',    title: 'תיק בטיחות פרויקט',        icon: '📁', doc: '/docs/project-safety-file.html' },
  { slug: 'safety-plan',    title: 'תוכנית ניהול בטיחות',      icon: '📐', doc: '/docs/project-safety-plan.html' },
  { slug: 'risk-survey',    title: 'סקר סיכונים',              icon: '⚠️', doc: '/docs/project-risk-survey.html' },
  { slug: 'site-opening',   title: 'נוהל פתיחת אתר',           icon: '🚧', doc: '/docs/project-site-opening.html' },
  { slug: 'emergency-plan', title: 'תכנית חירום לפרויקט',      icon: '🚨', doc: '/docs/project-emergency-plan.html' },
  { slug: 'site-closing',   title: 'נוהל סגירת אתר',           icon: '🏁', doc: '/docs/project-site-closing.html' },
];
