import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

const FONT_REGULAR = 'C:\\Windows\\Fonts\\Alef-Regular.ttf';
const FONT_BOLD    = 'C:\\Windows\\Fonts\\Alef-Bold.ttf';

// Page geometry
const PAGE_W = 595;
const MARGIN  = 40;
const RIGHT   = PAGE_W - MARGIN;   // 555
const LEFT    = MARGIN;            // 40
const CONT_W  = RIGHT - LEFT;      // 515

const SEVERITY_LABEL = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABEL   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const INCIDENT_LABEL = { near_miss: 'כמעט ונפגע', injury: 'תאונת עבודה', property_damage: 'נזק לרכוש' };
const AUDIT_LABEL    = {
  work: 'בטיחות בעבודה', construction: 'אתר בנייה', infrastructure: 'עבודות תשתית',
  industrial: 'מפעל תעשייה', traffic: 'בטיחות תנועה', education: 'מוסדות חינוך'
};

// ── RTL text helper ────────────────────────────────────────────────────────────
// PDFKit renders LTR. Hebrew must be reversed so it reads correctly.
// Strategy: split on whitespace tokens, reverse word order, reverse Hebrew chars in each word.
// Numbers, English, and punctuation-only tokens are NOT char-reversed (stay LTR within RTL context).
function rtl(text) {
  if (text === null || text === undefined) return '';
  const s = String(text).trim();
  if (!s) return '';

  // If purely ASCII/numeric — return as-is
  if (/^[\x00-\x7F\s]*$/.test(s)) return s;

  const tokens = s.split(/(\s+)/);
  const reversed = tokens.reverse().map(token => {
    if (/^\s+$/.test(token)) return token; // preserve whitespace
    // Don't char-reverse tokens that are purely numeric/English/punctuation
    if (/^[\x00-\x7F]+$/.test(token)) return token;
    // Char-reverse Hebrew tokens (may contain mixed Hebrew + punctuation/numbers)
    return token.split('').reverse().join('');
  });
  return reversed.join('');
}

// Wrap a label colon for RTL: "תיאור:" → rendered as ":תיאור"
function lbl(text) {
  return rtl(text) + ' :';
}

function fetchImage(url) {
  return new Promise(resolve => {
    try {
      const client = url.startsWith('https') ? https : http;
      client.get(url, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end',  () => resolve(Buffer.concat(chunks)));
        res.on('error',() => resolve(null));
      }).on('error', () => resolve(null));
    } catch { resolve(null); }
  });
}

function applyFonts(doc) {
  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold',    FONT_BOLD);
  doc.font('Regular');
}

// ── Layout helpers ─────────────────────────────────────────────────────────────
function pageHeader(doc, title, subtitle) {
  doc.font('Bold').fontSize(22).fillColor('#111827')
     .text(rtl(title), LEFT, doc.y, { width: CONT_W, align: 'left' });
  if (subtitle) {
    doc.font('Regular').fontSize(11).fillColor('#6b7280')
       .text(rtl(subtitle), LEFT, doc.y, { width: CONT_W, align: 'left' });
  }
  doc.moveDown(0.5);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(2).strokeColor('#1e40af').stroke();
  doc.moveDown(1);
}

// One label:value row — both left-aligned (RTL text, LTR placement on page)
// Visually: reversed Hebrew text fills from right edge of each cell
function row(doc, label, value) {
  if (value === undefined || value === null || value === '') return;
  const y = doc.y;

  // Value in the wide left zone
  doc.font('Regular').fontSize(11).fillColor('#111827')
     .text(rtl(String(value)), LEFT, y, { width: 360, align: 'left' });

  // Label in the right zone — draw at fixed right column, same y
  doc.font('Bold').fontSize(11).fillColor('#374151')
     .text(lbl(label), LEFT + 370, y, { width: 140, align: 'left' });

  doc.moveDown(0.35);
}

function divider(doc) {
  doc.moveDown(0.4);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.6);
}

function signature(doc) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(2);
  doc.font('Bold').fontSize(13).fillColor('#111827')
     .text(rtl('אישורים וחתימות'), LEFT, doc.y, { width: CONT_W, align: 'left', underline: true });
  doc.moveDown(1);
  const y = doc.y;
  doc.font('Regular').fontSize(11);
  doc.text(rtl('שם יועץ הבטיחות: _______________________'), LEFT + 265, y,      { width: 240, align: 'left' });
  doc.text(rtl('חתימה: _______________________'),           LEFT + 265, y + 30,  { width: 240, align: 'left' });
  doc.text(rtl('תאריך: _______________________'),           LEFT + 265, y + 60,  { width: 240, align: 'left' });
  doc.text(rtl('שם מנהל העבודה: _______________________'),  LEFT,       y,       { width: 240, align: 'left' });
  doc.text(rtl('חתימה: _______________________'),           LEFT,       y + 30,  { width: 240, align: 'left' });
  doc.text(rtl('תאריך: _______________________'),           LEFT,       y + 60,  { width: 240, align: 'left' });
}

// ── Hazards PDF ────────────────────────────────────────────────────────────────
export function generateHazardsPDF(hazards) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);

    const dateStr = new Date().toLocaleDateString('he-IL');
    pageHeader(doc,
      'דוח מפגעי בטיחות פתוחים',
      `תאריך הפקה: ${dateStr}   |   סה"כ: ${hazards.length} מפגעים`
    );

    if (hazards.length === 0) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text(rtl('אין מפגעים פתוחים כרגע.'), LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      const sev      = SEVERITY_LABEL[h.severity] || h.severity;
      const sevColor = { Low: '#16a34a', Medium: '#d97706', High: '#ea580c', Urgent: '#dc2626' }[h.severity] || '#374151';

      doc.font('Bold').fontSize(13).fillColor(sevColor)
         .text(rtl(`מפגע #${h.id} — ${sev}`), LEFT, doc.y, { width: CONT_W, align: 'left' });
      doc.moveDown(0.3);

      row(doc, 'תיאור',       h.description);
      row(doc, 'ממונה',       h.supervisor_name);
      row(doc, 'אימייל',      h.supervisor_email);
      row(doc, 'דחיפות',      sev);
      row(doc, 'סטטוס',       STATUS_LABEL[h.status] || h.status);
      row(doc, 'תאריך דיווח', new Date(h.created_at).toLocaleDateString('he-IL'));

      if (h.image_url) {
        try {
          const imgBuf = await fetchImage(h.image_url);
          if (imgBuf?.length) {
            if (doc.y > 580) doc.addPage();
            doc.font('Bold').fontSize(10).fillColor('#6b7280')
               .text(rtl('תמונת המפגע:'), LEFT, doc.y, { width: CONT_W, align: 'left' });
            doc.image(imgBuf, RIGHT - 280, doc.y, { width: 280 });
            doc.moveDown(1);
          }
        } catch { /* skip */ }
      }
      divider(doc);
    }

    signature(doc);
    doc.end();
  });
}

// ── Incidents PDF ──────────────────────────────────────────────────────────────
export function generateIncidentsPDF(incidents) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);

    pageHeader(doc,
      'דוח אירועי בטיחות',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ: ${incidents.length} אירועים`
    );

    if (incidents.length === 0) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text(rtl('אין אירועים מדווחים.'), LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < incidents.length; i++) {
      const inc = incidents[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      doc.font('Bold').fontSize(13).fillColor('#dc2626')
         .text(rtl(`אירוע #${inc.id} — ${INCIDENT_LABEL[inc.incident_type] || inc.incident_type}`),
               LEFT, doc.y, { width: CONT_W, align: 'left' });
      doc.moveDown(0.3);

      row(doc, 'תיאור',         inc.description);
      row(doc, 'מיקום',         inc.location);
      row(doc, 'מעורבים',       inc.involved_parties);
      row(doc, 'גורם מיידי',    inc.immediate_cause);
      row(doc, 'גורם שורש',     inc.root_cause);
      row(doc, 'פעולות שננקטו', inc.actions_taken);
      row(doc, 'שם המדווח',     inc.reporter_name);
      row(doc, 'תאריך',         new Date(inc.created_at).toLocaleDateString('he-IL'));
      divider(doc);
    }

    signature(doc);
    doc.end();
  });
}

// ── Audit PDF ──────────────────────────────────────────────────────────────────
export function generateAuditPDF(audit, items) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);

    const passes = items.filter(i => i.status === 'pass').length;
    const fails  = items.filter(i => i.status === 'fail').length;
    const pct    = items.length ? Math.round(passes / items.length * 100) : 0;

    pageHeader(doc,
      `דוח בקרת בטיחות — ${AUDIT_LABEL[audit.audit_type] || audit.audit_type}`,
      `${audit.project_name || ''}   |   מפקח: ${audit.inspector_name}   |   ${new Date(audit.created_at).toLocaleDateString('he-IL')}`
    );

    doc.font('Regular').fontSize(12).fillColor('#111827')
       .text(rtl(`ציון: ${pct}%   ·   תקין: ${passes}   ·   ליקויים: ${fails}   ·   סה"כ: ${items.length}`),
             LEFT, doc.y, { width: CONT_W, align: 'left' });
    doc.moveDown(1.2);

    const categories = [...new Set(items.map(i => i.category))];
    for (const cat of categories) {
      if (doc.y > 700) doc.addPage();

      doc.font('Bold').fontSize(12).fillColor('#1e40af')
         .text(rtl(cat), LEFT, doc.y, { width: CONT_W, align: 'left' });
      doc.moveDown(0.4);

      for (const item of items.filter(i => i.category === cat)) {
        if (doc.y > 720) doc.addPage();

        const color = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
        const mark  = item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '—';
        const y = doc.y;

        // Mark on the right (first visual element in RTL), text to its left
        doc.font('Bold').fontSize(12).fillColor(color)
           .text(mark, RIGHT - 20, y, { width: 20, align: 'center' });
        doc.font('Regular').fontSize(11).fillColor('#111827')
           .text(rtl(item.item_text), LEFT, y, { width: CONT_W - 30, align: 'left' });

        if (item.notes) {
          doc.font('Regular').fontSize(10).fillColor('#6b7280')
             .text(rtl(`הערה: ${item.notes}`), LEFT, doc.y, { width: CONT_W - 30, align: 'left' });
        }
        doc.moveDown(0.25);
      }
      doc.moveDown(0.3);
    }

    signature(doc);
    doc.end();
  });
}
