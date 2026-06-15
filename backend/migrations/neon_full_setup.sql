-- SafetyOS — Full database setup for Neon PostgreSQL
-- Run this once in the Neon SQL editor after creating the project

-- ── Subcontractors ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subcontractors (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(50) UNIQUE,
  contact_phone VARCHAR(50)
);

-- ── Site workers ──────────────────────────────────────────────────────────────
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

-- ── Safety hazards ────────────────────────────────────────────────────────────
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

-- ── Site access logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_access_logs (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES site_workers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_status VARCHAR(50) CHECK (access_status IN ('Allowed','Denied_No_Training'))
);

-- ── Safety audits ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_audits (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(50),
  inspector_name VARCHAR(255) NOT NULL,
  project_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Done')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Audit items ───────────────────────────────────────────────────────────────
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

-- ── Safety incidents ──────────────────────────────────────────────────────────
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

-- ── Activity logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  action_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  user_name VARCHAR(255),
  reference_id INT,
  reference_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tool inspections ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_inspections (
  id SERIAL PRIMARY KEY,
  tool_type VARCHAR(100) NOT NULL,
  inspector_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Done')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tool inspection items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_inspection_items (
  id SERIAL PRIMARY KEY,
  inspection_id INT REFERENCES tool_inspections(id) ON DELETE CASCADE,
  tool_name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'pending' CHECK (condition IN ('pass', 'fail', 'na', 'pending')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Projects ──────────────────────────────────────────────────────────────────
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

-- ── Safety directives — coordination channel safety officer ⇄ project manager ─
CREATE TABLE IF NOT EXISTS safety_directives (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'אחר',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','acknowledged','reported','closed')),
  due_date DATE,
  issued_by VARCHAR(255),
  assignee_name VARCHAR(255),
  assignee_email VARCHAR(255),
  report_notes TEXT,
  close_notes TEXT,
  acknowledged_at TIMESTAMP,
  reported_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Worker certifications ─────────────────────────────────────────────────────
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

-- ── System users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'foreman' CHECK (role IN ('safety_officer', 'foreman')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Default admin user (password: 1234) ──────────────────────────────────────
-- bcrypt hash of '1234' with cost 10
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ממונה בטיחות', 'safety_officer')
ON CONFLICT (username) DO NOTHING;
