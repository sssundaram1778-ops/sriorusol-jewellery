import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suss.jeweller',
  appName: 'SUSS',
  webDir: 'out',
  server: {
    // Use Vercel URL for live data
    url: 'https://sriorusol-jeweller.vercel.app',
    cleartext: true
  }
};

export default config;
