CREATE TABLE IF NOT EXISTS hr_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_by UUID REFERENCES admins(id),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES payroll_runs(id),
  worker_id UUID REFERENCES workers(id),
  company_id UUID REFERENCES companies(id),
  squad_tx_id VARCHAR(255),
  squad_reference VARCHAR(255) UNIQUE,
  squad_status VARCHAR(20) DEFAULT 'PENDING',
  gross_salary DECIMAL(15,2) NOT NULL,
  total_deductions DECIMAL(15,2) NOT NULL,
  net_pay DECIMAL(15,2) NOT NULL,
  amount_kobo BIGINT NOT NULL,
  bank_account_number VARCHAR(20) NOT NULL,
  bank_code VARCHAR(10) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  trust_score DECIMAL(5,2),
  verdict VARCHAR(20),
  days_present INTEGER,
  hr_decision VARCHAR(20),
  hr_note TEXT,
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  month_year VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_run ON payment_receipts(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_receipts_worker ON payment_receipts(worker_id);
CREATE INDEX IF NOT EXISTS idx_receipts_squad_ref ON payment_receipts(squad_reference);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON payment_receipts(squad_status);
