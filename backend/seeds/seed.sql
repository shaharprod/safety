INSERT INTO subcontractors (company_name, tax_id, contact_phone)
VALUES ('חברת א. ביצוע בע"מ', '510123456', '054-1234567')
ON CONFLICT DO NOTHING;

INSERT INTO site_workers (first_name, last_name, id_number, subcontractor_id, has_height_clearance, last_training_date)
VALUES
  ('משה', 'לוי', '123456789', 1, true,  NOW() - INTERVAL '100 days'),
  ('שרה', 'כהן', '987654321', 1, false, NOW() - INTERVAL '400 days')
ON CONFLICT (id_number) DO NOTHING;
