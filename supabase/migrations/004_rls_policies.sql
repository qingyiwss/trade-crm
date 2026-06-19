-- TradeCRM: RLS Policies — Allow full CRUD for authenticated users
-- Single-user CRM: all authenticated users get unrestricted access to all tables.

-- ============================================================
-- customers
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;
CREATE POLICY "Allow all for authenticated users" ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- contacts
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON contacts;
CREATE POLICY "Allow all for authenticated users" ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- outreach_log
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON outreach_log;
CREATE POLICY "Allow all for authenticated users" ON outreach_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- smtp_config
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON smtp_config;
CREATE POLICY "Allow all for authenticated users" ON smtp_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- search_tasks
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON search_tasks;
CREATE POLICY "Allow all for authenticated users" ON search_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- email_templates
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON email_templates;
CREATE POLICY "Allow all for authenticated users" ON email_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- followup_sequences
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated users" ON followup_sequences;
CREATE POLICY "Allow all for authenticated users" ON followup_sequences
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
