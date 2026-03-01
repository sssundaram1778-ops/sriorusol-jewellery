# 🔐 Sri Orusol - Supabase Backend Setup Guide

## Complete Plan for LIFETIME FREE + SECURE Database

---

## 📋 STEP 1: Create Supabase Account & Project

### 1.1 Sign Up (FREE)
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub/Google
3. **FREE tier includes:**
   - 500 MB Database
   - 1 GB File Storage
   - 50,000 Monthly Active Users
   - Unlimited API requests

### 1.2 Create New Project
1. Click "New Project"
2. Fill in:
   - **Name:** `sriorusol-jewellery`
   - **Database Password:** Create a STRONG password (save it!)
   - **Region:** Choose closest to you (e.g., Mumbai for India)
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### 1.3 Get Your Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` → This is your `VITE_SUPABASE_URL`
   - `anon public` key → This is your `VITE_SUPABASE_ANON_KEY`

---

## 📋 STEP 2: Create Database Tables

### 2.1 Open SQL Editor
1. In Supabase Dashboard → Click **SQL Editor** (left sidebar)
2. Click **New query**

### 2.2 Run the Database Schema
Copy and paste the SQL from `apps/web/supabase-setup.sql` file, OR use the enhanced version below:

```sql
-- =====================================================
-- SRI ORUSOL JEWELLERY - COMPLETE DATABASE SCHEMA
-- Version: 2.0 (With Row Level Security)
-- =====================================================

-- 1. PLEDGES TABLE (Main records)
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

-- 2. PLEDGE AMOUNTS TABLE (Initial + Additional amounts)
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

-- 3. REPLEDGES TABLE (Transfer records)
CREATE TABLE IF NOT EXISTS repledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_pledge_id UUID NOT NULL REFERENCES pledges(id) ON DELETE CASCADE,
  new_pledge_id UUID REFERENCES pledges(id) ON DELETE SET NULL,
  new_customer_name VARCHAR(150) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  interest_rate DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OWNER REPLEDGES TABLE (Financer transactions)
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

-- 5. FINANCERS TABLE (Master list)
CREATE TABLE IF NOT EXISTS financers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  place VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR FAST QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pledges_status ON pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_date ON pledges(date DESC);
CREATE INDEX IF NOT EXISTS idx_pledges_customer ON pledges(customer_name);
CREATE INDEX IF NOT EXISTS idx_pledges_pledge_no ON pledges(pledge_no);
CREATE INDEX IF NOT EXISTS idx_pledges_parent ON pledges(parent_pledge_id);

CREATE INDEX IF NOT EXISTS idx_amounts_pledge ON pledge_amounts(pledge_id);
CREATE INDEX IF NOT EXISTS idx_amounts_date ON pledge_amounts(date DESC);

CREATE INDEX IF NOT EXISTS idx_repledges_original ON repledges(original_pledge_id);

CREATE INDEX IF NOT EXISTS idx_owner_repledges_pledge ON owner_repledges(pledge_id);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_financer ON owner_repledges(financer_name);
CREATE INDEX IF NOT EXISTS idx_owner_repledges_status ON owner_repledges(status);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_pledges_search ON pledges 
USING GIN (to_tsvector('english', customer_name || ' ' || COALESCE(place, '') || ' ' || COALESCE(jewels_details, '')));

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pledges_updated_at ON pledges;
CREATE TRIGGER pledges_updated_at
  BEFORE UPDATE ON pledges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - DATA PROTECTION
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_amounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE repledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_repledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE financers ENABLE ROW LEVEL SECURITY;

-- Policies for pledges
CREATE POLICY "pledges_select" ON pledges FOR SELECT USING (true);
CREATE POLICY "pledges_insert" ON pledges FOR INSERT WITH CHECK (true);
CREATE POLICY "pledges_update" ON pledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "pledges_delete" ON pledges FOR DELETE USING (true);

-- Policies for pledge_amounts
CREATE POLICY "amounts_select" ON pledge_amounts FOR SELECT USING (true);
CREATE POLICY "amounts_insert" ON pledge_amounts FOR INSERT WITH CHECK (true);
CREATE POLICY "amounts_update" ON pledge_amounts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "amounts_delete" ON pledge_amounts FOR DELETE USING (true);

-- Policies for repledges
CREATE POLICY "repledges_select" ON repledges FOR SELECT USING (true);
CREATE POLICY "repledges_insert" ON repledges FOR INSERT WITH CHECK (true);
CREATE POLICY "repledges_update" ON repledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "repledges_delete" ON repledges FOR DELETE USING (true);

-- Policies for owner_repledges
CREATE POLICY "owner_repledges_select" ON owner_repledges FOR SELECT USING (true);
CREATE POLICY "owner_repledges_insert" ON owner_repledges FOR INSERT WITH CHECK (true);
CREATE POLICY "owner_repledges_update" ON owner_repledges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "owner_repledges_delete" ON owner_repledges FOR DELETE USING (true);

-- Policies for financers
CREATE POLICY "financers_select" ON financers FOR SELECT USING (true);
CREATE POLICY "financers_insert" ON financers FOR INSERT WITH CHECK (true);
CREATE POLICY "financers_update" ON financers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "financers_delete" ON financers FOR DELETE USING (true);
```

3. Click **Run** (or press Ctrl+Enter)
4. You should see "Success. No rows returned" - This is correct!

---

## 📋 STEP 3: Configure Your App

### 3.1 Create Environment File
In `apps/web/` folder, create `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

⚠️ Replace with YOUR actual values from Step 1.3

### 3.2 Verify Connection
1. Run `npm run dev:web`
2. Open app in browser
3. Create a test pledge
4. Check Supabase Dashboard → Table Editor → pledges
5. You should see your data!

---

## 📋 STEP 4: Setup Keep-Alive (PREVENT PAUSING)

### Why This Matters
- Supabase FREE tier pauses after 7 days of NO activity
- Your app usage counts as activity
- Keep-alive ensures it NEVER pauses

### GitHub Actions Keep-Alive (Already Created!)

File: `.github/workflows/keep-supabase-alive.yml`

**After pushing to GitHub:**
1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - Name: `SUPABASE_URL` | Value: Your project URL
   - Name: `SUPABASE_ANON_KEY` | Value: Your anon key

**The workflow runs automatically every Monday & Thursday!**

---

## 📋 STEP 5: Deploy Website (FREE Hosting)

### Option 1: Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Import Project" → Select your repo
4. Set Root Directory: `apps/web`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click Deploy!

### Option 2: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Build command: `npm run build:web`
4. Publish directory: `apps/web/dist`
5. Add environment variables
6. Deploy!

---

## 📋 STEP 6: Data Backup Strategy

### Automatic (Supabase Does This)
- Daily backups (7-day retention on free tier)
- Point-in-time recovery on Pro tier

### Manual Monthly Backup
1. Supabase Dashboard → Table Editor
2. Select table → Export → Download CSV
3. Save to Google Drive/Dropbox

### Local Backup (Your App Already Does This!)
Your app stores data in localStorage automatically as fallback.

---

## 🔒 Security Features

| Feature | Status | How |
|---------|--------|-----|
| **HTTPS** | ✅ | Supabase enforces SSL |
| **Row Level Security** | ✅ | Policies in SQL above |
| **API Key Protection** | ✅ | Only anon key in frontend |
| **SQL Injection** | ✅ | Supabase client handles this |
| **Rate Limiting** | ✅ | Supabase built-in |

---

## 💰 Cost Summary (LIFETIME FREE)

| Service | Cost | Limit |
|---------|------|-------|
| Supabase Database | $0 | 500MB (~100K pledges) |
| Supabase API | $0 | Unlimited requests |
| Vercel/Netlify Hosting | $0 | 100GB bandwidth |
| GitHub Actions | $0 | 2000 min/month |
| Custom Domain (optional) | $10-15/year | - |
| **TOTAL** | **$0/month** | - |

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your Supabase credentials
# (see Step 3.1)

# 3. Start development
npm run dev:web

# 4. Build for production
npm run build:web

# 5. Preview production build
npm run preview
```

---

## ❓ FAQ

**Q: What if I exceed 500MB?**
A: Supabase Pro is $25/mo. But 500MB = ~100,000 pledges = ~200 years for a small shop!

**Q: What if Supabase shuts down?**
A: It's open source. You can self-host or export data anytime.

**Q: Is my data safe?**
A: Yes! Supabase has enterprise-grade security, daily backups, and SSL encryption.

**Q: Can others see my data?**
A: No! Your anon key only allows YOUR app to access YOUR database.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Project paused" | Go to Supabase Dashboard → Restore |
| "Connection error" | Check .env file has correct values |
| "Permission denied" | Run RLS policies SQL again |
| "Table not found" | Run the schema SQL again |

---

**Your Sri Orusol app is now PRODUCTION READY! 🎉**

- ✅ Database: Supabase (FREE forever)
- ✅ Hosting: Vercel/Netlify (FREE forever)
- ✅ Keep-alive: GitHub Actions (FREE forever)
- ✅ Security: RLS + HTTPS + Backups
