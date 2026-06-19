-- TradeCRM: SMTP Settings

CREATE TABLE IF NOT EXISTS smtp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL DEFAULT '',
  smtp_password TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT 'Lao Wei',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert exactly one default row so the table always has a row
INSERT INTO smtp_config (id) VALUES (uuid_generate_v4());
