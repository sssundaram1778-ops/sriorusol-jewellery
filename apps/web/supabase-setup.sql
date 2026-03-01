-- =====================================================
-- SRI ORUSOL JEWELLERY - COMPLETE DATABASE SCHEMA
-- Version: 2.0 (With Row Level Security)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create pledges table (main pledge information)
CREATE TABLE IF NOT EXISTS pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_no VARCHAR(20) UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  place VARCHAR(100),
  customer_name VARCHAR(150) NOT NULL,
  phone_number VARCHAR(20),
  jewels_details TEXT,
  no_of_items INTEGER DEFAULT 1,
  gross_weight DECIMAL(8,3),
  net_weight DECIMAL(8,3),
  jewel_type VARCHAR(10) DEFAULT 'GOLD' CHECK (jewel_type IN ('GOLD', 'SILVER', 'MIXED')),
  interest_rate DECIMAL(5,2) DEFAULT 2.00,
  canceled_date DATE,
  status VARCHAR(15) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'REPLEDGED')),
  -- Parent pledge reference for re-pledge tracking
  parent_pledge_id UUID REFERENCES pledges(id) ON DELETE SET NULL,
  parent_pledge_no VARCHAR(20),
  -- Return pledge reference (when old pledge is continued to new)
  return_pledge_id UUID,
  return_pledge_no VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pledge_amounts table (tracks initial + additional amounts)
CREATE TABLE IF NOT EXISTS pledge_amounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  interest_rate DECIMAL(5,2) NOT NULL,
  amount_type VARCHAR(15) DEFAULT 'INITIAL' CHECK (amount_type IN ('INITIAL', 'ADDITIONAL')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repledges table (transfer to another account)
CREATE TABLE IF NOT EXISTS repledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
  new_pledge_id UUID REFERENCES pledges(id) ON DELETE SET NULL,
  new_customer_name VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  interest_rate DECIMAL(5,2) NOT NULL,
  notes TEXT,
  status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create owner_repledges table (owner-to-financer transactions)
CREATE TABLE IF NOT EXISTS owner_repledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
  financer_name VARCHAR(150) NOT NULL,
  financer_place VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 2.00,
  debt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  release_date DATE,
  status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financers table (master list of financers)
CREATE TABLE IF NOT EXISTS financers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  place VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_date ON pledges(date DESC);
CREATE INDEX IF NOT EXISTS idx_pledges_customer_name ON pledges(customer_name);
CREATE INDEX IF NOT EXISTS idx_pledges_pledge_no ON pledges(pledge_no);

-- Indexes for pledge_amounts
CREATE INDEX IF NOT EXISTS idx_pledge_amounts_pledge_id ON pledge_amounts(pledge_id);
CREATE INDEX IF NOT EXISTS idx_pledge_amounts_date ON pledge_amounts(date DESC);

-- Index for parent pledge reference
CREATE INDEX IF NOT EXISTS idx_pledges_parent_pledge_id ON pledges(parent_pledge_id);

-- Indexes for repledges
CREATE INDEX IF NOT EXISTS idx_repledges_original_pledge_id ON repledges(original_pledge_id);
CREATE INDEX IF NOT EXISTS idx_repledges_status ON repledges(status);

-- Indexes for owner_repledges
CREATE INDEX IF NOT EXISTS idx_owner_repledges_pledge_id ON owner_repledges(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_status ON owner_repledges(status);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_financer_name ON owner_repledges(financer_name);

-- Index for financers
CREATE INDEX IF NOT EXISTS idx_financers_name ON financers(name);

-- Full-text search index for semantic search
CREATE INDEX IF NOT EXISTS idx_pledges_search ON pledges 
USING GIN (to_tsvector('english', customer_name || ' ' || COALESCE(place, '') || ' ' || COALESCE(jewels_details, '')));

-- Enable Row Level Security
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_amounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_repledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE financers ENABLE ROW LEVEL SECURITY;

-- Create policies for pledges (allow all operations for single-user app)
CREATE POLICY "pledges_select" ON pledges FOR SELECT USING (true);
CREATE POLICY "pledges_insert" ON pledges FOR INSERT WITH CHECK (true);
CREATE POLICY "pledges_update" ON pledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "pledges_delete" ON pledges FOR DELETE USING (true);

-- Create policies for pledge_amounts
CREATE POLICY "amounts_select" ON pledge_amounts FOR SELECT USING (true);
CREATE POLICY "amounts_insert" ON pledge_amounts FOR INSERT WITH CHECK (true);
CREATE POLICY "amounts_update" ON pledge_amounts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "amounts_delete" ON pledge_amounts FOR DELETE USING (true);

-- Create policies for repledges
CREATE POLICY "repledges_select" ON repledges FOR SELECT USING (true);
CREATE POLICY "repledges_insert" ON repledges FOR INSERT WITH CHECK (true);
CREATE POLICY "repledges_update" ON repledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "repledges_delete" ON repledges FOR DELETE USING (true);

-- Create policies for owner_repledges
CREATE POLICY "owner_repledges_select" ON owner_repledges FOR SELECT USING (true);
CREATE POLICY "owner_repledges_insert" ON owner_repledges FOR INSERT WITH CHECK (true);
CREATE POLICY "owner_repledges_update" ON owner_repledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "owner_repledges_delete" ON owner_repledges FOR DELETE USING (true);

-- Create policies for financers
CREATE POLICY "financers_select" ON financers FOR SELECT USING (true);
CREATE POLICY "financers_insert" ON financers FOR INSERT WITH CHECK (true);
CREATE POLICY "financers_update" ON financers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "financers_delete" ON financers FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_pledges_updated_at ON pledges;
CREATE TRIGGER update_pledges_updated_at
  BEFORE UPDATE ON pledges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional - comment out for production)
/*
-- Insert sample pledges
INSERT INTO pledges (pledge_no, date, place, customer_name, jewels_details, no_of_items, gross_weight, net_weight, interest_rate, status) VALUES
  ('SRI-2026-0001', '2026-02-01', 'Chennai', 'Lakshmi Devi', 'Gold chain 22K, 2 gold bangles', 3, 28.500, 25.500, 2.00, 'ACTIVE'),
  ('SRI-2026-0002', '2026-02-10', 'Madurai', 'Murugan', 'Gold ring, Gold earrings', 2, 16.000, 15.250, 2.50, 'ACTIVE'),
  ('SRI-2026-0003', '2026-02-05', 'Coimbatore', 'Selvi Ammal', 'Thali chain, Small bangles', 2, 13.500, 12.000, 2.00, 'CLOSED');

-- Insert sample amounts for pledges
INSERT INTO pledge_amounts (pledge_id, amount, date, interest_rate, amount_type) VALUES
  ((SELECT id FROM pledges WHERE pledge_no = 'SRI-2026-0001'), 50000.00, '2026-02-01', 2.00, 'INITIAL'),
  ((SELECT id FROM pledges WHERE pledge_no = 'SRI-2026-0001'), 10000.00, '2026-02-15', 2.00, 'ADDITIONAL'),
  ((SELECT id FROM pledges WHERE pledge_no = 'SRI-2026-0002'), 35000.00, '2026-02-10', 2.50, 'INITIAL'),
  ((SELECT id FROM pledges WHERE pledge_no = 'SRI-2026-0003'), 25000.00, '2026-02-05', 2.00, 'INITIAL');
*/
