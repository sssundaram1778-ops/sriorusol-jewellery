-- =====================================================
-- SRI ORUSOL JEWELLERY - NEON DATABASE SCHEMA
-- Version: 1.0
-- Run this in Neon SQL Editor
-- =====================================================

-- Create pledges table
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
  parent_pledge_id UUID REFERENCES pledges(id) ON DELETE SET NULL,
  parent_pledge_no VARCHAR(20),
  return_pledge_id UUID,
  return_pledge_no VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pledge_amounts table
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

-- Create repledges table
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

-- Create owner_repledges table
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

-- Create financers table
CREATE TABLE IF NOT EXISTS financers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  place VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_date ON pledges(date DESC);
CREATE INDEX IF NOT EXISTS idx_pledges_customer_name ON pledges(customer_name);
CREATE INDEX IF NOT EXISTS idx_pledges_pledge_no ON pledges(pledge_no);
CREATE INDEX IF NOT EXISTS idx_pledge_amounts_pledge_id ON pledge_amounts(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_pledge_id ON owner_repledges(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_financer_name ON owner_repledges(financer_name);

-- Add SAI PIN column to app_settings (for hidden category access)
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS sai_pin_hash VARCHAR(255);
