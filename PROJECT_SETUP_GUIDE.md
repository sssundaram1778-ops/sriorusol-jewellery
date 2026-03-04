# 🏆 Sri Orusol Jeweller - Complete Project Setup Guide

> **Rental Jewels Management System | ஸ்ரீ ஒருசோல் நகை கடை**

A full-stack rental jewellery management application with **Web**, **Desktop (Windows EXE)**, and **Mobile (Android APK)** support.

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Project Structure](#-project-structure)
3. [Prerequisites](#-prerequisites)
4. [Environment Setup](#-environment-setup)
5. [Database Setup (Neon)](#-database-setup-neon)
6. [Local Development](#-local-development)
7. [Web Deployment (Vercel)](#-web-deployment-vercel)
8. [Desktop Build (Windows EXE)](#-desktop-build-windows-exe)
9. [Mobile Build (Android APK)](#-mobile-build-android-apk)
10. [CLI Tools Reference](#-cli-tools-reference)
11. [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TailwindCSS, DaisyUI |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Database** | Neon PostgreSQL (Serverless) |
| **Hosting** | Vercel |
| **Desktop** | Electron |
| **Mobile** | Capacitor (Android) |
| **Languages** | JavaScript (ES Modules), Tamil/English i18n |

---

## 📁 Project Structure

```
Sriorusol-monorepo/
├── apps/
│   └── web/                      # Main application
│       ├── src/                  # React source code
│       │   ├── components/       # UI components
│       │   ├── pages/            # Route pages
│       │   ├── lib/              # Database & utilities
│       │   ├── stores/           # Zustand stores
│       │   └── i18n/             # Translations (Tamil/English)
│       ├── api/                  # Vercel serverless functions
│       ├── electron/             # Electron main process
│       │   ├── main.cjs          # Main electron entry
│       │   └── preload.cjs       # Preload script
│       ├── android/              # Capacitor Android project
│       ├── public/               # Static assets & PWA icons
│       ├── capacitor.config.ts   # Capacitor configuration
│       ├── vite.config.js        # Vite build config
│       ├── .env                  # Environment variables (DO NOT COMMIT)
│       └── .env.example          # Environment template
├── packages/                     # Shared packages (if any)
├── package.json                  # Root monorepo config
└── turbo.json                    # Turborepo config
```

---

## ⚙️ Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Comes with Node.js |
| Git | Latest | https://git-scm.com |
| Java JDK | 17 | For Android builds |

### CLI Tools (Install globally)

```bash
# Vercel CLI
npm install -g vercel

# Neon CLI
npm install -g neonctl

# GitHub CLI (optional)
winget install GitHub.cli
```

---

## 🔐 Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Sriorusol-monorepo.git
cd Sriorusol-monorepo
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Navigate to web app
cd apps/web
npm install
```

### 3. Create Environment File

```bash
# Copy example to create .env
cp .env.example .env
```

### 4. Configure Environment Variables

Edit `apps/web/.env`:

```env
# Neon Database Connection String
VITE_DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

---

## 🗄 Database Setup (Neon)

### Step 1: Create Neon Account

1. Go to https://console.neon.tech
2. Sign up with GitHub/Google
3. Create a new project: **"sriorusol-jeweller"**

### Step 2: Get Connection String

1. In Neon Console, click **"Connect"**
2. Copy the connection string
3. Paste into `.env` file as `VITE_DATABASE_URL`

### Step 3: Initialize Database Schema

Run the SQL schema from `apps/web/neon-setup.sql`:

```sql
-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  id_proof_type VARCHAR(50),
  id_proof_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Jewellery items table
CREATE TABLE IF NOT EXISTS jewellery_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  weight_grams DECIMAL(10,3),
  description TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  rental_date DATE NOT NULL,
  return_date DATE,
  total_amount DECIMAL(10,2),
  advance_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rental items junction table
CREATE TABLE IF NOT EXISTS rental_items (
  id SERIAL PRIMARY KEY,
  rental_id INTEGER REFERENCES rentals(id),
  item_id INTEGER REFERENCES jewellery_items(id),
  rental_price DECIMAL(10,2)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rentals_customer ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rental_items_rental ON rental_items(rental_id);
```

### Step 4: Verify Connection (via Neon CLI)

```bash
# Login to Neon CLI
neonctl auth

# List projects
neonctl projects list

# Test connection
neonctl connection-string --project-id <your-project-id>
```

---

## 💻 Local Development

### Start Development Server

```bash
cd apps/web

# Start Vite dev server
npm run dev
```

**Access:** http://localhost:5173

### Development Features
- ⚡ Hot Module Replacement (HMR)
- 🔄 Real-time database sync
- 🌐 Network accessible (`--host` flag)

---

## 🌐 Web Deployment (Vercel)

### Method 1: Vercel CLI (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy from apps/web directory
cd apps/web
vercel

# For production deployment
vercel --prod
```

### Method 2: Git Integration

1. Push code to GitHub
2. Import project in Vercel Dashboard
3. Set root directory to `apps/web`
4. Add environment variables:
   - `VITE_DATABASE_URL` = your Neon connection string

### Vercel Configuration

`apps/web/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Production URL
After deployment: `https://sriorusol-jeweller.vercel.app`

---

## 🖥 Desktop Build (Windows EXE)

### Prerequisites
- Node.js 18+
- Windows OS (for building Windows executable)

### Build Commands

```bash
cd apps/web

# Build portable EXE (single file, no installation)
npm run electron:build

# Build installer EXE (NSIS installer)
npm run electron:build:installer
```

### Output Location
```
apps/web/electron-dist/
├── SriOrusol-Portable.exe    # Portable version (~85MB)
└── SriOrusol-Setup.exe       # Installer version (if built)
```

### Electron Configuration

`apps/web/electron/main.cjs`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, '../dist/icons/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load Vercel URL for live database
  win.loadURL('https://sriorusol-jeweller.vercel.app');
  
  // Remove menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
```

### How EXE Connects to Database
The EXE loads the **Vercel-hosted website**, which connects to **Neon database** via serverless API. This ensures:
- ✅ Real-time data sync across all platforms
- ✅ No local database installation required
- ✅ Automatic updates when web app is updated

---

## 📱 Mobile Build (Android APK)

### Prerequisites

1. **Java JDK 17** - Required for Android build
2. **Android SDK** - Auto-downloaded by build tools

### Setup Capacitor

```bash
cd apps/web

# Install Capacitor (if not already installed)
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor (already done)
npx cap init "Sri Orusol Jeweller" "com.sriorusol.jeweller" --web-dir=out

# Add Android platform (already done)
npx cap add android
```

### Capacitor Configuration

`apps/web/capacitor.config.ts`:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sriorusol.jeweller',
  appName: 'Sri Orusol Jeweller',
  webDir: 'out',
  server: {
    // Load Vercel URL for live database access
    url: 'https://sriorusol-jeweller.vercel.app',
    cleartext: true
  }
};

export default config;
```

### Build APK

```bash
cd apps/web

# Create web output directory
mkdir out
echo '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>window.location.href="https://sriorusol-jeweller.vercel.app";</script></body></html>' > out/index.html

# Sync Capacitor
npx cap sync android

# Set environment variables (Windows)
$env:ANDROID_HOME = "$env:USERPROFILE\.bubblewrap\android_sdk"
$env:JAVA_HOME = "$env:USERPROFILE\.bubblewrap\jdk\jdk-17.0.11+9"

# Build Debug APK
cd android
.\gradlew.bat assembleDebug --no-daemon

# Build Release APK (signed)
.\gradlew.bat assembleRelease --no-daemon
```

### APK Output Location
```
apps/web/android/app/build/outputs/apk/
├── debug/
│   └── app-debug.apk         # Debug APK (~4MB)
└── release/
    └── app-release.apk       # Release APK (signed)
```

### Install APK on Android
1. Transfer APK to device
2. Enable "Install from unknown sources" in Settings
3. Open APK and install

---

## 🔧 CLI Tools Reference

### Vercel CLI

```bash
# Login
vercel login

# Deploy (preview)
vercel

# Deploy (production)
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Environment variables
vercel env add VITE_DATABASE_URL
vercel env ls
```

### Neon CLI

```bash
# Authentication
neonctl auth

# List projects
neonctl projects list

# Get connection string
neonctl connection-string --project-id <id>

# Execute SQL
neonctl query "SELECT * FROM customers LIMIT 5;" --project-id <id>

# Create branch (for testing)
neonctl branches create --name dev --project-id <id>
```

### GitHub CLI

```bash
# Login
gh auth login

# Clone repo
gh repo clone username/repo

# Create PR
gh pr create --title "Feature" --body "Description"

# View issues
gh issue list
```

### Capacitor CLI

```bash
# Sync web assets to native
npx cap sync

# Open in Android Studio
npx cap open android

# Run on device/emulator
npx cap run android
```

---

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Solution:**
1. Verify `VITE_DATABASE_URL` in `.env`
2. Check Neon project is active (not suspended)
3. Ensure SSL mode is enabled: `?sslmode=require`

### Issue: Electron Build Failed

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules
rm -rf electron-dist
npm install
npm run electron:build
```

### Issue: Android Build - Java Version Error

**Solution:**
Set Java 17 environment:
```bash
$env:JAVA_HOME = "$env:USERPROFILE\.bubblewrap\jdk\jdk-17.0.11+9"
```

### Issue: Android Build - License Not Accepted

**Solution:**
```bash
$env:ANDROID_HOME\tools\bin\sdkmanager.bat --sdk_root=$env:ANDROID_HOME --licenses
# Accept all licenses by typing 'y'
```

### Issue: Gradle Out of Memory

**Solution:**
Edit `apps/web/android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx512m -XX:MaxMetaspaceSize=256m
```

### Issue: Vercel Deployment Failed

**Solution:**
1. Check build logs: `vercel logs <url>`
2. Verify `vercel.json` configuration
3. Ensure all environment variables are set

---

## 📊 Build Outputs Summary

| Platform | Command | Output | Size |
|----------|---------|--------|------|
| **Web** | `npm run build` | `dist/` | ~2MB |
| **Windows EXE** | `npm run electron:build` | `electron-dist/SriOrusol-Portable.exe` | ~85MB |
| **Android APK** | `gradlew assembleDebug` | `android/app/build/outputs/apk/debug/app-debug.apk` | ~4MB |

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| **Production Website** | https://sriorusol-jeweller.vercel.app |
| **Neon Console** | https://console.neon.tech |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **GitHub Repository** | https://github.com/username/Sriorusol-monorepo |

---

## 📝 Quick Commands Cheatsheet

```bash
# ===== LOCAL DEVELOPMENT =====
cd apps/web
npm run dev                    # Start dev server

# ===== WEB DEPLOYMENT =====
vercel --prod                  # Deploy to Vercel

# ===== WINDOWS EXE =====
npm run electron:build         # Build portable EXE

# ===== ANDROID APK =====
npx cap sync android           # Sync web to android
cd android && .\gradlew.bat assembleDebug  # Build APK

# ===== DATABASE =====
neonctl auth                   # Login to Neon
neonctl projects list          # List projects
```

---

## 👥 Contributors

- **Sri Orusol Jeweller** - Business Owner
- **Development Team** - Full Stack Implementation

---

## 📄 License

Private - All rights reserved © 2024 Sri Orusol Jeweller

---

**Last Updated:** March 2026
