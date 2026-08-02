-- RLS on recycle_bin (security fix)
ALTER TABLE recycle_bin ENABLE ROW LEVEL SECURITY;

CREATE POLICY recycle_bin_branch_isolation ON recycle_bin FOR ALL
  USING (
    current_setting('app.current_user_role', true) = 'owner'
    OR branch_id IS NULL
    OR branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::int
  );

-- Critical performance indexes on FK columns
CREATE INDEX IF NOT EXISTS idx_sales_sold_by ON sales(sold_by);
CREATE INDEX IF NOT EXISTS idx_sales_branch_created ON sales(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_id ON attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_clockin ON attendance(user_id, clock_in);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_branch_id ON schedules(branch_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_branch_day ON schedules(user_id, branch_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_payslips_user_id ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_branch_id ON payslips(branch_id);
CREATE INDEX IF NOT EXISTS idx_dayoff_requests_user_id ON dayoff_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dayoff_requests_branch_id ON dayoff_requests(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_item_id ON inventory_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch_id ON inventory_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_member_transactions_member_id ON member_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_transactions_branch_id ON member_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_proposals_branch_id ON proposals(branch_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_pos_reports_branch_id ON pos_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_members_branch_id ON members(branch_id);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_branch_id ON recycle_bin(branch_id);
