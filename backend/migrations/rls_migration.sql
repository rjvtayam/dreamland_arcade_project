-- ============================================================
-- Dreamland Arcade - Row-Level Security (RLS) Migration
-- Branch-level data isolation enforced at the database level
-- ============================================================

-- Owner can see ALL branches. Admin/Employee see only their branch.
-- Tables with nullable branch_id also allow NULL (shared/global rows).

-- Helper: set session vars via: SET app.current_branch_id = '1';
--                               SET app.current_user_role = 'admin';

-- IMPORTANT: NULLIF guards against empty/unset session vars.
-- current_setting('app.current_branch_id', true) returns '' when unset.
-- NULLIF(x, '') converts '' to NULL, preventing ''::int cast errors.

-- ============================================================
-- TABLES WITH NOT NULL branch_id (strict isolation)
-- ============================================================

-- attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON attendance;
CREATE POLICY branch_isolation ON attendance FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- dayoff_requests
ALTER TABLE dayoff_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON dayoff_requests;
CREATE POLICY branch_isolation ON dayoff_requests FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON inventory_items;
CREATE POLICY branch_isolation ON inventory_items FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- inventory_logs
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON inventory_logs;
CREATE POLICY branch_isolation ON inventory_logs FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- payslips
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON payslips;
CREATE POLICY branch_isolation ON payslips FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON products;
CREATE POLICY branch_isolation ON products FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- proposals
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON proposals;
CREATE POLICY branch_isolation ON proposals FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- sales
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON sales;
CREATE POLICY branch_isolation ON sales FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON schedules;
CREATE POLICY branch_isolation ON schedules FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- tracking_sheets
ALTER TABLE tracking_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON tracking_sheets;
CREATE POLICY branch_isolation ON tracking_sheets FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- ============================================================
-- TABLES WITH NULLABLE branch_id (allow NULL = shared rows)
-- ============================================================

-- announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON announcements;
CREATE POLICY branch_isolation ON announcements FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON holidays;
CREATE POLICY branch_isolation ON holidays FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- member_transactions
ALTER TABLE member_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON member_transactions;
CREATE POLICY branch_isolation ON member_transactions FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON members;
CREATE POLICY branch_isolation ON members FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- message_threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON message_threads;
CREATE POLICY branch_isolation ON message_threads FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON notifications;
CREATE POLICY branch_isolation ON notifications FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- pos_reports
ALTER TABLE pos_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON pos_reports;
CREATE POLICY branch_isolation ON pos_reports FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- special_events
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON special_events;
CREATE POLICY branch_isolation ON special_events FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON users;
CREATE POLICY branch_isolation ON users FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- ============================================================
-- GLOBAL TABLES (no branch_id - accessible to all)
-- ============================================================
-- branches, inventory_categories: no RLS needed (global data)
-- ============================================================

-- DONE
