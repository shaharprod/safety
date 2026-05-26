import { pool } from './db.js';

const SEED_SQL = `
BEGIN;

INSERT INTO subcontractors (company_name, tax_id, contact_phone) VALUES
  ('חברת א. ביצוע בע"מ',     '510123456', '054-1234567'),
  ('קבוצת בנייה מרכז',        '520234567', '052-3456789'),
  ('יצחק שלום ובניו',         '530345678', '050-5678901'),
  ('פרויקטים ופתרונות בע"מ', '540456789', '053-7890123');

INSERT INTO site_workers (first_name, last_name, id_number, subcontractor_id, has_height_clearance, last_training_date, google_email, worker_role) VALUES
  ('משה',   'לוי',          '123456789', 1, true,  '2026-01-15', 'moshe.levi@gmail.com',  'safety_officer'),
  ('שרה',   'כהן',          '234567890', 1, false, '2025-06-10', 'sarah.cohen@gmail.com', 'project_manager'),
  ('דני',   'אברהם',        '345678901', 1, true,  '2026-02-20', null,                    'worker'),
  ('רחל',   'פרץ',          '456789012', 2, true,  '2025-10-05', null,                    'worker'),
  ('יוסי',  'מזרחי',        '567890123', 2, false, '2025-04-01', null,                    'worker'),
  ('אורן',  'שפירא',        '678901234', 2, true,  '2026-03-10', null,                    'project_manager'),
  ('מיכל',  'גולדברג',      '789012345', 3, false, '2025-02-15', null,                    'worker'),
  ('עמית',  'בן-דוד',       '890123456', 3, true,  '2026-04-20', null,                    'worker'),
  ('נועה',  'רוזנברג',      '901234567', 3, false, '2026-01-08', null,                    'worker'),
  ('איתי',  'חדד',          '012345678', 4, true,  '2026-05-01', null,                    'safety_officer'),
  ('רון',   'ביטון',        '112233445', 4, true,  '2025-11-10', null,                    'worker'),
  ('לימור', 'אלון',         '223344556', 4, false, '2025-03-14', null,                    'worker'),
  ('גיא',   'נחמיאס',       '334455667', 1, true,  '2026-04-05', null,                    'worker'),
  ('טל',    'ברקוביץ',      '445566778', 2, true,  '2025-12-18', null,                    'project_manager'),
  ('אביב',  'שמש',          '556677889', 3, false, '2026-02-28', null,                    'worker'),
  ('הילה',  'לוין',         '667788990', 4, true,  '2025-08-07', null,                    'worker'),
  ('נדב',   'כץ',           '778899001', 1, true,  '2026-03-22', null,                    'worker'),
  ('יעל',   'מור',          '889900112', 2, false, '2025-07-30', null,                    'worker'),
  ('תמר',   'שוחט',         '990011223', 3, true,  '2026-05-10', null,                    'safety_officer'),
  ('בועז',  'פינקלשטיין',   '001122334', 4, true,  '2026-01-25', null,                    'worker');

INSERT INTO projects (name, location, start_date, end_date, manager_name, manager_phone, manager_email, status) VALUES
  ('מגדל מגורים א׳',          'תל אביב',   '2026-01-01', '2026-12-31', 'דני כהן',       '052-1234567', 'dani@site.com',   'active'),
  ('שיפוץ קמפוס משרדים',       'ירושלים',   '2026-03-01', '2026-09-30', 'רחל לוי',       '054-7654321', 'rachel@site.com', 'active'),
  ('סלילת כביש עוקף',           'פתח תקווה', '2025-11-01', '2026-06-30', 'אורן שפירא',   '050-3344556', 'oren@site.com',   'active'),
  ('מרכז לוגיסטיקה שלב ב',     'אשדוד',     '2026-02-15', '2027-02-14', 'יוסי מזרחי',   '053-9988776', 'yossi@site.com',  'active'),
  ('שדרוג תשתיות מים',          'חיפה',      '2025-09-01', '2026-07-31', 'משה לוי',       '052-1112223', 'moshe@site.com',  'active'),
  ('בניין ציבורי עירייה',       'באר שבע',   '2025-06-01', '2025-12-31', 'עמית בן-דוד',  '054-5566778', 'amit@site.com',   'completed'),
  ('מפעל מזון הרחבה',           'רחובות',    '2026-04-01', '2026-10-31', 'מיכל גולדברג', '050-7788990', 'michal@site.com', 'active'),
  ('שיקום מבנה היסטורי',        'יפו',       '2025-10-01', '2026-08-31', 'נועה רוזנברג', '052-6677889', 'noa@site.com',    'on_hold');

INSERT INTO users (username, password_hash, full_name, role) VALUES
  ('foreman1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'דני אברהם',  'foreman'),
  ('foreman2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'אורן שפירא', 'foreman')
ON CONFLICT (username) DO NOTHING;

INSERT INTO safety_hazards (description, image_url, supervisor_email, supervisor_name, severity, status, treated_by_id, treated_at, treatment_notes, resolved_by_id, resolved_at, resolved_notes, created_at) VALUES
  ('גידור חסר בקצה פיגום בקומה שלישית',          '', 'admin@site.com', 'משה לוי',      'High',   'Open',        null, null,                           null,                                             null, null,                           null,                                                      NOW() - INTERVAL '2 days'),
  ('מטף כיבוי אש פג תוקף ביציאת חירום',           '', 'admin@site.com', 'נועה רוזנברג', 'Medium', 'In_Progress', 1,    NOW() - INTERVAL '3 days',      'בוצע תיאום עם ספק לחידוש מטף',                  null, null,                           null,                                                      NOW() - INTERVAL '5 days'),
  ('כבל חשמל חשוף ליד אזור הרטבה',                '', 'admin@site.com', 'איתי חדד',     'Urgent', 'Open',        null, null,                           null,                                             null, null,                           null,                                                      NOW() - INTERVAL '1 day'),
  ('שוחת ניקוז פתוחה ללא כיסוי בשטח הבנייה',     '', 'admin@site.com', 'דני אברהם',    'High',   'Resolved',    1,    NOW() - INTERVAL '8 days',      'הוזמן כיסוי זמני',                               1,    NOW() - INTERVAL '6 days',      'הותקן כיסוי קבוע ונבדק על ידי מהנדס בטיחות',    NOW() - INTERVAL '10 days'),
  ('אבק בניין בריכוז גבוה ללא ציוד מגן',          '', 'admin@site.com', 'אורן שפירא',   'Medium', 'Open',        null, null,                           null,                                             null, null,                           null,                                                      NOW() - INTERVAL '3 days'),
  ('מכשיר הרמה ללא אישור תקופתי',                 '', 'admin@site.com', 'תמר שוחט',     'High',   'In_Progress', 1,    NOW() - INTERVAL '1 day',       'הוזמן בודק מוסמך לביצוע בדיקה',                 null, null,                           null,                                                      NOW() - INTERVAL '4 days'),
  ('חומרים דליקים מאוחסנים ללא אישור',            '', 'admin@site.com', 'גיא נחמיאס',  'Urgent', 'Resolved',    1,    NOW() - INTERVAL '15 days',     'הועברו לאזור אחסון מאושר',                       1,    NOW() - INTERVAL '13 days',     'אוחסנו בהתאם לנוהל ונבדקו על ידי ממונה בטיחות', NOW() - INTERVAL '18 days'),
  ('פיגום ללא לוחות הגנה בצד המשתמשים',           '', 'admin@site.com', 'רון ביטון',    'Low',    'Open',        null, null,                           null,                                             null, null,                           null,                                                      NOW() - INTERVAL '6 hours');

INSERT INTO safety_audits (audit_type, inspector_name, project_name, status, created_at) VALUES
  ('כללי', 'משה לוי',      'מגדל מגורים א',        'Open', NOW() - INTERVAL '3 days'),
  ('גובה', 'תמר שוחט',     'סלילת כביש עוקף',      'Done', NOW() - INTERVAL '10 days'),
  ('חשמל', 'איתי חדד',     'מרכז לוגיסטיקה שלב ב', 'Open', NOW() - INTERVAL '1 day'),
  ('אש',   'נועה רוזנברג', 'שיפוץ קמפוס משרדים',   'Done', NOW() - INTERVAL '20 days');

INSERT INTO audit_items (audit_id, item_text, category, status, notes, photo_url) VALUES
  (1, 'ציוד מגן אישי זמין לכלל העובדים',   'ציוד מגן', 'pass',    'נבדק ואושר — 18 סטים זמינים',      null),
  (1, 'גיאוגרפיית עבודה בגובה תקינה',      'גובה',     'fail',    'חסרים מעקות בקצה הגג בקומה 6',     null),
  (1, 'מטפי כיבוי אש תקינים ובתוקף',       'אש',       'pass',    'תאריכי תפוגה תקינים עד 12/2026',   null),
  (1, 'שלטי בטיחות ברורים ונגישים',         'כללי',     'na',      'לא רלוונטי לשלב עבודה זה',          null),
  (1, 'ארגז עזרה ראשונה מאובזר',            'רפואה',    'pass',    'נבדק ומאובזר',                      null),
  (2, 'רתמות בטיחות תקינות לכלל העובדים',   'גובה',     'pass',    'נבדקו 12 רתמות — תקינות',          null),
  (2, 'נקודות עיגון מאושרות על פי תקן',     'גובה',     'pass',    'תקין',                              null),
  (2, 'הדרכת עבודה בגובה לכלל הצוות',       'הדרכה',    'fail',    'חסרים 3 עובדים שלא עדכנו הדרכה',  null),
  (2, 'גדרות פיגום מותקנות כראוי',          'גובה',     'pass',    'תקין',                              null),
  (3, 'לוחות חשמל נעולים ומסומנים',         'חשמל',     'pass',    'תקין',                              null),
  (3, 'כבלים בהתאם לתקן ובמצב תקין',        'חשמל',     'fail',    'כבל חשוף נמצא ליד הכניסה הצפונית', null),
  (3, 'ציוד גשום מוגן מפני מים',            'חשמל',     'pending', '',                                   null),
  (4, 'מטפי כיבוי אש מוצבים בנגישות',      'אש',       'pass',    '8 מטפים תקינים',                   null),
  (4, 'יציאות חירום פנויות ומסומנות',       'אש',       'pass',    'תקין',                              null),
  (4, 'תוכנית פינוי מודפסת ומוצגת',         'אש',       'pass',    'מוצגת בכניסה ובקומה 3',             null);

INSERT INTO safety_incidents (incident_type, description, location, involved_parties, immediate_cause, root_cause, actions_taken, image_url, reporter_name, created_at) VALUES
  ('near_miss',       'חומר כימי שפוך על רצפת המחסן ללא סימון', 'מחסן ראשי',          'שלושה עובדים',     'אחסון לא תקין',                        'חוסר הדרכה על נוהלי אחסון',     'ניקוי מיידי, תלייה שלטים, הדרכת צוות',       '', 'יוסי מזרחי', NOW() - INTERVAL '3 days'),
  ('injury',          'עובד נפגע מחפץ שנפל מגובה',               'אזור פיגומים קומה 4','דני אברהם (נפגע)', 'חפץ לא מאובטח על הפיגום',             'היעדר נוהל אבטחת כלים בגובה',   'פינוי לחדר מיון, תחקיר, עדכון נוהל',        '', 'משה לוי',    NOW() - INTERVAL '7 days'),
  ('property_damage', 'מחפר פגע בצינור מים ראשי',                'אזור חפירה צפון',    'מפעיל המחפר',      'תיאום לא מספיק עם ספקי תשתית',        'מפות תשתית לא עודכנו',           'סגירת מים, הזמנת תיקון, עדכון מפות',        '', 'אורן שפירא', NOW() - INTERVAL '14 days'),
  ('near_miss',       'גז דליק לא כובה בסיום יום עבודה',         'מתחם ריתוך',         'צוות ריתוך',       'שכחה בסיום משמרת',                     'חוסר נוהל סגירה מסודר',          'נוהל סגירה חדש, בדיקת סיום משמרת',          '', 'גיא נחמיאס', NOW() - INTERVAL '21 days'),
  ('near_miss',       'עובד החליק על משטח רטוב ללא שלט אזהרה',   'כניסה ראשית',        'יעל מור',          'רצפה רטובה לאחר שטיפה',                'נוהל שטיפה ללא חסימת אזור',      'שלטי אזהרה, עדכון נוהל שטיפה',              '', 'תמר שוחט',   NOW() - INTERVAL '5 days');

INSERT INTO tool_inspections (tool_type, inspector_name, location, expiry_date, status, created_at) VALUES
  ('מנוף הרמה',  'איתי חדד',    'אזור אחסון ציוד קומה קרקע', '2026-08-15', 'Open', NOW() - INTERVAL '2 days'),
  ('פיגום מתכת', 'משה לוי',     'חזית המבנה',                  '2026-06-30', 'Done', NOW() - INTERVAL '12 days'),
  ('מגרסת בטון', 'תמר שוחט',    'אזור הריסה',                  '2026-07-20', 'Open', NOW() - INTERVAL '1 day'),
  ('ציוד ריתוך', 'אורן שפירא',  'מתחם ריתוך',                  '2026-09-01', 'Done', NOW() - INTERVAL '20 days');

INSERT INTO tool_inspection_items (inspection_id, tool_name, serial_number, condition, notes) VALUES
  (1, 'מנוף ראשי',       'CRN-2022-001', 'pass',    'תקין, שמן בתקינות'),
  (1, 'כבל הרמה',        'CRN-2022-002', 'pass',    'ללא סדקים'),
  (1, 'ווי הרמה',        'CRN-2022-003', 'fail',    'שחיקה חריגה — יש להחליף'),
  (2, 'פריים פיגום A',   'SCAF-001',     'pass',    'תקין'),
  (2, 'פריים פיגום B',   'SCAF-002',     'pass',    'תקין'),
  (2, 'לוחות עבודה',     'SCAF-003',     'pass',    'תקינים, ללא שבר'),
  (2, 'מוטות רוחב',      'SCAF-004',     'na',      'לא רלוונטי לסוג עבודה זה'),
  (3, 'גלגל שיניים',     'CRUS-001',     'pass',    'תקין'),
  (3, 'מנוע הידראולי',   'CRUS-002',     'pending', 'ממתין לבדיקת לחץ'),
  (4, 'מכשיר ריתוך MIG', 'WLD-001',      'pass',    'תקין'),
  (4, 'מסכת ריתוך',      'WLD-002',      'pass',    'ללא נזק'),
  (4, 'צינורות גז',       'WLD-003',      'fail',    'סימני בלאי — להחליף');

INSERT INTO worker_certifications (worker_id, cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes) VALUES
  (1,  'עבודה בגובה',  'HW-2024-001', 'מכון הבטיחות לעבודה', '2024-01-10', '2026-01-10', 'פג תוקף'),
  (1,  'ממונה בטיחות', 'SO-2023-015', 'משרד העבודה',          '2023-06-01', '2026-06-01', 'הסמכה מלאה'),
  (3,  'הפעלת מלגזה',  'FL-2025-033', 'מוסד הסמכה מוכר',     '2025-03-15', '2027-03-15', ''),
  (6,  'עבודה בגובה',  'HW-2024-088', 'מכון הבטיחות לעבודה', '2024-08-20', '2026-08-20', ''),
  (8,  'הפעלת מנוף',   'CR-2025-011', 'רשות הניפוי',          '2025-01-05', '2027-01-05', ''),
  (10, 'ממונה בטיחות', 'SO-2024-042', 'משרד העבודה',          '2024-09-01', '2027-09-01', ''),
  (10, 'עזרה ראשונה',  'FA-2025-007', 'מגן דוד אדום',         '2025-02-14', '2027-02-14', ''),
  (19, 'ממונה בטיחות', 'SO-2025-031', 'משרד העבודה',          '2025-05-20', '2028-05-20', 'הסמכה חדשה'),
  (4,  'הפעלת מלגזה',  'FL-2024-077', 'מוסד הסמכה מוכר',     '2024-11-10', '2026-11-10', ''),
  (14, 'עבודה בגובה',  'HW-2025-055', 'מכון הבטיחות לעבודה', '2025-06-30', '2027-06-30', '');

INSERT INTO site_access_logs (worker_id, access_status, check_in_time) VALUES
  (1,  'Allowed',            NOW() - INTERVAL '2 hours'),
  (3,  'Allowed',            NOW() - INTERVAL '2 hours'),
  (8,  'Allowed',            NOW() - INTERVAL '3 hours'),
  (13, 'Allowed',            NOW() - INTERVAL '3 hours'),
  (5,  'Denied_No_Training', NOW() - INTERVAL '4 hours'),
  (12, 'Denied_No_Training', NOW() - INTERVAL '4 hours'),
  (7,  'Denied_No_Training', NOW() - INTERVAL '5 hours'),
  (15, 'Allowed',            NOW() - INTERVAL '1 hour'),
  (19, 'Allowed',            NOW() - INTERVAL '30 minutes'),
  (20, 'Allowed',            NOW() - INTERVAL '1 hour'),
  (2,  'Denied_No_Training', NOW() - INTERVAL '6 hours'),
  (17, 'Allowed',            NOW() - INTERVAL '2 hours'),
  (10, 'Allowed',            NOW() - INTERVAL '90 minutes');

INSERT INTO activity_logs (action_type, description, user_name, reference_id, reference_type) VALUES
  ('hazard_reported',        'מפגע חדש: גידור חסר בקצה פיגום בקומה שלישית', 'משה לוי',      1, 'hazard'),
  ('hazard_reported',        'מפגע חדש: כבל חשמל חשוף ליד אזור הרטבה',      'איתי חדד',     3, 'hazard'),
  ('audit_started',          'בקרה חדשה (כללי): מגדל מגורים א — משה לוי',   'משה לוי',      1, 'audit'),
  ('audit_closed',           'בקרה סגורה #2',                                 'תמר שוחט',     2, 'audit'),
  ('incident_reported',      'אירוע: עובד נפגע מחפץ שנפל מגובה',            'משה לוי',      2, 'incident'),
  ('gate_check',             'בדיקת כניסה: דני אברהם — אושר',                null,            3, 'worker'),
  ('gate_check',             'בדיקת כניסה: יוסי מזרחי — נדחה',              null,            5, 'worker'),
  ('tool_inspection_started','בדיקת כלים: מנוף הרמה — איתי חדד',            'איתי חדד',     1, 'tool_inspection'),
  ('tool_inspection_closed', 'בדיקת כלים סגורה #2',                          'משה לוי',      2, 'tool_inspection'),
  ('hazard_resolved',        'מפגע טופל: שוחת ניקוז פתוחה',                 'admin',         4, 'hazard');

COMMIT;
`;

export async function runSeed() {
  if (!process.env.DATABASE_URL) return;

  const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM subcontractors');
  if (rows[0].cnt > 0) {
    console.log('ℹ️  Demo data already present — skipping seed');
    return;
  }

  await pool.query(SEED_SQL);
  console.log('✅ Demo data seeded (20 workers, 4 subcontractors, 8 projects, 8 hazards, 4 audits, 5 incidents, 4 tool inspections, 10 certifications)');
}
