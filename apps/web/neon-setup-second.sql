-- =====================================================
-- SRI ORUSOL JEWELLERY - SECOND CATEGORY DATABASE SCHEMA
-- Version: 2.0 (Optimized - 3 Essential Tables Only)
-- Run this in Neon SQL Editor
-- =====================================================

-- Table 1: pledges_second - Main pledge records
CREATE TABLE IF NOT EXISTS pledges_second (
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
  parent_pledge_id UUID REFERENCES pledges_second(id) ON DELETE SET NULL,
  parent_pledge_no VARCHAR(20),
  return_pledge_id UUID,
  return_pledge_no VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: pledge_amounts_second - Amount records with interest tracking
CREATE TABLE IF NOT EXISTS pledge_amounts_second (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL REFERENCES pledges_second(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  interest_rate DECIMAL(5,2) NOT NULL,
  amount_type VARCHAR(15) DEFAULT 'INITIAL' CHECK (amount_type IN ('INITIAL', 'ADDITIONAL')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: owner_repledges_second - Financer re-pledge tracking
CREATE TABLE IF NOT EXISTS owner_repledges_second (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id UUID NOT NULL REFERENCES pledges_second(id) ON DELETE CASCADE,
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

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_pledges_second_status ON pledges_second(status);
CREATE INDEX IF NOT EXISTS idx_pledges_second_date ON pledges_second(date DESC);
CREATE INDEX IF NOT EXISTS idx_pledges_second_customer_name ON pledges_second(customer_name);
CREATE INDEX IF NOT EXISTS idx_pledges_second_pledge_no ON pledges_second(pledge_no);
CREATE INDEX IF NOT EXISTS idx_pledge_amounts_second_pledge_id ON pledge_amounts_second(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_second_pledge_id ON owner_repledges_second(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_second_financer_name ON owner_repledges_second(financer_name);
