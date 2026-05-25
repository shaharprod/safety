ALTER TABLE site_workers
  ADD COLUMN IF NOT EXISTS worker_role VARCHAR(30)
    NOT NULL DEFAULT 'worker'
    CHECK (worker_role IN ('worker', 'project_manager', 'safety_officer'));
