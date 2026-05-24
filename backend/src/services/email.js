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

export async function sendHazardAlert({ hazardId, description, severity, supervisorEmail, supervisorName, imageUrl }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

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
