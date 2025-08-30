-- Create ENUM types
CREATE TYPE organization_status AS ENUM ('active', 'banned');
CREATE TYPE table_status AS ENUM ('available', 'checked_out', 'maintenance');
CREATE TYPE checkout_status AS ENUM ('active', 'returned', 'overdue');

-- Create organizations table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  official_name VARCHAR(255) UNIQUE NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  status organization_status DEFAULT 'active',
  ban_reason TEXT,
  ban_date TIMESTAMP WITH TIME ZONE,
  scraped_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  table_number VARCHAR(255) UNIQUE NOT NULL,
  status table_status DEFAULT 'available',
  location VARCHAR(255),
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkouts table
CREATE TABLE checkouts (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE ON UPDATE CASCADE,
  checkout_time TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_return_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_return_time TIMESTAMP WITH TIME ZONE,
  status checkout_status DEFAULT 'active',
  notes TEXT,
  checked_out_by VARCHAR(255),
  returned_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO organizations (official_name, aliases, category, status, ban_reason, ban_date) VALUES
('Texas Longhorns Programming Club', ARRAY['TLPC','Programming Club','Texas Programming'], 'Academic', 'active', NULL, NULL),
('Student Government Association', ARRAY['SGA','Student Government'], 'Government', 'active', NULL, NULL),
('Engineering Student Council', ARRAY['ESC','Engineering Council'], 'Academic', 'active', NULL, NULL),
('International Students Association', ARRAY['ISA','International Students'], 'Cultural', 'active', NULL, NULL),
('Texas Kickboxing Club', ARRAY['TKB','Kickboxing','Texas Kickboxing'], 'Sports', 'banned', 'Damaged equipment during last event', '2024-01-15');

INSERT INTO tables (table_number, status, location, capacity) VALUES
('FAC-001', 'available', 'Main Hall', 8),
('FAC-002', 'available', 'Main Hall', 6),
('FAC-003', 'available', 'East Wing', 10),
('FAC-004', 'available', 'West Wing', 4),
('FAC-005', 'available', 'Main Hall', 8);

INSERT INTO checkouts (organization_id, table_id, checkout_time, expected_return_time, status, notes, checked_out_by) VALUES
(1, 1, NOW(), NOW() + INTERVAL '1 day 3 hours', 'active', 'Programming workshop event', 'John Smith'),
(2, 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', 'active', 'Student government meeting', 'Sarah Johnson');

-- Update table status for checked out tables
UPDATE tables SET status = 'checked_out' WHERE id IN (1, 3);