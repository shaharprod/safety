import nodemailer from 'nodemailer';

const SEVERITY_COLOR = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#f97316',
  Urgent: '#ef4444'
};
const SEVERITY_LABEL = {
  Low: 'נמוכה',
  Medium: 'בינונית',
  High: 'גבוהה',
  Urgent: 'דחוף'
};

const PRIORITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
const PRIORITY_LABEL = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה', urgent: 'דחוף' };

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const APP_NAME = '"מערכת SafetyOS"';

// Shared email frame — keeps every coordination email visually consistent (RTL).
function emailShell(innerHtml) {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 22px; border-radius: 12px; background: #fff;">
      <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top:0;">
        🦺 SafetyOS — תיאום בטיחות
      </h2>
      ${innerHtml}
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center;">
        הודעה זו נשלחה ממערכת SafetyOS לצורך תיאום בטיחות בין ממונה הבטיחות למנהל הפרויקט
      </p>
    </div>`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('he-IL') : '—';
}

export async function sendHazardAlert({ hazardId, description, severity, supervisorEmail, supervisorName, imageUrl }) {
  const transporter = buildTransporter();

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const severityColor = SEVERITY_COLOR[severity] || '#6b7280';
  const severityLabel = SEVERITY_LABEL[severity] || severity;

  await transporter.sendMail({
    from: `"מערכת SafetyOS" <${process.env.SMTP_USER}>`,
    to: supervisorEmail,
    subject: `🚨 התראת בטיחות - מפגע חדש באתר (דיווח מס' ${hazardId || ''})`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; border: 1px solid #ffcccc; padding: 20px; border-radius: 10px; background: #fff;">
        <h2 style="color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          🦺 SafetyOS — התראת מפגע בטיחות
        </h2>
        <p style="font-size: 16px;">שלום <strong>${supervisorName}</strong>,</p>
        <p>נרשם מפגע בטיחות חדש באחריותך הדורש טיפול מיידי.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;">

        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          ${hazardId ? `
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; font-weight: bold; width: 140px;">מזהה דיווח:</td>
            <td style="padding: 10px;">#${hazardId}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px; font-weight: bold;">תיאור המפגע:</td>
            <td style="padding: 10px;">${description}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; font-weight: bold;">רמת דחיפות:</td>
            <td style="padding: 10px;">
              <span style="background: ${severityColor}; color: white; padding: 3px 12px; border-radius: 9999px; font-size: 14px; font-weight: bold;">
                ${severityLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">תאריך דיווח:</td>
            <td style="padding: 10px;">${new Date().toLocaleDateString('he-IL')}</td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;">
        <p style="font-weight: bold; margin-bottom: 8px;">📷 תמונת המפגע מהשטח:</p>
        <img src="${imageUrl}" alt="תמונת מפגע בטיחות"
          style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />

        <div style="margin-top: 24px; text-align: center;">
          <a href="${appUrl}/dashboard"
            style="background-color: #1e40af; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            עדכן סטטוס תיקון במערכת ←
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center;">
          הודעה זו נשלחה אוטומטית ממערכת SafetyOS • אין להשיב למייל זה
        </p>
      </div>
    `
  });
}

// ── Coordination: safety officer → project manager ──────────────────────────
// A new safety directive was issued on a project and assigned to its manager.
export async function sendDirectiveAssigned({ directive, projectName, appUrl }) {
  if (!directive?.assignee_email) return;
  const transporter = buildTransporter();
  const url = appUrl || process.env.APP_URL || 'http://localhost:5173';
  const color = PRIORITY_COLOR[directive.priority] || '#6b7280';
  const label = PRIORITY_LABEL[directive.priority] || directive.priority;

  await transporter.sendMail({
    from: `${APP_NAME} <${process.env.SMTP_USER}>`,
    to: directive.assignee_email,
    subject: `🦺 הנחיית בטיחות חדשה — ${projectName || 'פרויקט'} (#${directive.id})`,
    html: emailShell(`
      <p style="font-size: 16px;">שלום <strong>${directive.assignee_name || ''}</strong>,</p>
      <p>ממונה הבטיחות הוציא הנחיית בטיחות חדשה <strong>באחריותך</strong> בפרויקט שתחת ניהולך. נא לטפל ולעדכן את סטטוס הביצוע במערכת.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 8px;">
        <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:bold;width:140px;">פרויקט:</td><td style="padding:10px;">${projectName || '—'}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">נושא:</td><td style="padding:10px;font-weight:bold;">${directive.title}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:bold;">קטגוריה:</td><td style="padding:10px;">${directive.category || '—'}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">פירוט:</td><td style="padding:10px;">${directive.description || '—'}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:bold;">דחיפות:</td><td style="padding:10px;">
          <span style="background:${color};color:#fff;padding:3px 12px;border-radius:9999px;font-size:14px;font-weight:bold;">${label}</span></td></tr>
        <tr><td style="padding:10px;font-weight:bold;">לביצוע עד:</td><td style="padding:10px;">${fmtDate(directive.due_date)}</td></tr>
      </table>
      <div style="margin-top: 24px; text-align: center;">
        <a href="${url}/coordination" style="background-color:#1e40af;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-size:16px;font-weight:bold;">
          אשר קבלה ועדכן ביצוע ←
        </a>
      </div>
    `)
  });
}

// Coordination: project manager → safety officer.
// The directive status changed (acknowledged / reported done). Notify the officer.
export async function sendDirectiveUpdate({ directive, projectName, toEmail, kind, actorName }) {
  if (!toEmail) return;
  const transporter = buildTransporter();
  const isReport = kind === 'reported';
  const headline = isReport
    ? 'מנהל הפרויקט דיווח על ביצוע הנחיית בטיחות וממתין לאימותך'
    : 'מנהל הפרויקט אישר קבלת הנחיית הבטיחות והחל בטיפול';

  await transporter.sendMail({
    from: `${APP_NAME} <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${isReport ? '✅ דווח ביצוע' : '👍 אושרה קבלה'} — ${directive.title} (#${directive.id})`,
    html: emailShell(`
      <p style="font-size: 16px;">${headline}.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin-top: 8px;">
        <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:bold;width:140px;">פרויקט:</td><td style="padding:10px;">${projectName || '—'}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">נושא:</td><td style="padding:10px;font-weight:bold;">${directive.title}</td></tr>
        <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:bold;">עודכן ע״י:</td><td style="padding:10px;">${actorName || directive.assignee_name || '—'}</td></tr>
        ${isReport && directive.report_notes ? `<tr><td style="padding:10px;font-weight:bold;">דיווח הביצוע:</td><td style="padding:10px;">${directive.report_notes}</td></tr>` : ''}
      </table>
      ${isReport ? '<p style="margin-top:14px;">נא להיכנס למערכת לאימות וסגירת ההנחיה.</p>' : ''}
    `)
  });
}

// Coordination digest: safety officer sends the project manager a consolidated
// briefing of the open safety items on his project.
export async function sendProjectBriefing({ project, directives = [], openHazards = 0, message, appUrl }) {
  if (!project?.manager_email) return;
  const transporter = buildTransporter();
  const url = appUrl || process.env.APP_URL || 'http://localhost:5173';
  const today = new Date();
  const overdue = directives.filter(d => d.status !== 'closed' && d.due_date && new Date(d.due_date) < today);
  const open    = directives.filter(d => d.status === 'open');
  const inProg  = directives.filter(d => d.status === 'acknowledged');
  const pending = directives.filter(d => d.status === 'reported');

  const rowsHtml = directives.filter(d => d.status !== 'closed').map(d => {
    const color = PRIORITY_COLOR[d.priority] || '#6b7280';
    const isLate = d.due_date && new Date(d.due_date) < today && d.status !== 'closed';
    const statusTxt = { open: 'ממתין לטיפול', acknowledged: 'בטיפול', reported: 'דווח — ממתין לאימות' }[d.status] || d.status;
    return `<tr>
      <td style="border:1px solid #e5e7eb;padding:8px;font-weight:bold;">${d.title}</td>
      <td style="border:1px solid #e5e7eb;padding:8px;">${d.category || '—'}</td>
      <td style="border:1px solid #e5e7eb;padding:8px;"><span style="background:${color};color:#fff;padding:2px 8px;border-radius:9999px;font-size:12px;">${PRIORITY_LABEL[d.priority] || d.priority}</span></td>
      <td style="border:1px solid #e5e7eb;padding:8px;${isLate ? 'color:#dc2626;font-weight:bold;' : ''}">${fmtDate(d.due_date)}${isLate ? ' (באיחור)' : ''}</td>
      <td style="border:1px solid #e5e7eb;padding:8px;">${statusTxt}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="border:1px solid #e5e7eb;padding:12px;text-align:center;color:#16a34a;">אין הנחיות בטיחות פתוחות — כל הכבוד! 👏</td></tr>`;

  await transporter.sendMail({
    from: `${APP_NAME} <${process.env.SMTP_USER}>`,
    to: project.manager_email,
    subject: `🦺 תדריך בטיחות שבועי — ${project.name} (${fmtDate(today)})`,
    html: emailShell(`
      <p style="font-size:16px;">שלום <strong>${project.manager_name || ''}</strong>,</p>
      <p>להלן תמונת מצב הבטיחות בפרויקט <strong>${project.name}</strong> לתיאום והמשך טיפול:</p>
      <table style="width:100%;border-collapse:collapse;text-align:center;margin:12px 0;font-size:14px;">
        <tr>
          <td style="padding:10px;background:#fef2f2;border-radius:8px;"><div style="font-size:22px;font-weight:bold;color:#dc2626;">${overdue.length}</div>באיחור</td>
          <td style="width:8px;"></td>
          <td style="padding:10px;background:#fff7ed;border-radius:8px;"><div style="font-size:22px;font-weight:bold;color:#ea580c;">${open.length}</div>ממתין לטיפול</td>
          <td style="width:8px;"></td>
          <td style="padding:10px;background:#eff6ff;border-radius:8px;"><div style="font-size:22px;font-weight:bold;color:#2563eb;">${inProg.length + pending.length}</div>בטיפול / לאימות</td>
        </tr>
      </table>
      ${message ? `<p style="background:#f9fafb;border-right:3px solid #1e40af;padding:10px 14px;border-radius:6px;">${message}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
        <thead><tr style="background:#1e3a5f;color:#fff;">
          <th style="padding:8px;">נושא</th><th style="padding:8px;">קטגוריה</th><th style="padding:8px;">דחיפות</th><th style="padding:8px;">לביצוע עד</th><th style="padding:8px;">סטטוס</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${openHazards > 0 ? `<p style="margin-top:12px;color:#b45309;">בנוסף קיימים <strong>${openHazards}</strong> מפגעים פתוחים במערכת הדורשים מעקב.</p>` : ''}
      <div style="margin-top:22px;text-align:center;">
        <a href="${url}/coordination" style="background-color:#1e40af;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-size:16px;font-weight:bold;">
          פתח את לוח התיאום ←
        </a>
      </div>
    `)
  });
}
