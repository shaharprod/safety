import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

const FONT_REGULAR = 'C:\\Windows\\Fonts\\Alef-Regular.ttf';
const FONT_BOLD    = 'C:\\Windows\\Fonts\\Alef-Bold.ttf';

// Page geometry
const PAGE_W  = 595;   // A4 width (points)
const MARGIN  = 40;
const RIGHT   = PAGE_W - MARGIN;  // 555 — right content edge
const LEFT    = MARGIN;           // 40  — left content edge
const CONT_W  = RIGHT - LEFT;     // 515 — full content width

// RTL layout columns
const LABEL_W = 120;
const LABEL_X = RIGHT - LABEL_W;  // 435 — label starts here, ends at 555
const VALUE_W = LABEL_X - LEFT - 8;  // 387
const VALUE_X = LEFT;

const SEVERITY_LABEL = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABEL   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const INCIDENT_LABEL = { near_miss: 'כמעט ונפגע', injury: 'תאונת עבודה', property_damage: 'נזק לרכוש' };
const AUDIT_LABEL    = {
  work: 'בטיחות בעבודה', construction: 'אתר בנייה', infrastructure: 'עבודות תשתית',
  industrial: 'מפעל תעשייה', traffic: 'בטיחות תנועה', education: 'מוסדות חינוך'
};

function fetchImage(url) {
  return new Promise(resolve => {
    try {
      const client = url.startsWith('https') ? https : http;
      client.get(url, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
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
function header(doc, title, subtitle) {
  doc.font('Bold').fontSize(22).fillColor('#111827')
     .text(title, LEFT, doc.y, { width: CONT_W, align: 'right' });
  if (subtitle) {
    doc.font('Regular').fontSize(11).fillColor('#6b7280')
       .text(subtitle, LEFT, doc.y, { width: CONT_W, align: 'right' });
  }
  doc.moveDown(0.5);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(2).strokeColor('#1e40af').stroke();
  doc.moveDown(1);
}

// ── RTL label : value row ─────────────────────────────────────────────────────
// Label on RIGHT, value extends to the LEFT — proper Hebrew RTL layout
function row(doc, label, value) {
  if (value === undefined || value === null || value === '') return;
  const y = doc.y;
  doc.font('Bold').fontSize(11).fillColor('#374151')
     .text(`:${label}`, LABEL_X, y, { width: LABEL_W, align: 'right' });
  doc.font('Regular').fontSize(11).fillColor('#111827')
     .text(String(value), VALUE_X, y, { width: VALUE_W, align: 'right' });
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
     .text('אישורים וחתימות', LEFT, doc.y, { width: CONT_W, align: 'right', underline: true });
  doc.moveDown(1);
  const y = doc.y;
  doc.font('Regular').fontSize(11);
  // Right column — safety consultant
  doc.text('שם יועץ הבטיחות: _______________________', 310, y,      { width: 240, align: 'right' });
  doc.text('חתימה: _______________________',           310, y + 30,  { width: 240, align: 'right' });
  doc.text('תאריך: _______________________',           310, y + 60,  { width: 240, align: 'right' });
  // Left column — work manager
  doc.text('שם מנהל העבודה: _______________________',  LEFT, y,      { width: 240, align: 'right' });
  doc.text('חתימה: _______________________',           LEFT, y + 30,  { width: 240, align: 'right' });
  doc.text('תאריך: _______________________',           LEFT, y + 60,  { width: 240, align: 'right' });
}

// ── Hazards report ─────────────────────────────────────────────────────────────
export function generateHazardsPDF(hazards) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    header(doc,
      'דוח מפגעי בטיחות פתוחים',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ: ${hazards.length} מפגעים`
    );

    if (hazards.length === 0) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text('אין מפגעים פתוחים כרגע.', LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      const sev = SEVERITY_LABEL[h.severity] || h.severity;
      const sevColor = { Low: '#16a34a', Medium: '#d97706', High: '#ea580c', Urgent: '#dc2626' }[h.severity] || '#374151';

      doc.font('Bold').fontSize(13).fillColor(sevColor)
         .text(`מפגע #${h.id} — ${sev}`, LEFT, doc.y, { width: CONT_W, align: 'right' });
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
               .text('תמונת המפגע:', LEFT, doc.y, { width: CONT_W, align: 'right' });
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

// ── Incidents report ───────────────────────────────────────────────────────────
export function generateIncidentsPDF(incidents) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    header(doc,
      'דוח אירועי בטיחות',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ: ${incidents.length} אירועים`
    );

    if (incidents.length === 0) {
      doc.font('Regular').fontSize(14).fillColor('#6b7280')
         .text('אין אירועים מדווחים.', LEFT, doc.y, { width: CONT_W, align: 'center' });
    }

    for (let i = 0; i < incidents.length; i++) {
      const inc = incidents[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      doc.font('Bold').fontSize(13).fillColor('#dc2626')
         .text(`אירוע #${inc.id} — ${INCIDENT_LABEL[inc.incident_type] || inc.incident_type}`,
               LEFT, doc.y, { width: CONT_W, align: 'right' });
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

// ── Audit report ───────────────────────────────────────────────────────────────
export function generateAuditPDF(audit, items) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    const passes = items.filter(i => i.status === 'pass').length;
    const fails  = items.filter(i => i.status === 'fail').length;
    const pct    = items.length ? Math.round(passes / items.length * 100) : 0;

    header(doc,
      `דוח בקרת בטיחות — ${AUDIT_LABEL[audit.audit_type] || audit.audit_type}`,
      `${audit.project_name || ''}   |   מפקח: ${audit.inspector_name}   |   ${new Date(audit.created_at).toLocaleDateString('he-IL')}`
    );

    // Summary row
    const summaryY = doc.y;
    doc.font('Regular').fontSize(12).fillColor('#111827')
       .text(`ציון: ${pct}%   ·   תקין: ${passes}   ·   ליקויים: ${fails}   ·   סה"כ: ${items.length}`,
             LEFT, summaryY, { width: CONT_W, align: 'right' });
    doc.moveDown(1.2);

    // Group by category
    const categories = [...new Set(items.map(i => i.category))];
    for (const cat of categories) {
      if (doc.y > 700) doc.addPage();

      // Category heading
      doc.font('Bold').fontSize(12).fillColor('#1e40af')
         .text(cat, LEFT, doc.y, { width: CONT_W, align: 'right' });
      doc.moveDown(0.4);

      const catItems = items.filter(i => i.category === cat);
      for (const item of catItems) {
        if (doc.y > 720) doc.addPage();

        const color = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
        const mark  = item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '—';
        const y = doc.y;

        // Item text — right-aligned in content area, leaving space for mark on far left
        doc.font('Regular').fontSize(11).fillColor('#111827')
           .text(item.item_text, LEFT + 25, y, { width: CONT_W - 25, align: 'right' });
        // Mark on far left
        doc.font('Bold').fontSize(12).fillColor(color)
           .text(mark, LEFT, y, { width: 20, align: 'center' });

        if (item.notes) {
          doc.font('Regular').fontSize(10).fillColor('#6b7280')
             .text(`הערה: ${item.notes}`, LEFT + 25, doc.y, { width: CONT_W - 25, align: 'right' });
        }
        doc.moveDown(0.25);
      }
      doc.moveDown(0.3);
    }

    signature(doc);
    doc.end();
  });
}
