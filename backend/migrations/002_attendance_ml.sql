CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  check_in_lat DECIMAL(10,8) NOT NULL,
  check_in_lng DECIMAL(11,8) NOT NULL,
  check_out_lat DECIMAL(10,8),
  check_out_lng DECIMAL(11,8),
  distance_from_office DECIMAL(10,2),
  hours_worked DECIMAL(5,2),
  is_late BOOLEAN DEFAULT FALSE,
  is_manual_edit BOOLEAN DEFAULT FALSE,
  edited_by UUID REFERENCES admins(id),
  edited_at TIMESTAMPTZ,
  edit_reason TEXT,
  device_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'OPEN',
  month_year VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_worker_month ON attendance_records(worker_id, month_year);
CREATE INDEX IF NOT EXISTS idx_attendance_company_month ON attendance_records(company_id, month_year);
CREATE INDEX IF NOT EXISTS idx_attendance_device ON attendance_records(device_id);

CREATE TABLE IF NOT EXISTS fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id),
  company_id UUID REFERENCES companies(id),
  signal_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'HIGH',
  metadata JSONB NOT NULL,
  is_reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES admins(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_worker ON fraud_signals(worker_id);
CREATE INDEX IF NOT EXISTS idx_fraud_company_type ON fraud_signals(company_id, signal_type);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  month_year VARCHAR(7) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_workers INTEGER NOT NULL,
  flagged_count INTEGER DEFAULT 0,
  suspicious_count INTEGER DEFAULT 0,
  verified_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING',
  generated_by UUID REFERENCES admins(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  csv_data JSONB,
  approved_by UUID REFERENCES admins(id),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ghost_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id),
  company_id UUID REFERENCES companies(id),
  trust_score DECIMAL(5,2) NOT NULL,
  anomaly_score DECIMAL(8,6) NOT NULL,
  verdict VARCHAR(20) NOT NULL,
  flag_reasons JSONB NOT NULL,
  feature_values JSONB NOT NULL,
  days_present INTEGER,
  days_absent INTEGER,
  gross_salary DECIMAL(15,2),
  hr_decision VARCHAR(20),
  hr_reviewed_by UUID REFERENCES admins(id),
  hr_reviewed_at TIMESTAMPTZ,
  hr_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_run ON ghost_analysis_results(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_results_verdict ON ghost_analysis_results(payroll_run_id, verdict);

