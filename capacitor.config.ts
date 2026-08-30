import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.organizate.app',
  appName: 'organizate',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: false
    }
  }
};

export default config;
