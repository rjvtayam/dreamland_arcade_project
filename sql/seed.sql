-- Dreamland Arcade - Seed Data
-- Run this after creating the database tables

-- Insert Branches
INSERT INTO branches (name, location, city, phone, is_active) VALUES
('Dreamland Arcade - Main', 'Siniloan, Laguna', 'Siniloan, Laguna', '09171234567', true),
('Dreamland Arcade - Branch', 'Infanta, Quezon', 'Infanta, Quezon', '09181234567', true);

-- Insert Inventory Categories
INSERT INTO inventory_categories (name, description) VALUES
('Arcade Machines', 'Coin-operated arcade machines and parts'),
('Prizes', 'Redeemable prizes and rewards'),
('Supplies', 'General supplies including tokens, tickets, and consumables'),
('Tokens', 'Game tokens and coin mechanisms'),
('Tickets', 'Ticket rolls and dispensing supplies'),
('Maintenance', 'Repair tools and maintenance supplies');

-- Insert default Owner user (PIN: 1234)
-- The PIN hash will be generated at runtime via the API
-- For manual setup, use this pre-hashed value for PIN '1234':
-- bcrypt hash of '1234': $2b$12$LJ3m4ys3Lk0TSwMCPNEPluAINoB6YR4.uSF3GmBrPw0M9LQXyqXaK

-- NOTE: Users should be created via the API after first login
-- This ensures PIN hashing is done correctly

-- Insert Philippine Holidays for 2026
INSERT INTO holidays (name, date, branch_id, is_recurring) VALUES
('New Year''s Day', '2026-01-01', NULL, true),
('People Power Anniversary', '2026-02-25', NULL, true),
('Maundy Thursday', '2026-03-26', NULL, false),
('Good Friday', '2026-03-27', NULL, false),
('Araw ng Kagitingan', '2026-04-09', NULL, true),
('Labor Day', '2026-05-01', NULL, true),
('Independence Day', '2026-06-12', NULL, true),
('Ninoy Aquino Day', '2026-08-21', NULL, true),
('Buwan ng Wika', '2026-08-19', NULL, true),
('National Heroes Day', '2026-08-31', NULL, true),
('Bonifacio Day', '2026-11-30', NULL, true),
('Christmas Day', '2026-12-25', NULL, true),
('Rizal Day', '2026-12-30', NULL, true),
('Last Day of the Year', '2026-12-31', NULL, true);

-- Insert sample products for POS
INSERT INTO products (branch_id, name, category, price, stock, is_active) VALUES
-- Siniloan Branch
(1, '50 Tokens', 'Tokens', 250.00, 500, true),
(1, '100 Tokens', 'Tokens', 500.00, 300, true),
(1, '150 Tokens (+2 Free)', 'Tokens', 750.00, 200, true),
(1, '250 Tokens (+3 Free)', 'Tokens', 1250.00, 100, true),
(1, 'Coca-Cola', 'Drinks', 25.00, 50, true),
(1, 'Pepsi', 'Drinks', 25.00, 50, true),
(1, 'Bottled Water', 'Drinks', 20.00, 100, true),
(1, 'Lays Chips', 'Snacks', 45.00, 30, true),
(1, 'Oishi Prawn Crackers', 'Snacks', 35.00, 40, true),
(1, 'Gummy Bears', 'Snacks', 30.00, 60, true),
(1, 'Plush Toy (Small)', 'Merch', 150.00, 20, true),
(1, 'Plush Toy (Large)', 'Merch', 350.00, 10, true),
(1, 'Keychain', 'Merch', 75.00, 30, true),
(1, 'T-Shirt', 'Merch', 250.00, 15, true),

-- Infanta Branch
(2, '50 Tokens', 'Tokens', 250.00, 500, true),
(2, '100 Tokens', 'Tokens', 500.00, 300, true),
(2, '150 Tokens (+2 Free)', 'Tokens', 750.00, 200, true),
(2, '250 Tokens (+3 Free)', 'Tokens', 1250.00, 100, true),
(2, 'Coca-Cola', 'Drinks', 25.00, 40, true),
(2, 'Pepsi', 'Drinks', 25.00, 40, true),
(2, 'Bottled Water', 'Drinks', 20.00, 80, true),
(2, 'Lays Chips', 'Snacks', 45.00, 25, true),
(2, 'Oishi Prawn Crackers', 'Snacks', 35.00, 35, true),
(2, 'Gummy Bears', 'Snacks', 30.00, 50, true),
(2, 'Plush Toy (Small)', 'Merch', 150.00, 15, true),
(2, 'Plush Toy (Large)', 'Merch', 350.00, 8, true),
(2, 'Keychain', 'Merch', 75.00, 25, true),
(2, 'T-Shirt', 'Merch', 250.00, 10, true);
