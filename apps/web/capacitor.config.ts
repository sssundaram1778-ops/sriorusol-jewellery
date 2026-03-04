import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sriorusol.jeweller',
  appName: 'Sri Orusol Jeweller',
  webDir: 'out',
  server: {
    // Use Vercel URL for live data
    url: 'https://sriorusol-jeweller.vercel.app',
    cleartext: true
  }
};

export default config;
