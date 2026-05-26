import { pool } from './db.js';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS subcontractors (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) UNIQUE,
  contact_phone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS site_workers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  id_number VARCHAR(50) UNIQUE NOT NULL,
  subcontractor_id INT REFERENCES subcontractors(id) ON DELETE SET NULL,
  has_height_clearance BOOLEAN DEFAULT FALSE,
  last_training_date DATE,
  google_email VARCHAR(255),
  worker_role VARCHAR(30) NOT NULL DEFAULT 'worker'
    CHECK (worker_role IN ('worker', 'project_manager', 'safety_officer'))
);

CREATE TABLE IF NOT EXISTS safety_hazards (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  supervisor_email VARCHAR(255) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('Low','Medium','High','Urgent')),
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open','In_Progress','Resolved')),
  treated_by_id INT,
  treated_at TIMESTAMP,
  treatment_notes TEXT,
  resolved_by_id INT,
  resolved_at TIMESTAMP,
  resolved_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_access_logs (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES site_workers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_status VARCHAR(50) CHECK (access_status IN ('Allowed','Denied_No_Training'))
);

CREATE TABLE IF NOT EXISTS safety_audits (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(50),
  inspector_name VARCHAR(255) NOT NULL,
  project_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Done')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_items (
  id SERIAL PRIMARY KEY,
  audit_id INT REFERENCES safety_audits(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  category VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pass', 'fail', 'na', 'pending')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safety_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(50) CHECK (incident_type IN ('near_miss', 'injury', 'property_damage')),
  description TEXT NOT NULL,
  location VARCHAR(255),
  involved_parties TEXT,
  immediate_cause TEXT,
  root_cause TEXT,
  actions_taken TEXT,
  image_url TEXT,
  reporter_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  user_name VARCHAR(255),
  reference_id INT,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_inspections (
  id SERIAL PRIMARY KEY,
  tool_type VARCHAR(100) NOT NULL,
  inspector_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Done')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_inspection_items (
  id SERIAL PRIMARY KEY,
  inspection_id INT REFERENCES tool_inspections(id) ON DELETE CASCADE,
  tool_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'pending' CHECK (condition IN ('pass', 'fail', 'na', 'pending')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  start_date DATE,
  end_date DATE,
  manager_name VARCHAR(255),
  manager_phone VARCHAR(50),
  manager_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS worker_certifications (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES site_workers(id) ON DELETE CASCADE,
  cert_type VARCHAR(100) NOT NULL,
  cert_number VARCHAR(100),
  issuing_authority VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'foreman' CHECK (role IN ('safety_officer', 'foreman', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_permits (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  permit_type TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

`;

export async function runMigrations() {
  if (!process.env.DATABASE_URL) return;
  try {
    await pool.query(MIGRATION_SQL);
    // Seed sample company permits
    await pool.query(`
      INSERT INTO company_permits (title, permit_type, issuing_authority, issue_date, expiry_date, document_url, notes) VALUES
        ('היתר בנייה - מגדל א׳',            'היתר בנייה',          'הוועדה המקומית לתכנון ובנייה תל אביב', '2024-03-01', '2026-08-28', '', 'היתר לבניית מגדל מגורים 22 קומות'),
        ('אישור כיבוי אש - אתר ראשי',       'אישור כיבוי אש',      'כבאות והצלה לישראל - מחוז דן',        '2025-01-15', '2026-07-14', '', 'אישור מערכות גילוי וכיבוי אש'),
        ('אישור חשמל ראשי',                  'אישור חשמל',          'חברת חשמל לישראל',                    '2025-04-10', '2026-10-09', '', 'אישור חיבור חשמל זמני לאתר'),
        ('היתר עבודה בגובה - עונת 2026',     'היתר עבודה בגובה',    'משרד העבודה - אגף הבטיחות',           '2026-01-01', '2026-06-10', '', 'היתר לעבודות גובה מעל 5 מטר'),
        ('אישור בדיקת מנוף מגדלי',           'אישור בדיקת מנוף',    'מכון התקנים הישראלי',                 '2025-11-20', '2026-05-19', '', 'בדיקה תקופתית חצי-שנתית למנוף'),
        ('אישור ביטוח אחריות מקצועית',        'אישור ביטוח',         'הפניקס חברה לביטוח',                  '2026-01-01', '2026-12-31', '', 'פוליסת ביטוח אחריות מעסיקים וצד שלישי'),
        ('אישור סביבתי - טיפול בפסולת',       'אישור סביבתי',        'המשרד להגנת הסביבה',                  '2024-06-01', '2025-05-31', '', 'היתר פינוי ואחסון פסולת בנייה')
      ON CONFLICT (title) DO NOTHING
    `);
    // Patch: add 'admin' to role CHECK for existing DBs
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await pool.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('safety_officer', 'foreman', 'admin'))`);
    // Ensure admin user exists with role 'admin'
    await pool.query(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'מנהל מערכת', 'admin')
      ON CONFLICT (username) DO UPDATE SET role = 'admin', full_name = 'מנהל מערכת'
    `);
    console.log('✅ DB migrations applied');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  }
}
