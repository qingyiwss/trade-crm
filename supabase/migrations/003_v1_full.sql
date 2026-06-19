-- TradeCRM: v1.0 — Search Tasks, Email Templates, Follow-up Sequences & Pipeline Fields

-- ============================================================
-- New Tables
-- ============================================================

-- Search tasks for customer development
CREATE TABLE IF NOT EXISTS search_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product TEXT NOT NULL,
  country TEXT,
  status TEXT DEFAULT 'pending',
  results_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default email template
INSERT INTO email_templates (name, subject, body)
VALUES (
  'Introduction',
  'Hello from Cangzhou',
  'Hi {{name}},

I hope this message finds you well. I''m reaching out from Cangzhou — we specialize in high-quality products and would love to explore potential cooperation with your company.

Looking forward to hearing from you.

Best regards,
Lao Wei'
);

-- Auto follow-up sequences
CREATE TABLE IF NOT EXISTS followup_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  days_after INTEGER[] NOT NULL DEFAULT '{3,7,14}',
  template_id UUID REFERENCES email_templates(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default follow-up sequence
INSERT INTO followup_sequences (name, days_after)
VALUES ('Standard', '{3,7,14}');

-- ============================================================
-- Alter Existing Tables
-- ============================================================

-- contacts: add pipeline stage and last contact timestamp
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- outreach_log: add contact-level and template tracking
ALTER TABLE outreach_log
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;

-- customers: add source and starred flag
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_search_tasks_status ON search_tasks(status);
CREATE INDEX IF NOT EXISTS idx_search_tasks_created ON search_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_outreach_log_contact_id ON outreach_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_is_starred ON customers(is_starred);
