import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bingo.platform',
  appName: 'Bingo Ethiopia',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
