CREATE TABLE IF NOT EXISTS safety_audits (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(50) CHECK (audit_type IN ('work', 'traffic', 'education')),
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
