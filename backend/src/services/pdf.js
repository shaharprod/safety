import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';
import path from 'path';

const FONT_REGULAR = 'C:\\Windows\\Fonts\\Alef-Regular.ttf';
const FONT_BOLD    = 'C:\\Windows\\Fonts\\Alef-Bold.ttf';

const SEVERITY_LABEL = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABEL   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const INCIDENT_LABEL = { near_miss: 'כמעט ונפגע', injury: 'תאונת עבודה', property_damage: 'נזק לרכוש' };
const AUDIT_LABEL    = { work: 'בטיחות בעבודה', traffic: 'בטיחות בתנועה', education: 'מוסדות חינוך' };

// Fetch remote image into a Buffer (for embedding in PDF)
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

// Register fonts + set RTL defaults on a PDFDocument
function applyFonts(doc) {
  doc.registerFont('Regular', FONT_REGULAR);
  doc.registerFont('Bold',    FONT_BOLD);
  doc.font('Regular');
}

function header(doc, title, subtitle) {
  doc.font('Bold').fontSize(22).text(title, { align: 'right' });
  if (subtitle) doc.font('Regular').fontSize(12).fillColor('#6b7280').text(subtitle, { align: 'right' });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(2).strokeColor('#1e40af').stroke();
  doc.moveDown(1);
}

function row(doc, label, value) {
  if (!value) return;
  const y = doc.y;
  doc.font('Bold').fontSize(11).fillColor('#374151')
     .text(`:${label}`, 40, y, { width: 120, align: 'right' });
  doc.font('Regular').fontSize(11).fillColor('#111827')
     .text(String(value), 170, y, { width: 350, align: 'right' });
  doc.moveDown(0.3);
}

function divider(doc) {
  doc.moveDown(0.4);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
  doc.moveDown(0.6);
}

function signature(doc) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(2);
  doc.font('Bold').fontSize(13).fillColor('#111827').text('אישורים וחתימות', { align: 'right', underline: true });
  doc.moveDown(1);
  const y = doc.y;
  doc.font('Regular').fontSize(11);
  doc.text('שם יועץ הבטיחות: _______________________', 310, y, { width: 240, align: 'right' });
  doc.text('חתימה: _______________________',           310, y + 30, { width: 240, align: 'right' });
  doc.text('תאריך: _______________________',           310, y + 60, { width: 240, align: 'right' });
  doc.text('שם מנהל העבודה: _______________________',  40,  y, { width: 240, align: 'right' });
  doc.text('חתימה: _______________________',           40,  y + 30, { width: 240, align: 'right' });
  doc.text('תאריך: _______________________',           40,  y + 60, { width: 240, align: 'right' });
}

// ── Hazards report ─────────────────────────────────────────────────────────
export function generateHazardsPDF(hazards) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    header(doc,
      'דוח מפגעי בטיחות פתוחים',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ: ${hazards.length} מפגעים`
    );

    if (hazards.length === 0) {
      doc.font('Regular').fontSize(14).text('אין מפגעים פתוחים כרגע.', { align: 'center' });
    }

    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      doc.font('Bold').fontSize(13).fillColor('#1e40af')
         .text(`מפגע #${h.id} — ${SEVERITY_LABEL[h.severity] || h.severity}`, { align: 'right' });
      doc.moveDown(0.3);
      row(doc, 'תיאור',         h.description);
      row(doc, 'ממונה',         h.supervisor_name);
      row(doc, 'מייל',          h.supervisor_email);
      row(doc, 'דחיפות',        SEVERITY_LABEL[h.severity] || h.severity);
      row(doc, 'סטטוס',         STATUS_LABEL[h.status] || h.status);
      row(doc, 'תאריך דיווח',   new Date(h.created_at).toLocaleDateString('he-IL'));

      if (h.image_url) {
        try {
          const imgBuf = await fetchImage(h.image_url);
          if (imgBuf?.length) {
            if (doc.y > 600) doc.addPage();
            doc.font('Bold').fontSize(10).fillColor('#6b7280').text('תמונת המפגע:', { align: 'right' });
            doc.image(imgBuf, { width: 280, align: 'right' });
          }
        } catch { /* skip if image unavailable */ }
      }
      divider(doc);
    }

    signature(doc);
    doc.end();
  });
}

// ── Incidents report ───────────────────────────────────────────────────────
export function generateIncidentsPDF(incidents) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    header(doc,
      'דוח אירועי בטיחות',
      `תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ: ${incidents.length} אירועים`
    );

    if (incidents.length === 0) {
      doc.font('Regular').fontSize(14).text('אין אירועים מדווחים.', { align: 'center' });
    }

    for (let i = 0; i < incidents.length; i++) {
      const inc = incidents[i];
      if (doc.y > 650 && i > 0) doc.addPage();

      doc.font('Bold').fontSize(13).fillColor('#dc2626')
         .text(`אירוע #${inc.id} — ${INCIDENT_LABEL[inc.incident_type] || inc.incident_type}`, { align: 'right' });
      doc.moveDown(0.3);
      row(doc, 'תיאור',          inc.description);
      row(doc, 'מיקום',          inc.location);
      row(doc, 'מעורבים',        inc.involved_parties);
      row(doc, 'גורם מיידי',     inc.immediate_cause);
      row(doc, 'גורם שורש',      inc.root_cause);
      row(doc, 'פעולות שננקטו',  inc.actions_taken);
      row(doc, 'שם המדווח',      inc.reporter_name);
      row(doc, 'תאריך',          new Date(inc.created_at).toLocaleDateString('he-IL'));
      divider(doc);
    }

    signature(doc);
    doc.end();
  });
}

// ── Audit report ───────────────────────────────────────────────────────────
export function generateAuditPDF(audit, items) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    applyFonts(doc);
    doc.fillColor('#111827');

    const passes = items.filter(i => i.status === 'pass').length;
    const fails  = items.filter(i => i.status === 'fail').length;

    header(doc,
      `דוח בקרת בטיחות — ${AUDIT_LABEL[audit.audit_type] || audit.audit_type}`,
      `${audit.project_name || ''}   |   מפקח: ${audit.inspector_name}   |   ${new Date(audit.created_at).toLocaleDateString('he-IL')}`
    );

    doc.font('Regular').fontSize(12)
       .text(`תקין: ${passes}   ·   ליקויים: ${fails}   ·   סה"כ: ${items.length}`, { align: 'right' });
    doc.moveDown(1);

    for (const item of items) {
      if (doc.y > 700) doc.addPage();
      const color = item.status === 'pass' ? '#16a34a' : item.status === 'fail' ? '#dc2626' : '#6b7280';
      const mark  = item.status === 'pass' ? '✓' : item.status === 'fail' ? '✗' : '—';
      doc.font('Bold').fontSize(11).fillColor(color).text(mark, 40, doc.y, { continued: true, width: 20 });
      doc.font('Regular').fillColor('#111827').text(`  ${item.item_text}`, { width: 490, align: 'right' });
      if (item.notes) {
        doc.font('Regular').fontSize(10).fillColor('#6b7280')
           .text(`הערה: ${item.notes}`, { indent: 30, align: 'right' });
      }
      doc.moveDown(0.2);
    }

    signature(doc);
    doc.end();
  });
}
