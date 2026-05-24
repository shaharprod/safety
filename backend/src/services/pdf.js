import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

const SEVERITY_LABEL = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABEL   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };

function fetchImageBuffer(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', () => resolve(null));
    }).on('error', () => resolve(null));
  });
}

export function generateHazardsPDF(hazards) {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Header ───────────────────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold')
      .text('SafetyOS', { align: 'center' });
    doc.fontSize(14).font('Helvetica')
      .text('דוח מפגעי בטיחות פתוחים', { align: 'center' });
    doc.fontSize(11).fillColor('#6b7280')
      .text(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}   |   סה"כ מפגעים: ${hazards.length}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(2).strokeColor('#1e40af').stroke();
    doc.moveDown(1);

    if (hazards.length === 0) {
      doc.fontSize(14).fillColor('#374151').text('אין מפגעים פתוחים כרגע.', { align: 'center' });
      doc.end();
      return;
    }

    // ─── Hazard entries ───────────────────────────────────────────────────────
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];

      if (doc.y > 650) doc.addPage();

      // Row header
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af')
        .text(`מפגע #${h.id} — ${SEVERITY_LABEL[h.severity] || h.severity}`, { continued: false });

      doc.fontSize(11).font('Helvetica').fillColor('#111827');

      const rows = [
        ['תיאור',        h.description],
        ['ממונה אחראי',  h.supervisor_name],
        ['כתובת מייל',   h.supervisor_email],
        ['סטטוס',        STATUS_LABEL[h.status] || h.status],
        ['תאריך דיווח',  new Date(h.created_at).toLocaleDateString('he-IL')]
      ];

      rows.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
           .font('Helvetica').text(value || '—');
      });

      // Image (attempt to embed)
      try {
        const imgBuf = await fetchImageBuffer(h.image_url);
        if (imgBuf && imgBuf.length > 0) {
          if (doc.y > 580) doc.addPage();
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor('#6b7280').text('תמונת המפגע:');
          doc.image(imgBuf, { width: 280, align: 'center' });
        }
      } catch {
        doc.fontSize(10).fillColor('#9ca3af').text('[תמונה לא זמינה]');
      }

      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(0.5).strokeColor('#d1d5db').stroke();
      doc.moveDown(0.8);
    }

    // ─── Signature section ────────────────────────────────────────────────────
    if (doc.y > 680) doc.addPage();
    doc.moveDown(1);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827')
      .text('אישור ועדת בטיחות', { underline: true });
    doc.moveDown(0.5);

    const sigY = doc.y;
    // Left sig
    doc.fontSize(11).font('Helvetica').fillColor('#374151');
    doc.text('שם יועץ הבטיחות: _______________________', 40, sigY);
    doc.text('חתימה: _______________________', 40, sigY + 30);
    doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 40, sigY + 60);

    // Right sig
    doc.text('שם מנהל העבודה: _______________________', 320, sigY);
    doc.text('חתימה: _______________________', 320, sigY + 30);
    doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, 320, sigY + 60);

    doc.end();
  });
}
