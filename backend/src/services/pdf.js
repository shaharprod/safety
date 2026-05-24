import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'node:url';

const FONT_REGULAR = fileURLToPath(new URL('../fonts/Alef-Regular.ttf', import.meta.url));
const FONT_BOLD    = fileURLToPath(new URL('../fonts/Alef-Bold.ttf',    import.meta.url));

// Page geometry (A4)
const MARGIN  = 40;
const PAGE_W  = 595;
const RIGHT   = PAGE_W - MARGIN;   // 555
const LEFT    = MARGIN;            // 40
const CONT_W  = RIGHT - LEFT;      // 515

// RTL row columns — label on the RIGHT, value extends to the LEFT
const LABEL_W = 130;
const LABEL_X = RIGHT - LABEL_W;   // 425
const VALUE_W = LABEL_X - LEFT - 8; // 377
const VALUE_X = LEFT;              // 40

const SEVERITY_LABEL = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABEL   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const INCIDENT_LABEL = { near_miss: 'כמעט ונפגע', injury: 'תאונת עבודה', property_damage: 'נזק לרכוש' };
const AUDIT_LABEL    = {
  work:          'בטיחות בעבודה כללית',
  construction:  'בטיחות אתר בנייה',
  infrastructure:'עבודות תשתית',
  industrial:    'בטיחות מפעל / תעשייה',
  traffic:       'בטיחות בתנועה',
  fire:          'בטיחות אש וחירום',
  electrical:    'בטיחות חשמל',
  scaffolding:   'פיגומים ועבודה בגובה',
  confined:      'מרחבים מוגבלים',
  chemicals:     'חומרים מסוכנים',
  ergonomics:    'ארגונומיה ועומס גופני',
  emergency:     'מוכנות לחירום ופינוי',
};

// Replace regular spaces with non-breaking spaces so the PDF viewer's
// bidi algorithm cannot eliminate inter-word spaces at text-column boundaries.
function rtl(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/ /g, ' ');
}
// Pre-reverse purely-Latin strings so PDFKit's bidi reversal restores them correctly.
// Hebrew text is passed through rtl() as normal.
function ltr(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (!/[֐-׿]/.test(s)) return s.split('').reverse().join('');
  return rtl(s);
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

// ── Page header ───────────────────────────────────────────────────────────────
function pageHeader(doc, title, subtitle) {
  doc.font('Bold').fontSize(22).fillColor('#111827')
     .text(rtl(title), LEFT, doc.y, { width: CONT_W, align: 'right' });
  if (subtitle) {
    doc.font('Regular').fontSize(11).fillColor('#6b7280')
       .text(rtl(subtitle), LEFT, doc.y, { width: CONT_W, align: 'right' });
  }
  doc.moveDown(0.5);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(2).strokeColor('#1e40af').stroke();
  doc.moveDown(1);
}

// ── RTL row: label on RIGHT, value on LEFT ────────────────────────────────────
function row(doc, label, value) {
  if (value === undefined || value === null || value === '') return;
  const y = doc.y;
  // Label column — right side of page
  doc.font('Bold').fontSize(11).fillColor('#374151')
     .text(rtl(label) + ':', LABEL_X, y, { width: LABEL_W, align: 'right' });
  // Value column — left side of page
  doc.font('Regular').fontSize(11).fillColor('#111827')
     .text(rtl(value), VALUE_X, y, { width: VALUE_W, align: 'right' });
  doc.moveDown(0.4);
}

function divider(doc) {
  doc.moveDown(0.4);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.6);
}

// ── Signature section — drawn lines, label on right, line on left ─────────────
function signature(doc) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(2);

  doc.font('Bold').fontSize(13).fillColor('#111827')
     .text(rtl('אישורים וחתימות'), LEFT, doc.y, { width: CONT_W, align: 'right', underline: true });
  doc.moveDown(1.2);

  const startY = doc.y;
  const ROW_H  = 24;

  // RIGHT column (safety advisor): label at 443-555 (width=112), line at 278-440
  // LEFT  column (work manager):   label at 153-265 (width=112), line at 40-150
  const R_LBL_X = 443, R_LBL_W = 112;
  const R_LINE_L = 278, R_LINE_R = 440;
  const L_LBL_X = 153, L_LBL_W = 112;
  const L_LINE_L = 40,  L_LINE_R = 150;

  const fields = [
    ['שם מנהל העבודה', 'שם יועץ הבטיחות'],
    ['חתימה',                    'חתימה'                    ],
    ['תאריך',                    'תאריך'                    ],
  ];

  doc.font('Regular').fontSize(10).fillColor('#374151');

  for (let i = 0; i < fields.length; i++) {
    const y = startY + i * ROW_H;
    const [lbl_left, lbl_right] = fields[i];

    // RIGHT column: label right-aligned, line to its left
    doc.text(lbl_right + ':', R_LBL_X, y, { width: R_LBL_W, align: 'right' });
    doc.moveTo(R_LINE_L, y + 12).lineTo(R_LINE_R, y + 12)
       .lineWidth(0.5).strokeColor('#9ca3af').stroke();

    // LEFT column: label right-aligned within its area, line to its left
    doc.text(lbl_left + ':', L_LBL_X, y, { width: L_LBL_W, align: 'right' });
    doc.moveTo(L_LINE_L, y + 12).lineTo(L_LINE_R, y + 12)
       .lineWidth(0.5).strokeColor('#9ca3af').stroke();
  }
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

    pageHeader(doc,
      'דוח מפגעי בטיחות פתוחים',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}  |  סה"כ: ${hazards.length} מפגעים`
    );

    if (!hazards.length) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text(rtl('אין מפגעים פתוחים כרגע.'), LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      const sev      = SEVERITY_LABEL[h.severity] || h.severity;
      const sevColor = { Low: '#16a34a', Medium: '#d97706', High: '#ea580c', Urgent: '#dc2626' }[h.severity] || '#374151';

      doc.font('Bold').fontSize(13).fillColor(sevColor)
         .text(rtl(`מפגע #${h.id} — ${sev}`), LEFT, doc.y, { width: CONT_W, align: 'right' });
      doc.moveDown(0.3);

      row(doc, 'תיאור',       h.description);
      row(doc, 'ממונה',       h.supervisor_name);
      row(doc, 'אימייל',      ltr(h.supervisor_email));
      row(doc, 'דחיפות',      sev);
      row(doc, 'סטטוס',       STATUS_LABEL[h.status] || h.status);
      row(doc, 'תאריך דיווח', new Date(h.created_at).toLocaleDateString('he-IL'));

      if (h.image_url) {
        try {
          const imgBuf = await fetchImage(h.image_url);
          if (imgBuf?.length) {
            if (doc.y > 580) doc.addPage();
            doc.font('Bold').fontSize(10).fillColor('#6b7280')
               .text(rtl('תמונת המפגע:'), LEFT, doc.y, { width: CONT_W, align: 'right' });
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
      'דוח אירועי בטיחות',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}  |  סה"כ: ${incidents.length} אירועים`
    );

    if (!incidents.length) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text(rtl('אין אירועים מדווחים.'), LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < incidents.length; i++) {
      const inc = incidents[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      doc.font('Bold').fontSize(13).fillColor('#dc2626')
         .text(rtl(`אירוע #${inc.id} — ${INCIDENT_LABEL[inc.incident_type] || inc.incident_type}`),
               LEFT, doc.y, { width: CONT_W, align: 'right' });
      doc.moveDown(0.3);

      row(doc, 'תיאור',           inc.description);
      row(doc, 'מיקום',           inc.location);
      row(doc, 'מעורבים',         inc.involved_parties);
      row(doc, 'גורם מיידי', inc.immediate_cause);
      row(doc, 'גורם שורש',  inc.root_cause);
      row(doc, 'פעולות שננקטו', inc.actions_taken);
      row(doc, 'שם המדווח',  inc.reporter_name);
      row(doc, 'תאריך',           new Date(inc.created_at).toLocaleDateString('he-IL'));
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
      `דוח בקרת בטיחות — ${AUDIT_LABEL[audit.audit_type] || ltr(audit.audit_type)}`,
      `${rtl(audit.project_name || '')}  |  מפקח: ${rtl(audit.inspector_name)}  |  ${new Date(audit.created_at).toLocaleDateString('he-IL')}`
    );

    doc.font('Regular').fontSize(12).fillColor('#111827')
       .text(`ציון: ${pct}%  ·  תקין: ${passes}  ·  ליקויים: ${fails}  ·  סה"כ: ${items.length}`,
             LEFT, doc.y, { width: CONT_W, align: 'right' });
    doc.moveDown(1.2);

    const categories = [...new Set(items.map(i => i.category))];
    for (const cat of categories) {
      if (doc.y > 700) doc.addPage();
      doc.font('Bold').fontSize(12).fillColor('#1e40af')
         .text(rtl(cat), LEFT, doc.y, { width: CONT_W, align: 'right' });
      doc.moveDown(0.4);

      for (const item of items.filter(i => i.category === cat)) {
        if (doc.y > 720) doc.addPage();
        const color = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
        const mark  = item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '—';
        const y = doc.y;
        doc.font('Bold').fontSize(12).fillColor(color).text(mark, LEFT, y, { width: 20, align: 'center' });
        doc.font('Regular').fontSize(11).fillColor('#111827')
           .text(rtl(item.item_text), LEFT + 25, y, { width: CONT_W - 25, align: 'right' });
        if (item.notes) {
          doc.font('Regular').fontSize(10).fillColor('#6b7280')
             .text(rtl('הערה: ' + item.notes), LEFT + 25, doc.y, { width: CONT_W - 25, align: 'right' });
        }
        doc.moveDown(0.25);
      }
      doc.moveDown(0.3);
    }

    signature(doc);
    doc.end();
  });
}

// ── Tool Inspection PDF ────────────────────────────────────────────────────────
const TOOL_TYPE_LABEL = {
  electrical:  'כלים חשמליים',
  hydraulic:   'כלים הידראוליים',
  lifting:     'מתקני הרמה',
  hand_tools:  'כלי יד',
  pressure:    'ציוד לחץ',
  pneumatic:   'כלים פנאומטיים',
};

const CONDITION_LABEL = { pass: 'תקין', fail: 'לא תקין', needs_repair: 'דורש תיקון', pending: 'ממתין' };
const CONDITION_COLOR = { pass: '#16a34a', fail: '#dc2626', needs_repair: '#d97706', pending: '#6b7280' };

export function generateToolInspectionPDF(inspection, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    applyFonts(doc);

    const passes       = items.filter(i => i.condition === 'pass').length;
    const fails        = items.filter(i => i.condition === 'fail').length;
    const needs_repair = items.filter(i => i.condition === 'needs_repair').length;
    const typeLabel    = TOOL_TYPE_LABEL[inspection.tool_type] || ltr(inspection.tool_type);

    pageHeader(doc,
      `דוח תקינות כלי עבודה — ${typeLabel}`,
      `מבצע: ${inspection.inspector_name}  |  מיקום: ${inspection.location || '—'}  |  ${new Date(inspection.created_at).toLocaleDateString('he-IL')}`
    );

    // Summary bar
    doc.font('Regular').fontSize(12).fillColor('#111827')
       .text(`סה"כ: ${items.length}  ·  תקין: ${passes}  ·  לא תקין: ${fails}  ·  דורש תיקון: ${needs_repair}`,
             LEFT, doc.y, { width: CONT_W, align: 'right' });
    doc.moveDown(1);

    if (!items.length) {
      doc.font('Regular').fontSize(13).fillColor('#6b7280')
         .text(rtl('לא נרשמו כלים בבדיקה זו.'), LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    // Table header
    const COL = { notes: LEFT, condition: LEFT + 140, serial: LEFT + 270, name: LEFT + 370 };
    const HDR_Y = doc.y;
    doc.rect(LEFT, HDR_Y, CONT_W, 18).fill('#1e40af');
    doc.font('Bold').fontSize(9).fillColor('#ffffff');
    doc.text('הערות',         COL.notes,     HDR_Y + 4, { width: 135, align: 'right' });
    doc.text('מצב',           COL.condition, HDR_Y + 4, { width: 125, align: 'right' });
    doc.text('מ"ס',           COL.serial,    HDR_Y + 4, { width: 95,  align: 'right' });
    doc.text('שם הכלי',       COL.name,      HDR_Y + 4, { width: 180, align: 'right' });
    doc.y = HDR_Y + 22;

    for (let i = 0; i < items.length; i++) {
      if (doc.y > 730) { doc.addPage(); }
      const item = items[i];
      const rowY = doc.y;
      const rowH = 18;

      if (i % 2 === 1) doc.rect(LEFT, rowY, CONT_W, rowH).fill('#f9fafb');
      doc.fillColor(CONDITION_COLOR[item.condition] || '#374151');

      doc.font('Regular').fontSize(9);
      doc.fillColor('#374151')
         .text(rtl(item.notes || '—'),        COL.notes,     rowY + 4, { width: 135, align: 'right' });
      doc.fillColor(CONDITION_COLOR[item.condition] || '#374151').font('Bold')
         .text(rtl(CONDITION_LABEL[item.condition] || item.condition), COL.condition, rowY + 4, { width: 125, align: 'right' });
      doc.fillColor('#374151').font('Regular')
         .text(item.serial_number || '—',     COL.serial,    rowY + 4, { width: 95,  align: 'right' })
         .text(rtl(item.tool_name),            COL.name,      rowY + 4, { width: 180, align: 'right' });

      doc.y = rowY + rowH;
    }

    signature(doc);
    doc.end();
  });
}
