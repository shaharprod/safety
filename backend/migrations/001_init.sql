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
  last_training_date DATE
);

CREATE TABLE IF NOT EXISTS safety_hazards (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  supervisor_email VARCHAR(255) NOT NULL,
  supervisor_name VARCHAR(255) NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('Low','Medium','High','Urgent')),
  status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open','In_Progress','Resolved')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_access_logs (
  id SERIAL PRIMARY KEY,
  worker_id INT REFERENCES site_workers(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_status VARCHAR(50) CHECK (access_status IN ('Allowed','Denied_No_Training'))
);
