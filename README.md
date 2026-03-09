# SUSS - Monorepo

A Progressive Web App (PWA) for managing jewellery rental pledges. Built with Turborepo, React, Vite, and TailwindCSS.

## Features

- 📱 **Mobile-First Design** - Optimized for both mobile and desktop
- 🔄 **PWA Support** - Install as native app, offline support
- 🌐 **Multi-language** - i18n support (English, Tamil)
- 💾 **Offline-First** - Works without internet connection
- 🎨 **Modern UI** - DaisyUI + TailwindCSS
- ⚡ **Fast** - Vite for development and production builds

## Apps and Packages

- `apps/web` - Main web application (React + Vite PWA)
- `apps/docs` - Documentation (Next.js)
- `packages/ui` - Shared React component library
- `packages/shared` - Shared utilities
- `packages/eslint-config` - ESLint configurations
- `packages/typescript-config` - TypeScript configurations

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 10

### Installation

```bash
npm install
```

### Development

```bash
# Run all apps
npm run dev

# Run only web app
npm run dev:web
```

### Build

```bash
# Build all apps
npm run build

# Build only web app
npm run build:web
```

### Preview Production Build

```bash
npm run preview
```

## PWA Features

The web app is a fully-featured Progressive Web App:

### Install on Mobile/Desktop
- **Android**: Chrome menu → "Add to Home Screen"
- **iOS**: Safari Share → "Add to Home Screen"
- **Desktop**: Install prompt appears or use browser menu

### Offline Support
- App works offline after first load
- Data is cached locally
- Background sync when online

### Service Worker
- Auto-updates when new version is available
- Caches fonts, assets, and app shell

## Project Structure

```
Sriorusol-monorepo/
├── apps/
│   ├── web/                 # Main PWA application
│   │   ├── public/          # Static assets
│   │   │   ├── icons/       # PWA icons
│   │   │   └── manifest.json
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom hooks (usePWA, useResponsive)
│   │   │   ├── pages/       # Page components
│   │   │   ├── store/       # State management
│   │   │   └── locales/     # i18n translations
│   │   └── vite.config.js   # Vite + PWA config
│   └── docs/
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── eslint-config/
│   └── typescript-config/
├── scripts/
│   └── generate-icons.js    # PWA icon generator
├── turbo.json
└── package.json
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:web` | Start only web app |
| `npm run build` | Build all packages |
| `npm run build:web` | Build only web app |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run generate-icons` | Generate PWA icons |

## Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4 + DaisyUI 5
- **Routing**: React Router 7
- **State**: Zustand
- **i18n**: i18next
- **PWA**: vite-plugin-pwa (Workbox)
- **Monorepo**: Turborepo

## Responsive Design

The app is designed mobile-first with breakpoints:
- **Mobile**: < 640px (Bottom navigation)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px (Sidebar navigation)

## License

Private - All rights reserved
