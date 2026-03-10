import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suss.app',
  appName: 'SUSS',
  webDir: 'out',
  server: {
    // Use Vercel URL for live data
    url: 'https://suss-pledges.vercel.app',
    cleartext: true
  }
};

export default config;
