-- ============================================================
-- RLS Policy Fix: Handle empty/unset session variables
-- current_setting('app.current_branch_id', true) returns '' when unset
-- ''::int crashes. Fix: use NULLIF to convert '' to NULL, then compare.
-- ============================================================

-- ============================================================
-- STRICT TABLES (NOT NULL branch_id) - fix empty cast
-- ============================================================

-- attendance
DROP POLICY IF EXISTS branch_isolation ON attendance;
CREATE POLICY branch_isolation ON attendance FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- dayoff_requests
DROP POLICY IF EXISTS branch_isolation ON dayoff_requests;
CREATE POLICY branch_isolation ON dayoff_requests FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- inventory_items
DROP POLICY IF EXISTS branch_isolation ON inventory_items;
CREATE POLICY branch_isolation ON inventory_items FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- inventory_logs
DROP POLICY IF EXISTS branch_isolation ON inventory_logs;
CREATE POLICY branch_isolation ON inventory_logs FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- payslips
DROP POLICY IF EXISTS branch_isolation ON payslips;
CREATE POLICY branch_isolation ON payslips FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- products
DROP POLICY IF EXISTS branch_isolation ON products;
CREATE POLICY branch_isolation ON products FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- proposals
DROP POLICY IF EXISTS branch_isolation ON proposals;
CREATE POLICY branch_isolation ON proposals FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- sales
DROP POLICY IF EXISTS branch_isolation ON sales;
CREATE POLICY branch_isolation ON sales FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- schedules
DROP POLICY IF EXISTS branch_isolation ON schedules;
CREATE POLICY branch_isolation ON schedules FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- tracking_sheets
DROP POLICY IF EXISTS branch_isolation ON tracking_sheets;
CREATE POLICY branch_isolation ON tracking_sheets FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- ============================================================
-- NULLABLE TABLES (allow NULL branch_id = shared rows)
-- ============================================================

-- announcements
DROP POLICY IF EXISTS branch_isolation ON announcements;
CREATE POLICY branch_isolation ON announcements FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- holidays
DROP POLICY IF EXISTS branch_isolation ON holidays;
CREATE POLICY branch_isolation ON holidays FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- member_transactions
DROP POLICY IF EXISTS branch_isolation ON member_transactions;
CREATE POLICY branch_isolation ON member_transactions FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- members
DROP POLICY IF EXISTS branch_isolation ON members;
CREATE POLICY branch_isolation ON members FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- message_threads
DROP POLICY IF EXISTS branch_isolation ON message_threads;
CREATE POLICY branch_isolation ON message_threads FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- notifications
DROP POLICY IF EXISTS branch_isolation ON notifications;
CREATE POLICY branch_isolation ON notifications FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- pos_reports
DROP POLICY IF EXISTS branch_isolation ON pos_reports;
CREATE POLICY branch_isolation ON pos_reports FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- special_events
DROP POLICY IF EXISTS branch_isolation ON special_events;
CREATE POLICY branch_isolation ON special_events FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- users
DROP POLICY IF EXISTS branch_isolation ON users;
CREATE POLICY branch_isolation ON users FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- DONE
