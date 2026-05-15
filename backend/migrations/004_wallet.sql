-- COMPANY WALLET
-- Tracks each company's GhostGuard balance (their share of GhostGuard's Squad ledger)
CREATE TABLE company_wallet (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  balance_kobo         BIGINT DEFAULT 0,       -- current available balance in kobo
  total_deposited_kobo BIGINT DEFAULT 0,       -- lifetime total deposited
  total_disbursed_kobo BIGINT DEFAULT 0,       -- lifetime total paid out to workers
  last_deposit_at      TIMESTAMPTZ,
  last_disburse_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Create a wallet record for every existing company
INSERT INTO company_wallet (company_id)
SELECT id FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- WALLET TRANSACTIONS
-- Full audit trail of every deposit and disbursement
CREATE TABLE wallet_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID REFERENCES companies(id),
  type                 VARCHAR(20) NOT NULL,   -- DEPOSIT | DISBURSEMENT | REVERSAL
  amount_kobo          BIGINT NOT NULL,
  amount_ngn           DECIMAL(15,2) GENERATED ALWAYS AS (amount_kobo / 100.0) STORED,
  squad_reference      VARCHAR(255) UNIQUE,    -- GhostGuard-generated reference
  squad_tx_id          VARCHAR(255),           -- returned by Squad
  squad_nip_ref        VARCHAR(255),           -- NIP session ID from Squad transfer
  status               VARCHAR(20) DEFAULT 'PENDING',  -- PENDING|SUCCESS|FAILED|REVERSED
  description          TEXT,                   -- human readable: "Payroll Nov 2024 — Worker John Doe"
  worker_id            UUID REFERENCES workers(id),    -- for DISBURSEMENT only
  payroll_run_id       UUID REFERENCES payroll_runs(id), -- for DISBURSEMENT only
  failure_reason       TEXT,
  squad_response       JSONB,                  -- full Squad API response stored for debugging
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_company ON wallet_transactions(company_id);
CREATE INDEX idx_wallet_tx_reference ON wallet_transactions(squad_reference);
CREATE INDEX idx_wallet_tx_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_tx_payroll ON wallet_transactions(payroll_run_id);

-- AUTO-CREATE wallet for new companies (trigger)
CREATE OR REPLACE FUNCTION create_company_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_wallet (company_id) VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_wallet_on_insert
  AFTER INSERT ON companies
  FOR EACH ROW EXECUTE FUNCTION create_company_wallet();